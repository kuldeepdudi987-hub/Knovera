import React from 'react';
import { Radio, Sparkles } from 'lucide-react';

const LIVE_TUTORS_SAMPLE = [
  { name: 'Dr. Vikram Malhotra', skill: 'Python / System Design', students: '1-on-1' },
  { name: 'Prof. Rajesh Kulkarni', skill: 'Calculus & Jacobians', students: '1-on-1' },
  { name: 'Ananya Deshmukh', skill: 'PyTorch & RAG Agents', students: 'Group (3/8)' },
  { name: 'Kavita Sen', skill: 'Figma Auto-Layout Audit', students: '1-on-1' },
  { name: 'Elena Rostova', skill: 'French Speaking Drill', students: 'Group (5/8)' },
  { name: 'Neha Gupta', skill: 'GMAT Permutations', students: '1-on-1' }
];

export default function LiveTutorTicker() {
  return (
    <div className="w-full bg-obsidian-900/90 dark:bg-obsidian-950/80 border-y border-slate-800/80 py-2.5 overflow-hidden backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider flex-shrink-0 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>Live Tutors Right Now</span>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-xs text-slate-300">
          {LIVE_TUTORS_SAMPLE.map((t, idx) => (
            <div key={idx} className="inline-flex items-center gap-2 bg-slate-800/40 dark:bg-slate-900/40 px-3 py-1 rounded-lg border border-slate-700/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-white">{t.name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-cyan-300">{t.skill}</span>
              <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                {t.students}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
