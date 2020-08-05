// pages/profile/profile.js
Page({

    /**
     * 页面的初始数据
     */
    data: {},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },

    onTapQrCode() {
        wx.showLoading({
            title: '生成中',
        });
        wx.cloud.callFunction({
            name: 'getQrCode'
        }).then((res) => {
            const fileId = res.result;
            wx.previewImage({
                urls: [fileId],
                current: fileId
            });
            wx.hideLoading();
        })
    },
});
