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
        <div className="lg:pl-60">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="mx-auto max-w-[1600px] overflow-x-hidden px-4 py-6 pb-32 sm:px-6 lg:px-10 lg:py-9 lg:pb-36 xl:px-14">
            <Outlet />
          </main>
        </div>
        <Player />
      </div>
    </PlayerProvider>
  );
}