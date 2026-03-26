export interface StartRunParams {
  /** Agent configuration */
  agentId: string;
  /** Workspace context */
  workspaceId: string;
  /** Input data for the run */
  input: Record<string, unknown>;
  /** MCP bindings available to the agent */
  mcpBindings?: string[];
  /** Additional configuration */
  config?: Record<string, unknown>;
}

export interface ResumeInput {
  /** Human decision or input */
  decision?: 'approve' | 'reject';
  /** Additional data from the human */
  data?: Record<string, unknown>;
  /** The approval ID that triggered the resume */
  approvalId?: string;
}

export interface HandoffParams {
  /** Target agent to hand off to */
  targetAgentId: string;
  /** Data to pass to the target agent */
  context: Record<string, unknown>;
  /** Reason for handoff */
  reason: string;
}

export interface ApprovalRequest {
  /** What is being requested */
  title: string;
  description: string;
  /** The action that triggered the approval */
  action: string;
  /** Additional context for the approver */
  context: Record<string, unknown>;
}

export interface Artifact {
  type: string;
  name: string;
  mimeType: string;
  content?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}
