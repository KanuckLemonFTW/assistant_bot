const { isOwner, isAdmin, formatUser, logAction } = require("./utils");
const db = require("./database");
const { PermissionsBitField } = require("discord.js");

// Helper: parse time like "10m", "2h"
const parseTime = (str) => {
    if (!str) return null;
    const match = str.match(/(\d+)(s|m|h|d)/);
    if (!match) return null;
    const [, num, unit] = match;
    const multipliers = { s: 1000, m: 60*1000, h: 3600*1000, d: 86400*1000 };
    return parseInt(num) * multipliers[unit];
};

// Helper: delete messages safely
const safeDelete = async (msg) => {
    try { await msg.delete(); } catch(e) {}
};

// ================== COMMANDS ==================
module.exports = {

    // ---------------- OWNER SETUP ----------------
    setup: {
        description: "Owner setup command",
        execute: (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Owner only.");
            message.reply(`Setup command received: ${args.join(" ")}`);
        }
    },

    setupAdminRoles: {
        description: "Set admin roles (owner only)",
        execute: (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Owner only.");
            if (!args.length) return message.reply("Provide role names.");
            db.setAdminRoles(args);
            message.reply(`Admin roles set: ${args.join(", ")}`);
        }
    },

    setupAutomod: {
        description: "Configure automod (owner)",
        execute: (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Owner only.");
            const [filter, value] = args;
            if (!filter || !value) return message.reply("Usage: /setup automod <filter> <on|off>");
            const automod = db.getDB().automod || {};
            automod[filter] = { enabled: value.toLowerCase() === "on" };
            db.setAutomod(filter, automod[filter]);
            message.reply(`Automod filter ${filter} set to ${value}`);
        }
    },

    setupLogging: {
        description: "Set logging channel",
        execute: (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Owner only.");
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply("Mention a channel to log to.");
            const dbData = db.getDB();
            dbData.logChannel = channel.id;
            db.setAutomod("logChannel", channel.id); // store in db
            message.reply(`Logging channel set to ${channel}`);
        }
    },

    setupRoles: {
        description: "Setup roles like Muted",
        execute: async (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Owner only.");
            if (!args.length) return message.reply("Usage: /setup roles muted:@Muted");
            const mutedRole = message.mentions.roles.first();
            if (!mutedRole) return message.reply("Mention a role.");
            const dbData = db.getDB();
            dbData.mutedRole = mutedRole.id;
            db.setAutomod("mutedRole", mutedRole.id);
            message.reply(`Muted role set to ${mutedRole.name}`);
        }
    },

    // ---------------- MODERATION ----------------
    ban: {
        description: "Ban a user",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const reason = args.slice(1).join(" ") || "No reason provided";
            if (!user) return message.reply("Mention a user.");
            await user.ban({ reason });
            db.addBan(user.id, reason);
            logAction(message.guild, `Banned ${formatUser(user.user)}: ${reason}`);
            message.reply(`${formatUser(user.user)} banned.`);
        }
    },

    softban: {
        description: "Softban a user (ban+unban)",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const reason = args.slice(1).join(" ") || "No reason";
            if (!user) return message.reply("Mention a user.");
            await user.ban({ reason });
            await message.guild.members.unban(user.id);
            logAction(message.guild, `Softbanned ${formatUser(user.user)}: ${reason}`);
            message.reply(`${formatUser(user.user)} softbanned.`);
        }
    },

    hackban: {
        description: "Ban by ID",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const userId = args[0];
            const reason = args.slice(1).join(" ") || "No reason";
            if (!userId) return message.reply("Provide a user ID.");
            await message.guild.members.ban(userId, { reason });
            db.addBan(userId, reason);
            logAction(message.guild, `Hackbanned ${userId}: ${reason}`);
            message.reply(`User ${userId} banned.`);
        }
    },

    unban: {
        description: "Unban a user",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const userId = args[0];
            if (!userId) return message.reply("Provide a user ID.");
            await message.guild.members.unban(userId);
            db.removeBan(userId);
            logAction(message.guild, `Unbanned ${userId}`);
            message.reply(`User ${userId} unbanned.`);
        }
    },

    kick: {
        description: "Kick a user",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const reason = args.slice(1).join(" ") || "No reason";
            if (!user) return message.reply("Mention a user.");
            await user.kick(reason);
            logAction(message.guild, `Kicked ${formatUser(user.user)}: ${reason}`);
            message.reply(`${formatUser(user.user)} kicked.`);
        }
    },

    mute: {
        description: "Mute a user",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const time = parseTime(args[1]);
            if (!user) return message.reply("Mention a user.");
            let mutedRole = message.guild.roles.cache.find(r => r.name === "Muted");
            if (!mutedRole) mutedRole = await message.guild.roles.create({ name: "Muted", permissions: [] });
            await user.roles.add(mutedRole);
            db.addInfraction(user.id, "mute", args[1] || "indefinite");
            if (time) setTimeout(() => user.roles.remove(mutedRole), time);
            logAction(message.guild, `Muted ${formatUser(user.user)} for ${args[1] || "indefinite"}`);
            message.reply(`${formatUser(user.user)} muted.`);
        }
    },

    unmute: {
        description: "Unmute a user",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            if (!user) return message.reply("Mention a user.");
            const mutedRole = message.guild.roles.cache.find(r => r.name === "Muted");
            if (mutedRole) await user.roles.remove(mutedRole);
            logAction(message.guild, `Unmuted ${formatUser(user.user)}`);
            message.reply(`${formatUser(user.user)} unmuted.`);
        }
    },

    timeout: {
        description: "Timeout a user",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const time = parseTime(args[1]);
            if (!user || !time) return message.reply("Usage: /timeout <user> <time>");
            await user.timeout(time);
            db.addInfraction(user.id, "timeout", args[1]);
            logAction(message.guild, `Timed out ${formatUser(user.user)} for ${args[1]}`);
            message.reply(`${formatUser(user.user)} timed out for ${args[1]}`);
        }
    },

    untimeout: {
        description: "Remove timeout",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            if (!user) return message.reply("Mention a user.");
            await user.timeout(null);
            logAction(message.guild, `Timeout removed for ${formatUser(user.user)}`);
            message.reply(`${formatUser(user.user)} timeout removed.`);
        }
    },

    warn: {
        description: "Warn a user",
        execute: (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const reason = args.slice(1).join(" ") || "No reason";
            if (!user) return message.reply("Mention a user.");
            db.addInfraction(user.id, "warn", reason);
            logAction(message.guild, `Warned ${formatUser(user.user)}: ${reason}`);
            message.reply(`${formatUser(user.user)} warned.`);
        }
    },

    warnRemove: {
        description: "Remove a warning",
        execute: (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const warnId = parseInt(args[1]);
            if (!user || !warnId) return message.reply("Provide user and warn ID.");
            const infractions = db.getInfractions(user.id);
            if (!infractions[warnId-1]) return message.reply("Warning not found.");
            infractions.splice(warnId-1, 1);
            db.getDB().infractions[user.id] = infractions;
            message.reply(`Removed warning ${warnId} for ${formatUser(user.user)}`);
        }
    },

    clear: {
        description: "Clear messages",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply("1-100 messages.");
            await message.channel.bulkDelete(amount, true);
            logAction(message.guild, `${message.author.tag} cleared ${amount} messages.`);
            message.reply(`Deleted ${amount} messages.`).then(msg => safeDelete(msg));
        }
    },

    lock: {
        description: "Lock a channel",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const channel = message.mentions.channels.first() || message.channel;
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
            message.reply(`${channel.name} locked.`)
        }
    },

    unlock: {
        description: "Unlock a channel",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const channel = message.mentions.channels.first() || message.channel;
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
            message.reply(`${channel.name} unlocked.`)
        }
    },

    slowmode: {
        description: "Set slowmode",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const seconds = parseInt(args[0]);
            if (isNaN(seconds) || seconds < 0 || seconds > 21600) return message.reply("0-21600 seconds.");
            const channel = message.mentions.channels.first() || message.channel;
            await channel.setRateLimitPerUser(seconds);
            message.reply(`${channel.name} slowmode set to ${seconds}s.`);
        }
    },

    // ---------------- AUTOMOD ----------------
    automod: {
        description: "Automod commands",
        execute: (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            message.reply(`Automod command: ${args.join(" ")}`);
        }
    },

    // ---------------- LOGGING ----------------
    logs: {
        description: "Logging commands",
        execute: (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            message.reply(`Logs command: ${args.join(" ")}`);
        }
    },

    // ---------------- SECURITY ----------------
    antinuke: {
        description: "Antinuke commands",
        execute: (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            message.reply(`Antinuke command: ${args.join(" ")}`);
        }
    },

    antiraid: {
        description: "Antiraid commands",
        execute: (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            message.reply(`Antiraid command: ${args.join(" ")}`);
        }
    },

    altcheck: {
        description: "Altcheck a user",
        execute: (message, args) => message.reply(`Altcheck: ${args.join(" ")}`)
    },

    accountage: {
        description: "Check account age",
        execute: (message, args) => message.reply(`Account age: ${args.join(" ")}`)
    },

    nick: {
        description: "Change nickname",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const newNick = args.slice(1).join(" ");
            if (!user || !newNick) return message.reply("Provide user and nickname.");
            await user.setNickname(newNick);
            message.reply(`Nickname of ${formatUser(user.user)} changed to ${newNick}`);
        }
    },

    resetnick: {
        description: "Reset nickname",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            if (!user) return message.reply("Mention a user.");
            await user.setNickname(null);
            message.reply(`Nickname of ${formatUser(user.user)} reset.`);
        }
    },

    roles: {
        description: "Add or remove roles",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("No permission.");
            const user = message.mentions.members.first();
            const roleName = args.slice(2).join(" ");
            if (!user || !roleName) return message.reply("Provide user and role.");
            const role = message.guild.roles.cache.find(r => r.name === roleName);
            if (!role) return message.reply("Role not found.");
            if (args[0] === "add") await user.roles.add(role);
            if (args[0] === "remove") await user.roles.remove(role);
            message.reply(`${args[0]}ed role ${roleName} for ${formatUser(user.user)}`);
        }
    },

    history: {
        description: "Show user history",
        execute: (message, args) => message.reply(`History: ${args.join(" ")}`)
    },

    notesAdd: {
        description: "Add note to user",
        execute: (message, args) => message.reply(`Note added: ${args.join(" ")}`)
    },

    // ---------------- PERMISSIONS ----------------
    permissionsSet: {
        description: "Set command permissions",
        execute: (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Owner only.");
            message.reply(`Permissions set: ${args.join(" ")}`);
        }
    },

    permissionsDeny: {
        description: "Deny command permissions",
        execute: (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Owner only.");
            message.reply(`Permissions deny: ${args.join(" ")}`);
        }
    },

    permissionsList: {
        description: "List command permissions",
        execute: (message) => message.reply("Permissions list.")
    },

    help: {
        description: "List all commands",
        execute: (message) => {
            const commands = Object.keys(module.exports).map(c => `**${c}**: ${module.exports[c].description}`);
            message.channel.send("Available Commands:\n" + commands.join("\n"));
        }
    }
};
