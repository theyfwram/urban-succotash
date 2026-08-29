import React, { useEffect, useState } from "react";
import { useGuildConfig } from "@/lib/GuildConfigContext";
import ConfigCard from "@/components/ConfigCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Bell, UserPlus, Bomb, Users, Flame, ScrollText, Lock, Settings } from "lucide-react";

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>