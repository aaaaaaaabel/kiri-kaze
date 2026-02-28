<template>
    <div class="grid_list" :class="[`grid_list${gridClass}`, { 'grid_list_on': isHovered, 'grid_list_off': isHoveredOff }, viewModeClass]">
        <NuxtLink 
            :to="projectLink"
            class="grid_link link"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
            @click="!hasValidSlug ? $event.preventDefault() : undefined"
        >
            <div ref="numberRef" class="grid_number">
                <span></span>
                <p class="kiri en0">{{ index + 1 }}</p>
            </div>
            <div ref="imageRef" class="grid_img">
                <!-- ⭐ 優化：移除透明佔位圖，減少不必要的圖片請求 -->
                <!-- 第一個 div：顯示 thumbnail（預設顯示） -->
                <div>
                    <div>
                        <img 
                            ref="thumbnailRef" 
                            :data-src="thumbnailUrl" 
                            :alt="project.title" 
                            data-manual-lazy
                        />
                    </div>
                </div>
                <!-- 第二個 div：顯示 cover（grid_image 模式顯示，參考 kiri 結構） -->
                <div>
                    <div>
                        <img 
                            :data-src="coverUrl" 
                            :alt="project.title" 
                            data-manual-lazy
                        />
                    </div>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
import type { IProject } from '~/types/portfolio'
import { ref, computed, onMounted } from 'vue'
import { useMotion } from '@vueuse/motion'
import { usePortfolioView } from '~/composables/usePortfolioView'
import { useStorage } from '~/composables/useStorage'

interface Props {
    project: IProject
    index: number
    animationDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
    animationDelay: 0,
})

// Refs for motion
const numberRef = ref<HTMLElement>()
const imageRef = ref<HTMLElement>()
const thumbnailRef = ref<HTMLImageElement>()
const isHovered = ref(false)
const isHoveredOff = ref(false)

// Portfolio view mode
const { viewMode } = usePortfolioView()

// Storage URL 轉換
const { storageBucket } = useFirebaseConfig()
const { getStorageUrl } = await import('~/utils/storage')
const convertUrl = (url: string) => {
    if (!url || url.startsWith('http://') || url.startsWith('https://')) return url
    return storageBucket ? getStorageUrl(url, storageBucket) : url
}

const thumbnailUrl = computed(() => convertUrl(props.project.thumbnail || ''))
const coverUrl = computed(() => {
    const cover = props.project.cover || props.project.images?.[0]?.url || props.project.thumbnail
    return convertUrl(cover || '')
})

// Grid class based on index
const gridClass = computed(() => {
    const classes: string[] = ['0', '1', '2', '3']
    return classes[props.index % 4] ?? '0'
})

// View mode class for CSS control
const viewModeClass = computed(() => {
    return viewMode.value === 'grid' ? 'grid_item' : 'grid_image'
})

/**
 * 作品內頁連結（避免 slug 缺失導致 /portfolio/undefined -> 404）
 * - 有 slug：`/portfolio/${encodeURIComponent(slug)}`
 * - 無 slug：回到列表頁，並在 click 時阻止導向
 */
const hasValidSlug = computed(() => {
    return typeof props.project.slug === 'string' && props.project.slug.trim().length > 0
})

const projectLink = computed(() => {
    if (!hasValidSlug.value) return '/portfolio'
    return `/portfolio/${encodeURIComponent(props.project.slug.trim())}`
})

// Handle hover events for shake animation
const handleMouseEnter = () => {
    isHoveredOff.value = false
    isHovered.value = true
}

const handleMouseLeave = () => {
    isHovered.value = false
    isHoveredOff.value = true
    // 動畫結束後移除 class
    setTimeout(() => {
        isHoveredOff.value = false
    }, 2000)
}

// Animation delays
const imageDelay = computed(() => props.animationDelay)
const numberDelay = computed(() => props.animationDelay + 500)

