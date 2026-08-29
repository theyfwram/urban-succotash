import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { GuildConfigProvider } from "@/lib/GuildConfigContext";

export default function DashboardLayout() {
  return (
    <GuildConfigProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </GuildConfigProvider>
  );
}