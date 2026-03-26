import type { OrchestratorAdapter } from '../adapter.js';

/**
 * Compliance test suite that any OrchestratorAdapter implementation
 * can run to verify it correctly implements the contract.
 *
 * Usage in adapter test files:
 * ```typescript
 * import { runComplianceSuite } from '@urule/orchestrator-contract/testing';
 * import { MyAdapter } from './my-adapter.js';
 *
 * runComplianceSuite(() => new MyAdapter());
 * ```
 */
export function runComplianceSuite(
  createAdapter: () => OrchestratorAdapter,
  testFn: {
    describe: (name: string, fn: () => void) => void;
    it: (name: string, fn: () => Promise<void>) => void;
    expect: (value: unknown) => { toBe: (expected: unknown) => void; toBeDefined: () => void; toBeGreaterThan: (n: number) => void; toThrow: () => void };
  },
): void {
  const { describe, it, expect } = testFn;

  describe('OrchestratorAdapter Compliance', () => {
    it('startRun returns a RunHandle with running status', async () => {
      const adapter = createAdapter();
      const handle = await adapter.startRun({
        agentId: 'agent-1',
        workspaceId: 'ws-1',
        input: { message: 'hello' },
      });
      expect(handle.runId).toBeDefined();
      expect(handle.status).toBe('running');
    });

    it('getState returns running state after start', async () => {
      const adapter = createAdapter();
      const handle = await adapter.startRun({
        agentId: 'agent-1',
        workspaceId: 'ws-1',
        input: {},
      });
      const state = await adapter.getState(handle.runId);
      expect(state.status).toBe('running');
      expect(state.runId).toBe(handle.runId);
    });

    it('pauseForApproval changes state to paused', async () => {
      const adapter = createAdapter();
      const handle = await adapter.startRun({
        agentId: 'agent-1',
        workspaceId: 'ws-1',
        input: {},
      });
      await adapter.pauseForApproval(handle.runId, {
        title: 'Approve email',
        description: 'Agent wants to send an email',
        action: 'send-email',
        context: {},
      });
      const state = await adapter.getState(handle.runId);
      expect(state.status).toBe('paused');
      expect(state.pendingApprovals.length).toBeGreaterThan(0);
    });

    it('resumeRun changes state back to running', async () => {
      const adapter = createAdapter();
      const handle = await adapter.startRun({
        agentId: 'agent-1',
        workspaceId: 'ws-1',
        input: {},
      });
      await adapter.pauseForApproval(handle.runId, {
        title: 'Approve',
        description: 'Test',
        action: 'test',
        context: {},
      });
      await adapter.resumeRun(handle.runId, { decision: 'approve' });
      const state = await adapter.getState(handle.runId);
      expect(state.status).toBe('running');
    });

    it('cancelRun changes state to cancelled', async () => {
      const adapter = createAdapter();
      const handle = await adapter.startRun({
        agentId: 'agent-1',
        workspaceId: 'ws-1',
        input: {},
      });
      await adapter.cancelRun(handle.runId, 'user requested');
      const state = await adapter.getState(handle.runId);
      expect(state.status).toBe('cancelled');
    });

    it('emitArtifact adds artifact to run state', async () => {
      const adapter = createAdapter();
      const handle = await adapter.startRun({
        agentId: 'agent-1',
        workspaceId: 'ws-1',
        input: {},
      });
      await adapter.emitArtifact(handle.runId, {
        type: 'file',
        name: 'report.pdf',
        mimeType: 'application/pdf',
        content: 'base64content',
      });
      const state = await adapter.getState(handle.runId);
      expect(state.artifacts.length).toBeGreaterThan(0);
    });

    it('getCapabilities returns capability flags', async () => {
      const adapter = createAdapter();
      const caps = adapter.getCapabilities();
      expect(caps.humanInTheLoop).toBeDefined();
      expect(caps.cancellation).toBeDefined();
    });
  });
}
