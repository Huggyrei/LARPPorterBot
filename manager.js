"use strict";
const fs = require('fs'); const createCsvWriter = require('csv-writer').createObjectCsvWriter;  
const Character = require("./character.js");    const Item = require("./item.js");  
const Help= require('./help.js');               const Utility = require("./utility.js");                     

module.exports = class GameManager{
    constructor(){
        this.initialised=false; this.GMChannel=undefined;   this.parObj=undefined;  this.GMRoleID=undefined;
        this.guild=undefined;   this.clientID=undefined;    this.prefix="_";        this.characters=[];
        this.locations=[];      this.utility=new Utility(); this.running=false;
    }
    msgHandler(msg, clientID){
        if(msg.content.toLowerCase().startsWith(this.prefix.toLowerCase())&&(msg.guild===this.guild||this.initialised===false))
        {
            var msgcontent = (msg.content.toLowerCase().startsWith(this.prefix.toLowerCase()) ? msg.content.substring(this.prefix.length) : msg.content);
            var msgInfo1 = "";    var msgInfo2="";    var msgInfo3="";  var msgInfo4="";
            [msgcontent,msgInfo1]=this.utility.splitStr(msgcontent," ");
            [msgInfo1, msgInfo2]=this.utility.splitStr(msgInfo1," ");
            [msgInfo2, msgInfo3]=this.utility.splitStr(msgInfo2," ");
            [msgInfo3, msgInfo4]=this.utility.splitStr(msgInfo3," ");
            
            switch(msgcontent.toLowerCase()){
                case 'help': this.getHelp(msg, msgInfo1); break;
                case 'prefix': this.setPrefix(msg, msgInfo1); break;
                case 'setup': this.setupCheck(msg, clientID); break;
                case 'run': this.run(msg); break;
                case 'stop': this.stop(msg); break;
                case 'save': this.saveAll(msg); break;

                case 'claim': this.claimCharacter(msg, msgInfo1); break;
                case 'release': this.releaseCharacter(msg, msgInfo1); break;
                case 'cast': case 'characters': case 'list': this.viewChars(msg, false); break
                case 'gm': this.sendGMMsg(msg, msgInfo1 + " " + msgInfo2 + " " + msgInfo3 + " " + msgInfo4); break;
                case 'msg': this.sendCharMsg(msg, msgInfo1, msgInfo2 + " " + msgInfo3 + " " + msgInfo4); break;
                case 'view': case 'inventory': case 'items': case 'examine' : case 'look': this.view(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'show' : case 'lend': this.show(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'give': case 'move': this.give(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'pay': this.pay(msg, msgInfo1, msgInfo2, msgInfo3); break;

                case 'find': this.findItem(msg, msgInfo1); break;
                case 'addchar': case 'newchar': this.addChar(msg, msgInfo1); break;
                case 'addloc': case 'newloc': this.addLoc(msg, msgInfo1); break;
                case 'additem': case 'newitem': this.addItem(msg, msgInfo1, msgInfo2); break;
                case 'addinfo': case 'newinfo': this.addInfo(msg, msgInfo1, msgInfo2, msgInfo3, msgInfo4); break;
                case 'delete': this.removeCheck(msg, msgInfo1); break;
                case 'deleteinfo': this.deleteInfo(msg, msgInfo1, msgInfo2); break;
                case 'rename': this.renameID(msg, msgInfo1, msgInfo2); break;
                case 'nickname': this.renameNickname(msg, msgInfo1, msgInfo2 + (msgInfo3==="",""," " + msgInfo3) + (msgInfo4==="",""," " + msgInfo4)); break;
                case 'cash': case 'money': this.changeCash(msg, msgInfo1, msgInfo2); break;
                case 'renameinfo': this.renameInfo(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'visiblility': case 'visible': this.editVisible(msg, msgInfo1, msgInfo2, msgInfo3); break;
                case 'editinfo': case 'text': case 'detail': this.editText(msg, msgInfo1, msgInfo2, msgInfo3) + (msgInfo4==="",""," " + msgInfo4); break;
            }
        }
    }
    getHelp(msg, msgInfo1){
        this.utility.sendMsg(msg.channel,  Help.makeHelpText1(this.prefix));
        if(msgInfo1.toLowerCase()==="gm") {
            this.utility.sendMsg(msg.channel,  Help.makeHelpText2(this.prefix));
            this.utility.sendMsg(msg.channel,  Help.makeHelpText3(this.prefix));
        }
    }
    setPrefix(msg, newPrefix){
        if(msg.member===undefined){this.utility.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return;}
        if(msg.member.roles.cache.find(r => r.name === "GM")){
            this.prefix=newPrefix;
            this.utility.sendMsg(msg.channel,"Prefix changed")
        }else{this.utility.sendMsg(msg.channel,"Error: You need a GM role to change the prefix");}
    }
    checks(msg, checkInitialised, checkRunning, checkNotRunning, checkGM, allowPlayer){
        if(this.initialised===false && checkInitialised){this.utility.sendMsg(msg.channel,"ERROR: Bot is not initialised"); return false;}
        if(this.running===false && checkRunning){this.utility.sendMsg(msg.channel,"ERROR: Game is not currently running"); return false;}
        if(this.running && checkNotRunning){this.utility.sendMsg(msg.channel,"ERROR: Game is currently running"); return false;}
        if(checkGM){return this.checkGM(msg, allowPlayer);}
        return true;
    }
    checkGM(msg, allowPlayer){
        var char=undefined;
        if(allowPlayer){
            char = this.characters.find(x => x.userID===msg.author.id);
            if(char!==undefined){return char;}
        }
        if(msg.member===undefined){this.utility.sendMsg(msg.channel,"ERROR: I can't work out which server you're on"); return false;}
        if(msg.member.roles.cache.find(r => r.name.toLowerCase() === "gm")===undefined){
            this.utility.sendMsg(msg.channel,allowPlayer?"ERROR: I can't find your character" : "ERROR: You need a GM role to run this command"); return false;
        }
        return true;
    }
    findObject(objectName, includeCharacters, includeLocations, includeItems, returnItem){
        objectName=objectName.toLowerCase();
        var findObj=undefined;
        if(includeCharacters){findObj=this.characters.find(x=>x.nameID.toLowerCase()===objectName);}
        if(includeLocations && findObj===undefined){findObj=this.locations.find(x=>x.nameID.toLowerCase()===objectName);}
        if(findObj!==undefined || includeItems===false){return findObj;}
        findObj=this.characters.find(x=>x.items.find(y=>y.nameID.toLowerCase()===objectName));
        if(findObj===undefined){findObj=this.locations.find(x=>x.items.find(y=>y.nameID.toLowerCase()===objectName));}
        if(findObj!==undefined && returnItem){findObj=findObj.items.find(x=>x.nameID.toLowerCase()==objectName);}
        return findObj;
    }

    setupCheck(msg, clientID){
        if(this.checks(msg, false, false, true, true, false)===false){return;}
        if(this.initialised){
            var warningContent = "Are you sure you want to rebuild? This will destroy the current setup. If you want to keep it use the save command first. Type y to confirm the rebuild or anything else to cancel";
            this.utility.checkMessage(msg, warningContent, "Rebuild Cancelled", this.setup, this, [msg, clientID]);
        }
        else{this.setup(msg, clientID);}
    }
    async setup(msg, clientID){
        this.utility.sendMsg(msg.channel,"INITIALISING...");
        this.GMRoleID=msg.member.roles.cache.find(r => r.name === "GM").id;    
        this.locations=[];          this.characters=[];     this.initialised=false;
        this.clientID=clientID;     this.guild=msg.guild;   this.GMChannel=msg.channel; 
        this.utility.setChannel(this.GMChannel);
        if(!this.guild.me.hasPermission("MANAGE_CHANNELS")){this.utility.sendMsg(msg.channel,"WARNING: I can't create channels as I don't have the 'Manage Channels' permission"); }
        if(!this.guild.me.hasPermission("MANAGE_NICKNAMES")){this.utility.sendMsg(msg.channel,"WARNING: I can't name people according to their characters; I don't have the 'Manage Nicknames' permission");}
        this.parObj = this.guild.channels.cache.find(c => c.name == "GM" && c.type == "category");
        if(this.parObj===undefined){try{this.parObj= await this.guild.channels.create("GM",{ type: 'category' });}catch{};}
        this.utility.readFile(msg, './csvs/characters.csv', this.initCharacters,this,[msg], true);
    }
    initCharacters(msg, fileData){
        for(var i=0;i<fileData.length;i++) { 
            this.characters.push(new Character(fileData[i],this.guild, i, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, this.utility, msg));
        }
        this.utility.readFile(msg, './csvs/locations.csv', this.initLocations,this,[msg], true);
    }
    async initLocations(msg, fileData){
        for(var i=0;i<fileData.length;i++) { 
            this.locations.push(new Character(fileData[i], this.guild, i, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, this.utility, msg));
        }
        this.utility.readFile(msg, './csvs/items.csv', this.initItemsList,this,[msg], false);
    }
    async initItemsList(msg, fileData){
        for(var i=0;i<this.characters.length;i++){
            await this.checkCharInitialised(this.characters[i]);
        }
        for(var i=0;i<this.locations.length;i++){
            await this.checkCharInitialised(this.characters[i]);
        }
        for(var i=0;i<fileData.length;i++) {
            if(!fileData[i].hasOwnProperty('ItemName')){this.utility.sendMsg(msg.channel, "ERROR: Cannot find ItemName field for items.csv"); break;}
            var itemName=fileData[i].ItemName;
            var findObj = this.findObject(itemName, false, false, true, true);
            if(findObj===undefined){
                this.utility.sendMsg(msg.channel,"ERROR: Cannot find item " + itemName + ", adding it to default location 'GM'");
                var locObj=this.locations.find(x=>x.nameID.toLowerCase()==="gm");
                if(locObj===undefined){
                    locObj = new Character({name: "GM", cash: 0}, this.guild, this.locations.length, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, this.utility,msg);
                    this.locations.push(locObj);
                }
                await locObj.addItem(msg, itemName);
                findObj=locObj.items.find(x=>x.nameID.toLowerCase()===itemName.toLowerCase());
            }
            findObj.loadFileData(msg, fileData[i]);
        }
        this.initialised=true;      this.utility.sendMsg(msg.channel,"Bot initialised. GM messages will be sent to this channel."); 
    }
    async checkCharInitialised(char, count){
        if(count===undefined){count=20;}
        if(char.initialised){return true;}
        if(count=0){return false;}
        return await setTimeout(async ()=> {try{return await this.checkCharInitialised(char, count-1)}catch{}}, 100);
    }
    run(msg){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        for(var i=0;i<this.characters.length;i++){
            this.characters[i].run();
        }
        for(var i=0;i<this.locations.length;i++){
            this.locations[i].run();
        }
        this.running=true;
        this.utility.sendMsg(msg.channel,"Bot is running. Players can now claim characters");
    }
    stop(msg){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        for(var i=0;i<this.characters.length;i++){
            this.characters[i].stop(msg);
        }
        for(var i=0;i<this.locations.length;i++){
            this.locations[i].stop(msg);
        }
        this.running=false;
        this.utility.sendMsg(msg.channel,"Bot is no longer running. Characters have been released and cannot be claimed.");
    }
    async sendGMMsg(msg, msgInfo){
        if(this.checks(msg, true, false,false,false,true)===false){return;}
        try{await this.GMChannel.send(this.utility.getAuthorName(msg) + ": " + msgInfo)
        }catch(error){this.utility.sendMsg(msg.channel, "ERROR: Message did not send"); return;};
        this.utility.sendMsg(msg.channel,"Message sent to GM channel");
    }
    sendCharMsg(msg, msgInfo1, msgInfo2){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var char = this.findObject(msgInfo1,true,false,false,false);
        if(char===undefined){this.utility.sendMsg(msg.channel,"Character cannot be found"); return;}
        char.sendInfo(msg, "GM Message: " + msgInfo2);
    }
    claimCharacter(msg, msgInfo){
        if(this.checks(msg, true, true, false, false, false)===false){return;}
        if(this.characters.find(x=>x.userID===msg.author.id)){this.utility.sendMsg(msg.channel,"ERROR: You already have a character!"); return;}
        var char = this.findObject(msgInfo, true, false, false, false);
        if(char===undefined){this.utility.sendMsg(msg.channel,"Character cannot be found"); return;}
        char.claim(msg);
    }
    releaseCharacter(msg, msgInfo1){
        var char = this.checks(msg, true, false, false, true, true);
        if(char===false){return;}
        if(char===true){char=this.findObject(msgInfo1, true, false, false, false);}
        if(char===undefined) {this.utility.sendMsg(msg.channel,"Character cannot be found"); return;}
        char.release(msg);
    }
    view(msg, msgInfo1, msgInfo2, msgInfo3){
        var findObj = this.checks(msg, true, false, false, true, true);
        if(findObj===false){return;}
        if(findObj===true){
            if(msgInfo1==="" ){this.viewChars(msg,true); return;}
            if(msgInfo1.toLowerCase()==="all"){
                for(var i=0;i<this.characters.length;i++){
                    this.characters[i].view(msg, "all", msgInfo2, true);
                }
                for(var i=0;i<this.locations.length;i++){
                    this.locations[i].view(msg, "all", msgInfo2, true);
                }
                return;
            }
            findObj = this.findObject(msgInfo1, true, true, true, true);
            if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
            if(findObj instanceof Item){findObj.view(msg, msgInfo2,msgInfo2.toLowerCase()==="all");}else{findObj.view(msg, msgInfo2, msgInfo3, true)}
        }
        else{findObj.view(msg, msgInfo1, msgInfo2, false);}
    }
    viewChars(msg, gmFlag){
        if(this.characters.length===0){this.utility.sendMsg(msg.channel,"No characters found");}
        else{
            var msgContent="CHARACTERS:"
            for(var i=0;i<this.characters.length;i++){
                var char=this.characters[i];
                if(gmFlag || char.userID!==undefined) {
                    msgContent = msgContent + "\n**ID Name: **" + char.nameID + "   **Nickname:**  " + char.charName +(gmFlag ? (char.userID===undefined ? "*(unclaimed)*" : "*(claimed)*") : "");
                }
            }
            this.utility.sendMsg(msg.channel,msgContent);
        }
        if(gmFlag===false){return;}
        if(this.locations.length===0){this.utility.sendMsg(msg.channel,"No locations found");}
        else{
            var msgContent="LOCATIONS:"
            for(var i=0;i<this.locations.length;i++){
                msgContent = msgContent + "\n**ID Name: **" + this.locations[i].nameID;
            }
            this.utility.sendMsg(msg.channel,msgContent);
        }
    }
    show(msg, msgInfo1, msgInfo2, msgInfo3){
        var findObj = this.checks(msg, true, false, false, true, true);
        if(findObj===false){return;}
        if(findObj===true){
            findObj=this.findObject(msgInfo1, true, true, true, false);
            if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
            if(findObj.nameID.toLowerCase()!==msgInfo1.toLowerCase()){msgInfo3=msgInfo1;}   msgInfo1=msgInfo2;  msgInfo2=msgInfo3;
        }
        var char2=this.findObject(msgInfo1, true, false, false, false);
        if(char2===undefined){this.utility.sendMsg(msg.channel,"Cannot find the character to show the item to"); return;}
        findObj.show(msg, char2, msgInfo2);
    }
    give(msg, msgInfo1, msgInfo2, msgInfo3){
        var findObj = this.checks(msg, true, false, false, true, true);
        if(findObj===false){return;}
        if(findObj===true){
            findObj=this.findObject(msgInfo1, true, true, true, false);
            if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
            if(findObj.nameID.toLowerCase()!==msgInfo1.toLowerCase()){msgInfo3=msgInfo1;}   msgInfo1=msgInfo2;  msgInfo2=msgInfo3;
        }
        var char2=this.findObject(msgInfo1, true, true, false, false);
        if(char2===undefined){this.utility.sendMsg(msg.channel,"Cannot find the character to give the item to"); return;}
        findObj.give(msg, char2, msgInfo2);
    }
    pay(msg, msgInfo1, msgInfo2, msgInfo3){
        var findObj = this.checks(msg, true, false, false, true, true);
        if(findObj===false){return;}
        if(findObj===true){
            findObj=this.findObject(msgInfo1, true, true, true, false);
            if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
            if(findObj.nameID.toLowerCase()!==msgInfo1.toLowerCase()){msgInfo3=msgInfo1;}   msgInfo1=msgInfo2;  msgInfo2=msgInfo3;
        }
        var char2=this.findObject(msgInfo1, true, true, false, false);
        if(char2===undefined){this.utility.sendMsg(msg.channel,"Cannot find the character to pay the cash to"); return;}
        findObj.pay(msg, char2, msgInfo2);
    }

    //GM only commands
    findItem(msg, msgInfo1){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj=this.findObject(msgInfo1, false, false, true, false);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Specified item not found"); return;}
        this.utility.sendMsg(msg.channel, findObj.charName + " has item " + msgInfo1);
    }
    addChar(msg, msgInfo){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        if(this.nameExists(msgInfo)){this.utility.sendMsg(msg.channel,"ERROR: Name already exists or is invalid"); return;}
        this.characters.push(new Character({name: msgInfo, cash: 0}, this.guild, this.characters.length, this.parObj, this.clientID, this.GMRoleID, this.GMChannel, this.utility, msg));
        this.utility.sendMsg(msg.channel,"New character " + msgInfo + " created");
    }
    addLoc(msg, msgInfo){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        if(this.nameExists(msgInfo)){this.utility.sendMsg(msg.channel,"ERROR: Name already exists or is invalid"); return;}
        this.locations.push(new Character({name: msgInfo, cash: 0}, this.guild, this.locations.length, this.parObj, this.clientID, this.GMRoleID, this.GMChannel,  this.utility, msg));
        this.utility.sendMsg(msg.channel,"New character " + msgInfo + " created");
    }
    removeCheck(msg, msgInfo){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var warningContent = "Are you sure you want to delete " + msgInfo + " (and any items they have)? Type y to confirm or anything else to cancel";
        this.utility.checkMessage(msg, warningContent, "Deletion Cancelled", this.remove,this,[msg, msgInfo]);
    }
    remove(msg, msgInfo1){
        var findObj = this.findObject(msgInfo1,true, true, true, false);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Specified character, location, or item not found"); return;}
        if(findObj.nameID.toLowerCase()!==msgInfo1.toLowerCase()){findObj.removeItem(msg, msgInfo1); return;}
        var findIndex=this.characters.findIndex(x=>x===findObj);
        if(findIndex!==-1){this.characters.splice(findIndex,1);} 
        else{
            findIndex=this.locations.findIndex(x=>x===findObj);
            this.locations.splice(findIndex,1);
        }       
        this.utility.sendMsg(msg.channel,"Character or Location " + msgInfo1 + " has been removed");
    }
    renameID(msg, msgInfo1, msgInfo2){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, true, true, true, true);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find character, location, or item " + msgInfo1); return;}
        if(this.nameExists(msgInfo2)){this.utility.sendMsg(msg.channel,"ERROR: Name already exists or is not valid"); return;}
        findObj.renameID(msg, msgInfo2);
    }
    renameNickname(msg, msgInfo1, msgInfo2){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, true, false, false, false);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find character  " + msgInfo1); return;}
        findObj.renameNickname(msg, msgInfo2);
    }
    addItem(msg, msgInfo1, msgInfo2){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, true, true, false,false);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find character or location " + msgInfo1); return;}
        if(this.nameExists(msgInfo2)){this.utility.sendMsg(msg.channel,"ERROR: Name already exists or is not valid"); return;}
        findObj.addItem(msg, msgInfo2);
    }
    changeCash(msg, msgInfo1, msgInfo2){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, true, true, false,false);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find character or location " + msgInfo1); return;}
        findObj.changeCash(msg, msgInfo2);
    }
    renameInfo(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, false, false, true, true);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find item " + msgInfo1); return;}
        findObj.renameInfo(msg, msgInfo2, msgInfo3);
    }
    editVisible(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, false, false, true, true);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find item " + msgInfo1); return;}
        findObj.editVisible(msg, msgInfo2, msgInfo3);
    }
    editText(msg, msgInfo1, msgInfo2, msgInfo3){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, false, false, true, true);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find item " + msgInfo1); return;}
        findObj.editText(msg, msgInfo2, msgInfo3);
    }
    deleteInfo(msg, msgInfo1, msgInfo2){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        var findObj = this.findObject(msgInfo1, false, false, true, true);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find item " + msgInfo1);return;}
        findObj.deleteInfo(msg, msgInfo2);
    }
    addInfo(msg, msgInfo1, msgInfo2, msgInfo3, msgInfo4){
        if(this.checks(msg, true, false, false, true, false)===false){return;}
        if(msgInfo2==""){this.utility.sendMsg(msg.channel,"Cannot add an item with no heading"); return;}
        var findObj = this.findObject(msgInfo1, false, false, true, true);
        if(findObj===undefined){this.utility.sendMsg(msg.channel,"ERROR: Cannot find item " + msgInfo1);return;}
        findObj.addInfo(msg, msgInfo2, msgInfo3, msgInfo4);
    }
    async saveAll(msg){
        if(this.checks(msg, true, false, true, true, false)===false){return;}
            if(fs.existsSync('./csvs')===false){
                try{await fs.mkdirSync('./csvs');}catch{this.utility.sendMsg(msg.channel, "ERROR: Folder /csvs/ does not exist and I can't create it, could you please make this folder and try again?"); return;}
            }
            if(fs.existsSync('./csvs/items.csv')){
                try{fs.rename('./csvs/items.csv', './csvs/items_old.csv')}
                catch{this.utility.sendMsg(msg.channel,"WARNING: file items.csv will overwrite any information saved to individual csv files. Please delete or rename this file to avoid overwriting any saved changes.")}
            }
            var headerList=[{id: 'name', title: "Name"}, {id: 'nickname', title: "Nickname"}, {id: 'cash', title: "Cash"}]
            var itemCount=Math.max.apply(Math, this.characters.map(function(x) { return x.items.length; }));
            var itemCount2=Math.max.apply(Math, this.locations.map(function(x) { return x.items.length; }));
            if(itemCount2>itemCount){itemCount=itemCount2};
             var charData=[];
            for(var i=0;i<itemCount;i++){
                headerList.push({id: 'item'+(i+1), title: "Item"+(i+1)});
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
                        await csvWriter.writeRecords(charData).then(()=> this.utility.sendMsg(msg.channel,"Records saved"));
                    }catch{this.utility.sendMsg(msg.channel,"ERROR: Could not save to locations.csv, do you have it open?");}
                });
            }catch{this.utility.sendMsg(msg.channel,"ERROR: Could not save to characters.csv, do you have it open?");}
    }
    nameExists(newName){
        var exists=false;   newName=newName.toLowerCase();
        if(newName==="" || newName==="locations" || newName==="characters" || newName==="items" || newName==="all"){exists=true;}
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