onMounted(() => {
    // Use @vueuse/motion for animations
    if (imageRef.value) {
        // Image scale animation
        useMotion(imageRef.value, {
            initial: { scale: 0 },
            enter: {
                scale: 1,
                transition: {
                    duration: 500,
                    delay: imageDelay.value,
                    ease: 'easeInOut',
                },
            },
        })
    }

    if (numberRef.value) {
        // Number scale animation
        useMotion(numberRef.value, {
            initial: { scale: 0 },
            enter: {
                scale: 1,
                transition: {
                    duration: 500,
                    delay: numberDelay.value,
                    ease: 'easeInOut',
                },
            },
        })
    }
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.grid_list {
    display: inline-block;
    vertical-align: top;
    width: 16.66666%;
    width: -webkit-calc(100% / 6);
    width: calc(100% / 6);
    position: relative;

    @media (max-width: 1399px) {
        width: 20%;
    }

    @media (max-width: 1199px) {
        width: 25%;
    }

    @include tb {
        width: calc(100% / 3);
    }

    @include sp {
        width: 50%;
    }
}

.grid_link {
    display: block;
    width: 100%;
    padding: 20px;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    position: relative;

    @include sp {
        padding: 15px;
    }
}

.grid_number {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 30;
    pointer-events: none;

    @include sp {
        top: 15px;
        left: 15px;
    }

    span {
        display: block;
        height: 40px;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-top: -20px;
        background-color: $color-accent;
        transform: rotate(0) scale(0);
        @include transition(transform, 0.25s);

        @include sp {
            height: 30px;
            margin-top: -15px;
        }
    }

    p {
        font-size: 12px;
        line-height: 12px;
        position: relative;
        color: $color-primary;
        @include transition(color, 0.25s);
        @include transition(transform, 0.25s);
        margin: 0;
    }
}

// grid_image 模式的數字顏色（參考 kiri）
.grid_image .grid_number p {
    color: rgba(255, 255, 255, 1);
}

// Grid number span 尺寸根據 grid_list class
.grid_list0 .grid_number span,
.grid_list1 .grid_number span {
    width: 40px;
    margin-left: -20px;

    @include sp {
        width: 30px;
        margin-left: -15px;
    }
}

.grid_list2 .grid_number span,
.grid_list3 .grid_number span {
    width: 60px;
    margin-left: -30px;

    @include sp {
        width: 45px;
        margin-left: -22.5px;
    }
}

.grid_list0 .grid_number span,
.grid_list2 .grid_number span {
    border-radius: 50%;
}

.grid_img {
    width: 100%;
    position: relative;
    padding-top: 100%; // Creates a square aspect ratio

    > img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    > div {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        overflow: hidden;
        @include transition(transform, 0.5s);

        > div {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            font-size: 0;
            line-height: 0;
            transform-origin: center center;
            @include transition(transform, 0.25s);

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                overflow: hidden;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                transform-origin: left bottom;
                will-change: transform;
            }
        }
    }

    // 根據視圖模式控制顯示（參考 kiri）
    // grid_item 模式：顯示第一個 div (nth-child(2))
    .grid_item & > div:nth-child(2) {
        transform: scale(1);
        z-index: 20;
    }

    .grid_item & > div:nth-child(3) {
        transform: scale(0);
        z-index: 10;
    }

    // grid_image 模式：顯示第二個 div (nth-child(3))
    .grid_image & > div:nth-child(2) {
        transform: scale(0);
        z-index: 10;
    }

    .grid_image & > div:nth-child(3) {
        transform: scale(1);
        z-index: 20;
    }
}

// PC hover 效果（使用 grid_list_on class，參考 kiri）
@include pc {
    .grid_img > div > div {
        @include transition(transform, 0.25s);
    }

    .grid_number span {
        @include transition(transform, 0.25s);
    }

    .grid_number p {
        @include transition(color, 0.25s);
        @include transition(transform, 0.25s);
    }

    // grid_list_on 狀態（hover 時）- 只影響數字和旋轉，不切換圖片
    .grid_list_on .grid_number span {
        transform: rotate(-15deg) scale(1);
    }

    .grid_list_on .grid_number p {
        color: rgba(255, 255, 255, 1);
        transform: rotate(-15deg);
    }

    // hover 時只旋轉圖片，不切換（參考 kiri）
    .grid_item .grid_list_on .grid_img > div:nth-child(2) > div {
        transform: rotate(15deg) scale(1.1);
    }

    .grid_image .grid_list_on .grid_img > div:nth-child(3) > div {
        transform: scale(1.1);
    }

    // hover 時停止動畫（參考 kiri）
    .grid_item .grid_list_on .grid_img div div img {
        animation: none !important;
    }

    .grid_image .grid_list_on .grid_img div div img {
        animation: none !important;
    }

    // 離開 hover 時觸發抖動動畫（參考 kiri 的 grid_list_off）
    .grid_item .grid_list_off .grid_img div div img {
        animation: grid_off_shake 2s ease-in-out forwards;
    }

    .grid_image .grid_list_off .grid_img div div img {
        animation: grid_off_shake 2s ease-in-out forwards;
    }

    // grid_list4 和 grid_list5 的特殊 hover 效果
    .grid_list4.grid_list_on .grid_number p,
    .grid_list5.grid_list_on .grid_number p {
        color: rgba(0, 0, 0, 1);
    }

    .grid_list4.grid_list_on .grid_img > div > div {
        transform: rotate(15deg) scale(1.1);
    }

    .grid_list5.grid_list_on .grid_img > div > div {
        transform: rotate(15deg);
    }
}

// 離開 hover 時的抖動動畫（參考 kiri 的 grid_off1 動畫）
@keyframes grid_off_shake {
    0%,
    100% {
        transform: rotate(0);
        transform-origin: left bottom;
    }
    22% {
        transform: rotate(1.5deg);
        transform-origin: right bottom;
    }
    44% {
        transform: rotate(-1.5deg);
        transform-origin: left bottom;
    }
    66% {
        transform: rotate(0.75deg);
        transform-origin: right bottom;
    }
    77% {
        transform: rotate(-0.375deg);
        transform-origin: left bottom;
    }
    88% {
        transform: rotate(0.1875deg);
        transform-origin: right bottom;
    }
}
</style>
