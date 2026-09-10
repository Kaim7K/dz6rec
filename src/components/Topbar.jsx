import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

function LocalMockSwitcher() {
  if (!apiClient.localMock.enabled()) return null;
  const profiles = apiClient.localMock.profiles();
  const current = apiClient.localMock.currentProfileId();

  const changeProfile = (event) => {
    apiClient.localMock.setProfileId(event.target.value);
    window.location.reload();
  };

  const reset = () => {
    apiClient.localMock.reset();
    window.location.reload();
  };

  return (
    <div className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 py-1 xl:flex">
      <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-primary">Sim</span>
      <select
        value={current}
        onChange={changeProfile}
        className="h-8 max-w-56 rounded-lg border border-white/[0.08] bg-background px-2 text-xs text-white outline-none"
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.full_name} · {Array.isArray(profile.cargo) ? profile.cargo.join(", ") : profile.cargo}
          </option>
        ))}
      </select>
      <button type="button" onClick={reset} className="rounded-lg px-2 py-1 text-2xs text-white/45 hover:bg-white/5 hover:text-white">
        Reset
      </button>
    </div>
  );
}

export default function Topbar({ onMenu }) {
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");
  const [me, setMe] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const navigate = useNavigate();

  const loadNotifs = (user) => {
    if (!user) return;
    apiClient.entities.Notification.list("-created_date", 40)
      .then((n) => setNotifs(n.filter((x) => x.user_id === user.id)))
      .catch(() => {});
  };

  useEffect(() => {
    let unsub = null;
    apiClient.auth.me().then((m) => {
      setMe(m);
      loadNotifs(m);
      try { unsub = apiClient.entities.Notification.subscribe(() => loadNotifs(m)); } catch {}
    }).catch(() => {});
    return () => { if (unsub) unsub(); };
  }, []);

  const unread = notifs.filter((n) => !n.read).length;
  const results = [{ label: "Projetos", to: "/projetos" }, { label: "Artistas", to: "/artistas" }, { label: "Meus trabalhos", to: "/minhas-tarefas" }, { label: "Templates", to: "/templates" }].filter((i) => query && i.label.toLowerCase().includes(query.toLowerCase()));

  const openNotif = async (n) => {
    if (!n.read) await apiClient.entities.Notification.update(n.id, { read: true }).catch(() => {});
    setPanel(null);
    if (n.link) navigate(n.link);
  };
  const initials = (me?.full_name || me?.email || "U")[0].toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.065] bg-background/82 px-4 backdrop-blur-xl sm:px-5 lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-white/60 hover:bg-white/5 lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
      <div className="relative max-w-xl flex-1 sm:max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-xl border border-white/[0.075] bg-white/[0.035] pl-11 pr-16 text-sm text-white shadow-soft outline-none placeholder:text-white/32 focus:border-white/[0.14] focus:bg-white/[0.055]" placeholder="Buscar no painel, projetos, artistas..." />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-2xs font-semibold text-white/42">⌘ K</span>
        {results.length > 0 && <div className="absolute inset-x-0 top-12 overflow-hidden rounded-xl border border-white/[0.08] bg-popover p-1.5 shadow-elev">{results.map((i) => <Link key={i.to} to={i.to} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">{i.label}</Link>)}</div>}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <LocalMockSwitcher />
        <div className="relative">
          <button onClick={() => setPanel(panel === "bell" ? null : "bell")} className="relative rounded-xl p-2 text-white/55 hover:bg-white/5 hover:text-white"><Bell size={18} />{unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}</button>
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
        <div className="mx-2 hidden h-8 w-px bg-white/[0.08] sm:block" />
        <div className="relative">
          <button onClick={() => setPanel(panel === "profile" ? null : "profile")} className="flex items-center gap-3 rounded-xl py-1 pl-1 pr-2 hover:bg-white/5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-glow">{initials}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold text-white/88">{me?.full_name?.split(" ")[0] || "Conta"}</span>
              <span className="block text-xs text-white/38">DZ6 Gravadora</span>
            </span>
            <ChevronDown size={15} className="hidden text-white/45 sm:block" />
          </button>
          {panel === "profile" && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-popover p-1.5 shadow-pop">
              <div className="border-b border-white/[0.06] px-3 py-2.5"><p className="text-sm font-medium text-white">{me?.full_name || "Equipe DZ6"}</p><p className="truncate text-2xs text-white/40">{me?.email}</p></div>
              <button onClick={() => apiClient.auth.logout("/login")} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><LogOut size={15} />Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
