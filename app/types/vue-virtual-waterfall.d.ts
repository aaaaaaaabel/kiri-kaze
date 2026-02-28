/**
 * vue-virtual-waterfall 類型定義
 */
declare module 'vue-virtual-waterfall' {
    import { Component } from 'vue'

    export interface VirtualWaterfallProps {
        data: any[]
        columnWidth?: number
        gap?: number
        columnCount?: number
    }

    export const VirtualWaterfall: Component<VirtualWaterfallProps>
}

