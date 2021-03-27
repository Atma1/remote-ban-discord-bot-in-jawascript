const { prefix } = require('../../config.json');

module.exports = {
	name: 'help',
	desc: 'give help',
	usage: 'commandname',
	aliases: ['help!11!!1', 'cmdinfo', 'command'],
	cooldown: 5,
	execute(message, args) {
		const data = [];
		const { commands } = message.client;

		if (!args.lenght) {
			data.push('Here\'s a list of my commands');
			data.push(commands.map(cmd => cmd.name).join(', '));
			data.push(`\nIf you want info on specific command send \`${prefix}help [command name]\``);

			return message.author.send(data, { split: true })
				.then(()=> {
					if(message.channel.type === 'dm') return;
					message.reply('Sent all of my cmds to your DM.');

				})
				.catch(err => {
					console.warn(err);
					message.reply('Your DM is closed thereby I cannot send my cmds.');
				});
		}
		const name = args[0].toLowerCase();
		const command = commands.get(name) || command.find(cmd => cmd.aliases && cmd.aliases.includes(name));

		if (!command) {
			return message.reply('Make sure you type the correct cmd');
		}

		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Desc:** ${command.desc}`);
		if (command.usage) data.push(`**Usage:** ${prefix} ${command.name} ${command.usage}`);

		data.push(`**Cooldown:** ${command.cooldown || 3} sekon.`);

		message.channel.send(data, { split : true });
	},
};