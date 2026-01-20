const { isOwner, isAdmin, formatUser, logAction } = require("./utils");
const db = require("./database");

module.exports = {
    setupAdminRoles: {
        description: "Set admin roles (owner only)",
        execute: (message, args) => {
            if (!isOwner(message.author.id)) return message.reply("Only the owner can set admin roles.");
            if (!args.length) return message.reply("Provide role names separated by spaces.");

            db.setAdminRoles(args); // store roles in database
            message.reply(`Admin roles set to: ${args.join(", ")}`);
        }
    },

    ban: {
        description: "Ban a user",
        execute: async (message, args) => {
            if (!isAdmin(message.member)) return message.reply("You cannot use this command.");
            const user = message.mentions.members.first();
            const reason = args.slice(1).join(" ") || "No reason provided";
            if (!user) return message.reply("Specify a user to ban.");

            await user.ban({ reason });
            db.addBan(user.id, reason);
            logAction(message.guild, `Banned ${formatUser(user.user)}: ${reason}`);
            message.reply(`${formatUser(user.user)} has been banned.`);
        }
    },

    help: {
        description: "List all commands",
        execute: (message) => {
            const commands = Object.keys(module.exports)
                .map(cmd => `**${cmd}**: ${module.exports[cmd].description}`);
            message.channel.send("Available Commands:\n" + commands.join("\n"));
        }
    }
};
