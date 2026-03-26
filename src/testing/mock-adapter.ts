import { ulid } from 'ulid';
import type { OrchestratorAdapter } from '../adapter.js';
import type { OrchestratorCapabilities } from '../types/capabilities.js';
import type { ApprovalRequest, Artifact, HandoffParams, ResumeInput, StartRunParams } from '../types/params.js';
import type { ArtifactRef, RunHandle, RunState, RunStatus } from '../types/run.js';

interface MockRun {
  runId: string;
  status: RunStatus;
  params: StartRunParams;
  pendingApprovals: string[];
  artifacts: ArtifactRef[];
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

/**
 * In-memory mock implementation of OrchestratorAdapter.
 * Useful for testing consumers of the orchestrator contract.
 */
export class MockOrchestratorAdapter implements OrchestratorAdapter {
  private runs = new Map<string, MockRun>();

  async startRun(params: StartRunParams): Promise<RunHandle> {
    const runId = ulid();
    this.runs.set(runId, {
      runId,
      status: 'running',
      params,
      pendingApprovals: [],
      artifacts: [],
      startedAt: new Date().toISOString(),
    });
    return { runId, status: 'running' };
  }

  async pauseForApproval(runId: string, approval: ApprovalRequest): Promise<void> {
    const run = this.getRun(runId);
    run.status = 'paused';
    const approvalId = ulid();
    run.pendingApprovals.push(approvalId);
  }

  async resumeRun(runId: string, _input: ResumeInput): Promise<void> {
    const run = this.getRun(runId);
    if (run.status !== 'paused') {
      throw new Error(`Cannot resume run ${runId}: status is ${run.status}`);
    }
    run.status = 'running';
    run.pendingApprovals = [];
  }

  async cancelRun(runId: string, _reason: string): Promise<void> {
    const run = this.getRun(runId);
    run.status = 'cancelled';
    run.completedAt = new Date().toISOString();
  }

  async getState(runId: string): Promise<RunState> {
    const run = this.getRun(runId);
    return {
      runId: run.runId,
      status: run.status,
      pendingApprovals: run.pendingApprovals,
      artifacts: run.artifacts,
      output: run.output,
      error: run.error,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    };
  }

  async emitArtifact(runId: string, artifact: Artifact): Promise<void> {
    const run = this.getRun(runId);
    run.artifacts.push({
      id: ulid(),
      type: artifact.type,
      name: artifact.name,
    });
  }

  async handoffAgent(runId: string, _params: HandoffParams): Promise<void> {
    const run = this.getRun(runId);
    if (run.status !== 'running') {
      throw new Error(`Cannot handoff run ${runId}: status is ${run.status}`);
    }
  }

  getCapabilities(): OrchestratorCapabilities {
    return {
      durableCheckpoints: false,
      humanInTheLoop: true,
      subgraphs: false,
      streaming: false,
      artifactEmission: true,
      cancellation: true,
      resumability: true,
    };
  }

  /** Test helper: complete a run */
  completeRun(runId: string, output?: Record<string, unknown>): void {
    const run = this.getRun(runId);
    run.status = 'completed';
    run.output = output;
    run.completedAt = new Date().toISOString();
  }

  /** Test helper: fail a run */
  failRun(runId: string, error: string): void {
    const run = this.getRun(runId);
    run.status = 'failed';
    run.error = error;
    run.completedAt = new Date().toISOString();
  }

  private getRun(runId: string): MockRun {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }
    return run;
  }
}
