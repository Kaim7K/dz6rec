import React from "react";

export default function MetricStrip({ metrics }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {metrics.map((metric) => (
        <article key={metric.label} className="dz-card p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-primary/18 bg-primary/12 text-primary">
              {metric.icon && <metric.icon size={21} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
              <p className="mt-1 font-display text-3xl font-bold leading-none tracking-tight text-white">{metric.value}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
