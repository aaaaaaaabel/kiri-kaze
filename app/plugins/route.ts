/**
 * 路由處理 Plugin
 * 移植自 lrc-frontend-nuxt/app/plugins/route.ts
 * 
 * 功能：
 * - 路由切換時的頁面過場動畫控制
 * - 頁面載入狀態管理
 * - 路由變化監聽
 * - 頁面置頂處理
 * 
 * 已移除業務相關功能：
 * - i18n 相關
 * - Locomotive Scroll 相關（保留基本支援）
 * - Widget 相關（簡化版）
 * - 會員相關
 */

/**
 * 路由處理 Plugin
 * 移植自 lrc-frontend-nuxt/app/plugins/route.ts
 * 
 * 功能：
 * - 路由切換時的頁面過場動畫控制
 * - 頁面載入狀態管理
 * - 路由變化監聽
 * - 頁面置頂處理
 * 
 * 已移除業務相關功能：
 * - i18n 相關
 * - Locomotive Scroll 相關（保留基本支援）
 * - Widget 相關（簡化版）
 * - 會員相關
 */

import { storeToRefs } from 'pinia'
import { action as actionIndex } from '../constants/store/actions'
import { hasHashElement, setHtmlReady, removeHtmlReady } from '~/utils/common'
import { disabledPageTransitionPathNames } from '~/constants/others'
import { useWidgetsBlocksEvents } from '~/composables/useWidgetsBlocksEvents'
import { useAppTransition } from '~/composables/useAppTransition'

/**
 * 簡單的延遲函數（替代 @vueuse/core 的 promiseTimeout）
 * 如需使用 @vueuse/core，可以安裝套件並取消註解
 */
