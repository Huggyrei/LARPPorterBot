"use strict";
const csv=require('csvtojson');   const fs = require('fs');     const createCsvWriter = require('csv-writer').createObjectCsvWriter;
module.exports = class Item{
    constructor(name, mainChannel){
        this.nameID=name;   this.infos=[];  this.channel=mainChannel;
    }
    async setup(msg){
        this.infos=[];
        if(fs.existsSync('./csvs/' + this.nameID + '.csv')){
            await csv().fromFile('./csvs/' + this.nameID + '.csv').then((fileData)=>{
                for(var i=0;i<fileData.length;i++) { 
                    var dataItem=fileData[i];
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
                    this.infos.push(infoItem);
                }
            }).catch(err => {this.sendMsg(msg.channel,"Could not copy data from file /csvs/" + this.nameID + ".csv");});  
        } else{}//this.sendMsg(msg.channel,"Warning: item information file not found for item " + this.nameID);}
    }
    loadFileData(msg, jsonIn){
        var infoItem={heading:"", visible:true, "text": ""};
        for(var jObj in jsonIn){
            switch(jObj.toLowerCase()){
                case 'name': case 'title': case 'heading': case 'section': infoItem.heading=jsonIn[jObj]; break;
                case 'visible': case 'visibility': case 'visible?': case 'public' : 
                    var firstChar = jsonIn[jObj].toLowerCase().substring(0,1);
                        infoItem.visible=(firstChar==="y"||firstChar==="t")?true:false; break
                case 'itemname': break;
                default: infoItem.text=this.removeApostError(jsonIn[jObj]);
            }
        }
        var tempInfoItem=this.infos.find(x=>x.heading.toLowerCase()===infoItem.heading.toLowerCase());
        if(tempInfoItem===undefined){this.infos.push(infoItem);}
        else{
           if(tempInfoItem.visible!==infoItem.visible || tempInfoItem.text.toLowerCase()!==infoItem.text.toLowerCase()){
                this.sendMsg(msg.channel, "Overwriting info " + infoItem.heading + " for item " + this.nameID + " with info from items.csv");
            }
            tempInfoItem.visible=infoItem.visible;
           tempInfoItem.text=infoItem.text;
        } 
    }
    async sendMsg(channel, newContent, count){
        newContent=this.escapeMarkdown(newContent);
        if(count===undefined){count=2;}
        if(count!==0){
            try{await channel.send(newContent);}catch{
                setTimeout(async ()=> {try{await this.sendMsg(chnnel, newContent, count-1)}catch{}}, 250);
            }
        }else{
            try{await this.channel.send("ERROR: Could not send one of my messages, I'm not sure why. \nThe message was: " + newContent);}catch{}
        }
    }
    escapeMarkdown(text) {
        var unescaped = text.replace(/\\(_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
        var escaped = unescaped.replace(/(_|`|~|\\)/g, '\\$1'); // escape _, `, ~, \
        return escaped;
      }
    removeApostError(text){
        text=text.replace("\u2019","'");
        text=text.replace("\u201C",'"');
        text=text.replace("\u201D",'"');
        return text;
    }
    view(msg, gmFlag){
        var msgContent="**"+this.nameID+"**";
        for(var i=0;i<this.infos.length;i++){
            if(gmFlag || this.infos[i].visible) {msgContent = msgContent + "\n*" + this.infos[i].heading + (gmFlag ? " [Visible: " + this.infos[i].visible + "]" : "") +  "*: "+this.infos[i].text;}
        }
        this.sendMsg(msg.channel,msgContent);
    }
    examine(msg, heading){
        if(heading===""){this.view(msg,false); return;}
        var infoItem=this.infos.find(x=>x.heading.toLowerCase()===heading.toLowerCase());
        if(infoItem===undefined){this.sendMsg(msg.channel,"No information found"); return;}
        this.sendMsg(msg.channel,"**" +this.nameID+"**-  *" + infoItem.heading + "*: " + infoItem.text);

    }

    //GM only edit commands
    renameID(msg, msgInfo2){
        var oldName=this.nameID;
        this.nameID=msgInfo2;
        this.sendMsg(msg.channel,"Item ID name changed from " + oldName + " to " + this.nameID);
    }
    renameInfo(msg, msgInfo2, msgInfo3){
        var info=this.infos.find(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(info===undefined){this.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        info.heading = msgInfo3;
        this.sendMsg(msg.channel,"Info header changed from " + msgInfo2 + " to " + msgInfo3);
    }
    editVisible(msg, msgInfo2, msgInfo3){
        var info=this.infos.find(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(info===undefined){this.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        var firstChar = msgInfo3.toLowerCase().substring(0,1);
        info.visible=(firstChar==="y"||firstChar==="t"||msgInfo2.toLowerCase()==="on")?true:false;
        this.sendMsg(msg.channel,"Info visibility for " + msgInfo2 + " for item " + this.nameID + " set to " + info.visible);
    }
    editText(msg, msgInfo2, msgInfo3){
        var info=this.infos.find(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(info===undefined){this.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        info.text = msgInfo3;
        this.sendMsg(msg.channel,"Info text changed for " + msgInfo2 + " of item " + this.nameID);
    }
    deleteInfo(msg, msgInfo2){
        var infoIndex=this.infos.findIndex(x=>x.heading.toLowerCase()===msgInfo2.toLowerCase());
        if(infoIndex===-1){this.sendMsg(msg.channel,"Info type " + msgInfo2 + " for item " + this.nameID + " not found"); return;}
        this.infos.splice(infoIndex,1);
        this.sendMsg(msg.channel,msgInfo2 + " info deleted for item " + this.nameID);
    }
    addInfo(msg, msgInfo2, msgInfo3){
        if(msgInfo2===""){this.sendMsg(msg.channel,"ERROR: cannot add info with no header"); return;}
        if(this.infos.find(x=>x.heading===msgInfo2)){this.sendMsg(msg.channel,"ERROR: This item already has some info with that heading associated with it"); return;}
        var firstChar = msgInfo3.toLowerCase().substring(0,1);
        this.infos.push({heading: msgInfo2, visible:(firstChar==="y"||firstChar==="t")?true:false, "text": ""});
        this.sendMsg(msg.channel,"New info type " + msgInfo2 + " added for item " + this.nameID);
    }
    async save(msg){
        try{
            var csvWriter = createCsvWriter({path: './csvs/' + this.nameID + '.csv',
                header: [{id: 'heading', title: "Heading"}, {id: 'visible', title: "Visible"}, {id: 'text', title: "Text"}]
            });
            await csvWriter.writeRecords(this.infos).then(()=> this.sendMsg(msg.channel,"Item " + this.nameID + " saved to csv file"));
        }catch{this.sendMsg(msg.channel,"ERROR: Could not save item to "+ this.nameID + ".csv, do you have it open?");}
    }
}


