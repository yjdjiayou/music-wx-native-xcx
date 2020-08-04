// components/blog-ctrl/blog-ctrl.js
const subscribeMsgTemplate = require('../../config/subscribe-message-template.js');
Component({

    options: {
        // 指定所有 _ 开头的数据字段为纯数据字段
        pureDataPattern: /^_/
    },

    /**
     * 组件的属性列表
     */
    properties: {
        blogId: String,
        blog: Object,
    },
    externalClasses: ['iconfont', 'icon-pinglun', 'icon-fenxiang'],

    /**
     * 组件的初始数据
     */
    data: {
        // 登录组件可见性
        loginShow: false,
        // 底部弹出层可见性
        modalShow: false,
        content: '',
        _userInfo: {}
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 评论事件
         */
        async onComment() {
            // 判断用户是否授权
            const settings = await wx.getSetting();
            if (!settings.authSetting['scope.userInfo']) {
                // 如果没有授权就显示授权弹窗
                this.setData({
                    loginShow: true,
                });
                return;
            }
            const userInfoRes = await wx.getUserInfo();
            // 显示评论弹出层
            this.setData({
                modalShow: true,
                _userInfo: userInfoRes.userInfo
            })
        },
        onLoginSuccess(event) {
            // 授权框消失，评论框显示
            this.setData({
                loginShow: false,
                _userInfo: event.detail
            }, () => {
                this.setData({
                    modalShow: true,
                })
            })
        },
        onLoginFail() {
            wx.showModal({
                title: '授权用户才能进行评价',
                content: '',
            })
        },
        /**
         * 发送事件
         * @param event
         */
        async onSend(event) {
            const {_userInfo} = this.data;
            const {blogId} = this.properties;
            let content = event.detail.value.content;

            if (content.trim() === '') {
                wx.showModal({
                    title: '评论内容不能为空',
                    content: '',
                });
                return;
            }

            // 调起客户端小程序订阅消息界面（默认情况下，每次调用都会调起订阅消息界面）
            // 当用户勾选了订阅面板中的“总是保持以上选择，不再询问”时，不再调起订阅消息界面
            await wx.requestSubscribeMessage({
                tmplIds: [subscribeMsgTemplate.commentCompleteTemplateID]
            });

            wx.showLoading({
                title: '评论中',
                mask: true,
            });
            await wx.cloud.callFunction({
                name: 'blog',
                data: {
                    content,
                    blogId,
                    nickName: _userInfo.nickName,
                    avatarUrl: _userInfo.avatarUrl,
                    $url: 'addComment'
                }
            });
            wx.hideLoading();
            wx.showToast({
                title: '评论成功',
            });

            // 推送模板消息（只有真机调试或者云函数调试才能起作用，开发者工具不支持，会报错）
            wx.cloud.callFunction({
                name: 'sendMessage',
                data: {
                    content,
                    blogId
                }
            });

            this.setData({
                modalShow: false,
                content: '',
            });
            // 刷新评论页面
            this.triggerEvent('refreshCommentList');
        },

    }
});

