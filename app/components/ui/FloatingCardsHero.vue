<template>
  <section class="floating-cards-hero-wrapper">
    <div ref="heroRef" class="floating-cards-hero" :style="darkLayerStyle">
      <!-- 背景固定卡片 -->
      <div class="floating-cards-hero__background">
        <div
          v-for="(card, index) in floatingCards"
          :key="`card-${index}`"
          class="floating-card"
          :style="getCardStyle(card, index)"
        >
          <img
            :src="card.thumbnail"
            :alt="card.speciesName"
            class="floating-card__image"
            @error="handleImageError"
          />
        </div>
      </div>

      <!-- 前景內容：隨滾動上移並淡出 -->
      <div class="floating-cards-hero__foreground" :style="foregroundStyle">
        <div class="floating-cards-hero__content">
          <h1 class="floating-cards-hero__title">
            Explore the Wonders of Ancient Life
          </h1>
          <p class="floating-cards-hero__subtitle">
            Discover traces of life from millions of years ago, each fossil is a
            witness of time
          </p>
          <button class="floating-cards-hero__cta" @click="triggerGoToQuote">
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IFossil } from "~/types/fossil";
import heroBnList from "../../../data/hero_bn.json";

export interface HeroBnItem {
  file: string;
  width: number;
  height: number;
}

interface Props {
  fossils?: IFossil[];
}

const props = withDefaults(defineProps<Props>(), {
  fossils: () => [],
});

const heroRef = ref<HTMLElement | null>(null);
const mouseX = ref(0);
const mouseY = ref(0);
const scrollProgress = ref(0);
const contentFadeProgress = ref(0);
const TRANSITION_DURATION = 1500;
const isTransitioning = ref(false);
const isReverseTransitioning = ref(false);
let transitionRafId = 0;
let reverseTransitionRafId = 0;
const heroWasOut = ref(false);

const HERO_BN_BASE = "/images/hero_bn";
const CARD_MAX_W = 140;
const CARD_MAX_H = 180;

const floatingCards = computed(() => {
  const list = (heroBnList as HeroBnItem[]).filter(
    (item) => item.file && (item.width || item.height),
  );
  if (list.length > 0) {
    return list.map((item) => ({
      thumbnail: `${HERO_BN_BASE}/${item.file}`,
      speciesName: "化石",
      id: item.file,
      width: item.width || 800,
      height: item.height || 600,
    }));
  }
  return props.fossils.slice(0, 25).map((fossil) => ({
    thumbnail: fossil.thumbnail || "",
    speciesName: fossil.speciesRef?.name?.zh || "化石",
    id: fossil.id || fossil.slug,
    width: 800,
    height: 600,
  }));
});

const cardPositions = ref<
  Array<{
    x: number;
    y: number;
    rotation: number;
    baseX: number;
    baseY: number;
  }>
>([]);

const HERO_CARD_LAYOUT: Array<{
  baseX: number;
  baseY: number;
  rotation: number;
}> = [
  { baseX: 12, baseY: 11, rotation: -5 },
  { baseX: 18, baseY: 38, rotation: 4 },
  { baseX: 10, baseY: 58, rotation: -6 },
  { baseX: 16, baseY: 72, rotation: 5 },
  { baseX: 13, baseY: 88, rotation: -4 },
  { baseX: 88, baseY: 14, rotation: 6 },
  { baseX: 82, baseY: 36, rotation: -5 },
  { baseX: 86, baseY: 56, rotation: 4 },
  { baseX: 90, baseY: 74, rotation: -6 },
  { baseX: 85, baseY: 90, rotation: 5 },
  { baseX: 26, baseY: 8, rotation: 5 },
  { baseX: 52, baseY: 6, rotation: -4 },
  { baseX: 74, baseY: 11, rotation: 6 },
  { baseX: 30, baseY: 90, rotation: -5 },
  { baseX: 48, baseY: 92, rotation: 4 },
  { baseX: 70, baseY: 88, rotation: 5 },
  { baseX: 22, baseY: 24, rotation: -3 },
  { baseX: 17, baseY: 68, rotation: 4 },
  { baseX: 78, baseY: 22, rotation: 5 },
  { baseX: 83, baseY: 66, rotation: -4 },
];

const initCardPositions = () => {
  if (cardPositions.value.length > 0) return;
  const layout = HERO_CARD_LAYOUT;
  cardPositions.value = floatingCards.value.map((_, index) => {
    const slot = layout[index % layout.length]!;
    return {
      x: slot.baseX,
      y: slot.baseY,
      rotation: slot.rotation,
      baseX: slot.baseX,
      baseY: slot.baseY,
    };
  });
};

const foregroundStyle = computed(() => {
  const p = contentFadeProgress.value;
  return {
    opacity: 1 - p,
    transform: `translateY(${-p * 56}px)`,
  };
});

