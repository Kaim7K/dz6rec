import React from "react";

export default function MetricStrip({ metrics }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-lg border border-white/[0.05] bg-white/[0.025] p-5">
          <div className="flex items-center gap-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/14 text-primary">
              {metric.icon && <metric.icon size={23} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/48">{metric.label}</p>
              <p className="mt-1 font-display text-3xl font-bold leading-none tracking-tight text-white">{metric.value}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
