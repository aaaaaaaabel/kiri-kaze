<template>
    <NuxtLink :to="`/portfolio/${project.slug}`" class="project-card">
        <!-- 縮圖區 -->
        <div class="project-card__thumbnail">
            <img :src="project.thumbnail" :alt="project.title" class="project-card__image" />
            <!-- 公司標籤 -->
            <span v-if="project.company" class="project-card__company-badge">
                {{ project.company }}
            </span>
            <!-- 精選標記 -->
            <span v-if="project.featured" class="project-card__featured-badge">⭐</span>
        </div>

        <!-- 資訊區 -->
        <div class="project-card__content">
            <!-- 標題 -->
            <h3 class="project-card__title">{{ project.title }}</h3>

            <!-- 角色 + 期間 -->
            <p class="project-card__meta">
                {{ project.role }} · {{ project.period }}
            </p>

            <!-- 簡短描述 -->
            <p class="project-card__description">{{ truncatedDescription }}</p>

            <!-- 技術標籤 -->
            <div class="project-card__technologies">
                <span
                    v-for="(tech, index) in displayedTechnologies"
                    :key="index"
                    class="project-card__tech-tag"
                >
                    {{ tech.name }}
                </span>
                <span v-if="remainingTechCount > 0" class="project-card__tech-more">
                    +{{ remainingTechCount }}
                </span>
            </div>

            <!-- Category 標籤 -->
            <div class="project-card__category">
                <span class="project-card__category-badge" :class="`project-card__category-badge--${project.category}`">
                    {{ categoryLabel }}
                </span>
            </div>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import type { IProject } from '~/types/portfolio'
import { PROJECT_CATEGORY_LABELS } from '~/types/portfolio'
import { computed } from 'vue'

// Props
const props = defineProps<{
    project: IProject
}>()

// 最多顯示的技術標籤數量
const MAX_TECH_DISPLAY = 4

// 截斷描述（最多 2-3 行）
const truncatedDescription = computed(() => {
    const maxLength = 120
    if (props.project.description.length <= maxLength) {
        return props.project.description
    }
    return props.project.description.substring(0, maxLength) + '...'
})

// 顯示的技術標籤
const displayedTechnologies = computed(() => {
    return props.project.technologies.slice(0, MAX_TECH_DISPLAY)
})

// 剩餘技術數量
const remainingTechCount = computed(() => {
    const total = props.project.technologies.length
    return total > MAX_TECH_DISPLAY ? total - MAX_TECH_DISPLAY : 0
})

// 分類標籤文字
const categoryLabel = computed(() => {
    return PROJECT_CATEGORY_LABELS[props.project.category].zh
})
</script>

<style scoped lang="scss">
.project-card {
    display: block;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e0e0e0;
    transition: all 0.25s ease-in-out;
    text-decoration: none;
    color: inherit;
    cursor: pointer;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(164, 138, 86, 0.2);
        border-color: rgb(164, 138, 86);
    }

    &__thumbnail {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        background-color: #f5f5f5;
    }

    &__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease-in-out;
    }

    &:hover &__image {
        transform: scale(1.05);
    }

    &__company-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 0.375rem 0.75rem;
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgb(164, 138, 86);
        z-index: 10;
    }

    &__featured-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        font-size: 1.25rem;
        z-index: 10;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    &__content {
        padding: 1.5rem;
    }

    &__title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #000;
        margin-bottom: 0.5rem;
        line-height: 1.4;
    }

    &__meta {
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.75rem;
        line-height: 1.5;
    }

    &__description {
        font-size: 0.875rem;
        color: #666;
        line-height: 1.6;
        margin-bottom: 1rem;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__technologies {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    &__tech-tag {
        padding: 0.25rem 0.75rem;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #333;
        font-weight: 500;
    }

    &__tech-more {
        padding: 0.25rem 0.75rem;
        background-color: #e0e0e0;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #666;
        font-weight: 500;
    }

    &__category {
        display: flex;
        align-items: center;
    }

    &__category-badge {
        padding: 0.375rem 0.875rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        border: 1px solid rgb(164, 138, 86);
        background-color: #fff;
        color: rgb(164, 138, 86);
        transition: all 0.25s ease-in-out;

        &--work {
            border-color: rgb(164, 138, 86);
            color: rgb(164, 138, 86);
        }

        &--personal {
            border-color: #666;
            color: #666;
        }

        &--side-project {
            border-color: rgb(164, 138, 86);
            color: rgb(164, 138, 86);
        }
    }

    &:hover &__category-badge {
        background-color: rgb(164, 138, 86);
        color: #fff;
    }
}
</style>

