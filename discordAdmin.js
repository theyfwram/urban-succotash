// Verifies that a Discord user (via their OAuth2 access token) is an
// administrator of a given guild. Used to gate every dashboard config action.

import { DISCORD_API } from "./constants.js";

export async function getDiscordUser(accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getGuildMemberSelf(accessToken, guildId) {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return null;
  return res.json();
}

// Returns true if the token's user is an administrator of the guild.
export async function isGuildAdmin(accessToken, guildId) {
  const member = await getGuildMemberSelf(accessToken, guildId);
  if (!member) return false;
  // permissions is a string of bitfield; bit 3 (value 8) = ADMINISTRATOR
  const perms = BigInt(member.permissions || "0");
  return (perms & 8n) !== 0n;
}