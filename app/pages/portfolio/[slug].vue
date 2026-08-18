<template>
    <div id="project-detail" class="project-detail-page">
        <div class="contents">
            <div class="contents_inner">
                <!-- Loading State -->
                <LoadingSpinner v-if="pending" full-height />

                <!-- Error State -->
                <div v-else-if="error || !project" class="project-error">
                    <h2>找不到此專案</h2>
                    <NuxtLink to="/portfolio" class="back-button">
                        <span class="back-button__icon">←</span>
                        <span class="back-button__text">返回作品集</span>
                    </NuxtLink>
                </div>

                <!-- Project Content -->
                <template v-else>
                    <!-- Hero Section -->
                    <section class="project-hero">
                        <div class="project-hero__inner">
                            <!-- 返回按鈕 -->
                            <NuxtLink to="/portfolio" class="back-button">
                                <span class="back-button__icon">←</span>
                                <span class="back-button__text">返回作品集</span>
                            </NuxtLink>

                            <!-- 專案標題區 -->
                            <div class="project-hero__header">
                                <h1 class="project-hero__title">{{ project.title }}</h1>
                                <p v-if="project.titleEn" class="project-hero__title-en">{{ project.titleEn }}</p>
                            </div>

                            <!-- Meta 資訊 -->
                            <div class="project-hero__meta">
                                <div class="project-hero__meta-item">
                                    <span class="project-hero__meta-label">公司</span>
                                    <span class="project-hero__meta-value">{{ project.company || '個人專案' }}</span>
                                </div>
                                <div class="project-hero__meta-item">
                                    <span class="project-hero__meta-label">角色</span>
                                    <span class="project-hero__meta-value">{{ project.role }}</span>
                                </div>
                                <div class="project-hero__meta-item">
                                    <span class="project-hero__meta-label">期間</span>
                                    <span class="project-hero__meta-value">{{ project.period }}</span>
                                </div>
                                <div class="project-hero__meta-item">
                                    <span class="project-hero__meta-label">分類</span>
                                    <span class="project-hero__meta-value">{{ categoryLabel }}</span>
                                </div>
                            </div>

                            <!-- 主視覺圖 -->
                            <div class="project-hero__image">
                                <img :src="thumbnailUrl" :alt="project.title" loading="eager" >
                            </div>
                        </div>
                    </section>

                    <!-- 專案描述 -->
                    <section class="project-section">
                        <div class="project-section__inner">
                            <h2 class="project-section__title">專案概述</h2>
                            <div class="project-section__content">
                                <p class="project-description">{{ project.description }}</p>
                            </div>
                        </div>
                    </section>

                    <!-- 技術挑戰 (如果有) -->
                    <section v-if="project.challenges" class="project-section project-section--alt">
                        <div class="project-section__inner">
                            <h2 class="project-section__title">技術挑戰</h2>
                            <div class="project-section__content">
                                <p class="project-description">{{ project.challenges }}</p>
                            </div>
                        </div>
                    </section>

                    <!-- 專案成果 (如果有) -->
                    <section v-if="project.achievements" class="project-section">
                        <div class="project-section__inner">
                            <h2 class="project-section__title">專案成果</h2>
                            <div class="project-section__content">
                                <p class="project-description">{{ project.achievements }}</p>
                            </div>
                        </div>
                    </section>

                    <!-- 技術棧 -->
                    <section class="project-section project-section--tech">
                        <div class="project-section__inner">
                            <h2 class="project-section__title">使用技術</h2>
                            <div class="project-section__content">
                                <!-- 按分類分組顯示 -->
                                <div
                                    v-for="(techs, category) in groupedTechnologies"
                                    :key="category"
                                    class="tech-group"
                                >
                                    <h3 class="tech-group__title">{{ getCategoryLabel(category as TechnologyCategory) }}</h3>
                                    <div class="tech-group__tags">
                                        <span
                                            v-for="tech in techs"
                                            :key="tech.name"
                                            class="tech-tag"
                                        >
                                            {{ tech.name }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- 圖片畫廊 -->
                    <section v-if="project.images && project.images.length > 0" class="project-section project-section--gallery">
                        <div class="project-section__inner">
                            <h2 class="project-section__title">專案截圖</h2>
                            <div class="project-gallery">
                                <div
                                    v-for="(image, index) in project.images"
                                    :key="index"
                                    class="project-gallery__item"
                                >
                                    <img 
                                        :src="getImageUrl(image.url)" 
                                        :alt="image.alt || `${project.title} 截圖 ${index + 1}`" 
                                        loading="lazy" 
                                    >
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- 外部連結 -->
                    <section v-if="project.url || project.github" class="project-section project-section--links">
                        <div class="project-section__inner">
                            <h2 class="project-section__title">相關連結</h2>
                            <div class="project-links">
                                <a
                                    v-if="project.url"
                                    :href="project.url"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="project-link"
                                >
                                    <span class="project-link__icon">🔗</span>
                                    <span class="project-link__text">專案網址</span>
                                </a>
                                <a
                                    v-if="project.github"
                                    :href="project.github"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="project-link"
                                >
                                    <span class="project-link__icon">💻</span>
                                    <span class="project-link__text">GitHub 儲存庫</span>
                                </a>
                            </div>
                        </div>
                    </section>

                    <!-- 導航 (上一個/下一個專案) -->
                    <section class="project-navigation">
                        <div class="project-navigation__inner">
                            <NuxtLink
                                v-if="previousProject"
                                :to="`/portfolio/${previousProject.slug}`"
                                class="project-nav-item project-nav-item--prev"
                            >
                                <span class="project-nav-item__label">← 上一個專案</span>
                                <span class="project-nav-item__title">{{ previousProject.title }}</span>
                            </NuxtLink>
                            <div v-else class="project-nav-item project-nav-item--placeholder"/>

                            <NuxtLink
                                v-if="nextProject"
                                :to="`/portfolio/${nextProject.slug}`"
                                class="project-nav-item project-nav-item--next"
                            >
                                <span class="project-nav-item__label">下一個專案 →</span>
                                <span class="project-nav-item__title">{{ nextProject.title }}</span>
                            </NuxtLink>
                            <div v-else class="project-nav-item project-nav-item--placeholder"/>
                        </div>
                    </section>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PROJECT_CATEGORY_LABELS, TECHNOLOGY_CATEGORY_LABELS, type IProject, type TechnologyCategory, type ITechnology } from '~/types/portfolio';
