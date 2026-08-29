import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDiscordAuth } from "@/lib/DiscordAuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";

export default function Login() {
  const { authenticated, exchangeCode, login, loading } = useDiscordAuth();
  const [params] = useSearchParams();
  const code = params.get("code");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) { navigate("/", { replace: true }); return; }
    if (!code || busy) return;
    setBusy(true);
    setError("");