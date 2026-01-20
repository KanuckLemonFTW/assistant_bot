require("dotenv").config();
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  InteractionType
} = require("discord.js");

const commands = require("./commands");

// ===== CONFIG =====
const CLIENT_ID = process.env.CLIENT_ID; // Bot Application ID
const GUILD_ID = process.env.GUILD_ID;   // Optional (faster updates)
const TOKEN = process.env.DISCORD_TOKEN;

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== LOAD COMMANDS =====
client.commands = new Collection();

for (const cmd of commands) {
  client.commands.set(cmd.data.name, cmd);
}

// ===== REGISTER SLASH COMMANDS =====
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("🔄 Registering slash commands...");

    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands.map(c => c.data.toJSON()) }
      );
      console.log("✅ Guild slash commands registered.");
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands.map(c => c.data.toJSON()) }
      );
      console.log("✅ Global slash commands registered.");
    }
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  await registerCommands();
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async interaction => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ There was an error executing this command.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ There was an error executing this command.",
        ephemeral: true
      });
    }
  }
});

// ===== LOGIN =====
client.login(TOKEN);
