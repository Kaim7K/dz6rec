import React from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { TYPE, STATUS, STATUS_TONE } from "@/lib/music";
import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
import dz6ProfileLogo from "@/assets/dz6-profile.png";
import CatalogTile from "@/components/CatalogTile";

export default function ProjectCard({ project, progress, onEdit, onDeleted }) {
  const pct = progress?.t ? Math.round((progress.d / progress.t) * 100) : 0;
  const tone = STATUS_TONE[project.status] || STATUS_TONE.rascunho;
  return (
    <CatalogTile>
      <Link to={`/projetos/${project.id}`} className="block">
      <div className="dz-catalog-artwork">
        <img src={project.cover_url || dz6ProfileLogo} className="h-full w-full object-cover" alt="" />
      </div>
      <div className="px-0.5 pb-1 pt-3">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          <span className={`text-xs font-medium ${tone.text}`}>{STATUS[project.status]}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 min-h-[2.7rem] break-words font-display text-sm font-medium leading-[1.35rem] text-white">{project.name}</p>
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
        <div className="dz-project-card-actions absolute right-3 top-3 flex gap-1.5 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
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
    </CatalogTile>
  );
}
