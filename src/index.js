const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { token } = require("./config");
const events = require("./events");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.once("ready", () => {
    console.log(`${client.user.tag} is online!`);
});

// Load events
events(client);

client.login(token);
