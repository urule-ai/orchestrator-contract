import type { OrchestratorCapabilities } from './types/capabilities.js';
import type { ApprovalRequest, Artifact, HandoffParams, ResumeInput, StartRunParams } from './types/params.js';
import type { RunHandle, RunState } from './types/run.js';

/**
 * The core contract that all orchestrator adapters must implement.
 *
 * Adapters normalize lifecycle and artifacts — they do NOT hide
 * all orchestrator-specific features. Expose a common core,
 * plus optional capability flags.
 */
export interface OrchestratorAdapter {
  /** Start a new agent run */
  startRun(params: StartRunParams): Promise<RunHandle>;

  /** Pause a run for human approval */
  pauseForApproval(runId: string, approval: ApprovalRequest): Promise<void>;

  /** Resume a paused run with human input */
  resumeRun(runId: string, input: ResumeInput): Promise<void>;

  /** Cancel a run */
  cancelRun(runId: string, reason: string): Promise<void>;

  /** Get the current state of a run */
  getState(runId: string): Promise<RunState>;

  /** Emit an artifact from a run */
  emitArtifact(runId: string, artifact: Artifact): Promise<void>;

  /** Hand off from one agent to another within a run */
  handoffAgent(runId: string, params: HandoffParams): Promise<void>;

  /** Declare what this orchestrator supports */
  getCapabilities(): OrchestratorCapabilities;
}
