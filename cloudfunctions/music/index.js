// 云函数入口文件
const cloud = require('wx-server-sdk');
// 一个用户只能在一个环境中创建 50 个云函数，如果小程序很复杂的话，云函数就不够用了
// 可以使用 云函数路由库 —— tcb-router
const TcbRouter = require('tcb-router');
const axios = require('axios');

const BASE_URL = 'http://musicapi.xiecheng.live';

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库的引用
const db = cloud.database();
// 获取播放列表集合的引用
const playlistCollection = db.collection('playlist');

// 云函数入口函数
exports.main = async (event, context) => {
    const app = new TcbRouter({
        event
    });

    // 获取歌单列表
    app.router('playlist', async (ctx, next) => {
        ctx.body = await playlistCollection
            .skip(event.start)
            .limit(event.count)
            .orderBy('createTime', 'desc')
            .get()
    });

    // 获取歌单下的音乐列表
    app.router('musicList', async (ctx, next) => {
        const URL = `${BASE_URL}/playlist/detail?id=${parseInt(event.playlistId)}`;
        const result = await axios.request(URL);
        ctx.body = result.data;
    });

    // 根据音乐ID 获取音乐对应的 url
    app.router('musicUrl', async (ctx, next) => {
        const URL = `${BASE_URL}/song/url?id=${event.musicId}`;
        const result = await axios.request(URL);
        ctx.body = result.data;
    });

    // 获取音乐的歌词数据
    app.router('lyric', async (ctx, next) => {
        const URL = `${BASE_URL}/lyric?id=${event.musicId}`;
        const result = await axios.request(URL);
        ctx.body = result.data;
    });


    // 需要将当前的服务返回
    return app.serve();
};
