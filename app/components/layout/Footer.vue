<template>
  <footer ref="footerRootRef" class="footer">
    <div class="footer_inner">
      <!-- Footer Top: 圖片 + 文字描述 -->
      <div class="footer_top scroll_element" :class="scrollClass">
        <div class="footer_label" :class="`footer_label${currentLabelIndex}`">
          <a href="#" class="link">
            <img
              :src="`/images/case/branding/point${currentLabelIndex}.svg`"
              alt=""
            >
          </a>
        </div>
        <div class="footer_copy">
          <p class="tracking en0">
            A web developer who<br class="sp_disp" >
            loves paleontology
          </p>
          <p class="tracking en0">LACUNAE is the sound of a trilobite crawling</p>
        </div>
      </div>

      <!-- Footer Bottom: 按鈕 + 工作室資訊 -->
      <div class="footer_bottom scroll_element" :class="scrollClass">
        <div class="footer_button">
          <div class="round_button round_button_w">
            <a href="#" class="link">
              <p class="tracking ja0">化石修復室(籌備中)</p>
            </a>
          </div>
          <div class="round_button round_button_b">
            <a
              href="https://line.me/ti/p/By5dhWxd1m"
              target="_blank"
              class="_blank"
            >
              <p class="tracking ja0">聯絡詢問服務</p>
            </a>
          </div>
        </div>
        <div class="footer_company">
          <p class="tracking en0">LACUNAE Studio</p>
          <p class="tracking en0">
            Taipei, Taiwan<br >
            <a href="tel:0972-022-301">Tel / 0972-022-301</a>
            <a href="mailto:mumucoco67@gmail.com"
              >Mail / mumucoco67@gmail.com</a
            >
          </p>
        </div>
      </div>

      <!-- Footer Copyright -->
      <div class="footer_copyright scroll_element" :class="scrollClass">
        <p class="tracking en0">© {{ currentYear }} Lacunae Studio Co.,Ltd.</p>
      </div>

      <!-- Footer Disclaimer (獨立、置中) -->
      <div class="footer_disclaimer scroll_element" :class="scrollClass">
        <p>
          Specimen images are temporarily sourced for system prototyping.
          Original photography and verified specimen records will replace
          placeholder assets in future releases.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useIntersectionObserver } from "@vueuse/core";

const footerRootRef = ref<HTMLElement | null>(null);

// 抵達 footer 時 portfolio-circle-button fadeout，離開時 fadein（body.footer-in-view 由 MainNav 樣式控制）
useIntersectionObserver(
  footerRootRef,
  ([entry]) => {
    if (!import.meta.client) return;
    if (entry?.isIntersecting) document.body.classList.add("footer-in-view");
    else document.body.classList.remove("footer-in-view");
  },
  { threshold: 0 },
);

onUnmounted(() => {
  if (import.meta.client) document.body.classList.remove("footer-in-view");
});

const currentYear = new Date().getFullYear();

const scrollClass = ref("scroll_off");
const currentLabelIndex = ref(0);
const beforeLabelIndex = ref(-1);
const hasSwitched = ref(false); // 追蹤是否已經在 scroll_on 狀態下換過圖

// 隨機選擇 footer label（0-3）
const labelSetting = () => {
  const afterLabel = Math.floor(Math.random() * 4);
  // 確保不會連續顯示相同的圖片
  if (afterLabel === beforeLabelIndex.value) {
    labelSetting();
    return;
  }
  currentLabelIndex.value = afterLabel;
  beforeLabelIndex.value = afterLabel;
};

const handleScroll = () => {
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 當滾動到底部附近時，顯示 footer 動畫
  if (scrollY + windowHeight >= documentHeight - 100) {
    // 只在從 scroll_off 變成 scroll_on 時才換圖
    if (scrollClass.value === "scroll_off") {
      scrollClass.value = "scroll_on";
      labelSetting();
      hasSwitched.value = true;
    }
  } else {
    // 離開底部時重置狀態
    if (scrollClass.value === "scroll_on") {
      scrollClass.value = "scroll_off";
      hasSwitched.value = false;
    }
  }
};

