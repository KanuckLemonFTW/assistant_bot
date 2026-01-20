const fs = require("fs");
const path = "./src/db.json";

// Initialize file if missing
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({ adminRoles: [], automod: {}, infractions: [] }));

function readDB() {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

function writeDB(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = {
  getDB: () => readDB(),

  setAdminRoles: (roles) => {
    const db = readDB();
    db.adminRoles = roles;
    writeDB(db);
  },

  setAutomod: (key, value) => {
    const db = readDB();
    if (!db.automod) db.automod = {};
    db.automod[key] = value;
    writeDB(db);
  },

  addBan: (userId, reason) => {
    const db = readDB();
    if (!db.bans) db.bans = [];
    db.bans.push({ userId, reason, date: Date.now() });
    writeDB(db);
  },

  addInfraction: (userId, type, reason) => {
    const db = readDB();
    if (!db.infractions) db.infractions = [];
    db.infractions.push({ userId, type, reason, date: Date.now() });
    writeDB(db);
  },
};
