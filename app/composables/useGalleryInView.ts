import { useIntersectionObserver } from "@vueuse/core";
import type { Ref } from "vue";

const BODY_CLASS = "gallery-in-view";

/**
 * 當 gallery 元素進入視窗時在 body 加上 class（供 MainNav 的 portfolio 按鈕 fade-in）。
 * 兩頁共用：index.vue、collection.vue。
 */
export function useGalleryInView(galleryRef: Ref<HTMLElement | null>) {
  useIntersectionObserver(
    galleryRef,
    ([entry]) => {
      if (!import.meta.client) return;
      if (entry?.isIntersecting) {
        document.body.classList.add(BODY_CLASS);
      } else {
        document.body.classList.remove(BODY_CLASS);
      }
    },
    { threshold: 0.1 },
  );

  onUnmounted(() => {
    if (import.meta.client) document.body.classList.remove(BODY_CLASS);
  });
}
