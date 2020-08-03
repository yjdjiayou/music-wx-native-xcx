// 输入文字最大的个数
const MAX_WORDS_NUM = 160;
// 最大上传图片数量
const MAX_IMG_NUM = 9;

const db = wx.cloud.database();

Page({

    options: {
        // 指定所有 _ 开头的数据字段为纯数据字段
        pureDataPattern: /^_/
    },

    /**
     * 页面的初始数据
     */
    data: {
        // 输入的文字个数
        wordsNum: 0,
        // 底部元素（绝对定位元素）相对底部的距离
        footerBottom: 0,
        // 已选择的图片列表
        selectedImageList: [],
        // 添加图片按钮可见性
        selectPhotoVisible: true,
        // 输入的文字内容
        _content: "",
        // 当前用户信息
        _userInfo: {},
    },

    /**
     * 输入框输入事件
     * @param event
     */
    onInput(event) {
        let wordsNum = event.detail.value.length;
        if (wordsNum >= MAX_WORDS_NUM) {
            wordsNum = `最大字数为${MAX_WORDS_NUM}`
        }
        this.setData({
            wordsNum,
            _content: event.detail.value
        });
    },
    /**
     * 输入框获取焦点事件
     * @param event
     */
    onFocus(event) {
        // 模拟器获取的键盘高度为 0，需要真机测试
        this.setData({
            footerBottom: event.detail.height,
        })
    },
    /**
     * 输入框失去焦点事件
     */
    onBlur() {
        this.setData({
            footerBottom: 0,
        })
    },

    /**
     * 选择图片事件
     */
    onChooseImage() {
        const {selectedImageList} = this.data;
        // 还能再选几张图片
        let max = MAX_IMG_NUM - selectedImageList.length;
        wx.chooseImage({
            count: max,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const newSelectedImageList = selectedImageList.concat(res.tempFilePaths);
                // 还能再选几张图片
                max = MAX_IMG_NUM - newSelectedImageList.length;
                this.setData({
                    selectPhotoVisible: !(max <= 0),
                    selectedImageList: newSelectedImageList
                });
            },
        })
    },
    /**
     * 删除图片
     * @param event
     */
    onDelImage(event) {
        const {selectedImageList} = this.data;
        selectedImageList.splice(event.target.dataset.index, 1);
        this.setData({
            selectedImageList
        });
        if (selectedImageList.length === MAX_IMG_NUM - 1) {
            this.setData({
                selectPhotoVisible: true,
            })
        }
    },
    /**
     * 预览图片
     * @param event
     */
    onPreviewImage(event) {
        const {selectedImageList} = this.data;
        wx.previewImage({
            urls: selectedImageList,
            current: event.target.dataset.imgsrc,
        })
    },

    /**
     * 发布
     */
     onPublish() {
        const {_content} = this.data;
        if (_content.trim() === '') {
            wx.showModal({
                title: '请输入内容',
                content: '',
            });
            return;
        }

        wx.showLoading({
            title: '发布中',
            mask: true,
        });

        const promiseArr = this.getUploadQueue();
        // 云存储的 API 只支持单文件上传，所以需要循环调用
        Promise.all(promiseArr).then( async(fileIds) => {
            // console.log('fileIds', fileIds);
            // 存入到云数据库
            await this.saveToDatabase(fileIds);

            wx.showToast({
                title: '发布成功',
            });

            // 返回blog页面，并且刷新
            wx.navigateBack();
            const pages = getCurrentPages();
            // 取到上一个页面
            const prevPage = pages[pages.length - 2];
            prevPage.onPullDownRefresh();

        }).catch((err) => {
            wx.showToast({
                title: '发布失败',
            })
        }).finally(res => {
            wx.hideLoading();
        });
    },

    /**
     * 获取上传图片的队列
     * @returns {Array}
     */
    getUploadQueue() {
        const {selectedImageList} = this.data;
        let promiseArr = [];
        for (let i = 0, len = selectedImageList.length; i < len; i++) {
            let p = new Promise((resolve, reject) => {
                let item = selectedImageList[i];
                // 文件扩展名
                let suffix = /\.\w+$/.exec(item)[0];
                // 新的文件名
                const cloudPath = 'blog/' + Date.now() + '-' + Math.random() * 1000000 + suffix;
                // 注意：这里调用的是 wx.cloud.uploadFile，不是 wx.uploadFile
                // 将本地资源上传至云存储空间，如果上传至同一路径则是覆盖写
                wx.cloud.uploadFile({
                    cloudPath,
                    filePath: item,
                    success: (res) => {
                        resolve(res.fileID);
                    },
                    fail: (err) => {
                        reject();
                    }
                })
            });
            promiseArr.push(p);
        }
        return promiseArr;
    },

    /**
     * 保存到数据库
     */
    saveToDatabase(fileIds) {
        const {_content, _userInfo} = this.data;
        // 这里只是展示了可以在小程序端调用数据库的 API
        // 理论上来说，应该把这部分逻辑放到 云函数中，小程序端只需要调用云函数，以此降低耦合性
        return db.collection('blog').add({
            data: {
                ..._userInfo,
                content: _content,
                // 因为本地文件是上传到了 云存储空间上，所以这里只需要保存文件的 id 就行
                // 保存到数据库的是文件 id
                img: fileIds,
                // 使用服务端的时间为准
                createTime: db.serverDate(),
            }
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({
            _userInfo: options
        })
    },
});
