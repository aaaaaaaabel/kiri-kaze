<template>
    <div class="grid_list" :class="[`grid_list${gridClass}`, { 'grid_list_on': isHovered }]">
        <NuxtLink 
            :to="`/portfolio/${project.slug}`" 
            class="grid_link link"
            @mouseenter="isHovered = true"
            @mouseleave="isHovered = false"
        >
            <div ref="numberRef" class="grid_number">
                <span></span>
                <p class="kerning en0">{{ index + 1 }}</p>
            </div>
            <div ref="imageRef" class="grid_img">
                <img src="/images/transparent0.png" alt="" />
                <!-- 第一個 div：顯示 thumbnail（預設顯示） -->
                <div>
                    <div>
                        <img ref="thumbnailRef" :src="project.thumbnail" :alt="project.title" loading="lazy" />
                    </div>
                </div>
                <!-- 第二個 div：顯示 cover（hover 時顯示，參考 kiri 結構） -->
                <div>
                    <div>
                        <img :src="project.images?.[0]?.url || project.thumbnail" :alt="project.title" loading="lazy" />
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

// Grid class based on index
const gridClass = computed(() => {
    const classes: string[] = ['0', '1', '2', '3']
    return classes[props.index % 4] ?? '0'
})

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
            }
        }
    }

    // 第一個 div (nth-child(2))：預設顯示
    > div:nth-child(2) {
        transform: scale(1);
        z-index: 20;
    }

    // 第二個 div (nth-child(3))：預設隱藏
    > div:nth-child(3) {
        transform: scale(0);
        z-index: 10;
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

    // grid_list_on 狀態（hover 時）
    .grid_list_on .grid_number span {
        transform: rotate(-15deg) scale(1);
    }

    .grid_list_on .grid_number p {
        color: rgba(255, 255, 255, 1);
        transform: rotate(-15deg);
    }

    // hover 時切換到第二個 div（nth-child(3)）
    .grid_list_on .grid_img > div:nth-child(2) {
        transform: scale(0);
    }

    .grid_list_on .grid_img > div:nth-child(3) {
        transform: scale(1);
    }

    .grid_list_on .grid_img > div:nth-child(2) > div {
        transform: rotate(15deg) scale(1.1);
    }

    .grid_list_on .grid_img > div:nth-child(3) > div {
        transform: rotate(15deg) scale(1.1);
    }

    // grid_list4 和 grid_list5 的特殊 hover 效果
    .grid_list4.grid_list_on .grid_number p,
    .grid_list5.grid_list_on .grid_number p {
        color: rgba(0, 0, 0, 1);
    }

    .grid_list4.grid_list_on .grid_img > div:nth-child(3) > div {
        transform: rotate(15deg) scale(1.1);
    }

    .grid_list5.grid_list_on .grid_img > div:nth-child(2) > div {
        transform: rotate(15deg);
    }
}
</style>
