import type { SessionPendingInputOwner } from "./session-pending-input-owner.types.js";
import type { SessionPendingInputWorkerFacts } from "./session-pending-input.types.js";

/** Worker snapshots contain admitted facts; live authority remains with the host owner. */
export function snapshotSessionPendingInputOwner(
  current: SessionPendingInputOwner,
): SessionPendingInputWorkerFacts {
  return {
    agentId: current.agentId,
    databaseAgentId: current.databaseAgentId,
    inputId: current.inputId,
    transcriptInputId: current.transcriptInputId,
    sessionId: current.sessionId,
    sessionKey: current.sessionKey,
    databasePath: current.workerDatabasePath,
    idempotencyKey: current.idempotencyKey,
    lifecycleGeneration: current.lifecycleGeneration,
    messageJson: current.messageJson,
    mentionInvitation: current.mentionInvitation,
    preparedAuthority:
      current.authority || current.sources?.some((source) => source.authority) ? true : undefined,
    ...(current.sources ? { sources: current.sources.map(snapshotSessionPendingInputOwner) } : {}),
  };
}
