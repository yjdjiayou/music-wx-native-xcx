// pages/profile-play-history/profile-play-history.js
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        musicList: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

        const playHistory = wx.getStorageSync(app.globalData.openid);
        if (playHistory.length === 0) {
            wx.showModal({
                title: '播放历史为空',
                content: '',
            })
        } else {
            // 将 storage 里面存储的 musicList 替换成播放历史的歌单
            wx.setStorage({
                key: 'musicList',
                data: playHistory,
            });
            this.setData({
                musicList: playHistory
            })
        }
    },
});