onMounted(() => {
  // 初始隨機選擇圖片
  labelSetting();
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // 初始檢查
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

.footer {
  width: 100%;
  padding-bottom: 0;

  @include tb {
    padding-bottom: 60px;
  }

  @include sp {
    padding-bottom: 60px;
  }
}

.footer_inner {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 600px;

  @include tb {
    height: auto !important;
    min-height: auto;
    padding: 0 60px;
  }

  @include sp {
    display: flex;
    flex-direction: column;
    height: auto !important;
    min-height: auto;
    padding: 0 30px;
  }
}

.footer_top {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  margin: -85px 0 0;
  font-size: 0;
  line-height: 0;
  text-align: center;
  transform: translateY(-50%);

  @include tb {
    position: relative;
    top: auto;
    left: auto;
    padding: 60px 0 0;
    margin: 0;
    transform: none;
  }

  @include sp {
    position: relative;
    top: auto;
    left: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 0 0;
    margin: 0;
    transform: none;
  }
}

.footer_label {
  display: inline-block;
  width: 150px;
  height: 150px;
  vertical-align: middle;

  @include tb {
    width: 120px;
    height: 120px;
  }

  @include sp {
    width: 120px;
    height: 120px;
  }

  a {
    display: block;
    width: 100%;
  }

  img {
    width: 100%;
    height: auto;
    overflow: hidden;
    pointer-events: auto;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  }
}

// Label scale 設定
.footer_label0 a,
.footer_label1 a,
.footer_label2 a,
.footer_label3 a {
  transform: scale(1);
}

.footer_copy {
  display: inline-block;
  margin: 0 0 0 40px;
  vertical-align: middle;
  text-align: left;

  @include tb {
    padding: 40px 0 0;
    margin: 0;
    text-align: center;
  }

  @include sp {
    padding: 30px 0 0;
    margin: 0;
    text-align: center;
  }

  p {
    white-space: nowrap;

    @include sp {
      white-space: normal;
    }
  }

  > p:nth-child(1) {
    font-size: 24px;
    line-height: 24px;

    @include sp {
      font-size: 18px;
      line-height: 22px;
    }
  }

  > p:nth-child(2) {
    margin: 20px 0 0;
    font-size: 16px;
    line-height: 16px;

    @include sp {
      margin: 15px 0 0;
      font-size: 14px;
      line-height: 18px;
    }
  }
}

.footer_bottom {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75%;
  max-width: 1000px;
  padding: 0 500px 0 0;
  margin: 115px 0 0;
  transform: translateY(-50%) translateX(-50%);

  @include tb {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    padding: 0;
    padding: 60px 0 0;
    margin: 0;
    transform: none;
  }

  @include sp {
    position: relative;
    top: auto;
    left: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0;
    padding: 40px 0 0;
    margin: 0;
    transform: none;
  }
}

.footer_button {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  font-size: 0;
  line-height: 0;
  text-align: right;

  @include tb {
    position: relative;
    right: auto;
    bottom: auto;
    padding: 0 0 40px;
    text-align: center;
  }

  @include sp {
    position: relative;
    right: auto;
    bottom: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    padding: 0 0 30px;
    text-align: center;
  }

  .round_button {
    margin: 0 0 0 30px;

    @include tb {
      margin: 0 15px;
    }

    @include sp {
      margin: 0;
    }
  }
}

.footer_company {
  position: relative;

  @include tb {
    text-align: center;
  }

  @include sp {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  p {
    white-space: nowrap;

    @include sp {
      white-space: normal;
    }
  }

  p a {
    margin: 0 15px 0 0;

    @include tb {
      display: block;
      margin: 0;
    }

    @include sp {
      display: block;
      margin: 0;
    }
  }

  > p:nth-child(1) {
    font-size: 24px;
    line-height: 24px;

    @include sp {
      font-size: 18px;
      line-height: 22px;
    }
  }

  > p:nth-child(2) {
    margin: 15px 0 0;
    font-size: 12px;
    line-height: 24px;

    @include sp {
      margin: 12px 0 0;
      font-size: 11px;
      line-height: 20px;
    }
  }
}

.footer_copyright {
  position: absolute;
  right: 60px;
  bottom: 60px;
  text-align: right;

  @include tb {
    position: relative;
    right: auto;
    bottom: auto;
    padding: 40px 0 0;
    text-align: center;
  }

  @include sp {
    position: relative;
    right: auto;
    bottom: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 0 0;
    text-align: center;
  }

  p {
    font-size: 12px;
    line-height: 12px;

    @include sp {
      font-size: 11px;
      line-height: 11px;
    }
  }
}

.footer_disclaimer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 24px;
  margin-top: auto;
  font-size: 11px;
  line-height: 1.4;

  @include sp {
    padding: 20px 16px 24px;
    font-size: 10px;
  }

  p {
    margin: 0;
    text-align: center;
  }
}

// Scroll 動畫
.scroll_on .footer_label {
  animation: footer-on-0 0.5s ease-in-out forwards;
}

@keyframes footer-on-0 {
  0% {
    transform: scale(0.5) rotate(0);
  }

  100% {
    transform: scale(1) rotate(-15deg);
  }
}

.scroll_on .footer_label img {
  animation: footer-on-1 2s ease-in-out forwards;
}

@keyframes footer-on-1 {
  0%,
  100% {
    transform: rotate(0);
    transform-origin: left bottom;
  }

  22% {
    transform: rotate(1.5deg);
    transform-origin: right bottom;
  }

  44% {
    transform: rotate(-1.5deg);
    transform-origin: left bottom;
  }

  66% {
    transform: rotate(0.75deg);
    transform-origin: right bottom;
  }

  77% {
    transform: rotate(-0.375deg);
    transform-origin: left bottom;
  }

  88% {
    transform: rotate(0.1875deg);
    transform-origin: right bottom;
  }
}

.scroll_off .footer_label {
  animation: footer-off-0 0.5s ease-in-out forwards;
}

@keyframes footer-off-0 {
  0% {
    transform: scale(1) rotate(-15deg);
  }

  100% {
    transform: scale(0.5) rotate(0);
  }
}

.scroll_off .footer_label img {
  animation: footer-off-1 2s ease-in-out forwards;
}

@keyframes footer-off-1 {
  0%,
  100% {
    transform: rotate(0);
    transform-origin: left bottom;
  }

  22% {
    transform: rotate(1.5deg);
    transform-origin: right bottom;
  }

  44% {
    transform: rotate(-1.5deg);
    transform-origin: left bottom;
  }

  66% {
    transform: rotate(0.75deg);
    transform-origin: right bottom;
  }

  77% {
    transform: rotate(-0.375deg);
    transform-origin: left bottom;
  }

  88% {
    transform: rotate(0.1875deg);
    transform-origin: right bottom;
  }
}

.scroll_on0 {
  animation: scroll-on-0 0.5s ease-in-out forwards;
}

@keyframes scroll-on-0 {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.scroll_off0 {
  animation: scroll-off-0 0.5s ease-in-out forwards;
}

@keyframes scroll-off-0 {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
