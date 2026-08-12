<template>
  <div class="fossils-page fossils-page--collection">
    <!-- 與圖鑑頁相同結構：外層 wrapper + gallery，讓版型與圖鑑一致 -->
    <div class="fossils-page__body">
      <div ref="galleryRef" class="fossils-page__gallery">
        <GalleryHeader />

        <ClientOnly>
          <FossilGrid
            :fossils="fossilList"
            :loading="loading"
            :loading-more="false"
            :has-more="false"
            loading-message="載入收藏中..."
            @fossil-click="handleFossilClick"
          >
            <template #empty>
              <p>尚未收藏任何化石</p>
              <NuxtLink to="/" class="collection-page__link">前往圖鑑</NuxtLink>
            </template>
          </FossilGrid>
          <template #fallback>
            <p class="collection-page__hydrating">載入收藏中...</p>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IFossil } from "~/types/fossil";
import FossilGrid from "~/components/fossil/FossilGrid.vue";
import GalleryHeader from "~/components/ui/GalleryHeader.vue";
import { useGalleryInView } from "~/composables/useGalleryInView";

useHead({
  title: "Collection",
  meta: [
    {
      name: "description",
      content: "Your fossil collection.",
    },
  ],
});

const { favorites } = useFavorites();
const { fetchFossilById } = useFossils();
const { toMediaUrl } = useMedia();

const fossilList = ref<IFossil[]>([]);
const loading = ref(true);

function toDisplayFossil(raw: IFossil): IFossil {
  const thumb = raw.thumbnail;
  const thumbUrl =
    thumb?.startsWith("http") || thumb?.startsWith("/")
      ? thumb
      : thumb
        ? toMediaUrl(thumb)
        : "";
  const images = raw.images?.map((img) => ({
    ...img,
    url:
      img.url?.startsWith("http") || img.url?.startsWith("/")
        ? img.url
        : toMediaUrl(img.url || ""),
  }));
  return {
    ...raw,
    thumbnail: thumbUrl,
    images: images ?? raw.images,
  };
}

async function loadFavorites() {
  if (import.meta.server) return;
  const ids = favorites.value;
  if (ids.length === 0) {
    fossilList.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const results = await Promise.all(ids.map((id) => fetchFossilById(id)));
    fossilList.value = results
      .filter((f): f is IFossil => f != null)
      .map(toDisplayFossil);
  } catch (e) {
    if (import.meta.dev) console.error("[collection] loadFavorites error", e);
    fossilList.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  favorites,
  () => {
    const ids = favorites.value;
    // 樂觀更新：取消收藏時直接從畫面上移除該卡片，不用等重新載入
    fossilList.value = fossilList.value.filter((f) => ids.includes(f.id));
    if (ids.length === 0) {
      loading.value = false;
      return;
    }
    // 初次載入或收藏 id 比目前列表多時（例如從他處加入），才重新載入
    if (fossilList.value.length < ids.length) {
      loadFavorites();
    }
  },
  { immediate: true },
);

const handleFossilClick = (fossil: IFossil) => {
  const speciesSlug = fossil.speciesRef.slug;
  if (fossil.shortCode) {
    navigateTo(`/species/${speciesSlug}?code=${fossil.shortCode}`);
  } else {
    navigateTo(`/species/${speciesSlug}?specimen=${fossil.id}`);
  }
};

// 與圖鑑頁一致：進入 gallery 時 body 加 class，MainNav 的 portfolio 按鈕可 fade-in
const galleryRef = ref<HTMLElement | null>(null);
useGalleryInView(galleryRef);
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

// 與圖鑑頁相同版型（結構與 index.vue 的 .hero-quote-parent + __gallery 一致，
// 標頭區塊已抽成共用元件 <GalleryHeader />，兩頁共用同一份 CSS）
.fossils-page--collection {
  width: 100%;
  min-height: 100vh;
  background-color: var(--lc-color-white);
}

.fossils-page__body {
  position: relative;
  width: 100%;
}

.fossils-page__gallery {
  position: relative;
  z-index: 1;
  width: 100%;
  padding-top: 0;
  background-color: var(--lc-color-white);
}

/* 與 FossilGrid 內 .fossil-grid__empty 一致，僅自訂內容樣式 */
.collection-page__hydrating {
  padding: var(--lc-space-lg) var(--lc-space-sm);
  font-size: 0.95rem;
  color: var(--lc-color-text-muted);
  text-align: center;
}

.collection-page__link {
  display: inline-block;
  padding: 10px var(--lc-space-sm);
  font-size: 0.9rem;
  color: $lc-color-black;
  text-decoration: none;
  border: 1px solid $lc-color-black;
  border-radius: var(--lc-radius-pill);

  &:hover {
    color: var(--lc-color-white);
    background: $lc-color-black;
  }
}
</style>
