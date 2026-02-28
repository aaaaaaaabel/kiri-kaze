/**
 * 全域方法注入 Plugin
 * 移植自 lrc-frontend-nuxt/app/plugins/01.injections.ts
 * 
 * 功能：
 * - 圖片 Lazy Loading
 * - 滾動到元素
 * - 回到頂部
 * - API 請求取消
 * - 通用工具方法
 * 
 * 已移除業務相關功能：
 * - i18n 相關
 * - Store 相關
 * - Widget 相關
 * - 會員相關
 * 
 * 注意：
 * - 如果專案有安裝 gsap，可以取消註解 gsap 相關程式碼
 * - 目前使用原生 window.scrollTo 作為替代
 */

// CSS 類別名稱常數（簡化版）
const CLASSNAME_NUXT_LAZY_LOADED = 'nuxt-lazy-isLoaded'
const CLASSNAME_NUXT_LAZY_IN_PROGRESS = 'nuxt-lazy-inProgress'
const CLASSNAME_NUXT_LAZY_FAIL = 'nuxt-lazy-fail'

export default defineNuxtPlugin((nuxtApp) => {
    //#region 裝置判斷
    /**
     * 簡單的裝置判斷（不需要安裝 @nuxtjs/device）
     * 如果需要更精確的判斷，可以安裝 @nuxtjs/device 套件
     * 
     * 安裝方式：
     * npm install @nuxtjs/device
     * 然後在 nuxt.config.ts 的 modules 中加入 '@nuxtjs/device'
     * 並使用: const device = useDevice()
     */
    const isPc = computed(() => {
        if (import.meta.server) return true // SSR 預設為 PC
        if (typeof window === 'undefined') return true
        // 使用視窗寬度判斷（768px 為分界點，可自行調整）
        return window.innerWidth >= 768
    })

    /**
     * 判斷是否為行動版
     */
    const isMobile = computed(() => !isPc.value)
    //#endregion

    //#region 路由工具函數
    /**
     * 取得乾淨的 route path（移除最後斜線）
     * @param toPath - 路由路徑
     * @returns 處理後的路徑
     */
    const getToRealPath = (toPath: string): string => {
        if (toPath !== '/') return toPath.replace(/\/$/, '')
        return toPath
    }

    /**
     * 判斷兩個路由是否為相同路徑（排除 slug）
     * @param to - 目標路由
     * @param from - 來源路由
     * @returns 是否為相同路徑
     */
    const isSamePathExcludeLocale = (to: any, from: any): boolean => {
        const slugPathKey: string = 'slug'

        if (!from.name || !to.name) return false
        const fromName = from.name.split('___')[0]
        const toName = to.name.split('___')[0]
        let r = false
        if (fromName === toName) r = true

        const from_params_slug = from.params[slugPathKey]
        const to_params_slug = to.params[slugPathKey]

        if (typeof from_params_slug !== 'undefined' && typeof to_params_slug !== 'undefined') {
            let from_slug_str = ''
            let to_slug_str = ''
            if (typeof from_params_slug === 'object') from_slug_str = from_params_slug?.join('/')
            if (typeof to_params_slug === 'object') to_slug_str = to_params_slug?.join('/')
            if (typeof from_params_slug === 'string') {
                const start = fromName.lastIndexOf(slugPathKey)
                from_slug_str = `${fromName.substring(0, start)}${from_params_slug}`
            }
            if (typeof to_params_slug === 'string') {
                const start = toName.lastIndexOf(slugPathKey)
                to_slug_str = `${toName.substring(0, start)}${to_params_slug}`
            }
            r = from_slug_str === to_slug_str
        }
        return r
    }
    //#endregion

    //#region API 請求取消
    /**
     * API 請求取消控制器
     * 用於取消正在進行的 API 請求
     */
    let cancelRequests: AbortController[] = []

    const useAbort = {
        /**
         * 建立取消請求的 signal
         * @returns AbortSignal
         */
        signal: (): AbortSignal => {
            const controller = new AbortController()
            const signal = controller.signal
            cancelRequests.push(controller)
            return signal
        },

        /**
         * 取消所有正在進行的請求
         */
        abort: (): void => {
            cancelRequests.forEach((controller) => {
                if (controller && typeof controller.abort === 'function') {
                    controller.abort()
                }
            })
            cancelRequests = []
        },
    }
    //#endregion

    //#region 滾動相關
    /**
     * 滾動到指定元素
     * 支援 Locomotive Scroll 和原生滾動（使用 GSAP）
     * 
     * @param params - 滾動參數
     * @param params.key - Locomotive Scroll 的 key（預設 'locomotive-layout'）
     * @param params.params - 滾動目標和選項
     * @returns Promise<boolean>
     */
    const scrollToElement = ({ 
        key = 'locomotive-layout', 
        params 
    }: {
        key?: string
        params: {
            target: Element | string | number
            options?: {
                duration?: number
                offset?: number
                immediate?: boolean
                onComplete?: () => void
            }
        }
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            const { target, options } = params

            // 行動版或沒有 Locomotive Scroll 時使用原生滾動
            if (isMobile.value || !(window as any)[key]) {
                // 如果安裝了 gsap，可以使用以下程式碼：
                // const duration = typeof options?.duration === 'number' ? options.duration : 0.5
                // gsap.to(window, {
                //     duration,
                //     scrollTo: {
                //         y: target as Element,
                //         offsetY: (options?.offset ?? 0) * -1,
                //     },
                //     ease: 'power2.out',
                //     onComplete: () => {
                //         options?.onComplete?.()
                //         resolve(true)
                //     },
                // })

                // 使用原生滾動作為替代
                const targetElement = typeof target === 'string' 
                    ? document.querySelector(target) 
                    : target instanceof Element 
                        ? target 
                        : null

                if (targetElement) {
                    const offset = options?.offset ?? 0
                    const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY
                    const offsetPosition = elementPosition - offset

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: options?.immediate ? 'auto' : 'smooth',
                    })

                    // 簡單的完成回調（原生滾動無法精確計算時間）
                    setTimeout(() => {
                        options?.onComplete?.()
                        resolve(true)
                    }, 300)
                } else if (typeof target === 'number') {
                    window.scrollTo({
                        top: target,
                        behavior: options?.immediate ? 'auto' : 'smooth',
                    })
                    setTimeout(() => {
                        options?.onComplete?.()
                        resolve(true)
                    }, 300)
                } else {
                    resolve(true)
                }
            } else {
                // 使用 Locomotive Scroll
                const winLoco = (window as any)[key]
                if (winLoco) {
                    if (window.scrollY <= 0) {
                        resolve(true)
                    } else {
                        winLoco.scrollTo(target, {
                            ...options,
                            onComplete: () => {
                                options?.onComplete?.()
                                resolve(true)
                            },
                        })
                    }
                } else {
                    resolve(true)
                }
            }
        })
    }

    /**
     * 取得 Locomotive Scroll 實例
     * @param key - Locomotive Scroll 的 key
     * @returns Locomotive Scroll 實例或 null
     */
    const getWindowLoco = (key: string): any => {
        if (import.meta.server || typeof window === 'undefined') return null
        const winLoco = (window as any)[`locomotive-${key}`]
        return winLoco || null
    }

    /**
     * 判斷是否使用 Locomotive Scroll 平滑滾動
     * @returns 是否使用平滑滾動
     */
    const isLocoSmooth = (): boolean => {
        const winLoco = getWindowLoco('layout')
        return winLoco ? winLoco.lenisInstance?.isSmooth : false
    }

    /**
     * 滾動到頁面頂部
     * 會根據滾動距離自動計算滾動速度
     * 
     * @param _speed - 自訂滾動速度（可選）
     */
    const goTop = (_speed?: number): void => {
        const winLoco = getWindowLoco('layout')
        const isSmooth = isLocoSmooth()

        const containerRect = document.body?.getBoundingClientRect()
        const defaultDuration = 1.2
        let speed = 0

        const bodyHeight = isSmooth ? winLoco.lenisInstance.limit : containerRect?.height || 0
        const windowScrollY = isSmooth ? winLoco.lenisInstance.scroll : window.scrollY

        // 計算速度（根據滾動距離）
        speed = (windowScrollY / bodyHeight) * defaultDuration
        speed = Math.max(speed, 0.7) // 最小速度 0.7 秒

        const finalSpeed = _speed ?? speed
        const immediate = typeof finalSpeed !== 'undefined' && finalSpeed <= 0

        scrollToElement({
            params: {
                target: 'top',
                options: {
                    duration: finalSpeed,
                    immediate,
                },
            },
        })
    }
    //#endregion

    //#region 圖片 Lazy Loading
    /**
     * 圖片 Lazy Loading
     * 使用 Intersection Observer 來實現圖片延遲載入
     * 
     * ⭐ 完全參照 LRC 的做法，但針對 CSS Columns 瀑布流增加批次載入功能
     * 
     * @param immediateLoadCount - 立即載入前 N 張圖片（可選，預設 0）
     * 
     * 使用方式：
     * 1. 在 img 標籤上添加 data-src 和 data-manual-lazy 屬性
     * 2. 在頁面 onMounted 中呼叫 nuxtApp.$lazyLoadImage()
     * 3. 批次載入：呼叫 nuxtApp.$lazyLoadImage(15) 立即載入前 15 張
     */
    const lazyLoadImage = (immediateLoadCount: number = 0): void => {
        if (import.meta.server) return

        enum StatusEnum {
            Success = 'success',
            Fail = 'fail',
            InProgress = 'in-progress',
        }
        type Status = StatusEnum.Success | StatusEnum.Fail | StatusEnum.InProgress
        const loadedClass = CLASSNAME_NUXT_LAZY_LOADED

        /** First we get all the non-loaded image elements **/
        const lazyImages = [].slice.call(document.querySelectorAll(`img[data-manual-lazy]:not(.${loadedClass})`))
        const lazyBackgroundImages = [].slice.call(document.querySelectorAll(`[data-manual-lazy-background]:not(.${loadedClass})`))

        const imgLoaded = (image: any, status: Status) => {
            image.classList.add(loadedClass)
            image.classList.remove(CLASSNAME_NUXT_LAZY_IN_PROGRESS)

            const parentDiv = image.parentNode
            parentDiv?.classList.add(loadedClass)

            switch (status) {
                case StatusEnum.Success:
                    break
                case StatusEnum.Fail:
                    image.classList.add(CLASSNAME_NUXT_LAZY_FAIL)
                    break
                default:
                    break
            }
        }

        /**
         * 載入單張圖片
         */
        const loadImage = (lazyImage: any) => {
            // 如果已經載入或正在載入，跳過
            if (lazyImage.classList.contains(loadedClass) || 
                lazyImage.classList.contains(CLASSNAME_NUXT_LAZY_IN_PROGRESS)) {
                return
            }

            lazyImage.classList.add(CLASSNAME_NUXT_LAZY_IN_PROGRESS)
            if (lazyImage.dataset.src && lazyImage.dataset.src !== 'undefined') {
                const img = new Image()
                img.onload = (e) => {
                    if (img.height <= 1) {
                        imgLoaded(lazyImage, StatusEnum.Fail)
                    } else {
                        lazyImage.src = lazyImage.dataset.src
                        imgLoaded(lazyImage, StatusEnum.Success)
                    }
                }
                img.onerror = () => {
                    imgLoaded(lazyImage, StatusEnum.Fail)
                }
                img.src = lazyImage.dataset.src
            } else {
                imgLoaded(lazyImage, StatusEnum.Fail)
            }
        }

        // ⭐ 批次載入：如果指定了 immediateLoadCount，立即載入前 N 張圖片
        // 這確保初始可見的圖片會立即載入（解決 CSS Columns 佈局計算時機問題）
        if (immediateLoadCount > 0) {
            const imagesToLoadImmediately = lazyImages.slice(0, immediateLoadCount)
            imagesToLoadImmediately.forEach(function (lazyImage) {
                loadImage(lazyImage)
            })
        }

        /** Then we set up a intersection observer watching over those images and whenever any of those becomes visible on the view then replace the placeholder image with actual one, remove the non-loaded class and then unobserve for that element **/
        let lazyBackgroundImageObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target as any
                    lazyImage.classList.add(CLASSNAME_NUXT_LAZY_IN_PROGRESS)
                    if (lazyImage.dataset.src && lazyImage.dataset.src !== 'undefined') {
                        const img = new Image()
                        img.onload = (e) => {
                            if (img.height <= 1) {
                                imgLoaded(lazyImage, StatusEnum.Fail)
                            } else {
                                lazyImage.style.backgroundImage = `url(${lazyImage.dataset.src})`
                                imgLoaded(lazyImage, StatusEnum.Success)
                            }
                        }
                        img.onerror = () => {
                            imgLoaded(lazyImage, StatusEnum.Fail)
                        }
                        img.src = lazyImage.dataset.src
                    }
                    lazyBackgroundImageObserver.unobserve(lazyImage)
                }
            })
        })

        let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target as any
                    lazyImageObserver.unobserve(lazyImage) // 先 unobserve，避免重複觸發
                    loadImage(lazyImage)
                }
            })
        })

        /** Now observe all the non-loaded images using the observer we have setup above **/
        lazyImages.forEach(function (lazyImage: any) {
            // 只觀察尚未載入的圖片（排除已立即載入的）
            if (!lazyImage.classList.contains(loadedClass) && 
                !lazyImage.classList.contains(CLASSNAME_NUXT_LAZY_IN_PROGRESS)) {
                lazyImageObserver.observe(lazyImage)
            }
        })
        lazyBackgroundImages.forEach(function (lazyImage: any) {
            if (!lazyImage.classList.contains(loadedClass) && 
                !lazyImage.classList.contains(CLASSNAME_NUXT_LAZY_IN_PROGRESS)) {
                lazyBackgroundImageObserver.observe(lazyImage)
            }
        })
    }
    //#endregion

    //#region 通用工具函數
    /**
     * 判斷 URL 是否為外部連結
     * @param url - 要檢查的 URL
     * @returns 是否為外部連結
     */
    const isExternalURL = (url?: string | null): boolean => {
        if (!url) return false
        const regex = /^(https|http):\/\/(.*)$/
        return regex.test(url)
    }
    //#endregion

    return {
        provide: {
            // 裝置判斷
            isPc,
            isMobile,

            // 路由工具
            getToRealPath,
            isSamePathExcludeLocale,

            // API 請求取消
            useAbort,

            // 滾動相關
            scrollToElement,
            goTop,
            getWindowLoco,
            isLocoSmooth,

            // 圖片 Lazy Loading
            lazyLoadImage,

           // 通用工具
           isExternalURL,

           // 彈窗管理（簡化版）
           closePopups: (): void => {
               // 簡化版：關閉所有彈窗
               // 如果有彈窗元件，可以在這裡實作關閉邏輯
               // 例如：document.querySelectorAll('.popup').forEach(popup => popup.classList.remove('is-active'))
           },

           // Locomotive Scroll（可選，如果專案有使用）
           createLayoutLocomotive: (): void => {
               // 簡化版：建立 Locomotive Scroll
               // 如果專案有安裝 Locomotive Scroll，可以在這裡實作
               // 例如：import { LocomotiveScroll } from 'locomotive-scroll'
               // const scroll = new LocomotiveScroll({ el: document.querySelector('.locomotive-layout') })
           },
       },
   }
})

