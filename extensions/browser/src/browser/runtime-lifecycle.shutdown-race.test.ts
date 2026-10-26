import { createDeferred } from "openclaw/plugin-sdk/extension-shared";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { RunningChrome } from "./chrome.js";
import {
  makeBrowserProfile,
  makeBrowserServerState,
  mockLaunchedChrome,
} from "./server-context.test-harness.js";
import * as serverLifecycle from "./server-lifecycle.js";

const mocks = vi.hoisted(() => ({
  chunksRemoved: false,
  relayRemoved: false,
  disposeRelay: vi.fn(),
  handlers: new Set<(reason: unknown) => boolean>(),
  closeChromeMcpSession: vi.fn(async () => false),
  stopOpenClawChrome: vi.fn(async (_running: RunningChrome) => {}),
}));
vi.mock("openclaw/plugin-sdk/runtime-env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("openclaw/plugin-sdk/runtime-env")>()),
  registerUnhandledRejectionHandler: vi.fn((handler: (reason: unknown) => boolean) => {
    mocks.handlers.add(handler);
    return () => {
      mocks.handlers.delete(handler);
    };
  }),
}));
// mock-isolation: emulate removed installation chunks without loading a real Gateway relay.
vi.mock("./extension-relay/gateway-relay-route.js", () => {
  if (mocks.relayRemoved) {
    throw new Error("installed Gateway extension relay chunk was removed");
  }
  return { disposeGatewayExtensionRelay: mocks.disposeRelay };
});

// mock-isolation: shutdown races use synthetic Chrome handles, not native browser processes.
vi.mock("./chrome.js", () => ({ stopOpenClawChrome: mocks.stopOpenClawChrome }));

// mock-isolation: simulate a removed installed chunk without importing the real MCP client.
vi.mock("./chrome-mcp.js", () => {
  if (mocks.chunksRemoved) {
    throw new Error("installed Chrome MCP chunk was removed");
  }
  return { closeChromeMcpSession: mocks.closeChromeMcpSession };
});

vi.mock("./pw-ai-module.js", () => ({
  getLoadedPwAiModule: () => null,
  getPwAiModule: async () => null,
}));

const { createBrowserRuntimeState, stopBrowserBridgeRuntime, stopBrowserRuntime } =
  await import("./runtime-lifecycle.js");
const { getGatewayExtensionRelayModule } = await import("./extension-relay.runtime.js");
const { registerUnhandledRejectionHandler } = await import("openclaw/plugin-sdk/runtime-env");
const { getChromeMcpModule } = await import("./chrome-mcp.runtime.js");
const {
  enqueueProfileStart,
  getProfileLifecycle,
  getOrCreateProfileRuntime,
  registerProfileHandle,
} = await import("./server-context.lifecycle.js");

beforeEach(() => {
  getChromeMcpModule.clear();
  getGatewayExtensionRelayModule.clear();
  mocks.handlers.clear();
  vi.clearAllMocks();
  mocks.chunksRemoved = false;
  mocks.relayRemoved = false;
});
afterEach(() => {
  vi.restoreAllMocks();
  mocks.chunksRemoved = false;
  mocks.relayRemoved = false;
});

const start = () =>
  createBrowserRuntimeState({ resolved: makeBrowserServerState().resolved, port: 18791 });
const stop = (current: Awaited<ReturnType<typeof start>>, clearState = vi.fn()) =>
  stopBrowserRuntime({ current, clearState, onWarn: vi.fn() });
const protocolError = (method: string, message = "No dialog is showing") =>
  Object.assign(new Error(message), { method });

it.each([false, true])(
  "closes after installation rotation (relay acquired: %s)",
  async (acquired) => {
    const profile = makeBrowserProfile({ name: "user", driver: "existing-session" });
    const state = makeBrowserServerState({ profile });
    getOrCreateProfileRuntime(state, profile);
    if (acquired) {
      await getGatewayExtensionRelayModule();
    }
    mocks.chunksRemoved = true;
    mocks.relayRemoved = true;
    const clearState = vi.fn();
    await stop(state, clearState);
    expect(clearState).toHaveBeenCalledOnce();
    expect(mocks.closeChromeMcpSession).not.toHaveBeenCalled();
    expect(mocks.disposeRelay).toHaveBeenCalledTimes(acquired ? 1 : 0);
  },
);

