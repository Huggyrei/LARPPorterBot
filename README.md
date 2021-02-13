# LARPPorterBot
Discord bot for managing character inventories and hidden item information in online LARPs.
To download the code from Github, just click 'Code' followed by 'Download Zip'

Note: the bot is intended for use in only a single server at any given time. Any messages from a server it hasn't been currently setup for will be ignored. Access the help functions with the command _help.

## Creating a Bot
If you want to use this code for your game, you will need to create your own bot application. You will need to take the following steps:
1. Copy this code repository into the folder you want to run it from
2. Go to https://discord.com/developers/applications
3. Click on 'New Application' in thr top right of the Applicatipns list
4. Name it and set the icon for your bot
5. In your new application, click 'Add Bot'
6. Click on 'Click to Reveal Token' and then copy this
7. Go to the folder with the code and open Index.js (you can do this in notepad)
8. At the bottom of the file is the line "client.login('botID');" replace botID with the bot's token you've just copied (keep the single quote marks!). Save the file.
9. You need some way to install the Javascript libraries; I suggest installing Node from https://nodejs.org/en/download/.  You can then open a Node command prompt and enter "cd [folder address]" with the address of your new folder containing the bot code. This should navigate the command prompt to your folder. You should then enter the command 'npm install' to set up the libraries.

## Running the Bot
Now that you have a bot, you need to know how to set it running.
1. The first step is to invite the bot to your game server, if this is the first time you're running the bot on this server. Go to the discord developers applications page again and double-click on the bot's icon to bring up the setings. 
2. Under '0Auth2', go to the list of scopes and click 'bot'. Underneath this, you will see a new list of permissions; select 'Manage Channels', 'View Channels', 'Manage Nicknames', and 'Send Messages'.
3. This will cause a URL to be generated under the 'scopes' section. Copy that URL and click on it to invite the bot into your server. Make sure you've selected the permissions first as in the previous step, otherwise your bot won't be able to do its job!
8. Now you just need some way to run the code whenever you want th bot to be working. If you already installed Node earlier, you can use this. Open a Node command prompt and enter "cd [folder address]" with the address of your new folder containing the bot code. Finally, enter the command 'Node Index' to run the Index file.

Note that if the code is not currently being run somewhere, the bot won't function. You can just run it on your own computer if you're happy with it not working if you're not online, otherwise you'll need to find a server to keep it going.

