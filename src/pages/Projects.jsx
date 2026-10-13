import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Plus, Disc3 } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import NewProjectDialog from "@/components/projects/NewProjectDialog";
import EditProjectDialog from "@/components/projects/EditProjectDialog";
import { STATUS } from "@/lib/music";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [byP, setByP] = useState({});
  const [artists, setArtists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const load = () => {
    Promise.all([apiClient.entities.Project.list("-created_date"), apiClient.entities.Artist.list(), apiClient.entities.ChecklistTemplate.list(), apiClient.entities.ChecklistItem.list()]).then(([p, a, t, items]) => {
      setProjects(p); setArtists(a); setTemplates(t);
      const m = {};
      items.forEach((i) => { if (!i.project_id) return; m[i.project_id] = m[i.project_id] || { d: 0, t: 0 }; m[i.project_id].t++; if (i.completed) m[i.project_id].d++; });
      setByP(m);
    });
  };
  useEffect(() => { load(); }, []);

  const statusOptions = ["todos", ...Array.from(new Set(projects.map((p) => p.status).filter(Boolean)))];
  const visibleProjects = statusFilter === "todos" ? projects : projects.filter((p) => p.status === statusFilter);

  return (
    <div className="dz-page">
      <header className="dz-page-head">
        <div>
          <p className="dz-kicker">Catálogo</p>
          <h1 className="dz-page-title">Projetos</h1>
          <p className="dz-page-subtitle">Singles, EPs e álbuns em produção na gravadora.</p>
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
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${statusFilter === status ? "bg-white/10 text-white" : "bg-white/[0.025] text-white/45 hover:bg-white/[0.05] hover:text-white/75"}`}
            >
              {status === "todos" ? "Todos" : STATUS[status] || status}
            </button>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="dz-empty">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Disc3 size={22} className="text-white/30" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white/70">Nenhum projeto ainda</p>
            <p className="mt-1 text-sm text-white/35">Crie o primeiro single, EP ou álbum da gravadora.</p>
          </div>
          <button onClick={() => setOpen(true)} className="dz-primary-button mt-2">
            <Plus size={16} /> Novo projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visibleProjects.map((p) => <ProjectCard key={p.id} project={p} progress={byP[p.id]} onEdit={setEditing} onDeleted={load} />)}
        </div>
      )}

      <NewProjectDialog open={open} onClose={() => setOpen(false)} onCreated={load} artists={artists} templates={templates} />
      <EditProjectDialog project={editing} open={!!editing} onClose={() => setEditing(null)} onSaved={load} artists={artists} />
    </div>
  );
}
