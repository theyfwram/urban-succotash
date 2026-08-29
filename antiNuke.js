// Anti-Nuke: tracks destructive actions per executor within a time window and
// neutralizes a rogue administrator when thresholds are exceeded. Uses the
// guild audit log to identify the executor of each destructive event.
import { AuditLogEvent } from "discord.js";
import { sendContainer } from "../sendMessage.js";
import { getMessageTemplate, reportEvent, reportModAction } from "../config.js";

const actions = new Map(); // guildId -> Map(executorId -> number[])

function isWhitelisted(whitelist, id) {
  return (whitelist || []).some((w) => (w.scope === "all" || w.scope === "anti_nuke") && w.discord_id === id);
}

function record(gid, executorId, windowSec) {
  const now = Date.now();
  let g = actions.get(gid);
  if (!g) { g = new Map(); actions.set(gid, g); }
  const times = (g.get(executorId) || []).filter((t) => now - t < windowSec * 1000);
  times.push(now);
  g.set(executorId, times);
  return times.length;
}

async function evaluate(guild, executorId, trigger, config, messages, whitelist) {
  const an = config.anti_nuke || {};
  if (!an.enabled) return;
  if (an.use_whitelist && isWhitelisted(whitelist, executorId)) return;

  const windowSec = an.window_seconds || 10;
  const count = record(guild.id, executorId, windowSec);
  const limits = {
    channel_delete: an.max_channel_delete ?? 3,
    role_delete: an.max_role_delete ?? 3,
    ban: an.max_ban ?? 3,
    kick: an.max_kick ?? 5
  };
  const limit = limits[trigger] ?? 3;
  if (count <= limit) return;

  // Threshold exceeded — neutralize the executor.
  await neutralize(guild, executorId, trigger, an, config, messages);
}

async function neutralize(guild, executorId, trigger, an, config, messages) {
  const action = an.action || "ban";
  const member = await guild.members.fetch(executorId).catch(() => null);

  await reportEvent(guild.id, "nuke", {
    actorId: executorId, actorName: member?.user?.tag || executorId,
    details: `trigger=${trigger}, action=${action}`, severity: "critical"
  });

  const tpl = getMessageTemplate(messages, "nuke");
  if (tpl && config.logging?.channel_id) {
    await sendContainer(guild.client, config.logging.channel_id, tpl, {
      actor: member?.user?.tag || executorId, trigger, action
    });
  }

  try {
    if (action === "ban") {
      await guild.bans.create(executorId, { reason: `Anti-nuke: ${trigger}` });
      await reportModAction(guild.id, "ban", { targetId: executorId, targetName: member?.user?.tag || "", reason: `Anti-nuke ${trigger}`, source: "auto" });
    } else if (action === "kick" && member) {
      await member.kick(`Anti-nuke: ${trigger}`);
      await reportModAction(guild.id, "kick", { targetId: executorId, targetName: member?.user?.tag || "", reason: `Anti-nuke ${trigger}`, source: "auto" });
    } else if (action === "strip" && member) {
      const roles = member.roles.cache.filter((r) => r.id !== guild.id && r.editable && r.position < guild.members.me.roles.highest.position);
      await member.roles.remove(roles, `Anti-nuke: ${trigger}`);
      await reportModAction(guild.id, "lock", { targetId: executorId, targetName: member?.user?.tag || "", reason: `Anti-nuke strip ${trigger}`, source: "auto" });
    }
  } catch (e) {
    console.error("[antiNuke] neutralize failed:", e.message);
  }
}

async function getExecutor(guild, type) {
  const logs = await guild.fetchAuditLogs({ limit: 1, type }).catch(() => null);
  const entry = logs?.entries?.first();
  // Only act on very recent entries (within 5s) to avoid old audit log entries.
  if (!entry || !entry.executorId) return null;
  if (Date.now() - entry.createdTimestamp > 5000) return null;
  return entry.executorId;
}

export async function handleAntiNukeChannelDelete(channel, config, messages, whitelist) {
  const executorId = await getExecutor(channel.guild, AuditLogEvent.ChannelDelete);
  if (executorId) await evaluate(channel.guild, executorId, "channel_delete", config, messages, whitelist);
}

export async function handleAntiNukeRoleDelete(role, config, messages, whitelist) {
  const executorId = await getExecutor(role.guild, AuditLogEvent.RoleDelete);
  if (executorId) await evaluate(role.guild, executorId, "role_delete", config, messages, whitelist);
}

export async function handleAntiNukeBan(ban, config, messages, whitelist) {
  const executorId = await getExecutor(ban.guild, AuditLogEvent.MemberBanAdd);
  if (executorId) await evaluate(ban.guild, executorId, "ban", config, messages, whitelist);
}