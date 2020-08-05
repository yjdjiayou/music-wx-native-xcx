/**
 * @author：yjd
 * @description：分页查询获取数据库中某个集合所有的数据
 * 云函数中好像不能建立公共资源目录，最终上传后都会报错
 * 云函数中好像不能建立公共资源目录，最终上传后都会报错
 * 云函数中好像不能建立公共资源目录，最终上传后都会报错
 * @date：2020/8/4
 */

module.exports = async function getDataByPagingQuery(collection, maxLimit = 1000) {
    // 默认情况下，获取到的数据是有限制的
    // 从云函数获取数据，只能获取到 1000 条数据
    // 从小程序端获取数据，只能获取到 20 条数据
    // const data = await playlistCollection.get();

    // 分页查询就能解决以上问题
    // 获取当前集合中的总数
    const countResult = await collection.count();
    const total = countResult.total;
    const batchTimes = Math.ceil(total / maxLimit);

    // 分成多次查询
    const tasks = [];
    for (let i = 0; i < batchTimes; i++) {
        let promise = collection.skip(i * maxLimit).limit(maxLimit).get();
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
};