const darkLayerStyle = computed(() => ({
  opacity: 1 - scrollProgress.value,
}));

const getCardStyle = (card: any, index: number) => {
  const pos = cardPositions.value[index];
  if (!pos) return {};
  const depthMultiplier = 0.5 + (index % 3) * 0.25;
  const cursorOffsetX = (mouseX.value - 0.5) * 40 * depthMultiplier;
  const cursorOffsetY = (mouseY.value - 0.5) * 40 * depthMultiplier;
  const cardCenterX = pos.baseX - 50;
  const cardCenterY = pos.baseY - 50;
  const angle = Math.atan2(cardCenterY, cardCenterX);
  const expandDistance = scrollProgress.value * 200;
  const expandX = Math.cos(angle) * expandDistance;
  const expandY = Math.sin(angle) * expandDistance;
  return {
    left: `${pos.baseX}%`,
    top: `${pos.baseY}%`,
    width: `${CARD_MAX_W}px`,
    height: `${CARD_MAX_H}px`,
    transform: `
      translate(${cursorOffsetX + expandX}px, ${cursorOffsetY + expandY}px)
      rotate(${pos.rotation}deg)
    `,
    opacity: 1,
    "--card-blur": "0px",
  };
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

const smoothScrollTo = (targetScrollY: number, durationMs: number) => {
  if (!import.meta.client) return;
  const startY = window.scrollY;
  const startTime = performance.now();
  const tick = () => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / durationMs, 1);
    const eased = 1 - (1 - t) ** 1.5;
    const y = startY + (targetScrollY - startY) * eased;
    window.scrollTo(0, y);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// Anchors cache: wheel snap / CTA only; scroll handler does not use anchors
type Anchors = { hero: number; quote: number; gallery: number };
const anchorsCache = ref<Anchors | null>(null);

function refreshAnchorsCache(): Anchors | null {
  if (!import.meta.client) return null;
  const quoteEl = document.querySelector(".hero-quote-section");
  const galleryEl = document.querySelector(".fossils-page__gallery");
  if (!quoteEl || !galleryEl) {
    anchorsCache.value = null;
    return null;
  }
  const y = window.scrollY;
  const next: Anchors = {
    hero: 0,
    quote: quoteEl.getBoundingClientRect().top + y,
    gallery: galleryEl.getBoundingClientRect().top + y,
  };
  anchorsCache.value = next;
  return next;
}

function getAnchors(): Anchors | null {
  if (anchorsCache.value) return anchorsCache.value;
  return refreshAnchorsCache();
}

type Zone = "hero" | "quote" | "gallery";
const ZONE_MARGIN = 40;
const GALLERY_TOP_THRESHOLD = 180;

const getZone = (scrollY: number, anchors: Anchors): Zone => {
  if (scrollY < anchors.quote - ZONE_MARGIN) return "hero";
  if (scrollY < anchors.gallery - ZONE_MARGIN) return "quote";
  return "gallery";
};

const isAtTopOfGallery = (scrollY: number, anchors: Anchors): boolean =>
  scrollY <= anchors.gallery + GALLERY_TOP_THRESHOLD;

const getQuoteSectionScrollTop = (): number | null => {
  const a = getAnchors();
  return a ? a.quote : null;
};

const emit = defineEmits<{ (e: "navigated-to-quote"): void }>();

const hasTriggeredAutoScroll = ref(false);
const isAutoScrolling = ref(false);

const triggerGoToQuote = () => {
  if (hasTriggeredAutoScroll.value) return;
  hasTriggeredAutoScroll.value = true;
  emit("navigated-to-quote");
  startTransition();
};

const startTransition = () => {
  if (!heroRef.value?.parentElement || isTransitioning.value) return;
  const targetY = getQuoteSectionScrollTop();
  if (targetY !== null) {
    isAutoScrolling.value = true;
    smoothScrollTo(targetY, TRANSITION_DURATION);
    setTimeout(() => {
      isAutoScrolling.value = false;
    }, TRANSITION_DURATION + 50);
  }
  const wrapper = heroRef.value.parentElement;
  const wrapperHeight = wrapper.getBoundingClientRect().height;
  const startTime = performance.now();
  isTransitioning.value = true;
  const tick = () => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / TRANSITION_DURATION, 1);
    const eased = 1 - (1 - t) ** 1.5;
    contentFadeProgress.value = eased;
    scrollProgress.value = eased;
    if (heroRef.value) {
      heroRef.value.style.transform = `translateY(${-eased * wrapperHeight * 0.7}px)`;
    }
    if (t < 1) {
      transitionRafId = requestAnimationFrame(tick);
    } else {
      isTransitioning.value = false;
    }
  };
  transitionRafId = requestAnimationFrame(tick);
};

