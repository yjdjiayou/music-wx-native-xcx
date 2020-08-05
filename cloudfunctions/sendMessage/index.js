/**
 * 模板消息推送云函数
 */

// 云函数入口文件
const cloud = require('wx-server-sdk');
// 注意：在云函数中不能去引用 cloudfunctions 目录外的文件
// const subscribeMsgTemplate = require('../../miniprogram/config/subscribe-message-template.js');


cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
    const {
        OPENID
    } = cloud.getWXContext();

    const result = await cloud.openapi.subscribeMessage.send({
        // 接收者（用户）的 openid
        touser: OPENID,
        // 消息模板内容
        // https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/subscribe-message/subscribeMessage.send.html
        // 这里的 key 值需要和你选择的消息模板里的 key 值一样
        // 并且 value 的类型也需要遵循对应的规则
        data: {
            thing1: {
                value: '评价完成'
            },
            thing2: {
                value: event.content
            }
        },
        // 消息模板ID
        templateId: 'QFQ7EQjGAO_AEUH_GSN9jkqLAfx7AYpuvNRJRLU-iqM',
        // 点击消息模板卡片后的跳转页面
        page: `/pages/blog-comment/blog-comment?blogId=${event.blogId}`,
        // 用户点击消息跳转小程序类型：
        // developer 为开发版；
        // trial 为体验版；
        // formal 为正式版；
        // 默认为正式版
        // miniprogramState: 'developer',
    });
    return result;
};



