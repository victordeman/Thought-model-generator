'use client';

import React, { useState } from 'react';
import { TASKS_REGISTRY, DEMO_TASK_STUDIERENDER } from '@/lib/demoTask';
import { Task } from '@/lib/types';
import Link from 'next/link';

export default function InstructorPage({ params }: { params: Promise<{ taskSlug: string }> }) {
  const resolvedParams = React.use(params);
  const taskSlug = resolvedParams?.taskSlug || 'create-studierender';

  const initialTask: Task = TASKS_REGISTRY[taskSlug] || DEMO_TASK_STUDIERENDER;

  const [taskJson, setTaskJson] = useState<string>(JSON.stringify(initialTask, null, 2));
  const [parsedTask, setParsedTask] = useState<Task>(initialTask);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (raw: string) => {
    setTaskJson(raw);
    try {
      const obj = JSON.parse(raw);
      if (!obj.id || !obj.slug || !obj.scenes || !obj.goldTree) {
        setJsonError('Missing required properties: id, slug, scenes, goldTree');
        return;
      }
      setParsedTask(obj);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleExport = () => {
    const blob = new Blob([taskJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parsedTask.slug || 'task'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
              Instructor / Task Authoring Studio
            </span>
            <h1 className="text-2xl font-bold text-slate-100">{parsedTask.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{parsedTask.brief}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition border border-slate-700"
            >
              Export JSON
            </button>
            <Link
              href={`/play/${parsedTask.slug}`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition shadow-sm"
            >
              Launch Play Workstation
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mr-2">Seed Plays:</span>
          {Object.values(TASKS_REGISTRY).map((t) => (
            <Link
              key={t.slug}
              href={`/instructor/${t.slug}`}
              className={`px-3 py-1 rounded text-xs transition ${
                t.slug === taskSlug
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium'
                  : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              {t.title}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Task Specification JSON
              </h2>
              {jsonError ? (
                <span className="text-xs text-red-400 font-mono">⚠️ {jsonError}</span>
              ) : (
                <span className="text-xs text-emerald-400 font-mono">✓ Valid Task JSON</span>
              )}
            </div>

            <textarea
              value={taskJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full h-[520px] bg-slate-900 font-mono text-xs p-4 rounded-lg border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">
                Scenes Configuration ({parsedTask.scenes?.length || 0})
              </h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {parsedTask.scenes?.map((sc) => (
                  <div key={sc.id} className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-300">
                      <span>{sc.title}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">Mode: {sc.elicitationMode}</span>
                    </div>
                    <p className="text-slate-400 italic">"{sc.narration}"</p>
                    <p className="text-slate-500 text-[11px]">Goal: {sc.goal}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">
                Gold Critical Path Nodes ({parsedTask.goldTree?.nodes?.length || 0})
              </h3>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 font-mono text-xs">
                {parsedTask.goldTree?.nodes?.map((gn, idx) => (
                  <div key={gn.id} className="p-2.5 bg-slate-950 border border-indigo-950 rounded flex items-center justify-between">
                    <span className="text-indigo-300">{idx + 1}. {gn.label}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-xs">{gn.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
