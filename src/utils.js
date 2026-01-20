const { ownerID, logChannelName } = require("./config");

module.exports = {
    isOwner: (id) => id === ownerID,

    isAdmin: (member) => {
        if (!member) return false;
        return member.roles.cache.some(r => require("./database").getDB().adminRoles.includes(r.name));
    },

    formatUser: (user) => `${user.tag}`,

    logAction: (guild, content) => {
        const logChannel = guild.channels.cache.find(ch => ch.name === logChannelName);
        if (logChannel) logChannel.send(content);
    }
};
