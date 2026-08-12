<template>
  <div id="home" class="portfolio-page" :class="viewModeClass">
    <!-- Nuxt 4 auto-import: components/portfolio/FixSwitch.vue 會自動導入為 PortfolioFixSwitch -->
    <PortfolioFixSwitch />
    <div id="top" class="contents">
      <div class="contents_inner">
        <div class="contents_detail">
          <div class="contents_detail_inner">
            <div id="grid" class="contents_block">
              <div class="contents_block_inner">
                <!-- Loading State -->
                <LoadingSpinner v-if="pending" size="small" />

                <!-- Projects Grid -->
                <div v-else-if="projects.length" class="grid_block">
                  <PortfolioItem
                    v-for="(project, index) in projects"
                    :key="project.id"
                    :project="
                      {
                        ...project,
                        technologies: Array.isArray(project.technologies)
                          ? project.technologies.map((t) => ({ ...t }))
                          : [],
                      } as IProject
                    "
                    :index="index"
                    :animation-delay="index * 50"
                  />
                </div>
                <div v-else class="portfolio-empty">
                  <p>目前沒有作品資料。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IProject } from "~/types/portfolio";
import { useProjects } from "~/composables/useProjects";
import { usePortfolioView } from "~/composables/usePortfolioView";
import { useWidgetsBlocksEvents } from "~/composables/useWidgetsBlocksEvents";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";
// Nuxt 4 auto-import: components/portfolio/FixSwitch.vue 和 PortfolioItem.vue 會自動導入
// 不需要手動 import，直接使用 <FixSwitch /> 和 <PortfolioItem /> 即可
import { ref, computed, onMounted, nextTick } from "vue";

// SEO Meta
useSeoMeta({
  title: "Portfolio",
  description: "Web development and design portfolio.",
});

// 使用 useProjects composable
const { fetchProjects } = useProjects();

const projects = ref<IProject[]>([]);
const pending = ref(true);

// Portfolio view mode for button styling
const { viewMode } = usePortfolioView();
const viewModeClass = computed(() => {
  return viewMode.value === "grid" ? "grid_item" : "grid_image";
});

// 參考 LRC: 在 onMounted 中初始化圖片 lazy loading 並標記載入完成
// 參考檔案: lrc-frontend-nuxt/app/pages/member/explore/index.vue (line 742-752)
const runLazyImages = async () => {
  // 確保 DOM 已更新（projects 已渲染）
  await nextTick();
  // 再稍等一點讓瀏覽器完成 layout（避免「切換進 /portfolio 沒圖片，重整才有」）
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (import.meta.client) {
    const nuxtApp = useNuxtApp();
    nuxtApp.$lazyLoadImage?.();
  }
};

const markPageReady = () => {
  // 通知 route plugin：頁面內容已就緒，可以結束 transition/loading
  const { toggleWidgetsBlockComplete } = useWidgetsBlocksEvents();
  toggleWidgetsBlockComplete(true);
};

onMounted(async () => {
  try {
    const result = await fetchProjects({ publicOnly: true });
    projects.value = result;
  } catch (e) {
    if (import.meta.dev) console.error('[portfolio] fetchProjects error', e);
    projects.value = [];
  } finally {
    pending.value = false;
    await runLazyImages();
    markPageReady();
  }
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

// .portfolio-page / .contents / .contents_inner / .contents_detail_inner 不用在這裡
// 重複宣告：components/_portfolio.scss、layouts/_layout.scss 已經有一樣的全域規則。

.contents_detail {
  width: 100%;
  padding-top: 150px; // PC 預設 padding-top

  @include tb {
    padding-top: 260px;
    margin-bottom: 50px;
  }

  @include sp {
    padding-top: 150px;
    margin-bottom: var(--lc-space-md);
  }
}

.contents_block {
  position: relative;
  width: 100%;
  padding-top: 75px;
  padding-bottom: 75px;

  @include tb {
    padding-right: var(--lc-space-xl);
    padding-bottom: var(--lc-space-xl);
    padding-left: var(--lc-space-xl);
  }

  @include sp {
    padding: 45px var(--lc-space-md);
  }
}

// #home 特殊樣式：這頁的 grid 不吃 layouts/_layout.scss 的 1200px 版寬上限
#home .contents_block_inner {
  width: 100%;
  max-width: 100%;
}

.contents_block_inner {
  width: 100%;
  font-size: 0;
  line-height: 0;
}

// layouts/_layout.scss 的 .grid_block 已經有 width/font-size/line-height，這裡只加這頁需要的 text-align
.grid_block {
  text-align: left;
}

.portfolio-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 2rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--lc-color-text-soft);
  text-align: center;
}

// #grid 特殊樣式
#grid {
  padding-top: 0;
  padding-right: var(--lc-space-lg);
  padding-left: var(--lc-space-lg);

  @include sp {
    padding-right: 15px;
    padding-left: 15px;
  }
}
</style>
