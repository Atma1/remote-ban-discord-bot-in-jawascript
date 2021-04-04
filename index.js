const fs = require('fs');
const Discord = require('discord.js');
const {	filterWord, token, prefix, databaseURL } = require('./config.json');
const {	checkPerm, getAuthRoles, convertToArray } = require('./util/util');
const admin = require('firebase-admin');
const FV = admin.firestore.FieldValue;
const serviceAccount = require('./serviceAccount.json');
const client = new Discord.Client();
client.cooldowns = new Discord.Collection();
client.commands = new Discord.Collection();

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: databaseURL,
});
const DB = admin.firestore();
const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

client.once('ready', () => {
	console.log(`${client.user.tag} is ready.`);
});

client.on('message', async message => {

	const msg = message.content.toLowerCase();
	console.log(msg);
	if (msg.startsWith(prefix) && !message.author.bot) {
		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();
		const command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) return;

		if(command.permission && !message.member.hasPermission('ADMINISTRATOR')) {
			const guildId = message.guild.id;
			const userRoles = message.member.roles.cache;
			const authorizedRoles = await getAuthRoles(guildId, DB)
				.catch((err) => {
					return message.channel.send(`${err}`);
				});
			const isUserAuthorized = checkPerm(convertToArray(userRoles), authorizedRoles);
			if (!isUserAuthorized) {
				return message.channel.send('You don\'t have permission to do that!');
			}
		}

		if (command.args && !args.length || args.length < command.reqarglength) {
			let reply = 'Please provide the necessary amount of argument(s).';
			reply += `\n Do this: \`${prefix}${command.name} ${command.usage}\``;
			return message.reply(reply);
		}

		if (command.guildonly && message.channel.type === 'dm') {
			return message.reply('Can\'t do that in dm!');
		}
		const { cooldowns } = client;

		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}
		const now = Date.now();
		const cooldownAmount = (command.cooldown || 3) * 1000;
		const timestamps = cooldowns.get(command.name);

		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing!`);
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		try {
			command.execute(message, args, DB, FV);
			console.log(args);
		}
		catch (error) {
			console.warn(error);
			message.reply(`There was an error!\n${error}`);
		}
	}
	for (let i = 0; i < filterWord.length; i++) {
		if (msg.includes(filterWord[i])) {
			message.reply('RACIST DETECTED')
				.then(() =>{
					return message.delete();
				});
		}
	}
});

client.on('guildCreate', guildData => {
	const guildId = guildData.id;
	DB.collection(`Server: ${guildId}`).doc(`Data for server: ${guildData.id}`).set({

		'guildID': guildData.id,
		'guildName': guildData.name,
		'guildOwnerID': guildData.ownerID,
		'guildOwnerUsername': guildData.owner,
		'guildRegion' : guildData.region,
		'authorizedRoles' : [],

	})
		.catch(err => {
			return console.warn(err);
		});
});

client.login(token);