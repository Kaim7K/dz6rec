import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { apiClient } from "@/api/appClient";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAuth } from "@/lib/AuthContext";
import { PlayerProvider } from "@/lib/playerContext";
import Player from "@/components/Player";

const RELOAD_STORAGE_KEY = "dz6_last_global_reload";

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
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
        <div className="min-w-0 lg:pl-60">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-primary px-4 py-3 text-white focus:not-sr-only">Pular para o conteúdo</a>
          <main id="main-content" tabIndex={-1} className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-32 xl:px-10">
            <Outlet />
          </main>
        </div>
        <Player />
      </div>
    </PlayerProvider>
  );
}
