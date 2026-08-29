import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDiscordAuth } from "@/lib/DiscordAuthContext";
import { Loader2 } from "lucide-react";

export default function DiscordProtectedRoute() {
  const { authenticated, loading } = useDiscordAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}