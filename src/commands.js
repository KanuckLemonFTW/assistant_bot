const { SlashCommandBuilder, ChannelType } = require("discord.js");
const db = require("./database");
const { isAdmin, isOwner, logAction, parseTime } = require("./utils");

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
    .addStringOption(opt => opt.setName("reason").setDescription("Reason"))
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
},

/* =========================
   AUTOMOD COMMANDS
========================= */
{
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Automod management")
    .addSubcommand(s => s.setName("status").setDescription("Check automod status"))
    .addSubcommand(s => s.setName("on").setDescription("Enable automod"))
    .addSubcommand(s => s.setName("off").setDescription("Disable automod"))
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
    ),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    interaction.reply({ content: "🤖 Automod placeholder response", ephemeral: true });
  }
},

{
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
},

/* =========================
   LOGGING COMMANDS
========================= */
{
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Configure logging channels and types")
    .addSubcommand(s => s.setName("set").setDescription("Set a logging channel").addChannelOption(o => o.setName("channel").setDescription("Channel").setRequired(true)))
    .addSubcommand(s => s.setName("enable").setDescription("Enable a log type").addStringOption(o => o.setName("type").setDescription("Type").setRequired(true)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable a log type").addStringOption(o => o.setName("type").setDescription("Type").setRequired(true)))
    .addSubcommand(s => s.setName("status").setDescription("Check logging status"))
    .addSubcommand(s => s.setName("export").setDescription("Export logs")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    interaction.reply({ content: "📜 Logging command executed (placeholder)", ephemeral: true });
  }
},

/* =========================
   SECURITY / ANTI-ABUSE COMMANDS
========================= */
{
  data: new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Anti-nuke system")
    .addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true))
    .addStringOption(o => o.setName("whitelist").setDescription("User or role ID")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    interaction.reply({ content: "🚨 Antinuke executed (placeholder)", ephemeral: true });
  }
},
{
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Anti-raid configuration")
    .addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true))
    .addIntegerOption(o => o.setName("threshold").setDescription("Join threshold"))
    .addSubcommand(s => s.setName("lock").setDescription("Lock server temporarily")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    interaction.reply({ content: "🚨 Antiraid executed (placeholder)", ephemeral: true });
  }
},
{
  data: new SlashCommandBuilder()
    .setName("antiinviter")
    .setDescription("Anti-inviter")
    .addStringOption(o => o.setName("state").setDescription("on/off").setRequired(true))
    .addStringOption(o => o.setName("punishment").setDescription("mute/kick/ban")),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    interaction.reply({ content: "🚨 Anti-inviter executed (placeholder)", ephemeral: true });
  }
},
{
  data: new SlashCommandBuilder()
    .setName("altcheck")
    .setDescription("Check if a user has alt accounts")
    .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    interaction.reply({ content: "🔎 Altcheck executed (placeholder)", ephemeral: true });
  }
},
{
  data: new SlashCommandBuilder()
    .setName("accountage")
    .setDescription("Check account age")
    .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    interaction.reply({ content: "🕒 Account age executed (placeholder)", ephemeral: true });
  }
},

/* =========================
   ROLES / NICKNAME COMMANDS
========================= */
{
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("Change a user's nickname")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("new_nick").setDescription("New nickname").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    const nick = interaction.options.getString("new_nick");
    await member.setNickname(nick);
    interaction.reply(`✅ Changed nickname of **${member.user.tag}** to **${nick}**`);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("resetnick")
    .setDescription("Reset a user's nickname")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const member = interaction.options.getMember("user");
    await member.setNickname(null);
    interaction.reply(`✅ Reset nickname of **${member.user.tag}**`);
  }
},
{
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Add or remove roles")
    .addSubcommand(s => s.setName("add").setDescription("Add role").addUserOption(o => o.setName("user").setDescription("User").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove role").addUserOption(o => o.setName("user").setDescription("User").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true))),
  async execute(interaction) {
    if (!isAdmin(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const member = interaction.options.getMember("user");
    const role = interaction.options.getRole("role");
    if (sub === "add") await member.roles.add(role);
    else await member.roles.remove(role);
    interaction.reply(`✅ Role ${sub}ed **${role.name}** for **${member.user.tag}**`);
  }
},

/* =========================
   PERMISSIONS COMMANDS
========================= */
{
  data: new SlashCommandBuilder()
    .setName("permissions")
    .setDescription("Set command permissions")
    .addSubcommand(s => s.setName("set").setDescription("Allow a role").addStringOption(o => o.setName("command").setDescription("Command").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand(s => s.setName("deny").setDescription("Deny a role").addStringOption(o => o.setName("command").setDescription("Command").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List all permissions")),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ content: "Owner only.", ephemeral: true });
    interaction.reply({ content: "🔑 Permissions executed (placeholder)", ephemeral: true });
  }
}
];
