/**
 * 通用工具函數
 * 移植自 lrc-frontend-nuxt/app/utils/common.ts
 * 
 * 已移除業務相關功能：
 * - Widget 相關函數
 * - Opening Hours 相關函數
 * - 會員相關函數
 * - 日期格式化相關（保留基本功能）
 * 
 * 保留的通用功能：
 * - 視窗尺寸取得
 * - 數字格式化
 * - 字串處理
 * - 物件操作
 * - URL 判斷
 * - 圖片載入
 */

//#region 視窗尺寸相關
/**
 * 取得視窗寬度
 * @returns 視窗寬度（px）
 */
export const GetWindowWidth = (): number => {
    if (typeof window === 'undefined') return 0
    if (window.innerWidth) {
        return window.innerWidth
    }
    if (document.documentElement && document.documentElement.clientWidth) {
        return document.documentElement.clientWidth
    }
    if (document.body) {
        return document.body.clientWidth
    }
    return 0
}

/**
 * 取得視窗高度
 * @returns 視窗高度（px）
 */
export const GetWindowHeight = (): number => {
    if (typeof window === 'undefined') return 0
    if (window.innerHeight) {
        return window.innerHeight
    }
    if (document.documentElement && document.documentElement.clientHeight) {
        return document.documentElement.clientHeight
    }
    if (document.body) {
        return document.body.clientHeight
    }
    return 0
}
//#endregion

//#region HTML 狀態管理
/**
 * 設定 HTML ready 狀態（添加 is-ready class）
 * 用於標記頁面已準備好顯示內容
 */
export const setHtmlReady = (): void => {
    if (import.meta.client) {
        const html = document.documentElement
        html?.classList.add('is-ready')
    }
}

/**
 * 移除 HTML ready 狀態（移除 is-ready class）
 */
export const removeHtmlReady = (): void => {
    if (import.meta.client) {
        const html = document.documentElement
        html?.classList.remove('is-ready')
    }
}
//#endregion

//#region Hash 相關
/**
 * 檢查 hash 對應的元素是否存在
 * @param hash - Hash 字串（例如 "#section"）
 * @returns 元素是否存在
 */
export const hasHashElement = (hash: string): boolean => {
    if (import.meta.client && hash) {
        try {
            const hashElem = document.querySelector(hash)
            return !!hashElem
        } catch (error) {
            return false
        }
    }
    return false
}
//#endregion

//#region 隨機數相關
/**
 * 產生指定範圍的隨機數
 * @param min - 最小值
 * @param max - 最大值
 * @returns 隨機數
 */
export const jsRandom = (min: number, max: number): number => {
    return Math.random() * (max - min) + min
}

/**
 * 產生指定範圍的隨機整數（向下取整）
 * @param min - 最小值
 * @param max - 最大值
 * @returns 隨機整數
 */
export const jsRandomFloor = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min) + min)
}
//#endregion

//#region 數字驗證與格式化
/**
 * 限制輸入只能為數字（用於 keypress 事件）
 * @param event - KeyboardEvent
 */
export const onlyNumber = (event: KeyboardEvent): void => {
    if (!/\d/.test(event.key)) {
        event.preventDefault()
    }
}

/**
 * 判斷字串是否只包含數字
 * @param value - 要檢查的值
 * @returns 是否只包含數字
 */
export const isInt = (value: string | number): boolean => {
    return /^[0-9]+$/.test(String(value))
}

/**
 * 數字格式化（千位數逗號）
 * @param params - 格式化參數
 * @param params.value - 要格式化的數字
 * @param params.locales - 地區設定（預設 'en'）
 * @param params.options - Intl.NumberFormat 選項
 * @returns 格式化後的數字字串
 */
