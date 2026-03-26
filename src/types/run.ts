export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface RunHandle {
  runId: string;
  status: RunStatus;
}

export interface RunState {
  runId: string;
  status: RunStatus;
  checkpoint?: Record<string, unknown>;
  pendingApprovals: string[];
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  artifacts: ArtifactRef[];
}

export interface ArtifactRef {
  id: string;
  type: string;
  name: string;
}
