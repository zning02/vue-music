<template>
  <div class="player" v-show="playList.length>0">
    <transition name="normal">
      <div class="normal-player" v-show="fullScreen"   @touchstart.prevent="triggerPlay">
          <div class="background"  >
            <img  width="100%" height="100%" :src="currentSong.image"/>
          </div>
         
          <div class="top" >
            <div class="back" @click="click">
              <i class="icon-back"></i>
            </div>
            <h1 class="title" v-html="currentSong.name"></h1>
            <h2 class="subtitle"></h2>
          </div>
          <div class="middle"
           @touchstart.prevent="middleTouchStart"
          @touchmove.prevent="middleTouchMove"
          @touchend="middleTouchEnd" 

          >
            <div class="middle-l" ref="middleL">
              <div class="cd-wrapper">
                <div class="cd" :class="cdCls">
                  <img class="image" :src="currentSong.image"/>
                </div>
              </div>
               <div class="playing-lyric-wrapper">
              <div class="playing-lyric">
                {{playingLyric}}
              </div>
            </div>
            </div>
            <scroll class="middle-r" ref="lyricList" :data="currentLyric&&currentLyric.lines">
              <div class="lyric-wrapper">
                <div v-if="currentLyric">
                  <p ref="lyricLine"
                  class="text"
                  v-for="(line,index) in currentLyric.lines"
                  :class="{'current':currentLineNum===index}"
                  >
                    {{line.txt}}
                  </p>
                </div>
              </div>
            </scroll>
          </div>
          <div class="bottom">
            <div class="dot-wrapper">
              <span class="dot" :class="{'active':currentShow==='cd'}"></span>
              <span class="dot" :class="{'active':currentShow==='lyric'}"></span>
            </div>
            <div class="progress-wrapper">
              <span class="time time-l">{{format(currentTime)}}</span>
              <div class="progress-bar-wrapper">
                <progress-bar :percent="percent" @percentChange="onProgressChange"></progress-bar>
              </div>
            <span class="time time-r">{{format(currentSong.duration)}}</span>
            </div>
            <div class="operators" style="padding-right: 17px;">
              <div class="icon i-left" @click="changeMode">
                <i :class="iconMode"></i>
              </div>
               <div class="icon i-left" :class="disableCls">
                <i class="icon-prev" @click="prev"></i>
              </div>
               <div class="icon i-center" :class="disableCls">
                <i :class="playIcon" @click="togglePlaying"></i>
              </div>
              <div class="icon i-right" :class="disableCls">
                <i class="icon-next" @click="next"></i>
              </div>
               <!-- <div class="icon i-right">
                <i class="icon icon-not-favorite"></i>
              </div> -->
            </div>
          </div>
      </div>
    </transition>

<transition name="mini">
      <div class="mini-player"  v-show="!fullScreen" @click="open">
        <div class="icon">
          <img width="40" height="40" :src="currentSong.image" :class="cdCls" />
        </div>
        <div class="text">
          <h2 class="name" v-html="currentSong.name"></h2>
          <p class="desc" v-html="currentSong.singer"></p>
        </div>
        <div class="control">
          <progress-circle :radius="radius" :percent="percent">
          <i :class="minIcon" @click.stop="togglePlaying" class="icon-mini"></i>
        </progress-circle>
        </div>
        <div class="control">
          <i class="icon-playlist"></i>
        </div>
      </div>
</transition>
<audio :src="currentSong.url" ref="audio" @canplay="ready" @error="error"
@timeupdate="updateTime" @ended="end"></audio>

<!-- <audio src="http://thirdparty.gtimg.com/C100001sBy9d0RzXkR.m4a?fromtag=38" ref="audio" @canplay="ready" @error="error"
@timeupdate="updateTime" @ended="end"></audio> -->
  </div>
  
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import progressBar from "base/progress-bar/progress-bar";
import progressCircle from "base/progress-circle/progress-circle";
import { playMode } from "common/js/config";
import { shuffle } from "common/js/util";
import Lyric from "lyric-parser";
import Scroll from "base/scroll/scroll";
import {myBrowser} from 'common/js/util'

