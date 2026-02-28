<template>
    <div class="project-detail-page" id="project-detail">
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
                                <img :src="thumbnailUrl" :alt="project.title" loading="eager" />
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
                                    />
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
                            <div v-else class="project-nav-item project-nav-item--placeholder"></div>

                            <NuxtLink
                                v-if="nextProject"
                                :to="`/portfolio/${nextProject.slug}`"
                                class="project-nav-item project-nav-item--next"
                            >
                                <span class="project-nav-item__label">下一個專案 →</span>
                                <span class="project-nav-item__title">{{ nextProject.title }}</span>
                            </NuxtLink>
                            <div v-else class="project-nav-item project-nav-item--placeholder"></div>
                        </div>
                    </section>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IProject, TechnologyCategory, ITechnology } from '~/types/portfolio'
import { PROJECT_CATEGORY_LABELS, TECHNOLOGY_CATEGORY_LABELS } from '~/types/portfolio'
import { useProjects } from '~/composables/useProjects'
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useWidgetsBlocksEvents } from '~/composables/useWidgetsBlocksEvents'
import { useStorage } from '~/composables/useStorage'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'
import { getStorageUrl } from '~/utils/storage'

// 獲取路由參數
const route = useRoute()
const slug = computed(() => {
    const p = route.params.slug
    // 防呆：某些情況下 params 可能是陣列（雖然 [slug].vue 理論上是 string）
    if (Array.isArray(p)) return p.join('/')
    if (typeof p === 'string') return p
    return ''
})

// 使用 composable
const { fetchProjectBySlug, fetchProjects } = useProjects()

const project = ref<IProject | null>(null)
const pending = ref(true)
const error = ref<Error | null>(null)

// 所有專案（用於上一個/下一個導航）
const allProjects = ref<IProject[]>([])

// Storage URL 轉換
const { storageBucket } = useFirebaseConfig()
const convertUrl = (url: string) => storageBucket ? getStorageUrl(url, storageBucket) : url

const thumbnailUrl = computed(() => {
    return project.value?.thumbnail ? convertUrl(project.value.thumbnail) : ''
})

const getImageUrl = (url: string | undefined): string => {
    return url ? convertUrl(url) : ''
}

// SEO Meta
useSeoMeta({
    title: computed(() => project.value ? `${project.value.title} - Portfolio` : 'Portfolio'),
    description: computed(() => project.value?.description || ''),
    ogTitle: computed(() => project.value?.title || ''),
    ogDescription: computed(() => project.value?.description || ''),
    ogImage: computed(() => thumbnailUrl.value || ''),
})

// 分類標籤
const categoryLabel = computed(() => {
    if (!project.value) return ''
    const category = project.value.category
    // 防呆：檢查 category 是否存在且為有效的 ProjectCategory
    if (!category || !PROJECT_CATEGORY_LABELS[category]) {
        console.warn('⚠️ [slug] 專案分類無效或不存在:', category)
        return '未分類'
    }
    return PROJECT_CATEGORY_LABELS[category].zh
})

const groupedTechnologies = computed(() => {
    if (!project.value?.technologies || !Array.isArray(project.value.technologies)) {
        return {}
    }
    
    const groups: Record<string, ITechnology[]> = {}
    project.value.technologies.forEach((tech) => {
        if (tech?.category) {
            const category = tech.category
            if (!groups[category]) {
                groups[category] = []
            }
            groups[category]!.push(tech)
        }
    })
    return groups
})

const getCategoryLabel = (category: TechnologyCategory) => {
    return TECHNOLOGY_CATEGORY_LABELS[category]?.zh || '其他'
}

// 上一個/下一個專案改用 allProjects
const currentIndex = computed(() => {
    return allProjects.value.findIndex((p) => p.slug === slug.value)
})

const previousProject = computed(() => {
    if (currentIndex.value <= 0) return null
    return allProjects.value[currentIndex.value - 1] ?? null
})

const nextProject = computed(() => {
    if (currentIndex.value < 0 || currentIndex.value >= allProjects.value.length - 1) return null
    return allProjects.value[currentIndex.value + 1] ?? null
})

// 參考 LRC：等資料載入 + DOM 完成後再執行 lazy load，並標記頁面完成
const runLazyImages = async () => {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (import.meta.client) {
        const nuxtApp = useNuxtApp()
        nuxtApp.$lazyLoadImage?.()
    }
}

const markPageReady = () => {
    const { toggleWidgetsBlockComplete } = useWidgetsBlocksEvents()
    toggleWidgetsBlockComplete(true)
}

onMounted(async () => {
    try {
        // 並行 fetch 當前專案和所有專案
        const [projectResult, allResult] = await Promise.all([
            fetchProjectBySlug(slug.value),
            fetchProjects({ publicOnly: true }),
        ])
        project.value = projectResult
        allProjects.value = allResult
    } catch (e) {
        if (import.meta.dev) console.error('[portfolio/slug] fetch error', e)
        error.value = e as Error
    } finally {
        pending.value = false
        await runLazyImages()
        markPageReady()
    }
})

