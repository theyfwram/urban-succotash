// Fetches the live config for a guild from the shared Base44 database.
// The dashboard writes config; the bot reads it here. Cached for 15s.

import "dotenv/config";

const BOT_API_URL = process.env.BASE44_BOT_API_URL;
const BOT_SECRET = process.env.BOT_SECRET;

if (!BOT_API_URL || !BOT_SECRET) {
  console.error("[config] Missing BASE44_BOT_API_URL or BOT_SECRET. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const cache = new Map(); // guildId -> { data, expires }
const TTL = 15000;

async function callBotApi(body) {
  const res = await fetch(BOT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botSecret: BOT_SECRET, ...body })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`botApi ${res.status}: ${data.error || res.statusText}`);
  return data;
}

export async function getGuildConfig(guildId) {
  const cached = cache.get(guildId);
  if (cached && cached.expires > Date.now()) return cached.data;
  const data = await callBotApi({ action: "getConfig", guildId });
  cache.set(guildId, { data, expires: Date.now() + TTL });
  return data;
}

export async function reportEvent(guildId, event, fields = {}) {
  try {
    await callBotApi({
      action: "reportEvent",
      guildId,
      event,
      actorId: fields.actorId || "",
      actorName: fields.actorName || "",
      targetId: fields.targetId || "",
      targetName: fields.targetName || "",
      reason: fields.reason || "",
      details: fields.details || "",
      severity: fields.severity || "info"
    });
  } catch (e) {
    console.error("[config] reportEvent failed:", e.message);
  }
}

export async function reportModAction(guildId, action, fields = {}) {
  try {
    await callBotApi({
      action: "reportModAction",
      guildId,
      action,
      targetId: fields.targetId || "",
      targetName: fields.targetName || "",
      moderatorId: fields.moderatorId || "",
      moderatorName: fields.moderatorName || "",
      reason: fields.reason || "",
      durationSeconds: fields.durationSeconds || 0,
      expiresAt: fields.expiresAt || "",
      active: fields.active !== false,
      source: fields.source || "auto"
    });
  } catch (e) {
    console.error("[config] reportModAction failed:", e.message);
  }
}

export function invalidateConfig(guildId) {
  cache.delete(guildId);
}

export function getMessageTemplate(messages, key) {
  return messages.find((m) => m.key === key && m.enabled !== false);
}