import React from "react";
import { Image, Info, Megaphone, Music2 } from "lucide-react";
import { CATEGORIES } from "@/lib/music";
import { computeProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

const ICONS = {
  musica: Music2,
  visual: Image,
  marketing: Megaphone,
};

export default function ProjectProgress({ items, sections, className }) {
  const prog = computeProgress(items, sections);

  return (
    <div className={cn("w-full rounded-md border border-white/[0.045] bg-black/16 p-3 xl:p-3.5", className)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-white xl:text-sm">
          Progresso geral
          <Info size={12} className="text-white/38" />
        </span>
        <span className="text-sm font-bold tabular-nums text-white xl:text-base">{prog.total.pct}%</span>
      </div>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07] xl:mt-3">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${prog.total.pct}%` }} />
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:mt-4 xl:grid-cols-3 xl:gap-3">
        {CATEGORIES.map((category) => {
          const p = prog[category.key];
          const Icon = ICONS[category.key] || Music2;

          return (
            <div key={category.key} className="min-w-0 flex items-center gap-2 xl:gap-2.5">
              <Icon size={14} className="shrink-0 text-white/62 xl:h-[15px] xl:w-[15px]" />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[0.72rem] font-medium text-white/60 xl:text-xs">{category.label}</span>
                  <span className="text-[0.72rem] font-bold tabular-nums text-white/82 xl:text-xs">{p.pct}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%`, backgroundColor: category.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