const startReverseTransition = () => {
  if (!heroRef.value?.parentElement || isReverseTransitioning.value) return;
  const wrapper = heroRef.value.parentElement;
  const heroSectionTop = Math.max(
    0,
    wrapper.getBoundingClientRect().top + window.scrollY,
  );
  isAutoScrolling.value = true;
  smoothScrollTo(heroSectionTop, TRANSITION_DURATION);
  setTimeout(() => {
    isAutoScrolling.value = false;
  }, TRANSITION_DURATION + 50);
  const wrapperHeight = wrapper.getBoundingClientRect().height;
  const startTime = performance.now();
  isReverseTransitioning.value = true;
  const tick = () => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / TRANSITION_DURATION, 1);
    const progress = (1 - t) ** 1.5;
    contentFadeProgress.value = progress;
    scrollProgress.value = progress;
    if (heroRef.value) {
      heroRef.value.style.transform = `translateY(${-progress * wrapperHeight * 0.7}px)`;
    }
    if (t < 1) {
      reverseTransitionRafId = requestAnimationFrame(tick);
    } else {
      contentFadeProgress.value = 0;
      scrollProgress.value = 0;
      if (heroRef.value) heroRef.value.style.transform = "translateY(0)";
      isReverseTransitioning.value = false;
      hasTriggeredAutoScroll.value = false;
    }
  };
  reverseTransitionRafId = requestAnimationFrame(tick);
};

// goToAnchor: isAutoScrolling only set inside here / startTransition / startReverseTransition
const goToAnchor = (target: Zone, fromZone: Zone) => {
  const anchors = getAnchors();
  if (!anchors) return;
  if (target === "hero") {
    startReverseTransition();
    return;
  }
  if (target === "quote") {
    if (fromZone === "hero") {
      triggerGoToQuote();
    } else {
      isAutoScrolling.value = true;
      smoothScrollTo(anchors.quote, TRANSITION_DURATION);
      setTimeout(() => {
        isAutoScrolling.value = false;
      }, TRANSITION_DURATION + 50);
    }
    return;
  }
  if (target === "gallery") {
    isAutoScrolling.value = true;
    smoothScrollTo(anchors.gallery, TRANSITION_DURATION);
    setTimeout(() => {
      isAutoScrolling.value = false;
    }, TRANSITION_DURATION + 50);
  }
};

const handleMouseMove = (event: MouseEvent) => {
  if (!heroRef.value || !import.meta.client) return;
  const rect = heroRef.value.getBoundingClientRect();
  mouseX.value = (event.clientX - rect.left) / rect.width;
  mouseY.value = (event.clientY - rect.top) / rect.height;
};

// Desktop-only wheel snap: (hover: hover) and (pointer: fine)
const isDesktopSnapMode = ref(false);
let mql: MediaQueryList | null = null;
let optimizedScroll: () => void = () => {};
let onWheelHandler: (e: WheelEvent) => void = () => {};
let onMatchChange: (e: MediaQueryListEvent) => void = () => {};
let resizeHandler: () => void = () => {};
let orientationHandler: () => void = () => {};
let loadHandler: () => void = () => {};

// Scroll: visual sync only (no anchors, no goToAnchor)
const handleScroll = () => {
  if (!heroRef.value || !import.meta.client) return;
  if (
    isAutoScrolling.value ||
    isTransitioning.value ||
    isReverseTransitioning.value
  ) {
    return;
  }
  const wrapper = heroRef.value.parentElement;
  if (!wrapper) return;
  const wrapperRect = wrapper.getBoundingClientRect();
  const wrapperTop = wrapperRect.top;
  const wrapperHeight = wrapperRect.height;
  const scrollY = window.scrollY;

  if (wrapperTop < 0 && wrapperTop + wrapperHeight > 0) {
    const p = Math.min(Math.abs(wrapperTop) / wrapperHeight, 1);
    scrollProgress.value = p;
    contentFadeProgress.value = p;
    if (heroRef.value) {
      heroRef.value.style.transform = `translateY(${wrapperTop * 0.7}px)`;
    }
  } else if (wrapperTop + wrapperHeight <= 0) {
    heroWasOut.value = true;
    scrollProgress.value = 1;
    contentFadeProgress.value = 1;
    if (heroRef.value) {
      heroRef.value.style.transform = `translateY(${-wrapperHeight * 0.7}px)`;
    }
  } else {
    scrollProgress.value = 0;
    contentFadeProgress.value = scrollY <= 0 ? 0 : contentFadeProgress.value;
    if (scrollY <= 0) hasTriggeredAutoScroll.value = false;
    if (heroRef.value) heroRef.value.style.transform = "translateY(0)";
  }
};

