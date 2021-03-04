# LARPPorterBot
Discord bot for managing character and location inventories with hidden item information in online LARPs.
To download the code from Github, just click 'Code' followed by 'Download Zip'

Players claim characters and get a private channel to view their inventory. They can view cash or items, give or show things to each other, and visit locations. Characters may also have a limited number of uses of a stealing ability or an ability to prevent thefts.

Items may have both pulic descriptions and hidden information only accessible by characters with the correct codes, as set by the GMs.

Edit commands - accessible only to users with a 'GM' role - allow GMs to create or edit characters, locations, and items. The game setup can be loaded in from csv files, or entered in using bot commands and then saved to csv files for later use.

Note: the bot is intended for use in only a single server at any given time. Any messages from a server it hasn't been currently setup for will be ignored. Access the help functions with the command _help.

## Creating a Bot
If you want to use this code for your game, you will need to create your own bot application. You will need to take the following steps:
1. Copy this code repository into the folder you want to run it from
2. Go to https://discord.com/developers/applications
3. Click on 'New Application' in thr top right of the Applicatipns list
4. Name it and set the icon for your bot
5. In your new application, go to the 'Bot' section and click 'Add Bot'
6. Click on 'Click to Reveal Token' and then copy this
7. Go to the folder with the code and open Index.js (you can do this in notepad)
8. At the bottom of the file is the line "client.login('botID');" replace botID with the bot's token you've just copied (keep the single quote marks!). Save the file.
9. You need some way to install the Javascript libraries; I suggest installing Node from https://nodejs.org/en/download/.  You can then open a Node command prompt and enter "cd [folder address]" with the address of your new folder containing the bot code. This should navigate the command prompt to your folder. You should then enter the command 'npm install' to set up the libraries.

## Running the Bot
Now that you have a bot, you need to know how to set it running.
1. The first step is to invite the bot to your game server, if this is the first time you're running the bot on this server. Go to the discord developers applications page again and double-click on the bot's icon to bring up the setings. 
2. Under '0Auth2', go to the list of scopes and click 'bot'. Underneath this, you will see a new list of permissions; select 'Manage Roles', 'Manage Channels', 'View Channels', 'Manage Nicknames', and 'Send Messages'.
3. This will cause a URL to be generated under the 'scopes' section. Copy that URL and enter it into a web browser to invite the bot into your server. Make sure you've selected the permissions first as in the previous step, otherwise your bot won't be able to do its job!
8. Now you just need some way to run the code whenever you want the bot to be working. If you already installed Node earlier, you can use this. Open a Node command prompt and enter "cd [folder address]" with the address of your new folder containing the bot code. Finally, enter the command 'Node Index' to run the Index file.

Note that if the code is not currently being run somewhere, the bot won't function. You can just run it on your own computer if you're happy with it not working if you're not online, otherwise you'll need to find a server to keep it going.

# Setting up: CSV files
While it is possible to set up your game using the bot commands, you will likely find it quicker and easier to set up the csv input files that the  bot reads from during setup. There are three files, each located within the \csvs subfolder:
1. \characters.csv This contains the information for the characters. The fields are:
        Name    Nickname    Cash     Steal      Prevent     Code1   Code2   ...     Item1       Item2   ....
    The 'Name' field contains an ID tag associated with the character. Note that these must be unique and without spaces. 'Nickname' is the long name; the bot will switch users' nicknames on the server to match. 'Cash' is the amount of money the character has at the start of the game. 'Steal' indicates the number of times the character can use the stealing ability. Similarly, 'Prevent' is the number of times a character is able to choose to thwart a theft attempt against them. The 'Code' fields indicate which hidden information the character has access to; for example, if they have an item called 'Map' which contains hidden invisible under the title 'Rum', then the character is only able to view that if they have access to the 'Rum' code. You can have as many Code fields as you like. The 'Item' fields are the ID names of the items that the character is carrying. These need to match up with the item names used in the items.csv file. As with the character name, the item name must contain no spaces, and must be unique. Items, characters, and locations must also be unique from each other. As with the codes, you can have as many 'Item' columns as you need.
2. \locations.csv This file contains the information for the locations. The fields are:
        Name    Description     Cash    Item1   Item2   ...
     

## Using the Bot: Players




- \_setup: 


