/**
 * Widget Blocks Events Composable
 * 移植自 lrc-frontend-nuxt/app/composables/useWidgetsBlocksEvents.ts
 * 
 * 用於追蹤頁面區塊載入狀態和頁面過場狀態
 */

import { reactive } from 'vue'

/**
 * Widget 區塊載入狀態
 */
const widgetsBlockState = reactive({
    loadComplete: false,
})

/**
 * 頁面過場狀態
 */
const pageTransitionState = reactive({
    loadComplete: true,
})

/**
 * Widget Blocks Events Composable
 * 
 * @returns 提供狀態管理和切換方法
 */
export function useWidgetsBlocksEvents() {
    /**
     * 切換 Widget 區塊載入完成狀態
     * @param value - 是否載入完成
     */
    const toggleWidgetsBlockComplete = (value: boolean): void => {
        widgetsBlockState.loadComplete = value
    }

    /**
     * 切換頁面過場完成狀態
     * @param value - 是否過場完成
     */
    const togglePageTransitionComplete = (value: boolean): void => {
        pageTransitionState.loadComplete = value
    }

    return {
        widgetsBlockState,
        pageTransitionState,
        toggleWidgetsBlockComplete,
        togglePageTransitionComplete,
    }
}

