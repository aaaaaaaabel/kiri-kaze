<template>
  <div v-if="!imageError" class="fossil-card" @click="handleClick">
    <div class="fossil-card__image-wrapper">
      <img
        :src="thumbnailUrl"
        :alt="fossil.speciesRef?.name?.zh || '化石圖片'"
        class="fossil-card__image"
        @error="handleImageError"
        @load="handleImageLoad"
      >
      <div class="fossil-card__overlay">
        <div class="fossil-card__like" @click.stop="handleFavorite">
          <Heart
            :size="24"
            :stroke-width="2"
            class="fossil-card__like-icon"
            :class="{ liked: isLiked }"
          />
        </div>
        <div class="fossil-card__info">
          <h3 class="fossil-card__title">{{ fossil.speciesRef.name.zh }}</h3>
          <p class="fossil-card__period">
            {{ fossil.speciesRef.name.scientific }}
          </p>
          <!-- ⭐ 顯示標本類型（如果有） -->
          <p v-if="specimenLabel" class="fossil-card__specimen">
            {{ specimenLabel }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IFossil } from "~/types/fossil";
import { Heart } from "lucide-vue-next";
import { useMedia } from "~/composables/useMedia";

interface Props {
  fossil: IFossil;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [fossil: IFossil];
  favorite: [fossilId: string];
}>();

// 圖片 URL（已經在資料載入時正規化過，這裡直接使用）
const thumbnailUrl = computed(() => {
  if (!props.fossil.thumbnail) {
    console.warn(
      "⚠️ Fossil thumbnail is empty:",
      props.fossil.id || props.fossil.slug,
    );
    return "";
  }

  let finalUrl = props.fossil.thumbnail;

  // 如果已經是完整 URL（http/https），直接使用
  if (finalUrl.startsWith("http://") || finalUrl.startsWith("https://")) {
    return finalUrl;
  }

  // 如果是本地圖片（以 / 開頭），直接使用
  if (finalUrl.startsWith("/")) {
    return finalUrl;
  }

  // 否則嘗試正規化（但理論上應該已經處理過了）
  // 只在客戶端執行正規化
  if (import.meta.client) {
    try {
      const { toMediaUrl } = useMedia();
      finalUrl = toMediaUrl(finalUrl);

      // 調試：記錄轉換結果
      if (
        process.env.NODE_ENV === "development" &&
        !finalUrl.startsWith("http")
      ) {
        console.warn("⚠️ URL 正規化可能失敗:", {
          original: props.fossil.thumbnail,
          converted: finalUrl,
          fossilId: props.fossil.id || props.fossil.slug,
        });
      }
    } catch (err) {
      console.error("❌ URL 正規化錯誤:", err, {
        thumbnail: props.fossil.thumbnail,
        fossilId: props.fossil.id || props.fossil.slug,
      });
    }
  }

  return finalUrl;
});

const { isFavorited, toggleFavorite } = useFavorites();
const fossilId = computed(() => props.fossil.id || props.fossil.slug || "");
const isLiked = computed(() => !!fossilId.value && isFavorited(fossilId.value));

// 圖片載入錯誤狀態
const imageError = ref(false);

// ⭐ 標本標籤（顯示部位資訊）
const specimenLabel = computed(() => {
  if (props.fossil.specimen.bodyPart?.position) {
    return props.fossil.specimen.bodyPart.position;
  }
  if (props.fossil.specimen.bodyPart?.specific) {
    return props.fossil.specimen.bodyPart.specific;
  }
  if (props.fossil.specimen.catalogNumber) {
    return props.fossil.specimen.catalogNumber;
  }
  return null;
});

// 點擊卡片
const handleClick = () => {
  emit("click", props.fossil);
};

// 點擊愛心（已用 @click.stop 阻止冒泡）；未登入也寫入 localStorage，不跳出登入視窗
const handleFavorite = async () => {
  const id = fossilId.value;
  if (!id) return;
  await toggleFavorite(id);
  emit("favorite", id);
};

// 圖片載入錯誤處理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.error("❌ 圖片載入失敗:", {
    src: img.src,
    fossilId: props.fossil.id || props.fossil.slug,
    thumbnail: props.fossil.thumbnail,
  });

  // 設置錯誤狀態，隱藏整個卡片
  imageError.value = true;
};

// 圖片載入成功（調試用）
const handleImageLoad = (event: Event) => {
  if (process.env.NODE_ENV === "development") {
    const img = event.target as HTMLImageElement;
    console.warn("✅ 圖片載入成功:", img.src);
  }
};
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.fossil-card {
  width: 100%;
  overflow: hidden;
  cursor: pointer;
  background-color: #0000;
  border-radius: 20px;
  box-shadow: 0 2px 3px rgb(0 0 0 / 30%);
  transition: all 0.3s ease-in-out;

  &:hover {
    box-shadow: 0 4px 8px rgb(0 0 0 / 50%);
    transform: translateY(-2px);

    .fossil-card__overlay {
      opacity: 1;
    }
  }

  &__image-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  &__image {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    width: 100%;
    height: 100%;
    padding: 16px;
    background: linear-gradient(
      to bottom,
      rgb(0 0 0 / 0%) 0%,
      rgb(0 0 0 / 70%) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  &__like {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    cursor: pointer;
    background-color: rgb(255 255 255 / 90%);
    border-radius: 50%;
    transition: all 0.2s ease-in-out;

    &:hover {
      background-color: #fff;
      transform: scale(1.1);
    }
  }

  &__like-icon {
    flex-shrink: 0;
    fill: none;
    stroke: rgb(0 0 0 / 35%);
    transition: stroke 0.2s ease-in-out, fill 0.2s ease-in-out;

    &.liked {
      fill: $color-accent;
      stroke: $color-accent;
    }
  }

  &__info {
    color: #fff;
  }

  &__title {
    margin: 0 0 4px;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
    color: #fff;
  }

  &__period {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
    color: #fff;
    opacity: 0.9;
  }

  &__specimen {
    margin: 4px 0 0;
    font-size: 0.75rem;
    font-style: italic;
    line-height: 1.4;
    color: #fff;
    opacity: 0.8;
  }
}
</style>
