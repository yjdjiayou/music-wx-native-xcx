// pages/blog-comment/blog-comment.js
import formatTime from '../../utils/formatTime.js'

Page({

    /**
     * 页面的初始数据
     */
    data: {
        // 当前博客详情数据
        blog: {},
        // 当前博客下的评论列表
        commentList: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this._getBlogDetail(options.blogId);
    },

    /**
     * 获取当前博客详情数据
     * @param blogId
     * @private
     */
    async _getBlogDetail(blogId) {
        wx.showLoading({
            title: '加载中',
            mask: true,
        });

        const res = await  wx.cloud.callFunction({
            name: 'blog',
            data: {
                blogId,
                $url: 'detail',
            }
        });
        const result = res.result;

        let commentList = result.commentList.data;
        commentList.forEach((it,i)=>{
            // 格式化时间
            it.createTime = formatTime(new Date(it.createTime));
        });

        this.setData({
            commentList,
            blog: result.detail[0],
        });

        wx.hideLoading();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        const blog = this.data.blog;
        return {
            title: blog.content,
            path: `/pages/blog-comment/blog-comment?blogId=${blog._id}`,

        }
    }
});