export default {
  components: {
    progressBar,
    progressCircle,
    Scroll
  },
  data() {
    return {
      songReady: false,
      currentTime: 0,
      radius: 32,
      currentLyric: null,
      currentLineNum: 0,
      currentShow: "cd",
      playingLyric: "",
      firstFlag: true,
      sameFlag: false
    };
  },
  created() {
    this.touch = {};
  },
  computed: {
    cdCls() {
      return this.playing ? "play" : "play pause";
    },
    playIcon() {
      return this.playing ? "icon-pause" : "icon-play";
    },
    minIcon() {
      return this.playing ? "icon-pause-mini" : "icon-play-mini";
    },
    disableCls() {
      return this.songReady ? "" : "disable";
    },
    percent() {
      return this.currentTime / this.currentSong.duration;
    },
    iconMode() {
      return this.mode === playMode.sequence
        ? "icon-sequence"
        : this.mode === playMode.loop ? "icon-loop" : "icon-random";
    },
    ...mapGetters([
      "mode",
      "fullScreen",
      "playList",
      "currentSong",
      "playing",
      "currentIndex"
    ])
  },
  methods: {
    triggerPlay() {
      if (!this.sameFlag && this.firstFlag&& myBrowser()) {
        this.$refs.audio.play();
        this.getLyric();
        this.firstFlag = false;
        this.sameFlag=true;
      }
    },
    click() {
      this.setFullScreen(false);
    },
    open() {
      this.setFullScreen(true);
    },
    togglePlaying() {
      this.setPlayingState(!this.playing);
      if (this.currentLyric) {
        this.currentLyric.togglePlay();
      }
    },
    prev() {
      if (!this.songReady) {
        //防止过快点击
        return;
      }
      if (this.playList.length === 1) {
        this.loop();
      } else {
        let index = this.currentIndex - 1;
        if (index === -1) {
          index = this.playList.length - 1;
        }
        this.setCurrentIndex(index);
        if (!this.playing) {
          this.togglePlaying();
        }
      }
      this.songReady = false; //准备好播放了就会变成true
    },
    next() {
      if (!this.songReady) {
        return;
      }
      if (this.playList.length === 1) {
        this.loop();
      } else {
        let index = this.currentIndex + 1;
        if (index === this.playList.length) {
          index = 0;
        }
        this.setCurrentIndex(index);
        if (!this.playing) {
          this.togglePlaying();
        }
      }
      this.songReady = false;
    },
    ready() {
      this.songReady = true;
    },
    error() {
      this.songReady = true;
    },
    updateTime(e) {
      this.currentTime = e.target.currentTime;
    },
    onProgressChange(percent) {
      const currentTime = this.currentSong.duration * percent;
      this.$refs.audio.currentTime = this.currentSong.duration * percent;
      if (!this.playing) {
        this.togglePlaying();
      }
      if (this.currentLyric) {
        this.currentLyric.seek(currentTime * 1000);
      }
    },
    changeMode() {
      const mode = (this.mode + 1) % 3;
      this.setPlayMode(mode);
      let list = null;
      if (this.mode === playMode.random) {
        list = shuffle(this.playList);
      } else {
        list = this.playList;
      }
      this.setPlayList(list);
      this.resetCurrentIndex(list);
    },
    resetCurrentIndex(list) {
      let index = list.findIndex(item => {
        return item.id === this.currentSong.id;
      });
      this.setCurrentIndex(index);
    },
    end() {
      if (this.mode === playMode.loop) {
        this.loop();
      } else {
        this.next();
      }
    },
    loop() {
      this.$refs.audio.currentTime = 0;
      this.$refs.audio.play();
      // 循环播放 歌词回到开始的时候
      if (this.currentLyric) {
        this.currentLyric.seek(0);
      }
    },
    format(interval) {
      interval = interval | 0;
      const m = (interval / 60) | 0;
      const s = this._pad(interval % 60);
      return `${m}:${s}`;
    },
    _pad(num, n = 2) {
      let len = num.toString().length;
      while (len < n) {
        num = "0" + num;
        len++;
      }
      return num;
    },
    getLyric() {
      this.currentSong
        .getLyric()
        .then(lyric => {
          this.currentLyric = new Lyric(lyric, this.handleLyric);
          if (this.playing) {
            this.currentLyric.play();
          }
        })
        .catch(() => {
          this.currentLyric = null;
          this.playingLyric = "";
          this.currentTime = 0;
        });
    },
    handleLyric({ lineNum, txt }) {
      this.currentLineNum = lineNum;
      if (lineNum > 5) {
        let lineEl = this.$refs.lyricLine[lineNum - 5];
        this.$refs.lyricList.scrollToElement(lineEl, 1000);
      }
      this.playingLyric = txt;
    },
    middleTouchStart(e) {
      this.touch.initiated = true;
      // 用来判断是否是一次移动
      this.touch.moved = false;
      const touch = e.touches[0];
      this.touch.startX = touch.pageX;
      this.touch.startY = touch.pageY;
    },
    middleTouchMove(e) {
      if (!this.touch.initiated) {
        return;
      }
      if (!this.touch.moved) {
        this.touch.moved = true;
      }
      const touch = e.touches[0];
      const deltaX = touch.pageX - this.touch.startX;
      const deltaY = touch.pageY - this.touch.startY;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        //判断是否为纵向滚动，支支持横向滚动
        return;
      }

      const left = this.currentShow === "cd" ? 0 : -window.innerWidth;
      const width = Math.min(0, Math.max(-window.innerWidth, left + deltaX));
      this.touch.percent = Math.abs(width / window.innerWidth);
      this.$refs.lyricList.$el.style[
        "transform"
      ] = `translate3d(${width}px,0,0)`;
      this.$refs.lyricList.$el.style[
        "webkitTransform"
      ] = `translate3d(${width}px,0,0)`;
      this.$refs.lyricList.$el.style["transitionDuration"] = 0;
      this.$refs.lyricList.$el.style["webkitTransitionDuration"] = 0;
      this.$refs.middleL.style.opacity = 1 - this.touch.percent;
      this.$refs.middleL.style["transitionDuration"] = 0;
      this.$refs.middleL.style["webkitTransitionDuration"] = 0;
    },
    middleTouchEnd() {
      let opacity;
      if (!this.touch.moved) {
        return;
      }
      let width;
      if (this.currentShow === "cd") {
        if (this.touch.percent > 0.1) {
          width = -window.innerWidth;
          this.currentShow = "lyric";
          opacity = 0;
        } else {
          width = 0;
          opacity = 1;
        }
      } else {
        if (this.touch.percent < 0.9) {
          width = 0;
          this.currentShow = "cd";
          opacity = 1;
        } else {
          width = -window.innerWidth;
          opacity = 0;
        }
      }
      const time = 300;
      this.$refs.lyricList.$el.style[
        "transform"
      ] = `translate3d(${width}px,0,0)`;
      this.$refs.lyricList.$el.style[
        "webkitTransform"
      ] = `translate3d(${width}px,0,0)`;
      this.$refs.lyricList.$el.style["transitionDuration"] = `${time}ms`;
      this.$refs.lyricList.$el.style["webkitTransitionDuration"] = `${time}ms`;
      this.$refs.middleL.style.opacity = opacity;
      this.$refs.middleL.style["transitionDuration"] = time;
      this.$refs.middleL.style["webkitTransitionDuration"] = time;
    },
    ...mapMutations({
      setFullScreen: "SET_FULL_SCREEN",
      setPlayingState: "SET_PLAYING_STATE",
      setCurrentIndex: "SET_CURRENT_INDEX",
      setPlayMode: "SET_PLAY_MODE",
      setPlayList: "SET_PLAYLIST"
    })
  },
  watch: {
    currentSong(newSong, oldSong) {
      if (newSong.id === oldSong.id) {
        this.sameFlag = true;
        return;
      }
       if (this.firstFlag&&myBrowser()) {//ios第一次的时候
        return
      }
      if (this.currentLyric) {
        this.currentLyric.stop();
      }
      setTimeout(() => {
        this.$refs.audio.play();
        this.getLyric();
      }, 1000);
    },
    playing(newPlaying) {
        const audio = this.$refs.audio;
        this.$nextTick(() => {
        newPlaying ? audio.play() : audio.pause();
        })
    }
  }
};
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
@import '~common/stylus/variable';
@import '~common/stylus/mixin';

