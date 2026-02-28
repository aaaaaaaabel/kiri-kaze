<template>
  <div
    class="loading-spinner"
    :class="[
      `loading-spinner--${size}`,
      { 'loading-spinner--centered': centered },
      { 'loading-spinner--full-height': fullHeight },
    ]"
  >
    <div class="loading-spinner__spinner"></div>
    <p v-if="message" class="loading-spinner__message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
  size?: "small" | "medium" | "large";
  centered?: boolean;
  fullHeight?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: "Loading ...",
  size: "medium",
  centered: true,
  fullHeight: false,
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  width: 100%;

  &--centered {
    min-height: 400px;
  }

  &--full-height {
    min-height: 60vh;
  }

  &__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid $color-primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &--small {
    padding: 20px;

    .loading-spinner__spinner {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }

    .loading-spinner__message {
      font-size: 0.875rem;
      margin-top: 12px;
    }
  }

  &--large {
    padding: 60px 40px;

    .loading-spinner__spinner {
      width: 60px;
      height: 60px;
      border-width: 4px;
    }

    .loading-spinner__message {
      font-size: 1.125rem;
      margin-top: 20px;
    }
  }

  &__message {
    margin-top: 16px;
    font-size: 0.95rem;
    color: #666;
    text-align: center;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
