const db = require("./database");

module.exports = {
  isAdmin: (member) => {
    const roles = db.getDB().adminRoles || [];
    return member.roles.cache.some(r => roles.includes(r.name)) || member.permissions.has("Administrator");
  },

  isOwner: (userId) => {
    const ownerId = process.env.OWNER_ID; // your Discord ID
    return userId === ownerId;
  },

  logAction: (guild, message) => {
    console.log(`[${guild.name}] ${message}`);
    // Optionally: send to mod-log channel if set in DB
  },

  parseTime: (str) => {
    const regex = /(\d+)([smhd])/;
    const match = str.match(regex);
    if (!match) return null;
    const value = parseInt(match[1]);
    switch (match[2]) {
      case "s": return value * 1000;
      case "m": return value * 60 * 1000;
      case "h": return value * 60 * 60 * 1000;
      case "d": return value * 24 * 60 * 60 * 1000;
      default: return null;
    }
  },
};
