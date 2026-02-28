<template>
  <header class="header">
    <div class="header_inner">
      <div class="header_logo">
        <NuxtLink to="/" class="link" @click="handleLogoClick">
          <template v-if="isHomePage">
            <img
              src="/images/logo.svg"
              alt="Fossil Index"
              class="header_logo-img header_logo-img--white"
              :style="{ opacity: 1 - logoScrollProgress }"
            />
            <img
              src="/images/logo.svg"
              alt=""
              class="header_logo-img header_logo-img--black"
              :style="{ opacity: logoScrollProgress }"
              aria-hidden="true"
            />
          </template>
          <img
            v-else
            src="/images/logo.svg"
            alt="Fossil Index"
            class="header_logo-img header_logo-img--default"
          />
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
            <div><span></span></div>
            <div><span></span></div>
            <div><span></span></div>
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
import { ref, computed, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useRouter, useRoute } from "vue-router";
import { useWindowScroll } from "@vueuse/core";
import Menu from "./Menu.vue";

const authStore = useAuthStore();
const {
  isReady: authIsReady,
  isLoggedIn: authIsLoggedIn,
  photoURL: authPhotoURL,
  displayName: authDisplayName,
} = storeToRefs(authStore);

/** overlay 內顯示的 view：menu | login | profile */
const overlayView = ref<"menu" | "login" | "profile">("menu");

function onLoginSuccess() {
  closeMenu();
  overlayView.value = "menu";
}

/**
 * 打開 overlay 並切換到指定 view（例如從 avatar 開 profile、從 store 開 login）
 */
function openMenuWithView(view: "menu" | "login" | "profile") {
  if (import.meta.server) return;
  const wrap = document.querySelector(".wrap");
  const menu = document.querySelector(".menu");
  if (!wrap || !menu) return;
  if (wrap.classList.contains("menu_stop")) return;

  overlayView.value = view;
  if (!isMenuOpen.value) {
    isMenuOpen.value = true;
    isButtonActive.value = true;
    menu.classList.remove("none", "menu_closing");
    wrap.classList.remove("menu_off");
    wrap.classList.add("menu_on", "menu_stop", "menu0");
    setTimeout(() => wrap.classList.remove("menu_stop"), 2000);
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

const isButtonActive = ref(false);
const isMenuOpen = ref(false);
const router = useRouter();
const route = useRoute();
const { y: scrollY } = useWindowScroll();

const isHomePage = computed(() => route.path === "/");

// 首頁 logo：捲動進入 hero-quote-section 時由白漸變為黑（與父層背景 200px 一致）
const LOGO_WHITE_TO_BLACK_THRESHOLD = 200;
const logoScrollProgress = computed(() => {
  if (!isHomePage.value || import.meta.server) return 0;
  const y = scrollY.value ?? 0;
  return Math.min(1, Math.max(0, y / LOGO_WHITE_TO_BLACK_THRESHOLD));
});

/**
 * 切換 Menu 開關
 */
const toggleMenu = () => {
  if (import.meta.server) return;

  const wrap = document.querySelector(".wrap");
  const menu = document.querySelector(".menu");
  if (!wrap || !menu) return;

  // 檢查是否正在動畫中
  if (wrap.classList.contains("menu_stop")) {
    return;
  }

  if (!isMenuOpen.value) {
    // ⭐ 打開 Menu，預設顯示 menu view
    isMenuOpen.value = true;
    isButtonActive.value = true;
    overlayView.value = "menu";

    // 移除 none 和 menu_closing class,讓 Menu 可見
    menu.classList.remove("none", "menu_closing");

    wrap.classList.remove("menu_off");
    wrap.classList.add("menu_on", "menu_stop", "menu0");

    // 2 秒後移除 menu_stop
    setTimeout(() => {
      wrap.classList.remove("menu_stop");
    }, 2000);
  } else {
    // ⭐ 關閉 Menu
    closeMenu();
  }
};

/**
 * 關閉 Menu
 */
const closeMenu = () => {
  if (import.meta.server) return;

  const wrap = document.querySelector(".wrap");
  const menu = document.querySelector(".menu");
  if (!wrap || !menu) return;

  // 檢查是否正在動畫中
  if (wrap.classList.contains("menu_stop")) {
    return;
  }

  isMenuOpen.value = false;

  // 移除 menu_on,添加 menu_off
  wrap.classList.remove("menu_on");
  wrap.classList.add("menu_off", "menu_stop");

  // ⭐ 添加 menu_closing class 觸發淡出動畫
  menu.classList.add("menu_closing");

  // ⭐ 重置 menu_front circle 動畫
  const menuFrontCircle = document.querySelector(
    ".menu_front .menu_circle",
  ) as HTMLElement;
  if (menuFrontCircle) {
    menuFrontCircle.style.animation = "none";
    menuFrontCircle.style.transform = "";
    void menuFrontCircle.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        menuFrontCircle.style.animation = "";
      });
    });
  }

  // 延遲移除按鈕 active 狀態
  setTimeout(() => {
    isButtonActive.value = false;
  }, 500);

  // ⭐⭐⭐ 1 秒後:移除 menu_stop（對應 menu_off6 的 0.5s delay + 0.5s duration）
  setTimeout(() => {
    wrap.classList.remove("menu_stop");
  }, 1000);

  // ⭐⭐⭐ 1.5 秒後:移除 menu_closing + 添加 none class 隱藏 Menu
  // 確保 menu_off6 動畫完成（0.5s delay + 0.5s duration = 1s，再加 0.5s 緩衝）
  setTimeout(() => {
    menu.classList.remove("menu_closing");
    menu.classList.add("none"); // ⭐ 關鍵:添加 none class
  }, 1500);
};

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
 * 監聽路由變化,關閉 menu
 */
