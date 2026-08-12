<template>
  <div class="marquee-bands">
    <div
      v-for="n in 3"
      :key="n"
      class="marquee-band"
      :class="`marquee-band--${n}`"
    >
      <div class="marquee-band__track">
        <span v-for="i in 5" :key="i" class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// About 頁用來當視覺分隔的三條跑馬燈黑帶，內容固定，原本在 about.vue 裡重複寫了兩次。
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

.marquee-bands {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  width: 100%;
  max-width: 100vw;
  padding-top: 50px;
  margin: 40px 0;
  margin-top: -100px;
  overflow: hidden;

  @include tb {
    padding-top: 40px;
    margin: 30px 0;
    margin-top: -80px;
  }

  @include sp {
    padding-top: 24px;
    margin: 20px 0;
    margin-top: -48px;
  }
}

.marquee-band {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 100vw;
  height: 80px;
  margin-bottom: 12px;
  overflow: hidden;
  background-color: $lc-color-black;
  transform: rotate(1deg);

  @include tb {
    height: 70px;
    margin-bottom: 10px;
  }

  @include sp {
    height: 44px;
    margin-bottom: 6px;
    transform: rotate(0.5deg);
  }

  &:last-child {
    margin-bottom: 0;
  }

  &--1 {
    transform: rotate(1deg);

    @include sp {
      transform: rotate(0.5deg);
    }
  }

  &--2 {
    transform: rotate(1.2deg);

    @include sp {
      transform: rotate(0.6deg);
    }
  }

  &--3 {
    transform: rotate(0.8deg);

    @include sp {
      transform: rotate(0.4deg);
    }
  }

  &__track {
    display: inline-flex;
    gap: 80px;
    align-items: center;
    height: 100%;
    white-space: nowrap;
    animation: marquee-scroll 20s linear infinite;
    will-change: transform;

    @include tb {
      gap: 60px;
    }

    @include sp {
      gap: 16px;
    }
  }

  &--2 &__track {
    animation-duration: 22s;
    animation-direction: reverse;
  }

  &--3 &__track {
    animation-duration: 18s;
  }
}

.marquee-band__text {
  display: inline-block;
  font-family: $lc-font-en;
  font-size: 96px;
  font-weight: 400;
  line-height: 1;
  color: $lc-color-white;
  text-transform: uppercase;
  letter-spacing: 4px;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;

  @include tb {
    font-size: 72px;
    letter-spacing: 3px;
  }

  @include sp {
    font-size: 24px;
    letter-spacing: 1px;
  }
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}
</style>
