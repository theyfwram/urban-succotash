// Anti-Raid: detects join bursts within a time window and triggers a response.
import { sendContainer } from "../sendMessage.js";
import { getMessageTemplate, reportEvent, reportModAction } from "../config.js";

const joinTimes = new Map(); // guildId -> number[]

function isWhitelisted(whitelist, id) {
  return (whitelist || []).some((w) => (w.scope === "all" || w.scope === "anti_raid") && w.discord_id === id);
}

export async function handleAntiRaidJoin(member, config, messages, whitelist) {
  const ar = config.anti_raid || {};
  if (!ar.enabled) return;
  if (isWhitelisted(whitelist, member.id)) return;

  const gid = member.guild.id;
  const now = Date.now();
  const windowMs = (ar.join_window_seconds || 10) * 1000;
  const times = (joinTimes.get(gid) || []).filter((t) => now - t < windowMs);
  times.push(now);
  joinTimes.set(gid, times);

  if (times.length >= (ar.join_threshold || 10)) {
    joinTimes.set(gid, []);
    await triggerRaidResponse(member, ar, messages);
  }
}

async function triggerRaidResponse(member, ar, messages) {
  const action = ar.action || "lockdown";
  const guild = member.guild;
  await reportEvent(guild.id, "raid", {
    details: `${ar.join_threshold || 10} joins in ${ar.join_window_seconds || 10}s`,
    severity: "critical"
  });
  const tpl = getMessageTemplate(messages, "raid");
  if (tpl && ar.lockdown_channel_id) {
    await sendContainer(member.client, ar.lockdown_channel_id, tpl, {
      count: ar.join_threshold || 10, window: ar.join_window_seconds || 10, action
    });
  }
  if (action === "lockdown" && ar.lockdown_channel_id) {
    try {
      const ch = await guild.channels.fetch(ar.lockdown_channel_id);
      await ch.permissionOverwrites.edit(guild.id, { SendMessages: false }, { reason: "Anti-raid lockdown" });
    } catch (e) { console.error("[antiRaid] lockdown failed:", e.message); }
  } else if (action === "kick") {
    try {
      await member.kick("Anti-raid");
      await reportModAction(guild.id, "kick", { targetId: member.id, targetName: member.user.tag, reason: "Anti-raid", source: "auto" });
    } catch (e) { console.error("[antiRaid] kick failed:", e.message); }
  } else if (action === "ban") {
    try {
      await member.ban({ reason: "Anti-raid" });
      await reportModAction(guild.id, "ban", { targetId: member.id, targetName: member.user.tag, reason: "Anti-raid", source: "auto" });
    } catch (e) { console.error("[antiRaid] ban failed:", e.message); }
  }
}