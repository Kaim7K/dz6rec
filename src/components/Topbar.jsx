import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const searchRef = useRef(null);
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

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
      if (event.key === "Escape") { setPanel(null); setQuery(""); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;
  const results = [{ label: "Projetos", to: "/projetos" }, { label: "Artistas", to: "/artistas" }, { label: "Minhas tarefas", to: "/minhas-tarefas" }, { label: "Templates", to: "/templates" }].filter((i) => query && i.label.toLowerCase().includes(query.toLowerCase()));

  const openNotif = async (n) => {
    if (!n.read) await apiClient.entities.Notification.update(n.id, { read: true }).catch(() => {});
    setPanel(null);
    if (n.link) navigate(n.link);
  };
  const initials = (me?.full_name || me?.email || "U")[0].toUpperCase();
  const profileLabel = cargoList(me?.cargo)[0] || PERMISSAO[me?.permissao] || "Equipe DZ6";

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b border-white/[0.08] bg-background/95 px-3 backdrop-blur-md sm:gap-4 sm:px-6 lg:px-8 xl:px-10">
      <button onClick={onMenu} className="dz-icon-button lg:hidden" aria-label="Abrir menu"><Menu size={20} /></button>
      <div className="relative min-w-0 max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar no painel" aria-controls={query ? "navigation-search" : undefined} className="dz-input w-full pl-9 pr-3 sm:pr-16" placeholder="Buscar no painel..." />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-muted-foreground sm:block">Ctrl K</kbd>
        {query && <div id="navigation-search" className="dz-popover absolute inset-x-0 top-12 max-h-[calc(100dvh-6rem)] overflow-y-auto">{results.length ? results.map((item) => <Link key={item.to} to={item.to} onClick={() => setQuery("")} className="block rounded-md px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white">{item.label}</Link>) : <p className="px-3 py-4 text-sm text-muted-foreground">Nenhuma página encontrada.</p>}</div>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <LocalMockSwitcher />
        <Popover open={panel === "bell"} onOpenChange={(open) => setPanel(open ? "bell" : null)}>
          <PopoverTrigger asChild>
            <button className="dz-icon-button relative" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}><Bell size={18} />{unread > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}</button>
          </PopoverTrigger>
          <PopoverContent aria-label="Notificações" align="end" sideOffset={10} className="w-80 p-1.5">
            <h2 className="border-b border-white/[0.08] px-3 py-3 text-sm font-semibold">Notificações</h2>
            {notifs.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">Tudo em dia. Nenhuma notificação.</p> : <div className="max-h-[min(24rem,60dvh)] overflow-y-auto">{notifs.map((notification) => <button key={notification.id} onClick={() => openNotif(notification)} className={cn("block w-full rounded-md px-3 py-3 text-left text-sm hover:bg-white/5", notification.read ? "text-muted-foreground" : "text-white/90")}>{notification.text}<span className="mt-1 block text-2xs text-muted-foreground">{new Date(notification.created_date).toLocaleString("pt-BR")}</span></button>)}</div>}
          </PopoverContent>
        </Popover>
        <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />
        <Popover open={panel === "profile"} onOpenChange={(open) => setPanel(open ? "profile" : null)}>
          <PopoverTrigger asChild>
            <button aria-label="Menu da conta" className="flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-md p-1 hover:bg-white/5 sm:pr-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-primary/15 text-xs font-semibold text-red-200">{me?.photo_url ? <img src={me.photo_url} alt="" className="h-full w-full object-cover" /> : initials}</span>
              <span className="hidden min-w-0 text-left sm:block"><span className="block max-w-28 truncate text-xs font-medium text-white/90">{me?.full_name?.split(" ")[0] || "Conta"}</span><span className="block max-w-28 truncate text-2xs text-muted-foreground">{profileLabel}</span></span>
              <ChevronDown size={14} className="hidden text-muted-foreground sm:block" />
            </button>
          </PopoverTrigger>
          <PopoverContent aria-label="Menu da conta" align="end" sideOffset={10} className="w-64 p-1.5">
            <div className="border-b border-white/[0.08] px-3 py-3"><p className="break-words text-sm font-medium text-white">{me?.full_name || "Equipe DZ6"}</p><p className="mt-1 break-all text-xs text-muted-foreground">{me?.email}</p><p className="mt-1 text-xs text-muted-foreground">{profileLabel}</p></div>
            <button onClick={() => apiClient.auth.logout("/login")} className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"><LogOut size={15} />Sair</button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