.player {
  .normal-player {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 150;
    background: $color-background;

    .background {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      opacity: 0.6;
      filter: blur(20px);
    }

    .top {
      position: relative;
      margin-bottom: 25px;

      .back {
        position: absolute;
        top: 0;
        left: 6px;
        z-index: 50;

        .icon-back {
          display: block;
          padding: 9px;
          font-size: $font-size-large-x;
          color: $color-theme;
          transform: rotate(-90deg);
        }
      }

      .title {
        width: 70%;
        margin: 0 auto;
        line-height: 40px;
        text-align: center;
        no-wrap();
        font-size: $font-size-large;
        color: $color-text;
      }

      .subtitle {
        line-height: 20px;
        text-align: center;
        font-size: $font-size-medium;
        color: $color-text;
      }
    }

    .middle {
      position: fixed;
      width: 100%;
      top: 80px;
      bottom: 170px;
      white-space: nowrap;
      font-size: 0;

      .middle-l {
        display: inline-block;
        vertical-align: top;
        position: relative;
        width: 100%;
        height: 0;
        padding-top: 80%;

        .cd-wrapper {
          position: absolute;
          left: 10%;
          top: 0;
          width: 80%;
          height: 100%;

          .cd {
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            border: 10px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;

            &.play {
              animation: rotate 20s linear infinite;
            }

            &.pause {
              animation-play-state: paused;
            }

            .image {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              border-radius: 50%;
            }
          }
        }

        .playing-lyric-wrapper {
          width: 80%;
          margin: 30px auto 0 auto;
          overflow: hidden;
          text-align: center;

          .playing-lyric {
            height: 20px;
            line-height: 20px;
            font-size: $font-size-medium;
            color: $color-text-l;
          }
        }
      }

      .middle-r {
        display: inline-block;
        vertical-align: top;
        width: 100%;
        height: 100%;
        overflow: hidden;

        .lyric-wrapper {
          width: 80%;
          margin: 0 auto;
          overflow: hidden;
          text-align: center;

          .text {
            line-height: 32px;
            color: $color-text-l;
            font-size: $font-size-medium;

            &.current {
              color: $color-text;
            }
          }
        }
      }
    }

    .bottom {
      position: absolute;
      bottom: 50px;
      width: 100%;

      .dot-wrapper {
        text-align: center;
        font-size: 0;

        .dot {
          display: inline-block;
          vertical-align: middle;
          margin: 0 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: $color-text-l;

          &.active {
            width: 20px;
            border-radius: 5px;
            background: $color-text-ll;
          }
        }
      }

      .progress-wrapper {
        display: flex;
        align-items: center;
        width: 80%;
        margin: 0px auto;
        padding: 10px 0;

        .time {
          color: $color-text;
          font-size: $font-size-small;
          flex: 0 0 30px;
          line-height: 30px;
          width: 30px;

          &.time-l {
            text-align: left;
          }

          &.time-r {
            text-align: right;
          }
        }

        .progress-bar-wrapper {
          flex: 1;
        }
      }

      .operators {
        display: flex;
        align-items: center;

        .icon {
          flex: 1;
          color: $color-theme;

          &.disable {
            color: $color-theme-d;
          }

          i {
            font-size: 30px;
          }
        }

        .i-left {
          text-align: right;
        }

        .i-center {
          padding: 0 20px;
          text-align: center;

          i {
            font-size: 40px;
          }
        }

        .i-right {
          text-align: left;
        }

        .icon-favorite {
          color: $color-sub-theme;
        }
      }
    }

    &.normal-enter-active, &.normal-leave-active {
      transition: all 0.4s;

      .top, .bottom {
        transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32);
      }
    }

    &.normal-enter, &.normal-leave-to {
      opacity: 0;

      .top {
        transform: translate3d(0, -100px, 0);
      }

      .bottom {
        transform: translate3d(0, 100px, 0);
      }
    }
  }

  .mini-player {
    display: flex;
    align-items: center;
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 180;
    width: 100%;
    height: 60px;
    background: $color-highlight-background;

    &.mini-enter-active, &.mini-leave-active {
      transition: all 0.4s;
    }

    &.mini-enter, &.mini-leave-to {
      opacity: 0;
    }

    .icon {
      flex: 0 0 40px;
      width: 40px;
      padding: 0 10px 0 20px;

      img {
        border-radius: 50%;

        &.play {
          animation: rotate 10s linear infinite;
        }

        &.pause {
          animation-play-state: paused;
        }
      }
    }

    .text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
      line-height: 20px;
      overflow: hidden;

      .name {
        margin-bottom: 2px;
        no-wrap();
        font-size: $font-size-medium;
        color: $color-text;
      }

      .desc {
        no-wrap();
        font-size: $font-size-small;
        color: $color-text-d;
      }
    }

    .control {
      flex: 0 0 30px;
      width: 30px;
      padding: 0 10px;

      .icon-play-mini, .icon-pause-mini, .icon-playlist {
        font-size: 30px;
        color: $color-theme-d;
      }

      .icon-mini {
        font-size: 32px;
        position: absolute;
        left: 0;
        top: 0;
      }
    }
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
