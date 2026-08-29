// Beast Mode: threat scoring for new members. Scores based on account age,
// avatar presence, and raid flags, then bans/kicks/monitors by threshold.
import { sendContainer } from "../sendMessage.js";
import { getMessageTemplate, reportEvent, reportModAction } from "../config.js";

function isWhitelisted(whitelist, id) {
  return (whitelist || []).some((w) => (w.scope === "all" || w.scope === "beast") && w.discord_id === id);
}

export async function scoreMember(member, config, messages, whitelist) {
  const bm = config.beast_mode || {};
  if (!bm.enabled) return;
  if (isWhitelisted(whitelist, member.id)) return;

  const accountAgeHours = (Date.now() - member.user.createdTimestamp) / 3600000;
  let score = bm.base_score || 0;
  const reasons = [];

  if (accountAgeHours < (config.anti_raid?.min_account_age_hours || 24)) {
    score += 30 * (bm.new_account_multiplier || 2);
    reasons.push("new account");
  }
  if (!member.user.avatar) {
    score += 20 * (bm.no_avatar_multiplier || 1.5);
    reasons.push("no avatar");
  }
  score = Math.round(score);

  const banT = bm.ban_threshold || 80;
  const kickT = bm.kick_threshold || 50;
  const monT = bm.monitor_threshold || 25;