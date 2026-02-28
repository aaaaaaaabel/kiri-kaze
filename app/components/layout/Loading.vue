<template>
  <div
    class="loading"
    :class="{ 'loading--on': isLoading, 'loading--off': !isLoading }"
  >
    <div class="loading_inner">
      <p class="loading_text" :class="{ 'loading_text--visible': isLoading }">
        KiriKazeFossil
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
  width: 100%;
  height: 100%;
  position: fixed;
  inset: 0;
  user-select: none;
  cursor: default;
  pointer-events: auto;
  z-index: 200;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;

  &--on {
    background-color: #000;
    z-index: 400;
  }

  &--off {
    animation: loadingFadeOut 1s ease-out forwards;
  }
}

@keyframes loadingFadeOut {
  to {
    opacity: 0;
  }
}

.loading_inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading_text {
  margin: 0;
  color: #fff;
  font-family: Georgia, "Times New Roman", "Noto Serif", "Noto Serif TC", serif;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0;
  transform: scale(0.98);

  .loading--on & {
    animation: loadingTextFlash 0.55s ease-out 0.15s forwards;
  }
}

@keyframes loadingTextFlash {
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
