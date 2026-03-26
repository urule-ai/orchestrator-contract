# @urule/orchestrator-contract

Standard interface for AI orchestration adapters -- define once, swap implementations freely.

Part of the [Urule](https://github.com/urule-os/urule) ecosystem.

## Features

- **`OrchestratorAdapter` interface** with methods for the full agent run lifecycle: start, pause, resume, cancel, state, artifacts, and handoff
- **Capability flags** so consumers can feature-detect what an adapter supports (checkpoints, streaming, human-in-the-loop, subgraphs, etc.)
- **Compliance test suite** -- run `runComplianceSuite()` against any adapter to verify it implements the contract correctly
- **Mock adapter** for testing consumers without a real orchestrator
- **Dual exports**: `@urule/orchestrator-contract` for types and interface, `@urule/orchestrator-contract/testing` for test helpers
- Zero runtime dependencies beyond `ulid`

## Quick Start

```bash
npm install @urule/orchestrator-contract
```

### Implement the interface

```ts
import type { OrchestratorAdapter, StartRunParams, RunHandle } from '@urule/orchestrator-contract';

export class MyAdapter implements OrchestratorAdapter {
  async startRun(params: StartRunParams): Promise<RunHandle> {
    // Connect to your orchestrator
  }

  async pauseForApproval(runId: string, approval: ApprovalRequest): Promise<void> { /* ... */ }
  async resumeRun(runId: string, input: ResumeInput): Promise<void> { /* ... */ }
  async cancelRun(runId: string, reason: string): Promise<void> { /* ... */ }
  async getState(runId: string): Promise<RunState> { /* ... */ }
  async emitArtifact(runId: string, artifact: Artifact): Promise<void> { /* ... */ }
  async handoffAgent(runId: string, params: HandoffParams): Promise<void> { /* ... */ }

  getCapabilities() {
    return {
      durableCheckpoints: true,
      humanInTheLoop: true,
      subgraphs: false,
      streaming: true,
      artifactEmission: true,
      cancellation: true,
      resumability: true,
    };
  }
}
```

### Test your adapter

```ts
import { runComplianceSuite } from '@urule/orchestrator-contract/testing';
import { describe, it, expect } from 'vitest';
import { MyAdapter } from './my-adapter.js';

runComplianceSuite(() => new MyAdapter(), { describe, it, expect });
```

### Use the mock for consumer tests

```ts
import { MockOrchestratorAdapter } from '@urule/orchestrator-contract/testing';

const adapter = new MockOrchestratorAdapter();
const handle = await adapter.startRun({ agentId: 'a1', workspaceId: 'ws1', input: {} });
adapter.completeRun(handle.runId, { result: 'done' });
```

## API

### Interface: `OrchestratorAdapter`

| Method | Description |
|---|---|
| `startRun(params)` | Start a new agent run, returns `RunHandle` |
| `pauseForApproval(runId, approval)` | Pause a run for human approval |
| `resumeRun(runId, input)` | Resume a paused run with human input |
| `cancelRun(runId, reason)` | Cancel a running or paused run |
| `getState(runId)` | Get current `RunState` including status, artifacts, pending approvals |
| `emitArtifact(runId, artifact)` | Attach an artifact (file, URL, content) to a run |
| `handoffAgent(runId, params)` | Hand off execution to another agent within the same run |
| `getCapabilities()` | Return `OrchestratorCapabilities` flags |

### Key Types

| Type | Description |
|---|---|
| `RunHandle` | `{ runId, status }` returned when starting a run |
| `RunState` | Full state: status, checkpoint, pending approvals, artifacts, timestamps |
| `RunStatus` | `'pending' \| 'running' \| 'paused' \| 'completed' \| 'failed' \| 'cancelled'` |
| `StartRunParams` | `{ agentId, workspaceId, input, mcpBindings?, config? }` |
| `OrchestratorCapabilities` | Boolean flags for `durableCheckpoints`, `humanInTheLoop`, `subgraphs`, `streaming`, `artifactEmission`, `cancellation`, `resumability` |
| `ApprovalRequest` | `{ title, description, action, context }` |
| `Artifact` | `{ type, name, mimeType, content?, url?, metadata? }` |

## How to Implement an Adapter

1. Install this package as a dependency
2. Create a class that implements `OrchestratorAdapter`
3. Map your orchestrator's lifecycle to the standard methods (start, pause, resume, cancel)
4. Declare capabilities honestly via `getCapabilities()`
5. Run the compliance suite in your test file to validate correctness
6. Publish and register with the Urule ecosystem

See [`@urule/langgraph-adapter`](https://github.com/urule-os/langgraph-adapter) for a reference implementation.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

Apache-2.0
