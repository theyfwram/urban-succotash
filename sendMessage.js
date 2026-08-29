// Sends a Container V2 message to a channel via discord.js REST.
import { Routes } from "discord.js";
import { buildContainerMessage, fillTemplate } from "./containerV2.js";

export async function sendContainer(client, channelId, template, vars = {}) {
  if (!template || !channelId) return null;
  const filled = fillTemplate(template, vars);
  const body = buildContainerMessage(filled);
  return client.rest.post(Routes.channelMessages(channelId), { body });
}