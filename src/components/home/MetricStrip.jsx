import React from "react";
import { cn } from "@/lib/utils";

export default function MetricStrip({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-y-0">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col gap-3",
            i > 0 && "sm:border-l sm:border-white/[0.06] sm:pl-8",
            i < metrics.length - 1 && "sm:pr-8"
          )}
        >
          <div className="flex items-center gap-2">
            {m.icon && <m.icon size={13} className="text-primary/70" />}
            <span className="text-2xs font-medium uppercase tracking-[0.18em] text-white/40">{m.label}</span>
          </div>
          <p className="font-display text-4xl font-bold tracking-tight tabular-nums text-white lg:text-5xl">{m.value}</p>
        </div>
      ))}
    </div>
  );
}