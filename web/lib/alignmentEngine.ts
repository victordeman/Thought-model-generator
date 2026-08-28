import { ConsensusGraph, TrajectoryMetrics } from './types';
import { embed, cosineSimilarity } from './embeddingUtils';

export function extractCriticalPath(goldTree: ConsensusGraph): string[] {
  return goldTree.nodes
    .filter((n) => n.status === 'confirmed')
    .map((n) => n.content);
}

export function alignTrajectoryTS(
  studentTrajectory: string[],
  goldTrajectory: string[],
  dropCost = 0.5
): TrajectoryMetrics {
  const n = studentTrajectory.length;
  const m = goldTrajectory.length;

  if (n === 0 || m === 0) {
    return {
      d_align: 0.0,
      mean_d_step: 0.0,
      d_trajectory: 0.0,
      progress_final: 0.0,
      delta_pi: [],
      matched_indices: [],
      dropped_indices: [],
      flags: []
    };
  }

  const dSteps: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const v1 = embed(studentTrajectory[i]);
    const v2 = embed(studentTrajectory[i + 1]);
    dSteps.push(1.0 - cosineSimilarity(v1, v2));
  }
  const meanDStep = dSteps.length > 0 ? dSteps.reduce((a, b) => a + b, 0) / dSteps.length : 0.0;

  const dist: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    const sVec = embed(studentTrajectory[i]);
    for (let j = 0; j < m; j++) {
      const gVec = embed(goldTrajectory[j]);
      dist[i][j] = 1.0 - cosineSimilarity(sVec, gVec);
    }
  }

  const cost: number[][] = Array.from({ length: n }, () => new Array(m).fill(Infinity));
  const parent: ({ prevI: number; prevJ: number; isDrop: boolean } | null)[][] = Array.from(
    { length: n },
    () => new Array(m).fill(null)
  );

  cost[0][0] = dist[0][0];
  for (let j = 1; j < m; j++) {
    cost[0][j] = cost[0][j - 1] + dist[0][j];
    parent[0][j] = { prevI: 0, prevJ: j - 1, isDrop: false };
  }

  for (let i = 1; i < n; i++) {
    const matchC0 = dist[i][0] + Math.min(cost[i - 1][0], i * dropCost);
    const dropC0 = cost[i - 1][0] + dropCost;
    if (dropC0 < matchC0) {
      cost[i][0] = dropC0;
      parent[i][0] = { prevI: i - 1, prevJ: 0, isDrop: true };
    } else {
      cost[i][0] = matchC0;
      parent[i][0] = { prevI: i - 1, prevJ: 0, isDrop: false };
    }
  }

  for (let i = 1; i < n; i++) {
    for (let j = 1; j < m; j++) {
      const matchC =
        dist[i][j] +
        Math.min(cost[i - 1][j - 1], cost[i - 1][j], cost[i][j - 1]);
      const dropC = cost[i - 1][j] + dropCost;

      if (dropC <= matchC) {
        cost[i][j] = dropC;
        parent[i][j] = { prevI: i - 1, prevJ: j, isDrop: true };
      } else {
        cost[i][j] = matchC;
        const minP = Math.min(cost[i - 1][j - 1], cost[i - 1][j], cost[i][j - 1]);
        if (minP === cost[i - 1][j - 1]) {
          parent[i][j] = { prevI: i - 1, prevJ: j - 1, isDrop: false };
        } else if (minP === cost[i - 1][j]) {
          parent[i][j] = { prevI: i - 1, prevJ: j, isDrop: false };
        } else {
          parent[i][j] = { prevI: i, prevJ: j - 1, isDrop: false };
        }
      }
    }
  }

  let bestJ = m - 1;
  if (n < m) {
    let minCost = Infinity;
    for (let j = 0; j < m; j++) {
      if (cost[n - 1][j] < minCost) {
        minCost = cost[n - 1][j];
        bestJ = j;
      }
    }
  }

  let currI = n - 1;
  let currJ = bestJ;
  const path: [number, number][] = [];
  const droppedIndices: number[] = [];

  while (currI >= 0 && currJ >= 0) {
    const p = parent[currI][currJ];
    if (!p) {
      path.push([currI, currJ]);
      break;
    }
    if (p.isDrop) {
      droppedIndices.push(currI);
    } else {
      path.push([currI, currJ]);
    }
    currI = p.prevI;
    currJ = p.prevJ;
  }

  path.reverse();
  droppedIndices.reverse();

  const matchedIndices: number[] = new Array(n).fill(-1);
  for (const [sIdx, rIdx] of path) {
    if (!droppedIndices.includes(sIdx)) {
      matchedIndices[sIdx] = rIdx;
    }
  }

  const deltaPi: number[] = [];
  const flagsSet = new Set<TrajectoryMetrics['flags'][number]>();

  for (let j = 0; j < n; j++) {
    if (droppedIndices.includes(j)) {
      deltaPi.push(1.0);
      flagsSet.add('dropped_outlier');
    } else {
      const matchR = matchedIndices[j];
      if (matchR >= 0) {
        const dev = dist[j][matchR];
        deltaPi.push(dev);
        if (dev > 0.6) {
          flagsSet.add('off_path');
        }
      } else {
        deltaPi.push(1.0);
      }
    }
  }

  for (const ds of dSteps) {
    if (ds > 0.7) {
      flagsSet.add('large_jump');
    }
  }

  const dAlign = cost[n - 1][bestJ] / Math.max(n, m);
  const dTrajectory = 0.7 * dAlign + 0.3 * meanDStep;

  const validMatched = matchedIndices.filter((x) => x >= 0);
  const lastMatched = validMatched.length > 0 ? Math.max(...validMatched) : -1;
  const progressFinal = Math.min(1.0, (lastMatched + 1) / m);

  const expectedIdx = Math.min(lastMatched + 1, m - 1);

  return {
    d_align: dAlign,
    mean_d_step: meanDStep,
    d_trajectory: dTrajectory,
    progress_final: progressFinal,
    delta_pi: deltaPi,
    matched_indices: matchedIndices,
    dropped_indices: droppedIndices,
    flags: Array.from(flagsSet),
    expected_next_index: expectedIdx,
    expected_next_node: goldTrajectory[expectedIdx] || ''
  };
}
