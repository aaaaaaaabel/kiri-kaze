/**
 * Firebase Storage 工具 Composable
 * 提供 Storage URL 轉換功能
 */

import { getStorageUrl, isStorageUrl, extractStoragePath } from '~/utils/storage'
import { useFirebaseConfig } from '~/composables/useFirebaseConfig'

/**
 * 使用 Firebase Storage 工具
 */
export const useStorage = () => {
    const { storageBucket } = useFirebaseConfig();
    const bucket = storageBucket as string | undefined;

    const toStorageUrl = (path: string): string => {
        return getStorageUrl(path, bucket);
    };
    
    /**
     * 檢查 URL 是否為 Firebase Storage URL
     */
    const isStorage = (url: string): boolean => {
        return isStorageUrl(url)
    }
    
    /**
     * 從完整的 Firebase Storage URL 提取相對路徑
     */
    const toStoragePath = (url: string): string => {
        return extractStoragePath(url)
    }
    
    return {
        toStorageUrl,
        isStorage,
        toStoragePath,
    }
}

