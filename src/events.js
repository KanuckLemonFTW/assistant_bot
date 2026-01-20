module.exports = (client) => {
    client.on("ready", () => console.log(`Logged in as ${client.user.tag}`));

    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;
        const { prefix } = require("./config");
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const commands = require("./commands");

        if (commands[commandName]) {
            try {
                commands[commandName].execute(message, args);
            } catch (err) {
                console.error(err);
                message.reply("Error executing command.");
            }
        }
    });
};
