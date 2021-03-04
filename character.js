"use strict";
const Item = require("./item.js");      const MSGManager=require("./msgmanager.js");

module.exports = class Character
{
    constructor(jsonIn, _locTrue, _guild,_index, _parObj, _clientID, _gmID, _utility, msg){

        this.index=_index;          this.nameID=undefined;  this.description=undefined; this.locTrue=_locTrue;
        this.guild=_guild;          this.parObj=_parObj;    this.channel=undefined;     this.msgManager=undefined;
        this.clientID=_clientID;    this.gmID=_gmID;        this.userOldName=undefined; this.userID=_locTrue ? [] : undefined;
        this.utility=_utility;      this.running=false;     this.error=false;           this.initialised=false;         
        this.items=[];              this.itemCodes=[];      this.cash=0;                this.examineItems=[];
        this.stealCount=0;          this.preventCount=0;    this.location=undefined;        
        var nameFound=false;    var cashError=false;        var stealError=false;           var preventError=false; 
        var codeFlag=false;     
        for(var jObj in jsonIn){
            switch(jObj.toLowerCase()){
                case 'name': this.nameID=jsonIn[jObj]; nameFound=true; break;
                case 'nickname': case 'description': this.description=jsonIn[jObj]; break;
                case 'cash': this.cash = typeof(jsonIn[jObj])==="string" ? Number(jsonIn[jObj].replace(/,/g, '')) : Number(jsonIn[jObj]); 
                    if(Number.isNaN(this.cash) || this.cash<0){this.cash=0; this.error=true; cashError=true;} break;
                case 'steal': case 'theft': typeof(jsonIn[jObj])==="string" ? this.stealCount=Number(jsonIn[jObj].replace(/,/g, '')) : Number(jsonIn[jObj]);
                    if(Number.isNaN(this.stealCount) || this.stealCount<0){this.stealCount=0; this.error=true; stealError=true;} 
                    this.stealCount=Math.floor(this.stealCount);   break;
                case 'prevent': case 'stop': typeof(jsonIn[jObj])==="string" ? this.preventCount=Number(jsonIn[jObj].replace(/,/g, '')) : Number(jsonIn[jObj]);
                    if(Number.isNaN(this.preventCount) || this.preventCount<0){this.preventCount=0; this.error=true; preventError=true;} 
                    this.preventCount=Math.floor(this.preventCount);   break;
                default:
                    if (jObj.toLowerCase().includes("code")){codeFlag=true;}
                    else if(jObj.toLowerCase().includes("item")){codeFlag=false;}
                    if(jsonIn[jObj]!=="" && jsonIn[jObj]!==null && jsonIn[jObj]!==undefined) {
                        if(codeFlag){this.itemCodes.push(jsonIn[jObj]);}
                        else{this.items.push(new Item(jsonIn[jObj], this.utility));
                    }
                }
            }
        }
        if(nameFound===false){this.index=_index; this.error=true; this.utility.sendMsg(msg.channel,"Character name not found for character " + _index);}
        if(cashError){this.utility.sendMsg(msg.channel,"Could not read cash value for character " + (this.nameID===undefined ? _index : this.nameID));}
        if(stealError){this.utility.sendMsg(msg.channel,"Could not read steal ability count for character " + (this.nameID===undefined ? _index : this.nameID));}
        if(preventError){this.utility.sendMsg(msg.channel,"Could not read prevent theft ability count for character " + (this.nameID===undefined ? _index : this.nameID));}
        if(this.description===undefined){this.description=this.nameID;}
        this.initialised=true;
    }
    run(msg){
        this.makeChannel(msg);
        this.running=true;
    }
    stop(msg){
        this.running=false;
        if(!this.locTrue) {this.release(msg, undefined, undefined, true);}
        this.deleteChannel(msg, true);
    }

    async claim(msg, memberID){
        if(memberID!==undefined){
            if(!this.locTrue){
                if(this.running===false){this.utility.sendMsg(msg.channel,"Error: character claiming not currently running"); return;}
                if(this.error===true) {this.utility.sendMsg(msg.channel,"There was an error building this character; check with GM");}
                if(this.userID!==undefined){this.utility.sendMsg(msg.channel,"Error: Character has already been claimed"); return;}
                this.userID=memberID;     this.userOldName=msg.member.nickname;    
                try{await msg.member.setNickname(this.description)}catch{e => this.utility.sendMsg(msg.channel,"Please change your nickname to " + this.description)};
            }else{
                this.userID.push(memberID);
            }
            await this.addPerm(msg, memberID);
            if(this.location!==undefined){this.location.claim(msg, memberID);}         
            if(this.channel.type !== 'dm'){this.utility.sendMsg(this.channel,"<@" + this.userID + "> " +(this.locTrue ? " You have moved to location " : "You have claimed character ") + this.nameID);}    
        }
    }
    async makeChannel(msg){
        var permArr=[{id: this.guild.id, deny: ['VIEW_CHANNEL'],}];
        permArr.push({id: this.clientID, allow: ['VIEW_CHANNEL'],});
        permArr.push({id: this.gmID, allow: ['VIEW_CHANNEL'],});
        try{this.channel = await this.guild.channels.create(this.nameID,{
            type: 'Text', parent: this.parObj.id, permissionOverwrites: permArr,
        });}catch{
            try{this.channel = await this.guild.channels.create(this.nameID,{
                type: 'Text', permissionOverwrites: permArr,
        });}catch{this.utility.sendMsg(msg.channel,"ERROR: Could not create new channel for " + this.nameID); this.channel=undefined; return;}}
        if(this.locTrue){this.msgManager=new MSGManager(this.nameID, this.channel, this.utility,this.description, this.items, this.cash);}   
    }
    move(msg, newLocation){
        if(this.location!==undefined){this.leave(msg);}
        this.location=newLocation;
        newLocation.claim(msg, this.userID);
        if(msg.member.id!==this.userID){this.utility.sendMsg(msg.channel, this.nameID + " has moved to " + newLocation.nameID);}
    }
    leave(msg){
        if(this.location===undefined){this.utility.sendMsg(msg.channel, this.nameID + " is not in a location"); return;}
        this.location.release(msg, this.userID, this.nameID, false);
        if(msg.member.id!==this.userID){this.utility.sendMsg(msg.channel, this.nameID + " has left " + this.location.nameID);}
        this.location=undefined;        
    }
    async deleteChannel(msg){
        if(this.channel!==undefined){
            if(this.channel.type !== 'dm'){
                try{await this.channel.delete();}catch{this.utility.sendMsg(msg.channel,"ERROR: Could not delete the channel for " + this.nameID);}
            }
            this.msgManager=undefined;
        }
    }
    async addPerm(msg, memberID){
        if(this.channel===undefined){ 
            if(!this._locationTrue){this.channel=msg.member;}
            this.utility.sendMsg(msg.channel,"ERROR: Could not create a channel for " + this.nameID + "; check with GMs");
            return;
        }
        try{await this.channel.updateOverwrite(memberID, {VIEW_CHANNEL: true})}catch{this.utility.sendMsg(msg.channel,"ERROR: Could not add user to private channel for " + this.nameID + ". Check with GMs.");}
    }
    async removePerm(msg, memberID, isStop){
        if(this.channel.type !== 'dm'){ 
            try{await this.channel.updateOverwrite(memberID, {VIEW_CHANNEL: false})}catch{if(!isStop){this.utility.sendMsg(msg.channel,"ERROR: Could not remove user from channel for " + this.nameID + ". Check with GMs.");}}
        }
    }
    async release(msg, memberID, charNameID, isStop){
        if(this.userID!==undefined){
            if(this.locTrue){
                var removeIndex=this.userID.findIndex(x=>x===memberID);
                if(removeIndex===-1 && !isStop){this.utility.sendMsg(msg.channel,"ERROR: Cannot find this user at location " + this.nameID); return;}
                this.userID.splice(removeIndex,1);
                this.utility.sendMsg(this.channel,charNameID + " has left " + this.nameID);
            }else{
                var member=undefined;
                try{member = await this.guild.members.fetch(this.userID)}catch{}
                try{await member.setNickname(this.userOldName);}catch{this.utility.sendMsg(member,"Please change your nickname back");}
                this.userOldName=null;  this.userID=undefined;
            }
            this.removePerm(msg, memberID, isStop)
            if(this.location!==undefined){this.location.release(msg, memberID, this.nameID, isStop);}
            if(!isStop){this.utility.sendMsg(msg.channel,(this.locTrue? " You have left location " : "You have released character ") + this.nameID);}
        }
    }

    view(msg, msgInfo1, msgInfo2, gmFlag, channel, itemCodes){
        if(this.location!==undefined){if(msg.channel===this.location.channel){ this.location.view(msg, msgInfo1, msgInfo2, gmFlag, this.channel, this.itemCodes); return;}}
        if(!channel){channel=msg.channel;}
        msgInfo1=msgInfo1.toLowerCase();
        msgInfo2=msgInfo2.toLowerCase();
        if(!itemCodes){itemCodes= (msgInfo1==="") ? (gmFlag ? [] : this.itemCodes) : ((msgInfo2!=="") ? [msgInfo2] :  this.itemCodes);}

        if(msgInfo1==="" || (msgInfo1==="all" && msgInfo2==="") || msgInfo1==="cash") {this.utility.sendMsg(channel,this.cash===0 ? this.nameID + " has no cash" : this.nameID + " has " + this.cash.toLocaleString('en-GB') + " in cash");}
        if(msgInfo1==="" || (msgInfo1==="all" && msgInfo2==="") || msgInfo1==="ability" || msgInfo1==="abilities") {
            if(this.stealCount!==0){this.utility.sendMsg(channel, this.nameID + " has " + this.stealCount + " uses of the stealing ability");}
            if(this.preventCount!==0){this.utility.sendMsg(channel, this.nameID + " has " + this.preventCount + " uses of the ability to resist stealing");}
            if((msgInfo1==="ability" || msgInfo1==="abilities") && this.stealCount===0 && this.preventCount===0){this.utility.sendMsg(channel, this.nameID + " has no ability to either steal or prevent theft");}
        }
        if(msgInfo1==="cash" || msgInfo1==="ability" || msgInfo1==="abilities"){return;}
        if(this.items.length===0 && this.examineItems.length===0){
            this.utility.sendMsg(channel,this.nameID + " has no items"); 
        }else{
            var findItem;   msgInfo1=msgInfo1.toLowerCase();
            if(msgInfo1!=="" && msgInfo1!=="all"){
                findItem = this.items.find(x=>x.nameID.toLowerCase()===msgInfo1);
                if(findItem===undefined){findItem=this.examineItems.find(x=>x.nameID.toLowerCase()===msgInfo1);}
                if(findItem===undefined){
                    if(this.items.filter(x => x.infos.find(y=>y.heading.toLowerCase()===msgInfo1)).length===0
                        &&this.examineItems.filter(x => x.infos.find(y=>y.heading.toLowerCase()===msgInfo1)).length===0){
                            this.utility.sendMsg(channel,"Cannot find this item name or information code among " + this.nameID + "'s items");
                            return;
                        }else{msgInfo2=msgInfo1; itemCodes=[msgInfo2];}
                }else{
                    if(!gmFlag && msgInfo2!=="" && !itemCodes.find(x=>x.toLowerCase()===msgInfo2)){ this.utility.sendMsg(channel,"You do not have permission to view this code"); return;}
                    findItem.view(msg,itemCodes, msgInfo2==="", (msgInfo2.toLowerCase()==="all" && gmFlag), channel); 
                    return;
                }
            }
            
            if(!gmFlag && msgInfo2!=="" && !itemCodes.find(x=>x.toLowerCase()===msgInfo2)){ this.utility.sendMsg(channel,"You do not have permission to view this code"); return;}
            this.utility.sendMsg(channel,this.nameID + " has the following items:");
            for(var i=0;i<this.items.length;i++){
                this.items[i].view(msg, itemCodes, msgInfo2==="", (gmFlag && msgInfo1==="all" && msgInfo2===""),channel);
            }
            if(this.examineItems.length!==0){
                this.utility.sendMsg(channel,this.nameID + " does not own but is currently examining the following items:");
                for(var i=0;i<this.examineItems.length;i++){
                    this.examineItems[i].view(msg, itemCodes, msgInfo2==="", (gmFlag && msgInfo1.toLowerCase()==="all"),channel);
                }
            }
        }
    }

    async give(msg, char2, msgInfo2, stealFrom ){
        var allowSteal=true;
        var stealMsgNow=false;
        if(this.preventCount>0 && stealFrom){
            stealMsgNow=true;
           allowSteal=this.channel===undefined ? true : !await this.utility.checkMessage(this.channel, this.userID, "<@" + this.userID + "> Someone is trying to steal from you! Do you want to use one of your steal prevention abilities? You have " + this.preventCount + " uses remaining. Type y to prevent the attempt and find out who the perpetrator was, or anything else to allow the theft.", "You have not prevented the theft.", this.denySteal,this,[msg, char2]);
        }
        if(allowSteal) {
            this.giveAllow(msg, char2, msgInfo2, stealFrom, stealMsgNow);
        }        
    }
    denySteal(msg, char2){
        this.utility.sendMsg(msg.channel, "The theft was prevented.");
        this.preventCount=this.preventCount-1;
        this.utility.sendMsg(this.channel, "You have " + this.preventCount + " uses left of your ability to prevent thefts. The attempted thief was: " + char2.nameID);
    }
    giveAllow(msg, char2, msgInfo2, stealFrom, stealMsgNow, channel){
        if(channel===undefined){channel=msg.channel;}
        var itemIndex=this.items.findIndex(x=>x.nameID.toLowerCase()===msgInfo2.toLowerCase());
        if(itemIndex===-1){
            if(stealFrom){
                if(this.items.length===0){this.utility.sendMsg(msg.channel, "This character has no items."); return;}
                var itemIndex=Math.floor(this.items.length*Math.random());
                msgInfo2=this.items[itemIndex].nameID;
            }else{
                this.utility.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); 
                return;
            }
        }
        char2.receive(msg, this.items[itemIndex]);
        this.items.splice(itemIndex,1);
        if(this.locTrue){if(this.msgManager!==undefined){this.msgManager.setItems(this.items, this.cash);}else{this.utility.sendMsg(msg.channel,"Location " + this.nameID + " has given item " + msgInfo2 + " to " + char2.nameID);}}
        else{
            if(stealFrom){setTimeout((itemName) => {if(this.channel){this.utility.sendMsg(this.channel,"<@" + this.userID + "> You have been stolen from!! You have lost item " + itemName)}}, stealMsgNow ? 0 : 300000+Math.floor(300000*Math.random()),msgInfo2);}        
            else{this.utility.sendMsg(channel, "You have given item " + msgInfo2 + " to " + char2.nameID);}
        }
    }
    async receive(msg, item){
        this.items.push(item);
        if(this.channel!==undefined){try{await this.channel.send( (this.locTrue? "A character has dropped item " : "<@" + this.userID + "> " +"You have received item ") + item.nameID);}
        catch{this.utility.sendMsg(msg.channel,"Error: could not send message to " + this.nameID + "'s channel - please let them know!");}}
        if(this.locTrue && this.msgManager!==undefined){this.msgManager.setItems(this.items, this.cash);}
    }
    steal(msg, char2, msgInfo2){
        if(this.stealCount<=0){this.utility.sendMsg(msg.channel,"You do not have any steal actions left.")}
        if(this.stealCount>0){
            char2.give(msg, this, msgInfo2, true);
            this.stealCount=this.stealCount-1;
            this.utility.sendMsg(msg.channel, "You now have " + this.stealCount + " steal abilities remaining.")
        }
    }
    show(msg, char2, msgInfo2){
        var itemIndex=this.items.findIndex(x=>x.nameID.toLowerCase()===msgInfo2.toLowerCase());
        if(itemIndex===-1){this.utility.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); return;}
        char2.beShown(msg, this.items[itemIndex]);
        this.utility.sendMsg(msg.channel,"You have shown item " + msgInfo2 + " to character " + char2.nameID + ". They now have 3 minutes to examine it.");
    }
    async beShown(msg, item){
        this.examineItems.push(item);
        if(this.channel!==undefined){try{await this.channel.send("<@" + this.userID + "> " +"You have been shown item " + item.nameID + ". You have 3 minutes to examine it");}
        catch{this.utility.sendMsg(msg.channel,"Error: could not send message to " + this.nameID + "'s channel - please let them know!");}}
        setTimeout(() => {var ind=this.examineItems.findIndex(x=>x===item); this.examineItems.splice(ind,1);}, 180000);
    }
    take (msg, msgInfo1){
        if(this.location===undefined){this.utility.sendMsg(msg.channel,"Error: You are not in a location"); return;}
        if(msg.channel!==this.location.channel){this.utility.sendMsg(msg.channel,"Error: You must type location commands into the correct channel (or ask a GM to use the 'give' command for you)"); return;}
        if(this.location.items.find(x=>x.nameID.toLowerCase()===msgInfo1.toLowerCase())){this.location.giveAllow(msg, this, msgInfo1, false, true);}
        else{this.location.pay(msg, this, msgInfo1);}
    }
    drop(msg, msgInfo1){
        if(this.location===undefined){this.utility.sendMsg(msg.channel,"Error: You are not in a location"); return;}
        if(msg.channel!==this.location.channel){this.utility.sendMsg(msg.channel,"Error: You must type location commands into the correct channel (or ask a GM to use the 'give' command for you)"); return;}
        if(this.items.find(x=>x.nameID.toLowerCase()===msgInfo1.toLowerCase())){this.giveAllow(msg, this.location, msgInfo1, false, true, this.channel);}
        else{this.pay(msg, this.location, msgInfo1, this.channel);}
    }
    examine(msg, msgInfo1, msgInfo2){
        var item = this.items.find(x=>x.nameID.toLowerCase()===msgInfo1.toLowerCase());
        if(item===undefined){item = this.examineItems.find(x=>x.nameID.toLowerCase()===msgInfo1.toLowerCase());}
        if(item===undefined){this.utility.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); return;}
        item.examine(msg, msgInfo2);
    }
    async sendInfo(msg, infoMessage){
        try{await this.channel.send(infoMessage);this.utility.sendMsg(msg.channel,"Message sent");}catch{this.utility.sendMsg(msg.channel,"Error: Cannot send info to this character's private channel");}
    }
    pay(msg, payee, msgInfo2, channel){
        if(channel===undefined){channel=msg.channel;}
        msgInfo2=Number(msgInfo2.replace(/,/g, ''));
        if(Number.isNaN(msgInfo2)){this.utility.sendMsg(msg.channel,"Error: cash amount not valid"); return;}
        if(msgInfo2<0){this.utility.sendMsg(msg.channel,"Error: you can't " + (this.locTrue ? "take " : " give ") + "a negative amount"); return;}
        if(msgInfo2>this.cash){this.utility.sendMsg(msg.channel,"Error: you can't " + (this.locTrue ? "take " : " give ") +"more money than there is"); return;}
        payee.getPaid(msg, msgInfo2);
        this.cash=this.cash-msgInfo2;
        if(this.locTrue) {if(this.msgManager!==undefined){this.msgManager.setItems(this.items,this.cash);}else{this.utility.sendMsg(msg.channel, this.nameID + " has given " + msgInfo2.toLocaleString('en-GB') + " to " + payee.nameID);}}
        if(!this.locTrue){this.utility.sendMsg(channel,this.nameID + " has given " + msgInfo2.toLocaleString('en-GB') + " to " + payee.nameID);}
    }
    async getPaid(msg, amount){
        this.cash=this.cash+amount;
        if(this.channel!==undefined){try{await this.channel.send( (this.locTrue? "A character has dropped cash amount " : "<@" + this.userID + "> " +"You have been given cash amount " ) + amount.toLocaleString('en-GB') + " in cash");}
        catch{this.utility.sendMsg(msg.channel,"Error: could not send message to " + this.nameID + "'s channel - please let them know!");}}
        if(this.locTrue && this.msgManager!==undefined){this.msgManager.setItems(this.items,this.cash);}
    }

    //GM only edit commands
    renameID(msg, msgInfo2){
        var oldName=this.nameID;
        this.nameID=msgInfo2;
        this.utility.sendMsg(msg.channel,"ID name changed from " + oldName + " to " + this.nameID);
    }
    async renameNickname(msg, msgInfo2){
        var oldName=this.description;
        this.description=msgInfo2;
        this.utility.sendMsg(msg.channel, (this.locTrue? "Description changed for location " + this.nameID : "Discord nickname changed from " + oldName + " to " + this.description + " for character " + this.nameID));
        if(this.locTrue && this.msgManager!==undefined){this.msgManager.setDescription(this.description);}
        if(!this.locTrue && this.userID!==undefined){
            this.guild.members.fetch(this.userID).then(async member=>{try{await member.setNickname(this.description)}catch{e => this.utility.sendMsg(this.channel,"Please change your nickname to " + this.description);}});
        }
    }
    addItem(msg, msgInfo2){
        var newItem=new Item(msgInfo2, this.utility);
        this.items.push(newItem);
        this.utility.sendMsg(msg.channel,"New item created.");
        if(this.locTrue && this.msgManager!==undefined){this.msgManager.setItems(this.items,this.cash);}
    }
    removeItem(msg, msgInfo2){
        var itemIndex=this.items.findIndex(x=>x.nameID.toLowerCase()===msgInfo2.toLowerCase());
        if(itemIndex===-1){this.utility.sendMsg(msg.channel,"Error: Cannot find that item, have you typed the ID name correctly?"); return;}
        this.items.splice(itemIndex,1);
        this.utility.sendMsg(msg.channel,"Item has been deleted");
        if(this.locTrue && this.msgManager!==undefined){this.msgManager.setItems(this.items,this.cash);}
    }
    changeCash(msg, msgInfo2){
        msgInfo2=Number(msgInfo2.replace(/,/g, ''));
        if(Number.isNaN(msgInfo2)){this.utility.sendMsg(msg.channel,"Error: cash amount not valid"); return;}
        if(msgInfo2<0){this.utility.sendMsg(msg.channel,"Error: cannot be a negative amount"); return;}
        this.cash=msgInfo2;
        this.utility.sendMsg(msg.channel,this.nameID + " now has " + this.cash.toLocaleString('en-GB') + " in cash");
        if(this.locTrue && this.msgManager!==undefined){this.msgManager.setItems(this.items,this.cash);}
    }
    changeSteal(msg, msgInfo2){
        msgInfo2=Number(msgInfo2.replace(/,/g, ''));
        if(Number.isNaN(msgInfo2)){this.utility.sendMsg(msg.channel,"Error: ability count not valid"); return;}
        if(msgInfo2<0){this.utility.sendMsg(msg.channel,"Error: cannot be a negative amount"); return;}
        if(!Number.isInteger(msgInfo2)){this.utility.sendMsg(msg.channel,"Error: ability count must be a whole number"); return;}
        this.stealCount=msgInfo2;
        this.utility.sendMsg(msg.channel,this.nameID + " now has a steal ability count of " + this.stealCount.toLocaleString('en-GB'));
    }
    changePrevent(msg, msgInfo2){
        msgInfo2=Number(msgInfo2.replace(/,/g, ''));
        if(Number.isNaN(msgInfo2)){this.utility.sendMsg(msg.channel,"Error: ability count not valid"); return;}
        if(msgInfo2<0){this.utility.sendMsg(msg.channel,"Error: cannot be a negative amount"); return;}
        if(!Number.isInteger(msgInfo2)){this.utility.sendMsg(msg.channel,"Error: ability count must be a whole number"); return;}
        this.preventCount=msgInfo2;
        this.utility.sendMsg(msg.channel,this.nameID + " now has a theft prevention ability count of " + this.preventCount.toLocaleString('en-GB'));
    }
    viewCodes(msg){
        if(this.itemCodes===[]){this.utility.sendMsg(msg.channel,"Character " + this.nameID + " has no secret information codes."); return;}
        var msgContent="Character " + this.nameID + " can see information with the following codes: "
        for(var i=0;i<this.itemCodes.length;i++){
            msgContent=msgContent+"\n"+this.itemCodes[i];
        }
        this.utility.sendMsg(msg.channel,msgContent);
    }
    deleteCode(msg, msgInfo2){
        var codeIndex=this.itemCodes.findIndex(x=>x.toLowerCase()===msgInfo2.toLowerCase());
        if(codeIndex===-1){this.utility.sendMsg(msg.channel,"Error: this code is not listed for charcter " + this.nameID); return;}
        this.itemCodes.splice(codeIndex,1);
        this.utility.sendMsg(msg.channel, "Character " + this.nameID + "has had information code " + msgInfo2 + " removed");
    }
    addCode(msg, msgInfo2){
        var codeIndex=this.itemCodes.findIndex(x=>x.toLowerCase()===msgInfo2.toLowerCase());
        if(codeIndex!==-1){this.utility.sendMsg(msg.channel,"Error: this character can already view information with this code"); return;}
        this.itemCodes.push(msgInfo2);
        this.utility.sendMsg(msg.channel, "Character " + this.nameID + "can now see information with the code " + msgInfo2);
    }
    save(itemArrSize, codeArrSize){
        var charData=undefined;
        if(this.locTrue){
            charData={name: this.nameID, description: this.description, cash: this.cash};
        } else{
            charData={name: this.nameID, nickname: this.description, steal: this.stealCount, prevent: this.preventCount, cash: this.cash};
        }
        if(!this.locTrue){
            for(i=0;i<this.itemCodes.length;i++){
                charData["code" + (i+1)]=this.itemCodes[i];
            }
            for(i=this.itemCodes.length;i<codeArrSize;i++){
                charData["code" + (i+1)]="";
            }
        }
        for(var i=0;i<this.items.length;i++){
            charData["item"+(i+1)]=this.items[i].nameID;
        }
        for(var i=this.items.length;i<itemArrSize;i++){
            charData["item"+(i+1)]="";
        }
        return charData;
    }
    saveItems(){
        var returnSave=[];
        for(var i=0;i<this.items.length;i++){
            returnSave=returnSave.concat(this.items[i].save());
        }
        return returnSave;
    }
}