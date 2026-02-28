<template>
  <div
    class="layout wrap"
    :class="[wrapClasses, { 'layout--client-ready': isClientReady }]"
    :style="layoutStyle"
  >
    <!-- 頁面過場動畫元件（參考 LRC） -->
    <UiAppTransition />

    <!-- 開場動畫：ClientOnly + 獨立元件，確保 client 一定觸發 -->
    <ClientOnly>
      <OpeningScreen
        v-if="showOpeningScreen"
        @done="onOpeningDone"
      />
      <template #fallback />
    </ClientOnly>

    <MainNav />
    <main class="main-content contents">
      <slot :key="storeGlobal.pageKey" />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import MainNav from "~/components/layout/MainNav.vue";
import Footer from "~/components/layout/Footer.vue";
import OpeningScreen from "~/components/layout/OpeningScreen.vue";
import UiAppTransition from "~/components/ui/app-transition.vue";

const route = useRoute();

/**
 * 整合 LRC 的 route 和 transition 系統
 * 參考檔案: lrc-frontend-nuxt/app/layouts/default.vue
 *
 * 狀態管理：
 * - isOpening: 開場動畫狀態（只在首頁顯示）
 * - 與 Store 同步，確保狀態一致性
 * 
 * ⭐ 簡化邏輯：移除路由切換時的 loading，讓路由切換更順暢
 */

// 使用全域 Store（參考 LRC）
const storeGlobal = useGlobalStore();
const {
  isOpenTransitionFinished,
} = storeToRefs(storeGlobal);

// ⭐ 開場動畫狀態（只在首頁顯示）
const isOpening = ref(false);
const showOpeningScreen = ref(false);
// ⭐ 避免重整時 SSR 與 client 差異導致元件閃現：client 掛載後才顯示主要區塊
const isClientReady = ref(false);
// ⭐ 判斷是否為首頁
const isHomePage = computed(() => route.path === "/");

// ⭐ 判斷是否為 about 頁面（深色背景頁面）
const isAboutPage = computed(() => route.path === '/about')

// ⭐ 設置 CSS 變數，讓 header logo 在深色背景頁面使用混合模式
const layoutStyle = computed(() => ({
  '--logo-blend-mode': isAboutPage.value ? 'difference' : 'normal',
}))

/**
 * 開場動畫：在首頁就顯示（含 refresh）
 */
function shouldShowOpening(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname || route.path;
  return path === "/";
}

function onOpeningDone() {
  showOpeningScreen.value = false;
  isOpening.value = false;
}

function tryShowOpening() {
  if (!import.meta.client) return;
  if (shouldShowOpening()) {
    showOpeningScreen.value = true;
    isOpening.value = true;
  }
}

// 僅在 onMounted 後延一幀再開場，避免 SSR hydration 時設 true 造成 mismatch 被覆蓋
// 再延遲一次以備 route 尚未就緒（首頁直連時 path 可能稍晚才為 /）
onMounted(() => {
  if (!import.meta.client) return;
  requestAnimationFrame(() => {
    tryShowOpening();
    setTimeout(tryShowOpening, 80);
  });
  // 延一幀再顯示主要區塊，避免重整時未套樣式／錯亂的 SSR 內容閃現
  requestAnimationFrame(() => {
    isClientReady.value = true;
  });
});
// 從他頁導回首頁時再檢查（不用 immediate，避免 hydration 時就設 true）
watch(
  () => route.path,
  (path) => {
    if (path === "/") tryShowOpening();
  }
);

const wrapClasses = computed(() => {
  return {
    opening_on: isOpening.value,
    opening_off: !isOpening.value,
    // ⭐ 移除 loading 相關的 class
  };
});
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
  min-width: 0; /* 讓 flex 子項可縮小，避免內容撐開 */
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 重整時避免 SSR 內容在套用樣式前閃現：client 就緒前先隱藏 */
.layout:not(.layout--client-ready) :deep(.header),
.layout:not(.layout--client-ready) .main-content,
.layout:not(.layout--client-ready) :deep(.footer) {
  visibility: hidden;
}
.layout.layout--client-ready :deep(.header),
.layout.layout--client-ready .main-content,
.layout.layout--client-ready :deep(.footer) {
  visibility: visible;
}
</style>
