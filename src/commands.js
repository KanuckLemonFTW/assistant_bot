const { SlashCommandBuilder, ChannelType } = require("discord.js");
const db = require("./database");
const { isAdmin, isOwner, formatUser, logAction, parseTime } = require("./utils");

module.exports = [

/* =========================
   OWNER / SETUP COMMANDS
========================= */

{
  data: new SlashCommandBuilder()
    .setName("setup-adminroles")
    .setDescription("Set admin roles (owner only)")
    .addStringOption(opt => opt.setName("roles").setDescription("Comma-separated roles").setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ content: "Owner only.", ephemeral: true });
    const roles = interaction.options.getString("roles").split(",").map(r => r.trim());
    db.setAdminRoles(roles);
    interaction.reply({ content: `✅ Admin roles set: ${roles.join(", ")}`, ephemeral: true });
  }
},

{
  data: new SlashCommandBuilder()
    .setName("setup-reset")
    .setDescription("Reset bot settings (owner only)"),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ content: "Owner only.", ephemeral: true });
    db.setAdminRoles([]);
    db.setAutomod("caps", { enabled: false });
    interaction.reply({ content: "⚙️ Bot settings reset.", ephemeral: true });
  }
},

{
  data: new SlashCommandBuilder()
    .setName("setup-import")
    .setDescription("Import settings (owner only)"),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ content: "Owner only.", ephemeral: true });
    interaction.reply({ content: "⚙️ Settings import placeholder.", ephemeral: true });
  }
},

{
  data: new SlashCommandBuilder()
    .setName("setup-export")
    .setDescription("Export settings (owner only)"),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ content: "Owner only.", ephemeral: true });
    interaction.reply({ content: "⚙️ Settings export placeholder.", ephemeral: true });
  }
},

/* =========================
   MODERATION COMMANDS
========================= */

{
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .addUserOption(opt => opt.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(opt => opt.setName("reason").setDescription("Reason for ban"))
    .addIntegerOption(opt => opt.setName("days").setDescription("Delete messages (days)")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason";
    const days = interaction.options.getInteger("days") || 0;

    await interaction.guild.members.ban(user.id, { reason, deleteMessageDays: days });
    db.addBan(user.id, reason);
    logAction(interaction.guild, `🔨 ${user.tag} banned | ${reason}`);
    interaction.reply(`✅ Banned **${user.tag}**`);
  }
},

{
  data: new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Softban a user (ban & unban to delete messages)")
    .addUserOption(opt => opt.setName("user").setDescription("User to softban").setRequired(true))
    .addStringOption(opt => opt.setName("reason").setDescription("Reason")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason";
    await interaction.guild.members.ban(user.id, { reason, deleteMessageDays: 7 });
    await interaction.guild.members.unban(user.id, "Softban automatic unban");
    logAction(interaction.guild, `⚡ ${user.tag} softbanned | ${reason}`);
    interaction.reply(`✅ Softbanned **${user.tag}**`);
  }
},

{
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .addUserOption(opt => opt.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption(opt => opt.setName("reason").setDescription("Reason")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason";
    await member.kick(reason);
    logAction(interaction.guild, `👢 ${member.user.tag} kicked | ${reason}`);
    interaction.reply(`✅ Kicked **${member.user.tag}**`);
  }
},

{
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user")
    .addUserOption(opt => opt.setName("user").setDescription("User to timeout").setRequired(true))
    .addStringOption(opt => opt.setName("time").setDescription("Duration: 1m,10m,1h").setRequired(true))
    .addStringOption(opt => opt.setName("reason").setDescription("Reason")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    const duration = parseTime(interaction.options.getString("time"));
    const reason = interaction.options.getString("reason") || "No reason";

    await member.timeout(duration, reason);
    logAction(interaction.guild, `⏱️ ${member.user.tag} timed out | ${reason}`);
    interaction.reply(`✅ Timed out **${member.user.tag}**`);
  }
},

{
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout/mute from a user")
    .addUserOption(opt => opt.setName("user").setDescription("User to unmute").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    await member.timeout(null);
    logAction(interaction.guild, `🔊 ${member.user.tag} unmuted`);
    interaction.reply(`✅ Unmuted **${member.user.tag}**`);
  }
},

{
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user")
    .addUserOption(opt => opt.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption(opt => opt.setName("reason").setDescription("Reason").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    db.addInfraction(user.id, "warn", reason);
    logAction(interaction.guild, `⚠️ ${user.tag} warned | ${reason}`);
    interaction.reply(`⚠️ Warned **${user.tag}**`);
  }
},

{
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Bulk delete messages")
    .addIntegerOption(opt => opt.setName("amount").setDescription("Number of messages (1–100)").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const amount = interaction.options.getInteger("amount");
    await interaction.channel.bulkDelete(amount, true);
    interaction.reply({ content: `🧹 Cleared ${amount} messages`, ephemeral: true });
  }
}

];

/* =========================
   AUTOMOD COMMANDS
========================= */

module.exports.push(
{
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Automod management")
    .addSubcommand(s =>
      s.setName("status")
       .setDescription("Check automod status"))
    .addSubcommand(s =>
      s.setName("on")
       .setDescription("Enable automod"))
    .addSubcommand(s =>
      s.setName("off")
       .setDescription("Disable automod"))
.addSubcommandGroup(g =>
  g.setName("feature")
   .setDescription("Toggle individual automod features")
   .addSubcommand(s => s.setName("invites").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)))
   .addSubcommand(s => s.setName("links").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)))
   .addSubcommand(s => s.setName("badwords").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)))
   .addSubcommand(s => s.setName("caps").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)))
   .addSubcommand(s => s.setName("spam").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)))
   .addSubcommand(s => s.setName("emojis").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)))
   .addSubcommand(s => s.setName("zalgo").addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true)))
),  // <-- close the addSubcommandGroup properly
  data: new SlashCommandBuilder()
    .setName("automod-threshold")
    .setDescription("Set automod thresholds")
    .addSubcommand(s => s.setName("caps_percent").addIntegerOption(o => o.setName("value").setDescription("Percentage").setRequired(true)))
    .addSubcommand(s => s.setName("spam_messages").addIntegerOption(o => o.setName("value").setDescription("Message count").setRequired(true)))
    .addSubcommand(s => s.setName("spam_time").addIntegerOption(o => o.setName("value").setDescription("Seconds").setRequired(true)))
    .addSubcommand(s => s.setName("emoji_limit").addIntegerOption(o => o.setName("value").setDescription("Emoji count").setRequired(true))),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const value = interaction.options.getInteger("value");

    const dbAutomod = db.getDB().automod || {};
    dbAutomod[sub] = value;
    db.setAutomod(sub, value);
    interaction.reply(`🤖 Automod threshold \`${sub}\` set to \`${value}\``);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("automod-action")
    .setDescription("Set automod punishment actions")
    .addStringOption(opt => opt.setName("filter").setDescription("Feature (caps, spam, badwords...)").setRequired(true))
    .addStringOption(opt => opt.setName("action").setDescription("warn, mute, kick, ban, timeout").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const filter = interaction.options.getString("filter");
    const action = interaction.options.getString("action");

    const dbAutomod = db.getDB().automod || {};
    if (!dbAutomod.action) dbAutomod.action = {};
    dbAutomod.action[filter] = action;
    db.setAutomod("action", dbAutomod.action);

    interaction.reply(`✅ Automod action for **${filter}** set to **${action}**`);
  }
}


