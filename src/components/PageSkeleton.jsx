import React from "react";

export default function PageSkeleton({ cards = false }) {
  return (
    <div role="status" aria-label="Carregando conteúdo" className="dz-page animate-pulse">
      <div className="space-y-3 border-b border-white/[0.08] pb-6"><div className="dz-skeleton h-3 w-24" /><div className="dz-skeleton h-8 w-48" /><div className="dz-skeleton h-4 w-3/4 max-w-lg" /></div>
      <div className={cards ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
        {[0, 1, 2].map((key) => <div key={key} className="dz-card space-y-4 p-5"><div className={`dz-skeleton ${cards ? "aspect-square" : "h-16"}`} /><div className="dz-skeleton h-4 w-2/3" /><div className="dz-skeleton h-3 w-1/2" /></div>)}
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
