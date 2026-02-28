/**
 * Nuxt 型別擴展
 * 定義 Custom Hooks 和 Plugin 方法
 */

import type { RuntimeNuxtHooks } from '#app'

/**
 * 擴展 Nuxt Runtime Hooks
 * 定義自訂的 hooks 用於路由和頁面載入管理
 */
declare module '#app' {
    interface RuntimeNuxtHooks {
        /**
         * 路由 hash 變化時觸發
         */
        'route:hash:changed': () => void | Promise<void>
        
        /**
         * 頁面 Widget 載入完成時觸發
         */
        'page:widgets:complete': () => void | Promise<void>
        
        /**
         * 頁面 Widget 載入完成且已置頂時觸發
         */
        'page:widgets:complete:withTop': () => void | Promise<void>
    }
}

/**
 * 擴展 NuxtApp 介面
 * 定義全域注入的方法
 */
declare module '#app' {
    interface NuxtApp {
        /**
         * 關閉所有彈窗
         */
        $closePopups?: () => void
        
        /**
         * 建立 Locomotive Scroll Layout
         * （可選，如果專案有使用 Locomotive Scroll）
         */
        $createLayoutLocomotive?: () => void
        
        /**
         * 取得 Locomotive Scroll 實例
         * （可選，如果專案有使用 Locomotive Scroll）
         */
        $getWindowLoco?: (key: string) => any
    }
}

export {}

