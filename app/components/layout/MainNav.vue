<template>
  <header class="header">
    <div class="header_inner">
      <div class="header_logo">
        <NuxtLink to="/" class="link" @click="handleLogoClick">
          <template v-if="isHomePage">
            <img
              src="/images/logo.svg"
              alt="Lacunae"
              class="header_logo-img header_logo-img--white"
              :style="{ opacity: 1 - logoScrollProgress }"
            >
            <img
              src="/images/logo.svg"
              alt=""
              class="header_logo-img header_logo-img--black"
              :style="{ opacity: logoScrollProgress }"
              aria-hidden="true"
            >
          </template>
          <img
            v-else
            src="/images/logo.svg"
            alt="Lacunae"
            class="header_logo-img header_logo-img--default"
          >
        </NuxtLink>
      </div>
      <!-- ClientOnly 避免 SSR 時 textPath 未套用導致「文字滿版」閃現 -->
      <ClientOnly v-if="isHomePage">
        <NuxtLink
          to="/portfolio"
          class="portfolio-circle-button"
        >
          <svg class="portfolio-circle-button__textcircle" viewBox="0 0 500 500">
            <defs>
              <path
                id="textcircle-portfolio"
                d="M250,400 a150,150 0 0,1 0,-300a150,150 0 0,1 0,300Z"
              />
            </defs>
            <text>
              <textPath href="#textcircle-portfolio" textLength="950">
                Portfolio · Portfolio · Portfolio · Portfolio ·
              </textPath>
            </text>
          </svg>
          <div class="portfolio-circle-button__content">
            <span class="portfolio-circle-button__text">#P</span>
          </div>
        </NuxtLink>
        <template #fallback>
          <div class="portfolio-circle-button portfolio-circle-button--fallback" aria-hidden="true" />
        </template>
      </ClientOnly>

      <div class="header_right">
        <div class="header_button">
          <div
            class="menu_link"
            :class="{ 'menu_link--active': isButtonActive }"
            @click="toggleMenu"
          >
            <div><span/></div>
            <div><span/></div>
            <div><span/></div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <Menu
    :overlay-view="overlayView"
    :is-logged-in="!!authIsLoggedIn"
    :display-name="authDisplayName || ''"
    @close="closeMenu"
    @update:overlay-view="overlayView = $event"
    @login-success="onLoginSuccess"
  />

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useRouter, useRoute } from "vue-router";
import { useWindowScroll } from "@vueuse/core";
import Menu from "./Menu.vue";

const authStore = useAuthStore();
const {
  isLoggedIn: authIsLoggedIn,
  displayName: authDisplayName,
} = storeToRefs(authStore);

/** overlay 內顯示的 view：menu | login | profile */
const overlayView = ref<"menu" | "login" | "profile">("menu");

const isButtonActive = ref(false);
const isMenuOpen = ref(false);
const router = useRouter();
const route = useRoute();
const { y: scrollY } = useWindowScroll();

/** 取消過期的 open/close setTimeout，避免「打開後被舊的 close 回呼加上 none」造成閃退 */
let menuTimers: ReturnType<typeof setTimeout>[] = [];
let menuGeneration = 0;

function clearMenuTimers() {
  for (const id of menuTimers) clearTimeout(id);
  menuTimers = [];
}

function scheduleMenuTimer(fn: () => void, ms: number) {
  const id = setTimeout(fn, ms);
  menuTimers.push(id);
}

function getMenuEls() {
  const wrap = document.querySelector(".wrap");
  const menu = document.querySelector(".menu");
  if (!wrap || !menu) return null;
  return { wrap, menu };
}

function onLoginSuccess() {
  closeMenu(true);
  overlayView.value = "menu";
}

/**
 * 打開 overlay 並切換到指定 view（例如從 avatar 開 profile、從 store 開 login）
 */
function openMenuWithView(view: "menu" | "login" | "profile") {
  if (import.meta.server) return;
  overlayView.value = view;
  if (!isMenuOpen.value) openMenu();
}

function openMenu() {
  if (import.meta.server) return;
  const els = getMenuEls();
  if (!els) return;
  const { wrap, menu } = els;

  clearMenuTimers();
  const generation = ++menuGeneration;

  isMenuOpen.value = true;
  isButtonActive.value = true;

  menu.classList.remove("none", "menu_closing");
  wrap.classList.remove("menu_off");
  wrap.classList.add("menu_on", "menu_stop", "menu0");

  // 只擋極短時間，避免同一手勢連點立刻關閉；遠短於圓形展開動畫
  scheduleMenuTimer(() => {
    if (generation !== menuGeneration) return;
    wrap.classList.remove("menu_stop");
  }, 450);
}

/**
 * 關閉 Menu。force=true 時略過 menu_stop（路由切換、登入成功、使用者明確要關）。
 */
