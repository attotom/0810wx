const express = require('express');
const sha1 = require('sha1');
const handleRequest = require('./reply/handleRequest');
const Wechat = require('./wechat/wechat');
const {url, appID} = require('./config');

const wechat = new Wechat();

const app = express();

app.set('views', 'views');
app.set('view engine', 'ejs');

app.get('/search', async (req, res) => {

  //得到临时票据
  const {ticket} = await wechat.fetchTicket();
  //随机字符串
  const noncestr = Math.random().toString().split('.')[1];
  //时间戳
  const timestamp = parseInt(Date.now() / 1000);
  
  //将四个参数按照 key = value 方式组合一个数组
  const arr = [
    `noncestr=${noncestr}`,
    `jsapi_ticket=${ticket}`,
    `timestamp=${timestamp}`,
    `url=${url}/search`
  ]
  
  //排序，以&拼接成一个字符串, 再进行sha1加密，得到的就是加密签名
  const signature = sha1(arr.sort().join('&'));
  
  res.render('search', {
    signature,
    timestamp,
    noncestr,
    appID
  });
})

app.use(handleRequest());

app.listen(3000, err => {
  if (!err) console.log('服务器启动成功了~');
  else console.log(err);
})