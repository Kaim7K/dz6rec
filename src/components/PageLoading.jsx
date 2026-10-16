import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PageLoading({ variant = "list" }) {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando conteúdo" className="min-w-0 space-y-5">
      <span className="sr-only">Carregando conteúdo...</span>
      {variant === "project" ? (
        <div aria-hidden="true" className="dz-card flex flex-wrap items-center gap-5 p-5">
          <Skeleton className="aspect-square w-36 shrink-0 sm:w-48" />
          <div className="min-w-0 flex-1 basis-48 space-y-4"><Skeleton className="h-7 w-32" /><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-32" /></div>
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div aria-hidden="true" className="space-y-3 border-b border-white/[0.07] pb-5"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full max-w-md" /></div>
      )}
      <div aria-hidden="true" className="dz-card divide-y divide-white/[0.06] px-5">
        {[0, 1, 2].map(row => <div key={row} className="flex items-center gap-4 py-5"><Skeleton className="h-10 w-10 shrink-0" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-2/3 max-w-sm" /><Skeleton className="h-3 w-1/3 max-w-48" /></div><Skeleton className="hidden h-8 w-20 sm:block" /></div>)}
      </div>
    </div>
  );
}
