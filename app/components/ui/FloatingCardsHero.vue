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
          >
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
          <button class="floating-cards-hero__cta" @click="scrollToQuote">
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
// 0.5 代表「置中、無偏移」，對應 getCardStyle() 的 (mouseX.value - 0.5) 公式。
// 設 0 的話，沒有滑鼠的裝置（手機/平板永遠不會觸發 mousemove）會卡在這個初始值，
// 讓每張卡片永遠固定往左上偏移一截，不是預期行為。
const mouseX = ref(0.5);
const mouseY = ref(0.5);
const scrollProgress = ref(0);
const contentFadeProgress = ref(0);

const HERO_BN_BASE = "/images/hero_bn";
const CARD_MAX_W = 140;
const CARD_MAX_H = 180;

interface CardSlot {
  baseX: number;
  baseY: number;
  rotation: number;
  // 只有平板／手機的散落構圖需要每張卡片不同尺寸；桌機版不設定，走 CARD_MAX_W/CARD_MAX_H。
  width?: number;
  height?: number;
}

// 桌機版兩欄構圖（≥1000px）：欄內同張數在窄螢幕會被壓縮到重疊，只在 pc 斷點使用，維持原樣不動。
const HERO_CARD_LAYOUT: CardSlot[] = [
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

// 平板（560–999px）跟手機（≤559px）用同一種構圖語言：滿版散落、大小不一、
// 允許邊角輕微重疊，像一疊照片隨手攤開，而不是排得整整齊齊的兩欄格線。
// 定案前先用 375×812 實際手機比例做過提案給人確認過構圖方向（方案 B）。

// 平板：畫面比手機大，卡片數多一點、尺寸也可以更大一些，一樣避開正中央文字區。
const HERO_CARD_LAYOUT_TABLET: CardSlot[] = [
  { baseX: 6, baseY: 10, rotation: -7, width: 90, height: 114 },
  { baseX: 46, baseY: 9, rotation: 5, width: 62, height: 80 },
  { baseX: 80, baseY: 11, rotation: -5, width: 100, height: 128 },
  { baseX: 20, baseY: 10, rotation: 4, width: 56, height: 72 },
  { baseX: 66, baseY: 14, rotation: -6, width: 78, height: 100 },
  { baseX: 4, baseY: 30, rotation: 6, width: 84, height: 108 },
  { baseX: 90, baseY: 28, rotation: -4, width: 68, height: 88 },
  { baseX: 12, baseY: 52, rotation: 5, width: 96, height: 122 },
  { baseX: 85, baseY: 50, rotation: -8, width: 60, height: 78 },
  { baseX: 6, baseY: 72, rotation: 4, width: 72, height: 92 },
  { baseX: 92, baseY: 74, rotation: -5, width: 88, height: 112 },
  { baseX: 24, baseY: 88, rotation: 6, width: 64, height: 82 },
  { baseX: 68, baseY: 90, rotation: -6, width: 100, height: 128 },
  { baseX: 46, baseY: 94, rotation: 3, width: 52, height: 68 },
];

// 手機：畫面太窄，卡片數從 20 降到 10（見下面 MOBILE_CARD_COUNT），大小從 50px 到
// 128px 都有，少數幾張邊角互相壓到一點點——這是使用者從實際比例的提案裡挑的方向。
const HERO_CARD_LAYOUT_MOBILE: CardSlot[] = [
  { baseX: 6, baseY: 16, rotation: -8, width: 96, height: 122 },
  { baseX: 58, baseY: 15, rotation: 6, width: 68, height: 88 },
  { baseX: 34, baseY: 21, rotation: 3, width: 52, height: 66 },
  { baseX: 74, baseY: 18, rotation: -5, width: 86, height: 108 },
  { baseX: 4, baseY: 58, rotation: 7, width: 78, height: 100 },
  { baseX: 22, baseY: 68, rotation: -4, width: 54, height: 70 },
  { baseX: 66, baseY: 60, rotation: -6, width: 100, height: 128 },
  { baseX: 8, baseY: 80, rotation: 5, width: 60, height: 78 },
  { baseX: 70, baseY: 82, rotation: 4, width: 64, height: 82 },
  { baseX: 40, baseY: 86, rotation: -7, width: 50, height: 64 },
];

const MOBILE_CARD_COUNT = HERO_CARD_LAYOUT_MOBILE.length;

// 跟 abstracts/_variables.scss 的 $lc-breakpoint-sp / $lc-breakpoint-pc 對齊，
// 這裡只是用來挑卡片版面／張數，跟 SCSS 斷點各自獨立不會互相依賴。
const VIEWPORT_SP_MAX = 559;
const VIEWPORT_TB_MAX = 999;

type ViewportTier = "sp" | "tb" | "pc";

const getViewportTier = (width: number): ViewportTier => {
  if (width <= VIEWPORT_SP_MAX) return "sp";
  if (width <= VIEWPORT_TB_MAX) return "tb";
  return "pc";
};

const viewportTier = ref<ViewportTier>("pc");

const activeCardLayout = computed(() => {
  if (viewportTier.value === "sp") return HERO_CARD_LAYOUT_MOBILE;
  if (viewportTier.value === "tb") return HERO_CARD_LAYOUT_TABLET;
  return HERO_CARD_LAYOUT;
});

const floatingCards = computed(() => {
  const list = (heroBnList as HeroBnItem[]).filter(
    (item) => item.file && (item.width || item.height),
  );
  const all = list.length > 0
    ? list.map((item) => ({
        thumbnail: `${HERO_BN_BASE}/${item.file}`,
        speciesName: "化石",
        id: item.file,
        width: item.width || 800,
        height: item.height || 600,
      }))
    : props.fossils.slice(0, 25).map((fossil) => ({
        thumbnail: fossil.thumbnail || "",
        speciesName: fossil.speciesRef?.name?.zh || "化石",
        id: fossil.id || fossil.slug,
        width: 800,
        height: 600,
      }));
  // 手機寬度不夠兩欄大卡片分散開，張數也跟著減少；平板／桌機維持全部顯示。
  return viewportTier.value === "sp" ? all.slice(0, MOBILE_CARD_COUNT) : all;
});

const cardPositions = computed(() => {
  const layout = activeCardLayout.value;
  return floatingCards.value.map((_, index) => {
    const slot = layout[index % layout.length]!;
    return {
      x: slot.baseX,
      y: slot.baseY,
      rotation: slot.rotation,
      baseX: slot.baseX,
      baseY: slot.baseY,
      width: slot.width,
      height: slot.height,
    };
  });
});

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

const getCardStyle = (_card: unknown, index: number) => {
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
    width: `${pos.width ?? CARD_MAX_W}px`,
    height: `${pos.height ?? CARD_MAX_H}px`,
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

const handleMouseMove = (event: MouseEvent) => {
  if (!heroRef.value || !import.meta.client) return;
  const rect = heroRef.value.getBoundingClientRect();
  mouseX.value = (event.clientX - rect.left) / rect.width;
  mouseY.value = (event.clientY - rect.top) / rect.height;
};

let optimizedScroll: () => void = () => {};

// 被動同步視覺效果：hero 區塊隨捲動位置淡出/位移，永遠只看「目前實際捲動位置」，
// 不管這個位置是使用者自己滑的還是下面 animateScrollTo() 動畫改的，兩者共用同一份邏輯，
// 不會出現「捲動位置」跟「淡出效果」各自跑各自的、對不齊的狀況。
const handleScroll = () => {
  if (!heroRef.value || !import.meta.client) return;
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
    heroRef.value.style.transform = `translateY(${wrapperTop * 0.7}px)`;
  } else if (wrapperTop + wrapperHeight <= 0) {
    scrollProgress.value = 1;
    contentFadeProgress.value = 1;
    heroRef.value.style.transform = `translateY(${-wrapperHeight * 0.7}px)`;
  } else {
    scrollProgress.value = 0;
    contentFadeProgress.value = scrollY <= 0 ? 0 : contentFadeProgress.value;
    heroRef.value.style.transform = "translateY(0)";
  }
};

// ────────────────────────────────────────────────────────────────
// 區塊跳轉：偵測到 wheel/touch 就直接動畫捲到下一/上一個區塊，
// 只有一個 isAnimating flag，只有動畫迴圈自己跑完才會清掉，
// 不會有第二條計時器邏輯跟它對不齊。
// ────────────────────────────────────────────────────────────────
type AnchorKey = "hero" | "quote" | "gallery";
type Anchors = { hero: number; quote: number; gallery: number };
const ZONE_MARGIN = 24;
const GALLERY_TOP_THRESHOLD = 160;
const isAnimating = ref(false);
let isTouchDevice = false;
let touchStartY = 0;
let touchFired = false;
let animationRafId = 0;
let settleRafId = 0;

// 首頁圖片還在陸續載入時，quote/gallery 區塊的實際位置會被撐開的版面往下推，
// 所以量測一律用「即時位置」，不要在動畫開始時就把座標寫死。
const getAnchorY = (key: AnchorKey): number => {
  if (key === "hero") return 0;
  const el = document.querySelector(key === "quote" ? ".hero-quote-section" : ".fossils-page__gallery");
  return el ? el.getBoundingClientRect().top + window.scrollY : window.scrollY;
};

const computeAnchors = (): Anchors | null => {
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

type Zone = "hero" | "quote" | "free";
const getZone = (y: number, anchors: Anchors): Zone => {
  if (y < anchors.quote - ZONE_MARGIN) return "hero";
  if (y < anchors.gallery - ZONE_MARGIN) return "quote";
  return "free";
};

// 先慢後快再慢：跟舊版「一開始就全速」比起來，起手跟落點都更柔和。
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

// 固定時長，像投影片切換一樣：無論滑多用力、區塊間距多遠，每次過場的節奏都一致。
const TRANSITION_DURATION_MS = 900;

// 動畫落地後的鎖定期：觸控板一次「用力滑」的物理手勢，實際上會連續送出好幾個
// wheel 事件（慣性捲動），若動畫一結束就馬上放行下一個事件，會被同一次手勢
// 送第二次前進，變成「一滑就跳兩格、中間區塊被跳過」。落地後再鎖一小段時間，
// 讓同一次手勢的殘留事件全部被吃掉，「滑一次＝進一格」才會成立。
const LANDING_COOLDOWN_MS = 500;
let lockedUntil = 0;
const isInputLocked = () => isAnimating.value || performance.now() < lockedUntil;

// target 傳區塊代號、不傳寫死的座標：每一幀都重新量測那個區塊的即時位置，
// 版面因為圖片載入撐開而移動時，動畫會自動修正方向，不會跳歪、跳短。
const animateScrollTo = (target: AnchorKey) => {
  if (isAnimating.value) return;
  const startY = window.scrollY;
  const initialTarget = getAnchorY(target);
  const distance = Math.abs(initialTarget - startY);
  if (distance < 1) return;
  const startTime = performance.now();
  isAnimating.value = true;
  const tick = () => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / TRANSITION_DURATION_MS, 1);
    const currentTarget = getAnchorY(target);
    window.scrollTo(0, startY + (currentTarget - startY) * easeInOut(t));
    // 直接同步呼叫，不要等被動的 scroll 事件（會晚一個 rAF frame）才更新，
    // 背景淡出跟位移才會是「同一幀算出來的同一組數字」，感覺才會是同一個動作。
    handleScroll();
    if (t < 1) {
      animationRafId = requestAnimationFrame(tick);
    } else {
      // 動畫本身在跑的時候，中途的 handleScroll/scroll 事件有時候會讓最後一幀的
      // scrollTo 沒有真的生效（量到落點跟目標差了幾十 px）。跑完之後多驗一次、
      // 沒對齊就直接補一次 scrollTo，保證最後一定停在正確的區塊上。
      settleRafId = requestAnimationFrame(() => {
        const settled = getAnchorY(target);
        if (Math.abs(window.scrollY - settled) > 2) window.scrollTo(0, settled);
        handleScroll();
        isAnimating.value = false;
        lockedUntil = performance.now() + LANDING_COOLDOWN_MS;
        settleRafId = 0;
      });
      animationRafId = 0;
    }
  };
  animationRafId = requestAnimationFrame(tick);
};

