const fs = require("fs");
const { dbFile } = require("./config");

let db = {};
if (fs.existsSync(dbFile)) {
    db = JSON.parse(fs.readFileSync(dbFile, "utf8"));
} else {
    db = { bans: {}, mutes: {}, infractions: {}, automod: {}, adminRoles: [], notes: {} };
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 4));
}

const saveDB = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 4));

module.exports = {
    getDB: () => db,

    addBan: (userId, reason) => {
        db.bans[userId] = { reason, date: new Date().toISOString() };
        saveDB();
    },

    removeBan: (userId) => {
        delete db.bans[userId];
        saveDB();
    },

    addInfraction: (userId, type, reason) => {
        if (!db.infractions[userId]) db.infractions[userId] = [];
        db.infractions[userId].push({ type, reason, date: new Date().toISOString() });
        saveDB();
    },

    getInfractions: (userId) => db.infractions[userId] || [],

    setAutomod: (filter, data) => {
        db.automod[filter] = data;
        saveDB();
    },

    addAdminRole: (roleName) => {
        if (!db.adminRoles.includes(roleName)) db.adminRoles.push(roleName);
        saveDB();
    },

    setAdminRoles: (roles) => {
        db.adminRoles = roles;
        saveDB();
    },

    addNote: (userId, note) => {
        if (!db.notes[userId]) db.notes[userId] = [];
        db.notes[userId].push({ note, date: new Date().toISOString() });
        saveDB();
    }
};
