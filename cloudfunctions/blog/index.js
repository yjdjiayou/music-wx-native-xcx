/**
 * 博客相关的云函数
 */
// 云函数入口文件
const cloud = require('wx-server-sdk');
// const path = require("path");
// 云函数中好像不能建立公共资源目录，最终上传后都会报错
// const getDataByPagingQuery = require( '../utils/paging-query.js');


cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// 一个用户只能在一个环境中创建 50 个云函数，如果小程序很复杂的话，云函数就不够用了
// 可以使用 云函数路由库 —— tcb-router
const TcbRouter = require('tcb-router');

const db = cloud.database();

const blogCollection = db.collection('blog');
const blogCommentCollection = db.collection('blog-comment');

const MAX_LIMIT = 1000;

async function getDataByPagingQuery(collection, maxLimit = 1000) {
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
}


// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    const app = new TcbRouter({
        event
    });

    /**
     * 查询获取博客列表
     */
    app.router('list', async (ctx, next) => {
        const keyword = event.keyword;
        let w = {};
        // 如果 keyword 有值，说明需要模糊搜索
        if (keyword.trim() !== '') {
            w = {
                content: new db.RegExp({
                    regexp: keyword,
                    options: 'i'
                })
            }
        }
        let result = await blogCollection
            .where(w)
            .skip(event.start)
            .limit(event.count)
            .orderBy('createTime', 'desc')
            .get();
        ctx.body = result.data;
    });

    /**
     * 查询博客详情
     */
    app.router('detail', async (ctx, next) => {
        // 因为博客详情数据和评论列表是分两个集合存储的，所以这里需要查询两次
        let blogId = event.blogId;
        // 获取博客详情数据
        let detail = await blogCollection.where({
            _id: blogId
        }).get().then((res) => {
            return res.data
        });

        // 获取评论列表
        let commentListFromDatabase = await getDataByPagingQuery(blogCommentCollection, MAX_LIMIT);

        ctx.body = {
            detail,
            commentList: commentListFromDatabase,
        }

    });

    /**
     * 添加评论
     */
    app.use('addComment', async (ctx, next) => {
        const {blogId, content, nickName, avatarUrl} = event;
        const result = await blogCommentCollection.add({
            data: {
                content,
                blogId,
                nickName,
                avatarUrl,
                createTime: db.serverDate(),
            }
        });
        ctx.body = result._id;
    });


    /**
     * 通过 OPENID 查询获取博客列表
     */
    app.router('getListByOpenid', async (ctx, next) => {
        ctx.body = await blogCollection.where({
            _openid: wxContext.OPENID
        })
            .skip(event.start)
            .limit(event.count)
            .orderBy('createTime', 'desc')
            .get()
            .then((res) => {
                return res.data
            })
    });


    return app.serve();
};
