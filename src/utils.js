const { ownerID, logChannelName } = require("./config");
const db = require("./database");

module.exports = {
    isOwner: (id) => id === ownerID,

    isAdmin: (member) => {
        if (!member) return false;
        return member.roles.cache.some(r => db.getDB().adminRoles.includes(r.name));
    },

    formatUser: (user) => `${user.tag}`,

    logAction: (guild, content) => {
        const logChannel = guild.channels.cache.find(ch => ch.name === logChannelName);
        if (logChannel) logChannel.send(content);
    },

    parseTime: (str) => {
        if (!str) return null;
        const match = str.match(/(\d+)(s|m|h|d)/);
        if (!match) return null;
        const [, num, unit] = match;
        const multipliers = { s: 1000, m: 60*1000, h: 3600*1000, d: 86400*1000 };
        return parseInt(num) * multipliers[unit];
    }
};
