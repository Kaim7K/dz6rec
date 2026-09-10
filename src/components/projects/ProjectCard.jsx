import React from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { TYPE, STATUS, STATUS_TONE } from "@/lib/music";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

export default function ProjectCard({ project, progress, onEdit }) {
  const pct = progress?.t ? Math.round((progress.d / progress.t) * 100) : 0;
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  return (
    <Link to={`/projetos/${project.id}`} className="group block rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-colors duration-300 hover:border-white/[0.09] hover:bg-white/[0.035]">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        <img src={project.cover_url || dz6ProfileLogo} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" alt="" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(project); }}
            aria-label={`Editar ${project.name}`}
            className="absolute right-2.5 top-2.5 rounded-full bg-black/55 p-2 text-white/80 opacity-0 backdrop-blur transition-all duration-300 hover:bg-black/80 hover:text-white group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
      <div className="px-1 pb-1 pt-3">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          <span className={`text-2xs font-medium uppercase tracking-[0.16em] ${tone.text}`}>{STATUS[project.status]}</span>
        </div>
        <p className="mt-2 truncate font-display text-base font-semibold tracking-tight text-white">{project.name}</p>
        <p className="mt-0.5 truncate text-xs text-white/40">{project.main_artist_name || "—"} · {TYPE[project.type]}</p>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="h-px flex-1 overflow-hidden bg-white/[0.08]">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-2xs tabular-nums text-white/40">{pct}%</span>
        </div>
      </div>
    </Link>
  );
}
