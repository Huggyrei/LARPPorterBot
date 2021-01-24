"use strict";
const Item = require("./item.js"); 

module.exports = class Character
{
    constructor(jsonIn, _guild,_index, _parObj, _clientID, _gmID, _mainChannel, msg){

        this.nameID=undefined;  this.charName=undefined;    this.userID=undefined;  this.userOldName=null;    
        this.guild=_guild;      this.parObj=_parObj;        this.index=_index;      this.channel=undefined;
        this.clientID=_clientID; this.gmID=_gmID;           this.mainChannel=_mainChannel;
        this.running=false;     this.error=false;       this.initialised=false; 
        this.items=[];          this.cash=0;            this.examineItems=[];              
        var nameFound=false;    var cashError=false;
        for(var jObj in jsonIn){
            switch(jObj.toLowerCase()){
                case 'name': this.nameID=jsonIn[jObj]; nameFound=true; break;
                case 'nickname': this.charName=this.removeApostError(jsonIn[jObj]); break;
                case 'cash': this.cash = Number(jsonIn[jObj]); 
                    if(Number.isNaN(this.cash)){this.cash=0; this.error=true; cashError=true;} break;
                default: if(jsonIn[jObj]!=="" && jsonIn[jObj]!==null && jsonIn[jObj]!==undefined) {this.items.push(new Item(jsonIn[jObj], this.mainChannel));}
            }
        }
        if(nameFound===false){this.inde=_index; this.error=true; this.sendMsg(msg.channel,"Character name not found for character " + _index);}
        if(cashError){this.sendMsg(msg.channel,"Could not read cash value for character " + (this.nameID===undefined ? _index : this.nameID));}
        if(this.charName===undefined){this.charName=this.nameID;}
        this.initItems(msg); 
    }
    removeApostError(text){
        text=text.replace("\u2019","'");
        text=text.replace("\u201C",'"');
        text=text.replace("\u201D",'"');
        return text;
    }
    async initItems(msg){
        for(var i=0;i<this.items.length;i++){
            await this.items[i].setup(msg);
        }
        this.initialised=true;
    }
    run(){
        this.running=true;
    }
    stop(){
        this.running=false;
        this.release();
    }
    async sendMsg(channel, newContent, count){
        newContent=this.escapeMarkdown(newContent);
        if(count===undefined){count=2;}
        if(count!==0){
            try{await channel.send(newContent);}catch{
                setTimeout(async ()=> {try{await this.sendMsg(chnnel, newContent, count-1)}catch{}}, 250);
            }
        }else{
            try{await this.channel.send("ERROR: Could not send one of my messages, I'm not sure why. \nThe message was: " + newContent);}catch{
                try{await this.mainChannel.send("ERROR: Could not send one of my messages, I'm not sure why.  \nThe message was: " + newContent);}catch{}
            }
        }
    }
    escapeMarkdown(text) {
        var unescaped = text.replace(/\\(_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
        var escaped = unescaped.replace(/(_|`|~|\\)/g, '\\$1'); // escape _, `, ~, \
        return escaped;
      }

    async claim(msg, authorName){
        var member=msg.member;
        if(this.running===false){this.sendMsg(msg.channel,"Error: character claiming not currently running"); return;}
        if(this.error===true) {this.sendMsg(msg.channel,"There was an error building this character; check with GM");}
        if(this.userID!==undefined){this.sendMsg(msg.channel,"Error: Character has already been claimed"); return;}
        this.userID=member.id;     this.userOldName=member.nickname;    
        try{await member.setNickname(this.charName)}catch{e => this.sendMsg(msg.channel,"Please change your nickname to " + this.charName)};
        var permArr = [{id: msg.author.id, allow: ['VIEW_CHANNEL'],}];
        permArr.push({id: this.guild.id, deny: ['VIEW_CHANNEL'],});
        permArr.push({id: this.clientID, allow: ['VIEW_CHANNEL'],});
        permArr.push({id: this.gmID, allow: ['VIEW_CHANNEL'],});
        try{this.channel = await this.guild.channels.create('bot_'+this.nameID,{
            type: 'Text', parent: this.parObj.id, permissionOverwrites: permArr,
        });}catch{
            try{this.channel = await this.guild.channels.create('bot_'+nameID,{
                type: 'Text', permissionOverwrites: permArr,
        });}catch{this.sendMsg(msg.channel,"ERROR: Could not create new channel. Please ask the GMs to make one for you");this.channel=msg.author;}}   
        this.sendMsg(msg.channel,"You have claimed character " + this.nameID);     
    }

    async release(msg){
        var member=msg.member;
        try{await member.setNickname(this.userOldName);}catch{this.sendMsg(msg.channel,"Please change your nickname back");}
        if(this.channel!==msg.author){
            try{this.channel.delete();}catch{this.sendMsg(msg.channel,"Could not delete your channel; please ask the GMs to do this")}}
        this.userOldName=null;  this.userID=undefined;
        this.sendMsg(msg.channel,"You have released character " + this.nameID);
    }

    view(msg, gmFlag){
        if(this.items.length===0){this.sendMsg(msg.channel,this.nameID + " has no items");}else{this.sendMsg(msg.channel,this.nameID + " has the following items:");}
        for(var i=0;i<this.items.length;i++){
            this.items[i].view(msg, gmFlag);
        }
        this.sendMsg(msg.channel,this.cash===0 ? this.charName + " has no cash" : this.charName + " has " + this.cash + " in cash");
    }

    give(msg, char2, msgInfo2){
        var itemIndex=this.items.findIndex(x=>x.nameID.toLowerCase()===msgInfo2.toLowerCase());
        if(itemIndex===-1){this.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); return;}
        char2.receive(msg, this.items[itemIndex]);
        this.items.splice(itemIndex,1);
        this.sendMsg(msg.channel,"You have given item " + msgInfo2 + " to " + char2.charName);
    }
    async receive(msg, item){
        this.items.push(item);
        if(this.channel!==undefined){try{await this.channel.send("<@" + this.userID + "> " +"You have been given item " + item.nameID);}
        catch{this.sendMsg(msg.channel,"Error: could not send message to " + this.charName + "'s channel - please let them know!");}}
    }
    show(msg, char2, msgInfo2){
        var itemIndex=this.items.findIndex(x=>x.nameID.toLowerCase()===msgInfo2.toLowerCase());
        if(itemIndex===-1){this.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); return;}
        char2.beShown(msg, this.items[itemIndex]);
        this.sendMsg(msg.channel,"You have shown item " + msgInfo2 + " to character " + char2.charName + ". They now have 3 minutes to examine it.");
    }
    async beShown(msg, item){
        this.examineItems.push(item);
        if(this.channel!==undefined){try{await this.channel.send("<@" + this.userID + "> " +"You have been shown item " + item.nameID + ". You have 3 minutes to examine it");}
        catch{this.sendMsg(msg.channel,"Error: could not send message to " + this.charName + "'s channel - please let them know!");}}
        setTimeout(() => {var ind=this.examineItems.findIndex(x=>x===item); this.examineItems.splice(ind,1);}, 180000);
    }
    examine(msg, msgInfo1, msgInfo2){
        var item = this.items.find(x=>x.nameID.toLowerCase()===msgInfo1.toLowerCase());
        if(item===undefined){item = this.examineItems.find(x=>x.nameID.toLowerCase()===msgInfo1.toLowerCase());}
        if(item===undefined){this.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); return;}
        item.examine(msg, msgInfo2);
    }
    async sendInfo(msg, infoMessage){
        try{await this.channel.send(infoMessage);this.sendMsg(msg.channel,"Message sent");}catch{this.sendMsg(msg.channel,"Error: Cannot send info to this character's private channel");}
    }
    pay(msg, payee, msgInfo2){
        msgInfo2=Number(msgInfo2);
        if(Number.isNaN(msgInfo2)){this.sendMsg(msg.channel,"Error: cash amount not valid"); return;}
        if(msgInfo2<0){this.sendMsg(msg.channel,"Error: you can't give a negative amount"); return;}
        if(msgInfo2>this.cash){this.sendMsg(msg.channel,"Error: you can't give more money than you have"); return;}
        payee.getPaid(msg, msgInfo2);
        this.cash=this.cash-msgInfo2;
        this.sendMsg(msg.channel,this.charName + " has given " + msgInfo2 + " to " + payee.charName);
    }
    async getPaid(msg, amount){
        this.cash=this.cash+amount;
        if(this.channel!==undefined){try{await this.channel.send("<@" + this.userID + "> " +"You have been given " + amount + " in cash");}
        catch{this.sendMsg(msg.channel,"Error: could not send message to " + this.charName + "'s channel - please let them know!");}}
    }

    //GM only edit commands
    renameID(msg, msgInfo2){
        var oldName=this.nameID;
        this.nameID=msgInfo2;
        this.sendMsg(msg.channel,"ID name changed from " + oldName + " to " + this.nameID);
    }
    renameNickname(msg, msgInfo2){
        var oldName=this.charName;
        this.charName=msgInfo2;
        this.sendMsg(msg.channel,"Discord nickname changed from " + oldName + " to " + this.charName + " for character " + this.nameID);
    }
    addItem(msg, msgInfo2){
        var newItem=new Item(msgInfo2, this.mainChannel);
        this.items.push(newItem);
        newItem.setup(msg);
        this.sendMsg(msg.channel,"New item created. If there was a csv input file, it will fill in the info");
    }
    removeItem(msg, msgInfo2){
        var itemIndex=this.items.findIndex(x=>x.nameID.toLowerCase()===msgInfo2.toLowerCase());
        if(itemIndex===-1){this.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); return;}
        this.items.splice(itemIndex,1);
        this.sendMsg(msg.channel,"Item has been deleted");
    }
    changeCash(msg, msgInfo2){
        msgInfo2=Number(msgInfo2);
        if(Number.isNaN(msgInfo2)){this.sendMsg(msg.channel,"Error: cash amount not valid"); return;}
        if(msgInfo2<0){this.sendMsg(msg.channel,"Error: cannot be a negative amount"); return;}
        this.cash=msgInfo2;
        this.sendMsg(msg.channel,this.nameID + " now has " + this.cash + " in cash");
    }
    save(msg, itemArrSize){
        for(var i=0;i<this.items.length;i++){
            this.items[i].save(msg);
        }
        var charData={name: this.nameID, nickname: this.charName, cash: this.cash};
        for(var i=0;i<this.items.length;i++){
            charData["item"+(i+1)]=this.items[i].nameID;
        }
        for(var i=this.items.length;i<itemArrSize;i++){
            charData["item"+(i+1)]="";
        }
        return charData;
    }

    //steal-> inform them next time they check their inventory? Maybe also a random info if they don't look, triggered between 5-10 minutes later?
    //Also limited use 'detect steal'? -> "someone is trying to steal from you! Do you want to use an ability to prevent them?"
    //steal specific or random? What about cash? -> random 1, 5, or 10 amount?
}