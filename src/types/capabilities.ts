export interface OrchestratorCapabilities {
  /** Supports saving/restoring checkpoints across restarts */
  durableCheckpoints: boolean;
  /** Supports pausing for human approval/input */
  humanInTheLoop: boolean;
  /** Supports nested subgraphs/subflows */
  subgraphs: boolean;
  /** Supports streaming output */
  streaming: boolean;
  /** Supports emitting named artifacts during a run */
  artifactEmission: boolean;
  /** Supports cancelling in-progress runs */
  cancellation: boolean;
  /** Supports resuming from checkpoints after failures */
  resumability: boolean;
}
