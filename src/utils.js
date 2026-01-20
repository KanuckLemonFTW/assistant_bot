const db = require("./database");
const { ownerID } = require("./config");

module.exports = {
    isOwner: (userId) => userId === ownerID,

    isAdmin: (member) => {
        const adminRoles = db.getDB().adminRoles || [];
        return member.roles.cache.some(r => adminRoles.includes(r));
    },

    formatUser: (user) => `<@${user.id}> (${user.tag})`,

    logAction: (guild, message) => {
        const logChannel = guild.channels.cache.find(ch => ch.name === "bot-logs");
        if (logChannel) logChannel.send(message);
    }
};
