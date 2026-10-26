import { createHash } from "node:crypto";
import { isRecord } from "@openclaw/normalization-core/record-coerce";
import { stableStringify } from "@openclaw/normalization-core/stable-stringify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayClientInfo } from "../../../packages/gateway-protocol/src/client-info.js";
import { createDeferred, withinTest } from "../../../test/helpers/promise.js";
import { observeHostDataSql } from "../../../test/helpers/sqlite-statement-execution-counter.js";
import { seedCanonicalAcpSessionMeta } from "../../acp/runtime/session-meta-fixture.test-support.js";
import * as acpReads from "../../acp/runtime/session-meta-readonly.js";
import type { dispatchInboundMessage } from "../../auto-reply/dispatch.js";
import {
  listSessionPendingInputs,
  loadSessionEntry,
  loadTranscriptEventsSync,
  patchSessionEntryCore,
  replaceSessionEntrySync,
} from "../../config/sessions/session-accessor.js";
import {
  resolveSqliteScope,
  toDatabaseOptions,
} from "../../config/sessions/session-accessor.sqlite-scope.js";
import { rotateAgentEventLifecycleGeneration } from "../../infra/agent-events.js";
import { initializeGlobalHookRunner } from "../../plugins/hook-runner-global.js";
import { captureCurrentReplyMessageInjectionTarget } from "../../sessions/session-controller.message-injection.js";
import { isSessionRunActiveForKey } from "../../sessions/session-controller.queries.js";
import {
  isRpcSourceActive,
  isRpcSourceQueued,
  requestRpcSourceCancellation,
  type RpcSourceRef,
} from "../../sessions/session-controller.rpc-sources.js";
import { rpcSourceTesting } from "../../sessions/session-lifecycle-admission.test-support.js";
import {
  createUserTurnTranscriptRecorder,
  type UserTurnTranscriptRecorder,
} from "../../sessions/user-turn-transcript.js";
import { openOpenClawAgentDatabase } from "../../state/openclaw-agent-db.js";
import { ensureProfileForEmail } from "../../state/user-profiles.js";
import { useUserProfileCatalogForTest } from "../../test-utils/user-profile-catalog.js";
import { refusePendingInputCommit } from "../pending-input-commit.test-support.js";
import { dispatchInboundMessageMock, installGatewayTestHooks } from "../test-helpers.js";
import { getTestPluginRegistry } from "../test-helpers.plugin-registry.js";
import { createWorkerSessionPlacementStore } from "../worker-environments/placement-store.js";
import { registerChatHistoryDeliveryCases } from "./chat-send-history-delivery.test-support.js";
import {
  setClientProfile,
  useBrowserFollowupFixture,
} from "./chat-send-pending-inputs.test-support.js";
import type { RespondFn } from "./types.js";
installGatewayTestHooks();
const createBrowserFollowupFixture = useBrowserFollowupFixture();
const prepareProfileCatalog = useUserProfileCatalogForTest();
beforeEach(() => prepareProfileCatalog());

function expectStarted(respond: RespondFn, payload: Record<string, unknown> = {}) {
  expect(respond).toHaveBeenCalledWith(
    true,
    expect.objectContaining({ status: "started", ...payload }),
    undefined,
    expect.anything(),
  );
}

type FollowupFixture = Awaited<ReturnType<typeof createBrowserFollowupFixture>>;
const pending = (fixture: FollowupFixture) => listSessionPendingInputs(fixture.scope);
function expectNotStarted(respond: RespondFn) {
  expect(respond).toHaveBeenCalledOnce();
  expect(respond).not.toHaveBeenCalledWith(
    true,
    expect.objectContaining({ status: "started" }),
    undefined,
    expect.anything(),
  );
}
async function expectUncommitted(fixture: FollowupFixture) {
  expect(await pending(fixture)).toEqual({ items: [], total: 0 });
  expect(fixture.readTranscript()).toEqual(fixture.activeTranscript);
}
function expectInFlight(respond: RespondFn, runId: string) {
  expect(respond).toHaveBeenCalledWith(
    true,
    expect.objectContaining({ runId, status: "in_flight" }),
    undefined,
    expect.objectContaining({ cached: true }),
  );
}
function holdResumedDispatch() {
  const recorder = createDeferred<UserTurnTranscriptRecorder>();
  const release = createDeferred();
  dispatchInboundMessageMock.mockImplementation(async (options: unknown) => {
    const { replyOptions } = options as Parameters<typeof dispatchInboundMessage>[0];
    if (replyOptions?.userTurnTranscriptRecorder) {
      recorder.resolve(replyOptions.userTurnTranscriptRecorder);
    }
    await release.promise;
    return {};
  });
  return { recorder: recorder.promise, release: () => release.resolve() };
}
function expectNoPlacementQueries(queries: string[]) {
  expect(queries.filter((query) => /\bworker_session_placements\b/u.test(query))).toEqual([]);
}
async function admitPending(fixture: FollowupFixture) {
  expectStarted(await fixture.send());
  const recorder = await fixture.dispatchedRecorder;
  const { items, total } = await pending(fixture);
  expect(total).toBe(1);
  expect(items[0]).toBeDefined();
  return { recorder, original: items[0] };
}

