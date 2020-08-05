// pages/profile-blog-history/profile-blog-history.js
const MAX_LIMIT = 10;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        blogList: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this._getListByCloudFn();
    },

    _getListByCloudFn() {
        const {blogList} = this.data;
        wx.showLoading({
            title: '加载中',
        });
        wx.cloud.callFunction({
            name: 'blog',
            data: {
                $url: 'getListByOpenid',
                start: blogList.length,
                count: MAX_LIMIT
            }
        }).then((res) => {
            this.setData({
                blogList: blogList.concat(res.result)
            });
            wx.hideLoading();
        })
    },

    goToComment(event) {
        wx.navigateTo({
            url: `../blog-comment/blog-comment?blogId=${event.target.dataset.blogid}`,
        })
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        this._getListByCloudFn();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (event) {
        const blog = event.target.dataset.blog;
        return {
            title: blog.content,
            path: `/pages/blog-comment/blog-comment?blogId=${blog._id}`
        }
    }
});
