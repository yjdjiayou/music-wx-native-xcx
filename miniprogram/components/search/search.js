// components/search/search.js
Component({

    options: {
        // 指定所有 _ 开头的数据字段为纯数据字段
        pureDataPattern: /^_/
    },

    /**
     * 组件的属性列表
     */
    properties: {
        placeholder: {
            type: String,
            value: '请输入关键字'
        }
    },
    /**
     * 外部传入的 class 选择器
     * 对于传入的 class 选择器，组件内部定义样式时，不能有同名选择器
     * 否则组件内部同名选择器定义的样式不会生效
     */
    externalClasses: [
        'iconfont',
        'icon-sousuo',
    ],

    /**
     * 组件的初始数据
     */
    data: {
        _keyword: '',
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onInput(event) {
            this.setData({
                _keyword: event.detail.value
            })
        },

        onSearch() {
            const keyword = this.data._keyword;
            this.triggerEvent('search', {
                keyword
            })
        },
    }
});
