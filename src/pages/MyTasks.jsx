import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { Checkbox } from "@/components/ui/checkbox";
import CargoBadge from "@/components/CargoBadge";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [cargos, setCargos] = useState([]);
  useEffect(() => {
    apiClient.auth.me().then((u) => {
      apiClient.entities.Cargo.list().then(setCargos).catch(() => {});
      apiClient.entities.ChecklistItem.list().then((items) => {
        const mine = items.filter((i) => i.responsible_id === u.id || i.responsible_name === u.full_name || i.responsible_name === u.email);
        setTasks(mine);
        const pids = [...new Set(mine.map((t) => t.project_id).filter(Boolean))];
        Promise.all(pids.map((p) => apiClient.entities.Project.get(p).catch(() => null))).then((ps) => { const m = {}; ps.forEach((p) => { if (p) m[p.id] = p; }); setProjects(m); });
      });
    });
  }, []);
  const toggle = async (t) => { await apiClient.entities.ChecklistItem.update(t.id, { completed: !t.completed }); setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x))); };
  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  return (
    <div className="space-y-7">
      <div>
        <p className="text-2xs font-medium uppercase tracking-[0.18em] text-white/35">Foco</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">Minhas tarefas</h1>
        <p className="mt-1.5 text-white/45">Tudo que precisa da sua atenção hoje.</p>
      </div>
      <section>
        <div className="mb-3 flex items-center gap-2"><h2 className="text-sm font-medium text-white/60">Pendentes</h2><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-2xs text-white/45">{pending.length}</span></div>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 text-center text-sm text-white/35">Nada por aqui.</div>
        ) : (
          <div className="space-y-1.5">{pending.map((t) => (
            <div key={t.id} className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.05]">
              <Checkbox checked={false} onCheckedChange={() => toggle(t)} className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
              <div className="min-w-0 flex-1"><p className="text-sm text-white/85">{t.text}</p>{projects[t.project_id]?.name && <Link to={`/projetos/${t.project_id}`} className="text-2xs text-white/40 hover:text-white/70">{projects[t.project_id].name}</Link>}</div>
              {t.cargo && <CargoBadge cargo={t.cargo} cargos={cargos} small />}
            </div>
          ))}</div>
        )}
      </section>
      {done.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2"><h2 className="text-sm font-medium text-white/40">Concluídas</h2><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-2xs text-white/35">{done.length}</span></div>
          <div className="space-y-1.5">{done.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 opacity-50">
              <Checkbox checked onCheckedChange={() => toggle(t)} className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
              <p className="text-sm text-white/60 line-through">{t.text}</p>
            </div>
          ))}</div>
        </section>
      )}
    </div>
  );
}