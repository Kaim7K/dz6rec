import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAuth } from "@/lib/AuthContext";
import { PlayerProvider } from "@/lib/playerContext";
import Player from "@/components/Player";
import GlobalChat from "@/components/chat/GlobalChat";

const RELOAD_STORAGE_KEY = "dz6_last_global_reload";

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const [teamOpen, setTeamOpen] = useState(() => {
    const preference = localStorage.getItem(`dz6_team_sidebar_${user?.id}`);
    return window.matchMedia('(min-width:1280px)').matches && preference !== 'false';
  });
  const changeTeam = React.useCallback(value => { setTeamOpen(value); localStorage.setItem(`dz6_team_sidebar_${user?.id}`, String(value)); }, [user?.id]);
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return undefined;

    const checkReloadSignal = async () => {
      const flags = await apiClient.entities.SystemFlag.filter({ key: "global_reload" }, "-created_date", 1).catch(() => []);
      const flag = flags[0];
      const nonce = flag?.nonce || flag?.id;
      if (!nonce || localStorage.getItem(RELOAD_STORAGE_KEY) === String(nonce)) return;
      const signalTime = Number(String(nonce).split("-")[0]) || Date.parse(flag?.created_date || "");
      if (signalTime && signalTime < mountedAtRef.current - 1000) {
        localStorage.setItem(RELOAD_STORAGE_KEY, String(nonce));
        return;
      }
      localStorage.setItem(RELOAD_STORAGE_KEY, String(nonce));
      window.location.reload();
    };

    checkReloadSignal();
    return apiClient.entities.SystemFlag.subscribe(checkReloadSignal, { interval: 1000 });
  }, [user]);

  return (
    <PlayerProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 lg:pl-[17rem]">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <div className="dz-chat-workspace" data-team-open={teamOpen ? 'true' : 'false'}><main className="dz-app-content relative mx-auto min-w-0 min-h-[calc(100vh-4rem)] max-w-[1600px] px-4 py-5 pb-36 sm:px-5 lg:px-7 lg:py-7 lg:pb-36 xl:px-9">
            <Outlet />
          </main></div>
        </div>
        <Player />
        {user?.status === 'ativo' && <GlobalChat key={user.id} teamOpen={teamOpen} onTeamChange={changeTeam} />}
      </div>
    </PlayerProvider>
  );
}