// direction > 0：往下/往前；direction < 0：往上/往後。回傳是否有接手處理（要 preventDefault）。
const tryAdvance = (direction: number): boolean => {
  if (isInputLocked()) return true; // 動畫還在跑或還在落地鎖定期，吃掉這次輸入避免跟原生捲動打架、跳過中間區塊
  const anchors = computeAnchors();
  if (!anchors) return false;
  const zone = getZone(window.scrollY, anchors);

  if (direction > 0) {
    if (zone === "hero") {
      animateScrollTo("quote");
      return true;
    }
    if (zone === "quote") {
      animateScrollTo("gallery");
      return true;
    }
    return false; // 已經在圖鑑區，交給原生自由捲動
  }

  if (zone === "quote") {
    animateScrollTo("hero");
    return true;
  }
  if (zone === "free" && window.scrollY <= anchors.gallery + GALLERY_TOP_THRESHOLD) {
    animateScrollTo("quote");
    return true;
  }
  return false;
};

// 點「Start Exploring」：跟 wheel/touch 用同一套動畫，感覺才會一致。
const scrollToQuote = () => {
  if (import.meta.client) animateScrollTo("quote");
};

const WHEEL_MIN_DELTA = 2;
let onWheelHandler: (e: WheelEvent) => void = () => {};
let onTouchStart: (e: TouchEvent) => void = () => {};
let onTouchMove: (e: TouchEvent) => void = () => {};
let onTouchEnd: () => void = () => {};
let updateViewportTier: () => void = () => {};

