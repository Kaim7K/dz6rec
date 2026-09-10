import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { cn } from "@/lib/utils";
import { FolderKanban, House, LayoutTemplate, ListTodo, Mic2, Settings, Users, X } from "lucide-react";

const items = [
  { label: "Início", to: "/", Icon: House },
  { label: "Projetos", to: "/projetos", Icon: FolderKanban },
  { label: "Artistas", to: "/artistas", Icon: Mic2 },
  { label: "Meus trabalhos", to: "/minhas-tarefas", Icon: ListTodo },
  { label: "Templates", to: "/templates", Icon: LayoutTemplate },
  { label: "Usuários", to: "/usuarios", Icon: Users, admin: true },
  { label: "Configurações", to: "/configuracoes", Icon: Settings, admin: true },
];

function NavItem({ label, to, Icon, onClose }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          isActive ? "bg-white/[0.06] text-white" : "text-white/50 hover:bg-white/[0.04] hover:text-white/85"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-opacity", isActive ? "opacity-100" : "opacity-0")} />
          <Icon size={18} className={cn("transition-colors", isActive ? "text-primary" : "text-white/40 group-hover:text-white/70")} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { apiClient.auth.me().then((u) => setIsAdmin(u?.role === "admin")).catch(() => {}); }, []);
  const visible = items.filter((i) => !i.admin || isAdmin);
  const geral = visible.filter((i) => !i.admin);
  const admin = visible.filter((i) => i.admin);
  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onClose} aria-label="Fechar menu" />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.06] bg-[#0b0808] transition-transform duration-300 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-xs font-black text-white ring-1 ring-white/10">DZ6</span>
            <span className="font-display text-sm font-semibold tracking-[0.24em] text-white">DZ6</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white lg:hidden"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 pt-2 text-2xs font-medium uppercase tracking-[0.18em] text-white/25">Geral</p>
          <div className="space-y-0.5">{geral.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
          {admin.length > 0 && (
            <>
              <p className="px-3 pb-2 pt-5 text-2xs font-medium uppercase tracking-[0.18em] text-white/25">Administração</p>
              <div className="space-y-0.5">{admin.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
            </>
          )}
        </nav>
        <div className="px-5 py-5">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
            <p className="text-2xs font-medium uppercase tracking-[0.16em] text-white/30">Painel interno</p>
            <p className="mt-1 text-xs text-white/45">DZ6 · Gravadora</p>
          </div>
        </div>
      </aside>
    </>
  );
}
