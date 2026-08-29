const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

# Guardian Bot — Persistent Gateway Process

This is the **always-on Discord bot** half of the Guardian Bot project. It connects
to Discord via the Gateway (a persistent WebSocket), runs all the event-driven
protection features, and reads its configuration from the **shared Base44
database** (the same database the web dashboard writes to).

> The Base44 platform cannot host a 24/7 Gateway connection, so this process runs
> **separately** on any always-on host (a VPS, Railway, Fly.io, a Docker
> container, pm2, systemd, etc.). The web dashboard runs on Base44 and shares
> the same config via the `botApi` backend function.

## What runs here

| Feature | Trigger | Behavior |
|---|---|---|
| Welcome | `guildMemberAdd` | Sends a Container V2 welcome message to the configured channel |
| Auto Role | `guildMemberAdd` | Assigns a role (optionally delayed) |
| Anti-Raid | `guildMemberAdd` (burst) | Detects join bursts, locks down / kicks / bans |
| Beast Mode | `guildMemberAdd` | Threat-scores new members (account age, avatar, raid flag) and bans/kicks/monitors by threshold |
| Anti-Nuke | `channelDelete`, `roleDelete`, `guildBanAdd` | Tracks per-executor destructive actions via audit log, neutralizes rogue admins |
| Logging | all events | Sends a Container V2 log message + writes to the shared audit log |

Every bot message uses **Discord Components V2 (Container V2)** — no embeds, no
plain messages. Slash commands (`/ban`, `/kick`, `/mute`, `/lock`) are handled by
the Base44 `discordInteractions` function (HTTP Interactions), not this process.

## Setup

1. **Discord Developer Portal**
   - Create an application + bot.
   - Enable **Server Members Intent** (Privileged Gateway Intents) — required for
     `guildMemberAdd`.
   - Copy the bot token.

2. **Base44 dashboard**
   - Set the secrets: `DISCORD_TOKEN`, `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY`,
     `DISCORD_CLIENT_SECRET`, `BOT_SECRET`.
   - Publish the app (needed for a stable function URL + OAuth redirect URI).
   - In Discord OAuth2 settings, add the dashboard URL + `/login` as a redirect URI.
   - Point the Discord **Interactions Endpoint URL** at the published
     `discordInteractions` function URL (Dashboard → Code → Functions →
     discordInteractions → API/Webhook usage).

3. **This process**
   ```bash
   cp .env.example .env
   # fill in DISCORD_TOKEN, BASE44_BOT_API_URL, BOT_SECRET, GUILD_IDS
   npm install
   npm start
   ```
   `BASE44_BOT_API_URL` is the published `botApi` function URL
   (`https://<your-app>.db.app/api/functions/invoke/botApi`).
   `BOT_SECRET` must match the secret set in the Base44 dashboard.

4. **Register slash commands** from the dashboard → Overview →
   "Register Slash Commands". (Or call the `registerCommands` function.)

## 24/7 operation

Use a process manager so the bot restarts on crash and survives reboots:

```bash
npm install -g pm2
pm2 start index.js --name guardian-bot
pm2 save
pm2 startup
```

discord.js reconnects the gateway automatically on transient disconnects
(shard resume). The `uncaughtException` handler keeps the process alive where
possible; pm2 restarts it if it exits.

## Shared data flow

```
Dashboard (Base44)  ──writes──►  BotConfig / ContainerMessage / Whitelist entities
                                         ▲
                                         │ getConfig / reportEvent / reportModAction
                                         │ (BOT_SECRET)
                                   Guardian Bot (this process)
```

Dashboard changes take effect within the config cache TTL (15s).