// 監聽 slug 變化（client 端導航時重新 fetch）
watch(slug, async (newSlug, oldSlug) => {
    if (!newSlug || newSlug === oldSlug || !import.meta.client) return
    pending.value = true
    try {
        const [projectResult, allResult] = await Promise.all([
            fetchProjectBySlug(newSlug),
            fetchProjects({ publicOnly: true }),
        ])
        project.value = projectResult
        allProjects.value = allResult
    } catch (e) {
        error.value = e as Error
    } finally {
        pending.value = false
        await runLazyImages()
        markPageReady()
    }
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.project-detail-page {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: 100vh;
    margin: 0 auto;
    padding: 0;
    background-color: #fff;
    overflow-x: hidden;
    box-sizing: border-box;
}

.contents {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 0 auto;
    padding-top: 100px;
    box-sizing: border-box;
    overflow-x: hidden;

    @include tb {
        padding-top: 80px;
    }

    @include sp {
        padding-top: 68px;
    }
}

.contents_inner {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
    overflow-x: hidden;
}

// Loading & Error States
.project-error {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;
    box-sizing: border-box;

    @include tb {
        padding: 48px 24px;
    }

    @include sp {
        padding: 40px 20px;
    }

    h2 {
        font-size: 1.5rem;
        color: $color-primary;
        margin-bottom: 24px;

        @include sp {
            font-size: 1.25rem;
            margin-bottom: 20px;
        }
    }
}

// ==========================================
// Hero Section
// ==========================================
.project-hero {
    width: 100%;
    max-width: 100%;
    padding: 60px 40px;
    background-color: $color-gray-light;
    box-sizing: border-box;

    @include tb {
        padding: 48px 24px;
    }

    @include sp {
        padding: 32px 16px;
    }

    &__inner {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
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
        font-size: 2.5rem;
        font-weight: 700;
        color: $color-primary;
        margin-bottom: 12px;
        line-height: 1.3;

        @include sp {
            font-size: 1.75rem;
        }
    }

    &__title-en {
        font-size: 1.25rem;
        color: #666;
        font-weight: 400;

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
        font-size: 0.875rem;
        color: #999;
        margin-bottom: 8px;
        font-weight: 500;

        @include sp {
            font-size: 0.8125rem;
            margin-bottom: 4px;
        }
    }

    &__meta-value {
        font-size: 1rem;
        color: $color-primary;
        font-weight: 600;

        @include sp {
            font-size: 0.9375rem;
        }
    }

    &__image {
        width: 100%;
        max-width: min(1000px, 100%);
        margin: 0 auto;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;

        @include sp {
            border-radius: 6px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        img {
            max-width: 100%;
            width: 100%;
            height: auto;
            display: block;
            vertical-align: top;
        }
    }
}

// ==========================================
// Back Button
// ==========================================
.back-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    margin-bottom: 40px;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    text-decoration: none;
    color: $color-primary;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.25s ease-in-out;

    @include tb {
        margin-bottom: 32px;
    }

    @include sp {
        padding: 10px 16px;
        margin-bottom: 24px;
        font-size: 0.8125rem;
        border-radius: 6px;
    }

    &:hover {
        background-color: $color-accent;
        color: #fff;
        border-color: $color-accent;
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
    width: 100%;
    max-width: 100%;
    padding: 60px 40px;
    box-sizing: border-box;

    @include tb {
        padding: 48px 24px;
    }

    @include sp {
        padding: 32px 16px;
    }

    &--alt {
        background-color: $color-gray-light;
    }

    &__inner {
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
    }

    &__title {
        font-size: 1.75rem;
        font-weight: 600;
        color: $color-primary;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid $color-accent;

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
    color: #333;
    line-height: 1.8;
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
        font-size: 1rem;
        font-weight: 600;
        color: #666;
        margin-bottom: 12px;

        @include sp {
            font-size: 0.9375rem;
            margin-bottom: 10px;
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
    background-color: $color-gray-light;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    font-size: 0.875rem;
    color: $color-primary;
    font-weight: 500;
    transition: all 0.25s ease-in-out;

    @include sp {
        padding: 6px 12px;
        font-size: 0.8125rem;
        border-radius: 16px;
    }

    &:hover {
        background-color: $color-accent;
        color: #fff;
        border-color: $color-accent;
    }
}

// ==========================================
// Gallery
// ==========================================
.project-gallery {
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
    width: 100%;
    max-width: 100%;
    min-width: 0;

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
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

        @include sp {
            border-radius: 6px;
        }

        img {
            max-width: 100%;
            width: 100%;
            height: auto;
            display: block;
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
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background-color: $color-gray-light;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    text-decoration: none;
    color: $color-primary;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.25s ease-in-out;

    @include sp {
        padding: 12px 18px;
        font-size: 0.9375rem;
        gap: 8px;
        border-radius: 6px;
    }

    &:hover {
        background-color: $color-accent;
        color: #fff;
        border-color: $color-accent;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(164, 138, 86, 0.3);
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
    width: 100%;
    max-width: 100%;
    padding: 60px 40px;
    background-color: $color-gray-light;
    box-sizing: border-box;

    @include tb {
        padding: 48px 24px;
    }

    @include sp {
        padding: 32px 16px;
    }

    &__inner {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        box-sizing: border-box;

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
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    text-decoration: none;
    color: $color-primary;
    transition: all 0.25s ease-in-out;

    @include sp {
        padding: 18px 16px;
        border-radius: 6px;
    }

    &:hover {
        background-color: $color-accent;
        color: #fff;
        border-color: $color-accent;
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(164, 138, 86, 0.2);
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
        font-size: 0.875rem;
        font-weight: 500;
        opacity: 0.7;
        margin-bottom: 8px;

        @include sp {
            font-size: 0.8125rem;
            margin-bottom: 6px;
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