export const numberFormat = ({
    locales = 'en',
    options = { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    value,
}: {
    locales?: Intl.LocalesArgument
    options?: Intl.NumberFormatOptions
    value: number
}): string => {
    return Number(value).toLocaleString(locales, options)
}

/**
 * 限制輸入只能為數字（用於 keypress 事件）
 * @param event - KeyboardEvent
 */
export const keypressOnlyNumber = (event: KeyboardEvent): void => {
    if (!/\d/.test(event.key)) {
        event.preventDefault()
    }
}

/**
 * 限制輸入只能為數字和加號（用於 keypress 事件）
 * @param event - KeyboardEvent
 */
export const keypressOnlyNumberPlus = (event: KeyboardEvent): void => {
    if (!/[\d\+]/.test(event.key)) {
        event.preventDefault()
    }
}
//#endregion

//#region 物件操作
/**
 * 解除 Vue reactive 響應式包裝
 * 將 reactive/ref 物件轉換為普通物件
 * 
 * @param sourceObj - 來源物件
 * @returns 普通物件
 */
export const deepToRaw = <T extends Record<string, any>>(sourceObj: T): T => {
    const objectIterator = (input: any): any => {
        if (input instanceof Date) {
            return new Date(input)
        }
        if (Array.isArray(input)) {
            return input.map((item) => objectIterator(item))
        }
        if (isRef(input) || isReactive(input) || isProxy(input)) {
            return objectIterator(toRaw(input))
        }
        if (input && typeof input === 'object') {
            return Object.keys(input).reduce((acc, key) => {
                acc[key as keyof typeof acc] = objectIterator(input[key])
                return acc
            }, {} as T)
        }
        return input
    }

    return objectIterator(sourceObj)
}

/**
 * 刪除物件內指定的 keys
 * @param obj - 來源物件
 * @param keys - 要刪除的 key 陣列
 */
export const deleteObjectKeys = <T extends Record<string, any>>(obj: T, keys: string[]): void => {
    keys.forEach((key) => {
        delete obj[key]
    })
}

/**
 * 清理物件中的空值
 * 移除 undefined、null、空字串、空陣列
 * 
 * @param obj - 來源物件
 * @returns 清理後的物件或 undefined
 */
export const cleanEmpty = <T extends Record<string, any>>(obj: T): T | undefined => {
    const isEmpty = (v: any): boolean => v === '' || v === null || v === undefined

    const _clean = (value: any): any => {
        // Array
        if (Array.isArray(value)) {
            const arr = value.map((v) => _clean(v)).filter((v) => v !== undefined)
            return arr.length > 0 ? arr : []
        }

        // Object
        if (value !== null && typeof value === 'object') {
            const result: any = {}

            Object.entries(value).forEach(([k, v]) => {
                const cleaned = _clean(v)
                if (cleaned !== undefined && cleaned !== '') {
                    result[k] = cleaned
                }
            })

            return Object.keys(result).length > 0 ? result : undefined
        }

        return isEmpty(value) ? undefined : value
    }

    const cleaned = _clean(obj)

    if (cleaned === undefined) return undefined

    // 第一層空 array → 刪掉
    Object.entries(cleaned).forEach(([key, val]) => {
        if (Array.isArray(val) && val.length === 0) {
            delete (cleaned as any)[key]
        }
    })

    return cleaned as T
}
//#endregion

//#region API 相關
/**
 * 判斷錯誤是否為 API 取消錯誤
 * @param cause - 錯誤原因字串
 * @returns 是否為取消錯誤
 */
export const isApiCancel = (cause?: string): boolean => {
    return !cause ? false : cause.indexOf('AbortError') > -1
}
//#endregion

//#region 圖片相關
/**
 * 載入圖片並回傳 Promise
 * @param img_src - 圖片 URL
 * @returns Promise<string> - 成功回傳 URL，失敗回傳空字串
 */
export const imageLoad = (img_src?: string): Promise<string> => {
    return new Promise((resolve) => {
        if (!img_src) {
            resolve('')
            return
        }
        if (typeof img_src === 'string') {
            const img = new Image()
            img.onload = () => {
                if (img.height <= 1) {
                    resolve('')
                } else {
                    resolve(img_src)
                }
            }
            img.onerror = () => {
                resolve('')
            }
            img.src = img_src
        } else {
            resolve('')
        }
    })
}

/**
 * 檢查 CMS 編輯器中的圖片是否損壞
 * @param el - 要檢查的元素
 */
export const checkCmsEditorImage = (el?: HTMLElement | null): void => {
    if (el) {
        el.querySelectorAll('img').forEach((img) => {
            const n_image = new Image()
            n_image.onerror = () => {
                img.classList.add('image--broken')
                img.src = '/images/transparent0.png' // 使用專案中的透明圖片
            }
            n_image.src = img.src
        })
    }
}
//#endregion

//#region 日期相關（基本功能）
/**
 * 移除日期字串開頭的 "+"
 * @param s - 日期字串
 * @returns 處理後的日期字串
 */
export const cleanDateStr = (s?: string): string => {
    return s?.replace(/^\+/, '') || ''
}

/**
 * 取得兩個日期之間的所有日期
 * @param startDate - 起始日期
 * @param endDate - 結束日期
 * @returns 日期陣列
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
}
//#endregion

//#region DOM 相關
/**
 * 取得 header 元素
 * @returns header 元素或 undefined
 */
export const getHeaderElement = (): HTMLElement | undefined => {
    if (typeof document !== 'undefined') {
        return document.querySelector('header') || undefined
    }
    return undefined
}

/**
 * 偵測 window scroll 是否已經超過某個 section 元素的頂端
 * 
 * @param element - 可以是 HTMLElement、CSS selector 字串，或 null/undefined
 * @returns number | boolean
 *   - false → 元素尚未滑到視窗頂端或無效元素
 *   - window.scrollY → 已經超過元素頂端，回傳目前 scrollY
 */
export const isOverSection = (element?: HTMLElement | string | null): number | boolean => {
    if (import.meta.server) return false

    let _element: HTMLElement | null = null
    switch (true) {
        case typeof element === 'string':
            _element = document.querySelector(element)
            break
        case element instanceof HTMLElement:
            _element = element
            break
        case element === null || element === undefined:
        default:
            return false
    }

    if (_element) {
        const c_rect = _element.getBoundingClientRect()
        if (c_rect.top > 0) {
            return false
        }
    }

    return window.scrollY
}

/**
 * 將頁面滾動到指定元素的頂端
 * 
 * @param params - 滾動參數
 * @param params.element - 可以是 HTMLElement、CSS selector 字串，或 null/undefined
 * @param params.options - 滾動選項
 * @returns Promise<boolean> - 滾動完成後 resolve true
 * 
 * 使用方法：
 * ```typescript
 * await ScrollToSectionTop({ element: '#sectionId' })
 * await ScrollToSectionTop({ element: htmlElement })
 * ```
 */
export const ScrollToSectionTop = async ({
    element,
    options,
}: {
    element?: HTMLElement | string | null
    options?: {
        duration?: number
        offset?: number
        immediate?: boolean
    }
}): Promise<boolean> => {
    const nuxtApp = useNuxtApp()
    await nextTick()

    let _element: HTMLElement | null = null
    switch (true) {
        case typeof element === 'string':
            _element = document.querySelector(element)
            break
        case element instanceof HTMLElement:
            _element = element
            break
    }

    return new Promise(async (resolve) => {
        if (import.meta.client && nuxtApp.$scrollToElement) {
            nuxtApp.$scrollToElement({
                params: {
                    target: _element ? _element : 0,
                    options,
                },
            }).finally(() => {
                resolve(true)
            })
        } else {
            resolve(true)
        }
    })
}
//#endregion

//#region URL 相關
/**
 * 判斷 URL 是否為外部連結
 * @param url - 要檢查的 URL
 * @returns 是否為外部連結
 */
export const isExternalURL = (url?: string | null): boolean => {
    if (!url) return false
    const regex = /^(https|http):\/\/(.*)$/
    return regex.test(url)
}

/**
 * 判斷 URL 是否為影片
 * @param input - 要檢查的 URL
 * @returns 是否為影片
 */
export const isVideo = (input?: string): boolean => {
    if (!input) return false

    const videoExtensions = ['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv', '.wmv', '.flv']
    const lower = input.toLowerCase()
    return videoExtensions.some((ext) => lower.endsWith(ext))
}
//#endregion

//#region 字串處理
/**
 * 格式化電話號碼（最後 4 碼前加空格）
 * @param num - 電話號碼
 * @returns 格式化後的電話號碼
 */
export const formatPhone = (num: string | number): string => {
    const s = String(num)
    return s.slice(0, -4) + ' ' + s.slice(-4)
}
//#endregion