onMounted(() => {
  if (!import.meta.client) return;

  isTouchDevice = navigator.maxTouchPoints > 0;

  updateViewportTier = () => {
    viewportTier.value = getViewportTier(window.innerWidth);
  };
  updateViewportTier();
  window.addEventListener("resize", updateViewportTier, { passive: true });

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

  onWheelHandler = (e: WheelEvent) => {
    if (isTouchDevice) return;
    if (Math.abs(e.deltaY) < WHEEL_MIN_DELTA) return;
    if (tryAdvance(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
  };
  window.addEventListener("wheel", onWheelHandler, { passive: false });

  onTouchStart = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    touchStartY = e.touches[0].clientY;
    touchFired = false;
  };
  onTouchMove = (e: TouchEvent) => {
    if (touchFired) {
      e.preventDefault();
      return;
    }
    if (!e.touches[0]) return;
    if (isAnimating.value) {
      // 動畫還在跑時吃掉這次輸入，理由跟 wheel 走的 isInputLocked() 一樣：
      // 不擋掉的話，原生捲動會在動畫途中插進來跟 animateScrollTo() 的 window.scrollTo() 互搶，
      // 畫面會抖一下或跳到錯的位置。
      e.preventDefault();
      return;
    }
    const deltaY = touchStartY - e.touches[0].clientY; // 手指往上滑 = 內容往下捲（跟 wheel deltaY 同符號）
    if (Math.abs(deltaY) < 20) return;
    if (tryAdvance(deltaY > 0 ? 1 : -1)) {
      touchFired = true;
      e.preventDefault();
    }
  };
  onTouchEnd = () => {
    touchFired = false;
  };
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });

  nextTick(handleScroll);
});

