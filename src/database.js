const fs = require("fs");
const path = "./src/db.json";

const initDB = () => {
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({
        bans: {},
        mutes: {},
        infractions: {},
        automod: {},
        adminRoles: [] // configurable via /setup-adminroles
    }, null, 2));
    return JSON.parse(fs.readFileSync(path));
};

const saveDB = (data) => fs.writeFileSync(path, JSON.stringify(data, null, 2));

module.exports = {
    getDB: () => initDB(),

    setAdminRoles: (roles) => {
        const db = initDB();
        db.adminRoles = roles;
        saveDB(db);
    },

    addBan: (userId, reason) => {
        const db = initDB();
        db.bans[userId] = reason;
        saveDB(db);
    },

    removeBan: (userId) => {
        const db = initDB();
        delete db.bans[userId];
        saveDB(db);
    },

    addInfraction: (userId, type, reason) => {
        const db = initDB();
        if (!db.infractions[userId]) db.infractions[userId] = [];
        db.infractions[userId].push({ type, reason, date: new Date().toISOString() });
        saveDB(db);
    },

    getInfractions: (userId) => {
        const db = initDB();
        return db.infractions[userId] || [];
    }
};