function closeMenu(force = false) {
  if (import.meta.server) return;
  const els = getMenuEls();
  if (!els) return;
  const { wrap, menu } = els;

  if (!force && wrap.classList.contains("menu_stop") && !isMenuOpen.value) {
    return;
  }

  clearMenuTimers();
  const generation = ++menuGeneration;

  isMenuOpen.value = false;
  wrap.classList.remove("menu_on");
  wrap.classList.add("menu_off", "menu_stop");
  menu.classList.add("menu_closing");

  const menuFrontCircle = document.querySelector(
    ".menu_front .menu_circle",
  ) as HTMLElement | null;
  if (menuFrontCircle) {
    menuFrontCircle.style.animation = "none";
    menuFrontCircle.style.transform = "";
    void menuFrontCircle.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (generation !== menuGeneration) return;
        menuFrontCircle.style.animation = "";
      });
    });
  }

  scheduleMenuTimer(() => {
    if (generation !== menuGeneration) return;
    isButtonActive.value = false;
  }, 500);

  // menu-off-6：0.5s delay + 0.5s duration
  scheduleMenuTimer(() => {
    if (generation !== menuGeneration) return;
    wrap.classList.remove("menu_stop");
  }, 1000);

  scheduleMenuTimer(() => {
    if (generation !== menuGeneration) return;
    menu.classList.remove("menu_closing");
    menu.classList.add("none");
  }, 1100);
}

/**
 * 切換 Menu：關閉永遠可執行；開啟會清掉舊的 close timer，避免閃退。
 */
function toggleMenu() {
  if (import.meta.server) return;
  if (isMenuOpen.value) {
    closeMenu(true);
  } else {
    overlayView.value = "menu";
    openMenu();
  }
}

// 其他頁面要求登入時（例如 events）：打開 overlay 並顯示 login view
watch(
  () => authStore.authModalOpen,
  (open) => {
    if (open && import.meta.client) {
      authStore.setAuthModalOpen(false);
      openMenuWithView("login");
    }
  },
);

const isHomePage = computed(() => route.path === "/");

// 首頁 logo：捲動進入 hero-quote-section 時由白漸變為黑（與父層背景 200px 一致）
const LOGO_WHITE_TO_BLACK_THRESHOLD = 200;
const logoScrollProgress = computed(() => {
  if (!isHomePage.value || import.meta.server) return 0;
  const y = scrollY.value ?? 0;
  return Math.min(1, Math.max(0, y / LOGO_WHITE_TO_BLACK_THRESHOLD));
});

/**
 * 處理 Logo 點擊事件
 */
