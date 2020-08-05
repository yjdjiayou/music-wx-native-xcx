/**
 * 生成小程序码
 */

// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    const result = await cloud.openapi.wxacode.getUnlimited({
        scene: wxContext.OPENID,
    });
    const upload = await cloud.uploadFile({
        cloudPath: 'qrcode/' + Date.now() + '-' + Math.random() + '.png',
        fileContent: result.buffer
    });
    return upload.fileID

};