describe("ordinary chat input admission", () => {
  it("retains pending-input custody while retrying a transient post-ACK projection failure", async () => {
    await using fixture = await createBrowserFollowupFixture({ transientProjectionFailures: 1 });
    const ack = await fixture.send();
    expectStarted(ack);
    await vi.waitFor(() => expect(dispatchInboundMessageMock).toHaveBeenCalledTimes(2));
    const accepted = await pending(fixture);
    const reconnect = await fixture.send();
    expectInFlight(reconnect, fixture.params.idempotencyKey);
    expect(dispatchInboundMessageMock).toHaveBeenCalledTimes(2);
    expect(await pending(fixture)).toMatchObject({
      total: 1,
      items: [{ state: "queued", runId: fixture.params.idempotencyKey }],
    });
    expect(await pending(fixture)).toEqual(accepted);
    expect(fixture.beforeApprove).toHaveBeenCalledOnce();
    expect(fixture.readTranscript()).toEqual(fixture.activeTranscript);
    expect(fixture.context.removeChatRun).not.toHaveBeenCalled();
    expect(fixture.context.broadcast).not.toHaveBeenCalledWith(
      "chat",
      expect.objectContaining({ runId: fixture.params.idempotencyKey, state: "error" }),
      expect.anything(),
    );
  });

  it.each([
    { id: "openclaw-control-ui", mode: "webchat", displayName: "Web", storage: "durable" },
    { id: "cli", mode: "cli", displayName: "CLI", storage: "durable" },
    { id: "openclaw-macos", mode: "ui", displayName: "macOS", storage: "durable" },
    { id: "gateway-client", mode: "backend", displayName: "Automation", storage: "durable" },
    { id: "openclaw-control-ui", mode: "webchat", displayName: "Web", storage: "memory" },
  ] satisfies Array<
    Pick<GatewayClientInfo, "id" | "mode" | "displayName"> & {
      storage: "durable" | "memory";
    }
  >)(
    "stages the approved $id $storage follow-up and its source before ACK without changing the active transcript",
    async ({ storage, ...clientInfo }) => {
      await using fixture = await createBrowserFollowupFixture({ storage });
      fixture.client.connect.client = { ...fixture.client.connect.client, ...clientInfo };
      fixture.params.queueMode = "followup";
      const profile = ensureProfileForEmail("alice@example.test");
      setClientProfile(fixture.client, { ...profile, updatedAt: 1 }, "Alice");
      const clone = vi.spyOn(globalThis, "structuredClone");
      const { scope, params, context, approvedContent, activeTranscript } = fixture;
      const readPending = () =>
        Promise.allSettled([listSessionPendingInputs(scope)]).then(([result]) => result);
      let transcriptAtAck: ReturnType<typeof loadTranscriptEventsSync> | undefined;
      let pendingAtAck: ReturnType<typeof readPending> | undefined;
      let pendingAtNotification: ReturnType<typeof readPending> | undefined;
      context.getSessionEventSubscriberConnIds = () => new Set(["observer"]);
      vi.spyOn(context, "broadcastToConnIds").mockImplementation((event, payload) => {
        if (event === "sessions.changed" && isRecord(payload) && payload.reason === "send") {
          pendingAtNotification = readPending();
        }
      });
      const respond = vi.fn<RespondFn>((ok) => {
        if (ok) {
          transcriptAtAck = fixture.readTranscript();
          pendingAtAck = readPending();
        }
      });
      try {
        expect(isSessionRunActiveForKey(scope.sessionKey)).toBe(true);
        expect(captureCurrentReplyMessageInjectionTarget(scope.sessionKey)).toBeUndefined();
        await fixture.send(respond);
        expectStarted(respond, { runId: params.idempotencyKey });
        expect(respond.mock.calls[0]?.[1]).not.toHaveProperty("messageSeq");
        expect(transcriptAtAck).toEqual(activeTranscript);
        const provenance = {
          senderIdentity: { type: "profile", id: profile.id },
          transport: { clients: [clientInfo] },
        };
        const expectedInput = {
          state: "queued",
          runId: params.idempotencyKey,
          message: {
            role: "user",
            content: approvedContent,
            idempotencyKey: `${params.idempotencyKey}:user`,
            __openclaw: { senderId: profile.id, ...provenance },
          },
        };
        expect(await pendingAtAck).toMatchObject({
          status: "fulfilled",
          value: { total: 1, items: [expectedInput] },
        });
        expect(await pendingAtNotification).toEqual(await pendingAtAck);
        const recorder = await fixture.dispatchedRecorder;
        const committed = await recorder.persistApproved();
        expect(committed?.message["__openclaw"]).toMatchObject(provenance);
        // Initial resolution detaches the store; custody needs only the current target binding.
        expect(
          clone.mock.calls.filter(
            ([entry]) => isRecord(entry) && entry.sessionId === "unrelated-browser-session",
          ).length,
        ).toBeLessThanOrEqual(1);
      } finally {
        clone.mockRestore();
        await Promise.allSettled([pendingAtAck, pendingAtNotification]);
      }
    },
  );

  it.each([{ acp: false }, { acp: true }, { acp: true, restart: true }])(
    "keeps idle input custody with its runtime (%j)",
    async ({ acp, restart }) => {
      await using fixture = await createBrowserFollowupFixture({ active: false });
      if (acp) {
        seedCanonicalAcpSessionMeta({
          sessionKey: fixture.scope.sessionKey,
          sessionId: fixture.scope.sessionId,
          meta: {
            backend: "acpx",
            agent: "main",
            runtimeSessionName: "idle-custody",
            mode: "persistent",
            state: "idle",
            lastActivityAt: 1,
          },
        });
      }
      const clone = vi.spyOn(globalThis, "structuredClone");
      const sql = observeHostDataSql();
      const read = acpReads.readAcpSessionMetaForEntries;
      const restarting = restart
        ? vi
            .spyOn(acpReads, "readAcpSessionMetaForEntries")
            .mockImplementationOnce(async (...args) => {
              const result = await read(...args);
              rotateAgentEventLifecycleGeneration();
              return result;
            })
        : undefined;
      let transcriptAtAck: ReturnType<typeof loadTranscriptEventsSync> | undefined;
      const respond = vi.fn<RespondFn>((ok) => {
        if (ok) {
          transcriptAtAck = loadTranscriptEventsSync(fixture.scope);
        }
      });
      try {
        await fixture.send(respond);
        expectNoPlacementQueries(sql.queries);
        if (restart) {
          expectNotStarted(respond);
          expect(dispatchInboundMessageMock).not.toHaveBeenCalled();
          await expectUncommitted(fixture);
          return;
        }
        expectStarted(respond, acp ? {} : { messageSeq: 2 });
        if (acp) {
          expect(transcriptAtAck).toEqual(fixture.activeTranscript);
          expect(await pending(fixture)).toMatchObject({ total: 1 });
          expect(loadSessionEntry(fixture.scope)).not.toHaveProperty("acp");
        } else {
          expect(transcriptAtAck).toHaveLength(fixture.activeTranscript.length + 1);
          expect(transcriptAtAck?.at(-1)).toMatchObject({
            message: {
              role: "user",
              content: fixture.params.message,
              idempotencyKey: `${fixture.params.idempotencyKey}:user`,
            },
          });
          expect(await pending(fixture)).toEqual({ items: [], total: 0 });
        }
        expect(
          clone.mock.calls.filter(
            ([entry]) => isRecord(entry) && entry.sessionId === "unrelated-browser-session",
          ).length,
        ).toBeLessThanOrEqual(1);
      } finally {
        sql.restore();
        restarting?.mockRestore();
        clone.mockRestore();
      }
    },
  );

  it.each(["worker-turn", "remote-exec"] as const)(
    "holds an idle %s browser input in custody while its workspace is syncing",
    async (executionMode) => {
      await using fixture = await createBrowserFollowupFixture({ active: false });
      const placements = createWorkerSessionPlacementStore();
      const requested = await placements.startDispatch({ ...fixture.scope, executionMode });
      const provisioning = await placements.transition({
        sessionId: fixture.scope.sessionId,
        from: "requested",
        to: "provisioning",
        expectedGeneration: requested.generation,
        patch: { environmentId: "setup-environment" },
      });
      await placements.transition({
        sessionId: fixture.scope.sessionId,
        from: "provisioning",
        to: "syncing",
        expectedGeneration: provisioning.generation,
        patch: { workerBundleHash: "a".repeat(64) },
      });
      fixture.context.workerSessionPlacementService = placements;
      const sql = observeHostDataSql();
      try {
        const respond = await fixture.send();
        expectNoPlacementQueries(sql.queries);
        expectStarted(respond);
        expect(respond.mock.calls[0]?.[1]).not.toHaveProperty("messageSeq");
        expect(fixture.readTranscript()).toEqual(fixture.activeTranscript);
        expect(await pending(fixture)).toMatchObject({
          total: 1,
          items: [{ state: "queued", runId: fixture.params.idempotencyKey }],
        });
      } finally {
        sql.restore();
      }
    },
  );

  it("retries a failed custody write with the same request identity without acknowledging lost input", async () => {
    const fixture = await createBrowserFollowupFixture();
    let rejectedInput: RpcSourceRef["input"] | undefined;
    fixture.beforeApprove.mockImplementation(() => {
      rejectedInput = rpcSourceTesting.get(fixture.params.idempotencyKey)?.input;
    });
    const refusal = refusePendingInputCommit({
      operation: "stage",
      message: "custody unavailable",
      sessionId: fixture.scope.sessionId,
      runId: fixture.params.idempotencyKey,
    });

    try {
      const rejected = await fixture.send();
      expect(rejected).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ status: "error" }),
        expect.objectContaining({ message: expect.stringContaining("custody unavailable") }),
        expect.anything(),
      );
      expect(dispatchInboundMessageMock).not.toHaveBeenCalled();
      await expectUncommitted(fixture);
      expect(rpcSourceTesting.has(fixture.params.idempotencyKey)).toBe(false);
      if (!rejectedInput) {
        throw new Error("Expected the rejected RPC source input");
      }
      await rejectedInput.settlement.promise;

      refusal.mockRestore();
      expectStarted(await fixture.send(), { runId: fixture.params.idempotencyKey });
      expect(await listSessionPendingInputs(fixture.scope)).toMatchObject({
        total: 1,
        items: [{ state: "queued", message: { content: fixture.approvedContent } }],
      });
      expect(loadTranscriptEventsSync(fixture.scope)).toEqual(fixture.activeTranscript);
    } finally {
      refusal.mockRestore();
      await fixture.cleanup();
    }
  });

  it.each(["cancellation", "lifecycle rotation", "session replacement", "session access"] as const)(
    "revalidates %s after message approval before committing custody",
    async (change) => {
      await using fixture = await createBrowserFollowupFixture();
      if (change === "session access") {
        setClientProfile(
          fixture.client,
          ensureProfileForEmail("pending-input-caller@example.test"),
        );
        fixture.client.connect.scopes = ["operator.read", "operator.write"];
        await patchSessionEntryCore(fixture.scope, () => ({
          createdActor: { type: "human", source: "profile", id: "another-profile" },
          visibility: "shared",
        }));
      }
      fixture.beforeApprove.mockImplementation(() => {
        if (change === "lifecycle rotation") {
          rotateAgentEventLifecycleGeneration();
          return;
        }
        if (change === "session replacement" || change === "session access") {
          const current = loadSessionEntry(fixture.scope);
          if (!current) {
            throw new Error("Expected the session to exist before input approval");
          }
          replaceSessionEntrySync(
            fixture.scope,
            change === "session replacement"
              ? { sessionId: "successor-session", updatedAt: Date.now() }
              : { ...current, visibility: "draft" },
          );
          return;
        }
        const active = rpcSourceTesting.get(fixture.params.idempotencyKey);
        if (!active) {
          throw new Error("Expected the browser admission to own its cancellation controller");
        }
        // Approval runs after asynchronous source preparation. Its cancellation
        // must hit the already reserved physical input, not an ACK-time facade.
        expect(active.input.mailbox.owner.target).toMatchObject({
          storeScope: fixture.scope.storePath,
          sessionKey: fixture.scope.sessionKey,
          incarnation: fixture.scope.sessionId,
        });
        expect(active.input.protocolRunId).toBe(fixture.params.idempotencyKey);
        expect(isRpcSourceActive(active)).toBe(false);
        expect(isRpcSourceQueued(active)).toBe(true);
        active.adapter.abortStopReason = "rpc";
        requestRpcSourceCancellation(active);
      });
      const respond = await fixture.send(undefined, change === "session access" ? {} : undefined);
      expect(fixture.beforeApprove).toHaveBeenCalledOnce();
      expectNotStarted(respond);
      expect(dispatchInboundMessageMock).not.toHaveBeenCalled();
      await expectUncommitted(fixture);
      if (change === "session replacement") {
        expect(loadSessionEntry(fixture.scope)?.sessionId).toBe("successor-session");
        expect(
          loadTranscriptEventsSync({ ...fixture.scope, sessionId: "successor-session" }),
        ).toEqual([]);
      }
      expect(rpcSourceTesting.has(fixture.params.idempotencyKey)).toBe(false);
    },
  );

  it.each([
    { disposition: "consumed", recordedClient: true, legacy: false },
    ...["consumed", "changed-payload", "interrupted"].flatMap((disposition) =>
      [false, true].map((recordedClient) => ({ disposition, recordedClient, legacy: true })),
    ),
  ])(
    "preserves collected-input replay without adopting old custody ($disposition, legacy=$legacy, recordedClient=$recordedClient)",
    async ({ disposition, recordedClient, legacy }) => {
      await using fixture = await createBrowserFollowupFixture({ preserveContent: legacy });
      if (legacy) {
        setClientProfile(
          fixture.client,
          { ...ensureProfileForEmail("legacy-input@example.test"), updatedAt: 1 },
          "Legacy input author",
        );
      }
      const { recorder: source } = await admitPending(fixture);
      const message = source.getPendingInputMessage?.();
      if (!message) {
        throw new Error("Expected the approved original source before collection");
      }
      if (disposition !== "interrupted") {
        const aggregate = createUserTurnTranscriptRecorder({
          input: {
            text: "Collected follow-up already accepted for execution.",
            idempotencyKey: "legacy-collected-follow-up:user",
            timestamp: Date.now(),
          },
          pendingInputSources: [source],
          target: () => ({
            ...fixture.scope,
            sessionEntry: loadSessionEntry(fixture.scope),
            expectedSessionId: fixture.scope.sessionId,
          }),
        });
        await aggregate.persistApproved();
      }
      const transcript = fixture.readTranscript();
      if (disposition !== "interrupted") {
        expect(transcript).toHaveLength(fixture.activeTranscript.length + 1);
        expect(await pending(fixture)).toEqual({ items: [], total: 0 });
      }
      if (legacy) {
        rotateAgentEventLifecycleGeneration();
      }
      await fixture.finishDispatch();
      await patchSessionEntryCore(fixture.scope, () => ({ status: "done" }));
      if (!legacy) {
        const registry = getTestPluginRegistry();
        registry.typedHooks = registry.typedHooks.filter(
          (hook) => hook.pluginId !== "approved-input-fixture",
        );
        initializeGlobalHookRunner(registry);
      }
      if (legacy) {
        const legacyMessage = structuredClone(message);
        // Legacy receipts predate the admitted request identity.
        delete legacyMessage["__openclaw"]?.chatRequestIdentity;
        delete legacyMessage["__openclaw"]?.requesterOrigin;
        if (!recordedClient) {
          // Shipped Gateway receipts predate transport.clients. Seed only after
          // collection, whose live owner still requires its exact accepted bytes.
          delete legacyMessage["__openclaw"]?.transport;
        }
        const { timestamp: _timestamp, ...stableMessage } = legacyMessage;
        const legacyHash = createHash("sha256")
          .update(stableStringify(stableMessage))
          .digest("hex");
        const database = openOpenClawAgentDatabase(
          toDatabaseOptions(resolveSqliteScope(fixture.scope)),
        );
        const seeded = database.db
          .prepare(
            "UPDATE session_pending_inputs SET request_hash = ?, message_json = ? WHERE session_key = ? AND session_id = ? AND run_id = ?",
          )
          .run(
            legacyHash,
            JSON.stringify(legacyMessage),
            fixture.scope.sessionKey,
            fixture.scope.sessionId,
            fixture.params.idempotencyKey,
          );
        expect(seeded.changes).toBe(1);
      }
      fixture.context.dedupe.clear();
      dispatchInboundMessageMock.mockClear();
      if (disposition === "changed-payload") {
        fixture.params.message += " Changed request.";
      }

      const retried = await fixture.send();
      if (disposition === "consumed") {
        expect(retried).toHaveBeenCalledWith(
          true,
          { runId: fixture.params.idempotencyKey, status: "ok" },
          undefined,
          expect.objectContaining({ cached: true }),
        );
      } else {
        expect(retried.mock.calls[0]?.[0]).toBe(false);
      }
      expect(dispatchInboundMessageMock).not.toHaveBeenCalled();
      expect(fixture.beforeApprove).toHaveBeenCalledOnce();
      expect(fixture.readTranscript()).toEqual(transcript);
      expect((await pending(fixture)).total).toBe(disposition === "interrupted" ? 1 : 0);
    },
  );

  it.for([
    { restart: true, attachment: false },
    { restart: true, attachment: true },
    { restart: false, attachment: false },
  ])(
    "re-admits interrupted input under its original identity (%j)",
    async ({ restart, attachment }, { signal }) => {
      await using fixture = await createBrowserFollowupFixture({ preserveContent: true });
      let resumedDispatch: ReturnType<typeof holdResumedDispatch> | undefined;
      const profile = ensureProfileForEmail("restart-input@example.test");
      setClientProfile(fixture.client, { ...profile, updatedAt: 1 }, "Input author");
      if (restart && !attachment) {
        delete fixture.params.sessionId;
      }
      if (attachment) {
        fixture.params.attachments = [
          {
            type: "file",
            mimeType: "text/plain",
            fileName: "review.txt",
            content: Buffer.from("Keep these exact attachment bytes.").toString("base64"),
          },
        ];
      }
      try {
        const { recorder: originalRecorder, original } = await admitPending(fixture);
        if (restart) {
          rotateAgentEventLifecycleGeneration();
        } else {
          originalRecorder.finishPendingInput?.("interrupted");
          await originalRecorder.waitForPendingInputSettlement?.();
        }
        await fixture.finishDispatch();
        expect((await pending(fixture)).items).toEqual([{ ...original, state: "interrupted" }]);
        expect(fixture.readTranscript()).toEqual(fixture.activeTranscript);
        fixture.context.dedupe.clear();
        await patchSessionEntryCore(fixture.scope, () => ({ status: "done" }));
        if (restart) {
          // Exercise the browser reconnect envelope through request normalization.
          Object.assign(fixture.params, {
            sessionId: fixture.scope.sessionId,
            __controlUiReconnectResume: true,
          });
        } else {
          dispatchInboundMessageMock.mockReset();
        }
        resumedDispatch = holdResumedDispatch();
        const ack = await fixture.send();
        expectStarted(ack, { runId: fixture.params.idempotencyKey });
        const resumed = await withinTest(resumedDispatch.recorder, signal);
        expect((await pending(fixture)).items).toEqual([{ ...original, state: "queued" }]);
        if (restart) {
          expect(() => originalRecorder.withPendingInput?.(() => {})).toThrow("ownership ended");
        } else {
          expectInFlight(await fixture.send(), fixture.params.idempotencyKey);
          expect(dispatchInboundMessageMock).toHaveBeenCalledOnce();
        }
        const committed = await resumed.persistApproved();
        expect(committed).toMatchObject({ appended: true, messageId: original?.id });
        expect(committed?.message).toEqual(original?.message);
        expect(fixture.beforeApprove).toHaveBeenCalledOnce();
        if (!restart) {
          await resumed.persistApproved();
          expect(fixture.readTranscript()).toHaveLength(fixture.activeTranscript.length + 1);
        }
        expect((await pending(fixture)).items).toEqual([]);
      } finally {
        resumedDispatch?.release();
      }
    },
  );

  registerChatHistoryDeliveryCases(createBrowserFollowupFixture);
});
