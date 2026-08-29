import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

import { PRIMARY_GUILD_ID } from "@/lib/guilds";
import { useDiscordAuth } from "@/lib/DiscordAuthContext";

const GuildConfigContext = createContext(null);

export function GuildConfigProvider({ children }) {
  const { accessToken, user } = useDiscordAuth();
  const [guildId, setGuildId] = useState(PRIMARY_GUILD_ID);
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [audit, setAudit] = useState([]);
  const [modActions, setModActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {