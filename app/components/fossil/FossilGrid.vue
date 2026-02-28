<template>
  <div class="fossil-grid">
    <!-- 初始載入：只要 loading 就顯示 spinner，不先顯示 grid（讓 MIN_LOADING_MS 生效） -->
    <LoadingSpinner
      v-if="loading"
      size="small"
      :message="loadingMessage"
    />

    <!-- 載入完成且有資料：顯示瀑布流，載入更多時在下方加 spinner -->
    <template v-else-if="fossils.length > 0">
      <div class="fossil-grid__container">
        <div
          v-for="fossil in fossils"
          :key="fossil.id"
          class="fossil-grid__item"
        >
          <FossilCard
            :fossil="fossil"
            @click="handleCardClick(fossil)"
            @favorite="handleFavorite(fossil.id)"
          />
        </div>
      </div>
      <LoadingSpinner
        v-if="loadingMore"
        size="small"
        class="fossil-grid__load-more"
      />
    </template>

    <!-- Empty State：支援 slot 自訂（如收藏頁） -->
    <div v-else class="fossil-grid__empty">
      <slot name="empty">
        <p>目前沒有化石資料。</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IFossil } from '~/types/fossil'
import FossilCard from './FossilCard.vue'
import LoadingSpinner from '~/components/ui/LoadingSpinner.vue'

interface Props {
  fossils: IFossil[]
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  loadingMessage?: string
}

interface Emits {
  (e: 'fossil-click', fossil: IFossil): void
  (e: 'favorite', fossilId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingMore: false,
  hasMore: false,
  loadingMessage: '載入圖鑑中...',
})

const emit = defineEmits<Emits>()

// 處理卡片點擊
const handleCardClick = (fossil: IFossil) => {
  emit('fossil-click', fossil)
}

// 收藏點擊
const handleFavorite = (fossilId: string) => {
  emit('favorite', fossilId)
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

.fossil-grid {
  width: 100%;
  margin: 0 auto;
  padding: 20px 40px;

  @include tb {
    padding: 20px 30px;
  }

  @include sp {
    padding: 15px;
  }

  &__empty {
    width: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;

    p {
      font-size: 1rem;
      color: $color-primary;
      margin: 0 0 16px 0;
    }
  }

  // ⭐ Pinterest 風格：使用 CSS Columns 瀑布流（與圖鑑頁一致）
  &__container {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    column-count: 4; // 桌面 4 列
    column-gap: 24px; // 與垂直間距一致
    column-fill: balance; // 平衡各列高度

    @media (max-width: 1024px) {
      column-count: 3; // 平板 3 列
      column-gap: 12px;
    }

    @media (max-width: 768px) {
      column-count: 2; // 手機 2 列
      column-gap: 16px;
    }
  }

  &__item {
    // 重要：防止卡片被分割到不同列
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 24px; // 桌機版垂直間距
    display: inline-block; // 必須設定，讓 break-inside 生效
    width: 100%; // 確保卡片填滿列寬

    @media (max-width: 1024px) {
      margin-bottom: 12px;
    }

    @media (max-width: 768px) {
      margin-bottom: 16px;
    }
  }

  &__load-more {
    margin-top: 24px;
    margin-bottom: 16px;
  }
}
</style>
