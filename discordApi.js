// Discord REST API helpers used by backend functions (slash-command handler,
// command registration). Uses the bot token from secrets.

import { secrets } from "base44:runtime";
import { DISCORD_API, SLASH_COMMANDS } from "./constants.js";

export function botToken() {
  return secrets.get("DISCORD_TOKEN");
}
export function appId() {
  return secrets.get("DISCORD_APP_ID");
}

export async function discordRequest(path, options = {}) {
  const token = botToken();
  if (!token) throw new Error("DISCORD_TOKEN secret is not set");
  const res = await fetch(`${DISCORD_API}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`Discord API ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function getGuildMember(guildId, userId) {
  return discordRequest(`/guilds/${guildId}/members/${userId}`);
}

export async function banMember(guildId, userId, reason, deleteMessageSeconds = 0) {
  return discordRequest(`/guilds/${guildId}/bans/${userId}`, {
    method: "PUT",
    body: { delete_message_seconds: deleteMessageSeconds, reason: reason || "Banned via bot" }
  });
}

export async function unbanMember(guildId, userId, reason) {
  return discordRequest(`/guilds/${guildId}/bans/${userId}`, {
    method: "DELETE",
    body: { reason: reason || "Unbanned via bot" }
  });
}

export async function kickMember(guildId, userId, reason) {
  return discordRequest(`/guilds/${guildId}/members/${userId}`, {
    method: "DELETE",
    body: { reason: reason || "Kicked via bot" }
  });
}

// "mute" = timeout (communication_disabled_until)
export async function timeoutMember(guildId, userId, durationSeconds, reason) {
  const until = new Date(Date.now() + durationSeconds * 1000).toISOString();
  return discordRequest(`/guilds/${guildId}/members/${userId}`, {
    method: "PATCH",
    body: { communication_disabled_until: until, reason: reason || "Muted via bot" }
  });
}

export async function removeTimeout(guildId, userId, reason) {
  return discordRequest(`/guilds/${guildId}/members/${userId}`, {
    method: "PATCH",
    body: { communication_disabled_until: null, reason: reason || "Unmuted via bot" }
  });
}

// lock: deny SEND_MESSAGES (1<<11) for @everyone (role id == guild id)
export async function lockChannel(guildId, channelId, reason) {
  return discordRequest(`/channels/${channelId}/permissions/${guildId}`, {
    method: "PUT",
    body: { type: 0, id: guildId, deny: String(1 << 11), reason: reason || "Channel locked via bot" }
  });
}

export async function unlockChannel(guildId, channelId, reason) {
  return discordRequest(`/channels/${channelId}/permissions/${guildId}`, {
    method: "PUT",
    body: { type: 0, id: guildId, deny: "0", reason: reason || "Channel unlocked via bot" }
  });
}

export async function sendContainerMessage(channelId, template, vars) {
  const { buildContainerMessage, fillTemplate } = await import("./containerV2.js");
  const filled = fillTemplate(template, vars);
  const msg = buildContainerMessage(filled);
  return discordRequest(`/channels/${channelId}/messages`, { method: "POST", body: msg });
}

// Register (bulk overwrite) guild slash commands.
export async function registerGuildCommands(guildId) {
  const id = appId();
  if (!id) throw new Error("DISCORD_APP_ID secret is not set");
  return discordRequest(`/applications/${id}/guilds/${guildId}/commands`, {
    method: "PUT",
    body: SLASH_COMMANDS
  });
}