// pages/blog/blog.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        // 控制底部弹出层是否显示
        modalShow: false,
        blogList: [],
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

});