const WHEEL_DELTA_THRESHOLD = 8;

onMounted(() => {
  if (!import.meta.client) return;

  mql = window.matchMedia("(hover: hover) and (pointer: fine)");
  isDesktopSnapMode.value = mql.matches;
  onMatchChange = (e: MediaQueryListEvent) => {
    isDesktopSnapMode.value = e.matches;
  };
  mql.addEventListener("change", onMatchChange);

  initCardPositions();
  if (heroRef.value) {
    heroRef.value.addEventListener("mousemove", handleMouseMove, { passive: true });
  }

  let ticking = false;
  optimizedScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener("scroll", optimizedScroll, { passive: true });

  // Desktop-only wheel snap; |deltaY| >= 8 to avoid touchpad jitter; isAutoScrolling only inside goToAnchor/start*
  onWheelHandler = (e: WheelEvent) => {
    if (
      isAutoScrolling.value ||
      isTransitioning.value ||
      isReverseTransitioning.value
    ) {
      e.preventDefault();
      return;
    }
    if (!isDesktopSnapMode.value) return;
    if (Math.abs(e.deltaY) < WHEEL_DELTA_THRESHOLD) return;

    const anchors = getAnchors();
    if (!anchors) return;
    const zone = getZone(window.scrollY, anchors);

    if (e.deltaY > 0) {
      if (zone === "hero") {
        e.preventDefault();
        goToAnchor("quote", "hero");
      } else if (zone === "quote") {
        e.preventDefault();
        goToAnchor("gallery", "quote");
      }
    } else if (e.deltaY < 0) {
      if (zone === "gallery" && isAtTopOfGallery(window.scrollY, anchors)) {
        e.preventDefault();
        goToAnchor("quote", "gallery");
      } else if (zone === "quote") {
        e.preventDefault();
        goToAnchor("hero", "quote");
      }
    }
  };
  window.addEventListener("wheel", onWheelHandler, { passive: false });

  refreshAnchorsCache();
  resizeHandler = () => refreshAnchorsCache();
  orientationHandler = () => {
    nextTick(() => refreshAnchorsCache());
  };
  loadHandler = () => refreshAnchorsCache();
  window.addEventListener("resize", resizeHandler);
  window.addEventListener("orientationchange", orientationHandler);
  window.addEventListener("load", loadHandler);

  nextTick(() => {
    refreshAnchorsCache();
    handleScroll();
  });
});

onUnmounted(() => {
  if (transitionRafId) cancelAnimationFrame(transitionRafId);
  if (reverseTransitionRafId) cancelAnimationFrame(reverseTransitionRafId);
  if (heroRef.value) {
    heroRef.value.removeEventListener("mousemove", handleMouseMove);
  }
  window.removeEventListener("scroll", optimizedScroll);
  window.removeEventListener("wheel", onWheelHandler);
  if (mql) mql.removeEventListener("change", onMatchChange);
  window.removeEventListener("resize", resizeHandler);
  window.removeEventListener("orientationchange", orientationHandler);
  window.removeEventListener("load", loadHandler);
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.floating-cards-hero-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  background: transparent;
  border: none;
  box-shadow: none;

  @include sp {
    min-height: 500px;
  }
}

.floating-cards-hero {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition:
    opacity 0.45s ease-out,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}

.floating-cards-hero__background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.floating-card {
  position: absolute;
  min-width: 80px;
  min-height: 100px;
  max-width: 140px;
  max-height: 180px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  will-change: transform, opacity, filter;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
  backdrop-filter: blur(0);
  filter: blur(var(--card-blur, 2px));

  @include sp {
    max-width: 100px;
    max-height: 130px;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(0.95) contrast(1.05);
  }
}

.floating-cards-hero__foreground {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.25s ease-out,
    transform 0.25s ease-out;
  backdrop-filter: blur(0.5px);
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      ellipse at center,
      transparent 0%,
      rgba(0, 0, 0, 0.2) 100%
    );
    pointer-events: none;
  }
}

.floating-cards-hero__content {
  text-align: center;
  padding: 32px 24px;
  max-width: 640px;

  @include sp {
    padding: 20px 16px;
  }
}

.floating-cards-hero__title {
  font-size: 3rem;
  font-weight: 400;
  color: #ffffff;
  margin: 0 0 16px;
  line-height: 1.2;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.15rem;
  @include tb {
    font-size: 2rem;
  }

  @include sp {
    font-size: 1.5rem;
  }
}

.floating-cards-hero__subtitle {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 28px;
  line-height: 1.55;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  @include sp {
    font-size: 0.9rem;
    margin-bottom: 22px;
  }
}

.floating-cards-hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 400;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.1rem;
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @include sp {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}
</style>
