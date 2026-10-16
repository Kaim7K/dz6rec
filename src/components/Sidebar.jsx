import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { cn } from "@/lib/utils";
import { FolderKanban, House, LayoutTemplate, ListTodo, Mic2, Settings, Users, X } from "lucide-react";
import dz6ProfileLogo from "@/assets/dz6-profile.png";

const items = [
  { label: "Início", to: "/", Icon: House },
  { label: "Projetos", to: "/projetos", Icon: FolderKanban },
  { label: "Artistas", to: "/artistas", Icon: Mic2 },
  { label: "Minhas tarefas", to: "/minhas-tarefas", Icon: ListTodo },
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
          "group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          isActive ? "bg-white/[0.065] text-white shadow-[inset_3px_0_0_hsl(var(--primary))]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-white/84"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors", isActive ? "text-red-400" : "text-muted-foreground group-hover:text-white/70")}>
            <Icon size={17} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { apiClient.auth.me().then((u) => setIsAdmin(u?.permissao === "superadmin")).catch(() => {}); }, []);
  const visible = items.filter((i) => !i.admin || isAdmin);
  const geral = visible.filter((i) => !i.admin);
  const admin = visible.filter((i) => i.admin);
  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onClose} aria-label="Fechar menu" />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.075] bg-[#0b0a0a] transition-transform duration-200 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-md border border-white/[0.08] bg-black">
              <img src={dz6ProfileLogo} alt="DZ6" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block font-[Montserrat] text-lg font-bold tracking-[0.18em] text-white">DZ6</span>
              <span className="block text-[0.58rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">Gravadora</span>
            </span>
          </div>
          <button aria-label="Fechar menu" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-white lg:hidden"><X size={18} /></button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <p className="px-3 pb-3 pt-1 text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Geral</p>
          <div className="space-y-1">{geral.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
          {admin.length > 0 && (
            <>
              <div className="my-5 h-px bg-white/[0.055]" />
              <p className="px-3 pb-3 text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Administração</p>
              <div className="space-y-1">{admin.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
            </>
          )}
        </nav>
        <div className="dz-sidebar-promo shrink-0 border-t border-white/[0.06] px-7 py-5">
          <p className="text-xs font-medium text-white/65">Workspace DZ6</p>
          <p className="mt-1 text-2xs text-muted-foreground">Gravadora</p>
        </div>
      </aside>
    </>
  );
}
