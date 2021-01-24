const Discord = require('discord.js');
const client = new Discord.Client();
const GameManager = require('./manager.js');
let gameManager = new GameManager();

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
 });

client.on('message', msg => {
    if(msg.author.id===client.user.id || msg.channel.type === "dm") {return;}
    gameManager.msgHandler(msg, client.user.id);
 });

client.login('xxx');