watch(
  () => route.path,
  () => {
    if (isMenuOpen.value) {
      closeMenu();
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
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.header {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: $z-index-header;
  background: transparent; // ⭐ 確保 header 背景透明，讓混合模式生效

  @include tb {
    position: fixed;
  }

  @include sp {
    position: fixed;
  }
}

.header_inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 60px 0;

  @include tb {
    padding: 30px 30px 0;
  }

  @include sp {
    padding: 25px 20px 0;
  }
}

.header_logo {
  height: 30px;
  flex-shrink: 0;
  transition: opacity 0.5s ease-in-out;

  @include tb {
    height: 24px;
  }

  @include sp {
    height: 20px;
  }

  a {
    display: block;
    height: 70px;
    position: relative;
    cursor: pointer;
    z-index: 1;

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
      transition: opacity 0.2s ease-out;
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
  align-items: center;
  gap: 24px;

  @include tb {
    gap: 20px;
  }

  @include sp {
    gap: 16px;
  }
}

// Portfolio 圓形文字轉圈按鈕樣式（首頁預設隱藏，進入 gallery 區才 fade-in）
.portfolio-circle-button {
  position: fixed;
  bottom: 60px;
  right: 60px;
  z-index: 100;
  border: none;
  margin: 0;
  font-family: $font-family-en;
  font-size: inherit;
  display: inline-block;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.5s ease-in-out,
    visibility 0.5s ease-in-out;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  background: none;
  padding: 0;
  clip-path: circle(40% at 50% 50%);

  &--fallback {
    /* ClientOnly fallback：佔位避免 layout 跳動，不顯示內容 */
    width: 200px;
    height: 200px;
    visibility: hidden;
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
    bottom: 40px;
    right: 40px;
  }

  @include sp {
    bottom: 30px;
    right: 30px;
  }

  &__textcircle {
    position: relative;
    display: block;
    width: 200px;
    height: 200px;
    animation: portfolio-rotate 7s linear infinite;
    color: white;
    @include tb {
      width: 160px;
      height: 160px;
    }

    @include sp {
      width: 120px;
      height: 120px;
    }

    text {
      font-size: 32px;
      text-transform: uppercase;
      fill: $color-primary;
      font-weight: 400;
      letter-spacing: 17px;
      font-family: $font-family-en;

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
    font-family: $font-family-en;
    font-size: 36px;
    font-weight: 400;
    color: $color-primary;
    line-height: 1;
    user-select: none;
    letter-spacing: 5px;
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
  width: 50px;
  height: 50px;
  flex-shrink: 0;

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
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: 50%;
    border: 1px solid $color-primary;
    background-color: $color-primary;
    cursor: pointer;
    padding: 0;
    margin: 0;
    text-decoration: none;

    div {
      width: 24px;
      height: 1px;
      position: absolute;
      top: 50%;
      left: 50%;
      margin-left: -12px;
      transform: translateY(-1px);
      overflow: hidden;

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
        background-color: $color-secondary;
        @include transition(all, $transition-normal);
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
  opacity: 1;
  pointer-events: auto;
}

body.footer-in-view .portfolio-circle-button {
  opacity: 0;
  pointer-events: none;
}
</style>
