const express = require('express');
const sha1 = require('sha1');
const app = express();

const config = {
  appID: 'wxf581ae1a7999bd35',
  appsecret: 'd18a1c16bbffc63631951164b8b7bb10',
  token: 'weixin0810'
}

app.use((req, res, next) => {
  console.log(req.query);

  const {signature, echostr, timestamp, nonce} = req.query;
  const {token} = config;

  const str = sha1([timestamp, nonce, token].sort().join(''));

  if (signature === str) {

    res.end(echostr);
  } else {

    res.end('error');
  }


})


app.listen(3000, err => {
  if (!err) console.log('服务器启动成功了~');
  else console.log(err);
})
