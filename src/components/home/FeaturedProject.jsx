import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { TYPE, STATUS, STATUS_TONE } from "@/lib/music";

export default function FeaturedProject({ project, progress }) {
  if (!project) return null;
  const pct = progress?.t ? Math.round((progress.d / progress.t) * 100) : 0;
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  return (
    <Link to={`/projetos/${project.id}`} className="group flex flex-col gap-6 sm:flex-row sm:items-center lg:gap-10">
      <div className="w-full shrink-0 sm:w-52 lg:w-64">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] transition-all duration-500 group-hover:ring-white/[0.14]">
          {project.cover_url ? (
            <img src={project.cover_url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" alt="" />
          ) : (
            <div className="grid h-full place-items-center text-2xs uppercase tracking-[0.2em] text-white/20">Sem capa</div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          <span className={`text-2xs font-medium uppercase tracking-[0.2em] ${tone.text}`}>{STATUS[project.status]}</span>
          <span className="text-2xs uppercase tracking-[0.2em] text-white/25">· {TYPE[project.type]}</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
          {project.name}
        </h2>
        <p className="mt-3 text-sm text-white/45">
          {project.main_artist_name || "—"}
          {project.featuring ? ` · feat. ${project.featuring}` : ""}
        </p>
        {project.description && (
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55 line-clamp-2">{project.description}</p>
        )}
        <div className="mt-8 max-w-md">
          <div className="flex items-baseline justify-between">
            <span className="text-2xs font-medium uppercase tracking-[0.18em] text-white/40">Progresso</span>
            <span className="font-display text-2xl font-bold tabular-nums text-white">{pct}<span className="text-base text-white/40">%</span></span>
          </div>
          <div className="mt-3 h-px w-full overflow-hidden bg-white/[0.08]">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors group-hover:text-primary">
          Abrir projeto <ArrowUpRight size={15} />
        </div>
      </div>
    </Link>
  );
}