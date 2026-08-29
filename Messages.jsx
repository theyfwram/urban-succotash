import React, { useState } from "react";
import { useGuildConfig } from "@/lib/GuildConfigContext";
import ContainerV2Preview from "@/components/ContainerV2Preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Plus, Trash2, MessageSquare } from "lucide-react";

const SAMPLE_VARS = { username: "NewUser", member_count: 42, target: "BadActor", reason: "Spamming", duration: 30, channel: "#general", count: 12, window: 10, action: "Lockdown", actor: "RogueMod", trigger: "mass channel delete", score: 87, level: "CRITICAL" };

const STYLE_OPTIONS = ["primary", "secondary", "success", "danger", "link"];

export default function Messages() {
  const { messages, loading, saveMessage, deleteMessage } = useGuildConfig();
  const [selectedKey, setSelectedKey] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);