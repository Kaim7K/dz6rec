import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import PageLoading from "@/components/PageLoading";
import PageError from "@/components/PageError";
import { Plus, Disc3 } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import NewProjectDialog from "@/components/projects/NewProjectDialog";
import EditProjectDialog from "@/components/projects/EditProjectDialog";
import { STATUS } from "@/lib/music";
import { STATUS_COLORS } from "@/lib/choiceColors";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [byP, setByP] = useState({});
  const [artists, setArtists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const load = () => {
    setLoading(true); setLoadError("");
    return Promise.all([apiClient.entities.Project.list("-created_date"), apiClient.entities.Artist.list(), apiClient.entities.ChecklistTemplate.list(), apiClient.entities.ChecklistItem.list()]).then(([p, a, t, items]) => {
      setProjects(p); setArtists(a); setTemplates(t);
      const m = {};
      items.forEach((i) => { if (!i.project_id) return; m[i.project_id] = m[i.project_id] || { d: 0, t: 0 }; m[i.project_id].t++; if (i.completed) m[i.project_id].d++; });
      setByP(m);
    }).catch(err => setLoadError(err.message || "Não foi possível carregar os projetos.")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const statusOptions = ["todos", ...Array.from(new Set(projects.map((p) => p.status).filter(Boolean)))];
  const visibleProjects = statusFilter === "todos" ? projects : projects.filter((p) => p.status === statusFilter);

  if (loading) return <PageLoading />;
  if (loadError) return <PageError message={loadError} onRetry={load} />;

  return (
    <div className="dz-page">
      <header className="dz-page-head">
        <div>
          <p className="dz-kicker">Catálogo</p>
          <h1 className="dz-page-title">Projetos</h1>
          <p className="dz-page-subtitle">{projects.length} {projects.length === 1 ? 'projeto no catálogo' : 'projetos no catálogo'} · Singles, EPs e álbuns</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="dz-primary-button"
        >
          <Plus size={16} /> Novo projeto
        </button>
      </header>

      {projects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              data-accent={statusFilter === status && STATUS_COLORS[status] ? "true" : undefined}
              style={{ "--choice-color": STATUS_COLORS[status] || "#c20000" }}
              className={`dz-choice-trigger inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === status ? "border-primary/30 bg-primary/12 text-white" : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12] hover:bg-white/[0.045] hover:text-white/75"}`}
            >
              {STATUS_COLORS[status] && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />}
              {status === "todos" ? "Todos" : STATUS[status] || status}
            </button>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="dz-empty">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Disc3 size={22} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white/70">Nenhum projeto ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro single, EP ou álbum da gravadora.</p>
          </div>
          <button onClick={() => setOpen(true)} className="dz-primary-button mt-2">
            <Plus size={16} /> Novo projeto
          </button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="dz-empty"><p>Nenhum projeto com este status.</p><button type="button" className="dz-ghost-button" onClick={() => setStatusFilter("todos")}>Mostrar todos</button></div>
      ) : (
        <div className="dz-catalog-grid">
          {visibleProjects.map((p) => <ProjectCard key={p.id} project={p} progress={byP[p.id]} onEdit={setEditing} onDeleted={load} />)}
        </div>
      )}

      <NewProjectDialog open={open} onClose={() => setOpen(false)} onCreated={load} artists={artists} templates={templates} />
      <EditProjectDialog project={editing} open={!!editing} onClose={() => setEditing(null)} onSaved={load} artists={artists} />
    </div>
  );
}
