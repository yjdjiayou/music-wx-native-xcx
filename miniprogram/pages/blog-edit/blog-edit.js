// 输入文字最大的个数
const MAX_WORDS_NUM = 160;
// 最大上传图片数量
const MAX_IMG_NUM = 9;

const db = wx.cloud.database();
// 输入的文字内容
let content = '';
let userInfo = {};
Page({

    /**
     * 页面的初始数据
     */
    data: {
        // 输入的文字个数
        wordsNum: 0,
        footerBottom: 0,
        images: [],
        selectPhoto: true, // 添加图片元素是否显示
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        userInfo = options;
    },

    onInput(event) {
        let wordsNum = event.detail.value.length;
        if (wordsNum >= MAX_WORDS_NUM) {
            wordsNum = `最大字数为${MAX_WORDS_NUM}`
        }
        this.setData({
            wordsNum
        });
        content = event.detail.value
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

    onChooseImage() {
        // 还能再选几张图片
        let max = MAX_IMG_NUM - this.data.images.length;
        wx.chooseImage({
            count: max,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                console.log(res)
                this.setData({
                    images: this.data.images.concat(res.tempFilePaths)
                });
                // 还能再选几张图片
                max = MAX_IMG_NUM - this.data.images.length;
                this.setData({
                    selectPhoto: max <= 0 ? false : true
                });
            },
        })
    },
    onDelImage(event) {
        this.data.images.splice(event.target.dataset.index, 1);
        this.setData({
            images: this.data.images
        });
        if (this.data.images.length == MAX_IMG_NUM - 1) {
            this.setData({
                selectPhoto: true,
            })
        }
    },

    onPreviewImage(event) {
        // 6/9
        wx.previewImage({
            urls: this.data.images,
            current: event.target.dataset.imgsrc,
        })
    },

    send() {
        // 2、数据 -> 云数据库
        // 数据库：内容、图片fileID、openid、昵称、头像、时间
        // 1、图片 -> 云存储 fileID 云文件ID

        if (content.trim() === '') {
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

        let promiseArr = [];
        let fileIds = [];
        // 图片上传
        for (let i = 0, len = this.data.images.length; i < len; i++) {
            let p = new Promise((resolve, reject) => {
                let item = this.data.images[i]
                // 文件扩展名
                let suffix = /\.\w+$/.exec(item)[0]
                wx.cloud.uploadFile({
                    cloudPath: 'blog/' + Date.now() + '-' + Math.random() * 1000000 + suffix,
                    filePath: item,
                    success: (res) => {
                        console.log(res.fileID)
                        fileIds = fileIds.concat(res.fileID)
                        resolve()
                    },
                    fail: (err) => {
                        console.error(err)
                        reject()
                    }
                })
            })
            promiseArr.push(p)
        }
        // 存入到云数据库
        Promise.all(promiseArr).then((res) => {
            db.collection('blog').add({
                data: {
                    ...userInfo,
                    content,
                    img: fileIds,
                    createTime: db.serverDate(), // 服务端的时间
                }
            }).then((res) => {
                wx.hideLoading()
                wx.showToast({
                    title: '发布成功',
                })

                // 返回blog页面，并且刷新
                wx.navigateBack()
                const pages = getCurrentPages()
                // console.log(pages)
                // 取到上一个页面
                const prevPage = pages[pages.length - 2]
                prevPage.onPullDownRefresh()
            })
        }).catch((err) => {
            wx.hideLoading()
            wx.showToast({
                title: '发布失败',
            })
        })
    },

});
