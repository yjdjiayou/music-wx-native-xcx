/**
 * 对于不需要在页面中渲染的数据，可以不放在 data 里，从而提高渲染效率
 */
let musicList = [];
// 正在播放歌曲的index
let nowPlayingIndex = 0;
// 获取全局唯一的背景音频管理器
const bgAudioManager = wx.getBackgroundAudioManager();
const app = getApp();

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
        // 歌词
        lyric: '',
        // 表示是否为同一首歌
        isSame: false,
    },

    /**
     * 加载音乐
     * @private
     */
    async _loadMusicDetail(musicId) {
        // 检验当前要播放音乐的 id 和正在播放中的音乐 id 是否一致
        // 一致说明是同一首歌
        const isSame = (+musicId) === (+app.getPlayingMusicId());
        const music = musicList[nowPlayingIndex];

        // 不管是否需要播放音乐，播放音乐前都需要处理的逻辑
        // 1、如果不是同一首歌，就先暂停当前播放中的音频播放
        if (!isSame) {
            bgAudioManager.stop();
        }
        // 2、将当前音乐的名称设置为导航栏标题
        wx.setNavigationBarTitle({
            title: music.name,
        });
        // 3、初始化—重置数据
        this.setData({
            isSame,
            isPlaying: false,
            picUrl: music.al.picUrl,
        });

        if(!isSame){
            const musicPlayUrl = await this._getMusicPlayUrl(musicId);
            // console.log('musicPlayUrl',musicPlayUrl);
            if (!musicPlayUrl) {
                wx.showToast({
                    title: '无权限播放',
                });
                return;
            }
            // 播放音乐
            this._setBGMDetail(music, musicPlayUrl);
            // 将当前将要播放的音乐 id 存到全局中
            app.setPlayingMusicId(musicId);
        }

        this.setData({
            isPlaying: true
        });

        // 保存播放历史
        this.savePlayHistory();
        // 加载歌词（因为歌词并不需要立马就加载出来，所以可以不用 loading 效果）
        this._loadLyric(musicId);
    },

    /**
     * 设置音频播放信息
     * @param musicData
     * @param musicPlayUrl
     * @private
     */
    _setBGMDetail(musicData, musicPlayUrl) {
        bgAudioManager.src = musicPlayUrl;
        bgAudioManager.title = musicData.name;
        bgAudioManager.coverImgUrl = musicData.al.picUrl;
        bgAudioManager.singer = musicData.ar[0].name;
        bgAudioManager.epname = musicData.al.name;
    },

    /**
     * 加载歌词
     * @param musicId
     * @private
     */
    async _loadLyric(musicId) {
        const lyricResult = await wx.cloud.callFunction({
            name: 'music',
            data: {
                musicId,
                $url: 'lyric',
            }
        });
        // console.log('lyricResult', lyricResult);
        const lrc = lyricResult.result.lrc;
        const lyric = lrc ? lrc.lyric : '暂无歌词';
        this.setData({
            lyric
        });
    },

    /**
     * 获取音乐播放地址
     */
    async _getMusicPlayUrl(musicId) {
        wx.showLoading({
            title: '歌曲加载中',
        });
        const musicResult = await wx.cloud.callFunction({
            name: 'music',
            data: {
                musicId,
                $url: 'musicUrl',
            }
        });
        wx.hideLoading();
        return musicResult.result.data[0].url;
    },

    /**
     * 保存播放历史
     */
    savePlayHistory() {
        //  当前正在播放的歌曲
        const music = musicList[nowPlayingIndex];
        const openid = app.globalData.openid;
        const history = wx.getStorageSync(openid);
        let bHave = false;
        for (let i = 0, len = history.length; i < len; i++) {
            if (history[i].id === music.id) {
                bHave = true;
                break
            }
        }
        if (!bHave) {
            history.unshift(music);
            wx.setStorage({
                key: openid,
                data: history,
            });
        }
    },

    /**
     * 播放/暂停切换
     */
    onTogglePlaying() {
        const {isPlaying} = this.data;
        // 正在播放
        if (isPlaying) {
            bgAudioManager.pause();
        } else {
            bgAudioManager.play();
        }
        this.setData({
            isPlaying: !isPlaying
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
     * 控制歌词的显示/隐藏
     */
    onChangeLyricShow() {
        this.setData({
            isLyricShow: !this.data.isLyricShow
        })
    },

    /**
     * 监听播放进度改变事件
     * @param event
     */
    onTimeUpdate(event) {
        this.selectComponent('.lyric').update(event.detail.currentTime)
    },

    onPlay() {
        this.setData({
            isPlaying: true,
        })
    },
    onPause() {
        this.setData({
            isPlaying: false,
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // console.log('options', options);
        nowPlayingIndex = options.index;
        musicList = wx.getStorageSync('musicList');
        this._loadMusicDetail(options.musicId);
    },

});
