<template>
    <NuxtLink to="/portfolio" class="portfolio-circle-button">
        <svg class="portfolio-circle-button__textcircle" viewBox="0 0 500 500">
            <defs>
                <path id="textcircle-portfolio" d="M250,400 a150,150 0 0,1 0,-300a150,150 0 0,1 0,300Z" />
            </defs>
            <text>
                <textPath href="#textcircle-portfolio" textLength="850">
                    {{ circleText }}
                </textPath>
            </text>
        </svg>
        <div class="portfolio-circle-button__content">
            <img :src="imageSrc" alt="Portfolio" />
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
    circleText?: string
    imageIndex?: number // 0-3，對應 footer 的 point0.svg ~ point3.svg
}

const props = withDefaults(defineProps<Props>(), {
    circleText: 'Portfolio · Portfolio · Portfolio · Portfolio · ',
    imageIndex: 0,
})

// 圖片路徑（使用 footer 的圖片）
const imageSrc = computed(() => `/images/case/branding/point${props.imageIndex}.svg`)
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.portfolio-circle-button {
    position: fixed;
    bottom: 60px;
    right: 60px;
    z-index: 100;
    border: none;
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    display: inline-block;
    transition: 0.25s ease-in-out;
    pointer-events: auto;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    background: none;
    padding: 0;
    clip-path: circle(40% at 50% 50%);

    @include tb {
        bottom: 40px;
        right: 40px;
    }

    @include sp {
        bottom: 30px;
        right: 30px;
    }

    &__textcircle {
        position: relative;
        display: block;
        width: 200px;
        height: 200px;
        animation: portfolio-rotate 7s linear infinite;

        @include tb {
            width: 160px;
            height: 160px;
        }

        @include sp {
            width: 120px;
            height: 120px;
        }

        text {
            font-size: 32px;
            text-transform: uppercase;
            fill: $color-primary;
            font-weight: 500;
            letter-spacing: 17px;

            @include tb {
                font-size: 26px;
                letter-spacing: 14px;
            }

            @include sp {
                font-size: 20px;
                letter-spacing: 10px;
            }
        }
    }

    &__content {
        position: absolute;
        inset: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;

        @include tb {
            inset: 40px;
        }

        @include sp {
            inset: 30px;
        }

        img {
            max-width: 100%;
            height: auto;
            vertical-align: top;
            width: 80px;
            height: 80px;

            @include tb {
                width: 60px;
                height: 60px;
            }

            @include sp {
                width: 50px;
                height: 50px;
            }
        }
    }

    &:hover {
        opacity: 0.8;
        transform: scale(1.05);
    }
}

@keyframes portfolio-rotate {
    to {
        transform: rotate(-360deg);
    }
}
</style>

