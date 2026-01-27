<template>
    <div class="loading" :class="{ 'loading--on': isLoading, 'loading--off': !isLoading }">
        <div class="loading_inner">
            <div class="loading_label" :class="{ 'loading_label--visible': isOpening }">
                <div>
                    <img src="/images/trilobite.png" alt="" />
                </div>
                <div>
                    <img src="/images/trilobite_2.png" alt="" />
                </div>
                <div>
                    <img src="/images/trilobite_3.png" alt="" />
                </div>
                <div>
                    <img src="/images/trilobite_4.png" alt="" />
                </div>
                <div>
                    <img src="/images/ammonite.png" alt="" />
                </div>
            </div>
            <div class="loading_circle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    isOpening: boolean
    isLoading: boolean
}

defineProps<Props>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.loading {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    cursor: default;
    pointer-events: none;
    z-index: 200;
    background-color: transparent;

    &--on {
        background-color: rgba(255, 255, 255, 1);
        z-index: 400;
    }

    &--off {
        animation: loadingOff0 0.5s ease-out forwards;
    }
}

@keyframes loadingOff0 {
    0% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}

.loading_inner {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.loading_circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    background-color: rgba(255, 255, 255, 1);
    transform: scale(0);
    margin: -50% 0 0 -50%;

    .loading--on & {
        animation: loadingOn0 0.5s ease-in forwards;
    }

    .loading--off & {
        transform: scale(1);
    }
}

@keyframes loadingOn0 {
    0% {
        transform: scale(0);
    }
    100% {
        transform: scale(1);
    }
}

.loading_label {
    display: none;
    width: 50%;
    max-width: 600px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    -webkit-transform: translateY(-50%) translateX(-50%);
    font-size: 0;
    line-height: 0;

    &--visible {
        display: block;
    }

    div {
        display: inline-block;
        width: 20%;
        transform: scale(0);

        img {
            width: 100%;
            overflow: hidden;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            pointer-events: auto;
        }
    }

    // Opening 動畫
    .loading--on & > div:nth-child(1) {
        animation: openingOn0 0.5s ease-in-out 50ms forwards;
    }

    .loading--on & > div:nth-child(2) {
        animation: openingOn0 0.5s ease-in-out 0.1s forwards;
    }

    .loading--on & > div:nth-child(3) {
        animation: openingOn0 0.5s ease-in-out 0.15s forwards;
    }

    .loading--on & > div:nth-child(4) {
        animation: openingOn0 0.5s ease-in-out 0.2s forwards;
    }

    .loading--on & > div:nth-child(5) {
        animation: openingOn0 0.5s ease-in-out 0.25s forwards;
    }

    .loading--on & > div:nth-child(1) img,
    .loading--on & > div:nth-child(2) img,
    .loading--on & > div:nth-child(3) img,
    .loading--on & > div:nth-child(4) img,
    .loading--on & > div:nth-child(5) img {
        animation: openingOn1 2s ease-in-out infinite;
    }

    .loading--off & div {
        transform: scale(1);
    }
}

@keyframes openingOn0 {
    0% {
        transform: scale(0);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes openingOn1 {
    0%,
    100% {
        transform: rotate(0);
        transform-origin: left bottom;
    }
    22% {
        transform: rotate(5deg);
        transform-origin: right bottom;
    }
    44% {
        transform: rotate(-5deg);
        transform-origin: left bottom;
    }
    66% {
        transform: rotate(2.5deg);
        transform-origin: right bottom;
    }
    77% {
        transform: rotate(-1.25deg);
        transform-origin: left bottom;
    }
    88% {
        transform: rotate(0.625deg);
        transform-origin: right bottom;
    }
}

@include tb {
    .loading_label {
        width: 100%;
        max-width: 100%;
        padding: 0 120px;
    }
}

@include sp {
    .loading_label {
        width: 100%;
        max-width: 100%;
        padding: 0 30px;

        div {
            width: calc(100% / 3);
        }

        > div:nth-last-child(1),
        > div:nth-last-child(2) {
            display: none;
        }
    }
}
</style>

