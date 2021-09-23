const config = require('./config.js');
let httprequest = require('request');

class telegram {
  constructor(status="выкл",id="",token="") {
    this.token = token;
    this.id = id;
    this.url = 'https://api.telegram.org/bot' + token;
    this.text = "";
    this.answerMarket = "";
    this.status = status;
    this.params = {
      'method': 'post',
      'muteHttpExceptions': true
    }
    this.textbuffer = "";
    this.mute = false;
  }
  // отправка сообщение в телеграмм
  telegramSendLog() {
    if (this.status == "вкл") {
      this.answerMarket = JSON.stringify(this.answerMarket);
      this.answerMarket = this.answerMarket.replace("{", "");
      this.answerMarket = this.answerMarket.replace("}", "");
      let text = "Команда от tradingview:\n" + this.text + "\n" + "\n Oтвет биржы:\n (" + this.answerMarket + ")";

      this.message = this.url + "/sendMessage?chat_id=" + this.id + "&text=" + text;
      httprequest.post(this.message);

    }
  }
  telegramSendText() {
    if (this.status == "вкл") {

      this.text = encodeURIComponent(this.text);
      this.message = (this.url + "/sendMessage?chat_id=" + this.id + "&text=" + this.text);
      httprequest.post(this.message);
    }
  }
  telegramSend() {
    if (this.status == "вкл") {
      this.message = this.url + "/sendMessage?chat_id=" + this.id + "&text=" + this.text;
      httprequest.post(this.message);
    }
  }

  telegramSendText2(strHeader, strText) {
    if (this.status == "вкл" && !this.mute) {
      let now = new Date(Date.now() + config.gmttime * 3600000);
      let strnow = now.toLocaleString("ru-RU") + `.${now.getMilliseconds()}`;
      this.textbuffer += "<b>" + strHeader + ": [" + strnow + "]</b>\n" + strText + "\n\n";
    }
  }
  telegramSendResponse(strHeader, objJSONResp, boolStripJson = true){
    let strAnswer=JSON.stringify(objJSONResp, null, '🔸');
    if (boolStripJson) {
      strAnswer = strAnswer.replace(/"([^"]+(?="))"/g, '$1');
      strAnswer = strAnswer.replace("{\n", "");
      strAnswer = strAnswer.replace("{", "");
      strAnswer = strAnswer.replace("}", "");
    }
    this.telegramSendText2(strHeader,strAnswer);
  }
  
  telegramRequestSend(dateStartTime, strRequestHeader, strRequest, dateEndTime, strAnswerHeader, strAnswer, boolStripJson = true) {
    if (this.status == "вкл" && !this.mute) {
      if (boolStripJson) {
        strAnswer = strAnswer.replace(/"([^"]+(?="))"/g, '$1');
        strAnswer = strAnswer.replace("{\n", "");
        strAnswer = strAnswer.replace("{", "");
        strAnswer = strAnswer.replace("}", "");
      }
      let strStartTime = dateStartTime.toLocaleString("ru-RU") + `.${dateStartTime.getMilliseconds()}`;
      let strEndTime = dateEndTime.toLocaleString("ru-RU") + `.${dateEndTime.getMilliseconds()}`;
      this.textbuffer += "<b>" + strRequestHeader + ": [" + strStartTime + "]</b>\n" + strRequest + "\n\n";
      this.textbuffer += "<b>" + strAnswerHeader + ": [" + strEndTime + "]</b>\n" + strAnswer + "\n\n";
    }
  }

  telegramRequestSend2(dateStartTime, strRequestHeader, strRequest, strAnswerHeader, strAnswer, boolStripJson) {
    let dateEndTime = new Date(Date.now() + config.gmttime * 3600000);
    this.telegramRequestSend(dateStartTime, strRequestHeader, strRequest, dateEndTime, strAnswerHeader, strAnswer, boolStripJson)
  }

  // выбрасывает накопленный буфер в телеграмм
  telegramSendBuffer() {
    if (this.status == "вкл" && !this.mute) {
      this.message = this.url + "/sendMessage?chat_id=" + this.id + "&parse_mode=HTML&" + "&text=" + encodeURIComponent(this.textbuffer);
      httprequest.post(this.message);
      this.textbuffer = "";
    }
  }

}

module.exports = telegram;