import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { PRIMARY_GUILD_ID } from "@/lib/guilds";

const DiscordAuthContext = createContext(null);

const STORAGE_TOKEN = "discord_access_token";
const STORAGE_USER = "discord_user";

export function DiscordAuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(STORAGE_TOKEN));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_USER) || "null"); } catch { return null; }
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();