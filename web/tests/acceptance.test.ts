import { describe, it, expect } from 'vitest';
import { executeSessionSql, normalizeThought } from '@/lib/thoughtEngine';
import { alignTrajectoryTS, extractCriticalPath } from '@/lib/alignmentEngine';
import { prune } from '@/lib/pruningEngine';
import { DEMO_TASK_STUDIERENDER } from '@/lib/demoTask';
import { ConsensusGraph, Interaction, TrajectoryMetrics } from '@/lib/types';

describe('6-Step Acceptance Walkthrough', () => {
  const task = DEMO_TASK_STUDIERENDER;
  const goldCriticalPath = extractCriticalPath(task.goldTree);

  it('runs the six acceptance commits sequentially and verifies trajectory alignment & pruning', () => {
    let studentGraph: ConsensusGraph = {
      learnerId: 'student-demo',
      taskId: task.id,
      sessionId: 'acceptance-session-vitest',
      rootId: 'root',
      version: 1,
      prunedNodeIds: [],
      activePath: ['root'],
      nodes: [
        {
          id: 'root',
          label: 'Task Started',
          content: task.brief,
          kind: 'goal',
          status: 'confirmed'
        }
      ],
      edges: []
    };

    let metrics: TrajectoryMetrics = {
      d_align: 0.0,
      mean_d_step: 0.0,
      d_trajectory: 0.0,
      progress_final: 0.0,
      delta_pi: [0.0],
      matched_indices: [0],
      dropped_indices: [],
      flags: []
    };

    const steps = [
      "CREATE TABLE < Studierender > (MatrikelNr int, Name varchar(30))",
      "CREATE TABLE Studierender (MatrikelNr int, Alter varchar(2))",
      "CREATE TABLE Studierender (MatrikelNr INT PRIMARY KEY, Name VARCHAR(30))",
      "SELECT * FROM Wein",
      "INSERT INTO Studierender VALUES (1, 'Ada')",
      "SELECT Name FROM Studierender"
    ];

    steps.forEach((stepSql, idx) => {
      const execRes = executeSessionSql('acceptance-session-vitest', stepSql);
      const isError = !execRes.success;
      const channel = isError ? 'error' : 'submit';
      const derivedThought = normalizeThought(stepSql, channel, isError, execRes.result);

      const interaction: Interaction = {
        id: `int-step-${idx + 1}`,
        at: new Date().toISOString(),
        sessionId: 'acceptance-session-vitest',
        learnerId: 'student-demo',
        sceneId: idx < 3 ? 'scene-1' : 'scene-2',
        channel,
        payload: stepSql,
        result: execRes.result,
        derivedThought
      };

      const currentSpineThoughts = studentGraph.nodes
        .filter((n) => studentGraph.activePath.includes(n.id))
        .map((n) => n.content);
      currentSpineThoughts.push(derivedThought);

      metrics = alignTrajectoryTS(currentSpineThoughts, goldCriticalPath);
      const pruneRes = prune(studentGraph, task.goldTree, interaction, metrics);
      studentGraph = pruneRes.graph;

      const lastNode = studentGraph.nodes[studentGraph.nodes.length - 1];

      if (idx === 0) {
        expect(lastNode.kind).toBe('error');
      } else if (idx === 1) {
        expect(lastNode.kind).toBe('error');
      } else if (idx === 2) {
        expect(lastNode.status).toBe('confirmed');
        expect(metrics.progress_final).toBeGreaterThanOrEqual(0.4);
      } else if (idx === 3) {
        expect(lastNode.kind === 'error' || lastNode.status === 'dead-end').toBe(true);
      } else if (idx === 4) {
        expect(lastNode.status).toBe('confirmed');
      } else if (idx === 5) {
        expect(lastNode.status).toBe('confirmed');
        expect(metrics.progress_final).toBeGreaterThan(0.6);
      }
    });
  });
});
