"use strict";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
module.exports = class Item{
    constructor(name, mainChannel, utility){
        this.nameID=name;   this.infos=[];  this.channel=mainChannel;   this.utility=utility;
    }
    async setup(msg){
        this.infos=[];
        await this.utility.readFile(msg, './csvs/' + this.nameID + '.csv', this.initFile, this, [msg], false);
    }
    loadFileData(msg, jsonIn){
        this.initFile(msg, [jsonIn]); 
    }
    async initFile(msg, fileData){
        for(var i=0;i<fileData.length;i++) { 
            var infoItem=this.processJson(fileData[i]);
            var newName=this.findValidName(infoItem.heading,0);
            if(newName!==infoItem.heading){
                this.utility.sendMsg(msg.channel, "WARNING: Multiple entries found for info " + infoItem.heading + " or info heading invalid for item " + this.nameID + "; will create new info item under name " + newName);
                infoItem.heading=newName;
            }
            this.infos.push(infoItem);
        }
    }
    processJson(dataItem){
        var infoItem={heading:"", visible:true, "text": ""};
        for(var jObj in dataItem){
            switch(jObj.toLowerCase()){
                case 'name': case 'title': case 'heading': case 'section': infoItem.heading=dataItem[jObj]; break;
                case 'visible': case 'visibility': case 'visible?': case 'public' : 
                    var firstChar = dataItem[jObj].toLowerCase().substring(0,1);
                        infoItem.visible=(firstChar==="y"||firstChar==="t")?true:false; break
                default: infoItem.text=dataItem[jObj];
            }
        }
        return infoItem;
    }
    checkName(newName){
        if(newName==="" | newName==="locations" || newName==="characters" || newName==="items" || newName==="all" 
            || this.infos.find(x=>x.heading.toLowerCase()===newName.toLowerCase())){return false;}else{return true;}
    }
    findValidName(newName, count){
        if(count===undefined){count=0;}
        var newText = newName + ( count===0 ? "" : count);
        if(this.checkName(newText)){return newText;}
        else{return this.findValidName(newName, count+1);}
    }

    view(msg, heading, gmFlag){
        var msgContent="**"+this.nameID+"**";
        if(heading==="all" || heading===""){
            for(var i=0;i<this.infos.length;i++){
                if(gmFlag || this.infos[i].visible) {msgContent = msgContent + "\n*" + this.infos[i].heading + (gmFlag ? " [Visible: " + this.infos[i].visible + "]" : "") +  "*: "+this.infos[i].text;}
            }
        }
        else{
            var infoItem=this.infos.find(x=>x.heading.toLowerCase()===heading.toLowerCase());
            if(infoItem===undefined){msgContent = msgContent + " - No information found";}
            else{msgContent = msgContent + " - *" + infoItem.heading + "*: " + infoItem.text;}
        }
        this.utility.sendMsg(msg.channel,msgContent);
    }

    //GM only edit commands
    renameID(msg, msgInfo2){
        var oldName=this.nameID;
        this.nameID=msgInfo2;
        this.utility.sendMsg(msg.channel,"Item ID name changed from " + oldName + " to " + this.nameID);
    }
    renameInfo(msg, msgInfo2, msgInfo3){
        var info=this.infos.find(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(info===undefined){this.utility.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        info.heading = msgInfo3;
        this.utility.sendMsg(msg.channel,"Info header changed from " + msgInfo2 + " to " + msgInfo3);
    }
    editVisible(msg, msgInfo2, msgInfo3){
        var info=this.infos.find(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(info===undefined){this.utility.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        var firstChar = msgInfo3.toLowerCase().substring(0,1);
        info.visible=(firstChar==="y"||firstChar==="t"||msgInfo2.toLowerCase()==="on")?true:false;
        this.utility.sendMsg(msg.channel,"Info visibility for " + msgInfo2 + " for item " + this.nameID + " set to " + info.visible);
    }
    editText(msg, msgInfo2, msgInfo3){
        var info=this.infos.find(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(info===undefined){this.utility.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        info.text = msgInfo3;
        this.utility.sendMsg(msg.channel,"Info text changed for " + msgInfo2 + " of item " + this.nameID);
    }
    deleteInfo(msg, msgInfo2){
        var infoIndex=this.infos.findIndex(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(infoIndex===-1){this.utility.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        this.infos.splice(infoIndex,1);
        this.utility.sendMsg(msg.channel,msgInfo2 + " info deleted for item " + this.nameID);
    }
    addInfo(msg, msgInfo2, msgInfo3, msgInfo4){
        if(msgInfo2===""){this.utility.sendMsg(msg.channel,"ERROR: cannot add info with no header"); return;}
        if(this.infos.find(x=>x.heading===msgInfo2)){this.utility.sendMsg(msg.channel,"ERROR: This item already has some info with that heading associated with it"); return;}
        var firstChar = msgInfo3.toLowerCase().substring(0,1);
        this.infos.push({heading: msgInfo2, visible:(firstChar==="y"||firstChar==="t")?true:false, "text": msgInfo4});
        this.utility.sendMsg(msg.channel,"New info type " + msgInfo2 + " added for item " + this.nameID);
    }
    async save(msg){
        try{
            var csvWriter = createCsvWriter({path: './csvs/' + this.nameID + '.csv',
                header: [{id: 'heading', title: "Heading"}, {id: 'visible', title: "Visible"}, {id: 'text', title: "Text"}]
            });
            await csvWriter.writeRecords(this.infos).then(()=> this.utility.sendMsg(msg.channel,"Item " + this.nameID + " saved to csv file"));
        }catch{this.utility.sendMsg(msg.channel,"ERROR: Could not save item to "+ this.nameID + ".csv, do you have it open?");}
    }
}


