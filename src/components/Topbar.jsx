import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Topbar({ onMenu }) {
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");
  const [me, setMe] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const navigate = useNavigate();

  const loadNotifs = (user) => {
    if (!user) return;
    base44.entities.Notification.list("-created_date", 40)
      .then((n) => setNotifs(n.filter((x) => x.user_id === user.id)))
      .catch(() => {});
  };

  useEffect(() => {
    let unsub = null;
    base44.auth.me().then((m) => {
      setMe(m);
      loadNotifs(m);
      try { unsub = base44.entities.Notification.subscribe(() => loadNotifs(m)); } catch {}
    }).catch(() => {});
    return () => { if (unsub) unsub(); };
  }, []);

  const unread = notifs.filter((n) => !n.read).length;
  const results = [{ label: "Projetos", to: "/projetos" }, { label: "Artistas", to: "/artistas" }, { label: "Meus trabalhos", to: "/minhas-tarefas" }, { label: "Templates", to: "/templates" }].filter((i) => query && i.label.toLowerCase().includes(query.toLowerCase()));

  const openNotif = async (n) => {
    if (!n.read) await base44.entities.Notification.update(n.id, { read: true }).catch(() => {});
    setPanel(null);
    if (n.link) navigate(n.link);
  };
  const initials = (me?.full_name || me?.email || "U")[0].toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <button onClick={onMenu} className="rounded-lg p-2 text-white/60 hover:bg-white/5 lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
      <div className="relative max-w-md flex-1 sm:max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/15 focus:bg-white/[0.05]" placeholder="Buscar no painel..." />
        {results.length > 0 && <div className="absolute inset-x-0 top-12 overflow-hidden rounded-xl border border-white/[0.08] bg-popover p-1.5 shadow-elev">{results.map((i) => <Link key={i.to} to={i.to} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">{i.label}</Link>)}</div>}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative">
          <button onClick={() => setPanel(panel === "bell" ? null : "bell")} className="relative rounded-xl p-2.5 text-white/55 hover:bg-white/5 hover:text-white"><Bell size={18} />{unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}</button>
          {panel === "bell" && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.08] bg-popover p-1.5 shadow-pop">
              <p className="px-3 py-2 text-2xs font-medium uppercase tracking-[0.16em] text-white/35">Notificações</p>
              {notifs.length === 0 ? <p className="px-3 py-6 text-center text-sm text-white/35">Nenhuma notificação.</p> :
                <div className="max-h-80 overflow-y-auto">{notifs.map((n) => (
                  <button key={n.id} onClick={() => openNotif(n)} className={cn("block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/5", n.read ? "text-white/45" : "text-white/90")}>{n.text}<span className="mt-0.5 block text-2xs text-white/30">{new Date(n.created_date).toLocaleString("pt-BR")}</span></button>
                ))}</div>}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setPanel(panel === "profile" ? null : "profile")} className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-white/5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials}</span>
            <span className="hidden text-sm text-white/70 sm:block">{me?.full_name?.split(" ")[0] || "Conta"}</span>
          </button>
          {panel === "profile" && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-popover p-1.5 shadow-pop">
              <div className="border-b border-white/[0.06] px-3 py-2.5"><p className="text-sm font-medium text-white">{me?.full_name || "Equipe DZ6"}</p><p className="truncate text-2xs text-white/40">{me?.email}</p></div>
              <button onClick={() => base44.auth.logout("/login")} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><LogOut size={15} />Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}