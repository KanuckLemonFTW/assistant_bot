module.exports = {
    clientId: "YOUR_BOT_CLIENT_ID", // Discord application ID
    guildId: "YOUR_TEST_GUILD_ID",  // Your server ID (for testing slash commands)
    ownerID: "753300433682038956",  // Your Discord ID
    token: process.env.BOT_TOKEN,   // Bot token from GitHub secret
    dbFile: "./src/db.json",        // Database file
    logChannelName: "bot-logs"      // Logging channel name
};
