// Welcome system + auto-role assignment on member join.
import { sendContainer } from "../sendMessage.js";
import { getMessageTemplate } from "../config.js";

export async function handleWelcome(member, config, messages) {
  const w = config.welcome || {};
  if (!w.enabled || !w.channel_id) return;
  const tpl = getMessageTemplate(messages, w.message_key || "welcome");
  if (!tpl) return;
  try {
    await sendContainer(member.client, w.channel_id, tpl, {
      username: member.user.username,
      member_count: member.guild.memberCount,
      user: member.user.toString()
    });
  } catch (e) {
    console.error("[welcome] failed:", e.message);
  }
}

export async function handleAutoRole(member, config) {
  const ar = config.auto_role || {};
  if (!ar.enabled || !ar.role_id) return;
  const assign = async () => {
    try { await member.roles.add(ar.role_id, "Auto role"); }
    catch (e) { console.error("[autoRole] failed:", e.message); }
  };
  if (ar.delay_seconds > 0) setTimeout(assign, ar.delay_seconds * 1000);
  else await assign();
}