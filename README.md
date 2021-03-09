# LARPPorterBot
Discord bot for managing character and location inventories with hidden item information in online LARPs.
To download the code from Github, just click 'Code' followed by 'Download Zip'

Players claim characters and get a private channel to view their inventory. They can view cash or items, give or show things to each other, and visit locations. Characters may also have a limited number of uses of a stealing ability or an ability to prevent thefts.

Items may have both pulic descriptions and hidden information only accessible by characters with the correct codes, as set by the GMs.

Edit commands - accessible only to users with a 'GM' role - allow GMs to create or edit characters, locations, and items. The game setup can be loaded in from csv files, or entered in using bot commands and then saved to csv files for later use.

_Note: the bot is intended for use in only a single server at any given time. Any messages from a server it hasn't been currently setup for will be ignored. Access the help functions with the command \_help._


## Creating a Bot
If you want to use this code for your game, you will need to create your own bot application. You will need to take the following steps:
1. Copy this code repository into the folder you want to run it from
2. Go to https://discord.com/developers/applications
3. Click on 'New Application' in thr top right of the Applicatipns list
4. Name it and set the icon for your bot
5. In your new application, go to the 'Bot' section and click 'Add Bot'. Click the button to confirm that you want to create a bot.
6. Click on 'Click to Reveal Token' and then copy this. **WARNING**: DO NOT SHARE THIS TOKEN WITH ANYONE ELSE; it could be used to hack into your bot. 
7. Go to the folder with the code and open Index.js (you can do this in notepad)
8. At the bottom of the file is the line "client.login('botID');" replace botID with the bot's token you've just copied (keep the single quote marks!). Save the file.
9. You need some way to install the Javascript libraries; I suggest installing Node from https://nodejs.org/en/download/.  You can then open a Node command prompt and enter "cd [folder address]" with the address of your new folder containing the bot code. This should navigate the command prompt to your folder. You should then enter the command 'npm install' to set up the libraries.


## Running the Bot
Now that you have a bot, you need to know how to set it running.
1. The first step is to invite the bot to your game server, if this is the first time you're running the bot on this server. Go to the discord developers applications page again and double-click on the bot's icon to bring up the setings. 
2. Under '0Auth2', go to the list of scopes and click 'bot'. Underneath this, you will see a new list of permissions; select 'Manage Roles', 'Manage Channels', 'View Channels', 'Manage Nicknames', and 'Send Messages'.
3. This will cause a URL to be generated under the 'scopes' section. Copy that URL and enter it into a web browser to invite the bot into your server. Make sure you've selected the permissions first as in the previous step, otherwise your bot won't be able to do its job!
4. Go into your server settings and check the role list. To use the bot, you need a role calld "GM"; give this to anyone you want to be able to use the GM only bot commands and view the private character channels. Additionally, check that the bot role is higher on the list than ay users you want it to be able to effect; I suggest moving it up until only the GM role is higher.
5. The bot assumes the existence of a private GM only channel, determined by wherever you type the setup command; messages intended for GM eyes only are sent here. Additionally, any private character channels will be created under a channel category called 'characters', and similarly for locations. However, the bot will create these categories if they don't exist, so you don't need to worry about this.
6. Now you just need some way to run the code whenever you want the bot to be working. If you already installed Node earlier, you can use this. Open a Node command prompt and enter "cd [folder address]" with the address of your new folder containing the bot code. Finally, enter the command 'Node Index' to run the Index file.

Once the bot is already on your server, you only need to follow **step 6** again to set the bot going. Note that if the code is not currently being run somewhere, the bot won't function, and it will forget any setup or any non-saved changes in the game configuration. You can just run it on your own computer if you're happy with it only working when you're online, otherwise you'll need to find a server to keep it going.


## Setting up: CSV files
While it is possible to set up your game using the bot commands, you will likely find it quicker and easier to set up the csv input files that the  bot reads from during setup. There are three files, each located within the \csvs subfolder:

