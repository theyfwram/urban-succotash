import React, { useState } from "react";
import { useGuildConfig } from "@/lib/GuildConfigContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, ShieldCheck } from "lucide-react";

export default function Whitelist() {
  const { whitelist, loading, addWhitelist, removeWhitelist } = useGuildConfig();
  const [form, setForm] = useState({ discord_id: "", type: "user", name: "", scope: "all" });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!form.discord_id) return;
    setAdding(true);
    try {
      await addWhitelist(form);