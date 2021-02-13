exports.makeHelpText1= function(prefix){
    var helptext = "**Welcome! This is an inventory bot for use in online LARPs.** \n";
    helptext=helptext +"***" + prefix + "claim IDName***: Claim your character using their ID name. The bot will change your nickname and make a private channel for you to enter commands or talk to the GMs.\n";
    helptext=helptext +"***" + prefix + "release***: Let go of your character. Your private channel will disappear.\n";
    helptext=helptext +"***" + prefix + "gm message***: Send a message to the GM channel. The bot tell them who sent it.\n";
    helptext=helptext +"***" + prefix + "cast***: View list of characters currently in the game.\n";
    helptext=helptext +"***" + prefix + "view***: Use this command to view your current inventory. \n";
    helptext=helptext +"***" + prefix + "show IDName ItemName***: Show someone an item. They have 1 minute to examine it.\n";
    helptext=helptext +"***" + prefix + "view ItemName InfoCode***: Examine an item for any hidden information if you know the code to access it. Use all in place of the item name to list code information for all your items.\n";
    helptext=helptext +"***" + prefix + "give IDName ItemName***: Give an item to the specified character or location. \n";
    helptext=helptext +"***" + prefix + "pay IdName Amount***: Pay an amount of cash to another character or location\n";
    helptext=helptext +"***" + prefix + "help gm***: Adding 'gm' will also list the GM only commands - there are lots of these! \n";
    return helptext;
}
exports.makeHelpText2= function(prefix){
    var helptext="**GM Only Commands**:\n"
    helptext=helptext +"***" + prefix + "setup***: Load up from csv files and turn on editing. Type command from the private GM channel; any GM messages will be sent to the channel you used to set up.\n";
    helptext=helptext +"***" + prefix + "save***: Save the current configuration to csv files to be loaded next time the bot is run. \n";
    helptext=helptext +"***" + prefix + "run***: Turns on character claiming when you are ready to start the game.\n";
    helptext=helptext +"***" + prefix + "stop***: Deletes private character channels and switches off character claiming. \n";
    helptext=helptext +"***Character Commands***: GMs can access any of the character commands and also use them on locations by adding in the character ID name; e.g. " + prefix + "give IDName1 IDName2 ItemNqm2 will cause character 1 to give the specified item to character 2.\n";
    helptext=helptext +"***" + prefix + "msg IDName message***: Send a message to the specified character channel.\n";
    helptext=helptext +"***" + prefix + "view ObjectName all***: View the details of either a character or location inventory, or look at an item. Use the 'all' command to view all invisible item information as well as visible. Omit the item name to see a list of characters and locations and which characters have been claimed; this is useful for seeing the ID names. \n";
    helptext=helptext +"***" + prefix + "find ItemName***: Use this to find out which character currently has a specified item.";
    return helptext;
}
exports.makeHelpText3= function(prefix){
    var helptext="**Edit Commands (GM Only)**:\n"
    helptext=helptext +"***" + prefix + "addchar NewIDName***: Create new character. Note: ID Name must be a unique name, and must not include any spaces.\n";
    helptext=helptext +"***" + prefix + "addloc NewIDName***: Create new location. Note: ID Name must be a unique names, and must not include any spaces.\n";
    helptext=helptext +"***" + prefix + "additem IDName NewItemName***: Creates new item in the inventory of the character or location. Note: must be a unique names, and must not include any spaces.\n";
    helptext=helptext +"***" + prefix + "addinfo ItemName NewInfoName true/false text***: Adds a piece of information to the item. Specify the heading of the info (e.g. 'description', or a code word if it's secret information) and set the visibility to 'true' (available to anyone who looks) or 'false' (secret information accessed by the code name). Note: heading cannot contain spaces.\n";
    helptext=helptext +"***" + prefix + "delete ObjectName***: Deletes the specified character, location, or item from the game. Note: Deleting a character/location will also lose any items in their inventory\n";
    helptext=helptext +"***" + prefix + "deleteinfo ItemName InfoName***: Deletes item information. e.g. " + prefix + "deleteinfo map description. \n";
    helptext=helptext +"***" + prefix + "rename ObjectName NewObjectName***: Changes the ID name of a character, location, or item. Note: must be a unique names, and must not include any spaces.\n";
    helptext=helptext +"***" + prefix + "nickname IDName NewNickname***: Sets the character nickname. When a player claims this character, their Discord nickname will be set to this. Unlike an ID Name, nicknames can include spaces.\n";
    helptext=helptext +"***" + prefix + "cash IDName Amount***: Sets the cash amount in the inventory of a character or location. \n";
    helptext=helptext +"***" + prefix + "renameinfo ItemName InfoName NewInfoName***: Sets heading or codeword of a piece of item info. Note: heading cannot contain spaces.\n";
    helptext=helptext +"***" + prefix + "visible ItemName InfoName true/false***: Sets the visiblity of the specified information of the specified item.\n";
    helptext=helptext +"***" + prefix + "text ItemName InfoName detail***: Set the complete text associated with a piece of item information.";
    return helptext;
}