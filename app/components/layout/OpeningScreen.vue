<template>
  <div class="opening-screen" :class="{ 'opening-screen--off': isOff }">
    <div class="opening-screen__inner">
      <p ref="textRef" class="opening-screen__text">Lacunae</p>
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
@use "~/assets/styles/abstracts" as *;

.opening-screen {
  position: fixed;
  inset: 0;
  z-index: var(--lc-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;

  // 純視覺開場：不攔截 header／Menu 點擊，避免「第一次點失效」
  pointer-events: none;
  background: var(--lc-color-black);

  &--off {
    pointer-events: none;
    animation: opening-fade-out var(--lc-transition-slow) ease-out forwards;
  }
}

@keyframes opening-fade-out {
  to {
    opacity: 0;
  }
}

.opening-screen__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.opening-screen__text {
  margin: 0;
  font-family: var(--lc-font-logo);
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-style: italic;
  font-weight: 900;
  color: var(--lc-color-white);
  letter-spacing: 0;
  opacity: 0; /* 初始 0，由 Web Animations API 淡入 */
}

@include tb {
  .opening-screen__text {
    font-size: clamp(2rem, 7vw, 4rem);
  }
}

@include sp {
  .opening-screen__text {
    font-size: clamp(1.75rem, 9vw, 3rem);
  }
}
</style>
