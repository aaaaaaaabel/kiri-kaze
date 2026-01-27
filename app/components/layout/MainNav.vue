<template>
    <header class="header">
        <div class="header_inner">
            <div class="header_logo">
                <NuxtLink to="/portfolio" class="link">
                    <img src="/images/kirikaze_logo.png" alt="Fossil Index" />
                </NuxtLink>
            </div>
            <div class="header_button">
                <NuxtLink to="/portfolio" class="menu_link" :class="{ 'menu_link--active': isMenuOpen }">
                    <div><span></span></div>
                    <div><span></span></div>
                    <div><span></span></div>
                </NuxtLink>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)

// 移除 toggleMenu，因為現在是連結
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.header {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: $z-index-header;

    @include tb {
        position: fixed;
    }

    @include sp {
        position: fixed;
    }
}

.header_inner {
    width: 100%;
    position: relative;
}

.header_logo {
    height: 30px;
    position: absolute;
    top: 70px;
    left: 60px;

    @include tb {
        height: 24px;
        top: 41px;
        left: 30px;
    }

    @include sp {
        height: 20px;
        top: 30px;
        left: 20px;
    }

    a {
        display: block;
        height: 70px;
        position: relative;

        @include tb {
            height: 50px;
        }

        @include sp {
            height: 40px;
        }

        img {
            width: auto;
            height: 100%;
            top: 0;
            left: 0;
            pointer-events: auto;
        }
    }
}

.header_button {
    width: 50px;
    height: 50px;
    position: absolute;
    top: 60px;
    right: 60px;

    @include tb {
        width: 40px;
        height: 40px;
        top: 30px;
        right: 30px;
    }

    @include sp {
        width: 35px;
        height: 35px;
        top: 25px;
        right: 20px;
    }

    a,
    button {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
        border-radius: 50%;
        border: 1px solid $color-primary;
        background-color: $color-primary;
        cursor: pointer;
        padding: 0;
        margin: 0;
        text-decoration: none;

        div {
            width: 24px;
            height: 1px;
            position: absolute;
            top: 50%;
            left: 50%;
            margin-left: -12px;
            transform: translateY(-1px);
            overflow: hidden;

            @include tb {
                width: 20px;
                margin-left: -10px;
            }

            @include sp {
                width: 18px;
                margin-left: -9px;
            }

            span {
                display: block;
                width: 100%;
                height: 100%;
                background-color: $color-secondary;
                @include transition(all, $transition-normal);
            }
        }

        > div:nth-child(1) {
            margin-top: -6px;
        }

        > div:nth-child(3) {
            margin-top: 6px;
        }

        &.menu_link--active {
            > div:nth-child(1) {
                margin-top: 0;
                transform: rotate(45deg) translateY(0);
            }

            > div:nth-child(2) {
                opacity: 0;
            }

            > div:nth-child(3) {
                margin-top: 0;
                transform: rotate(-45deg) translateY(0);
            }
        }
    }
}
</style>
