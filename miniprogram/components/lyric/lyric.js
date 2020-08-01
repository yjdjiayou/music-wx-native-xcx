// components/lyric/lyric.js
Component({

    options: {
        // 指定所有 _ 开头的数据字段为纯数据字段
        pureDataPattern: /^_/
    },

    /**
     * 组件的属性列表
     */
    properties: {
        isLyricShow: {
            type: Boolean,
            value: false,
        },
        lyric: String,
    },

    /**
     * 组件的初始数据
     */
    data: {
        // 格式化后的歌词列表
        lrcList: [],
        // 当前选中的歌词的索引
        nowLyricIndex: 0,
        // 滚动条滚动的高度
        scrollTop: 0,
        // 歌词的高度
        _lyricHeight: 0
    },

    observers: {
        lyric(lrc) {
            if (lrc === '暂无歌词') {
                this.setData({
                    lrcList: [{
                        lrc,
                        time: 0,
                    }],
                    nowLyricIndex: -1
                })
            } else {
                const lrcList = this._parseLyric(lrc);
                this.setData({
                    lrcList
                })
            }
        },
    },

    lifetimes: {
        ready() {
            wx.getSystemInfo().then(res => {
                // 这里的 64 是默认高度，可以随便取值
                // 750 是设计稿的尺寸
                this.setData({
                    _lyricHeight: res.screenWidth / 750 * 64
                });
            });
        },
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 实时更新当前歌词列表（随着音乐播放进度的改变，需要同步对应进度的歌词）
         * @param currentTime
         */
        update(currentTime) {
            // console.log(currentTime)
            const {lrcList, nowLyricIndex, _lyricHeight} = this.data;
            if (lrcList.length === 0) {
                return
            }
            // 这里的条件语句是为了避免出现这种情况：
            // 有的歌曲最后的一段时间是没有歌词的，
            // 如果当前播放的时间大于最后一句歌词的时间，那么歌词就不会向上滚动
            if (currentTime > lrcList[lrcList.length - 1].time) {
                if (nowLyricIndex !== -1) {
                    this.setData({
                        nowLyricIndex: -1,
                        scrollTop: lrcList.length * _lyricHeight
                    });
                }
            }
            for (let i = 0, len = lrcList.length; i < len; i++) {
                if (currentTime <= lrcList[i].time) {
                    this.setData({
                        nowLyricIndex: i - 1,
                        scrollTop: (i - 1) * _lyricHeight
                    });
                    break
                }
            }
        },
        /**
         * 解析并格式化歌词字符串
         * @param lyricStr
         * @private
         */
        _parseLyric(lyricStr) {
            let line = lyricStr.split('\n');
            let lrcList = [];
            line.forEach((elem) => {
                let time = elem.match(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g);
                if (time != null) {
                    let lrc = elem.split(time)[1];
                    let timeReg = time[0].match(/(\d{2,}):(\d{2})(?:\.(\d{2,3}))?/);
                    // 把时间转换为秒
                    let time2Seconds = parseInt(timeReg[1]) * 60 + parseInt(timeReg[2]) + parseInt(timeReg[3]) / 1000;
                    lrcList.push({
                        lrc,
                        time: time2Seconds,
                    })
                }
            });
            return lrcList;
        }
    }
});
