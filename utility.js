"use strict";
const csv=require('csvtojson');         const fs = require('fs');       const Discord = require('discord.js');
const iconv = require('iconv-lite');    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const jschardet=require('jschardet');

module.exports = class Utility{
    constructor(){this.channel=undefined;}
    setChannel(mainChannel){
        this.channel=mainChannel;       this.msgCollected=false;        this.msgReturn=false;
    }
    splitStr(text,splChar){
        text=text.trim();
        var text1=text; var text2="";
        var spFind = text.indexOf(splChar);
        if(spFind !== -1){
            text2=text.substring(spFind+1).trim(); 
            text1=text.substring(0,spFind);
        }
        return [text1, text2];
    }
    getAuthorName(msg){
        return msg.member===undefined ? msg.author.username : (msg.member.nickname===null ? msg.author.username : msg.member.nickname);
    }
    async sendMsg(channel, newContent, count){
        newContent=this.escapeMarkdown(newContent);
        var returnArr=[];
        if(newContent.length>2000){
            var newContent1=newContent.substring(0,1900);
            var newContent2=newContent.substring(1901);
            returnArr=await this.sendMsg(channel, newContent1, count);
            returnArr = returnArr.concat(await this.sendMsg(channel, newContent2, count));
            return returnArr;
        }
        if(count===undefined){count=3;}
        if(count>0){
            try{var returnObj = await channel.send(newContent); returnArr.push(returnObj);}catch{
                returnArr = await setTimeout(async ()=> {try{return await this.sendMsg(channel, newContent, count-1)}catch{return [];}}, 250);
            }
        }else{
            try{await this.channel.send("ERROR: Could not send one of my messages, I'm not sure why \nThe message was: " + newContent);}catch{}
        }
        return returnArr;
    }
    async deleteMsg(msgObj){
        if(msgObj!==undefined){
            await Promise.resolve(msgObj).then(async msg=>{
                if(msg.deleted===false && msg.deletable===true){
                    try{await msg.delete({timeout: 100});}catch{}
                }
                msgObj=undefined;
                return msgObj;
            })
        }else{return msgObj;}
    }
    removeApostError(text){
        text=text.replace("\u2019","'");
        text=text.replace("\u201C",'"');
        text=text.replace("\u201D",'"');
        return text;
    }
    escapeMarkdown(text) {
        var unescaped = text.replace(/\\(_|`|~|\\)/g, '$1'); // unescape any "backslashed" character
        var escaped = unescaped.replace(/(_|`|~|\\)/g, '\\$1'); // escape _, `, ~, \
        return escaped;
    }
    async checkMessage(msgChannel, msgAuthorID, checkContent, cancelContent, PassFunction, CallingObj, parameters){
        this.msgCollected=false;    this.msgReturn=false;
        await this.sendMsg(msgChannel, checkContent);
        try{var collection=await msgChannel.awaitMessages(m => m.author.id === msgAuthorID, { max: 1, time: 30000, errors: ['time'] });
            if(!this.msgCollected){
                this.msgCollected=true;
                if (collection.first().content.toLowerCase().trim() ==="y") {PassFunction.apply(CallingObj, parameters); this.msgReturn=true;}
                else{this.sendMsg(msgChannel,cancelContent);}
            }
        }
        catch{if(!this.msgCollected){this.sendMsg(msgChannel,cancelContent); this.msgCollected=true;}}
        return this.msgReturn;   
    }
    async readFile(msg, filePath, NextFunction, CallingObj, parameters, giveWarning){
        if(fs.existsSync(filePath)){
            var fileContent = fs.readFileSync(filePath);
            var {encoding}=jschardet.detect(fileContent);
            fileContent=iconv.decode(fileContent, encoding);
            await csv().fromString(fileContent).then(async (fileData)=>{
                for(var i=0;i<fileData.length;i++){
                    for(var jObj in fileData[i]){
                        fileData[i][jObj]=this.removeApostError(fileData[i][jObj]);
                    }
                }
                parameters.push(fileData);
                NextFunction.apply(CallingObj, parameters);
            }).catch(err => {this.sendMsg(msg.channel,"Error: Could not copy data from file " + filePath); return;});  
        } else{
            if(giveWarning){this.sendMsg(msg.channel,"Warning: file " + filePath + " not found");} 
            parameters.push([]);
            NextFunction.apply(CallingObj, parameters);
        }
    }

}