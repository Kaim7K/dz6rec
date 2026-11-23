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
      <Link to={`/projetos/${project.id}`} className="block rounded-xl">
      <div className="dz-catalog-artwork">
        <img src={project.cover_thumbnail_url || project.cover_url || dz6ProfileLogo} className="h-full w-full object-cover" alt="" loading="lazy" decoding="async" />
      </div>
      <div className="px-0.5 pb-1 pt-3.5">
        <p className="line-clamp-2 break-words font-display text-base font-semibold leading-6 tracking-tight text-white">{project.name}</p>
        <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">{[project.main_artist_name, TYPE[project.type]].filter(Boolean).join(" · ")}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className={`inline-flex min-w-0 items-center gap-1.5 text-xs font-medium ${tone.text}`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
            <span className="truncate">{STATUS[project.status] || STATUS.rascunho}</span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-label={`Progresso: ${pct}%`}>{pct}%</span>
        </div>
        <div aria-hidden="true" className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white/55" style={{ width: `${pct}%` }} />
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
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/75 text-white/90 transition-colors hover:bg-black"
            >
              <Pencil size={13} />
            </button>
          )}
          {onDeleted && (
            <DeleteProjectButton
              project={project}
              onDeleted={onDeleted}
              className="h-9 w-9 rounded-lg border border-white/10 bg-black/75 p-0 text-white/85 hover:bg-red-950/80 hover:text-red-200"
            />
          )}
        </div>
      )}
    </CatalogTile>
  );
}
