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
const scrollProgress = ref(0); // 0-1，卡片與區塊位移
const contentFadeProgress = ref(0); // 0-1，文字上移＋淡出
const TRANSITION_DURATION = 1500; // 1.5 秒過渡
const isTransitioning = ref(false);
const isReverseTransitioning = ref(false);
let transitionRafId = 0;
let reverseTransitionRafId = 0;
const heroWasOut = ref(false); // 用來偵測「從下一區塊滑回來」

const HERO_BN_BASE = "/images/hero_bn";
const CARD_MAX_W = 140;
const CARD_MAX_H = 180;

// 優先使用 data/hero_bn.json 的固定 20 張圖；若無則 fallback 化石前 25 張
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

// 生成卡片的固定位置（只在初始化時計算一次）
const cardPositions = ref<
  Array<{
    x: number;
    y: number;
    rotation: number;
    baseX: number; // 基準 X 位置（百分比）
    baseY: number; // 基準 Y 位置（百分比）
  }>
>([]);

// 設計稿對應位置：20 張卡片，不規則散落、避開中央文字區
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

// 前景文字區：一滾動就上移並淡出（用 contentFadeProgress）
const foregroundStyle = computed(() => {
  const p = contentFadeProgress.value;
  const opacity = 1 - p;
  const translateY = -p * 56;
  return {
    opacity,
    transform: `translateY(${translateY}px)`,
  };
});

// 黑色 Hero 層：過渡時淡出，露出白底與 quote 文字
const darkLayerStyle = computed(() => ({
  opacity: 1 - scrollProgress.value,
}));

// 獲取卡片樣式（包含游標視差和滾動向外移動效果）
const getCardStyle = (card: any, index: number) => {
  const pos = cardPositions.value[index];
  if (!pos) return {};

  // 游標視差效果：根據游標位置移動卡片（更細緻的視差）
  // 不同深度的卡片有不同的視差強度，創造更好的景深效果
  const depthMultiplier = 0.5 + (index % 3) * 0.25; // 0.5, 0.75, 1.0
  const cursorOffsetX = (mouseX.value - 0.5) * 40 * depthMultiplier; // 最大偏移根據深度調整
  const cursorOffsetY = (mouseY.value - 0.5) * 40 * depthMultiplier;

  // 滾動向外移動效果：根據滾動進度向外移動並淡出
  // 計算卡片中心到視窗中心的距離和方向
  const cardCenterX = pos.baseX - 50; // -50 到 50
  const cardCenterY = pos.baseY - 50; // -50 到 50
  const distance = Math.sqrt(
    cardCenterX * cardCenterX + cardCenterY * cardCenterY,
  );
  const angle = Math.atan2(cardCenterY, cardCenterX);

  // 根據滾動進度向外移動（不改變大小）
  const expandDistance = scrollProgress.value * 200; // 最大向外移動 200px
  const expandX = Math.cos(angle) * expandDistance;
  const expandY = Math.sin(angle) * expandDistance;

  // 設計稿：視覺尺寸較一致，統一用固定卡片框 + object-fit cover
  const cardW = CARD_MAX_W;
  const cardH = CARD_MAX_H;

  return {
    left: `${pos.baseX}%`,
    top: `${pos.baseY}%`,
    width: `${cardW}px`,
    height: `${cardH}px`,
    transform: `
      translate(${cursorOffsetX + expandX}px, ${cursorOffsetY + expandY}px)
      rotate(${pos.rotation}deg)
    `,
    opacity: 1,
    "--card-blur": "0px",
  };
};

// 處理圖片載入錯誤
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

// 自訂平滑捲動：固定 1.5s、與內容動畫同步，無中間停頓
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

// 依 class 取得三個錨點（位移停止位置）
const getAnchors = (): {
  hero: number;
  quote: number;
  gallery: number;
} | null => {
  if (!import.meta.client) return null;
  const quoteEl = document.querySelector(".hero-quote-section");
  const galleryEl = document.querySelector(".fossils-page__gallery");
  if (!quoteEl || !galleryEl) return null;
  const y = window.scrollY;
  return {
    hero: 0,
    quote: quoteEl.getBoundingClientRect().top + y,
    gallery: galleryEl.getBoundingClientRect().top + y,
  };
};

type Zone = "hero" | "quote" | "gallery";
const ZONE_MARGIN = 40;
// gallery 內捲動內容時不觸發錨點；只有「在 gallery 最上層」時往上滑才回到 quote
const GALLERY_TOP_THRESHOLD = 180;

const getZone = (
  scrollY: number,
  anchors: { hero: number; quote: number; gallery: number },
): Zone => {
  if (scrollY < anchors.quote - ZONE_MARGIN) return "hero";
  if (scrollY < anchors.gallery - ZONE_MARGIN) return "quote";
  return "gallery";
};

/** 是否在 gallery 最上層（剛進入 gallery），此時往上滑才觸發回 quote */
const isAtTopOfGallery = (
  scrollY: number,
  anchors: { hero: number; quote: number; gallery: number },
): boolean => scrollY <= anchors.gallery + GALLERY_TOP_THRESHOLD;

