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
            <img :src="imageSrc" alt="Portfolio" >
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
interface Props {
    circleText?: string
    imageIndex?: number // 0-3，對應 footer 的 point0.svg ~ point3.svg
}

const props = withDefaults(defineProps<Props>(), {
    circleText: 'Portfolio · Portfolio · Portfolio · Portfolio · ',
    imageIndex: 0,
});

// 圖片路徑（使用 footer 的圖片）
const imageSrc = computed(() => `/images/case/branding/point${props.imageIndex}.svg`);
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.portfolio-circle-button {
    position: fixed;
    right: 60px;
    bottom: 60px;
    z-index: 100;
    display: inline-block;
    padding: 0;
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    text-decoration: none;
    pointer-events: auto;
    cursor: pointer;
    background: none;
    border: none;
    clip-path: circle(40% at 50% 50%);
    transition: 0.25s ease-in-out;

    @include tb {
        right: 40px;
        bottom: 40px;
    }

    @include sp {
        right: 30px;
        bottom: 30px;
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
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 17px;
            fill: $color-primary;

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
            width: 80px;
            max-width: 100%;
            height: auto;
            height: 80px;
            vertical-align: top;

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

