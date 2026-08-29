// Logging: sends a Container V2 message to the configured log channel and
// records the event in the shared Base44 audit log.
import { sendContainer } from "../sendMessage.js";
import { getMessageTemplate, reportEvent } from "../config.js";

export async function logEvent(guild, config, messages, event, fields = {}) {
  await reportEvent(guild.id, event, fields);
  const lg = config.logging || {};
  if (!lg.enabled || !lg.channel_id) return;
  if (Array.isArray(lg.events) && lg.events.length && !lg.events.includes(event)) return;

  let tpl = getMessageTemplate(messages, event);
  if (!tpl) {
    tpl = { title: event, description: fields.details || fields.target || "", color: 5814273, emoji: "📋" };
  }
  try {
    await sendContainer(guild.client, lg.channel_id, tpl, {
      ...fields,
      target: fields.target || "",
      reason: fields.reason || "",
      actor: fields.actor || ""
    });
  } catch (e) {
    console.error("[logging] send failed:", e.message);
  }
}