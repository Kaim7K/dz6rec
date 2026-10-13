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
          isActive ? "bg-primary/20 text-white shadow-[inset_0_0_0_1px_rgba(220,0,0,0.18)]" : "text-white/48 hover:bg-white/[0.03] hover:text-white/82"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors", isActive ? "bg-primary text-white" : "text-white/42 group-hover:text-white/70")}>
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
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.045] bg-[#070606]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-md bg-black">
              <img src={dz6ProfileLogo} alt="DZ6" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block font-display text-lg font-bold tracking-[0.18em] text-white">DZ6</span>
              <span className="block text-[0.58rem] font-bold uppercase tracking-[0.28em] text-white/35">Gravadora</span>
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white lg:hidden"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-3">
          <p className="px-3 pb-3 pt-1 text-2xs font-bold uppercase tracking-[0.22em] text-white/28">Geral</p>
          <div className="space-y-1">{geral.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
          {admin.length > 0 && (
            <>
              <div className="my-5 h-px bg-white/[0.055]" />
              <p className="px-3 pb-3 text-2xs font-bold uppercase tracking-[0.22em] text-white/28">Administração</p>
              <div className="space-y-1">{admin.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
            </>
          )}
        </nav>
        <div className="px-4 py-5">
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/10 px-4 py-5">
            <div className="absolute bottom-5 right-0 flex h-10 items-end gap-0.5 opacity-30">
              {[16, 24, 18, 30, 22, 36, 20, 28, 34, 18, 25, 31].map((height, index) => <span key={index} className="w-0.5 rounded-full bg-primary" style={{ height }} />)}
            </div>
            <p className="max-w-28 text-sm font-bold leading-5 text-white">Música conecta pessoas</p>
            <p className="mt-4 text-2xs font-bold uppercase tracking-[0.18em] text-white/34">DZ6 Gravadora</p>
          </div>
        </div>
      </aside>
    </>
  );
}
