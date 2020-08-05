// 云函数入口文件
const cloud = require('wx-server-sdk');
const {banner} = require('NeteaseCloudMusicApi');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库的引用
const db = cloud.database();
// 获取 banner 列表集合的引用
const bannerCollection = db.collection('banner');
// 最大查询数
const MAX_LIMIT = 6;

/**
 * 插入banner列表数据
 * @param bannerList
 */
async function insertBannerList(bannerList) {
    for (let it of bannerList) {
        await bannerCollection.add({
            data: {
                ...it,
                createTime: db.serverDate()
            }
        });
    }
}

/**
 * 数组去重&合并
 * @param oldList
 * @param newList
 * @returns {Array}
 */
//TODO:研究下数据库中有没有更好的去重方法
function removeRepeatAndMergeArr(oldList, newList) {
    const newData = [];
    for (let i = 0, len1 = newList.length; i < len1; i++) {
        let flag = true;
        for (let j = 0, len2 = oldList.length; j < len2; j++) {
            if (newList[i].id === oldList[j].id) {
                flag = false;
                break
            }
        }
        if (flag) {
            newData.push(newList[i])
        }
    }
    return newData;
}

/**
 * 获取数据库中的banner列表数据
 * @returns {Promise<void>}
 */
async function getBannerListFromDatabase() {
    // 获取当前集合中的总数
    const countResult = await bannerCollection.count();
    const total = countResult.total;
    const batchTimes = Math.ceil(total / MAX_LIMIT);

    // 分成多次查询
    const tasks = [];
    for (let i = 0; i < batchTimes; i++) {
        let promise = bannerCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
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

    let bannerListFromDatabase = await getBannerListFromDatabase();

    const bannerListRes = await banner({
        cookie: null
    });
    // console.log(bannerListRes);
    const bannerListFromResult = bannerListRes.body.banners || [];

    const bannerList = removeRepeatAndMergeArr(bannerListFromDatabase, bannerListFromResult);

    await insertBannerList(bannerList);
};