1. _**characters.csv**_ This contains the information for the characters. The fields are:

        Name    Nickname    Cash     Steal      Prevent     Code1   Code2   ...     Item1       Item2   ....
    
    The 'Name' field contains an ID tag associated with the character. Note that these must be unique and without spaces. 'Nickname' is the long name; the bot will switch users' nicknames on the server to match. 'Cash' is the amount of money the character has at the start of the game. 'Steal' indicates the number of times the character can use the stealing ability. Similarly, 'Prevent' is the number of times a character is able to choose to thwart a theft attempt against them. The 'Code' fields indicate which hidden information the character has access to; for example, if they have an item called 'Map' which contains hidden invisible under the title 'Rum', then the character is only able to view that if they have access to the 'Rum' code. You can have as many Code fields as you like. The 'Item' fields are the ID names of the items that the character is carrying. These need to match up with the item names used in the items.csv file. As with the character name, the item name must contain no spaces, and must be unique. Items, characters, and locations must also be unique from each other. As with the codes, you can have as many 'Item' columns as you need.

2.   _**locations.csv**_ This file contains the information for the locations. The fields are:
                
         Name    Description     Cash    Item1   Item2   ...
     
     As with the characters file, the 'Name' field contains the location's ID. This must be unique (and unique from te character and item names) and without spaces. 'Description' is a field for text about the location; this will be posted to the top of the location channel so that players can see it if they move there during the game. 'Cash' indicates the amount of cash that is in this location at the start of the game. The 'Item' fields contain the ID names of the items that are in the location at the start of the game. As with the characters file, the Item columns can extend for as many columns as necessary, and must match the ID names in the items.csv file. Item names must be unique and contain no spaces. Note that the only location characters can't move to is one named 'GM'; hidden items can be stored here until the GM wants to allocate them during the game.

3.  _**items.csv**_ This file contains the information associated with the items. The fields are:
        
          ItemName    Heading     Visible     Text
    
   'ItemName' is the ID name of the item which this piece of information is associated with. Note that if the bot cannot locate an item with this name, it will create a new one and move it to a location called 'GM'. This is the only location that players can't move their characters into. 'Heading' is the name of this piece of information if it is visible (e.g. 'description') or the code required to access it if it is invisible (e.g. "SecretInfoJ8"). 'Visible' should be set to either true or false. If it is true, then the information will be viewable by any character who examines the item. If it is false, then only characters that possess the heading code will be able to see this information. Finally, 'Text' contains the details of the information which will be displayed.


## Using the Bot: Players
This information can be accessed using the command _help. 

**WARNING**: _If you are using Discord on a mobile device or tablet, you may find that your device does not automatically update Discord as it is trying to save power. You could miss something; for example, an attempted theft of your items! To fix this, you need to change the power settings for Discord. This will be something like: settings->device?->battery->power management or optimise battery usage->add Discord to list of apps that don't sleep, or remove from list of apps turned off_

- **\_claim *IDName***: Claim your character. You will be given access to their private channel to make bot commands or send private messages to the GMs.
- **\_release**: Let go of your character. You will be removed from the character's private channel.
- **\_gm *message***: Send a message to the GM channel. The bot will tell them who sent it.
- **\_cast**: View a list of characters currently in the game. Any unclaimed characters will not appear on this list.
- **\_view**: View your current inventory. You will see any hidden item information if and only if your character has access to see it.
- **\_show *IDName ItemName***: Show someone an item. They have 3 minutes to view it.
- **\_view *ItemName/Cash/Code/Ability***: View a single item/cash/code/ability counts.
- **\_give *IDName ItemName***: Give an item to the specified character using their unique ID name. 
- **\_pay *IdName Amount***: Pay an amount of cash to another character using their unique ID name.
- **\_steal *IDName ItemName***: Use up a stealing ability to steal either a named item or (if it is blank or does not match an item the character currently has), a random one from their inventory. Your victim will be notified that thier item is missing in 5-10 minutes. If your victim has any prevention abilities, they get a chance to use one to prevent the theft and discover you identity. 
- **\_move *location***: Move to a location to gain access to its channel and view, take, or drop items there.
- **\_leave**: Leave a location. You will lose access to its channel.
- **\_take *ItemName/CashAmount***: Enter this command in a location channel to take something from there. The messages will vanish in approx 5 mins.
- **\_drop *ItemName/CashAmount***: Enter this command in a location to leave something there. Your message will vanish in approx 5 mins.


