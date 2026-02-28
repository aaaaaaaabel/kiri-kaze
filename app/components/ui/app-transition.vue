<template>
    <div class="app-transition">
        <div class="app-transition__overlay"></div>
    </div>
</template>

<script lang="ts" setup></script>

<style scoped lang="scss">
/**
 * 應用程式過場動畫元件
 * 移植自 lrc-frontend-nuxt/app/components/ui/app-transition.vue
 * 
 * 簡化版本：使用 CSS transition 替代 SVG + GSAP
 * 如需更複雜的動畫效果，可以參考 LRC 的完整版本
 */

.app-transition {
    --duration_open: 0.6s;
    --duration_close: 0.6s;

    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100vw;
    z-index: 9200;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;

    /**
     * 動畫啟動狀態
     */
    &.is-active {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }

    /**
     * 動畫隱藏狀態（關閉動畫）
     */
    &.is-hide-active {
        opacity: 0;
        transition: opacity var(--duration_close) ease-in-out;
    }

    /**
     * 覆蓋層
     */
    &__overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 1);
        transform: scaleY(0);
        transform-origin: bottom;
        transition: transform var(--duration_open) ease-in-out;

        .is-active & {
            transform: scaleY(1);
        }
    }
}
</style>