const promiseTimeout = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export default defineNuxtPlugin(() => {
    const nuxtApp = useNuxtApp()
    const storeGlobal = useGlobalStore()
    const { isPageFinishedBeforeEnd, isOpenTransitionFinished, isPagePosTop } = storeToRefs(storeGlobal)
    const route = useRoute()
    const router = nuxtApp.$router as any
    const { toggleWidgetsBlockComplete, togglePageTransitionComplete, widgetsBlockState } = useWidgetsBlocksEvents()
    const { open: animeOpen, close: animeClose, init: animeInit } = useAppTransition()
    
    // 頁面狀態
    const pageClientFinished = ref(false)
    let tlOpen: ReturnType<typeof animeOpen> | undefined
    let tlClose: ReturnType<typeof animeClose> | undefined
    let isFirstPageLoaded = false
    let pathToTemp = ''
    let errorTimeout: NodeJS.Timeout | undefined
    let disabledTransition = false
    let _to: any = null
    let _toHash = ''
    let _toQuery = ''
    let _hasHashElement = false

    /**
     * 判斷是否需要停用過場動畫
     * 參考 LRC: 某些頁面（如子頁面）不需要過場動畫
     */
    const checkDisabledTransition = (to: any, from: any): boolean => {
        try {
            const fromName = from.name?.toString().split('___')[0] || ''
            const toName = to.name?.toString().split('___')[0] || ''
            const fromParentName = fromName.split('-')[0]
            const toParentName = toName.split('-')[0]
            
            const existName = disabledPageTransitionPathNames.filter(
                (x) => fromParentName === x && toParentName === x
            )
            
            // 如果路徑相同且在同一個 disabled 群組中，則停用過場動畫
            return existName.length > 0
        } catch (error) {
            return false
        }
    }

    /**
     * 重置 HTML class
     */
    const resetHtmlClass = (): void => {
        const html = document.documentElement
        html.classList.remove('layout-scroll-down', 'header-sticky', 'show-goTop')
        
        // 延遲設定 isPagePosTop
        setTimeout(() => {
            storeGlobal.isPagePosTop = true
        }, 100)
    }

    /**
     * 頁面置頂
     */
    const resetPosToTop = (): void => {
        _hasHashElement = hasHashElement(_toHash)
        
        if (_hasHashElement) {
            resetHtmlClass()
            nuxtApp.callHook('route:hash:changed')
        } else {
            resetHtmlClass()
        }

        // 如果有 Locomotive Scroll，啟動它
        if (nuxtApp.$getWindowLoco) {
            const winLoco = nuxtApp.$getWindowLoco('layout')
            if (winLoco && winLoco.start) {
                winLoco.start()
            }
        }
    }

    /**
     * 頁面載入完成初始化
     */
    const page_finish_init = (): void => {
        setTimeout(() => {
            resetPosToTop()
        }, 110)

        // 檢查 hash element
        _hasHashElement = hasHashElement(_toHash)
        pathToTemp = nuxtApp.$router.currentRoute.value.path

        // 關閉彈窗（如果有）
        if (nuxtApp.$closePopups) {
            nuxtApp.$closePopups()
        }

        // 標記頁面載入完成
        pageClientFinished.value = true
        togglePageTransitionComplete(true)
    }

    /**
     * 計算頁面 Widget 載入完成狀態
     */
    const pageWidgetsClientFinish = computed(() => {
        return widgetsBlockState.loadComplete && pageClientFinished.value
    })

    const pageWidgetsClientFinishWithTop = computed(() => {
        return widgetsBlockState.loadComplete && pageClientFinished.value && isPagePosTop.value
    })

    /**
     * 監聽頁面 Widget 載入完成
     */
    watch(
        () => pageWidgetsClientFinish.value,
        async (newValue) => {
            if (newValue) {
                nuxtApp.callHook('page:widgets:complete')
            }
        }
    )

    watch(
        () => pageWidgetsClientFinishWithTop.value,
        async (newValue) => {
            if (newValue) {
                nuxtApp.callHook('page:widgets:complete:withTop')
            }
        }
    )

    /**
     * 判斷是否為靜態資源路徑（圖片、CSS、JS 等）
     */
    const isStaticAsset = (path: string): boolean => {
        // 排除靜態資源路徑
        const staticExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot']
        const staticPaths = ['/images/', '/_nuxt/', '/favicon.ico']
        
        // 檢查副檔名
        if (staticExtensions.some(ext => path.toLowerCase().endsWith(ext))) {
            return true
        }
        
        // 檢查路徑前綴
        if (staticPaths.some(prefix => path.startsWith(prefix))) {
            return true
        }
        
        return false
    }

    /**
     * 路由切換前處理
     */
    router.beforeEach(async (to: any, from: any, next: () => void) => {
        // 如果是靜態資源路徑，直接跳過路由處理
        if (isStaticAsset(to.path)) {
            next()
            return
        }

        _toHash = to.hash
        _toQuery = to.query

        if (import.meta.client) {
            // 檢查是否需要停用過場動畫
            disabledTransition = checkDisabledTransition(to, from)
            _hasHashElement = hasHashElement(_toHash)

            // 記錄是否為相同路徑（排除 slug）
            storeGlobal.isSamePathExcludeLocale = nuxtApp.$isSamePathExcludeLocale
                ? nuxtApp.$isSamePathExcludeLocale(to, from)
                : false

            // 清除全域 Timeout
            if (errorTimeout) {
                clearTimeout(errorTimeout)
            }
            if (typeof window !== 'undefined' && (window as any).globalTimeout) {
                ;(window as any).globalTimeout.forEach((timeout: NodeJS.Timeout) => {
                    clearTimeout(timeout)
                })
                ;(window as any).globalTimeout = []
            }

            // 如果不需要停用過場動畫，準備關閉動畫
            if (!disabledTransition && !_hasHashElement && !storeGlobal.isSamePathExcludeLocale) {
                if (tlClose) {
                    tlClose.restart()
                }
            }

            // 頁面過場動畫：開啟
            if (from.path !== to.path) {
                console.log('🔄 [Route] 路由切換開始', { from: from.path, to: to.path })
                toggleWidgetsBlockComplete(false)
                togglePageTransitionComplete(false)
                storeGlobal[actionIndex.SET_PAGE_FINISHED_BEFROE_END](false)
                // ⭐ 立即設置為 false，觸發 Layout 的 watch 顯示 loading
                storeGlobal[actionIndex.SET_PAGE_TRANSITION_FINISHED](false)
                console.log('🔄 [Route] 已設置 SET_PAGE_TRANSITION_FINISHED(false)')

                if (!disabledTransition) {
                    if (tlClose && tlClose.isActive()) {
                        tlClose.restart()
                    }
                }
            } else {
                // 相同路徑但不同 fullPath（例如 query 改變）
                if (from.fullPath !== to.fullPath) {
                    togglePageTransitionComplete(true)
                } else {
                    togglePageTransitionComplete(true)
                }
            }
        }

        next()
    })

    /**
     * 路由切換後處理
     */
    router.afterEach(async (to: any, from: any) => {
        storeGlobal.isPagePosTop = false
        _to = to
        _toHash = to.hash
        _toQuery = to.query

        // ⭐ 路徑改變時更新 pageKey，強制重新渲染（參考 LRC）
        if (from.path !== to.path) {
            storeGlobal.pageKey = new Date().getTime()
        }

        if (pathToTemp === to.path) {
            storeGlobal.isPagePosTop = true
        } else {
            pageClientFinished.value = false
        }
    })

    /**
     * 應用程式建立時
     */
    nuxtApp.hook('app:mounted', async () => {
        await nextTick()
        // 初始化頁面過場動畫
        animeInit()
        tlOpen = animeOpen()
        tlClose = animeClose()
    })

    /**
     * 頁面開始載入
     */
    nuxtApp.hook('page:start', () => {
        // 如果有 Locomotive Scroll，停止它
        if (nuxtApp.$getWindowLoco) {
            const winLoco = nuxtApp.$getWindowLoco('layout')
            if (winLoco && winLoco.stop) {
                winLoco.stop()
            }
        }
    })

    /**
     * 頁面載入完成
     */
    nuxtApp.hook('page:finish', () => {
        removeHtmlReady()
        page_finish_init()
    })

    /**
     * 應用程式錯誤處理
     */
    nuxtApp.hook('app:error', async (err) => {
        if (import.meta.client) {
            await nextTick()
            resetHtmlClass()
            
            // 如果有 Locomotive Scroll，重新建立
            if (nuxtApp.$createLayoutLocomotive) {
                nuxtApp.$createLayoutLocomotive()
            }
            
            resetPosToTop()
            
            if (!disabledTransition && isFirstPageLoaded) {
                if (tlClose && !tlClose.isActive() && (!tlOpen || !tlOpen.isActive())) {
                    tlClose.restart()
                }
            }
        }
        isFirstPageLoaded = true
    })

    /**
     * 頁面 Widget 載入完成處理
     * 參考 LRC: 當頁面內容載入完成時，觸發過場動畫結束
     * ⭐ 完全參照 LRC 邏輯，移除強制延遲，讓路由切換更順暢
     */
    nuxtApp.hook('page:widgets:complete', async () => {
        // 在客戶端執行（每次路由切換）
        if (isFirstPageLoaded) {
            let isTriggerFinished = false
            // 是否有執行 app transition
            if (!disabledTransition) {
                // 有過場動畫
                await promiseTimeout(1)
                tlClose
                    ?.eventCallback('onUpdate', function () {
                        // ⭐ 使用 this.progress() 檢查進度（與 LRC 一致）
                        // @ts-ignore - this 在 callback 中的類型由 eventCallback 綁定
                        const _this = this as any
                        if ((_this.progress() >= storeGlobal.PageFinishedBeforeEndProgress || _this.totalDuration() <= 0) && !isTriggerFinished) {
                            isTriggerFinished = true
                            storeGlobal[actionIndex.SET_PAGE_FINISHED_BEFROE_END](true)
                            setHtmlReady()
                        }
                    })
                    .restart()
                    .then(() => {
                        // ⭐ 移除強制延遲，動畫完成後立即標記完成
                        storeGlobal[actionIndex.SET_PAGE_TRANSITION_FINISHED](true)
                    })
            } else {
                // 無過場動畫（例如子頁面）
                storeGlobal[actionIndex.SET_PAGE_FINISHED_BEFROE_END](true)
                setHtmlReady()
            }
        } else {
            // ⭐ 首次載入（SSR），直接標記完成
            storeGlobal[actionIndex.SET_PAGE_FINISHED_BEFROE_END](true)
        }
        // 標記為已載入過
        isFirstPageLoaded = true
    })

    /**
     * 頁面 Widget 載入完成且已置頂
     */
    nuxtApp.hook('page:widgets:complete:withTop', async () => {
        // 可以在這裡執行額外的初始化
        // 例如：更新 scrollbar 大小
    })

    /**
     * 監聽路由 hash 變化
     */
    watch(
        () => route.hash,
        async (newValue) => {
            nuxtApp.callHook('route:hash:changed')
        },
        { deep: true }
    )

    /**
     * 監聽路由 path 變化
     */
    watch(
        () => route.path,
        async (newValue, oldValue) => {
            if (newValue === oldValue && nuxtApp.$closePopups) {
                nuxtApp.$closePopups()
            }
        },
        { deep: true }
    )
})

