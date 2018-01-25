import 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import fastclcik from 'fastclick'
import router from './router'
import VueLazyLoad from 'vue-lazyload'
import 'common/stylus/index.styl'

fastclcik.attach(document.body)

Vue.use(VueLazyLoad,{
  loading:require('common/image/default.png')
})
/* eslint-disable no-unused-vars */
// import vConsole from 'vconsole'

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
  router
})
