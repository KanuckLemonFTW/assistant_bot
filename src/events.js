module.exports = (client) => {
    const db = require("./database");
    const { logAction, isAdmin } = require("./utils");

    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

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
            const badWords = ["badword1","badword2"];
            if (badWords.some(w => message.content.toLowerCase().includes(w))) punish = automod.action?.badwords || "warn";
        }

        // INVITES
        if (automod.invites && automod.invites.enabled) {
            if (/discord\.gg\/\w+/.test(message.content)) punish = automod.action?.invites || "warn";
        }

        // Apply punishment
        if (punish && !isAdmin(message.member)) {
            await message.delete().catch(()=>{});
            if (punish === "warn") db.addInfraction(message.author.id, "warn", "Automod triggered");
            logAction(message.guild, `Automod punished ${message.author.tag} with ${punish}`);
        }
    });

    // Logging joins/leaves
    client.on("guildMemberAdd", member => logAction(member.guild, `${member.user.tag} joined.`));
    client.on("guildMemberRemove", member => logAction(member.guild, `${member.user.tag} left.`));
};

