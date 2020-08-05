// pages/playlist/playlist.js
const MAX_LIMIT = 15;
const db = wx.cloud.database();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        swiperImgUrls: [
            // {
            //     imageUrl: 'http://p1.music.126.net/oeH9rlBAj3UNkhOmfog8Hw==/109951164169407335.jpg',
            // },
            // {
            //     imageUrl: 'http://p1.music.126.net/xhWAaHI-SIYP8ZMzL9NOqg==/109951164167032995.jpg',
            // },
            // {
            //     imageUrl: 'http://p1.music.126.net/Yo-FjrJTQ9clkDkuUCTtUg==/109951164169441928.jpg',
            // }
        ],
        playlist: [],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this._getPlaylist();
        this._getSwiper()
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.setData({
            playlist: []
        });
        this._getPlaylist();
        this._getSwiper();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        this._getPlaylist()
    },

    /**
     * 获取播放列表数据
     * @private
     */
    _getPlaylist() {
        wx.showLoading({
            title: '加载中',
        });
        wx.cloud.callFunction({
            name: 'music',
            data: {
                start: this.data.playlist.length,
                count: MAX_LIMIT,
                $url: 'playlist',
            }
        }).then((res) => {
            // console.log(res);
            this.setData({
                playlist: this.data.playlist.concat(res.result.data || [])
            });
            wx.stopPullDownRefresh();
            wx.hideLoading();
        })
    },

    /**
     * 获取 banner 图
     * @private
     */
    _getSwiper() {
        // 理论上，这里的数据库查询操作应该放在云函数中，小程序端只需要调用云函数就行，可以降低耦合性
        // 这里展示小程序端也可以直调云数据库 API
        db.collection('banner')
            .get().then((res) => {
            // 如果云数据库中数据存在，但是这里查询不到数据
            // 有可能是 banner 集合的权限为“仅创建者可读写”，需要更改下权限
            this.setData({
                swiperImgUrls: res.data
            })
        })
    },

});
