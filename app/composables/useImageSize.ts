/**
 * 圖片尺寸取得工具
 * 用於動態取得圖片真實尺寸，支援瀑布流佈局
 */

export const useImageSize = () => {
    /**
     * 載入圖片並取得尺寸
     * @param src 圖片路徑
     * @returns Promise<{width: number, height: number}>
     */
    const loadImageSize = (src: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            // 只在客戶端執行
            if (import.meta.server || typeof window === 'undefined') {
                // SSR 時返回預設尺寸
                resolve({ width: 800, height: 600 })
                return
            }

            // 確保在客戶端執行
            if (typeof Image === 'undefined') {
                resolve({ width: 800, height: 600 })
                return
            }

            const img = new Image()
            // 使用絕對路徑，避免被 Vue Router 攔截
            // 注意：不要使用 window.location.origin，因為這會觸發路由檢查
            // 直接使用相對路徑即可，瀏覽器會正確處理
            img.src = src
            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                })
            }
            img.onerror = (error) => {
                console.warn(`⚠️ 圖片載入失敗: ${src}，使用預設尺寸`, error)
                // 記錄失敗的圖片路徑，方便除錯
                if (process.client && (window as any).failedImages) {
                    (window as any).failedImages.push(src)
                } else if (process.client) {
                    (window as any).failedImages = [src]
                }
                resolve({ width: 800, height: 600 })
            }
        })
    }

    /**
     * 批次載入多張圖片尺寸
     * @param srcs 圖片路徑陣列
     * @returns Promise<Array<{width: number, height: number}>>
     */
    const loadImageSizes = async (srcs: string[]): Promise<Array<{ width: number; height: number }>> => {
        const promises = srcs.map((src) => loadImageSize(src).catch(() => ({ width: 0, height: 0 })))
        return Promise.all(promises)
    }

    return {
        loadImageSize,
        loadImageSizes,
    }
}

