<template>
  <div class="fossils-page">
    <!-- 父層：JS 依 scroll 觸發黑→白（無漸層） -->
    <div class="hero-quote-parent" :style="{ background: heroQuoteParentBg }">
      <FloatingCardsHero v-if="allFossils.length > 0" :fossils="allFossils" />
      <section ref="quoteSectionRef" class="hero-quote-section">
        <p
          class="hero-quote-section__text"
          :class="{ 'hero-quote-section__text--visible': quoteVisible }"
        >
          {{ quoteText.slice(0, typewriterLength)
          }}<span
            v-show="quoteVisible && typewriterLength < quoteText.length"
            class="hero-quote-section__cursor"
            aria-hidden="true"
            >|</span
          >
        </p>
      </section>

      <!-- 圖鑑區塊 -->
      <div ref="galleryRef" class="fossils-page__gallery">
        <div class="fossils-page__header">
          <img
            src="/images/index-txt.png"
            alt="化石圖鑑"
            class="fossils-page__title-image"
          />
        </div>

        <FossilGrid
          :fossils="displayedFossils"
          :loading="loading"
          :loading-more="InfiniteIsLoading"
          :has-more="hasMore"
          @fossil-click="handleFossilClick"
        />

        <div ref="infiniteTarget" class="fossils-page__infinite-trigger"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IFossil } from "~/types/fossil";
import FossilGrid from "~/components/fossil/FossilGrid.vue";
import FloatingCardsHero from "~/components/ui/FloatingCardsHero.vue";
import { useWidgetsBlocksEvents } from "~/composables/useWidgetsBlocksEvents";
import { useInfiniteScroll } from "~/composables/useInfiniteScroll";
import { useGalleryInView } from "~/composables/useGalleryInView";
import { useStorage } from "~/composables/useStorage";
import { useFossils } from "~/composables/useFossils";
import {
  promiseTimeout,
  useWindowScroll,
} from "@vueuse/core";

// 父層背景：依 scroll 黑→白（JS 判定，無漸層）
const { y: scrollY } = useWindowScroll();
// 捲動一點就到位白底，不卡在一半灰
const BLACK_TO_WHITE_THRESHOLD = 200;

const heroQuoteParentBg = computed(() => {
  if (import.meta.server) return "rgb(10, 10, 10)";
  const y = scrollY.value ?? 0;
  const p = Math.min(1, Math.max(0, y / BLACK_TO_WHITE_THRESHOLD));
  const r = Math.round(10 + (255 - 10) * p);
  const g = Math.round(10 + (255 - 10) * p);
  const b = Math.round(10 + (255 - 10) * p);
  return `rgb(${r},${g},${b})`;
});

// hero-quote-section 文字：抵達時 fade-in，並以打字機效果顯示
const quoteSectionRef = ref<HTMLElement | null>(null);
const quoteVisible = ref(false);
const quoteText = "In the end, I have caught up with you.";
const typewriterLength = ref(0);
const typewriterDone = ref(false);
const TYPEWRITER_DURATION = 2600;
const TYPEWRITER_INTERVAL = 45;

// 僅在「捲動抵達」quote 區才觸發：用 scroll 判斷區塊頂部已進入視窗上方，不用 IntersectionObserver 避免一載入就觸發
const QUOTE_ARRIVE_TOP = 220; // 區塊頂部進入視窗上方此 px 內才算抵達
watch(
  scrollY,
  (y) => {
    if (quoteVisible.value || !import.meta.client || !quoteSectionRef.value)
      return;
    const top = quoteSectionRef.value.getBoundingClientRect().top;
    if (top <= QUOTE_ARRIVE_TOP) quoteVisible.value = true;
  },
  { immediate: true },
);

watch(quoteVisible, (visible) => {
  if (!visible || typewriterDone.value || !import.meta.client) return;
  typewriterLength.value = 0;
  const start = performance.now();
  const tick = () => {
    const elapsed = performance.now() - start;
    const progress = Math.min(elapsed / TYPEWRITER_DURATION, 1);
    typewriterLength.value = Math.floor(progress * quoteText.length);
    if (typewriterLength.value < quoteText.length) {
      requestAnimationFrame(tick);
    } else {
      typewriterDone.value = true;
    }
  };
  requestAnimationFrame(tick);
});

