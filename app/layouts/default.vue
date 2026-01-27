<template>
    <div class="layout wrap" :class="wrapClasses">
        <Loading :is-opening="isOpening" :is-loading="isLoading" />
        <FixSwitch />
        <MainNav />
        <main class="main-content contents">
            <slot />
        </main>
        <Footer />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainNav from '~/components/layout/MainNav.vue'
import Footer from '~/components/layout/Footer.vue'
import Loading from '~/components/layout/Loading.vue'
import FixSwitch from '~/components/layout/FixSwitch.vue'

// 統一管理 loading 狀態
const isOpening = ref(true)
const isLoading = ref(true)

onMounted(() => {
    // 模擬 kiri 的 opening 和 loading 動畫時序
    setTimeout(() => {
        isOpening.value = false
        setTimeout(() => {
            isLoading.value = false
        }, 500)
    }, 2000)
})

const wrapClasses = computed(() => {
    return {
        opening_on: isOpening.value,
        opening_off: !isOpening.value,
        loading_on: isLoading.value,
        loading_off: !isLoading.value,
    }
})
</script>

<style scoped lang="scss">
.layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.main-content {
    flex: 1;
    width: 100%;
}
</style>
