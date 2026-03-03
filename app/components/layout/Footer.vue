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
            />
          </a>
        </div>
        <div class="footer_copy">
          <p class="kiri en0">
            A web developer who<br class="sp_disp" />
            loves paleontology
          </p>
          <p class="kiri en0">KIRI KAZE is the sound of a trilobite crawling</p>
        </div>
      </div>

      <!-- Footer Bottom: 按鈕 + 工作室資訊 -->
      <div class="footer_bottom scroll_element" :class="scrollClass">
        <div class="footer_button">
          <div class="round_button round_button_w">
            <a href="#" class="link">
              <p class="kiri ja0">化石修復室(籌備中)</p>
            </a>
          </div>
          <div class="round_button round_button_b">
            <a
              href="https://line.me/ti/p/By5dhWxd1m"
              target="_blank"
              class="_blank"
            >
              <p class="kiri ja0">聯絡詢問服務</p>
            </a>
          </div>
        </div>
        <div class="footer_company">
          <p class="kiri en0">KIRI KAZE Studio</p>
          <p class="kiri en0">
            Taipei, Taiwan<br />
            <a href="tel:0972-022-301">Tel / 0972-022-301</a>
            <a href="mailto:mumucoco67@gmail.com"
              >Mail / mumucoco67@gmail.com</a
            >
          </p>
        </div>
      </div>

      <!-- Footer Copyright -->
      <div class="footer_copyright scroll_element" :class="scrollClass">
        <p class="kiri en0">© {{ currentYear }} KIRI-studio Co.,Ltd.</p>
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
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

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
  width: 100%;
  min-height: 600px;
  position: relative;
  display: flex;
  flex-direction: column;

  @include tb {
    height: auto !important;
    min-height: auto;
    padding: 0 60px 0 60px;
  }

  @include sp {
    height: auto !important;
    min-height: auto;
    padding: 0 30px 0 30px;
    display: flex;
    flex-direction: column;
  }
}

.footer_top {
  width: 100%;
  margin: -85px 0 0 0;
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  -webkit-transform: translateY(-50%);
  font-size: 0;
  line-height: 0;
  text-align: center;

  @include tb {
    margin: 0;
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    padding: 60px 0 0 0;
  }

  @include sp {
    margin: 0;
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    padding: 60px 0 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.footer_label {
  display: inline-block;
  vertical-align: middle;
  width: 150px;
  height: 150px;

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
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    pointer-events: auto;
  }
}

// Label scale 設定（參考 kiri）
.footer_label0 a,
.footer_label1 a,
.footer_label2 a,
.footer_label3 a {
  transform: scale(1);
}

.footer_copy {
  display: inline-block;
  vertical-align: middle;
  text-align: left;
  margin: 0 0 0 40px;

  @include tb {
    margin: 0;
    text-align: center;
    padding: 40px 0 0 0;
  }

  @include sp {
    margin: 0;
    text-align: center;
    padding: 30px 0 0 0;
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
    font-size: 16px;
    line-height: 16px;
    margin: 20px 0 0 0;

    @include sp {
      font-size: 14px;
      line-height: 18px;
      margin: 15px 0 0 0;
    }
  }
}

.footer_bottom {
  width: 75%;
  max-width: 1000px;
  margin: 115px 0 0 0;
  padding: 0 500px 0 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateY(-50%) translateX(-50%);
  -webkit-transform: translateY(-50%) translateX(-50%);

  @include tb {
    width: 100%;
    margin: 0;
    padding: 0;
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    padding: 60px 0 0 0;
  }

  @include sp {
    width: 100%;
    margin: 0;
    padding: 0;
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    padding: 40px 0 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.footer_button {
  width: 100%;
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 0;
  line-height: 0;
  text-align: right;

  @include tb {
    position: relative;
    bottom: auto;
    right: auto;
    text-align: center;
    padding: 0 0 40px 0;
  }

  @include sp {
    position: relative;
    bottom: auto;
    right: auto;
    text-align: center;
    padding: 0 0 30px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
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
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
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
    font-size: 12px;
    line-height: 24px;
    margin: 15px 0 0 0;

    @include sp {
      font-size: 11px;
      line-height: 20px;
      margin: 12px 0 0 0;
    }
  }
}

.footer_copyright {
  position: absolute;
  bottom: 60px;
  right: 60px;
  text-align: right;

  @include tb {
    position: relative;
    bottom: auto;
    right: auto;
    text-align: center;
    padding: 40px 0 0 0;
  }

  @include sp {
    position: relative;
    bottom: auto;
    right: auto;
    text-align: center;
    padding: 30px 0 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
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
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 24px 24px;
  font-size: 11px;
  line-height: 1.4;
  margin-top: auto;

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
  animation: footerOn0 0.5s ease-in-out forwards;
}

@keyframes footerOn0 {
  0% {
    transform: scale(0.5) rotate(0);
  }
  100% {
    transform: scale(1) rotate(-15deg);
  }
}

.scroll_on .footer_label img {
  animation: footerOn1 2s ease-in-out forwards;
}

@keyframes footerOn1 {
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
  animation: footerOff0 0.5s ease-in-out forwards;
}

@keyframes footerOff0 {
  0% {
    transform: scale(1) rotate(-15deg);
  }
  100% {
    transform: scale(0.5) rotate(0);
  }
}

.scroll_off .footer_label img {
  animation: footerOff1 2s ease-in-out forwards;
}

@keyframes footerOff1 {
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
  animation: scrollOn0 0.5s ease-in-out forwards;
}

@keyframes scrollOn0 {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.scroll_off0 {
  animation: scrollOff0 0.5s ease-in-out forwards;
}

@keyframes scrollOff0 {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
