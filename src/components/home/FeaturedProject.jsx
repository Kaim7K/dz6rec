import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Music2, UserRound } from "lucide-react";
import { STATUS, STATUS_TONE, TYPE } from "@/lib/music";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

function Cover({ project }) {
  return (
    <div className="dz-featured-cover aspect-square w-full overflow-hidden rounded-lg border border-white/[0.08] bg-black">
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
    <section className="dz-featured dz-card relative overflow-hidden p-5 sm:p-6">
      <div className="dz-featured-grid">
        <Cover project={project} />

        <div className="flex min-w-0 flex-col justify-between gap-5 py-0.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              <span className={`text-2xs font-bold uppercase tracking-[0.18em] ${tone.text}`}>{STATUS[project.status]}</span>
              <span className="text-2xs uppercase tracking-[0.18em] text-muted-foreground">· {TYPE[project.type]}</span>
            </div>
            <h2 className="mt-2 break-words font-display text-2xl font-bold leading-[1.05] tracking-tight text-white sm:text-[2rem]">{project.name}</h2>
            <p className="mt-1.5 text-sm text-white/52 [overflow-wrap:anywhere]">{project.main_artist_name || "Sem artista"}</p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-5">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right text-base font-bold tabular-nums text-white">{pct}%</span>
            </div>

            <Link to={`/projetos/${project.id}`} className="inline-flex h-11 self-start items-center gap-3 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90">
              Abrir projeto <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="dz-featured-details grid min-w-0 content-center gap-5 border-t border-white/[0.055] pt-5">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]"><UserRound size={17} className="text-muted-foreground" /></span>
            <dl>
              <dt className="text-xs text-muted-foreground">Artista</dt>
              <dd className="mt-1 text-sm font-bold text-white/82">{project.main_artist_name || "Sem artista"}</dd>
            </dl>
          </div>
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]"><Music2 size={17} className="text-muted-foreground" /></span>
            <dl>
              <dt className="text-xs text-muted-foreground">Tipo</dt>
              <dd className="mt-1 text-sm font-bold text-white/82">{TYPE[project.type] || project.type}</dd>
            </dl>
          </div>
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]"><CalendarDays size={17} className="text-muted-foreground" /></span>
            <dl>
              <dt className="text-xs text-muted-foreground">Lançamento</dt>
              <dd className="mt-1 text-sm font-bold text-white/82">{releaseDate}</dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
