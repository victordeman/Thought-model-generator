import React from 'react';
import { ConsensusGraph, UserRole, TrajectoryMetrics } from '@/lib/types';

interface StageProps {
  studentGraph: ConsensusGraph;
  goldGraph: ConsensusGraph;
  overlayMode: 'off' | 'silhouette' | 'full';
  role: UserRole;
  metrics?: TrajectoryMetrics;
  selectedNodeId?: string;
  onSelectNode?: (id: string) => void;
}

export const ConsensusStage: React.FC<StageProps> = ({
  studentGraph,
  goldGraph,
  overlayMode,
  role,
  metrics,
  selectedNodeId,
  onSelectNode
}) => {
  const expectedNextIdx = metrics?.expected_next_index ?? 0;
  const expectedNextNode = goldGraph.nodes[expectedNextIdx + 1] || goldGraph.nodes[goldGraph.nodes.length - 1];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Consensus Stage</h2>
          <p className="text-xs text-slate-500">Live Thought Model (v{studentGraph.version})</p>
        </div>
        <div className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400 font-mono">
          {studentGraph.nodes.length} nodes
        </div>
      </div>

      <div className="flex-1 min-h-[300px] bg-slate-950/50 rounded-lg p-4 border border-slate-800 relative overflow-auto space-y-4">
        {overlayMode !== 'off' && (
          <div className="p-3 bg-slate-900/60 border border-dashed border-indigo-800/40 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-indigo-400 uppercase tracking-wide">
                Gold Critical Path (R)
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 rounded backdrop-blur">
                Ghost: {overlayMode}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {goldGraph.nodes.map((gn, idx) => {
                const isExpectedNext = expectedNextNode && gn.id === expectedNextNode.id;

                return (
                  <div
                    key={gn.id}
                    className={`text-xs px-2.5 py-1 rounded font-mono transition-all ${
                      isExpectedNext
                        ? 'bg-amber-950/80 border border-amber-500 text-amber-200 animate-pulse ring-2 ring-amber-500/50 font-bold'
                        : 'bg-indigo-950/40 border border-indigo-800/50 text-indigo-300'
                    }`}
                  >
                    {idx + 1}. {overlayMode === 'full' || role !== 'student' ? gn.label : `Node ${gn.id}`}
                    {isExpectedNext && <span className="ml-1 text-[9px] uppercase tracking-wider">★ Next</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/60">
          <span className="font-semibold text-slate-300 uppercase tracking-wider">Diagnostic Legend:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Error</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Dead-End</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600"></span> Pruned</span>
        </div>

        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
          Evolving Student Tree (S)
        </div>

        <div className="space-y-3">
          {studentGraph.nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isPruned = node.status === 'pruned' || studentGraph.prunedNodeIds.includes(node.id);
            const isDeadEnd = (node.status as string) === 'dead-end';
            const isActive = studentGraph.activePath.includes(node.id);

            let statusBg = 'bg-slate-800/80 border-slate-700 text-slate-300';
            if (node.status === 'confirmed') statusBg = 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200';
            if (node.status === 'active') statusBg = 'bg-blue-950/50 border-blue-700/60 text-blue-200';
            if (isPruned) statusBg = 'bg-slate-900/40 border-slate-800 text-slate-500 line-through';
            if (isDeadEnd) statusBg = 'bg-red-950/40 border-red-800/60 text-red-300 font-mono';
            if (node.kind === 'error') statusBg = 'bg-amber-950/50 border-amber-800/60 text-amber-300';

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode?.(node.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${statusBg} ${
                  isSelected ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-2">
                    <span className="uppercase text-[10px] tracking-wider opacity-75">[{node.kind}]</span>
                    {node.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-mono uppercase">
                    {node.status}
                  </span>
                </div>
                <p className="text-xs font-mono break-all opacity-90">{node.content}</p>

                {node.deltaPi !== undefined && node.deltaPi !== null && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>δ_π = {node.deltaPi.toFixed(3)}</span>
                    {isActive && <span className="text-emerald-400 font-medium">Spine (Active)</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
