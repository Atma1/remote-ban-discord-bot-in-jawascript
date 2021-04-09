const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const trim = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str);
const endPoint = 'https://api.quran.sutanlab.id';

module.exports = {
	name : 'quran',
	desc : 'send surah from verse',
	usage : 'surahnumber:versenumber',
	example : '!quran 39:53',
	args : true,
	cooldown : 5,
	async execute(message, args) {
		const verseAndSurah = args.toString().split(':');
		const [chapterNumber, verseNumber] = verseAndSurah;
		try {
			const response = await fetch(`https://api.quran.sutanlab.id/surah/${chapterNumber}/${verseNumber}`)
				.then(res => res.json());
			const { data: { text: { arab } } } = response;
			const { data: { text: { transliteration: { en:transliteral } } } } = response;
			const { data: { translation: { en } } } = response;
			const { data: { audio: { primary } } } = response;
			const embed = new MessageEmbed()
				.setColor ('#EFFF00')
				.setTitle (`Quran ${args}. Click for audio.`)
				.setURL (primary)
				.addFields (
					{ name: 'Arabic', value: trim(arab, 1024) },
					{ name: 'Transliteration', value: trim(transliteral, 1024) },
					{ name: 'Translation (EN)', value: trim(en, 1024) },
					{ name: 'API', value: endPoint },
				);
			return message.channel.send(embed);
		}
		catch(error) {
			console.warn(error);
			return message.channel.send('There was an error while retriving data!');
		}
	},
};