onUnmounted(() => {
  if (animationRafId) cancelAnimationFrame(animationRafId);
  if (settleRafId) cancelAnimationFrame(settleRafId);
  isAnimating.value = false;
  if (heroRef.value) {
    heroRef.value.removeEventListener("mousemove", handleMouseMove);
  }
  window.removeEventListener("scroll", optimizedScroll);
  window.removeEventListener("wheel", onWheelHandler);
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
  window.removeEventListener("resize", updateViewportTier);
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  border: none;

  // opacity/transform 每個 scroll frame 都被 JS 改一次（見 handleScroll），
  // 這裡不能再疊 CSS transition，否則會一直在追一個持續移動的目標，變成黏黏的滯後感。
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
  max-width: 140px;
  min-height: 100px;
  max-height: 180px;
  overflow: hidden;
  border-radius: var(--lc-radius-md);
  box-shadow:
    0 4px 20px rgb(0 0 0 / 15%),
    0 2px 8px rgb(0 0 0 / 10%),
    inset 0 1px 0 rgb(255 255 255 / 10%);
  filter: blur(var(--card-blur, 2px));
  backdrop-filter: blur(0);
  transform-origin: center center;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity, filter;

  // 平板／手機的卡片尺寸由 JS 端每張各自指定（見 HERO_CARD_LAYOUT_TABLET/MOBILE 的
  // width/height），這裡的 min/max 只是安全範圍，不是實際生效的尺寸來源。
  @include tb {
    min-width: 48px;
    max-width: 130px;
    min-height: 60px;
    max-height: 165px;
  }

  @include sp {
    min-width: 40px;
    max-width: 130px;
    min-height: 50px;
    max-height: 165px;
  }

  &__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.95) contrast(1.05);
  }
}

.floating-cards-hero__foreground {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(0.5px);

  // opacity/transform 每個 scroll frame 都被 JS 改一次（見 foregroundStyle），
  // 這裡不能再疊 CSS transition，理由同 .floating-cards-hero。

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    content: "";
    background: radial-gradient(
      ellipse at center,
      transparent 0%,
      rgb(0 0 0 / 20%) 100%
    );
  }

}

.floating-cards-hero__content {
  max-width: 640px;
  padding: 32px 24px;
  text-align: center;

  @include sp {
    padding: 20px 16px;
  }
}

.floating-cards-hero__title {
  margin: 0 0 16px;
  font-family: var(--lc-font-serif-tc);
  font-size: 3rem;
  font-weight: 400;
  line-height: 1.2;
  color: var(--lc-color-white);
  letter-spacing: 0.15rem;
  text-shadow: 0 4px 12px rgb(0 0 0 / 50%);

  @include tb {
    font-size: 2rem;
  }

  @include sp {
    font-size: 1.5rem;
  }
}

.floating-cards-hero__subtitle {
  margin: 0 0 28px;
  font-size: 0.8rem;
  line-height: 1.55;
  color: rgb(255 255 255 / 90%);
  text-shadow: 0 2px 8px rgb(0 0 0 / 30%);

  @include sp {
    margin-bottom: 22px;
    font-size: 0.9rem;
  }
}

.floating-cards-hero__cta {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 400;
  color: var(--lc-color-white);
  letter-spacing: 0.1rem;
  text-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  cursor: pointer;
  background: rgb(255 255 255 / 15%);
  border: 2px solid rgb(255 255 255 / 30%);
  border-radius: var(--lc-radius-pill);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgb(255 255 255 / 25%);
    border-color: rgb(255 255 255 / 50%);
    box-shadow: 0 8px 24px rgb(0 0 0 / 30%);
    transform: translateY(-2px);
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
