"use strict";
const csv=require('csvtojson');                 const fs = require('fs');           const Discord = require('discord.js');
const Character = require("./character.js");    const Item = require("./item.js");  const Help= require('./help.js'); 
const createCsvWriter = require('csv-writer').createObjectCsvWriter;    const iconv = require('iconv-lite');                          

module.exports = class GameManager{
    constructor(){
        this.initialised=false; this.GMChannel=undefined;   this.parObj=undefined;  this.GMRoleID=undefined;
        this.guild=undefined;   this.clientID=undefined;    this.prefix="_";        this.characters=[];
        this.locations=[];   
    }
    msgHandler(msg, clientID){
        if(msg.content.toLowerCase().startsWith(this.prefix.toLowerCase())&&(msg.guild===this.guild||this.initialised===false))
        {
            var msgcontent = (msg.content.toLowerCase().startsWith(this.prefix.toLowerCase()) ? msg.content.substring(this.prefix.length) : msg.content);
            var spFind = msgcontent.indexOf(' '); var msgInfo1 = "";    var msgInfo2="";    var msgInfo3="";
            if(spFind !== -1){msgInfo1=msgcontent.substring(spFind+1).trim(); msgcontent=msgcontent.substring(0,spFind);}
            spFind=msgInfo1.indexOf(' '); 
            if(spFind !== -1){msgInfo2=msgInfo1.substring(spFind+1).trim(); msgInfo1=msgInfo1.substring(0,spFind);}
            spFind=msgInfo2.indexOf(' '); 
            if(spFind !== -1){msgInfo3=msgInfo2.trim().substring(spFind+1); msgInfo2=msgInfo2.substring(0,spFind);}
            switch(msgcontent.toLowerCase()){
                case 'help': this.getHelp(msg, msgInfo1); break;
                case 'prefix': this.setPrefix(msg, msgInfo1); break;
                case 'setup': this.setupCheck(msg, clientID); break;
                case 'run': this.run(msg); break;
                case 'stop': this.stop(msg); break;
                case 'save': this.saveAll(msg); break;

                case 'claim': this.claimCharacter(msg, msgInfo1); break;
                case 'release': this.releaseCharacter(msg); break;
                case 'cast': case 'characters': case 'list': this.viewChars(msg, false); break
                case 'gm': this.sendGMMsg(msg, msgInfo1 + " " + msgInfo2 + " " + msgInfo3); break;
                case 'msg': this.sendCharMsg(msg, msgInfo1, msgInfo2 + " " + msgInfo3); break;
                case 'view': case 'inventory': case 'items': this.view(msg, msgInfo1, msgInfo2); break;
                case 'examine': case 'look': this.examine(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'show' : case 'lend': this.show(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'give': case 'move': this.give(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'pay': this.pay(msg, msgInfo1, msgInfo2, msgInfo3); break;

                case 'find': this.findItem(msg, msgInfo1); break;
                case 'addchar': case 'newchar': this.addChar(msg, msgInfo1); break;
                case 'addloc': case 'newloc': this.addLoc(msg, msgInfo1); break;
                case 'additem': case 'newitem': this.addItem(msg, msgInfo1, msgInfo2); break;
                case 'addinfo': case 'newinfo': this.addInfo(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'delete': this.removeCheck(msg, msgInfo1); break;
                case 'deleteinfo': this.deleteInfo(msg, msgInfo1, msgInfo2); break;
                case 'rename': this.renameID(msg, msgInfo1, msgInfo2); break;
                case 'nickname': this.renameNickname(msg, msgInfo1, msgInfo2 + (msgInfo3==="",""," " + msgInfo3)); break;
                case 'cash': case 'money': this.changeCash(msg, msgInfo1, msgInfo2); break;
                case 'renameinfo': this.renameInfo(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'visiblility': case 'visible': this.editVisible(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'editinfo': case 'text': case 'detail': this.editText(msg, msgInfo1, msgInfo2, msgInfo3); break;
            }
        }
    }


    async sendMsg(channel, newContent, count){
        newContent=this.escapeMarkdown(newContent);
        if(newContent.length>2000){
            var newContent1=newContent.substring(0,2000);
            var newContent2=newContent.substring(2001);
            await this.sendMsg(channel, newContent1, count);
            await this.sendMsg(channel, newContent2, count);
            return;
        }
        if(count===undefined){count=3;}
        if(count>0){
            try{await channel.send(newContent);}catch{
                setTimeout(async ()=> {try{await this.sendMsg(chnnel, newContent, count-1)}catch{}}, 250);
            }
        }else{
            try{await this.GMChannel.send("ERROR: Could not send one of my messages, I'm not sure why \nThe message was: " + newContent);}catch{}
        }
    }
    escapeMarkdown(text) {
        var unescaped = text.replace(/\\(_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
        var escaped = unescaped.replace(/(_|`|~|\\)/g, '\\$1'); // escape _, `, ~, \
        return escaped;
      }

    getHelp(msg, msgInfo1){
        this.sendMsg(msg.channel,  Help.makeHelpText1(this.prefix));
        if(msgInfo1.toLowerCase()==="gm") {
            this.sendMsg(msg.channel,  Help.makeHelpText2(this.prefix));
            this.sendMsg(msg.channel,  Help.makeHelpText3(this.prefix));
        }
    }

    setPrefix(msg, newPrefix){
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            this.prefix=newPrefix;
            this.sendMsg(msg.channel,"Prefix changed")
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to change the prefix");}
    }

    async setupCheck(msg, clientID){
        if(this.initialised){
            this.sendMsg(msg.channel,"Are you sure you want to rebuild? This will destroy the current setup. If you want to keep it use the save command first. Type y to confirm the rebuild or anything else to cancel");
            var collector = await new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id, { time: 30000 });
            this.msgCollected=false;
            collector.once('collect', async message =>{
            this.msgCollected=true;
            if (message.content.toLowerCase() ==="y") {this.setup(msg, clientID);}
            else{this.sendMsg(msg.channel,"Rebuild cancelled");}
        });
        collector.on('end', async collected => {
            if(this.msgCollected===false){
                this.sendMsg(msg.channel,"Rebuild cancelled");
            }
        });
        }
        else{this.setup(msg, clientID);}
    }

    async setup(msg, clientID){
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        var findGM = msg.member.roles.cache.find(r => r.name === "GM");
        if(findGM!==undefined){
            if(this.running){this.sendMsg(msg.channel,"ERROR: Game is currently running"); return;}
            this.sendMsg(msg.channel,"INITIALISING...")
            this.GMRoleID=findGM.id;    this.locations=[];         this.characters=[];     this.initialised=false;
            this.clientID=clientID;     this.guild=msg.guild;   this.GMChannel=msg.channel; 
            if(!this.guild.me.hasPermission("MANAGE_CHANNELS")){this.sendMsg(msg.channel,"WARNING: I can't create channels as I don't have the 'Manage Channels' permission"); }
            if(!this.guild.me.hasPermission("MANAGE_NICKNAMES")){this.sendMsg(msg.channel,"WARNING: I can't name people according to their characters; I don't have the 'Manage Nicknames' permission");}
            if(this.guild!==undefined){
                this.parObj = this.guild.channels.cache.find(c => c.name == "GM" && c.type == "category");
                if(this.parObj===undefined){
                    try{this.parObj= await this.guild.channels.create("GM",{ type: 'category' });}catch{};
                }
                if(fs.existsSync('./csvs/characters.csv')){
                    await csv().fromFile('./csvs/characters.csv').then((fileData)=>{
                        for(var i=0;i<fileData.length;i++) { 
                            this.characters.push(new Character(fileData[i],this.guild, i, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, msg));
                        }
                        this.initLocations(msg);
                    }).catch(err => {this.sendMsg(msg.channel,"Error: Could not copy data from file /csvs/characters.csv");});  
                } else{this.sendMsg(msg.channel,"Warning: character list file not found"); await this.initLocations(msg);}
            }
            else{this.sendMsg(msg.channel,"Error: Bot not initialised");}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to initialise the bot");}
    }
    async initLocations(msg){
        if(fs.existsSync('./csvs/locations.csv')){
            await csv().fromFile('./csvs/locations.csv').then((fileData)=>{
                for(var i=0;i<fileData.length;i++) { 
                    this.locations.push(new Character(fileData[i], this.guild, i, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, msg));
                }
                this.initItemsList(msg);
            }).catch(err => {this.sendMsg(msg.channel,"Could not copy data from file /csvs/locations.csv");});  
        } else{this.sendMsg(msg.channel,"Warning: location list file not found"); await this.initItemsList(msg);}  
    }

    async initItemsList(msg){
        if(fs.existsSync('./csvs/items.csv')){
            var fileContent = fs.readFileSync('./csvs/items.csv', { encoding : 'binary'});
            fileContent=iconv.decode(fileContent, 'win1252');
            await csv().fromString(fileContent).then(async (fileData)=>{
                for(var i=0;i<fileData.length;i++) {
                    if(!fileData[i].hasOwnProperty('ItemName')){this.sendMsg(msg.channel, "ERROR: Cannot find ItemName field for items.csv"); break;}
                    var itemName=fileData[i].ItemName;
                    itemName=itemName.toLowerCase();
                    var char = this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===itemName));
                    if(char===undefined){char = this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===itemName));}
                    if(char===undefined){
                        this.sendMsg(msg.channel,"ERROR: Cannot find item " + itemName + ", adding it to default location 'GM'");
                        char=this.locations.find(x=>x.nameID.toLowerCase()==="gm");
                        if(char===undefined){ 
                            char = new Character({name: "GM", cash: 0}, this.guild, this.locations.length, this.parObj, this.clientID, this.GMRoleID, this.GMChannel,msg);
                            this.locations.push(char);
                        }
                        char.addItem(msg, itemName);
                    }
                    await this.checkCharInitialised(char);
                    char.items.find(x=>x.nameID.toLowerCase()===itemName).loadFileData(msg, fileData[i]);
                }
                this.initialised=true;      this.sendMsg(msg.channel,"Bot initialised");
            }).catch(err => {this.sendMsg(msg.channel,"Could not copy data from file /csvs/items.csv");});  
        } else{this.initialised=true;this.sendMsg(msg.channel,"Bot initialised");}  
    }
    async checkCharInitialised(char, count){
        if(count===undefined){count=20;}
        if(char.initialised){return true;}
        if(count=0){return false;}
        return await setTimeout(async ()=> {try{return await this.checkCharInitialised(char, count-1)}catch{}}, 100);
    }
    run(msg){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not yet initialised"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            for(var i=0;i<this.characters.length;i++){
                this.characters[i].run();
            }
            for(var i=0;i<this.locations.length;i++){
                this.locations[i].run();
            }
            this.sendMsg(msg.channel,"Bot is running. Players can now claim characters");
        }else{{this.sendMsg(msg.channel,"ERROR: You do not have a GM role");}}
    }
    stop(msg){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not yet initialised"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            for(var i=0;i<this.characters.length;i++){
                this.characters[i].stop(msg);
            }
            for(var i=0;i<this.locations.length;i++){
                this.locations[i].stop(msg);
            }
            this.sendMsg(msg.channel,"Bot is no longer running. Characters have been released and cannot be claimed.");
        }else{{this.sendMsg(msg.channel,"ERROR: You do not have a GM role");}}
    }
    async sendGMMsg(msg, msgInfo){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        try{await this.GMChannel.send(this.getAuthorName(msg) + ": " + msgInfo)
        }catch(error){this.sendMsg(msg.channel, "ERROR: Message did not send"); return;};
        this.sendMsg(msg.channel,"Message sent to GM channel");
    }
    sendCharMsg(msg, msgInfo1, msgInfo2){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char = this.characters.find(x => x.nameID.toLowerCase()===msgInfo1);
            if(char===undefined){this.sendMsg(msg.channel,"Character cannot be found"); return;}
            char.sendInfo(msg, "GM Message: " + msgInfo2);
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to send a message to a character's private channel");}
    }
    getAuthorName(msg){
        return msg.member===undefined ? msg.author.username : (msg.member.nickname===null ? msg.author.username : msg.member.nickname);
    }
    claimCharacter(msg, msgInfo){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        if(this.characters.find(x=>x.userID===msg.author.id)){this.sendMsg(msg.channel,"ERROR: You already have a character!"); return;}
        var char = this.characters.find(x => x.nameID.toLowerCase()===msgInfo.toLowerCase());
        if(char===undefined){this.sendMsg(msg.channel,"Character cannot be found"); return;}
        char.claim(msg, this.getAuthorName(msg));
    }
    releaseCharacter(msg){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        var char = this.characters.find(x => x.userID===msg.author.id);
        if(char===undefined && msg.member.roles.cache.find(r => r.name === "GM")){
            char = this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1.toLowerCase());
        }
        if(char===undefined) {this.sendMsg(msg.channel,"Character cannot be found"); return;}
        char.release(msg);
    }
    view(msg, msgInfo1, msgInfo2){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        var char = this.characters.find(x => x.userID===msg.author.id);
        if(char===undefined){
            if(msg.member.roles.cache.find(r => r.name === "GM")){
                if(msgInfo1===""){this.viewChars(msg,true); return;}
                msgInfo1=msgInfo1.toLowerCase();
                char = this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
                if(char===undefined){char = this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
                if(char===undefined){
                    var par=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
                    if(par===undefined){par=this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
                    if(par!==undefined){char=par.items.find(x=>x.nameID.toLowerCase()===msgInfo1);}
                }
                if(char===undefined){this.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
                var gmFlag=false; 
                switch(msgInfo2.toLowerCase()){
                    case "all": case "true": case "invisible": case "secret": case "private": case "yes": case "y": case "t": gmFlag=true;
                }
                char.view(msg, gmFlag);
            }else{this.sendMsg(msg.channel,"ERROR: Cannot find your character");}
        }else{char.view(msg,false);}
    }
    viewChars(msg, gmFlag){
        if(this.characters.length===0){this.sendMsg(msg.channel,"No characters found");}
        else{
            var msgContent="CHARACTERS:"
            for(var i=0;i<this.characters.length;i++){
                var char=this.characters[i];
                if(gmFlag || char.userID!==undefined) {
                    msgContent = msgContent + "\n**ID Name: **" + char.nameID + "   **Nickname:**  " + char.charName +(gmFlag ? (char.userID===undefined ? "*(unclaimed)*" : "*(claimed)*") : "");
                }
            }
            this.sendMsg(msg.channel,msgContent);
        }
        if(gmFlag===false){return;}
        if(this.locations.length===0){this.sendMsg(msg.channel,"No locations found");}
        else{
            var msgContent="LOCATIONS:"
            for(var i=0;i<this.locations.length;i++){
                msgContent = msgContent + "\n**ID Name: **" + this.locations[i].nameID;
            }
            this.sendMsg(msg.channel,msgContent);
        }
    }
    examine(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        var char = this.characters.find(x => x.userID===msg.author.id);
        if(char===undefined){
            if(msgInfo1===""){this.sendMsg(msg.channel,"ERROR: Cannot find your character");return; }
            if(msg.member.roles.cache.find(r => r.name === "GM")){
                msgInfo1=msgInfo1.toLowerCase();
                char = this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
                if(char===undefined){char = this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
                if(char===undefined){
                    var par=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
                    if(par===undefined){par=this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
                    if(par!==undefined){
                        char=par.items.find(x=>x.nameID.toLowerCase()===msgInfo1);
                        char.examine(msg,msgInfo2);
                    }else{this.sendMsg(msg.channel,"ERROR: Specified character or location not found"); return;}
                }else{char.examine(msg, msgInfo2, msgInfo3)};
            }else{this.sendMsg(msg.channel,"ERROR: You do not have a GM role");}
        }else{char.examine(msg,msgInfo1,msgInfo2);}
    }
    show(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        var char = this.characters.find(x => x.userID===msg.author.id);
        msgInfo1=msgInfo1.toLowerCase();
        if(char===undefined){
            if(msgInfo1===""){this.sendMsg(msg.channel,"ERROR: Cannot find your character");return; }
            if(msg.member.roles.cache.find(r => r.name === "GM")){
                msgInfo2=msgInfo2.toLowerCase()
                char = this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
                if(char===undefined){char = this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
                if(char===undefined){char=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
                if(char===undefined){char=this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
                if(char===undefined){this.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
                var char2=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo2);
                if(char2===undefined){this.sendMsg(msg.channel,"Cannot find the character to show the item to"); return;}
                char.show(msg, char2, msgInfo3);
            }else{this.sendMsg(msg.channel,"ERROR: You do not have a GM role");}
        }else{
            var char2=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
            if(char2===undefined){this.sendMsg(msg.channel,"Cannot find the character to show the item to"); return;}
            char.show(msg, char2, msgInfo2);
        }
    }
    give(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        var char = this.characters.find(x => x.userID===msg.author.id);
        msgInfo1=msgInfo1.toLowerCase();
        if(char===undefined){
            if(msgInfo1===""){this.sendMsg(msg.channel,"ERROR: Cannot find your character");return; }
            if(msg.member.roles.cache.find(r => r.name === "GM")){
                msgInfo2=msgInfo2.toLowerCase();
                char = this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
                if(char===undefined){char = this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
                if(char===undefined){this.sendMsg(msg.channel,"ERROR: Specified character or location  where the item is located not found"); return;}
                var char2=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo2);
                if(char2===undefined){char2=this.locations.find(x=>x.nameID.toLowerCase()===msgInfo2);}
                if(char2===undefined){this.sendMsg(msg.channel,"Cannot find the character to give the item to"); return;}
                char.give(msg, char2, msgInfo3);
            }else{this.sendMsg(msg.channel,"ERROR: You do not have a GM role");}
        }else{
            var char2=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
            if(char2===undefined){char2=this.locations.find(x=>x.nameID.toLowerCase()===msgInfo2);}
            if(char2===undefined){this.sendMsg(msg.channel,"Cannot find the character to give the item to"); return;}
            char.give(msg, char2, msgInfo2);
        }
    }
    pay(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot not initialised");return;}
        var char = this.characters.find(x => x.userID===msg.author.id);
        msgInfo1=msgInfo1.toLowerCase();
        if(char===undefined){
            if(msgInfo1===""){this.sendMsg(msg.channel,"ERROR: Cannot find your character");return; }
            if(msg.member.roles.cache.find(r => r.name === "GM")){
                msgInfo2=msgInfo2.toLowerCase();
                char = this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
                if(char===undefined){char = this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
                if(char===undefined){this.sendMsg(msg.channel,"ERROR: Specified character or location  where the item is located not found"); return;}
                var char2=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo2);
                if(char2===undefined){this.sendMsg(msg.channel,"Cannot find the character to give the item to"); return;}
                char.pay(msg, char2, msgInfo3);
            }else{this.sendMsg(msg.channel,"ERROR: You do not have a GM role");}
        }else{
            var char2=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
            if(char2===undefined){this.sendMsg(msg.channel,"Cannot find the character to give the item to"); return;}
            char.pay(msg, char2, msgInfo2);
        }
    }

    //GM only commands
    findItem(msg, msgInfo1){
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
            if(char!==undefined){this.sendMsg(msg.channel,"Character " + char.charName + " has item " + msgInfo1); return;}
            char=this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
            if(char!==undefined){this.sendMsg(msg.channel,"Item " + msgInfo1 + " is in location "+char.charName); return;}
            this.sendMsg(msg.channel,"ERROR: Specified item not found"); return;
        }else{this.sendMsg(msg.channel,"ERROR: Only the GMs can use this command!");}
    }
    addChar(msg, msgInfo){
        if(msgInfo==""){this.sendMsg(msg.channel,"ERROR: Cannot add character with no name"); return;}
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            if(this.nameExists(msgInfo)){this.sendMsg(msg.channel,"ERROR: Name already exists"); return;}
            this.characters.push(new Character({name: msgInfo, cash: 0}, this.guild, this.characters.length, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, msg));
            this.sendMsg(msg.channel,"New character " + msgInfo + " created");
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to add a new character");}
    }
    addLoc(msg, msgInfo){
        if(msgInfo==""){this.sendMsg(msg.channel,"ERROR: Cannot add character with no name"); return;}
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            if(this.nameExists(msgInfo)){this.sendMsg(msg.channel,"ERROR: Name already exists"); return;}
            this.locations.push(new Character({name: msgInfo, cash: 0}, this.guild, this.locations.length, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, msg));
            this.sendMsg(msg.channel,"New location " + msgInfo + " created");
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to add a new character");}
    }
    removeCheck(msg, msgInfo){
        this.sendMsg(msg.channel,"Are you sure you want to delete " + msgInfo + "? Type y to confirm or anything else to cancel");
        var collector = new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id, { time: 30000 });
        this.msgCollected=false;
        collector.once('collect', async message =>{
            this.msgCollected=true;
            if (message.content.toLowerCase() ==="y") {this.remove(msg, msgInfo);}
            else{this.sendMsg(msg.channel,"Deletion cancelled");}
        });
        collector.on('end', async collected => {
            if(this.msgCollected===false){
                this.sendMsg(msg.channel,"Deletion cancelled");
            }
        });
    }
    remove(msg, msgInfo1){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var charIndex = this.characters.findIndex(x=>x.nameID.toLowerCase()===msgInfo1);
            if(charIndex===-1){
                charIndex = this.locations.findIndex(x=>x.nameID.toLowerCase()===msgInfo1);
                if(charIndex===-1){
                    for(var i=0;i<this.characters.length;i++){
                        if(this.characters[i].items.find(x=>x.nameID.toLowerCase()===msgInfo1)){charIndex=i;}
                    }
                    if(charIndex===-1){
                        for(var i=0;i<this.locations.length;i++){
                            if(this.locations[i].items.find(x=>x.nameID.toLowerCase()===msgInfo1)){charIndex=i;}
                        }
                        if(charIndex===-1){this.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
                        this.locations[charIndex].removeItem(msg, msgInfo1);
                    }
                    else{this.characters[charIndex].removeItem(msg,msgInfo1);}
                }else{
                    this.locations.splice(charIndex,1);
                    this.sendMsg(msg.channel,"Location " + msgInfo1 + " has been removed");
                }
            }else{
                this.characters.splice(charIndex, 1);
                this.sendMsg(msg.channel,"Character " + msgInfo1 + " has been removed");
            }
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to delete a character, location, or item");}
    }
    renameID(msg, msgInfo1, msgInfo2){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            if(this.nameExists(msgInfo2)){this.sendMsg(msg.channel,"ERROR: Name already exists"); return;}
            var char=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
            if(char===undefined){char=this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
            if(char===undefined){
                var par=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
                if(par===undefined){par=this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
                if(par!==undefined){char=par.items.find(x=>x.nameID.toLowerCase()===msgInfo1);}
            }
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find character, location, or item " + msgInfo1);}
            else{char.renameID(msg, msgInfo2);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to edit a character");}
    }
    renameNickname(msg, msgInfo1, msgInfo2){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find character " + msgInfo1);}
            else{char.renameNickname(msg, msgInfo2);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to edit a character");}
    }
    addItem(msg, msgInfo1, msgInfo2){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            if(this.nameExists(msgInfo2)){this.sendMsg(msg.channel,"ERROR: Name already exists"); return;}
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
            if(char===undefined){char=this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find character or location " + msgInfo1);}
            else{char.addItem(msg, msgInfo2);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to add a new item");}
    }
    changeCash(msg, msgInfo1, msgInfo2){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.nameID.toLowerCase()===msgInfo1);
            if(char===undefined){char=this.locations.find(x=>x.nameID.toLowerCase()===msgInfo1);}
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find character or location " + msgInfo1);}
            else{char.changeCash(msg, msgInfo2);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to edit a character or location");}
    }
    renameInfo(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
            if(char===undefined){this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find item " + msgInfo1);}
            else{char.items.find(x=>x.nameID.toLowerCase()===msgInfo1).renameInfo(msg, msgInfo2, msgInfo3);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to edit item information");}
    }
    editVisible(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
            if(char===undefined){this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find character or location " + msgInfo1);}
            else{char.items.find(x=>x.nameID.toLowerCase()===msgInfo1).editVisible(msg, msgInfo2, msgInfo3);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to edit item information");}
    }
    editText(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
            if(char===undefined){this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find character or location " + msgInfo1);}
            else{char.items.find(x=>x.nameID.toLowerCase()===msgInfo1).editText(msg, msgInfo2, msgInfo3);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to edit item information");}
    }
    deleteInfo(msg, msgInfo1, msgInfo2){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
            if(char===undefined){this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find character or location " + msgInfo1);}
            else{char.items.find(x=>x.nameID.toLowerCase()===msgInfo1).deleteInfo(msg, msgInfo2);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to delete item information");}
    }
    addInfo(msg, msgInfo1, msgInfo2, msgInfo3){
        if(msgInfo2==""){this.sendMsg(msg.channel,"Cannot add an item with no heading"); return;}
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            msgInfo1=msgInfo1.toLowerCase();
            var char=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));
            if(char===undefined){this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===msgInfo1));}
            if(char===undefined){this.sendMsg(msg.channel,"ERROR: Cannot find item " + msgInfo1);}
            else{char.items.find(x=>x.nameID.toLowerCase()===msgInfo1).addInfo(msg, msgInfo2, msgInfo3);}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to add new Item info");}
    }
    async saveAll(msg){
        if(this.initialised===false){this.sendMsg(msg.channel,"ERROR: Bot has not been initialised"); return;}
        if(this.running===true){this.sendMsg(msg.channel,"ERROR: Can't save configuration while game is running"); return;}
        if(msg.member===undefined){this.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            if(fs.existsSync('./csvs')===false){
                try{await fs.mkdirSync('./csvs');}catch{this.sendMsg(msg.channel, "ERROR: Folder /csvs/ does not exist and I can't create it, could you please make this folder and try again?"); return;}
            }
            var headerList=[{id: 'name', title: "Name"}, {id: 'nickname', title: "Nickname"}, {id: 'cash', title: "Cash"}]
            var itemCount=0;    var charData=[];
            for(var i=0;i<this.characters.length;i++){
                if(this.characters[i].items.length>itemCount){itemCount=this.characters[i].items.length;}
            }
            for(var i=0;i<this.locations.length;i++){
                if(this.locations[i].items.length>itemCount){itemCount=this.characters[i].items.length;}
            }
            for(var i=0;i<itemCount;i++){
                headerList.push({id: 'item'+(i+1),title: "Item"+(i+1)});
            }
            for(var i=0;i<this.characters.length;i++){
                charData.push(this.characters[i].save(msg, itemCount));
            }
            try{
                var csvWriter = createCsvWriter({path: './csvs/characters.csv',header: headerList});
                await csvWriter.writeRecords(charData).then(async ()=>{
                    charData=[];
                    for(var i=0;i<this.locations.length;i++){
                        charData.push(this.locations[i].save(msg, itemCount));
                    }
                    try{
                        var csvWriter = createCsvWriter({path: './csvs/locations.csv',header: headerList});
                        await csvWriter.writeRecords(charData).then(()=> this.sendMsg(msg.channel,"Records saved"));
                    }catch{this.sendMsg(msg.channel,"ERROR: Could not save to locations.csv, do you have it open?");}
                });
            }catch{this.sendMsg(msg.channel,"ERROR: Could not save to characters.csv, do you have it open?");}
        }else{this.sendMsg(msg.channel,"Error: You need a GM role to save game configurations");}
    }
    nameExists(newName){
        var exists=false;   newName=newName.toLowerCase();
        if(this.characters.find(x=>x.nameID.toLowerCase()===newName)){exists=true;}
        if(this.locations.find(x=>x.nameID.toLowerCase()===newName)){exists=true;}
        if(this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===newName))){exists=true;}
        if(this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===newName))){exists=true;}
        return exists;
    }
}

//associate locations with a hidden channel/role?
//Give characters specific abilities to read particular codes?->GM view codes to see all items with associated codes
//Refactor error checks / finding item!
//look into file encoding to see if possible to check which one first