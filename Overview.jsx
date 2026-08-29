import React, { useState } from "react";
import { useGuildConfig } from "@/lib/GuildConfigContext";
import { useDiscordAuth } from "@/lib/DiscordAuthContext";
import { GUILD_IDS } from "@/lib/guilds";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Terminal, RefreshCw } from "lucide-react";

const FEATURES = [
  { key: "welcome", label: "Welcome System", path: "welcome.enabled" },
  { key: "auto_role", label: "Auto Role", path: "auto_role.enabled" },
  { key: "anti_nuke", label: "Anti-Nuke", path: "anti_nuke.enabled" },
  { key: "anti_raid", label: "Anti-Raid", path: "anti_raid.enabled" },
  { key: "beast_mode", label: "Beast Mode", path: "beast_mode.enabled" },
  { key: "logging", label: "Logging", path: "logging.enabled" }
];