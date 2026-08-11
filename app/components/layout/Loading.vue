<template>
  <div
    class="loading"
    :class="{ 'loading--on': isLoading, 'loading--off': !isLoading }"
  >
    <div class="loading_inner">
      <p class="loading_text" :class="{ 'loading_text--visible': isLoading }">
        Lacunae
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpening: boolean;
  isLoading: boolean;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.loading {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  cursor: default;
  user-select: none;
  background-color: transparent;

  &--on {
    z-index: 400;
    background-color: #000;
  }

  &--off {
    animation: loading-fade-out 1s ease-out forwards;
  }
}

@keyframes loading-fade-out {
  to {
    opacity: 0;
  }
}

.loading_inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading_text {
  margin: 0;
  font-family: $font-family-logo;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-style: italic;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0;
  opacity: 0;
  transform: scale(0.98);

  .loading--on & {
    animation: loading-text-flash 0.55s ease-out 0.15s forwards;
  }
}

@keyframes loading-text-flash {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@include tb {
  .loading_text {
    font-size: clamp(1.25rem, 3.5vw, 2rem);
  }
}

@include sp {
  .loading_text {
    font-size: clamp(1.1rem, 5vw, 1.5rem);
    letter-spacing: 0.12em;
  }
}
</style>