import { useProjects } from '~/composables/useProjects';
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useWidgetsBlocksEvents } from '~/composables/useWidgetsBlocksEvents';
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue';
import { getMediaUrl } from '~/utils/media';

// 獲取路由參數
const route = useRoute();
const slug = computed(() => {
    const p = route.params.slug;
    // 防呆：某些情況下 params 可能是陣列（雖然 [slug].vue 理論上是 string）
    if (Array.isArray(p)) return p.join('/');
    if (typeof p === 'string') return p;
    return '';
});

// 使用 composable
const { fetchProjectBySlug, fetchProjects } = useProjects();

const project = ref<IProject | null>(null);
const pending = ref(true);
const error = ref<Error | null>(null);

// 所有專案（用於上一個/下一個導航）
const allProjects = ref<IProject[]>([]);

// Media URL 轉換
const convertUrl = (url: string) => getMediaUrl(url);

const thumbnailUrl = computed(() => {
    return project.value?.thumbnail ? convertUrl(project.value.thumbnail) : '';
});

const getImageUrl = (url: string | undefined): string => {
    return url ? convertUrl(url) : '';
};

// SEO Meta
useSeoMeta({
    title: computed(() => project.value ? `${project.value.title} - Portfolio` : 'Portfolio'),
    description: computed(() => project.value?.description || ''),
    ogTitle: computed(() => project.value?.title || ''),
    ogDescription: computed(() => project.value?.description || ''),
    ogImage: computed(() => thumbnailUrl.value || ''),
});

// 分類標籤
const categoryLabel = computed(() => {
    if (!project.value) return '';
    const category = project.value.category;
    // 防呆：檢查 category 是否存在且為有效的 ProjectCategory
    if (!category || !PROJECT_CATEGORY_LABELS[category]) {
        console.warn('⚠️ [slug] 專案分類無效或不存在:', category);
        return '未分類';
    }
    return PROJECT_CATEGORY_LABELS[category].zh;
});

const groupedTechnologies = computed(() => {
    if (!project.value?.technologies || !Array.isArray(project.value.technologies)) {
        return {};
    }
    
    const groups: Record<string, ITechnology[]> = {};
    project.value.technologies.forEach((tech) => {
        if (tech?.category) {
            const category = tech.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category]!.push(tech);
        }
    });
    return groups;
});

const getCategoryLabel = (category: TechnologyCategory) => {
    return TECHNOLOGY_CATEGORY_LABELS[category]?.zh || '其他';
};

// 上一個/下一個專案改用 allProjects
const currentIndex = computed(() => {
    return allProjects.value.findIndex((p) => p.slug === slug.value);
});

const previousProject = computed(() => {
    if (currentIndex.value <= 0) return null;
    return allProjects.value[currentIndex.value - 1] ?? null;
});

const nextProject = computed(() => {
    if (currentIndex.value < 0 || currentIndex.value >= allProjects.value.length - 1) return null;
    return allProjects.value[currentIndex.value + 1] ?? null;
});

