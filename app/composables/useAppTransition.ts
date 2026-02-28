/**
 * 應用程式過場動畫管理
 * 移植自 lrc-frontend-nuxt/app/composables/useAppTransition.ts
 * 
 * 簡化版本：使用 CSS transition 替代 GSAP
 * 如需更複雜的動畫，可以安裝 gsap 並使用完整版本
 * 
 * 使用方式：
 * ```typescript
 * const { open, close, init } = useAppTransition()
 * init() // 初始化
 * const tlOpen = open() // 開始動畫
 * const tlClose = close() // 結束動畫
 * ```
 */

/**
 * 過場動畫選項
 */
interface AppTransitionOptions {
    durationOpen?: number // 開啟動畫時長（秒）
    durationClose?: number // 關閉動畫時長（秒）
}

/**
 * 簡化的過場動畫類別
 * 使用 CSS transition 替代 GSAP
 */
class AppTransition {
    private appTransitionClass = 'app-transition'
    private activeClass = 'is-active'
    private hideActiveClass = 'is-hide-active'
    durationOpen = 0.6
    durationClose = 0.6

    constructor(options?: AppTransitionOptions) {
        if (options) {
            Object.assign(this, options)
        }
    }

    /**
     * 取得動畫容器元素
     */
    private get container(): HTMLElement | null {
        return document.querySelector(`.${this.appTransitionClass}`) as HTMLElement | null
    }

    /**
     * 初始化過場動畫
     * 設定 CSS 變數
     */
    public init = (): void => {
        const el = this.container
        if (el) {
            el.style.setProperty('--duration_open', `${this.durationOpen}s`)
            el.style.setProperty('--duration_close', `${this.durationClose}s`)
        }
    }

    /**
     * 開啟過場動畫（簡化版）
     * 返回一個簡單的 Promise，模擬 GSAP Timeline
     * 
     * @returns Promise-like 物件，模擬 GSAP Timeline
     */
    public open = (): {
        restart: () => Promise<void>
        progress: (value: number) => void
        isActive: () => boolean
        totalDuration: () => number
    } => {
        const el = this.container
        let isActive = false

        return {
            /**
             * 重新開始動畫
             */
            restart: (): Promise<void> => {
                return new Promise((resolve) => {
                    if (!el) {
                        resolve()
                        return
                    }

                    isActive = true
                    el.classList.add(this.activeClass)

                    // 使用 CSS transition 實現動畫
                    setTimeout(() => {
                        isActive = false
                        resolve()
                    }, this.durationOpen * 1000)
                })
            },

            /**
             * 設定動畫進度（簡化版，僅用於相容性）
             */
            progress: (value: number): void => {
                // 簡化版不支援進度控制
                // 如需完整功能，請安裝 gsap
            },

            /**
             * 判斷動畫是否正在執行
             */
            isActive: (): boolean => {
                return isActive
            },

            /**
             * 取得動畫總時長
             */
            totalDuration: (): number => {
                return this.durationOpen
            },
        }
    }

    /**
     * 關閉過場動畫（簡化版）
     * 返回一個簡單的 Promise，模擬 GSAP Timeline
     * 
     * @returns Promise-like 物件，模擬 GSAP Timeline
     */
    public close = (): {
        restart: () => Promise<void>
        play: () => Promise<void>
        isActive: () => boolean
        totalDuration: () => number
        progress: () => number
        eventCallback: (event: string, callback: () => void) => any
    } => {
        const el = this.container
        const durationClose = this.durationClose // ⭐ 存儲 durationClose 用於返回物件
        let isActive = false
        let onUpdateCallback: (() => void) | null = null
        let currentProgress = 0 // ⭐ 追蹤當前進度

        /**
         * 重新開始動畫的實作
         */
        const restartImpl = (): Promise<void> => {
            return new Promise((resolve) => {
                if (!el) {
                    resolve()
                    return
                }

                isActive = true
                currentProgress = 0 // ⭐ 重置進度
                el.classList.add(this.hideActiveClass)

                // 使用 CSS transition 實現動畫
                const startTime = Date.now()
                const checkProgress = () => {
                    const elapsed = (Date.now() - startTime) / 1000
                    currentProgress = Math.min(elapsed / durationClose, 1) // ⭐ 更新進度

                    // ⭐ 呼叫 onUpdate callback（模擬 GSAP 的 onUpdate）
                    if (onUpdateCallback) {
                        onUpdateCallback()
                    }

                    if (currentProgress < 1) {
                        requestAnimationFrame(checkProgress)
                    } else {
                        el.classList.remove(this.hideActiveClass)
                        el.classList.remove(this.activeClass)
                        isActive = false
                        currentProgress = 1
                        resolve()
                    }
                }

                requestAnimationFrame(checkProgress)
            })
        }

        // ⭐ 定義返回類型，避免循環引用
        type ReturnType = {
            restart: () => Promise<void>
            play: () => Promise<void>
            isActive: () => boolean
            totalDuration: () => number
            progress: () => number
            eventCallback: (event: string, callback: () => void) => ReturnType
        }

        // ⭐ 建立返回物件，用於綁定 this 上下文
        const returnObj: ReturnType = {
            /**
             * 重新開始動畫
             */
            restart: restartImpl,

            /**
             * 播放動畫（與 restart 相同）
             */
            play: restartImpl,

            /**
             * 判斷動畫是否正在執行
             */
            isActive: (): boolean => {
                return isActive
            },

            /**
             * 取得動畫總時長
             */
            totalDuration: (): number => {
                return durationClose
            },

            /**
             * 取得當前進度（0-1）
             * ⭐ 新增：用於在 onUpdate callback 中檢查進度
             */
            progress: (): number => {
                return currentProgress
            },

            /**
             * 設定事件回調（用於相容 route.ts）
             * ⭐ 綁定正確的 this 上下文，讓 callback 中的 this 指向 returnObj
             */
            eventCallback: (event: string, callback: () => void): ReturnType => {
                if (event === 'onUpdate') {
                    // ⭐ 綁定正確的 this 上下文
                    onUpdateCallback = () => {
                        callback.call(returnObj)
                    }
                }
                return returnObj
            },
        }

        return returnObj
    }
}

/**
 * 使用應用程式過場動畫
 * 
 * @param options - 過場動畫選項
 * @returns 過場動畫實例
 */
export const useAppTransition = (options?: AppTransitionOptions) => {
    const appTransition = new AppTransition(options)
    return {
        ...appTransition,
    }
}