const galleryRef = ref<HTMLElement | null>(null);

useGalleryInView(galleryRef);

// SEO Meta
useHead({
  title: "化石圖鑑 | Fossil Index",
  meta: [
    {
      name: "description",
      content: "探索遠古生物化石的數位圖鑑",
    },
  ],
});

// ⭐ 使用 Firebase 資料
const { fetchFossils } = useFossils();
const { toStorageUrl } = useStorage();

// ⭐ 分頁載入狀態（參考 Magazine 10）
const displayedFossils = ref<IFossil[]>([]);
const allFossils = ref<IFossil[]>([]);
const loading = ref(true);
const infiniteTarget = ref<HTMLElement | null>(null);

// 分頁配置（參考 Magazine 10）
const search_config = {
  limit_default: 12, // 初始載入 12 筆
  limit: 12, // 每次無限載入 12 筆
};

// 分頁狀態
const _last_limit = ref(0);
const _offset = ref(0);
const _last_offset = ref(0);
const hasMore = computed(
  () => displayedFossils.value.length < allFossils.value.length,
);

// ⭐ 初始化 Firebase 資料快取（只執行一次）
// ⭐ 優化：在資料載入時就轉換好 URL（參考 LRC Magazine 10 做法）
const initFossilsCache = async (): Promise<void> => {
  // 如果已經有快取，直接返回
  if (allFossils.value.length > 0) {
    return;
  }

  // 只在客戶端執行
  if (!import.meta.client) {
    return;
  }

  try {
    const data = await fetchFossils({
      publicOnly: true,
      pageSize: undefined,
      sortBy: "createdAt",
      sortDirection: "desc",
    });

    data.sort(() => Math.random() - 0.5);

    const convertedData = data.map((fossil) => {
      if (!fossil.thumbnail) {
        return fossil;
      }

      if (
        fossil.thumbnail.startsWith("http://") ||
        fossil.thumbnail.startsWith("https://")
      ) {
        return fossil;
      }

      if (fossil.thumbnail.startsWith("/")) {
        return fossil;
      }

      try {
        const storageUrl = toStorageUrl(fossil.thumbnail);

        if (!storageUrl || storageUrl === fossil.thumbnail) {
          return fossil;
        }

        return {
          ...fossil,
          thumbnail: storageUrl,
        };
      } catch {
        return fossil;
      }
    });

    allFossils.value = convertedData;
  } catch {
    // 初始化失敗時 displayedFossils 仍為空，loading 會關閉
  }
};

// ⭐ 分頁載入資料（參考 Magazine 10）
const fetchData = async (
  option: {
    limit?: number;
  } = {},
): Promise<{
  items: IFossil[];
}> => {
  const { limit } = option;
  const f_limit = (_last_limit.value = limit || search_config.limit);

  const filtered_items = allFossils.value;
  const items_total = filtered_items;

  // 計算items切割範圍
  const offset = _last_offset.value;
  const index_start = offset;
  const index_end = Math.min(offset + f_limit, items_total.length);
  const f_items = items_total.slice(index_start, index_end); // 取出需要的items
  _last_offset.value = index_end; // 暫存 index_end, 為了設定下一次切割的 index_start
  _offset.value += f_limit; // 為了設定下一次 api fetch 的 offset

  return {
    items: f_items,
  };
};

// ⭐ 載入更多（無限載入）
// ⭐ 完全參照 LRC Magazine 10 做法，加上批次載入優化
const seeMore = async () => {
  const { items } = await fetchData();
  displayedFossils.value = displayedFossils.value.concat(items);

  // ⭐ 完全參照 LRC：await nextTick() → $lazyLoadImage()
  await nextTick();
  const nuxtApp = useNuxtApp();
  // ⭐ 批次載入優化：立即載入新載入的前 15 張圖片
  nuxtApp.$lazyLoadImage?.(15);
};

// ⭐ 無限載入觸發：先讓 spinner 明顯跑一段，再取資料、再短暫停留，最後才 concat 進畫面
const onInfiniteLoad = async () => {
  await promiseTimeout(800); // spinner 先跑
  const { items } = await fetchData();
  await promiseTimeout(400); // 取完資料再短暫停留，強化停留感
  displayedFossils.value = displayedFossils.value.concat(items);
  await nextTick();
  const nuxtApp = useNuxtApp();
  nuxtApp.$lazyLoadImage?.(15);
};

