const discord = require("discord.js");
const client = new discord.Client();

const network = require("./network.js");
const fs = require("fs");

const config = require("./config.json");

/*
 * Needed data:
 *	config.potato: system token for scaling-potato
 *	config.discord: bot token for Discord
 *	config.channel: Discord channel id to mirror
 *	config.server: scaling-potato server ip
 */


let timestamp = 0;

/**
 * Send a scaling-potato message over Discord
 *
 * @private
 * @param {TextChannel} channel - channel for message to be sent on
 * @param {object} message - scaling-potato message to send
 */
function sendDiscordMessage(channel, message) {
	let content = "".concat("<", message.nick, "#", message.id, "> ", message.body);
	channel.sendMessage(content);
}

/**
 * Sync latest messages between Discord and scaling-potato
 *
 * @private
 * @param {TextChannel} channel - Discord channel to monitor
 */
function update(channel) {
	console.log(timestamp);
	network.update(config.server, timestamp).on('response', messages => {
		if (messages && messages.length > 0) {
			messages.sort((a, b) => {
				if (a.timestamp > b.timestamp) return 1;
				if (b.timestamp > a.timestamp) return -1;
				else return 0;
			});

			timestamp = messages[messages.length - 1].timestamp + 1;
			messages.forEach(message => {
				if (!message.discord) {
					sendDiscordMessage(channel, message);
				}
			});
		}});

	}

client.on("ready", () => {
	const channel = client.channels.get(config.channel);
	console.log(config.channel);
	console.log(channel);
	setInterval(update, 1000, channel);
})

client.on("message", message => {
	if (message.author != client.user && message.channel == client.channels.get(config.channel)) {
		let msg = {
			body: message.cleanContent,
			nick: message.author.username,
			id: message.author.discriminator,
			token: config.potato,
			discord: true
		};

		network.sendMessage(config.server, msg);
	}
});

client.login(config.discord);
