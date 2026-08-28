import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-block px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-xs font-mono">
          Trajectory Thought Model Platform
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 sm:text-5xl">
          Elicit, Prune, and Align Reasoning in Simulation Plays
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Interactive consensus graphs with dynamic DTW trajectory distance matching and gold critical path alignment.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/play/create-studierender"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            Launch Demo Simulation Play
          </Link>
          <Link
            href="/instructor/create-studierender"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold transition"
          >
            Instructor View
          </Link>
        </div>
      </div>
    </div>
  );
}
