const express = require('express');
const sha1 = require('sha1');

const {getUserDataAsync, parseXMLDataAsync, formatMessage} = require('./utils/tools');

const app = express();

const config = {
  appID: 'wxf581ae1a7999bd35',
  appsecret: 'd18a1c16bbffc63631951164b8b7bb10',
  token: 'weixin0810'
}

app.use(async (req, res, next) => {
  console.log(req.query);

  const {signature, echostr, timestamp, nonce} = req.query;
  const {token} = config;
  const str = sha1([timestamp, nonce, token].sort().join(''));

  if (req.method === 'GET') {

    if (signature === str) {

      res.end(echostr);
    } else {

      res.end('error');
    }
  } else if (req.method === 'POST') {

    if (signature !== str) {
      res.end('error');
      return;
    }

    const xmlData = await getUserDataAsync(req);
    console.log(xmlData);

    const jsData = await parseXMLDataAsync(xmlData);
    console.log(jsData);


    const message = formatMessage(jsData);
    console.log(message);

    let content = '你在说什么，我听不懂~';


    if (message.Content === '1') {
      content = '大吉大利，今晚吃鸡';
    } else if (message.Content === '2') {
      content = '落地成盒';
    } else if (message.Content.includes('爱')) {
      content = '我爱你~';
    }

    let replyMessage = `<xml>
      <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
      <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
      <CreateTime>${Date.now()}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
      </xml>`;


    res.send(replyMessage);

  } else {
    res.end('error');
  }

})


app.listen(3000, err => {
  if (!err) console.log('服务器启动成功了~');
  else console.log(err);
})