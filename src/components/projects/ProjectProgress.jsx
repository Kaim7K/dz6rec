import React from "react";
import { computeProgress } from "@/lib/progress";
import { CATEGORIES } from "@/lib/music";

export default function ProjectProgress({ items, sections }) {
  const prog = computeProgress(items, sections);
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className="text-2xs font-medium uppercase tracking-[0.18em] text-white/40">Progresso geral</span>
        <span className="font-display text-2xl font-bold tabular-nums text-white">
          {prog.total.pct}<span className="text-base text-white/40">%</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${prog.total.pct}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">
        {CATEGORIES.map((c) => {
          const p = prog[c.key];
          return (
            <div key={c.key}>
              <div className="flex items-center justify-between">
                <span className="text-2xs font-medium uppercase tracking-[0.14em] text-white/45">{c.label}</span>
                <span className="text-2xs tabular-nums text-white/40">{p.pct}%</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%`, backgroundColor: c.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}