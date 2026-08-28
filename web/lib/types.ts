export type Domain = 'sql' | 'python' | 'math' | 'nl' | 'other';

export type ElicitationMode = 'sql-editor' | 'code-cell' | 'derivation' | 'free-text' | 'choice';

export type NodeKind = 'goal' | 'subgoal' | 'operator' | 'evidence' | 'error' | 'hypothesis' | 'dead-end';

export type NodeStatus = 'candidate' | 'active' | 'confirmed' | 'pruned' | 'dormant';

export type EdgeRelation = 'elaborates' | 'depends-on' | 'revises' | 'contradicts' | 'repairs' | 'abandons';

export type Channel = 'query' | 'edit' | 'submit' | 'error' | 'hint' | 'choice' | 'reset' | 'narrate';

export type UserRole = 'student' | 'instructor' | 'researcher';

export interface Scene {
  id: string;
  order: number;
  title: string;
  narration: string;
  goal: string;
  goldNodeIds: string[];
  elicitationMode: ElicitationMode;
  hints?: string[];
}

export interface ConsensusNode {
  id: string;
  label: string;
  content: string;
  kind: NodeKind;
  status: NodeStatus;
  embeddingRef?: string;
  sourceInteractionId?: string;
  goldMatchId?: string | null;
  deltaPi?: number | null;
  dStepFromParent?: number | null;
  hintUsed?: boolean;
}

export interface ConsensusEdge {
  from: string;
  to: string;
  relation: EdgeRelation;
}

export interface ConsensusGraph {
  learnerId: string;
  taskId: string;
  sessionId: string;
  nodes: ConsensusNode[];
  edges: ConsensusEdge[];
  rootId: string;
  version: number;
  prunedNodeIds: string[];
  activePath: string[];
}

export interface Task {
  id: string;
  slug: string;
  title: string;
  domain: Domain;
  brief: string;
  scenes: Scene[];
  goldTree: ConsensusGraph;
  starterState: {
    schemaSql?: string;
    seedSql?: string;
    initialQuery?: string;
  };
}

export interface Interaction {
  id: string;
  at: string;
  sessionId: string;
  learnerId: string;
  sceneId: string;
  channel: Channel;
  payload: string;
  result?: string;
  derivedThought: string;
}

export interface TrajectoryMetrics {
  d_align: number;
  mean_d_step: number;
  d_trajectory: number;
  progress_final: number;
  delta_pi: number[];
  matched_indices: number[];
  dropped_indices: number[];
  flags: ('off_path' | 'large_jump' | 'productive_struggle' | 'dropped_outlier' | 'unexpected_next_step')[];
  expected_next_index?: number;
  expected_next_node?: string;
  delta_next?: number;
}
