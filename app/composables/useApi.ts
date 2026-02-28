/**
 * 統一 API 呼叫 Composable
 * 移植自 lrc-frontend-nuxt/app/composables/useApi.ts
 * 
 * 注意：此檔案已適配 fossil-Index 專案
 * - fossil-Index 主要使用 Firebase，此檔案保留作為未來擴展使用
 * - 如果需要 REST API 呼叫，可以使用此架構
 * 
 * 使用方式：
 * ```typescript
 * const { data, error } = await useApi.projects()()
 * ```
 */

/**
 * 統一 API 匯出
 * 
 * 目前 fossil-Index 使用 Firebase，此檔案保留作為未來擴展
 * 如果需要整合 REST API，可以在這裡添加 API 方法
 * 
 * 範例結構：
 * ```typescript
 * export const useApi = {
 *   // 專案相關 API
 *   projects: fetch<IProject[]>({
 *     path: '/api/projects',
 *     method: 'get',
 *   }),
 *   
 *   // 其他 API...
 * }
 * ```
 */
export const useApi = {
    // 目前為空，保留作為未來擴展
    // 如果需要 REST API，可以參考以下結構：
    
    // 範例：專案列表 API
    // projects: fetch<IProject[]>({
    //     path: '/api/projects',
    //     method: 'get',
    // }),
    
    // 範例：單一專案 API
    // project: (id: string) => fetch<IProject>({
    //     path: `/api/projects/${id}`,
    //     method: 'get',
    // }),
}

/**
 * 說明：
 * 
 * 1. fossil-Index 目前使用 Firebase (Firestore)
 *    - 資料操作透過 useProjects, useFossils 等 composables
 *    - 不需要 REST API 層
 * 
 * 2. 如果未來需要整合 REST API：
 *    - 可以參考 lrc-frontend-nuxt/app/api/common.ts 的 fetch 函數
 *    - 建立 app/api/ 目錄
 *    - 在此檔案中匯出 API 方法
 * 
 * 3. 如果需要 Token 認證：
 *    - 參考 lrc-frontend-nuxt/app/api/common.ts 的實作
 *    - 在 fetch 函數中加入 Authorization header
 *    - 實作 Token 刷新機制
 */