it.each([
  [protocolError("Page.handleJavaScriptDialog"), true],
  [new Error("Protocol error (Page.handleJavaScriptDialog): No dialog is showing"), true],
  [
    new Error("browser action failed", { cause: protocolError("Page.handleJavaScriptDialog") }),
    true,
  ],
  [
    { error: new Error("Protocol error (Dialog.handleJavaScriptDialog): No dialog is showing") },
    true,
  ],
  [protocolError("Page.navigate"), false],
  [new Error("Protocol error (Page.handleJavaScriptDialog): Target closed"), false],
  [new Error("No dialog is showing"), false],
] as const)("classifies Playwright rejection %#", async (error, handled) => {
  const state = await start();
  expect([...mocks.handlers][0]?.(error)).toBe(handled);
  await stop(state);
});

it("retains the rejection handler through profile drain and removes it at shutdown", async () => {
  vi.spyOn(serverLifecycle, "stopKnownBrowserProfiles").mockImplementationOnce(async () => {
    expect(mocks.handlers.size).toBe(1);
  });
  const state = await start();
  expect(registerUnhandledRejectionHandler).toHaveBeenCalledOnce();
  expect(mocks.handlers.size).toBe(1);
  await stop(state);
  expect([...mocks.handlers]).toEqual([]);
});

it("invalidates every deferred start before draining late children and clearing state", async () => {
  const profiles = ["alpha", "beta"].map((name, i) =>
    makeBrowserProfile({ name, cdpPort: 18_801 + i }),
  );
  const state = makeBrowserServerState({
    resolvedOverrides: {
      profiles: Object.fromEntries(profiles.map((profile) => [profile.name, profile])),
    },
  });
  const runtimes = profiles.map((profile) => getOrCreateProfileRuntime(state, profile));
  const launches = profiles.map(() => createDeferred<RunningChrome>());
  const entered = profiles.map(() => createDeferred<AbortSignal>());
  const starts = runtimes.map((runtime, index) =>
    enqueueProfileStart({
      state,
      runtime,
      key: "default",
      run: async (signal) => {
        entered[index]?.resolve(signal);
        const running = await launches[index]!.promise;
        registerProfileHandle(runtime, running);
        signal.throwIfAborted();
        runtime.running = running;
      },
    }),
  );
  const startSignals = await Promise.all(entered.map((gate) => gate.promise));
  const children = [1, 2].map((pid) => mockLaunchedChrome(vi.fn(), pid));
  const clearState = vi.fn(() => {
    for (const runtime of runtimes) {
      expect({
        running: runtime.running,
        handles: getProfileLifecycle(runtime).handles.size,
      }).toEqual({ running: null, handles: 0 });
    }
  });

  const stopping = stopBrowserBridgeRuntime({ current: state, clearState, onWarn: vi.fn() });

  expect(startSignals.map((signal) => signal.aborted)).toEqual([true, true]);
  expect(() =>
    enqueueProfileStart({
      state,
      runtime: runtimes[0]!,
      key: "after-shutdown",
      run: async () => {},
    }),
  ).toThrow("Browser runtime is stopping");
  expect(clearState).not.toHaveBeenCalled();

  launches.forEach((launch, index) => launch.resolve(children[index]!));
  await Promise.all(
    starts.map(async (pending) => await expect(pending).rejects.toThrow(/lifecycle changed/i)),
  );
  await expect(stopping).resolves.toBeUndefined();

  expect(mocks.stopOpenClawChrome.mock.calls.map(([running]) => running)).toEqual(children);
  expect(mocks.closeChromeMcpSession).not.toHaveBeenCalled();
  expect(clearState).toHaveBeenCalledTimes(1);
});
