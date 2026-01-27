/**
 * 共用型別定義
 */

/** 排序方向 */
export type SortDirection = 'asc' | 'desc'

/** 分頁選項 */
export interface IPaginationOptions {
    /** 每頁筆數 */
    pageSize?: number
    /** 最後一筆文件的 ID (用於分頁) */
    lastDocId?: string
}