const handleLogoClick = (event: MouseEvent) => {
  const currentPath = router.currentRoute.value.path;

  if (currentPath === "/") {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  event.preventDefault();
  router.push("/").then(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

/**
 * 監聽路由變化,關閉 menu（force，避免卡在 menu_stop）
 */
watch(
  () => route.path,
  () => {
    if (isMenuOpen.value) {
      closeMenu(true);
    }
  },
);

onMounted(() => {
  // 確保初始狀態
  if (import.meta.client) {
    const wrap = document.querySelector(".wrap");
    const menu = document.querySelector(".menu");

    if (wrap && !wrap.classList.contains("menu_off")) {
      wrap.classList.add("menu_off");
    }

    if (menu && !menu.classList.contains("none")) {
      menu.classList.add("none");
    }
  }
});

onUnmounted(() => {
  clearMenuTimers();
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

.header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--lc-z-header);
  width: 100%;
  background: transparent; // ⭐ 確保 header 背景透明，讓混合模式生效

  @include tb {
    position: fixed;
  }

  @include sp {
    position: fixed;
  }
}

.header_inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--lc-space-xl) var(--lc-space-xl) 0;

  @include tb {
    padding: var(--lc-space-md) var(--lc-space-md) 0;
  }

  @include sp {
    padding: 25px var(--lc-space-sm) 0;
  }
}

.header_logo {
  flex-shrink: 0;
  height: 30px;
  transition: opacity var(--lc-transition-normal) ease-in-out;

  @include tb {
    height: 24px;
  }

  @include sp {
    height: 20px;
  }

  a {
    position: relative;
    z-index: 1;
    display: block;
    height: 70px;
    cursor: pointer;

    @include tb {
      height: 50px;
    }

    @include sp {
      height: 40px;
    }

    .header_logo-img {
      position: absolute;
      top: 0;
      left: 0;
      width: auto;
      height: 100%;
      pointer-events: none;
      user-select: none;
      transition: opacity var(--lc-transition-quick) ease-out;
    }

    .header_logo-img--white {
      filter: brightness(0) invert(1); /* 首頁頂部：白 logo */
    }

    .header_logo-img--black {
      filter: none; /* 首頁進入 quote 區：黑 logo */
    }

    .header_logo-img--default {
      position: relative;
      mix-blend-mode: var(--logo-blend-mode, normal);
    }
  }
}

.header_right {
  display: flex;
  gap: 24px;
  align-items: center;

  @include tb {
    gap: var(--lc-space-sm);
  }

  @include sp {
    gap: 16px;
  }
}

// Portfolio 圓形文字轉圈按鈕樣式（首頁預設隱藏，進入 gallery 區才 fade-in）
.portfolio-circle-button {
  position: fixed;
  right: var(--lc-space-xl);
  bottom: var(--lc-space-xl);
  z-index: var(--lc-z-portfolio-button);
  display: inline-block;
  padding: 0;
  margin: 0;
  font-family: var(--lc-font-en);
  font-size: inherit;
  color: inherit;
  text-decoration: none;
  pointer-events: none;
  cursor: pointer;
  background: none;
  border: none;
  opacity: 0;
  clip-path: circle(40% at 50% 50%);
  transition:
    opacity var(--lc-transition-normal) ease-in-out,
    visibility var(--lc-transition-normal) ease-in-out;

  &--fallback {
    visibility: hidden;

    /* ClientOnly fallback：佔位避免 layout 跳動，不顯示內容 */
    width: 200px;
    height: 200px;

    @include tb {
      width: 160px;
      height: 160px;
    }

    @include sp {
      width: 120px;
      height: 120px;
    }
  }

  @include tb {
    right: var(--lc-space-lg);
    bottom: var(--lc-space-lg);
  }

  @include sp {
    right: var(--lc-space-md);
    bottom: var(--lc-space-md);
  }

  &__textcircle {
    position: relative;
    display: block;
    width: 200px;
    height: 200px;
    color: white;
    animation: portfolio-rotate 7s linear infinite;

    @include tb {
      width: 160px;
      height: 160px;
    }

    @include sp {
      width: 120px;
      height: 120px;
    }

    text {
      font-family: var(--lc-font-en);
      font-size: 32px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 17px;
      fill: var(--lc-color-black);

      @include tb {
        font-size: 26px;
        letter-spacing: 14px;
      }

      @include sp {
        font-size: 20px;
        letter-spacing: 10px;
      }
    }
  }

  &__content {
    position: absolute;
    inset: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    @include tb {
      inset: 40px;
    }

    @include sp {
      inset: 30px;
    }
  }

  &__text {
    font-family: var(--lc-font-en);
    font-size: 36px;
    font-weight: 400;
    line-height: 1;
    color: var(--lc-color-black);
    letter-spacing: 5px;
    user-select: none;

    @include tb {
      font-size: 48px;
    }

    @include sp {
      font-size: 40px;
    }
  }

  &:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes portfolio-rotate {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes portfolio-rotate-reverse {
  to {
    transform: rotate(360deg);
  }
}

.header_button {
  flex-shrink: 0;
  width: 50px;
  height: 50px;

  @include tb {
    width: 40px;
    height: 40px;
  }

  @include sp {
    width: 35px;
    height: 35px;
  }

  .menu_link,
  a,
  button {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    text-decoration: none;
    cursor: pointer;
    background-color: var(--lc-color-black);
    border: 1px solid var(--lc-color-black);
    border-radius: 50%;

    div {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 24px;
      height: 1px;
      margin-left: -12px;
      overflow: hidden;
      transform: translateY(-1px);

      @include tb {
        width: 20px;
        margin-left: -10px;
      }

      @include sp {
        width: 18px;
        margin-left: -9px;
      }

      span {
        display: block;
        width: 100%;
        height: 100%;
        background-color: var(--lc-color-white);

        @include transition(all);
      }
    }

    > div:nth-child(1) {
      margin-top: -6px;
    }

    > div:nth-child(3) {
      margin-top: 6px;
    }

    &.menu_link--active {
      > div:nth-child(1) {
        margin-top: 0;
        transform: rotate(45deg) translateY(0);
      }

      > div:nth-child(2) {
        opacity: 0;
      }

      > div:nth-child(3) {
        margin-top: 0;
        transform: rotate(-45deg) translateY(0);
      }
    }
  }
}
</style>

<!-- 首頁進入 gallery 區時 portfolio 按鈕 fade-in（由 index 設定 body.gallery-in-view） -->
<!-- 抵達 footer 時 fadeout、離開 footer 時 fadein（由 Footer 設定 body.footer-in-view），桌機手機皆適用 -->
<style lang="scss">
body.gallery-in-view .portfolio-circle-button {
  pointer-events: auto;
  opacity: 1;
}

body.footer-in-view .portfolio-circle-button {
  pointer-events: none;
  opacity: 0;
}
</style>
