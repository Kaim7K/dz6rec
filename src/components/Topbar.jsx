import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { PERMISSAO, cargoList } from "@/lib/music";

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
    <div className="hidden items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-1 xl:flex">
      <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-red-300">Sim</span>
      <select
        aria-label="Perfil de simulação"
        value={current}
        onChange={changeProfile}
        className="h-8 max-w-56 rounded-md border border-white/[0.08] bg-background px-2 text-xs text-white outline-none"
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.full_name} · {Array.isArray(profile.cargo) ? profile.cargo.join(", ") : profile.cargo}
          </option>
        ))}
      </select>
      <button type="button" onClick={reset} className="rounded-md px-2 py-1 text-2xs text-muted-foreground hover:bg-white/5 hover:text-white">
        Reset
      </button>
    </div>
  );
}

export default function Topbar({ onMenu }) {
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");
  const [notifs, setNotifs] = useState([]);
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const loadNotifs = (user) => {
    if (!user) {
      setNotifs([]);
      return;
    }
    apiClient.entities.Notification.list("-created_date", 40)
      .then((n) => setNotifs(n.filter((x) => x.user_id === user.id)))
      .catch(() => {});
  };

  useEffect(() => {
    if (!me) {
      setNotifs([]);
      return undefined;
    }
    let unsub = null;
    loadNotifs(me);
    try { unsub = apiClient.entities.Notification.subscribe(() => loadNotifs(me), { interval: 900 }); } catch {}
    return () => { if (unsub) unsub(); };
  }, [me]);

  const unread = notifs.filter((n) => !n.read).length;
  const results = [{ label: "Projetos", to: "/projetos" }, { label: "Artistas", to: "/artistas" }, { label: "Meus trabalhos", to: "/minhas-tarefas" }, { label: "Templates", to: "/templates" }].filter((i) => query && i.label.toLowerCase().includes(query.toLowerCase()));

  const openNotif = async (n) => {
    if (!n.read) await apiClient.entities.Notification.update(n.id, { read: true }).catch(() => {});
    setPanel(null);
    if (n.link) navigate(n.link);
  };
  const initials = (me?.full_name || me?.email || "U")[0].toUpperCase();
  const profileLabel = cargoList(me?.cargo)[0] || PERMISSAO[me?.permissao] || "Equipe DZ6";

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-white/[0.075] bg-[#0b0a0a]/95 px-3 backdrop-blur-sm sm:gap-3 sm:px-5 lg:px-7">
      <button onClick={onMenu} className="dz-icon-button lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
      <div className="relative min-w-0 max-w-xl flex-1 sm:max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input aria-label="Buscar no painel" value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-md border border-white/[0.085] bg-white/[0.038] pl-11 pr-3 text-sm text-white outline-none placeholder:text-white/36 focus:border-primary/45 focus:bg-white/[0.055] sm:pr-16" placeholder="Buscar no painel..." />
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/[0.1] bg-black/20 px-2 py-1 text-2xs font-semibold text-muted-foreground sm:block">⌘ K</span>
        {results.length > 0 && <div className="absolute inset-x-0 top-12 max-h-[min(22rem,calc(100svh-5rem))] overflow-y-auto rounded-lg border border-white/[0.08] bg-popover p-1.5 shadow-elev">{results.map((i) => <Link key={i.to} to={i.to} onClick={() => setQuery("")} className="block rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">{i.label}</Link>)}</div>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
        <LocalMockSwitcher />
        <div className="relative">
          <button aria-label="Notificações" aria-expanded={panel === "bell"} onClick={() => setPanel(panel === "bell" ? null : "bell")} className="dz-icon-button relative border-0"><Bell size={18} />{unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}</button>
          {panel === "bell" && (
            <div className="absolute right-[-3.25rem] mt-2 max-h-[calc(100dvh-5.5rem)] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-lg border border-white/[0.08] bg-popover p-1.5 shadow-pop sm:right-0">
              <p className="px-3 py-2 text-2xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Notificações</p>
              {notifs.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação.</p> :
                <div className="max-h-80 overflow-y-auto">{notifs.map((n) => (
                  <button key={n.id} onClick={() => openNotif(n)} className={cn("block w-full rounded-md px-3 py-2.5 text-left text-sm hover:bg-white/5", n.read ? "text-muted-foreground" : "text-white/90")}>{n.text}<span className="mt-0.5 block text-2xs text-muted-foreground">{new Date(n.created_date).toLocaleString("pt-BR")}</span></button>
                ))}</div>}
            </div>
          )}
        </div>
        <div className="mx-2 hidden h-8 w-px bg-white/[0.08] sm:block" />
        <div className="relative">
          <button aria-label="Menu da conta" aria-expanded={panel === "profile"} onClick={() => setPanel(panel === "profile" ? null : "profile")} className="flex min-w-0 items-center gap-2 rounded-md py-1 pl-1 pr-1 hover:bg-white/5 sm:gap-3 sm:pr-2">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-soft">
              {me?.photo_url ? <img src={me.photo_url} alt="" className="h-full w-full object-cover" /> : initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block max-w-36 truncate text-sm font-semibold text-white/88">{me?.full_name?.split(" ")[0] || "Conta"}</span>
              <span className="block max-w-36 truncate text-xs text-muted-foreground">{profileLabel}</span>
            </span>
            <ChevronDown size={15} className="hidden text-muted-foreground sm:block" />
          </button>
          {panel === "profile" && (
            <div className="absolute right-0 mt-2 w-[min(14rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-white/[0.08] bg-popover p-1.5 shadow-pop">
              <div className="border-b border-white/[0.06] px-3 py-2.5"><p className="text-sm font-medium text-white">{me?.full_name || "Equipe DZ6"}</p><p className="truncate text-2xs text-muted-foreground">{me?.email}</p><p className="mt-1 truncate text-2xs text-muted-foreground">{profileLabel}</p></div>
              <button onClick={() => apiClient.auth.logout("/login")} className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><LogOut size={15} />Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
