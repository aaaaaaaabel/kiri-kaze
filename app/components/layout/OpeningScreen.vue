<template>
  <div class="opening-screen" :class="{ 'opening-screen--off': isOff }">
    <div class="opening-screen__inner">
      <p ref="textRef" class="opening-screen__text">KiriKazeFossil</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: "done"): void }>();
const textRef = ref<HTMLElement | null>(null);
const isOff = ref(false);
const DURATION = 5000;
const FADE_OUT = 1000;

onMounted(() => {
  const el = textRef.value;
  if (!el) return;
  el.style.opacity = "0";

  const startId = setTimeout(() => {
    el.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.25 },
        { opacity: 0, offset: 0.5 },
        { opacity: 1, offset: 0.75 },
        { opacity: 0, offset: 1 },
      ],
      {
        duration: 5000,
        easing: "ease-in-out",
        fill: "forwards",
      },
    );
  }, 120);

  const t = setTimeout(() => {
    isOff.value = true;
    setTimeout(() => emit("done"), FADE_OUT);
  }, DURATION);
  onUnmounted(() => {
    clearTimeout(startId);
    clearTimeout(t);
  });
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/mixins" as *;
@use "~/assets/styles/variables" as *;

.opening-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;

  &--off {
    animation: openingFadeOut 1s ease-out forwards;
    pointer-events: none;
  }
}

@keyframes openingFadeOut {
  to {
    opacity: 0;
  }
}

.opening-screen__inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.opening-screen__text {
  margin: 0;
  color: #fff;
  font-family: $font-family-en;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 400;
  letter-spacing: 0.7em;
  // text-transform: uppercase;
  opacity: 0; /* 初始 0，由 Web Animations API 淡入 */
}

@include tb {
  .opening-screen__text {
    font-size: clamp(1.25rem, 3.5vw, 2rem);
  }
}

@include sp {
  .opening-screen__text {
    font-size: clamp(1.1rem, 5vw, 1.5rem);
    letter-spacing: 0.12em;
  }
}
</style>
