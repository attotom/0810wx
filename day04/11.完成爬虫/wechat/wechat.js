const rp = require('request-promise-native');
const {writeFile, readFile, createReadStream} = require('fs');
const {appID, appsecret} = require('../config');
const api = require('../api');
const {writeFileAsync, readFileAsync} = require('../utils/tools');

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
    return writeFileAsync(filePath, accessToken);
  }

  readAccessToken (filePath) {
    return writeFileAsync(filePath);
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
  
  async getTicket () {
    //获取access_token
    const {access_token} = await this.fetchAccessToken();
    //定义请求地址
    const url = `${api.ticket}access_token=${access_token}`;
    //发送请求
    const result = await rp({method: 'GET', url, json: true});
    //设置access_token的过期时间, 提前5分钟刷新
    // result.expires_in = Date.now() + 7200000 - 300000;
    //返回result
    return {
      ticket: result.ticket,
      ticket_expires_in: Date.now() + 7200000 - 300000
    };
  }
  
  saveTicket (filePath, ticket) {
    return writeFileAsync(filePath, ticket);
  }
  
  readTicket (filePath) {
    return readFileAsync(filePath);
  }
  
  isValidTicket ({ticket_expires_in}) {
    return Date.now() < ticket_expires_in;
  }
  
  fetchTicket () {
    if (this.ticket && this.ticket_expires_in && this.isValidTicket(this)) {
      console.log('进来了~');
      return Promise.resolve({ticket: this.ticket, ticket_expires_in: this.ticket_expires_in});
    }
    
    return this.readTicket('./ticket.txt')
      .then(async res => {
        if (this.isValidTicket(res)) {
          //没有过期，直接使用
          //作为then函数返回值， promise对象包着res
          return res;
        } else {
          //过期了
          const ticket = await this.getTicket();
          await this.saveTicket('./ticket.txt', ticket);
          //作为then函数返回值， promise对象包着accessToken
          return ticket;
        }
      })
      .catch(async err => {
        const ticket = await this.getTicket();
        await this.saveTicket('./ticket.txt', ticket);
        return ticket;
      })
      .then(res => {
        //不管上面成功或者失败都会来到这
        this.ticket = res.ticket;
        this.ticket_expires_in = res.ticket_expires_in;
        
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

  async sendAllByTag (options) {
    try {
      const {access_token} = await this.fetchAccessToken();
      const url = `${api.message.sendall}access_token=${access_token}`;
      return await rp({method: 'POST', url, json: true, body: options});
    } catch (e) {
      return 'sendAllByTag方法出了问题' + e;
    }
  }
  
  async uploadMaterial (type, material, body) {
    try {
      //获取access_token
      const {access_token} = await this.fetchAccessToken();
      //定义请求地址
      let url = '';
      let options = {method: 'POST', json: true};
      
      if (type === 'news') {
        url = `${api.upload.uploadNews}access_token=${access_token}`;
        //请求体参数
        options.body = material;
      } else if (type === 'pic') {
        url = `${api.upload.uploadimg}access_token=${access_token}`;
        //以form表单上传
        options.formData = {
          media: createReadStream(material)
        }
      } else {
        url = `${api.upload.uploadOthers}access_token=${access_token}&type=${type}`;
        //以form表单上传
        options.formData = {
          media: createReadStream(material)
        }
        
        if (type === 'video') {
          options.body = body;
        }
        
      }
  
      options.url = url;
      
      //发送请求
      return await rp(options);
      
    } catch (e) {
      return 'uploadMaterial方法出了问题' + e;
    }
    
  }
  
  
}

//测试微信接口功能
(async () => {
  const w = new Wechat();

})()

module.exports = Wechat;