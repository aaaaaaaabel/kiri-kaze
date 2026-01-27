<template>
    <div class="home-page">
        <!-- Hero 區塊 -->
        <section class="hero">
            <h1 class="hero__title">探索古生物的世界</h1>
            <p class="hero__subtitle">收錄來自世界各地的珍貴化石標本</p>
        </section>

        <!-- 化石展示區 -->
        <section class="fossils-section">
            <h2 class="fossils-section__title">精選化石</h2>
            <div class="fossils-grid">
                <div v-for="i in 6" :key="i" class="fossil-card">
                    <div class="fossil-card__image">
                        <!-- 佔位圖 -->
                    </div>
                    <div class="fossil-card__content">
                        <h3 class="fossil-card__name">化石標本 {{ i }}</h3>
                        <p class="fossil-card__period">寒武紀 · 5.4 億年前</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 提示文字 -->
        <section class="notice">
            <p class="notice__text">瀑布流佈局即將呈現...</p>
        </section>
    </div>
</template>

<script setup lang="ts">
// 頁面 Meta
useHead({
    title: '化石索引 Fossil Index - 探索古生物的世界',
    meta: [
        {
            name: 'description',
            content: '收錄來自世界各地的珍貴化石標本',
        },
    ],
})
</script>

<style scoped lang="scss">
.home-page {
    width: 100%;
}

.hero {
    padding: 4rem 2rem;
    text-align: center;
    background: linear-gradient(135deg, rgba(164, 138, 86, 0.1) 0%, rgba(255, 255, 255, 1) 100%);

    &__title {
        font-size: 3rem;
        font-weight: 700;
        color: #000;
        margin-bottom: 1rem;
        line-height: 1.2;

        @media (max-width: 768px) {
            font-size: 2rem;
        }
    }

    &__subtitle {
        font-size: 1.25rem;
        color: #666;
        font-weight: 400;
        line-height: 1.6;

        @media (max-width: 768px) {
            font-size: 1rem;
        }
    }
}

.fossils-section {
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;

    &__title {
        font-size: 2rem;
        font-weight: 600;
        color: #000;
        margin-bottom: 2rem;
        text-align: center;

        @media (max-width: 768px) {
            font-size: 1.5rem;
        }
    }
}

.fossils-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
}

.fossil-card {
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e0e0e0;
    transition: all 0.25s ease-in-out;
    cursor: pointer;

    &:hover {
        border-color: rgb(164, 138, 86);
        box-shadow: 0 4px 12px rgba(164, 138, 86, 0.15);
        transform: translateY(-2px);
    }

    &__image {
        width: 100%;
        aspect-ratio: 3 / 4;
        background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
        position: relative;

        &::after {
            content: '🦴';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            opacity: 0.3;
        }
    }

    &__content {
        padding: 1.5rem;
    }

    &__name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #000;
        margin-bottom: 0.5rem;
        line-height: 1.4;
    }

    &__period {
        font-size: 0.875rem;
        color: #666;
        font-weight: 400;
        line-height: 1.5;
    }
}

.notice {
    padding: 2rem;
    text-align: center;

    &__text {
        font-size: 0.875rem;
        color: #999;
        font-weight: 400;
        margin: 0;
    }
}
</style>
