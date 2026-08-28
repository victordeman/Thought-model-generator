import React from 'react';
import { TrajectoryMetrics } from '@/lib/types';

interface ResearcherPanelProps {
  metrics: TrajectoryMetrics;
  studentTrajectory: string[];
  goldTrajectory: string[];
}

export const ResearcherPanel: React.FC<ResearcherPanelProps> = ({
  metrics,
  studentTrajectory,
  goldTrajectory
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 font-sans text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Researcher Trajectory Analytics</h3>
          <p className="text-slate-400 text-[11px]">Dynamic Time Warping (Drop-DTW) Step-by-Step Alignment</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-indigo-300">
            D(S,R) = {metrics.d_trajectory.toFixed(3)}
          </span>
          <span className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-emerald-300">
            Progress = {(metrics.progress_final * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/60">
              <th className="p-2">Step</th>
              <th className="p-2">Student Thought (S_j)</th>
              <th className="p-2">Matched Gold (R_k)</th>
              <th className="p-2">δ_π(s_j)</th>
              <th className="p-2">Status / Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {studentTrajectory.map((sThought, idx) => {
              const matchedRIdx = metrics.matched_indices[idx] ?? -1;
              const goldMatchText = matchedRIdx >= 0 ? goldTrajectory[matchedRIdx] : '— (None)';
              const isDropped = metrics.dropped_indices.includes(idx);
              const delta = metrics.delta_pi[idx] ?? 0.0;

              return (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  <td className="p-2 text-slate-500">{idx + 1}</td>
                  <td className="p-2 max-w-xs truncate">{sThought}</td>
                  <td className="p-2 max-w-xs truncate text-indigo-300">{goldMatchText}</td>
                  <td className="p-2">{delta.toFixed(3)}</td>
                  <td className="p-2">
                    {isDropped ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">
                        Dropped Outlier
                      </span>
                    ) : delta > 0.6 ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">
                        Off-Path
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                        Aligned
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
