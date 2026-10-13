import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { PlayerProvider } from "@/lib/playerContext";
import Player from "@/components/Player";

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="lg:pl-64">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="relative mx-auto max-w-[1540px] overflow-x-hidden px-4 py-5 pb-28 sm:px-5 lg:px-7 lg:py-6 lg:pb-32 xl:px-8">
            <Outlet />
          </main>
        </div>
        <Player />
      </div>
    </PlayerProvider>
  );
}
