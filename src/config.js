module.exports = {
    prefix: "/", // slash commands are supported via Discord interactions
    ownerID: "753300433682038956", // your Discord ID
    token: process.env.BOT_TOKEN, // set this as GitHub secret
    dbFile: "./src/db.json",
    logChannelName: "bot-logs"
};
