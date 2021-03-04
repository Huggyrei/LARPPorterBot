exports.makeHelpText1= function(prefix){
    var helptext = "**Welcome! This is an inventory bot for use in online LARPs.** \n";
    helptext=helptext +"**" + prefix + "claim *IDName***: Claim your character and access their private channel.\n";
    helptext=helptext +"**" + prefix + "release**: Let go of your character. Your private channel will disappear.\n";
    helptext=helptext +"**" + prefix + "gm *message***: Send a message to the GM channel. The bot tell them who sent it.\n";
    helptext=helptext +"**" + prefix + "cast**: View list of characters currently in the game.\n";
    helptext=helptext +"**" + prefix + "view**: View current inventory. You will see coded info your character has access to.\n";
    helptext=helptext +"**" + prefix + "show *IDName ItemName***: Show someone an item. They have 3 minutes to view it.\n";
    helptext=helptext +"**" + prefix + "view *ItemName/Cash/Code/Ability***: View a single item/cash/code/ability counts.\n";
    helptext=helptext +"**" + prefix + "give *IDName ItemName***: Give an item to the specified character or location. \n";
    helptext=helptext +"**" + prefix + "pay *IdName Amount***: Pay an amount of cash to another character or location\n";
    helptext=helptext +"**" + prefix + "steal *IDName ItemName***: Use up a stealing ability to steal named item or a random one; your victim will be notified in 5-10 minutes. If your victim has any prevention abilities, they get a chance to use one to prevent the theft and discover you identity. \n";
    helptext=helptext +"**" + prefix + "move *location***: Move to a location to gain access to its channel and view items there.\n";
    helptext=helptext +"**" + prefix + "leave**: Leave a location. You will lose access to its channel.\n";
    helptext=helptext +"**" + prefix + "take *ItemName/CashAmount***: Enter in a location to take something from there. The messages will vanish in approx 5 mins.\n";
    helptext=helptext +"**" + prefix + "drop *ItemName/CashAmount***: Enter in a location to leave something there. Your message will vanish in approx 5 mins.\n";
    helptext=helptext +"**" + prefix + "help gm/edit**: View GM only or GM edit commands - there are lots of these! \n";
    return helptext;
}
exports.makeHelpText2= function(prefix){
    var helptext="**GM Only Commands**:\n"
    helptext=helptext +"**" + prefix + "setup**: Load up from csv files and turn on editing. Type command from the private GM channel; any GM messages will be sent to the channel you used to set up.\n";
    helptext=helptext +"**" + prefix + "save**: Save the current configuration to csv files to be loaded next time the bot is run. \n";
    helptext=helptext +"**" + prefix + "run**: Turns on character claiming when you are ready to start the game.\n";
    helptext=helptext +"**" + prefix + "stop**: Deletes private character channels and switches off character claiming. \n";
    helptext=helptext +"***Character Commands***: GMs can access any of the character/location commands by adding in the character ID name; e.g. " + prefix + "give IDName1 IDName2 ItemName.\n";
    helptext=helptext +"**" + prefix + "msg *IDName message***: Send a message to the specified character channel.\n";
    helptext=helptext +"**" + prefix + "view *ObjectName code/all***: View the details of a character/location/item. Use 'all' to also view invisible info. Omit item name to see list of characters/locations.\n";
    helptext=helptext +"**" + prefix + "find *ItemName***: Use this to find out which character currently has a specified item.\n";
    helptext=helptext +"**" + prefix + "find *IDName***: Use this to find out which location a character is currently in.\n";
    helptext=helptext +"**" + prefix + "codes *IDName***: View list of information codes a character has access to\n";
    return helptext;
}
exports.makeHelpText3= function(prefix){
    var helptext="**Edit Commands (GM Only)**:\n"
    helptext=helptext +"**" + prefix + "addchar *NewIDName***: Create new character (must be unique name, no spaces.)\n";
    helptext=helptext +"**" + prefix + "addloc *NewIDName***: Create new location (must be unique name, no spaces.)\n";
    helptext=helptext +"**" + prefix + "additem *IDName NewItemName***: Creates new item in the inventory of the character or location. (Name must be unique name, and without spaces).\n";
    helptext=helptext +"**" + prefix + "addinfo *ItemName NewInfoName true/false text***: Adds new info to an item. If visibility is false, the info name is also the access code. (Name cannot contain spaces.\n";
    helptext=helptext +"**" + prefix + "delete *ObjectName***: Deletes specified character, location, or item from the game (including their inventory).\n";
    helptext=helptext +"**" + prefix + "deleteinfo *ItemName InfoName***: Deletes item information. e.g. " + prefix + "deleteinfo map Info1. \n";
    helptext=helptext +"**" + prefix + "rename *ObjectName NewObjectName***: Changes the ID name of a character, location, or item. (Name must be unique name, and without spaces).\n";
    helptext=helptext +"**" + prefix + "nickname *IDName NewNickname***: Sets the character nickname. When a player claims this character, their Discord nickname will be set to this. Can include spaces.\n";
    helptext=helptext +"**" + prefix + "description *IDName NewDescription***: Sets the location description. This will be posted in the location channel for players to read.\n";
    helptext=helptext +"**" + prefix + "cash *IDName Amount***: Sets the cash amount in a character or location inventory.\n";
    helptext=helptext +"**" + prefix + "renameinfo *ItemName InfoName NewInfoName***: Sets heading or codeword of a piece of item info. Note: heading cannot contain spaces.\n";
    helptext=helptext +"**" + prefix + "visible *ItemName InfoName true/false***: Sets the visiblity of the specified info.\n";
    helptext=helptext +"**" + prefix + "text *ItemName InfoName detail***: Set the text associated with a piece of item info.\n";
    helptext=helptext +"**" + prefix + "steal *IDName AbilityCount***: Set the no. of times a character can 'steal'.\n";
    helptext=helptext +"**" + prefix + "prevent *IDName AbilityCount***: Set the no. of times a character can prevent theft.\n";
    helptext=helptext +"**" + prefix + "addcode *IDName InfoName***: Add code to named character's code list to allow them to view hidden info with the same name.\n";
    helptext=helptext +"**" + prefix + "deletecode *IDName InfoName***: Remove item code from a character info access list.";
    return helptext;
}