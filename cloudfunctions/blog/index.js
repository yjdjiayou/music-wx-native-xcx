// 云函数入口文件
const cloud = require('wx-server-sdk');
const getDataByPagingQuery = require('../utils/paging-query');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

const TcbRouter = require('tcb-router');

const db = cloud.database();

const blogCollection = db.collection('blog');
const blogCommentCollection = db.collection('blog-comment');

const MAX_LIMIT = 100;

// 云函数入口函数
exports.main = async (event, context) => {
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
            commentList:commentListFromDatabase,
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


    const wxContext = cloud.getWXContext();
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