/* =========================
   LOGGING COMMANDS
========================= */

module.exports.push(
{
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Manage logging system")
    .addSubcommand(s =>
      s.setName("set")
       .setDescription("Set logging channel")
       .addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s =>
      s.setName("enable")
       .setDescription("Enable logging for a type")
       .addStringOption(o => o.setName("type").setDescription("Type: moderation, automod, joins, leaves").setRequired(true)))
    .addSubcommand(s =>
      s.setName("disable")
       .setDescription("Disable logging for a type")
       .addStringOption(o => o.setName("type").setDescription("Type: moderation, automod, joins, leaves").setRequired(true)))
    .addSubcommand(s =>
      s.setName("status")
       .setDescription("Check logging status"))
    .addSubcommand(s =>
      s.setName("export")
       .setDescription("Export logs")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const dbLogs = db.getDB().logs || {};

    switch(sub) {
      case "set":
        const channel = interaction.options.getChannel("channel");
        dbLogs.channel = channel.id;
        db.getDB().logs = dbLogs;
        interaction.reply(`📜 Logs channel set to ${channel}`);
        break;
      case "enable":
      case "disable":
        const type = interaction.options.getString("type");
        if(!dbLogs.types) dbLogs.types = {};
        dbLogs.types[type] = sub === "enable";
        db.getDB().logs = dbLogs;
        interaction.reply(`📜 Logging for \`${type}\` ${sub === "enable" ? "enabled" : "disabled"}`);
        break;
      case "status":
        interaction.reply({ content: `📜 Logging status:\n${JSON.stringify(dbLogs, null, 2)}`, ephemeral: true });
        break;
      case "export":
        interaction.reply({ content: "📜 Logs export placeholder.", ephemeral: true });
        break;
    }
  }
}
);

/* =========================
   ROLE MANAGEMENT
========================= */

module.exports.push(
{
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Add or remove roles")
    .addSubcommand(s =>
      s.setName("add")
       .setDescription("Add a role to a user")
       .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
       .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand(s =>
      s.setName("remove")
       .setDescription("Remove a role from a user")
       .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
       .addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true))),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    const role = interaction.options.getRole("role");
    const sub = interaction.options.getSubcommand();

    if(sub === "add") await member.roles.add(role);
    else await member.roles.remove(role);

    logAction(interaction.guild, `🎭 Role ${sub}ed: ${role.name} -> ${member.user.tag}`);
    interaction.reply(`✅ Role ${sub}ed for **${member.user.tag}**`);
  }
}
);

/* =========================
   SECURITY / ANTI-ABUSE
========================= */