// ⭐ 初始化資料（只填第一批，observer 與 lazy load 在 loading 關閉後再做）
const initData = async () => {
  if (!displayedFossils.value.length) {
    const { items } = await fetchData({ limit: search_config.limit_default });
    displayedFossils.value = items;
  }
  // 無限載入 observer 與圖片 lazy load 改在 finally（loading 關閉後）執行，避免一建立就觸發連續載入
};

// ⭐ 無限載入 composable
const {
  isLoading: InfiniteIsLoading,
  createObserverInfiniteScroll,
  removeObserverInfiniteScroll,
} = useInfiniteScroll(onInfiniteLoad, () => hasMore.value);

// ⭐ 點擊事件處理 - 導航到物種頁並帶上 code
const handleFossilClick = (fossil: IFossil) => {
  const speciesSlug = fossil.speciesRef.slug;

  if (fossil.shortCode) {
    navigateTo(`/species/${speciesSlug}?code=${fossil.shortCode}`);
  } else {
    navigateTo(`/species/${speciesSlug}?specimen=${fossil.id}`);
  }
};

// ⭐ 重置分頁狀態
const resetPagination = () => {
  removeObserverInfiniteScroll();
  _offset.value = 0;
  _last_offset.value = 0;
  displayedFossils.value = [];
};

// 載入資料（只在客戶端執行）
const MIN_LOADING_MS = 500;

onMounted(async () => {
  if (import.meta.server) return;

  loading.value = true;
  const loadingStart = Date.now();

  try {
    await initFossilsCache();
    await initData();
  } catch {
    // 載入失敗時 finally 仍會關閉 loading
  } finally {
    const elapsed = Date.now() - loadingStart;
    const remain = Math.max(0, MIN_LOADING_MS - elapsed);
    if (remain > 0) {
      await new Promise((r) => setTimeout(r, remain));
    }
    loading.value = false;

    // 等 grid 渲染後再建立無限載入 observer 與觸發圖片 lazy load（避免只顯示 spinner 時 trigger 已在視窗內導致一次載入多批）
    await nextTick();
    createObserverInfiniteScroll(infiniteTarget.value);
    setTimeout(() => {
      const nuxtApp = useNuxtApp();
      nuxtApp.$lazyLoadImage?.(15);
    }, 100);

    const { toggleWidgetsBlockComplete } = useWidgetsBlocksEvents();
    toggleWidgetsBlockComplete(true);
  }
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

// 父層：背景由 JS 依 scroll 設為黑→白，此處不設 background
.hero-quote-parent {
  width: 100%;
  min-height: 200vh;
  transition: background 0.15s ease-out;
}

.hero-quote-section {
  width: 100%;
  height: 100vh;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  margin: 0;
  padding: 0;
}

.hero-quote-section__text {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.02em;
  text-align: center;
  padding: 0 24px;
  opacity: 0;
  transition: opacity 1.5s ease-out;

  &--visible {
    opacity: 1;
  }

  @include tb {
    font-size: 1.75rem;
  }

  @include sp {
    font-size: 1.35rem;
  }
}

.hero-quote-section__cursor {
  display: inline-block;
  margin-left: 2px;
  animation: typewriter-cursor 0.7s step-end infinite;
}

@keyframes typewriter-cursor {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.fossils-page {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;

  // 圖鑑區塊（在 Hero 下方，白色背景）
  &__gallery {
    position: relative;
    background-color: #ffffff;
    z-index: 1;
    padding-top: 0;

    @include tb {
      padding-top: 0;
    }

    @include sp {
      padding-top: 0;
    }
  }

  &__header {
    width: 100%;
    padding: 40px;
    text-align: center;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;

    @include sp {
      margin-top: 68px;
      margin-bottom: 0;
      padding: 30px 20px 0;
    }
  }

  &__title-image {
    max-width: 1000px;
    width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
    padding: 20px;
    @include sp {
      max-width: 90%;
    }
  }

  // ⭐ 無限載入觸發點（參考 Magazine 10）
  &__infinite-trigger {
    width: 100%;
    height: 1px;
    margin: 20px 0;
    visibility: hidden;
  }
}
</style>
