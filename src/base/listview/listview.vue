<template>
  <scroll class="listview" 
          :data="data" 
          ref="listview" 
          :listenScroll="listenScroll"
          @scroll="scroll"
          :probeType="probeType"
          >
      <ul>
          <li v-for="group in data" class="list-group" ref="listgroup">
                    <h2 class="list-group-title">{{group.title}}</h2>
              <ul>
                  <li @click="selectItem(item)" v-for="item in group.items" class="list-group-item">
                      <img class="avatar" v-lazy="item.avatar" alt="" />
                      <span class="name">{{item.name}}</span>
                  </li>
              </ul>
          </li>
      </ul>
      <div class="list-shortcut" @touchstart="onShortcutTouchSatar" @touchmove.stop.prevent(onShortcutTouchMove)>
        <ul>
          <li v-for="(item,index) in shorcutList" 
          class="item" 
          :class="{'current':currentIndex===index}"
          :data-index="index"
          >
            {{item}}
          </li>
        </ul>
      </div>
      <div class="list-fixed" v-show="fixedTitle" ref="fixed">
        <h1 class="fixed-title">{{fixedTitle}}</h1>
      </div>
       <div v-show="!data.length" class="loading-container">
      <loading></loading>
    </div>
  </scroll>
</template>
<script>
import Scroll from "base/scroll/scroll";
import { getData } from "common/js/dom";
import Loading from "base/loading/loading"

const h = 18;
const titleH=30;
export default {
  components: {
    Scroll,
    Loading
  },
  created() {
    this.touch = {};
    this.listenScroll = true;
    this.listenHeight = [];
    this.probeType = 3
  },
  data() {
    return {
      scrollY: -1,
      currentIndex: 0,
      diff:-1
    };
  },
  props: {
    data: {
      type: Array,
      default: []
    }
  },
  computed: {
    shorcutList() {
      return this.data.map(group => {
        return group.title.substr(0, 1);
      });
    },
    fixedTitle(){
      if(this.scrollY>0){
        return ''
      }
      return this.data[this.currentIndex]?this.data[this.currentIndex].title:''
    }
  },
  watch: {
    data() {
      setTimeout(() => {
        this._calculateHeight();
      }, 20);
    },
    scrollY(newY){
      //滚动大于0的时候在顶部
      if(newY>0){
        this.currentIndex=0;
        return
      }
      //在中间滚动时候
      const listenHeight=this.listenHeight
      for(let i=0;i<listenHeight.length-1;i++){
        let h1=listenHeight[i];
        let h2=listenHeight[i+1]
        if(!h2||(-newY>=h1&&-newY<h2)){
          this.currentIndex=i
          this.diff=h2+newY
          return
        }
      }
      //最后一个的时候
      this.currentIndex=listenHeight.length-2
    },
    diff(newVal){
      let fixedTop=(newVal>0&&newVal<titleH)?newVal-titleH:0
      if(this.fixedTop===fixedTop){
        return
      }
      this.fixedTop=fixedTop
      this.$refs.fixed.style.transform=`translate3d(0,${fixedTop}px,0)`
    }
  },
  methods: {
    selectItem(item){
      //告诉外部组件
        this.$emit('select',item)
    },
    //左右两边的滚动是分开写的
    onShortcutTouchSatar(e) {
      let anchorIndex = getData(e.target, "index");
      let firstTouch = e.touches[0];
      this.touch.y1 = firstTouch.pageY;
      this.touch.anchorIndex = anchorIndex;
      this._scrollTo(anchorIndex);
    },
    onShortcutTouchMove(e) {
      let firstTouch = e.touches[0];
      this.touch.y2 = firstTouch.pageY;
      let delta = ((this.touch.y2 - this.touch.y1) / h) | 0;
      let anchorIndex = this.touch.anchorIndex + delta;
      this._scrollTo(anchorIndex);
    },
    _scrollTo(index) {//判断要滚到哪一个
      if(!index&&index!==0){
        return 
      }
      if(index<0){
        index=0
      }else if(index>this.listenHeight.length-2){
        index=this.listenHeight-2;
      }
      this.scrollY=-this.listenHeight[index];
      this.$refs.listview.scrollToElement(this.$refs.listgroup[index], 0);
    },
    scroll(pos) {
      this.scrollY = pos.y;
    },
    _calculateHeight() {
      this.listenHeight = [];
      const list = this.$refs.listgroup;
      let height = 0;
      this.listenHeight.push(height);
      for (let i = 0; i < list.length; i++) {
        let item = list[i];
        height += item.clientHeight;
        this.listenHeight.push(height);
      }
    }
  }
};
</script>
<style lang="stylus" scoped>
@import '~common/stylus/variable';

.listview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: $color-background;

  .list-group {
    padding-bottom: 30px;

    .list-group-title {
      height: 30px;
      line-height: 30px;
      padding-left: 20px;
      font-size: $font-size-small;
      color: $color-text-l;
      background: $color-highlight-background;
    }

    .list-group-item {
      display: flex;
      align-items: center;
      padding: 20px 0 0 30px;

      .avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
      }

      .name {
        margin-left: 20px;
        color: $color-text-l;
        font-size: $font-size-medium;
      }
    }
  }

  .list-shortcut {
    position: absolute;
    z-index: 30;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    padding: 20px 0;
    border-radius: 10px;
    text-align: center;
    background: $color-background-d;
    font-family: Helvetica;

    .item {
      padding: 3px;
      line-height: 1;
      color: $color-text-l;
      font-size: $font-size-small;

      &.current {
        color: $color-theme;
      }
    }
  }

  .list-fixed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;

    .fixed-title {
      height: 30px;
      line-height: 30px;
      padding-left: 20px;
      font-size: $font-size-small;
      color: $color-text-l;
      background: $color-highlight-background;
    }
  }

  .loading-container {
    position: absolute;
    width: 100%;
    top: 50%;
    transform: translateY(-50%);
  }
}
</style>
