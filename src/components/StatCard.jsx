import React from "react";

export default function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="dz-card group p-4 transition-colors duration-200 hover:border-white/[0.13] hover:bg-white/[0.045] sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        {Icon && <Icon size={16} className="text-muted-foreground transition-colors group-hover:text-white/40" />}
      </div>
      <p className="mt-2.5 font-display text-3xl font-medium tracking-tight text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
