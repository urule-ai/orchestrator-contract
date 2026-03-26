import { describe, it, expect } from 'vitest';
import { MockOrchestratorAdapter } from '../src/testing/mock-adapter.js';

describe('MockOrchestratorAdapter', () => {
  it('starts a run and returns handle', async () => {
    const adapter = new MockOrchestratorAdapter();
    const handle = await adapter.startRun({
      agentId: 'agent-1',
      workspaceId: 'ws-1',
      input: { message: 'hello' },
    });
    expect(handle.runId).toBeDefined();
    expect(handle.status).toBe('running');
  });

  it('full lifecycle: start -> pause -> resume -> complete', async () => {
    const adapter = new MockOrchestratorAdapter();

    // Start
    const handle = await adapter.startRun({
      agentId: 'agent-1',
      workspaceId: 'ws-1',
      input: {},
    });
    expect((await adapter.getState(handle.runId)).status).toBe('running');

    // Pause for approval
    await adapter.pauseForApproval(handle.runId, {
      title: 'Send email?',
      description: 'Agent wants to send an email',
      action: 'send-email',
      context: { to: 'user@example.com' },
    });
    const pausedState = await adapter.getState(handle.runId);
    expect(pausedState.status).toBe('paused');
    expect(pausedState.pendingApprovals.length).toBe(1);

    // Resume
    await adapter.resumeRun(handle.runId, { decision: 'approve' });
    expect((await adapter.getState(handle.runId)).status).toBe('running');

    // Emit artifact
    await adapter.emitArtifact(handle.runId, {
      type: 'file',
      name: 'report.pdf',
      mimeType: 'application/pdf',
    });
    expect((await adapter.getState(handle.runId)).artifacts.length).toBe(1);

    // Complete
    adapter.completeRun(handle.runId, { result: 'done' });
    const completedState = await adapter.getState(handle.runId);
    expect(completedState.status).toBe('completed');
    expect(completedState.output).toEqual({ result: 'done' });
    expect(completedState.completedAt).toBeDefined();
  });

  it('cancel stops the run', async () => {
    const adapter = new MockOrchestratorAdapter();
    const handle = await adapter.startRun({
      agentId: 'agent-1',
      workspaceId: 'ws-1',
      input: {},
    });
    await adapter.cancelRun(handle.runId, 'no longer needed');
    expect((await adapter.getState(handle.runId)).status).toBe('cancelled');
  });

  it('fail records error', async () => {
    const adapter = new MockOrchestratorAdapter();
    const handle = await adapter.startRun({
      agentId: 'agent-1',
      workspaceId: 'ws-1',
      input: {},
    });
    adapter.failRun(handle.runId, 'timeout');
    const state = await adapter.getState(handle.runId);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('timeout');
  });

  it('throws when resuming a non-paused run', async () => {
    const adapter = new MockOrchestratorAdapter();
    const handle = await adapter.startRun({
      agentId: 'agent-1',
      workspaceId: 'ws-1',
      input: {},
    });
    await expect(
      adapter.resumeRun(handle.runId, { decision: 'approve' }),
    ).rejects.toThrow('Cannot resume');
  });

  it('reports capabilities', () => {
    const adapter = new MockOrchestratorAdapter();
    const caps = adapter.getCapabilities();
    expect(caps.humanInTheLoop).toBe(true);
    expect(caps.cancellation).toBe(true);
    expect(caps.artifactEmission).toBe(true);
  });
});
