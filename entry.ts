const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { secrets } from "base44:runtime";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { GUILD_IDS, DEFAULT_MESSAGE_KEYS } from "../../shared/constants.js";

// Bot-facing API. The off-platform gateway bot calls this with BOT_SECRET to
// read the full config for a guild and to report events / mod actions back into
// the shared database. No Discord OAuth — secured by the shared secret.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const botSecret = body.botSecret;
    if (!botSecret || botSecret !== secrets.get("BOT_SECRET")) {
      return Response.json({ error: "Invalid bot secret" }, { status: 401 });
    }
    const base44 = createClientFromRequest(req);
    const E = db.asServiceRole.entities;
    const action = body.action;

    if (action === "getConfig") {
      const guildId = body.guildId;
      const cfgList = await E.BotConfig.filter({ guild_id: guildId });
      let config = cfgList[0];
      if (!config) {
        config = await E.BotConfig.create({ guild_id: guildId, enabled: true, welcome: {}, auto_role: {}, anti_nuke: {}, anti_raid: {}, beast_mode: {}, logging: {}, permissions: {} });
      }
      const messages = await E.ContainerMessage.filter({ guild_id: guildId });
      const existingKeys = new Set(messages.map((m) => m.key));
      const toCreate = DEFAULT_MESSAGE_KEYS.filter((k) => !existingKeys.has(k)).map((k) => ({ key: k, ...defaultMessage(k) }));
      if (toCreate.length) {
        const created = await E.ContainerMessage.bulkCreate(toCreate.map((m) => ({ ...m, guild_id: guildId })));
        messages.push(...created);
      }