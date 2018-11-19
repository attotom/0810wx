module.exports = message => {

  //初始化消息配置对象
  let options = {
    toUserName: message.FromUserName,
    fromUserName: message.ToUserName,
    createTime: Date.now(),
    msgType: 'text'
  }

  //初始化一个消息文本
  let content = '你在说什么，我听不懂~';

  if (message.MsgType === 'text') {
    if (message.Content === '1') {  //全匹配
      content = '大吉大利，今晚吃鸡';
    } else if (message.Content === '2') {
      content = '落地成盒';
    } else if (message.Content.includes('信')) {  //半匹配
      content = '我信你个鬼,你个糟老头子坏得很~';
    } else if (message.Content === '3') {
      //回复图文消息
      options.msgType = 'news';
      options.title = '游戏攻略~';
      options.description = 'weixin0810~';
      options.picUrl = 'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=821105795,3802172768&fm=27&gp=0.jpg';
      options.url = 'http://yys.163.com/';
    }
  } else if (message.MsgType === 'voice') {
    //说明用户发送的是语音消息
    content = `语音识别结果为: ${message.Recognition}`;
  } else if (message.MsgType === 'location') {
    //用户主动发送位置
    content = `纬度：${message.Location_X}  经度：${message.Location_Y} 地图的缩放大小：${message.Scale} 位置详情：${message.Label}`;
  } else if (message.MsgType === 'event') {
    if (message.Event === 'subscribe') {
      //关注事件/订阅事件
      content = '欢迎您关注公众号~';
      if (message.EventKey) {
        //说明扫了带参数的二维码
        content = '您扫了带参数的二维码';
      }
    } else if (message.Event === 'unsubscribe') {
      //取消关注事件
      console.log('无情取关~');
    } else if (message.Event === 'LOCATION') {
      //用户初次访问公众号，会自动获取地理位置
      content = `纬度：${message.Latitude} 经度：${message.Longitude}`;
    } else if (message.Event === 'CLICK') {
      //用户初次访问公众号，会自动获取地理位置
      content = `用户点击了：${message.EventKey}`;
    }
  }

  //判断用户发送消息的内容，根据内容返回特定的响应
  options.content = content;


  return options;

}