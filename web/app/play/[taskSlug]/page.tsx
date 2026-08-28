'use client';

import React, { useState, useEffect } from 'react';
import { TASKS_REGISTRY, DEMO_TASK_STUDIERENDER } from '@/lib/demoTask';
import { Task, ConsensusGraph, Interaction, TrajectoryMetrics, UserRole } from '@/lib/types';
import { prune } from '@/lib/pruningEngine';
import { extractCriticalPath, alignTrajectoryTS } from '@/lib/alignmentEngine';
import { ConsensusStage } from '@/components/ConsensusStage';
import { Scoreboard } from '@/components/Scoreboard';
import { ResearcherPanel } from '@/components/ResearcherPanel';
import { embed, cosineSimilarity } from '@/lib/embeddingUtils';
import Link from 'next/link';

export default function PlayPage({ params }: { params: Promise<{ taskSlug: string }> }) {
  const resolvedParams = React.use(params);
  const taskSlug = resolvedParams?.taskSlug || 'create-studierender';

  const task: Task = TASKS_REGISTRY[taskSlug] || DEMO_TASK_STUDIERENDER;
  const goldCriticalPath = extractCriticalPath(task.goldTree);

  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [role, setRole] = useState<UserRole>('student');
  const [overlayMode, setOverlayMode] = useState<'off' | 'silhouette' | 'full'>('silhouette');
  const [sqlInput, setSqlInput] = useState(task.starterState.initialQuery || '');
  const [sqlResult, setSqlResult] = useState<string | null>(null);
  const [lastInteraction, setLastInteraction] = useState<Interaction | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [unlockedScenes, setUnlockedScenes] = useState<number[]>([0]);

  const [draftDeltaNext, setDraftDeltaNext] = useState<number | null>(null);

  const [studentGraph, setStudentGraph] = useState<ConsensusGraph>({
    learnerId: 'student-demo',
    taskId: task.id,
    sessionId: 'session-001',
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
  });

  const [metrics, setMetrics] = useState<TrajectoryMetrics>({
    d_align: 0.0,
    mean_d_step: 0.0,
    d_trajectory: 0.0,
    progress_final: 0.0,
    delta_pi: [0.0],
    matched_indices: [0],
    dropped_indices: [],
    flags: [],
    expected_next_index: 0,
    expected_next_node: goldCriticalPath[0] || ''
  });

  const currentScene = task.scenes[currentSceneIdx] || task.scenes[0];

  useEffect(() => {
    if (!sqlInput.trim() || !metrics.expected_next_node) {
      setDraftDeltaNext(null);
      return;
    }
    const draftVec = embed(sqlInput);
    const goldVec = embed(metrics.expected_next_node);
    const dev = 1.0 - cosineSimilarity(draftVec, goldVec);
    setDraftDeltaNext(dev);
  }, [sqlInput, metrics.expected_next_node]);

  const handleAction = async (channel: 'query' | 'submit' | 'hint' | 'reset') => {
    try {
      const payloadText = channel === 'hint'
        ? (currentScene.hints?.[0] || 'Provide syntax for table creation')
        : sqlInput;

      const res = await fetch('/api/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session-001',
          learnerId: 'student-demo',
          sceneId: currentScene.id,
          channel,
          payload: payloadText
        })
      });

      const data = await res.json();
      if (data.success) {
        setSqlResult(data.result);
        setLastInteraction(data.interaction);
        setInteractions((prev) => [data.interaction, ...prev]);

        if (channel === 'submit' || data.isError || channel === 'hint') {
          const currentSpineThoughts = studentGraph.nodes
            .filter((n) => studentGraph.activePath.includes(n.id))
            .map((n) => n.content);
          currentSpineThoughts.push(data.interaction.derivedThought);

          const newMetrics = alignTrajectoryTS(currentSpineThoughts, goldCriticalPath);
          setMetrics(newMetrics);

          const pruneResult = prune(studentGraph, task.goldTree, data.interaction, newMetrics);
          setStudentGraph(pruneResult.graph);

          if (newMetrics.progress_final >= 0.4 && currentSceneIdx < task.scenes.length - 1) {
            const nextIdx = currentSceneIdx + 1;
            if (!unlockedScenes.includes(nextIdx)) {
              setUnlockedScenes((prev) => [...prev, nextIdx]);
            }
          }
        }
      } else {
        setSqlResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setSqlResult(`Execution Error: ${err.message}`);
    }
  };

  const handleSkipScene = () => {
    if (currentSceneIdx < task.scenes.length - 1) {
      const nextIdx = currentSceneIdx + 1;
      setUnlockedScenes((prev) => Array.from(new Set([...prev, nextIdx])));
      setCurrentSceneIdx(nextIdx);
      setMetrics((prev) => ({
        ...prev,
        flags: Array.from(new Set([...prev.flags, 'large_jump']))
      }));
    }
  };

  const studentTrajectoryThoughts = studentGraph.nodes.map((n) => n.content);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <header className="h-12 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 uppercase tracking-wider">
            {task.domain} Simulation Play
          </span>
          <h1 className="text-sm font-medium text-slate-200">{task.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {Object.values(TASKS_REGISTRY).map((t) => (
            <Link
              key={t.slug}
              href={`/play/${t.slug}`}
              className={`text-xs px-2.5 py-1 rounded transition ${
                t.slug === task.slug
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900'
              }`}
            >
              {t.title}
            </Link>
          ))}
        </div>

        <div className="text-xs text-slate-400">
          Learner: <span className="font-mono text-slate-300">opaque_token_94a2</span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        <div className="col-span-3 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col overflow-y-auto">
          <div className="mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Act / Scene Selection
            </span>
            <div className="space-y-1">
              {task.scenes.map((scene, idx) => {
                const isUnlocked = unlockedScenes.includes(idx);
                const isCurrent = idx === currentSceneIdx;

                return (
                  <button
                    key={scene.id}
                    disabled={!isUnlocked}
                    onClick={() => setCurrentSceneIdx(idx)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-medium'
                        : isUnlocked
                        ? 'text-slate-300 hover:bg-slate-800/50'
                        : 'text-slate-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{scene.title}</span>
                    <span className="text-[10px] font-mono">
                      {isCurrent ? '● Active' : isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-200">{currentScene.title}</h3>
                <button
                  onClick={handleSkipScene}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700"
                >
                  Skip Scene (Jump)
                </button>
              </div>

              <p className="text-xs text-slate-300 italic mb-4 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-800">
                "{currentScene.narration}"
              </p>

              <div className="text-xs text-slate-400 space-y-2 mb-4">
                <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">Goal:</span>
                <p>{currentScene.goal}</p>
              </div>

              {currentScene.hints && currentScene.hints.length > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-semibold text-amber-400">Hint Assistance</span>
                    <button
                      onClick={() => handleAction('hint')}
                      className="text-[10px] px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded transition font-medium"
                    >
                      Request Hint
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-200/80 italic">{currentScene.hints[0]}</p>
                </div>
              )}
            </div>

            {interactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Interaction History ({interactions.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {interactions.map((int) => (
                    <div key={int.id} className="text-[11px] p-2 bg-slate-950/80 rounded border border-slate-800 font-mono">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                        <span className="uppercase">{int.channel}</span>
                        <span>{new Date(int.at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 truncate">{int.derivedThought}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-5 flex flex-col border-r border-slate-800 bg-slate-950">
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Elicitation Surface (SQL)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('query')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded font-medium border border-slate-700 transition"
              >
                Run
              </button>
              <button
                onClick={() => handleAction('submit')}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium transition shadow-sm"
              >
                Commit Thought
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 flex flex-col overflow-y-auto">
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="w-full flex-1 bg-slate-900 text-slate-100 font-mono text-xs p-3 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none min-h-[140px]"
              placeholder="Type your SQL query or statement here..."
            />

            <div className="mt-3 p-2.5 bg-slate-900/80 border border-slate-800 rounded text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                  Derived Thought:
                </span>
                {draftDeltaNext !== null && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    draftDeltaNext < 0.4
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    Live Δ_next = {draftDeltaNext.toFixed(3)}
                  </span>
                )}
              </div>
              <p className="font-mono text-slate-300 truncate">
                {lastInteraction ? lastInteraction.derivedThought : (sqlInput || 'None')}
              </p>
            </div>

            {sqlResult && (
              <div className="mt-2 p-2.5 bg-slate-900/50 border border-slate-800 rounded text-xs font-mono text-emerald-400 overflow-x-auto max-h-32">
                <pre>{sqlResult}</pre>
              </div>
            )}

            {(role === 'researcher' || role === 'instructor') && (
              <div className="mt-4">
                <ResearcherPanel
                  metrics={metrics}
                  studentTrajectory={studentTrajectoryThoughts}
                  goldTrajectory={goldCriticalPath}
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4 flex flex-col overflow-hidden">
          <ConsensusStage
            studentGraph={studentGraph}
            goldGraph={task.goldTree}
            overlayMode={overlayMode}
            role={role}
            metrics={metrics}
          />
        </div>
      </div>

      <Scoreboard
        metrics={metrics}
        role={role}
        overlayMode={overlayMode}
        onToggleOverlay={setOverlayMode}
        onRoleChange={setRole}
      />
    </div>
  );
}
