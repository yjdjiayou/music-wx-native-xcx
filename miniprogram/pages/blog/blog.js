// pages/blog/blog.js
Page({

    options: {
        // 指定所有 _ 开头的数据字段为纯数据字段
        pureDataPattern: /^_/
    },

    /**
     * 页面的初始数据
     */
    data: {
        // 控制底部弹出层是否显示
        modalShow: false,
        blogList: [],
        // 搜索关键字
        _keyword: ''
    },

    /**
     * 发布功能
     */
    async onPublish() {
        // 判断用户是否授权
        const settingRes = await wx.getSetting();
        if (settingRes.authSetting['scope.userInfo']) {
            const userInfoRes = await wx.getUserInfo();
            this.onLoginSuccess({
                detail: userInfoRes.userInfo
            })
        } else {
            this.setData({
                modalShow: true,
            })
        }
    },
    onLoginSuccess(event) {
        const detail = event.detail;
        wx.navigateTo({
            url: `../blog-edit/blog-edit?nickName=${detail.nickName}&avatarUrl=${detail.avatarUrl}`,
        })
    },
    onLoginFail() {
        wx.showModal({
            title: '授权用户才能发布',
            content: '',
        })
    },

    /**
     * 加载博客列表
     * @param start
     * @private
     */
    _loadBlogList(start = 0) {
        const {_keyword, blogList} = this.data;
        wx.showLoading({
            title: '拼命加载中',
        });
        wx.cloud.callFunction({
            name: 'blog',
            data: {
                start,
                count: 10,
                $url: 'list',
                keyword: _keyword,
            }
        }).then((res) => {
            this.setData({
                blogList: blogList.concat(res.result)
            });
            wx.hideLoading();
            wx.stopPullDownRefresh();
        })
    },

    /**
     * 搜索博客
     * @param event
     */
    onSearch(event) {
        // console.log(event.detail.keyword)
        this.setData({
            blogList: [],
            _keyword: event.detail.keyword
        });
        this._loadBlogList(0);
    },

    /**
     * 跳转到评论页面
     * @param event
     */
    goToComment(event) {
        wx.navigateTo({
            url: '../../pages/blog-comment/blog-comment?blogId=' + event.target.dataset.blogid,
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this._loadBlogList();
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        this.setData({
            blogList: []
        });
        this._loadBlogList(0);
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        this._loadBlogList(this.data.blogList.length);
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function(event) {
        let blogObj = event.target.dataset.blog;
        return {
            title: blogObj.content,
            path: `/pages/blog-comment/blog-comment?blogId=${blogObj._id}`,
        }
    }

});
