<template>
    <div class="fix">
        <div class="fix_inner">
            <div class="fix_switch">
                <button @click="toggleView" class="switch_link" :class="{ 'switch_link--active': isGridView }">
                    <div class="switch_contents">
                        <p class="kerning ja0">項目顯示</p>
                        <p class="kerning ja0">圖片顯示</p>
                        <span></span>
                    </div>
                    <div class="switch_border"></div>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isGridView = ref(true) // true = 項目顯示, false = 圖片顯示

const toggleView = () => {
    isGridView.value = !isGridView.value
    // TODO: 觸發視圖切換事件
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.fix {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 250;

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
    @include transition(left, 0.5s);

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
        @include transition(left, 0.5s);
    }
}

.switch_link--active .switch_contents {
    left: 25px;
    transform: translateX(-50%);

    span {
        left: 50%;
    }
}

.switch_link:not(.switch_link--active) .switch_contents {
    left: -25px;
    transform: translateX(0);

    span {
        left: 0;
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

