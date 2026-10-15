import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Music2, UserRound } from "lucide-react";
import { STATUS, STATUS_TONE, TYPE } from "@/lib/music";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

function Cover({ project }) {
  return (
    <div className="aspect-square w-full max-w-[var(--home-cover)] overflow-hidden rounded-lg border border-white/[0.08] bg-black">
      <img src={project.cover_url || dz6ProfileLogo} className="h-full w-full object-cover" alt="" />
    </div>
  );
}

export default function FeaturedProject({ project, progress }) {
  if (!project) return null;
  const pct = progress?.t ? Math.round((progress.d / progress.t) * 100) : 0;
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  const releaseDate = project.release_date
    ? new Date(project.release_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "Sem data";

  return (
    <section className="dz-card relative overflow-hidden p-5 sm:p-6">
      <div className="relative grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-4 [--home-cover:10rem] sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6 xl:grid-cols-[10rem_minmax(0,1fr)_14rem] xl:items-center">
        <Cover project={project} />

        <div className="flex min-w-0 flex-col justify-between gap-5 py-0.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              <span className={`text-2xs font-medium ${tone.text}`}>{STATUS[project.status]}</span>
              <span className="text-2xs text-muted-foreground">· {TYPE[project.type]}</span>
            </div>
            <h2 className="mt-2 break-words font-display text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">{project.name}</h2>
            <p className="mt-1.5 text-sm text-white/52">{project.main_artist_name || "Sem artista"}</p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right text-base font-semibold tabular-nums text-white">{pct}%</span>
            </div>

            <Link to={`/projetos/${project.id}`} className="dz-primary-button w-full sm:w-fit">
              Abrir projeto <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div aria-label="Informações do projeto" className="col-span-2 grid min-w-0 grid-cols-2 gap-4 border-t border-white/[0.08] pt-4 sm:grid-cols-2 xl:col-span-1 xl:grid-cols-1 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="hidden min-w-0 gap-3 xl:flex">
            <span className="hidden h-9 w-9 sm:grid shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]"><UserRound size={17} className="text-muted-foreground" /></span>
            <dl>
              <dt className="text-xs text-muted-foreground">Artista</dt>
              <dd className="mt-1 text-sm font-medium text-white/82">{project.main_artist_name || "Sem artista"}</dd>
            </dl>
          </div>
          <div className="flex min-w-0 gap-3">
            <span className="hidden h-9 w-9 sm:grid shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]"><Music2 size={17} className="text-muted-foreground" /></span>
            <dl>
              <dt className="text-xs text-muted-foreground">Tipo</dt>
              <dd className="mt-1 text-sm font-medium text-white/82">{TYPE[project.type] || project.type}</dd>
            </dl>
          </div>
          <div className="flex min-w-0 gap-3">
            <span className="hidden h-9 w-9 sm:grid shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]"><CalendarDays size={17} className="text-muted-foreground" /></span>
            <dl>
              <dt className="text-xs text-muted-foreground">Lançamento</dt>
              <dd className="mt-1 text-sm font-medium text-white/82">{releaseDate}</dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