module.exports.push(
{
  data: new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Enable or disable antinuke protection")
    .addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true))
    .addStringOption(o => o.setName("whitelist").setDescription("Comma-separated user/role IDs")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const state = interaction.options.getString("state") === "on";
    const whitelist = interaction.options.getString("whitelist")?.split(",").map(s => s.trim()) || [];
    const dbSec = db.getDB().security || {};
    dbSec.antinuke = { enabled: state, whitelist };
    db.getDB().security = dbSec;
    interaction.reply(`🛡️ Antinuke ${state ? "enabled" : "disabled"} | Whitelist: ${whitelist.join(", ")}`);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Configure antiraid protection")
    .addSubcommand(s => s.setName("on").setDescription("Enable antiraid"))
    .addSubcommand(s => s.setName("off").setDescription("Disable antiraid"))
    .addSubcommand(s => s.setName("threshold").addIntegerOption(o => o.setName("joins").setDescription("Number of joins threshold").setRequired(true)))
    .addSubcommand(s => s.setName("lock").setDescription("Lock the server temporarily")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const dbSec = db.getDB().security || {};
    db.getDB().security = dbSec;

    switch(sub) {
      case "on": dbSec.antiraidEnabled = true; break;
      case "off": dbSec.antiraidEnabled = false; break;
      case "threshold": dbSec.antiraidThreshold = interaction.options.getInteger("joins"); break;
      case "lock": dbSec.locked = true; break;
    }
    interaction.reply(`🛡️ Antiraid updated: ${sub}`);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("antiinviter")
    .setDescription("Enable/disable antiinviter protection")
    .addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true))
    .addStringOption(o => o.setName("punishment").setDescription("mute/kick/ban")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const state = interaction.options.getString("state") === "on";
    const punishment = interaction.options.getString("punishment");
    const dbSec = db.getDB().security || {};
    dbSec.antiinviter = { enabled: state, punishment };
    db.getDB().security = dbSec;
    interaction.reply(`🚫 Anti-inviter ${state ? "enabled" : "disabled"} | Punishment: ${punishment || "none"}`);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("altcheck")
    .setDescription("Check if a user is an alt")
    .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    interaction.reply({ content: `🔍 Alt check placeholder for **${user.tag}**`, ephemeral: true });
  }
},
{
  data: new SlashCommandBuilder()
    .setName("accountage")
    .setDescription("Check account age of a user")
    .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const created = user.createdAt;
    interaction.reply({ content: `📅 **${user.tag}** account created: ${created.toUTCString()}`, ephemeral: true });
  }
},
{
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("Change nickname of a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("newnick").setDescription("New nickname").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    const newnick = interaction.options.getString("newnick");
    await member.setNickname(newnick);
    logAction(interaction.guild, `✏️ Nick changed: ${member.user.tag} -> ${newnick}`);
    interaction.reply(`✅ Nickname updated for **${member.user.tag}**`);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("resetnick")
    .setDescription("Reset nickname of a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    await member.setNickname(null);
    logAction(interaction.guild, `🔄 Nick reset: ${member.user.tag}`);
    interaction.reply(`✅ Nickname reset for **${member.user.tag}**`);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("View user infraction history")
    .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const infractions = db.getInfractions(user.id);
    interaction.reply({ content: `📜 Infractions for **${user.tag}**:\n${infractions.map(i => `${i.type}: ${i.reason} (${i.date})`).join("\n") || "None"}`, ephemeral: true });
  }
},
{
  data: new SlashCommandBuilder()
    .setName("notes")
    .setDescription("Add a note to a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("note").setDescription("Note").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const user = interaction.options.getUser("user");
    const note = interaction.options.getString("note");
    db.addNote(user.id, note);
    logAction(interaction.guild, `📝 Note added for ${user.tag}: ${note}`);
    interaction.reply(`✅ Note added for **${user.tag}**`);
  }
}
);

/* =========================
   PERMISSIONS SYSTEM
========================= */

module.exports.push(
{
  data: new SlashCommandBuilder()
    .setName("permissions")
    .setDescription("Manage command permissions")
    .addSubcommand(s => s.setName("set")
      .setDescription("Allow a role to use a command")
      .addStringOption(o => o.setName("command").setDescription("Command name").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("Role to allow").setRequired(true)))
    .addSubcommand(s => s.setName("deny")
      .setDescription("Deny a role from using a command")
      .addStringOption(o => o.setName("command").setDescription("Command name").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("Role to deny").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List all command permissions")),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ content: "Owner only.", ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const cmd = interaction.options.getString("command");
    const role = interaction.options.getRole("role");

    switch(sub) {
      case "set":
        db.setCommandPermission(cmd, role.id, true);
        interaction.reply(`🔐 Allowed **${role.name}** to use \`${cmd}\``);
        break;
      case "deny":
        db.setCommandPermission(cmd, role.id, false);
        interaction.reply(`🔒 Denied **${role.name}** from using \`${cmd}\``);
        break;
      case "list":
        const list = db.getCommandPermissions();
        interaction.reply({ content: `📜 Command permissions:\n${JSON.stringify(list, null, 2)}`, ephemeral: true });
        break;
    }
  }
}
);

/* =========================
   END OF COMMANDS.JS
========================= */

console.log("✅ All commands loaded.");
