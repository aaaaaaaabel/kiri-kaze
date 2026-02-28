/**
 * 全域狀態管理 Store
 * 移植自 lrc-frontend-nuxt/app/stores/index.ts
 * 
 * 管理頁面載入、過場動畫、路由等全域狀態
 * 已移除業務相關功能（會員、認證等）
 */

import { defineStore } from 'pinia'
import { action as actionIndex } from '../constants/store/actions'

/**
 * 預設狀態
 */
const defaultState = {
    // 頁面載入狀態
    isPageFinishedBeforeEnd: false,
    isPageTransitionFinished: false,
    isOpenTransitionFinished: false,
    isSiteOpenAnimationDone: false, // 開場動畫結束
    isLocomotiveScrollDone: false, // 第三方 smooth scroll 載入完成（如需要）
    
    // 路由狀態
    isSamePathExcludeLocale: true,
    pageLoading: false,
    isPagePosTop: false,
    pageKey: new Date().getTime(),
    
    // 頁面過場進度（用於控制何時顯示內容）
    PageFinishedBeforeEndProgress: 0.5,
    
    // 其他狀態
    isPageFocus: true,
    localeChanged: false,
}

/**
 * 預設 Getters
 */
const defaultGetters = {
    /**
     * 頁面載入結束 && 開場動畫結束
     */
    isPageOpenDoneAfter: (state: typeof defaultState) => {
        return state.isPageTransitionFinished && state.isOpenTransitionFinished
    },
    
    /**
     * 頁面載入進行中（開場動畫完成但過場未完成）
     */
    isPageOpenDoneInProgress: (state: typeof defaultState) => {
        return state.isPageTransitionFinished && state.isSiteOpenAnimationDone
    },
}

/**
 * 全域狀態 Store
 */
export const useGlobalStore = defineStore('global', {
    state: () => ({
        ...defaultState,
    }),
    
    getters: {
        ...defaultGetters,
    },
    
    actions: {
        /**
         * 設定頁面重新整理狀態
         */
        [actionIndex.SET_PAGE_REFRESHING](value: boolean): void {
            this.pageLoading = value
            if (typeof window !== 'undefined') {
                const className = 'page-refreshing' // CLASSNAME_PAGE_REFRESHING
                if (value) {
                    document.body.classList.add(className)
                } else {
                    document.body.classList.remove(className)
                }
            }
        },
        
        /**
         * 設定頁面載入完成（過場動畫開始前）
         */
        [actionIndex.SET_PAGE_FINISHED_BEFROE_END](value: boolean): void {
            this.isPageFinishedBeforeEnd = value
        },
        
        /**
         * 設定頁面過場動畫完成
         */
        [actionIndex.SET_PAGE_TRANSITION_FINISHED](value: boolean): void {
            this.isPageTransitionFinished = value
        },
        
        /**
         * 設定開場動畫完成
         */
        [actionIndex.SET_SITE_OPEN_ANIMATION_DONE](value: boolean): void {
            this.isSiteOpenAnimationDone = value
        },
        
        /**
         * 設定開場過場動畫完成
         */
        [actionIndex.SET_OPEN_TRANSITION_FINISHED](value: boolean): void {
            this.isOpenTransitionFinished = value
        },
        
        /**
         * 設定 Locomotive Scroll 載入完成
         */
        [actionIndex.SET_LOCOMOTIVESCROLL_DONE](value: boolean): void {
            this.isLocomotiveScrollDone = value
        },
    },
})

