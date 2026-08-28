import React from 'react';
import { TrajectoryMetrics, UserRole } from '@/lib/types';

interface ScoreboardProps {
  metrics: TrajectoryMetrics;
  role: UserRole;
  overlayMode: 'off' | 'silhouette' | 'full';
  onToggleOverlay: (mode: 'off' | 'silhouette' | 'full') => void;
  onRoleChange: (role: UserRole) => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  metrics,
  role,
  overlayMode,
  onToggleOverlay,
  onRoleChange
}) => {
  return (
    <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Progress (p_j)</span>
          <span className="font-mono text-sm font-semibold text-emerald-400">
            {(metrics.progress_final * 100).toFixed(0)}%
          </span>
        </div>

        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Last d_step</span>
          <span className="font-mono text-sm font-semibold text-slate-200">
            {metrics.mean_d_step.toFixed(3)}
          </span>
        </div>

        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Trajectory D(S,R)</span>
          <span className="font-mono text-sm font-semibold text-indigo-400">
            {metrics.d_trajectory.toFixed(3)}
          </span>
        </div>

        {metrics.flags.length > 0 && (
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Flags:</span>
            {metrics.flags.map((flag) => (
              <span
                key={flag}
                className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono text-[10px]"
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
          <span className="text-slate-500 px-2">Ghost Overlay:</span>
          {(['off', 'silhouette', 'full'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onToggleOverlay(m)}
              className={`px-2 py-0.5 rounded transition ${
                overlayMode === m ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
          <span className="text-slate-500 px-2">Role:</span>
          {(['student', 'instructor', 'researcher'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={`px-2 py-0.5 rounded transition ${
                role === r ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
