// 云函数入口文件
const cloud = require('wx-server-sdk');
// 一个用户只能在一个环境中创建 50 个云函数，如果小程序很复杂的话，云函数就不够用了
// 可以使用 云函数路由库 —— tcb-router
const TcbRouter = require('tcb-router');
// const axios = require('axios');
const {playlist_detail,song_url,lyric} = require('NeteaseCloudMusicApi');

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

    // 这里获取数据有两种调用方式：
    // 一种是将 NeteaseCloudMusicApi 部署到自己的服务器，然后请求该服务的地址来获取 推荐歌单列表 数据
    // const URL = 'http://musicapi.xxx';
    // const result = await axios.request(URL + '/personalized');

    // 一种是安装 NeteaseCloudMusicApi 包，使用这个包里的 api 去请求数据
    // https://binaryify.github.io/NeteaseCloudMusicApi/#/?id=%e5%8f%af%e4%bb%a5%e5%9c%a8nodejs%e8%b0%83%e7%94%a8

    // 获取歌单下的音乐列表
    app.router('musicList', async (ctx, next) => {
        // const URL = `${BASE_URL}/playlist/detail?id=${parseInt(event.playlistId)}`;
        // const result = await axios.request(URL);
        const result = await playlist_detail({
            id: parseInt(event.playlistId)
        });
        ctx.body = result.body;
    });

    // 根据音乐ID 获取音乐对应的 url
    app.router('musicUrl', async (ctx, next) => {
        // const URL = `${BASE_URL}/song/url?id=${event.musicId}`;
        // const result = await axios.request(URL);
        const result = await song_url({
            id:event.musicId
        });
        ctx.body = result.body;
    });

    // 获取音乐的歌词数据
    app.router('lyric', async (ctx, next) => {
        // const URL = `${BASE_URL}/lyric?id=${event.musicId}`;
        // const result = await axios.request(URL);
        const result = await lyric({
            id:event.musicId
        });
        ctx.body = result.body;
    });


    // 需要将当前的服务返回
    return app.serve();
};
