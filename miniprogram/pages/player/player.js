/**
 * 对于不需要在页面中渲染的数据，可以不放在 data 里，从而提高渲染效率
 */
let musicList = [];
// 正在播放歌曲的index
let nowPlayingIndex = 0;
// 获取全局唯一的背景音频管理器
const bgAudioManager = wx.getBackgroundAudioManager();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        picUrl: '',
        // false 表示不播放，true 表示正在播放
        isPlaying: false,
        // 表示当前歌词是否显示
        isLyricShow: false,
        lyric: '',
        // 表示是否为同一首歌
        isSame: false,
    },

    /**
     * 加载音乐
     * @private
     */
    _loadMusicDetail(musicId) {
        let music = musicList[nowPlayingIndex];
        console.log(music);
        // 将当前音乐的名称设置为导航栏标题
        wx.setNavigationBarTitle({
            title: music.name,
        });

        this.setData({
            picUrl: music.al.picUrl,
            isPlaying: false,
        });

        wx.showLoading({
            title: '歌曲加载中',
        });
        wx.cloud.callFunction({
            name: 'music',
            data: {
                musicId,
                $url: 'musicUrl',
            }
        }).then((res) => {
            console.log(res);
            const result = res.result;

            bgAudioManager.src = result.data[0].url;
            bgAudioManager.title = music.name;
            bgAudioManager.coverImgUrl = music.al.picUrl;
            bgAudioManager.singer = music.ar[0].name;
            bgAudioManager.epname = music.al.name;


            this.setData({
                isPlaying: true
            });
            wx.hideLoading();

        });

    },

    /**
     * 播放/暂停切换
     */
    togglePlaying() {
        // 正在播放
        if (this.data.isPlaying) {
            bgAudioManager.pause();
        } else {
            bgAudioManager.play();
        }
        this.setData({
            isPlaying: !this.data.isPlaying
        });
    },

    /**
     * 播放上一首歌曲
     */
    onPrev() {
        nowPlayingIndex--;
        if (nowPlayingIndex < 0) {
            nowPlayingIndex = musicList.length - 1
        }
        this._loadMusicDetail(musicList[nowPlayingIndex].id)
    },

    /**
     * 播放下一首歌曲
     */
    onNext() {
        nowPlayingIndex++;
        if (nowPlayingIndex === musicList.length) {
            nowPlayingIndex = 0
        }
        this._loadMusicDetail(musicList[nowPlayingIndex].id)
    },


    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log('options', options);
        nowPlayingIndex = options.index;
        musicList = wx.getStorageSync('musicList');
        this._loadMusicDetail(options.musicId);
    },

});
