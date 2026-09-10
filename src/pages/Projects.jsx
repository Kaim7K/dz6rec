import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/appClient";
import { Plus, Disc3 } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import NewProjectDialog from "@/components/projects/NewProjectDialog";
import EditProjectDialog from "@/components/projects/EditProjectDialog";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [byP, setByP] = useState({});
  const [artists, setArtists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const load = () => {
    Promise.all([apiClient.entities.Project.list("-created_date"), apiClient.entities.Artist.list(), apiClient.entities.ChecklistTemplate.list(), apiClient.entities.ChecklistItem.list()]).then(([p, a, t, items]) => {
      setProjects(p); setArtists(a); setTemplates(t);
      const m = {};
      items.forEach((i) => { if (!i.project_id) return; m[i.project_id] = m[i.project_id] || { d: 0, t: 0 }; m[i.project_id].t++; if (i.completed) m[i.project_id].d++; });
      setByP(m);
    });
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-10 lg:space-y-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xs font-medium uppercase tracking-[0.2em] text-primary/80">CatÃ¡logo</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Projetos</h1>
          <p className="mt-2 text-white/40">Singles, EPs e Ã¡lbuns da gravadora.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus size={16} /> Novo projeto
        </button>
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Disc3 size={22} className="text-white/30" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white/70">Nenhum projeto ainda</p>
            <p className="mt-1 text-sm text-white/35">Crie o primeiro single, EP ou Ã¡lbum da gravadora.</p>
          </div>
          <button onClick={() => setOpen(true)} className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus size={16} /> Novo projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} progress={byP[p.id]} onEdit={setEditing} />)}
        </div>
      )}

      <NewProjectDialog open={open} onClose={() => setOpen(false)} onCreated={load} artists={artists} templates={templates} />
      <EditProjectDialog project={editing} open={!!editing} onClose={() => setEditing(null)} onSaved={load} artists={artists} />
    </div>
  );
}