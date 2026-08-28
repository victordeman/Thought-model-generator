import { ConsensusGraph, ConsensusNode, ConsensusEdge, Interaction, TrajectoryMetrics, NodeKind, NodeStatus } from './types';
import { embed, cosineSimilarity } from './embeddingUtils';

export function prune(
  currentGraph: ConsensusGraph,
  goldTree: ConsensusGraph,
  interaction: Interaction,
  metrics?: Partial<TrajectoryMetrics>
): {
  graph: ConsensusGraph;
  newNode: ConsensusNode;
  sceneDelta: boolean;
} {
  const thoughtText = interaction.derivedThought;
  const thoughtVec = embed(thoughtText);

  let kind: NodeKind = 'operator';
  if (interaction.channel === 'error') {
    kind = 'error';
  } else if (interaction.channel === 'hint') {
    kind = 'hypothesis';
  } else if (/Declare Schema/i.test(thoughtText)) {
    kind = 'subgoal';
  } else if (/Insert Data/i.test(thoughtText)) {
    kind = 'evidence';
  }

  const rootNode = currentGraph.nodes.find((n) => n.id === currentGraph.rootId) || currentGraph.nodes[0];
  let bestParent = rootNode;

  if (kind !== 'subgoal') {
    const candidateParents = currentGraph.nodes.filter(
      (n) => n.status === 'confirmed' || n.status === 'active'
    );
    let maxSim = -1.0;
    for (const parent of candidateParents) {
      const pVec = embed(parent.content);
      const sim = cosineSimilarity(thoughtVec, pVec);
      if (sim > maxSim) {
        maxSim = sim;
        bestParent = parent;
      }
    }
  }

  const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  let status: NodeStatus = interaction.channel === 'error' ? 'active' : 'confirmed';

  // Mark dead-end if explicitly dropped as outlier and not an error or valid schema step
  const lastIndex = metrics?.delta_pi ? metrics.delta_pi.length - 1 : -1;
  const isDropped = lastIndex >= 0 && metrics?.dropped_indices?.includes(lastIndex);
  if (isDropped && interaction.channel !== 'error' && kind !== 'subgoal') {
    status = 'dead-end' as any;
  }

  const pVec = embed(bestParent.content);
  const simWithParent = cosineSimilarity(thoughtVec, pVec);

  const newNode: ConsensusNode = {
    id: newNodeId,
    label: interaction.channel === 'error' ? 'Syntax/Runtime Error' : `Thought ${currentGraph.nodes.length + 1}`,
    content: thoughtText,
    kind,
    status,
    sourceInteractionId: interaction.id,
    deltaPi: metrics?.delta_pi ? metrics.delta_pi[metrics.delta_pi.length - 1] : 0.0,
    dStepFromParent: simWithParent >= 0 ? 1.0 - simWithParent : 0.0,
    hintUsed: interaction.channel === 'hint'
  };

  const updatedNodes = [...currentGraph.nodes, newNode];
  const updatedEdges: ConsensusEdge[] = [
    ...currentGraph.edges,
    {
      from: bestParent.id,
      to: newNodeId,
      relation: kind === 'error' ? 'contradicts' : 'elaborates'
    }
  ];

  const prunedNodeIds = [...currentGraph.prunedNodeIds];

  // Rule 1: Repairs error node
  if (kind !== 'error') {
    for (let i = 0; i < updatedNodes.length; i++) {
      if (updatedNodes[i].kind === 'error' && updatedNodes[i].status !== 'dormant' && updatedNodes[i].status !== 'pruned') {
        updatedNodes[i] = { ...updatedNodes[i], status: 'dormant' };
        updatedEdges.push({
          from: newNodeId,
          to: updatedNodes[i].id,
          relation: 'repairs'
        });
      }
    }
  }

  // Rule 2: Contradictory hypotheses
  if (kind === 'subgoal' || kind === 'operator') {
    const siblings = updatedNodes.filter(
      (n) =>
        n.id !== newNodeId &&
        (n.status === 'confirmed' || n.status === 'active') &&
        updatedEdges.some((e) => e.from === bestParent.id && e.to === n.id)
    );

    for (const sib of siblings) {
      const sibIsSchema = /Declare Schema/i.test(sib.content);
      const newIsSchema = /Declare Schema/i.test(thoughtText);

      const sibVec = embed(sib.content);
      const simWithSib = cosineSimilarity(thoughtVec, sibVec);

      if ((sibIsSchema && newIsSchema && simWithSib < 0.99) || simWithSib < 0.3) {
        const sibIdx = updatedNodes.findIndex((n) => n.id === sib.id);
        if (sibIdx >= 0) {
          updatedNodes[sibIdx] = { ...updatedNodes[sibIdx], status: 'pruned' };
          prunedNodeIds.push(sib.id);
          updatedEdges.push({
            from: newNodeId,
            to: sib.id,
            relation: 'revises'
          });
        }
      }
    }
  }

  // Rule 3: Recompute Active Path S
  const activeNodes = updatedNodes.filter(
    (n) => n.status !== 'pruned' && (n.status as string) !== 'dead-end'
  );
  const activePath = activeNodes.map((n) => n.id);

  const sceneDelta = (metrics?.progress_final || 0) >= 0.4 || (metrics?.delta_next || 1.0) < 0.4;

  return {
    graph: {
      ...currentGraph,
      nodes: updatedNodes,
      edges: updatedEdges,
      version: currentGraph.version + 1,
      prunedNodeIds: Array.from(new Set(prunedNodeIds)),
      activePath
    },
    newNode,
    sceneDelta
  };
}