## Using the Bot: GM Use Commands
This information can be accessed using the command _help gm. These are extra commands users with a GM role can use during the game.

- **\_setup**: Load up from the csv files and turn on editing. **WARNING**: Type this command from the private GM channel; any GM messages will be sent to the channel you used to set up.
- **\_save**: Save the current configuration to csv files to be loaded next time the bot is run. Can't be used while the game is running so that you don't overwrite the game's initial setup.
- **\_run**: Turns on character claiming when you are ready to start the game.
- **\_stop**: Deletes the private character and location channels and switches off character claiming. 
- ***Character Commands***: GMs can access any of the character/location commands by adding in the character ID name; e.g. _give IDName1 IDName2 ItemName.
- **\_msg *IDName message***: Send a message to the specified character's private channel.
- **\_view *ObjectName code/all***: View the details of a character/location/item. Use 'all' to also view invisible info. Omit item name to see list of characters/locations.
- **\_find *ItemName***: Use this to find out which character currently has a specified item.
- **\_find *IDName***: Use this to find out which location a character is currently in.
- **\_codes *IDName***: View list of information codes a character is able to access 


## Using the Bot: GM Edit Commands
This information can be accessed using the command _help edit. These commands allow users with a GM role to change game configuration such as create new locations or edit items. These can be used either during game play, or beforehand to setup the game if you prefer not to build the csv files yourself. **WARNING**: Changes to setup will not be saved to csv files unless you use the _save command. Such changes will be stored in the memory and will still be there until the bot is either turned off or re-initialised using _setup.

- **addchar *NewIDName***: Create a new character (NOTE: ID Names must be unique for all characters, locations, and items, and must not contain spaces.)
- **addloc *NewIDName***: Create new location (NOTE: ID Names must be unique for all characters, locations, and items, and must not contain spaces.)
- **additem *IDName NewItemName***: Creates new item in the inventory of the character or location. (NOTE: ID Names must be unique for all characters, locations, and items, and must not contain spaces.)
- **addinfo *ItemName NewInfoName true/false text***: Adds a new piece of information to an item. If visibility is set to false, the info will be hidden unless a character has an access code which matches the new info name. (Note: the info name cannot contain spaces.)
- **delete *ObjectName***: Deletes specified character, location, or item from the game. If you delete a character or location, you also delete their inventory.
- **deleteinfo *ItemName InfoName***: Deletes specified information associated with an item. e.g. deleteinfo map Info1. 
- **rename *ObjectName NewObjectName***: Changes the ID name of a character, location, or item. (NOTE: ID Names must be unique for all characters, locations, and items, and must not contain spaces.)
- **nickname *IDName NewNickname***: Sets the character nickname. When a player claims this character, their Discord nickname will be set to this. If the character is already claimed, the player's nickname will be updated. Can include spaces.
- **description *IDName NewDescription***: Sets the location description. This will be posted in the location channel for players to read. If the game is already running, the description message in the location's private channel will be updated.
- **cash *IDName Amount***: Sets the cash amount in a character or location inventory.
- **renameinfo *ItemName InfoName NewInfoName***: Sets heading or codeword of a piece of item info. Note: heading cannot contain spaces.
- **visible *ItemName InfoName true/false***: Sets the visiblity of the specified info. If it is invisible, only characters with the correct access code can see it.
- **text *ItemName InfoName detail***: Set the text associated with a piece of item info.
- **steal *IDName AbilityCount***: Set the number of times a character can steal an item during the game.
- **prevent *IDName AbilityCount***: Set the no. of times a character can prevent theft during the game.
- **addcode *IDName InfoName***: Add code to named character's code list to allow them to view hidden info with the same name.
- **deletecode *IDName InfoName***: Remove item code from a character info access list.
