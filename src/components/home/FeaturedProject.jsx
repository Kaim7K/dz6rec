import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays } from "lucide-react";
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
    <section className="dz-featured relative min-w-0">
      <div className="dz-featured-grid">
        <Cover project={project} />

        <div className="dz-featured-summary flex min-w-0 flex-col gap-6">
          <div className="min-w-0">
            <p className="dz-kicker mb-5">Em destaque</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              <span className={`text-xs font-medium ${tone.text}`}>{STATUS[project.status]}</span>
              <span className="text-xs text-muted-foreground">· {TYPE[project.type]}</span>
            </div>
            <h2 className="dz-featured-title mt-3 break-words font-display font-semibold tracking-tight text-white">{project.name}</h2>
            <p className="mt-2 text-base text-white/65 [overflow-wrap:anywhere]">{project.main_artist_name || "Sem artista"}</p>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays size={14} className="shrink-0" /><span>Lançamento · {releaseDate}</span></p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-4 text-xs"><span className="text-muted-foreground">Progresso do projeto</span><span className="font-medium tabular-nums text-white">{pct}%</span></div>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <Link to={`/projetos/${project.id}`} className="dz-primary-button self-start">
              Abrir projeto <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
