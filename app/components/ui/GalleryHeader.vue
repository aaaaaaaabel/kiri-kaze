<template>
  <div class="gallery-header">
    <img
      src="/images/index-txt.png"
      alt="化石圖鑑"
      class="gallery-header__title-image"
    >
  </div>
</template>

<script setup lang="ts">
// 圖鑑標題圖，首頁跟收藏頁共用同一個標頭（原本兩邊各寫了一份一樣的 markup/CSS）。
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--lc-space-lg);
  margin-bottom: var(--lc-space-sm);
  text-align: center;

  @include sp {
    padding: var(--lc-space-md) var(--lc-space-sm) 0;
    margin-top: 68px;
    margin-bottom: 0;
  }

  &__title-image {
    display: block;
    width: 100%;
    max-width: 1000px;
    height: auto;
    padding: var(--lc-space-sm);
    margin: 0 auto;

    @include sp {
      max-width: 90%;
    }
  }
}
</style>
