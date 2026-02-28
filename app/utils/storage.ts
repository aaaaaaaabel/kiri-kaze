/**
 * Firebase Storage URL 工具函數
 * 將相對路徑轉換為完整的 Firebase Storage URL
 */

/**
 * 將相對路徑轉換為完整的 Firebase Storage URL
 * 
 * @param path - Storage 中的相對路徑（例如：'images/portfolio/thumbnails/jianbutin.png'）
 * @param bucket - Firebase Storage bucket 名稱（可選，由呼叫端從 useFirebaseConfig 傳入）
 * @returns 完整的 Firebase Storage URL
 * 
 * @example
 * ```typescript
 * getStorageUrl('images/portfolio/thumbnails/jianbutin.png')
 * // => 'https://firebasestorage.googleapis.com/v0/b/fossil-index.appspot.com/o/images%2Fportfolio%2Fthumbnails%2Fjianbutin.png?alt=media'
 * ```
 */
export function getStorageUrl(path: string, bucket?: string): string {
    if (!path) return ''
    
    // 如果已經是完整 URL，直接返回
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path
    }
    
    // 如果是以 / 開頭的相對路徑（public 資料夾），直接返回
    if (path.startsWith('/')) {
        return path
    }
    
    // 如果沒有提供 bucket，無法在非 setup 上下文中取得，直接回傳原路徑
    let storageBucket = bucket
    if (!storageBucket) {
        if (import.meta.dev && typeof window !== 'undefined') {
            console.warn('⚠️ 無法取得 Firebase Storage bucket，請在呼叫端傳入 bucket 或於 setup 內使用 useStorage().toStorageUrl')
        }
        return path
    }
    
    // 移除開頭的斜線（如果有的話）
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    
    // 編碼路徑（將 / 轉換為 %2F）
    const encodedPath = encodeURIComponent(cleanPath)
    
    // 組合成完整的 Firebase Storage URL
    const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media`

    return storageUrl
}

/**
 * 檢查 URL 是否為 Firebase Storage URL
 * 
 * @param url - 要檢查的 URL
 * @returns 是否為 Firebase Storage URL
 */
export function isStorageUrl(url: string): boolean {
    if (!url) return false
    return url.includes('firebasestorage.googleapis.com')
}

/**
 * 從完整的 Firebase Storage URL 提取相對路徑
 * 
 * @param url - 完整的 Firebase Storage URL
 * @returns 相對路徑，如果不是 Storage URL 則返回原 URL
 * 
 * @example
 * ```typescript
 * extractStoragePath('https://firebasestorage.googleapis.com/v0/b/fossil-index.appspot.com/o/images%2Fportfolio%2Fthumbnails%2Fjianbutin.png?alt=media')
 * // => 'images/portfolio/thumbnails/jianbutin.png'
 * ```
 */
export function extractStoragePath(url: string): string {
    if (!url) return ''
    
    // 如果不是 Storage URL，直接返回
    if (!isStorageUrl(url)) {
        return url
    }
    
    try {
        // 從 URL 中提取編碼的路徑
        const match = url.match(/\/o\/([^?]+)/)
        if (match && match[1]) {
            // 解碼路徑
            return decodeURIComponent(match[1])
        }
    } catch (error) {
        console.warn('⚠️ 無法解析 Storage URL:', url, error)
    }
    
    return url
}

