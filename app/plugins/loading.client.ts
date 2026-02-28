/**
 * 全域 Loading 動畫
 * 在路由切換時顯示 Loading Bar
 * 
 * 功能：
 * - 路由切換時顯示頂部 Loading Bar
 * - 使用 NProgress 實現流暢的動畫效果
 * - 與現有的 route plugin 整合
 */

import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

export default defineNuxtPlugin((nuxtApp) => {
  // 只在客戶端執行
  if (import.meta.server) return

  // 設定 NProgress
  NProgress.configure({
    showSpinner: false,  // 隱藏右上角的旋轉圖示
    trickleSpeed: 200,   // 自動增長速度
    minimum: 0.1,        // 最小百分比
    easing: 'ease',      // 動畫效果
    speed: 400,          // 動畫速度
  })

  // 監聽路由變化
  nuxtApp.hook('page:start', () => {
    console.log('🔄 路由開始切換 - 顯示 Loading')
    NProgress.start()
  })

  nuxtApp.hook('page:finish', () => {
    console.log('✅ 路由切換完成 - 隱藏 Loading')
    NProgress.done()
  })

  // 應用程式錯誤時也要隱藏 Loading
  nuxtApp.hook('app:error', () => {
    console.log('❌ 應用程式錯誤 - 隱藏 Loading')
    NProgress.done()
  })
})

