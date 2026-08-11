<template>
    <div class="fix">
        <div class="fix_inner">
            <div class="fix_switch">
                <button class="switch_link" @click="toggleView">
                    <div class="switch_contents" :class="switchContentsClass">
                        <p class="tracking ja0">項目顯示</p>
                        <p class="tracking ja0">圖片顯示</p>
                        <span/>
                    </div>
                    <div class="switch_border"/>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePortfolioView } from '~/composables/usePortfolioView';

const { viewMode, toggleView } = usePortfolioView();

const switchContentsClass = computed(() => {
    return viewMode.value === 'grid' ? 'switch_contents--grid' : 'switch_contents--image';
});
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.fix {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 350; /* 高於 header (300)，避免被擋住無法點擊 */
    width: 100%;

    @include tb {
        position: absolute;
    }

    @include sp {
        position: absolute;
    }
}

.fix_inner {
    position: relative;
    width: 100%;
}

.fix_switch {
    position: absolute;
    top: 60px;
    right: 150px;
    width: 200px;
    height: 50px;

    @include tb {
        top: 170px;
        right: 50%;
        width: 50%;
        padding: 0 15px 0 60px;
    }

    @include sp {
        display: none;
    }

    button {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        overflow: hidden;
        cursor: pointer;
        background-color: $color-primary;
        border: none;
        border-radius: 25px;
    }
}

.switch_contents {
    position: absolute;
    top: 0;
    left: 25px;
    width: 400px;
    height: 50px;
    transform: translateX(-50%);
    transition-timing-function: ease-in-out;
    transition-duration: 0.5s;
    transition-property: left, transform;

    p {
        position: absolute;
        top: 0;
        width: 50%;
        margin: 0;
        font-size: 16px;
        line-height: 50px;
        color: rgb(255 255 255 / 100%);
        text-align: center;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    > p:nth-child(1) {
        left: 0;
        padding: 0 0 0 25px;
    }

    > p:nth-child(2) {
        left: 50%;
        padding: 0 25px 0 0;
    }

    span {
        position: absolute;
        top: 0;
        left: 50%;
        display: block;
        width: 50px;
        height: 50px;
        margin: 0 0 0 -25px;
        background-color: rgb(255 255 255 / 100%);
        border: 1px solid $color-accent;
        border-radius: 25px;

        // span 的 left 是固定的 50%，不會因為模式改變
        // span 的位置是通過 switch_contents 的移動來控制的
    }

    // grid 模式（項目顯示）- 白色圓形在右側
    // 只改變 switch_contents 的 left 和 transform
    // span 的 left: 50% 保持不變
    &--grid {
        left: 25px;
        transform: translateX(-50%);
    }

    // image 模式（圖片顯示）- 白色圓形在左側
    // 只改變 switch_contents 的 left 和 transform
    // span 的 left: 50% 保持不變
    &--image {
        left: -25px;
        transform: translateX(0);
    }
}

.switch_border {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    border: 1px solid $color-accent;
    border-radius: 25px;
}
</style>

