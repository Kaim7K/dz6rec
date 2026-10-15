import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { cn } from "@/lib/utils";
import { FolderKanban, House, LayoutTemplate, ListTodo, Mic2, Settings, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
          "group relative flex items-center min-h-11 gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive ? "bg-primary/[0.09] text-white shadow-[inset_2px_0_0_hsl(var(--primary))]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-white/84"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors", isActive ? "text-red-300" : "text-muted-foreground group-hover:text-white/70")}>
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
  const content = (
    <>
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-white/[0.08] bg-black shadow-soft">
              <img src={dz6ProfileLogo} alt="DZ6" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block font-display text-base font-semibold tracking-[0.16em] text-white">DZ6</span>
              <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Gravadora</span>
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <p className="px-3 pb-3 pt-1 text-2xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Geral</p>
          <div className="space-y-1.5">{geral.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
          {admin.length > 0 && (
            <>
              <div className="my-5 h-px bg-white/[0.055]" />
              <p className="px-3 pb-3 text-2xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Administração</p>
              <div className="space-y-1.5">{admin.map((i) => <NavItem key={i.to} {...i} onClose={onClose} />)}</div>
            </>
          )}
        </nav>
        <div className="mx-4 border-t border-white/[0.08] px-2 py-5">
          <p className="text-xs font-medium text-white/75">Música conecta pessoas.</p>
          <p className="mt-1 text-2xs text-muted-foreground">DZ6 Gravadora</p>
        </div>
    </>
  );
  return (
    <>
      <aside aria-label="Menu principal" className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.08] bg-[#0b0909] lg:flex">{content}</aside>
      <Sheet open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
        <SheetContent side="left" aria-describedby={undefined} className="flex w-[min(18rem,calc(100vw-3rem))] flex-col gap-0 border-white/[0.08] bg-[#0b0909] p-0 lg:hidden">
          <SheetTitle className="sr-only">Navegação principal</SheetTitle>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
