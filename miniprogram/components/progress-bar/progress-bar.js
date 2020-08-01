// components/progress-bar/progress-bar.js
const bgAudioManager = wx.getBackgroundAudioManager();

Component({

    options: {
        // 指定所有 _ 开头的数据字段为纯数据字段
        pureDataPattern: /^_/
    },

    /**
     * 组件的属性列表
     */
    properties: {
        isSame: Boolean
    },

    /**
     * 组件的初始数据
     */
    data: {
        showTime: {
            currentTime: '00:00',
            totalTime: '00:00',
        },
        // 滑块移动距离
        movableDis: 0,
        // 当前进度（0-100）
        progress: 0,
        // 可移动区域宽度
        _movableAreaWidth: 0,
        // 可移动的视图容器宽度
        _movableViewWidth: 0,
        // 当前的秒数
        _currentSec: -1,
        // 当前歌曲的总时长，以秒为单位
        _curMusicDuration: 0,
        // 表示当前进度条是否在拖拽
        // 用来解决：当进度条拖动时候和 updateTime 事件有冲突的问题
        _isMoving: false,
    },

    lifetimes: {
        ready() {
            if (this.properties.isSame && this.data.showTime.totalTime === '00:00') {
                this._setTime();
            }
            this._getMovableDis();
            this._bindBGMEvent();
        },
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 滑块位置改变事件
         * @param event
         */
        onChange(event) {
            // 拖动
            if (event.detail.source === 'touch') {
                const {_movableAreaWidth, _movableViewWidth,} = this.data;
                // 这里不能用 setData 去触发更新，会消耗性能
                this.data.progress = event.detail.x / (_movableAreaWidth - _movableViewWidth) * 100;
                this.data.movableDis = event.detail.x;

                // isMoving = true;
                this.setData({
                    _isMoving: true
                })
            }
        },
        /**
         * 滑块停止拖拽事件
         */
        onTouchEnd() {
            const {_curMusicDuration, progress, movableDis} = this.data;
            const currentTimeFmt = this._dateFormat(Math.floor(bgAudioManager.currentTime));

            this.setData({
                progress,
                movableDis,
                _isMoving: false,
                ['showTime.currentTime']: currentTimeFmt.min + ':' + currentTimeFmt.sec,
            });

            bgAudioManager.seek(_curMusicDuration * progress / 100);
            // isMoving = false;
        },

        /**
         * 获取可滑动区域的宽度
         * @private
         */
        _getMovableDis() {
            //  wx.createSelectorQuery() 返回一个 SelectorQuery 对象，该对象可以查询节点信息，类似于原生的 document.querySelector
            // 在自定义组件或包含自定义组件的页面中，应使用 this.createSelectorQuery() 来代替
            const query = this.createSelectorQuery();
            // 发出一个查询节点信息的“请求”
            query.select('.movable-area').boundingClientRect();
            query.select('.movable-view').boundingClientRect();
            // 执行所有的“查询请求”，请求结果按请求次序构成数组，在 callback 的第一个参数中返回
            query.exec((rect) => {
                this.setData({
                    _movableAreaWidth: rect[0].width,
                    _movableViewWidth: rect[1].width
                });
                // movableAreaWidth = rect[0].width;
                // movableViewWidth = rect[1].width;
            })

        },

        /**
         * 绑定音频事件
         * @private
         */
        _bindBGMEvent() {
            // 播放事件
            bgAudioManager.onPlay(() => {
                // console.log('onPlay');
                // isMoving = false;
                this.setData({
                    _isMoving: false
                });
                // 父组件传递给子组件的事件处理函数，子组件需要通过以下方式触发
                this.triggerEvent('musicPlay');
            });

            // 停止事件
            bgAudioManager.onStop(() => {
                // console.log('onStop');
            });

            // 暂停事件
            bgAudioManager.onPause(() => {
                // console.log('Pause');
                this.triggerEvent('musicPause');
            });

            // 音频加载中事件
            bgAudioManager.onWaiting(() => {
                // console.log('onWaiting');
            });

            // 音频可以播放事件
            bgAudioManager.onCanplay(() => {
                // console.log('onCanplay');
                // console.log('duration',bgAudioManager.duration);
                // 有概率出现获取到的值是 undefined 的情况
                // 如果出现 undefined ，则过 1s 后再次获取
                // if (typeof bgAudioManager.duration != 'undefined')
                if (bgAudioManager.duration === undefined) {
                    setTimeout(() => {
                        this._setTime();
                    }, 1000);
                } else {
                    this._setTime();
                }
            });

            // 监听音频播放进度（小程序切换到后台时，不会触发）
            bgAudioManager.onTimeUpdate(() => {
                // console.log('onTimeUpdate')
                const {_movableAreaWidth, _movableViewWidth, _currentSec, _isMoving} = this.data;

                // 拖拽的过程中不需要实时设置新的状态
                if (_isMoving) {
                    return;
                }

                const currentTime = bgAudioManager.currentTime;
                const duration = bgAudioManager.duration;
                // 因为 onTimeUpdate 事件触发频繁，在 1s 可能会触发很多次（比如：10.1s、10.3s、10.7s、10.9s 会触发当前事件）
                // 为了提高性能优化，所以这里控制在 1s 触发一次（通过只比较当前秒数的整数）
                const sec = currentTime.toString().split('.')[0];
                if (sec === _currentSec) {
                    return;
                }
                // console.log(currentTime)
                const currentTimeFmt = this._dateFormat(currentTime);

                this.setData({
                    movableDis: (_movableAreaWidth - _movableViewWidth) * currentTime / duration,
                    progress: currentTime / duration * 100,
                    ['showTime.currentTime']: `${currentTimeFmt.min}:${currentTimeFmt.sec}`,
                    _currentSec: sec
                });
                // currentSec = sec;
                // 联动歌词
                this.triggerEvent('timeUpdate', {
                    currentTime
                });
            });

            // 播放结束事件
            bgAudioManager.onEnded(() => {
                // console.log("onEnded");
                this.triggerEvent('musicEnd');
            });

            // 播放错误
            bgAudioManager.onError((res) => {
                // console.error(res.errMsg);
                // console.error(res.errCode);
                wx.showToast({
                    title: '错误:' + res.errCode,
                });
            })
        },
        /**
         * 设置时间
         * @private
         */
        _setTime() {
            const curMusicDuration = bgAudioManager.duration;
            const durationFmt = this._dateFormat(curMusicDuration);
            this.setData({
                ['showTime.totalTime']: `${durationFmt.min}:${durationFmt.sec}`,
                _curMusicDuration: curMusicDuration
            })
        },
        /**
         * 格式化时间
         * @param sec
         * @returns {{sec: (*|string), min: (*|string)}}
         * @private
         */
        _dateFormat(sec) {
            const min = Math.floor(sec / 60);
            sec = Math.floor(sec % 60);
            return {
                'min': this._parse0(min),
                'sec': this._parse0(sec),
            }
        },
        /**
         * 补零
         * @param sec
         * @returns {string}
         * @private
         */
        _parse0(sec) {
            return sec < 10 ? '0' + sec : sec
        }
    }
});


