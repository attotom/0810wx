const rp = require('request-promise-native');
const {writeFile, readFile} = require('fs');
const {appID, appsecret} = require('../config');

class Wechat {

  async getAccessToken () {
    //定义请求地址
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`;
    //发送请求
    const result = await rp({method: 'GET', url, json: true});
    //设置access_token的过期时间, 提前5分钟刷新
    result.expires_in = Date.now() + 7200000 - 300000;
    //返回result
    return result;
  }

  saveAccessToken (filePath, accessToken) {
    return new Promise((resolve, reject) => {
      //js对象没办法存储，会默认调用toString() --->  [object Object]
      //将js对象转化为json字符串
      writeFile(filePath, JSON.stringify(accessToken), err => {
        if (!err) {
          resolve();
        } else {
          reject('saveAccessToken方法出了问题：' + err);
        }
      })
    })
  }

  readAccessToken (filePath) {
    return new Promise((resolve, reject) => {
      readFile(filePath, (err, data) => {
        //读取的data数据  二进制数据，buffer
        if (!err) {
          //先调用toString转化为json字符串
          //在调用JSON.parse将json字符串解析为js对象
          resolve(JSON.parse(data.toString()));
        } else {
          reject('readAccessToken方法出了问题:' + err);
        }
      })
    })
  }

  isValidAccessToken ({expires_in}) {

    return Date.now() < expires_in;
  }
  
}

(async () => {

  const w = new Wechat();
  
  w.readAccessToken('./accessToken.txt')
    .then(async res => {
      if (w.isValidAccessToken(res)) {
        //没有过期，直接使用
        console.log(res);
        console.log('没有过期，直接使用');
      } else {
        //过期了
        const accessToken = await w.getAccessToken();
        await w.saveAccessToken('./accessToken.txt', accessToken);
      }
    })
    .catch(async err => {
      const accessToken = await w.getAccessToken();
      await w.saveAccessToken('./accessToken.txt', accessToken);
    })

})()