// 參考 LRC：等資料載入 + DOM 完成後再執行 lazy load，並標記頁面完成
const runLazyImages = async () => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (import.meta.client) {
        const nuxtApp = useNuxtApp();
        nuxtApp.$lazyLoadImage?.();
    }
};

const markPageReady = () => {
    const { toggleWidgetsBlockComplete } = useWidgetsBlocksEvents();
    toggleWidgetsBlockComplete(true);
};

onMounted(async () => {
    try {
        // 並行 fetch 當前專案和所有專案
        const [projectResult, allResult] = await Promise.all([
            fetchProjectBySlug(slug.value),
            fetchProjects({ publicOnly: true }),
        ]);
        project.value = projectResult;
        allProjects.value = allResult;
    } catch (e) {
        if (import.meta.dev) console.error('[portfolio/slug] fetch error', e);
        error.value = e as Error;
    } finally {
        pending.value = false;
        await runLazyImages();
        markPageReady();
    }
});

// 監聽 slug 變化（client 端導航時重新 fetch）
watch(slug, async (newSlug, oldSlug) => {
    if (!newSlug || newSlug === oldSlug || !import.meta.client) return;
    pending.value = true;
    try {
        const [projectResult, allResult] = await Promise.all([
            fetchProjectBySlug(newSlug),
            fetchProjects({ publicOnly: true }),
        ]);
        project.value = projectResult;
        allProjects.value = allResult;
    } catch (e) {
        error.value = e as Error;
    } finally {
        pending.value = false;
        await runLazyImages();
        markPageReady();
    }
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

.project-detail-page {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: 100vh;
    padding: 0;
    margin: 0 auto;
    overflow-x: hidden;
    background-color: var(--lc-color-white);
}

.contents {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding-top: 100px;
    margin: 0 auto;
    overflow-x: hidden;

    @include tb {
        padding-top: 80px;
    }

    @include sp {
        padding-top: 68px;
    }
}

.contents_inner {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 0 auto;
    overflow-x: hidden;
}

// Loading & Error States
.project-error {
    @include lc-state-panel(60vh);

    h2 {
        margin-bottom: 24px;
        font-size: 1.5rem;
        color: $lc-color-black;

        @include sp {
            margin-bottom: 20px;
            font-size: 1.25rem;
        }
    }
}

// ==========================================
// Hero Section
// ==========================================
.project-hero {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    @include lc-section-padding-responsive;

    background-color: var(--lc-color-gray-light);

    &__inner {
        box-sizing: border-box;
        width: 100%;
        max-width: 1200px;
        padding: 0;
        margin: 0 auto;
    }

    &__header {
        margin-bottom: 40px;
        text-align: center;

        @include tb {
            margin-bottom: 32px;
        }

        @include sp {
            margin-bottom: 24px;
        }
    }

    &__title {
        margin-bottom: 12px;
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1.3;
        color: $lc-color-black;

        @include sp {
            font-size: 1.75rem;
        }
    }

    &__title-en {
        font-size: 1.25rem;
        font-weight: 400;
        color: var(--lc-color-text-muted);

        @include sp {
            font-size: 1rem;
        }
    }

    &__meta {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 40px;

        @include tb {
            grid-template-columns: repeat(2, 1fr);
        }

        @include sp {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 28px;
        }
    }

    &__meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    &__meta-label {
        margin-bottom: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--lc-color-text-subtle);

        @include sp {
            margin-bottom: 4px;
            font-size: 0.8125rem;
        }
    }

    &__meta-value {
        font-size: 1rem;
        font-weight: 600;
        color: $lc-color-black;

        @include sp {
            font-size: 0.9375rem;
        }
    }

    &__image {
        box-sizing: border-box;
        width: 100%;
        max-width: min(1000px, 100%);
        margin: 0 auto;
        overflow: hidden;
        @include lc-radius-sm-responsive;

        box-shadow: 0 8px 24px rgb(0 0 0 / 10%);

        @include sp {
            box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
        }

        img {
            display: block;
            width: 100%;
            max-width: 100%;
            height: auto;
            vertical-align: top;
        }
    }
}

// ==========================================
// Back Button
// ==========================================
.back-button {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 12px 20px;
    margin-bottom: 40px;
    font-size: 0.875rem;
    font-weight: 500;
    color: $lc-color-black;
    text-decoration: none;
    background-color: var(--lc-color-white);
    border: 1px solid var(--lc-color-border-light);
    @include lc-radius-sm-responsive;

    transition: all $lc-transition-fast ease-in-out;

    @include tb {
        margin-bottom: 32px;
    }

    @include sp {
        padding: 10px 16px;
        margin-bottom: 24px;
        font-size: 0.8125rem;
    }

    @include lc-hover-accent-fill;

    &:hover {
        transform: translateX(-4px);
    }

    &__icon {
        font-size: 1.25rem;

        @include sp {
            font-size: 1.125rem;
        }
    }
}

// ==========================================
// Project Sections
// ==========================================
.project-section {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    @include lc-section-padding-responsive;

    &--alt {
        background-color: var(--lc-color-gray-light);
    }

    &__inner {
        box-sizing: border-box;
        width: 100%;
        max-width: 900px;
        padding: 0;
        margin: 0 auto;
    }

    &__title {
        padding-bottom: 16px;
        margin-bottom: 24px;
        font-size: 1.75rem;
        font-weight: 600;
        color: $lc-color-black;
        border-bottom: 2px solid $lc-color-accent;

        @include sp {
            font-size: 1.5rem;
        }
    }

    &__content {
        line-height: 1.8;
    }
}

.project-description {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--lc-color-text-soft);
    white-space: pre-wrap;

    @include sp {
        font-size: 0.9375rem;
    }
}

