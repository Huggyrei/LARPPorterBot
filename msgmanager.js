"use strict";

module.exports = class MSGManager{
    constructor(nameID, channel, utility, description, items,cash){
        this.channel=channel;        this.nameID=nameID;
        this.descriptionMsgs=[];     this.itemsMsgs=[];       this.utility=utility;
        this.setDescription(description);
        this.setItems(items,cash);
        setTimeout(this.deleteMsgs.bind(this),60000);
    }
    async deleteMsgs(){
        if(this.channel){
            if(!this.channel.deleted){
                var msgs=await this.channel.messages.fetch();
                msgs=msgs.filter(m=>!this.descriptionMsgs.find(x=>x===m) && !this.itemsMsgs.find(x=>x===m) && (Date.now()-m.createdTimestamp>300000));
                msgs.each(m=>{this.utility.deleteMsg(m);});
                setTimeout(this.deleteMsgs.bind(this),60000);
            }
        }
    }
    async setDescription(description){
        for(var i=0;i<this.descriptionMsgs.length;i++){
            await this.utility.deleteMsg(this.descriptionMsgs[i]);
        }
        this.descriptionMsgs=await this.utility.sendMsg(this.channel, "***" + description + "***");
    }
    async setItems(items, cash){
        for(var i=0;i<this.itemsMsgs.length;i++){
            await this.utility.deleteMsg(this.itemsMsgs[i]);
        }
        if(items.length===0){this.itemsMsgs=await this.utility.sendMsg(this.channel, this.nameID + " contains no items");}
        else{
            this.itemsMsgs=await this.utility.sendMsg(this.channel,this.nameID + " contains the following items:");
            for(var i=0;i<items.length;i++){   
                var msgContent=items[i].view(undefined, [], true, false,this.channel,true);
                this.itemsMsgs=this.itemsMsgs.concat(await this.utility.sendMsg(this.channel,msgContent)); 
            }
        }
        this.itemsMsgs=this.itemsMsgs.concat(await this.utility.sendMsg(this.channel,this.nameID + " contains " + cash + " in cash.")); 
    }
}