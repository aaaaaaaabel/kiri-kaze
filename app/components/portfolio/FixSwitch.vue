<template>
    <div class="fix">
        <div class="fix_inner">
            <div class="fix_switch">
                <button @click="toggleView" class="switch_link">
                    <div class="switch_contents" :class="switchContentsClass">
                        <p class="kiri ja0">項目顯示</p>
                        <p class="kiri ja0">圖片顯示</p>
                        <span></span>
                    </div>
                    <div class="switch_border"></div>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePortfolioView } from '~/composables/usePortfolioView'

const { viewMode, toggleView } = usePortfolioView()

const switchContentsClass = computed(() => {
    return viewMode.value === 'grid' ? 'switch_contents--grid' : 'switch_contents--image'
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.fix {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 350; /* 高於 header (300)，避免被擋住無法點擊 */

    @include tb {
        position: absolute;
    }

    @include sp {
        position: absolute;
    }
}

.fix_inner {
    width: 100%;
    position: relative;
}

.fix_switch {
    width: 200px;
    height: 50px;
    position: absolute;
    top: 60px;
    right: 150px;

    @include tb {
        width: 50%;
        top: 170px;
        right: 50%;
        padding: 0 15px 0 60px;
    }

    @include sp {
        display: none;
    }

    button {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
        border-radius: 25px;
        background-color: $color-primary;
        overflow: hidden;
        border: none;
        cursor: pointer;
        padding: 0;
        margin: 0;
    }
}

.switch_contents {
    width: 400px;
    height: 50px;
    position: absolute;
    top: 0;
    left: 25px;
    transform: translateX(-50%);
    transition-duration: 0.5s;
    transition-timing-function: ease-in-out;
    transition-property: left, transform;

    p {
        width: 50%;
        text-align: center;
        font-size: 16px;
        line-height: 50px;
        color: rgba(255, 255, 255, 1);
        position: absolute;
        top: 0;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        margin: 0;
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
        display: block;
        width: 50px;
        height: 50px;
        position: absolute;
        top: 0;
        left: 50%;
        margin: 0 0 0 -25px;
        border-radius: 25px;
        background-color: rgba(255, 255, 255, 1);
        border: 1px solid $color-accent;
        // 參考 kiri：span 的 left 是固定的 50%，不會因為模式改變
        // span 的位置是通過 switch_contents 的移動來控制的
    }

    // grid 模式（項目顯示）- 白色圓形在右側
    // 參考 kiri：只改變 switch_contents 的 left 和 transform
    // span 的 left: 50% 保持不變
    &--grid {
        left: 25px;
        transform: translateX(-50%);
    }

    // image 模式（圖片顯示）- 白色圓形在左側
    // 參考 kiri：只改變 switch_contents 的 left 和 transform
    // span 的 left: 50% 保持不變
    &--image {
        left: -25px;
        transform: translateX(0);
    }
}

.switch_border {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 25px;
    border: 1px solid $color-accent;
    pointer-events: none;
}
</style>


