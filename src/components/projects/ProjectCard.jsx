import React from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { TYPE, STATUS, STATUS_TONE } from "@/lib/music";
import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

export default function ProjectCard({ project, progress, onEdit, onDeleted }) {
  const pct = progress?.t ? Math.round((progress.d / progress.t) * 100) : 0;
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#111010] p-2.5 shadow-soft transition-colors duration-300 hover:border-white/[0.14] hover:bg-[#171414]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-70" />
      <Link to={`/projetos/${project.id}`} className="block">
      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-white/[0.06] bg-black">
        <img src={project.cover_url || dz6ProfileLogo} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" alt="" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="px-1 pb-1 pt-3">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          <span className={`text-2xs font-medium uppercase tracking-[0.16em] ${tone.text}`}>{STATUS[project.status]}</span>
        </div>
        <p className="mt-2 line-clamp-2 min-h-[2.7rem] break-words font-display text-base font-semibold tracking-tight text-white">{project.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{project.main_artist_name || "—"} · {TYPE[project.type]}</p>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-2xs tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </div>
      </Link>
      {(onEdit || onDeleted) && (
        <div className="absolute right-5 top-5 flex gap-1.5 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              aria-label={`Editar ${project.name}`}
              className="rounded-md bg-black/55 p-2 text-white/80 backdrop-blur transition-colors hover:bg-black/80 hover:text-white"
            >
              <Pencil size={13} />
            </button>
          )}
          {onDeleted && (
            <DeleteProjectButton
              project={project}
              onDeleted={onDeleted}
              className="h-[1.8125rem] w-[1.8125rem] rounded-md bg-black/55 p-0 text-white/75 backdrop-blur hover:bg-red-950/80 hover:text-red-200"
            />
          )}
        </div>
      )}
    </div>
  );
}
