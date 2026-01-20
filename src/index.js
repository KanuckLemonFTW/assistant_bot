const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("./config");
const commands = require("./commands");
const events = require("./events");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Register slash commands
(async () => {
    const rest = new REST({ version: "10" }).setToken(token);
    const data = commands.map(cmd => cmd.data.toJSON());
    try {
        console.log("Registering slash commands...");
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: data });
        console.log("Slash commands registered.");
    } catch (err) {
        console.error(err);
    }
})();

client.once("ready", () => {
    console.log(`${client.user.tag} is online!`);
});

// Load events
events(client);

client.login(token);
