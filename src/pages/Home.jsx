import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ProjectCard from "@/components/projects/ProjectCard";
import FeaturedProject from "@/components/home/FeaturedProject";
import MetricStrip from "@/components/home/MetricStrip";
import CargoBadge from "@/components/CargoBadge";
import { CalendarClock, Disc3, FolderKanban, ListTodo, ArrowRight } from "lucide-react";

export default function Home() {
  const [d, setD] = useState(null);
  useEffect(() => {
    Promise.all([base44.entities.Project.list(), base44.entities.ChecklistItem.list(), base44.entities.Cargo.list().catch(() => [])]).then(([projects, items, cargos]) => {
      const byP = {};
      items.forEach((i) => { if (!i.project_id) return; byP[i.project_id] = byP[i.project_id] || { d: 0, t: 0 }; byP[i.project_id].t++; if (i.completed) byP[i.project_id].d++; });
      const pMap = {}; projects.forEach((p) => (pMap[p.id] = p));
      const active = projects
        .filter((p) => !["lancado", "arquivado"].includes(p.status))
        .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      const featured = active[0] || projects[0] || null;
      const rest = active.filter((p) => p.id !== featured?.id);
      const pendingItems = items.filter((i) => !i.completed).sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 6);
      setD({
        projects: rest, featured, pMap, cargos, pendingItems,
        active: active.length,
        inProd: projects.filter((p) => p.status === "producao").length,
        upcoming: projects.filter((p) => p.release_date && new Date(p.release_date) > new Date()).length,
        pending: items.filter((i) => !i.completed).length,
        byP,
      });
    });
  }, []);
  if (!d) return <p className="text-white/40">Carregando...</p>;

  const metrics = [
    { label: "Projetos ativos", value: d.active, icon: FolderKanban },
    { label: "Em produção", value: d.inProd, icon: Disc3 },
    { label: "Próximos lançamentos", value: d.upcoming, icon: CalendarClock },
    { label: "Tarefas pendentes", value: d.pending, icon: ListTodo },
  ];

  return (
    <div className="space-y-12 lg:space-y-16">
      <header>
        <p className="text-2xs font-medium uppercase tracking-[0.2em] text-primary/80">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Bom trabalho, equipe.</h1>
        <p className="mt-2 max-w-lg text-white/40">O que está acontecendo na gravadora hoje.</p>
      </header>

      {d.featured && <FeaturedProject project={d.featured} progress={d.byP[d.featured.id]} />}

      <MetricStrip metrics={metrics} />

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-end justify-between border-b border-white/[0.06] pb-4">
            <h2 className="font-display text-xl font-semibold tracking-tight text-white">Produções em destaque</h2>
            <Link to="/projetos" className="flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white">
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>
          {d.projects.length === 0 ? (
            <p className="py-12 text-sm text-white/30">Nenhuma produção ativa no momento.</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 2xl:grid-cols-3">
              {d.projects.map((p) => <ProjectCard key={p.id} project={p} progress={d.byP[p.id]} />)}
            </div>
          )}
        </div>
        <aside>
          <div className="mb-6 flex items-end justify-between border-b border-white/[0.06] pb-4">
            <h2 className="font-display text-xl font-semibold tracking-tight text-white">Pendências</h2>
            <Link to="/minhas-tarefas" className="flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white">
              Ver <ArrowRight size={13} />
            </Link>
          </div>
          {d.pendingItems.length === 0 ? (
            <p className="text-sm text-white/30">Tudo em dia.</p>
          ) : (
            <div className="space-y-1">
              {d.pendingItems.map((t) => (
                <Link
                  key={t.id}
                  to={t.project_id ? `/projetos/${t.project_id}` : "/minhas-tarefas"}
                  className="group -mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/90 transition-colors group-hover:text-white">{t.text}</p>
                    <p className="mt-0.5 truncate text-2xs uppercase tracking-[0.14em] text-white/35">{d.pMap[t.project_id]?.name || "—"}</p>
                  </div>
                  {t.cargo && <CargoBadge cargo={t.cargo} cargos={d.cargos} small />}
                </Link>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}