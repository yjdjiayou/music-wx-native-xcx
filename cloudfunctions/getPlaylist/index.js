// 云函数入口文件
const cloud = require('wx-server-sdk');
// const axios = require('axios');
const {personalized} = require('NeteaseCloudMusicApi');

// env 设置只会决定小程序端 API 调用的云环境，并不会决定云函数中的 API 调用的环境，在云函数中需要通过 wx-server-sdk 的 init 方法重新设置环境
// 每个云函数之间都是相互独立的，env 设置只会决定本次云函数 API 调用的云环境，并不会决定接下来其他被调云函数中的 API 调用的环境，在编写的每个云函数中都需要通过 init 方法重新设置环境。
// 在设置 env 时指定 cloud.DYNAMIC_CURRENT_ENV 常量 (需 SDK v1.1.0 或以上) ，这样云函数内发起数据库请求、存储请求或调用其他云函数的时候，默认请求的云环境就是云函数当前所在的环境
// 如果 init 时不传 env 参数，后续 API 调用将默认请求到第一个创建的环境，但这种方式并不总是预期的，因此这种方式已废弃，请务必明确传入 env 参数
// 下面 env 的值不能用 cloud.getWXContext().ENV 替代，因为在 exports.main 外部调用的 getWXContext() 无法获取到当前环境
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库的引用
const db = cloud.database();
// 获取播放列表集合的引用
const playlistCollection = db.collection('playlist');
// 最大查询数
const MAX_LIMIT = 1000;


/**
 * 插入播放列表数据
 * @param playlist
 */
async function insertPlaylist(playlist) {
    // 注意：async 不能在 forEach 里使用
    // https://es6.ruanyifeng.com/#docs/async#%E4%BD%BF%E7%94%A8%E6%B3%A8%E6%84%8F%E7%82%B9
    // playlist.forEach(async (it)=>{
    //      await ...xxx
    // });
    for (let it of playlist) {
        await playlistCollection.add({
            data: {
                ...it,
                createTime: db.serverDate()
            }
        });
    }
}


/**
 * 数组去重&合并
 * @param oldPlaylist
 * @param newPlaylist
 * @returns {Array}
 */
//TODO:研究下数据库中有没有更好的去重方法
function removeRepeatAndMergeArr(oldPlaylist, newPlaylist) {
    // console.log("oldPlaylist", oldPlaylist);
    // console.log("newPlaylist", newPlaylist);
    const newData = [];
    for (let i = 0, len1 = newPlaylist.length; i < len1; i++) {
        let flag = true;
        for (let j = 0, len2 = oldPlaylist.length; j < len2; j++) {
            if (newPlaylist[i].id === oldPlaylist[j].id) {
                flag = false;
                break
            }
        }
        if (flag) {
            newData.push(newPlaylist[i])
        }
    }
    return newData;
}

/**
 * 获取数据库中的播放列表数据
 * @returns {Promise<void>}
 */
async function getPlaylistFromDatabase() {
    // 默认情况下，获取到的数据是有限制的
    // 从云函数获取数据，只能获取到 1000 条数据
    // 从小程序端获取数据，只能获取到 20 条数据
    // const data = await playlistCollection.get();

    // 分页查询就能解决以上问题
    // 获取当前集合中的总数
    const countResult = await playlistCollection.count();
    const total = countResult.total;
    const batchTimes = Math.ceil(total / MAX_LIMIT);

    // 分成多次查询
    const tasks = [];
    for (let i = 0; i < batchTimes; i++) {
        let promise = playlistCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
        tasks.push(promise);
    }

    let list = [];
    if (tasks.length > 0) {
        const result = await Promise.all(tasks) || [];
        list = result.reduce((prev, cur, i, arr) => {
            return prev.concat(cur.data);
        }, [])
    }
    return Promise.resolve(list);
}


// 云函数入口函数
exports.main = async (event, context) => {

    let playlistFromDatabase = await getPlaylistFromDatabase();

    // 这里获取数据有两种调用方式：
    // 一种是将 NeteaseCloudMusicApi 部署到自己的服务器，然后请求该服务的地址来获取 推荐歌单列表 数据
    // const URL = 'http://musicapi.xxx';
    // const result = await axios.request(URL + '/personalized');

    // 一种是安装 NeteaseCloudMusicApi 包，使用这个包里的 api 去请求数据
    // https://binaryify.github.io/NeteaseCloudMusicApi/#/?id=%e5%8f%af%e4%bb%a5%e5%9c%a8nodejs%e8%b0%83%e7%94%a8
    const playlistRes = await personalized({
        cookie: null
    });
    // console.log(playlistRes);
    const playlistFromResult = playlistRes.body.result || [];

    const playlist = removeRepeatAndMergeArr(playlistFromDatabase, playlistFromResult);

    await insertPlaylist(playlist);

};
