import React from "react";

export default function MetricStrip({ metrics }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="dz-card p-3 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 sm:grid shrink-0 place-items-center rounded-md border border-primary/18 bg-primary/12 text-primary">
              {metric.icon && <metric.icon size={18} />}
            </div>
            <div className="min-w-0">
              <p className="min-h-9 text-2xs font-medium sm:min-h-0 sm:text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold leading-none tracking-tight text-white">{metric.value}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
