// miniprogram/pages/music-list.js
Page({
    /**
     * 页面的初始数据
     */
    data: {
        musicList: [],
        listInfo: {},
    },

    /**
     * 将获取到的音乐列表存到本地
     * @private
     */
    _setMusicList() {
        wx.setStorageSync('musicList', this.data.musicList)
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // console.log(options.playlistId);
        wx.showLoading({
            title: '加载中',
        });
        wx.cloud.callFunction({
            name: 'music',
            data:{
                playlistId:options.playlistId,
                $url:'musicList'
            }
        }).then(res=>{
            // console.log(res);
            const playlist = res.result.playlist;
            this.setData({
                musicList: playlist.tracks,
                listInfo: {
                    coverImgUrl: playlist.coverImgUrl,
                    name: playlist.name,
                }
            });
            this._setMusicList();
            wx.hideLoading();
        });

    },
});