// ==========================================
// Tech Section
// ==========================================
.tech-group {
    margin-bottom: 32px;

    @include sp {
        margin-bottom: 24px;
    }

    &:last-child {
        margin-bottom: 0;
    }

    &__title {
        margin-bottom: 12px;
        font-size: 1rem;
        font-weight: 600;
        color: var(--lc-color-text-muted);

        @include sp {
            margin-bottom: 10px;
            font-size: 0.9375rem;
        }
    }

    &__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        @include sp {
            gap: 8px;
        }
    }
}

.tech-tag {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    color: $lc-color-black;
    background-color: var(--lc-color-gray-light);
    border: 1px solid var(--lc-color-border-light);
    border-radius: 20px;
    transition: all $lc-transition-fast ease-in-out;

    @include sp {
        padding: 6px 12px;
        font-size: 0.8125rem;
        border-radius: 16px;
    }

    @include lc-hover-accent-fill;
}

// ==========================================
// Gallery
// ==========================================
.project-gallery {
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
    width: 100%;
    min-width: 0;
    max-width: 100%;

    @include tb {
        gap: 32px;
    }

    @include sp {
        gap: 24px;
    }

    &__item {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        @include lc-radius-sm-responsive;

        box-shadow: 0 4px 12px rgb(0 0 0 / 8%);

        img {
            display: block;
            width: 100%;
            max-width: 100%;
            height: auto;
            vertical-align: top;
        }
    }
}

// ==========================================
// Links
// ==========================================
.project-links {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    @include sp {
        gap: 12px;
    }
}

.project-link {
    display: inline-flex;
    gap: 12px;
    align-items: center;
    padding: 16px 24px;
    font-size: 1rem;
    font-weight: 500;
    color: $lc-color-black;
    text-decoration: none;
    background-color: var(--lc-color-gray-light);
    border: 1px solid var(--lc-color-border-light);
    @include lc-radius-sm-responsive;

    transition: all $lc-transition-fast ease-in-out;

    @include sp {
        gap: 8px;
        padding: 12px 18px;
        font-size: 0.9375rem;
    }

    @include lc-hover-accent-fill;

    &:hover {
        box-shadow: 0 4px 12px rgb(164 138 86 / 30%);
        transform: translateY(-2px);
    }

    &__icon {
        font-size: 1.5rem;

        @include sp {
            font-size: 1.25rem;
        }
    }
}

// ==========================================
// Navigation
// ==========================================
.project-navigation {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    @include lc-section-padding-responsive;

    background-color: var(--lc-color-gray-light);

    &__inner {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        width: 100%;
        max-width: 1200px;
        padding: 0;
        margin: 0 auto;

        @include tb {
            gap: 24px;
        }

        @include sp {
            grid-template-columns: 1fr;
            gap: 16px;
        }
    }
}

.project-nav-item {
    display: flex;
    flex-direction: column;
    padding: 24px;
    color: $lc-color-black;
    text-decoration: none;
    background-color: var(--lc-color-white);
    border: 1px solid var(--lc-color-border-light);
    @include lc-radius-sm-responsive;

    transition: all $lc-transition-fast ease-in-out;

    @include sp {
        padding: 18px 16px;
    }

    @include lc-hover-accent-fill;

    &:hover {
        box-shadow: 0 8px 24px rgb(164 138 86 / 20%);
        transform: translateY(-4px);
    }

    &--prev {
        align-items: flex-start;
        text-align: left;
    }

    &--next {
        align-items: flex-end;
        text-align: right;
    }

    &--placeholder {
        visibility: hidden;
    }

    &__label {
        margin-bottom: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        opacity: 0.7;

        @include sp {
            margin-bottom: 6px;
            font-size: 0.8125rem;
        }
    }

    &__title {
        font-size: 1.125rem;
        font-weight: 600;

        @include sp {
            font-size: 1rem;
        }
    }
}
</style>
