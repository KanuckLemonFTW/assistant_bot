const { Client, Collection, GatewayIntentBits } = require("discord.js");
const commands = require("./commands");
require("dotenv").config(); // to use GITHUB_SECRET token

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Register slash commands on ready
client.once("ready", async () => {
  console.log(`${client.user.tag} is online!`);
  const guilds = client.guilds.cache.map(g => g.id);
  for (const guildId of guilds) {
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(commands.map(c => c.data.toJSON()));
  }
  console.log("✅ Slash commands registered.");
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const cmd = commands.find(c => c.data.name === interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
  }
});

// Login with token from GitHub secret
client.login(process.env.DISCORD_TOKEN);
