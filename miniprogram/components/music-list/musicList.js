// components/music-list/music-list.js
const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    musicList: Array
  },

  /**
   * 组件的初始数据
   */
  data: {
    playingId: -1
  },

  pageLifetimes: {
    show() {
      this.setData({
        playingId: parseInt(app.getPlayingMusicId())
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onSelect(event) {
      // 事件源 事件处理函数 事件对象 事件类型
      const ds = event.currentTarget.dataset;
      const musicId = ds.musicid;
      this.setData({
        playingId: musicId
      });
      wx.navigateTo({
        url: `../../pages/player/player?musicId=${musicId}&index=${ds.index}`,
      })
    }
  }
});
