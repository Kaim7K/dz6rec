import React from "react";

export default function MetricStrip({ metrics }) {
  return (
    <div className="dz-metric-strip">
      {metrics.map((metric) => (
        <article key={metric.label} className="dz-metric">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs leading-5 text-muted-foreground">{metric.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold leading-none tracking-tight text-white tabular-nums">{metric.value}</p>
            </div>
            {metric.icon && <metric.icon size={16} className="mt-0.5 hidden shrink-0 text-muted-foreground sm:block" />}
          </div>
        </article>
      ))}
    </div>
  );
}
