// Target guilds managed by this bot + dashboard.
export const GUILD_IDS = ["1543300864964563047", "1538652563212075041"];
export const PRIMARY_GUILD_ID = GUILD_IDS[0];

// Discord API base
export const DISCORD_API = "https://discord.com/api/v10";

// Components V2 flag
export const IS_COMPONENTS_V2 = 1 << 15;

// Slash command definitions registered with Discord.
export const SLASH_COMMANDS = [
  {
    name: "ban",
    description: "Ban a member from the server",
    options: [
      { name: "user", description: "The user to ban", type: 6, required: true },
      { name: "reason", description: "Reason for the ban", type: 3, required: false },
      { name: "delete_days", description: "Days of messages to delete (0-7)", type: 4, required: false, min_value: 0, max_value: 7 }
    ],
    default_member_permissions: "4", // BAN_MEMBERS
    dm_permission: false
  },
  {
    name: "kick",
    description: "Kick a member from the server",
    options: [
      { name: "user", description: "The user to kick", type: 6, required: true },
      { name: "reason", description: "Reason for the kick", type: 3, required: false }
    ],
    default_member_permissions: "2", // KICK_MEMBERS
    dm_permission: false
  },
  {
    name: "mute",
    description: "Timeout (mute) a member",
    options: [
      { name: "user", description: "The user to mute", type: 6, required: true },
      { name: "duration", description: "Duration in minutes", type: 4, required: true, min_value: 1, max_value: 40320 },
      { name: "reason", description: "Reason for the mute", type: 3, required: false }
    ],
    default_member_permissions: "268435456", // MODERATE_MEMBERS
    dm_permission: false
  },
  {
    name: "lock",
    description: "Lock a channel (deny Send Messages for @everyone)",
    options: [
      { name: "channel", description: "Channel to lock (defaults to current)", type: 7, required: false, channel_types: [0] },
      { name: "reason", description: "Reason for locking", type: 3, required: false }
    ],
    default_member_permissions: "16", // MANAGE_CHANNELS
    dm_permission: false
  }
];

// Default Container V2 message templates seeded for each guild.
export const DEFAULT_MESSAGE_KEYS = [
  "welcome", "ban", "kick", "mute", "lock", "unban", "raid", "nuke", "beast"
];