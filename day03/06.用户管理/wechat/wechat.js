const rp = require('request-promise-native');
const {writeFile, readFile} = require('fs');
const {appID, appsecret} = require('../config');
const api = require('../api');

class Wechat {

  async getAccessToken () {
    //定义请求地址
    const url = `${api.accessToken}appid=${appID}&secret=${appsecret}`;
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

  fetchAccessToken () {
    if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
      console.log('进来了~');
      //说明access_token是有效的
      return Promise.resolve({access_token: this.access_token, expires_in: this.expires_in});
    }
    
    //最终目的返回有效access_token
    return this.readAccessToken('./accessToken.txt')
      .then(async res => {
        if (this.isValidAccessToken(res)) {
          //没有过期，直接使用
          //作为then函数返回值， promise对象包着res
          return res;
        } else {
          //过期了
          const accessToken = await this.getAccessToken();
          await this.saveAccessToken('./accessToken.txt', accessToken);
          //作为then函数返回值， promise对象包着accessToken
          return accessToken;
        }
      })
      .catch(async err => {
        const accessToken = await this.getAccessToken();
        await this.saveAccessToken('./accessToken.txt', accessToken);
        return accessToken;
      })
      .then(res => {
        //不管上面成功或者失败都会来到这
        this.access_token = res.access_token;
        this.expires_in = res.expires_in;
        
        return Promise.resolve(res);
      })
      
  }

  async createMenu (menu) {
    try {
      //获取access_token
      const {access_token} = await this.fetchAccessToken();
      //定义请求地址
      const url = `${api.menu.create}access_token=${access_token}`;
      //发送请求
      const result = await rp({method: 'POST', url, json: true, body: menu});
  
      return result;
    } catch (e) {
      return 'createMenu方法出了问题：' + e;
    }
  }

  async deleteMenu () {
    try {
      //获取access_token
      const {access_token} = await this.fetchAccessToken();
      //定义请求地址
      const url = `${api.menu.delete}access_token=${access_token}`;
      //发送请求
      const result = await rp({method: 'GET', url, json: true});
  
      return result;
    } catch (e) {
      return 'deleteMenu方法出了问题：' + e;
    }
  }

  async createTag (name) {
    try {
      //获取access_token
      const {access_token} = await this.fetchAccessToken();
      //定义请求地址
      const url = `${api.tag.create}access_token=${access_token}`;
      //发送请求
      const result = await rp({method: 'POST', url, json: true, body: {tag: {name}}});
      
      return result;
    } catch (e) {
      return 'createTag方法出了问题：' + e;
    }
  }
  
  async getTagUsers (tagid, next_openid = '') {
    try {
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.getUsers}access_token=${access_token}`;
      return await rp({method: 'POST', url, json: true, body: {tagid, next_openid}});
    } catch (e) {
      return 'getTagUsers方法出了问题' + e;
    }
  }
  
  async batchUsersTag (openid_list, tagid) {
    try {
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.tag.batch}access_token=${access_token}`;
      return await rp({method: 'POST', url, json: true, body: {tagid, openid_list}});
    } catch (e) {
      return 'batchUsersTag方法出了问题' + e;
    }
  }
}

(async () => {

  const w = new Wechat();
  
  let result1 = await w.createTag('class0810');
  console.log(result1); // { tag: { id: 131, name: 'class0810' } }
  let result2 = await w.batchUsersTag([
    'o7Ogh1R5wNvBQdhhDBX4q6wOYLvU'
  ], result1.tag.id);
  console.log(result2);
  let result3 = await w.getTagUsers(result1.tag.id);
  console.log(result3);

})()