// 相容舊的 getQuoteSectionScrollTop
const getQuoteSectionScrollTop = (): number | null => {
  const a = getAnchors();
  return a ? a.quote : null;
};

const emit = defineEmits<{ (e: "navigated-to-quote"): void }>();

// 觸發「往 Quote 區」（scroll 或 CTA 都用這個，捲動+動畫同時進行）
const triggerGoToQuote = () => {
  if (hasTriggeredAutoScroll.value) return;
  hasTriggeredAutoScroll.value = true;
  emit("navigated-to-quote");
  startTransition();
};

// 往下：捲動與內容動畫同時開始、同為 1.5s，過程順暢無停頓
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

// 往上滑回來：捲動與內容動畫同時 1.5s，順暢無停頓
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

// 依錨點捲動（class 決定停止位置）
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

// 監聽游標移動（視差效果）
const handleMouseMove = (event: MouseEvent) => {
  if (!heroRef.value || !import.meta.client) return;

  const rect = heroRef.value.getBoundingClientRect();
  // 將游標位置正規化為 0-1
  mouseX.value = (event.clientX - rect.left) / rect.width;
  mouseY.value = (event.clientY - rect.top) / rect.height;
};

// 是否正在自動滾動
const isAutoScrolling = ref(false);
// 是否已經觸發過自動滾動（防止重複觸發）
const hasTriggeredAutoScroll = ref(false);
const lastScrollY = ref(0);
const MIN_DELTA = 35; // 至少滑動這麼多才依方向切換錨點，避免抖動

// 供 onUnmounted 清理：scroll/wheel 使用同一引用才能正確 removeEventListener
let optimizedScroll: () => void = () => {};
let onWheelHandler: (e: WheelEvent) => void = () => {};

// 監聽滾動：依 class 錨點 + 方向決定停止位置
const handleScroll = () => {
  if (!heroRef.value || !import.meta.client) return;
  if (
    isAutoScrolling.value ||
    isTransitioning.value ||
    isReverseTransitioning.value
  ) {
    lastScrollY.value = window.scrollY;
    return;
  }

  const wrapper = heroRef.value.parentElement;
  if (!wrapper) return;

  const anchors = getAnchors();
  if (!anchors) {
    lastScrollY.value = window.scrollY;
    return;
  }

  const wrapperRect = wrapper.getBoundingClientRect();
  const wrapperTop = wrapperRect.top;
  const wrapperHeight = wrapperRect.height;
  const scrollY = window.scrollY;
  const zone = getZone(scrollY, anchors);
  const delta = scrollY - lastScrollY.value;
  const direction =
    delta >= MIN_DELTA ? "down" : delta <= -MIN_DELTA ? "up" : null;

  if (direction === "down") {
    if (zone === "hero") {
      goToAnchor("quote", "hero");
      return;
    }
    if (zone === "quote") {
      goToAnchor("gallery", "quote");
      return;
    }
  }
  if (direction === "up") {
    if (zone === "gallery" && isAtTopOfGallery(scrollY, anchors)) {
      goToAnchor("quote", "gallery");
      return;
    }
    if (zone === "quote") {
      goToAnchor("hero", "quote");
      return;
    }
  }

  lastScrollY.value = scrollY;

  // 同步 hero 視覺（進度、位移）
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

onMounted(() => {
  if (!import.meta.client) return;

  // 初始化卡片位置
  initCardPositions();

  // 監聽游標移動
  if (heroRef.value) {
    heroRef.value.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });
  }

  // 監聽滾動
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

  // Wheel：同一個「class 錨點 + 方向」邏輯，攔截後捲到對應錨點
  onWheelHandler = (e: WheelEvent) => {
    if (
      isAutoScrolling.value ||
      isTransitioning.value ||
      isReverseTransitioning.value
    ) {
      e.preventDefault();
      return;
    }
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

  // 初始計算一次
  handleScroll();
});

onUnmounted(() => {
  if (transitionRafId) cancelAnimationFrame(transitionRafId);
  if (reverseTransitionRafId) cancelAnimationFrame(reverseTransitionRafId);
  if (heroRef.value) {
    heroRef.value.removeEventListener("mousemove", handleMouseMove);
  }
  window.removeEventListener("scroll", optimizedScroll);
  window.removeEventListener("wheel", onWheelHandler);
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

// 外層：透明，不提供背景（父層 .hero-quote-parent 才是黑→白）
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

// 內層：僅卡片 + 文字，透明底；過渡時整塊淡出，露出父層漸層
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
  // 背景模糊效果（景深）- 移除整體模糊，讓每個卡片有自己的模糊
  // filter: blur(2px);
  // opacity: 0.6;
}

.floating-card {
  position: absolute;
  // 寬高由 getCardStyle 依圖片比例注入，預設 fallback
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
    // 添加微妙的亮度調整（與父元素的 blur 組合）
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
  // 添加微妙的背景模糊，讓文字更突出
  backdrop-filter: blur(0.5px);
  // 添加微妙的漸變遮罩，增強文字可讀性
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
