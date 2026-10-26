import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { makeBrowserServerState } from "./server-context.test-harness.js";

const relay = vi.hoisted(() => ({
  artifactsAvailable: true,
  dispose: vi.fn(),
}));
const handlers = vi.hoisted(() => new Set<(reason: unknown) => boolean>());
const stopKnownBrowserProfilesMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("./extension-relay/gateway-relay-route.js", () => {
  if (!relay.artifactsAvailable) {
    throw new Error("installed Gateway extension relay chunk was removed");
  }
  return { disposeGatewayExtensionRelay: relay.dispose };
});

vi.mock("openclaw/plugin-sdk/runtime-env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("openclaw/plugin-sdk/runtime-env")>()),
  registerUnhandledRejectionHandler: vi.fn((handler: (reason: unknown) => boolean) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }),
}));
const { registerUnhandledRejectionHandler } = await import("openclaw/plugin-sdk/runtime-env");

vi.mock("./server-lifecycle.js", () => ({
  stopKnownBrowserProfiles: stopKnownBrowserProfilesMock,
}));

const { createBrowserRuntimeState, stopBrowserRuntime } = await import("./runtime-lifecycle.js");
const { getGatewayExtensionRelayModule } = await import("./extension-relay.runtime.js");
const start = () =>
  createBrowserRuntimeState({ resolved: makeBrowserServerState().resolved, port: 18791 });
const stop = (current: Awaited<ReturnType<typeof start>>, clearState = vi.fn()) =>
  stopBrowserRuntime({ current, clearState, onWarn: vi.fn() });
const dialogRace = () =>
  new Error("Protocol error (Page.handleJavaScriptDialog): No dialog is showing");

beforeEach(() => {
  getGatewayExtensionRelayModule.clear();
  handlers.clear();
  vi.mocked(registerUnhandledRejectionHandler).mockClear();
  stopKnownBrowserProfilesMock.mockClear();
  relay.dispose.mockClear();
});

afterEach(() => {
  relay.artifactsAvailable = true;
});

it.each([false, true])(
  "closes after installation rotation without loading relay code (relay acquired: %s)",
  async (acquired) => {
    const state = await start();
    if (acquired) {
      await getGatewayExtensionRelayModule();
    }
    relay.artifactsAvailable = false;
    const clearState = vi.fn();

    await stop(state, clearState);

    expect(clearState).toHaveBeenCalledOnce();
    expect(relay.dispose).toHaveBeenCalledTimes(acquired ? 1 : 0);
  },
);

const protocolError = (method: string, message = "No dialog is showing") =>
  Object.assign(new Error(message), { method });
it.each([
  [Object.assign(dialogRace(), { method: "Page.handleJavaScriptDialog" }), true],
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
  expect([...handlers][0]?.(error)).toBe(handled);
  await stop(state);
});

it("registers during startup and unregisters during shutdown", async () => {
  stopKnownBrowserProfilesMock.mockImplementationOnce(async () => {
    expect(handlers.size).toBe(1);
  });
  const state = await start();

  expect(registerUnhandledRejectionHandler).toHaveBeenCalledTimes(1);
  expect(handlers.size).toBe(1);
  expect([...handlers][0]?.(dialogRace())).toBe(true);

  const clearState = vi.fn();
  await stop(state, clearState);

  expect(stopKnownBrowserProfilesMock).toHaveBeenCalledTimes(1);
  expect(clearState).toHaveBeenCalledTimes(1);
  expect([...handlers]).toStrictEqual([]);
});
