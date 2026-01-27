<template>
    <div class="portfolio-page" id="home">
        <div id="top" class="contents">
            <div class="contents_inner">
                <div class="contents_detail">
                    <div class="contents_detail_inner">
                        <div id="grid" class="contents_block">
                            <div class="contents_block_inner">
                                <div class="grid_block">
                                    <PortfolioItem
                                        v-for="(project, index) in projects"
                                        :key="project.id"
                                        :project="{ ...project, technologies: project.technologies.map(t => ({ ...t })) } as IProject"
                                        :index="index"
                                        :animation-delay="index * 50"
                                    />
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
import type { IProject } from '~/types/portfolio'
import { useProjects } from '~/composables/useProjects'
import PortfolioItem from '~/components/portfolio/PortfolioItem.vue'

// SEO Meta
useSeoMeta({
    title: '作品集 - Fossil Index',
    description: '前端開發與設計作品展示',
})

// 使用 useProjects composable
const { projects, fetchProjects } = useProjects()
await fetchProjects({ publicOnly: true })
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.portfolio-page {
    width: 100%;
    min-height: 100vh;
    padding: 0;
    background-color: #fff;
}

.contents {
    width: 100%;
}

.contents_inner {
    width: 100%;
}

.contents_detail {
    width: 100%;
    padding-top: 150px; // PC 預設 padding-top

    @include tb {
        padding-top: 260px;
        margin-bottom: 50px;
    }

    @include sp {
        padding-top: 150px;
        margin-bottom: 30px;
    }
}

.contents_detail_inner {
    width: 100%;
}

.contents_block {
    width: 100%;
    padding-top: 75px;
    padding-bottom: 75px;
    position: relative;

    @include tb {
        padding-left: 60px;
        padding-right: 60px;
        padding-bottom: 60px;
    }

    @include sp {
        padding-left: 30px;
        padding-right: 30px;
        padding-top: 45px;
        padding-bottom: 45px;
    }
}

// #home 特殊樣式
#home .contents_block_inner {
    width: 100%;
    max-width: 100%;
}

.contents_block_inner {
    width: 100%;
    font-size: 0;
    line-height: 0;
}

.grid_block {
    width: 100%;
    font-size: 0;
    line-height: 0;
    text-align: left;
}

// #grid 特殊樣式
#grid {
    padding-top: 0;
    padding-left: 40px;
    padding-right: 40px;

    @include sp {
        padding-left: 15px;
        padding-right: 15px;
    }
}
</style>
