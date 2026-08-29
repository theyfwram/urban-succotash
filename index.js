// Guardian Bot — persistent Discord gateway process.
// Connects to Discord via discord.js, runs all event-driven protection features
// (welcome, auto-role, anti-raid, beast mode, anti-nuke, logging), and reads
// its configuration from the shared Base44 database via the botApi endpoint.
//
// discord.js handles gateway reconnection automatically (shard resume). For
// 24/7 operation, run this with a process manager (pm2, systemd, Docker) on a
// host that stays up — Base44's serverless runtime cannot host this process.
//
// Required Discord intents: Guilds, GuildMembers (privileged), GuildBans.
// Enable "Server Members Intent" in the Discord Developer Portal.

import "dotenv/config";
import {
  Client, GatewayIntentBits, Events, AuditLogEvent
} from "discord.js";
import { getGuildConfig } from "./config.js";
import { handleWelcome, handleAutoRole } from "./features/welcome.js";
import { handleAntiRaidJoin } from "./features/antiRaid.js";
import { scoreMember } from "./features/beastMode.js";
import {
  handleAntiNukeChannelDelete, handleAntiNukeRoleDelete, handleAntiNukeBan
} from "./features/antiNuke.js";
import { logEvent } from "./features/logging.js";

const GUILD_IDS = (process.env.GUILD_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);

if (!process.env.DISCORD_TOKEN) {
  console.error("[bot] Missing DISCORD_TOKEN. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans
  ]
});

client.once(Events.ClientReady, (c) => {
  console.log(`[bot] Logged in as ${c.user.tag}`);
  console.log(`[bot] Managing guilds: ${GUILD_IDS.join(", ") || "(none — set GUILD_IDS)"}`);
});

// ---- Member join: welcome + auto-role + anti-raid + beast mode ----
client.on(Events.GuildMemberAdd, async (member) => {
  if (!GUILD_IDS.includes(member.guild.id)) return;
  try {
    const { config, messages, whitelist } = await getGuildConfig(member.guild.id);
    if (!config.enabled) return;
    await handleWelcome(member, config, messages);
    await handleAutoRole(member, config);
    await handleAntiRaidJoin(member, config, messages, whitelist);
    await scoreMember(member, config, messages, whitelist);
    await logEvent(member.guild, config, messages, "member_join", { target: member.user.tag });
  } catch (e) {
    console.error("[bot] guildMemberAdd error:", e.message);
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  if (!GUILD_IDS.includes(member.guild.id)) return;
  try {
    const { config, messages } = await getGuildConfig(member.guild.id);
    await logEvent(member.guild, config, messages, "member_leave", { target: member.user.tag });
  } catch (e) { console.error("[bot] guildMemberRemove:", e.message); }
});

// ---- Ban events: anti-nuke tracking + logging ----
client.on(Events.GuildBanAdd, async (ban) => {
  if (!GUILD_IDS.includes(ban.guild.id)) return;
  try {
    const { config, messages, whitelist } = await getGuildConfig(ban.guild.id);
    await handleAntiNukeBan(ban, config, messages, whitelist);
    await logEvent(ban.guild, config, messages, "ban", { target: ban.user.tag });
  } catch (e) { console.error("[bot] guildBanAdd:", e.message); }
});

client.on(Events.GuildBanRemove, async (ban) => {
  if (!GUILD_IDS.includes(ban.guild.id)) return;
  try {
    const { config, messages } = await getGuildConfig(ban.guild.id);
    await logEvent(ban.guild, config, messages, "unban", { target: ban.user.tag });
  } catch (e) { console.error("[bot] guildBanRemove:", e.message); }
});

// ---- Channel/Role deletion: anti-nuke ----
client.on(Events.ChannelDelete, async (channel) => {
  if (!channel.guild || !GUILD_IDS.includes(channel.guild.id)) return;
  try {
    const { config, messages, whitelist } = await getGuildConfig(channel.guild.id);
    await handleAntiNukeChannelDelete(channel, config, messages, whitelist);
  } catch (e) { console.error("[bot] channelDelete:", e.message); }
});

client.on(Events.GuildRoleDelete, async (role) => {
  if (!GUILD_IDS.includes(role.guild.id)) return;
  try {
    const { config, messages, whitelist } = await getGuildConfig(role.guild.id);
    await handleAntiNukeRoleDelete(role, config, messages, whitelist);
  } catch (e) { console.error("[bot] roleDelete:", e.message); }
});

// ---- Reconnection / error handling ----
client.on(Events.Error, (e) => console.error("[bot] client error:", e?.message || e));
client.on(Events.ShardDisconnect, (err) => console.warn("[bot] shard disconnected:", err?.message));
client.on(Events.ShardReconnecting, () => console.warn("[bot] shard reconnecting..."));
client.on(Events.ShardResume, () => console.log("[bot] shard resumed"));
client.on(Events.Warn, (w) => console.warn("[bot] warn:", w));

process.on("unhandledRejection", (err) => console.error("[bot] unhandledRejection:", err?.message || err));
process.on("uncaughtException", (err) => {
  console.error("[bot] uncaughtException:", err?.message || err);
  // discord.js will reconnect automatically; keep the process alive.
});

client.login(process.env.DISCORD_TOKEN);