const rp = require('request-promise-native');
const {writeFile, readFile, createReadStream} = require('fs');
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
  
  //上传图片获取media_id
  let result1 = await w.uploadMaterial('image', './node.jpg');
  console.log(result1);
  /*
  { media_id: '1_821D3VHxMTbMuZ5-DSoMdegIBNCcnH8CbuuCWBZrw',
  url: 'http://mmbiz.qpic.cn/mmbiz_png/l6hEPf9t1fELREZNkCURLv7u5SZf4R1CotvXyq08AWrfkVyr60Qc7hYhIuYzFkBsWdCetdS0icuft3Vic0NWYRAw/0?wx_fmt=png
   */
    //上传图片获取地址
  let result2 = await w.uploadMaterial('pic', './logo.png');
  console.log(result2);
  /*
  { url: 'http://mmbiz.qpic.cn/mmbiz_png/l6hEPf9t1fELREZNkCURLv7u5SZf4R1Cib5tbQCCx8ic3qMOl3pHaianpyrgqRlQZmt2GH3ZVR4OpRjXrS6pEpXhA/0' }
   */
  //上传图文消息
  let result3 = await w.uploadMaterial('news', {
    "articles": [{
      "title": '微信公众号开发',
      "thumb_media_id": result1.media_id,
      "author": '佚名',
      "digest": '这里是class0810开发的',
      "show_cover_pic": 1,
      "content": `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <title>Title</title>
                  </head>
                  <body>
                    <h1>微信公众号开发</h1>
                    <img src="${result2.url}">
                  </body>
                  </html>`,
      "content_source_url": 'http://www.atguigu.com',
      "need_open_comment":1,
      "only_fans_can_comment":1
    },
      {
        "title": 'class0810',
        "thumb_media_id": result1.media_id,
        "author": '佚名',
        "digest": '课程学了一大半了~马上要毕业了',
        "show_cover_pic": 0,
        "content": '今天天气真晴朗',
        "content_source_url": 'https://www.baidu.com',
        "need_open_comment":0,
        "only_fans_can_comment":0
      }
    ]
  });
  console.log(result3);
  /*
  { media_id: '1_821D3VHxMTbMuZ5-DSoIWBsxL-yM3hCmIuKS430HQ' }
   */
  
  //删除菜单，再重新创建
  let result = await w.deleteMenu();
  console.log(result);
  result = await w.createMenu(require('./menu'));
  console.log(result);
})()