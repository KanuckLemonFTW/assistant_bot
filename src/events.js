const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { token } = require("./config");
const commands = require("./commands");
const db = require("./database");
const { logAction, isAdmin } = require("./utils");

module.exports = (client) => {

    // Message listener for automod
    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        // Auto-mod enforcement
        const automod = db.getDB().automod || {};
        let punish = null;

        // CAPS filter
        if (automod.caps && automod.caps.enabled) {
            const capsPercent = automod.caps_percent || 70;
            const letters = message.content.replace(/[^A-Z]/g, "").length;
            if (letters / message.content.length * 100 > capsPercent) punish = automod.action?.caps || "warn";
        }

        // BADWORDS filter
        if (automod.badwords && automod.badwords.enabled) {
            const badWords = ["badword1","badword2"]; // add your list
            if (badWords.some(w => message.content.toLowerCase().includes(w))) punish = automod.action?.badwords || "warn";
        }

        // INVITES
        if (automod.invites && automod.invites.enabled) {
            if (/discord\.gg\/\w+/.test(message.content)) punish = automod.action?.invites || "warn";
        }

        // LINKS
        if (automod.links && automod.links.enabled) {
            if (/https?:\/\/\S+/.test(message.content)) punish = automod.action?.links || "warn";
        }

        // EMOJIS
        if (automod.emojis && automod.emojis.enabled) {
            const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length;
            if (emojiCount > (automod.emoji_limit || 5)) punish = automod.action?.emojis || "warn";
        }

        // Apply punishment
        if (punish && !isAdmin(message.member)) {
            await message.delete().catch(()=>{});
            if (punish === "warn") db.addInfraction(message.author.id, "warn", "Automod triggered");
            if (punish === "mute") {
                let mutedRole = message.guild.roles.cache.find(r => r.name === "Muted");
                if (!mutedRole) mutedRole = await message.guild.roles.create({ name: "Muted", permissions: [] });
                await message.member.roles.add(mutedRole);
                db.addInfraction(message.author.id, "mute", "Automod triggered");
            }
            logAction(message.guild, `Automod punished ${message.author.tag} with ${punish} for message: ${message.content}`);
        }

        // Command handling
        if (!message.content.startsWith("/")) return;
        const args = message.content.slice(1).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();

        if (commands[cmd]) {
            try {
                await commands[cmd].execute(message, args);
            } catch (err) {
                console.error(err);
                message.reply("Error executing command.");
            }
        }
    });

    // Logging joins/leaves
    client.on("guildMemberAdd", member => logAction(member.guild, `${member.user.tag} joined.`));
    client.on("guildMemberRemove", member => logAction(member.guild, `${member.user.tag} left.`));

    // Nickname changes
    client.on("guildMemberUpdate", (oldMember, newMember) => {
        if (oldMember.nickname !== newMember.nickname) {
            logAction(newMember.guild, `${oldMember.user.tag} changed nickname: ${oldMember.nickname || oldMember.user.username} -> ${newMember.nickname}`);
        }
    });

    // Role updates
    client.on("guildMemberUpdate", (oldMember, newMember) => {
        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            logAction(newMember.guild, `${newMember.user.tag} roles updated.`);
        }
    });

    // Channel updates
    client.on("channelUpdate", (oldChannel, newChannel) => {
        logAction(newChannel.guild, `Channel ${oldChannel.name} updated.`);
    });

};
