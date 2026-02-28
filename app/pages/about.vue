<template>
  <div class="about-page">
    <!-- Hero Section - 深色背景 -->
    <section
      ref="youAreHereSection"
      class="about-section about-section--you-are-here"
      :style="youAreHereBgStyle"
    >
      <div class="you-are-here-content">
        <p ref="youAreHereText" class="you-are-here-text kiri en0">
          About Kiri Kaze
        </p>
      </div>
    </section>

    <!-- THE STORIES Section -->
    <section ref="storiesSection" class="about-section about-section--stories">
      <div class="stories-content">
        <div class="stories-header">
          <h2 class="stories-title kiri en0">THE STORIES</h2>
          <div class="stories-subtitle-wrapper">
            <div class="stories-subtitle-line"></div>
            <p class="stories-subtitle kiri en0">
              Here's what makes my heart beat.
            </p>
          </div>
        </div>
        <div v-if="storiesImage" class="stories-image">
          <img :src="storiesImage" alt="Fossil" />
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section
      ref="servicesSection"
      class="about-section about-section--services"
    >
      <div class="services-content">
        <h2 class="services-title kiri en0">
          Services / 67. they're gonna say we're right
        </h2>
        <div ref="servicesText" class="services-text">
          <p class="kiri en0">
            Kiri Kaze is a digital encyclopedia project dedicated to building a
            structured, scalable fossil knowledge platform. Rather than
            presenting fossils as isolated images, the project focuses on data
            modeling, taxonomy systems, geological timelines, and content
            pipelines that support long-term growth.
          </p>
          <p class="kiri en0">
            The platform is developed with a product mindset: separating
            development, staging, and production environments; designing
            schema-first data structures; and establishing workflows for expert
            collaboration, review, and publication.
          </p>
          <p class="kiri en0">
            By working with experienced collectors and domain specialists,
            Fossil-Index aims to create a trustworthy reference library where
            every specimen is accompanied by provenance, stratigraphic context,
            and image credits.
          </p>
          <p class="kiri en0">
            This project represents an exploration of how modern web engineering
            can support scientific communication, digital archiving, and open
            education.
          </p>
        </div>
      </div>
    </section>
    <!-- Marquee - 三條黑色橫帶 -->
    <div class="marquee-bands">
      <div class="marquee-band marquee-band--1">
        <div class="marquee-band__track">
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--2">
        <div class="marquee-band__track">
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--3">
        <div class="marquee-band__track">
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
        </div>
      </div>
    </div>
    <!-- Kiri Kaze Studio Section -->
    <section ref="studioSection" class="about-section about-section--studio">
      <div class="studio-card">
        <p ref="studioLead" class="studio-lead kiri en0">
          Kiri Kaze Studio aims to transform fossil and geological records into
          a structured, verifiable, and sustainable digital knowledge system.
        </p>
        <p ref="studioSubtitle" class="studio-subtitle kiri en0">
          We are committed to:
        </p>
        <ul ref="studioList" class="studio-list">
          <li class="kiri en0">
            Building rigorous taxonomic and stratigraphic frameworks that
            support scientific clarity and comparability.
          </li>
          <li class="kiri en0">
            Preserving provenance, image credits, and licensing information for
            every specimen.
          </li>
          <li class="kiri en0">
            Collaborating with domain specialists and experienced collectors
            through review-based publication workflows.
          </li>
          <li class="kiri en0">
            Applying modern web engineering and product design principles to
            create a platform designed for long-term growth.
          </li>
        </ul>
        <p ref="studioQuote" class="studio-quote kiri en0">
          We believe that understanding deep time should not be limited to
          specialists. Through an open and reliable digital platform, we hope to
          make Earth's prehistoric history accessible to a wider audience.
        </p>
      </div>
    </section>
    <section ref="heroSection" class="about-hero" :style="heroBgStyle">
      <div class="hero-content">
        <div v-if="heroImage" class="hero-image">
          <img :src="heroImage" alt="Kiri Kaze" />
        </div>
        <div class="hero-name">
          <h3>Founder</h3>
          HSULUN
        </div>
      </div>
    </section>
    <!-- Marquee - 三條黑色橫帶 -->
    <div class="marquee-bands">
      <div class="marquee-band marquee-band--1">
        <div class="marquee-band__track">
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--2">
        <div class="marquee-band__track">
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
          <span class="marquee-band__text">KIRI KAZE KIRI KAZE</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--3">
        <div class="marquee-band__track">
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
          <span class="marquee-band__text">KAZE KIRI KAZE KIRI</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// 圖片路徑
const heroBg = "/images/about/hero_bn.jpg";
const heroImage = ref<string | null>("/images/about/hero.png");
const storiesImage = ref<string | null>("/images/about/stories-fossil.jpg");
const youAreHereBg = "/images/about/you-are-here-bg.jpg.jpg";

// 背景圖片樣式
const heroBgStyle = computed(() => ({
  backgroundImage: `url(${heroBg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
}));

const youAreHereBgStyle = computed(() => ({
  backgroundImage: `url(${youAreHereBg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
}));

// 檢查圖片是否存在（僅在客戶端執行）
onMounted(() => {
  if (import.meta.client) {
    const images = [
      { ref: heroImage, path: "/images/about/hero.png" },
      { ref: storiesImage, path: "/images/about/stories-fossil.jpg" },
    ];

    images.forEach(({ ref, path }) => {
      if (ref.value) {
        const img = new Image();
        img.onerror = () => {
          ref.value = null;
        };
        img.src = ref.value;
      }
    });
  }
});

// Refs for GSAP animations
const heroSection = ref<HTMLElement | null>(null);
const heroTitle = ref<HTMLElement | null>(null);
const storiesSection = ref<HTMLElement | null>(null);
const servicesSection = ref<HTMLElement | null>(null);
const servicesText = ref<HTMLElement | null>(null);
const youAreHereSection = ref<HTMLElement | null>(null);
const youAreHereText = ref<HTMLElement | null>(null);
const studioSection = ref<HTMLElement | null>(null);
const studioLead = ref<HTMLElement | null>(null);
const studioSubtitle = ref<HTMLElement | null>(null);
const studioList = ref<HTMLElement | null>(null);
const studioQuote = ref<HTMLElement | null>(null);

// GSAP Animations
onMounted(() => {
  if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger);

    if (gsap && ScrollTrigger) {
      // Hero Section Animation
      if (heroTitle.value) {
        gsap.from(heroTitle.value, {
          opacity: 0,
          y: 30,
          duration: 1,
          ease: "power3.out",
        });
      }

      // Stories Section Animation
      if (storiesSection.value) {
        gsap.from(storiesSection.value.children, {
          opacity: 0,
          y: 50,
          duration: 1,
          stagger: 0.2,
          scrollTrigger: {
            trigger: storiesSection.value,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // Services Section Animation
      if (servicesText.value) {
        gsap.from(servicesText.value.children, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: servicesSection.value,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // YOU are HERE Section Animation
      if (youAreHereText.value) {
        gsap.from(youAreHereText.value, {
          opacity: 0,
          scale: 0.95,
          duration: 1.2,
          scrollTrigger: {
            trigger: youAreHereSection.value,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      // Studio Section Animation
      if (
        studioLead.value &&
        studioSubtitle.value &&
        studioList.value &&
        studioQuote.value
      ) {
        gsap.from(studioLead.value, {
          opacity: 0,
          y: 30,
          duration: 1,
          scrollTrigger: {
            trigger: studioSection.value,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        gsap.from(studioSubtitle.value, {
          opacity: 0,
          x: -20,
          duration: 0.8,
          delay: 0.2,
          scrollTrigger: {
            trigger: studioSubtitle.value,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        gsap.from(studioList.value.children, {
          opacity: 0,
          x: -30,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: studioList.value,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });

        gsap.from(studioQuote.value, {
          opacity: 0,
          y: 30,
          duration: 1,
          scrollTrigger: {
            trigger: studioQuote.value,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }
    }
  }
});

useHead({
  title: "About",
  meta: [
    {
      name: "description",
      content:
        "Kiri Kaze Studio - A digital encyclopedia project dedicated to building a structured, scalable fossil knowledge platform.",
    },
  ],
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.about-page {
  width: 100%;
  min-height: 100vh;
  background-color: $color-bg;
  position: relative;
  overflow-x: hidden;
  font-family: $font-family-en;
}

// ==========================================
// Hero Section
// ==========================================
.about-hero {
  width: 100%;
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible; // 改為 visible 讓圖片可以破版

  @include sp {
    overflow-x: hidden;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1;
  }
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 10px 40px 10px; // 增加底部 padding 讓 hero-name 有空間
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  box-sizing: border-box;

  @include tb {
    padding: 80px 30px 160px;
  }

  @include sp {
    padding: 48px 16px 100px;
  }
}

.hero-title {
  font-size: 16px;
  font-weight: 400;
  font-family: $font-family-en;
  color: $color-secondary;
  margin-bottom: 30px;
  letter-spacing: 2px;
  text-transform: uppercase;

  @include tb {
    font-size: 14px;
    margin-bottom: 24px;
  }

  @include sp {
    font-size: 12px;
    margin-bottom: 20px;
  }
}

.hero-name {
  font-size: 20px;
  font-weight: 400;
  font-family: $font-family-en;
  color: $color-secondary;
  margin: 0;
  letter-spacing: 0.35em; // 35%
  line-height: 1.1;
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  text-align: center;
  width: 100%;
  padding: 0 16px;
  box-sizing: border-box;

  h3 {
    font-size: 12px;
    text-decoration: line-through;
    margin-bottom: 10px;

    @include sp {
      font-size: 11px;
      margin-bottom: 6px;
    }
  }

  @include tb {
    font-size: 56px;
    bottom: 60px;
    padding: 0 24px;
  }

  @include sp {
    font-size: 32px;
    bottom: 32px;
    letter-spacing: 0.2em;
  }
}

.hero-image {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  margin-bottom: 120px;
  transform: translateY(60px);

  @include tb {
    max-width: 500px;
    margin-bottom: 100px;
    transform: translateY(50px);
  }

  @include sp {
    max-width: 100%;
    border-radius: 6px;
    margin-bottom: 80px;
    transform: translateY(40px);
  }

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

// ==========================================
// Marquee - 三條黑色橫帶（稍微傾斜）
// ==========================================
.marquee-bands {
  width: 100%;
  max-width: 100vw;
  position: relative;
  z-index: 2;
  margin: 40px 0;
  padding-top: 50px;
  overflow: hidden;
  margin-top: -100px;
  box-sizing: border-box;

  @include tb {
    margin: 30px 0;
    padding-top: 40px;
    margin-top: -80px;
  }

  @include sp {
    margin: 20px 0;
    padding-top: 24px;
    margin-top: -48px;
  }
}

.marquee-band {
  width: 100%;
  max-width: 100vw;
  height: 80px;
  background-color: $color-primary;
  overflow: hidden;
  position: relative;
  transform: rotate(1deg);
  margin-bottom: 12px;
  box-sizing: border-box;

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
    will-change: transform;
    white-space: nowrap;
    height: 100%;
    align-items: center;

    @include tb {
      gap: 60px;
    }

    @include sp {
      gap: 16px;
    }

    animation: marquee-scroll 20s linear infinite;
  }

  &--2 &__track {
    animation-direction: reverse;
    animation-duration: 22s;
  }

  &--3 &__track {
    animation-duration: 18s;
  }
}

.marquee-band__text {
  font-size: 96px;
  font-weight: 400;
  font-family: $font-family-en;
  color: $color-secondary;
  line-height: 1;
  letter-spacing: 4px;
  text-transform: uppercase;
  display: inline-block;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;

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

// ==========================================
// About Sections
// ==========================================
.about-section {
  width: 100%;
  padding: 0px 0 0 80px;
  position: relative;
  box-sizing: border-box;

  @include tb {
    padding: 60px 40px;
  }

  @include sp {
    padding: 40px 20px;
  }

  &--stories {
    background-color: $color-bg;
    padding: 0;

    @include tb {
      padding: 50px 40px;
    }

    @include sp {
      padding: 40px 20px;
    }
  }

  &--services {
    background-color: $color-bg;
    padding: 60px 0;

    @include tb {
      padding: 50px 40px;
    }

    @include sp {
      padding: 40px 20px;
    }
  }

  &--you-are-here {
    min-height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 80px 0;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.2);
      z-index: 1;
    }

    @include tb {
      min-height: 400px;
      padding: 60px 40px;
    }

    @include sp {
      min-height: 180px;
      padding: 28px 20px;
    }
  }

  &--studio {
    background-color: $color-bg;
    padding: 60px 0;

    @include tb {
      padding: 50px 40px;
    }

    @include sp {
      padding: 40px 20px;
    }
  }
}

// ==========================================
// THE STORIES Section
// ==========================================
.stories-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 60px;
  box-sizing: border-box;

  @include tb {
    padding: 0 24px;
  }

  @include sp {
    padding: 0 12px;
  }
}

.stories-header {
  margin-bottom: 40px;

  @include tb {
    margin-bottom: 30px;
  }

  @include sp {
    margin-bottom: 24px;
  }
}

.stories-title {
  font-size: 24px;
  font-weight: 400;
  font-family: $font-family-en;
  color: $color-primary;
  margin: 0;
  margin-top: 60px;
  letter-spacing: 2px;

  @include tb {
    font-size: 28px;
    margin-top: 40px;
    margin-bottom: 16px;
  }

  @include sp {
    font-size: 22px;
    margin-top: 24px;
    margin-bottom: 12px;
  }
}

.stories-subtitle-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;

  @include tb {
    gap: 16px;
  }

  @include sp {
    gap: 12px;
  }
}

.stories-subtitle-line {
  width: 70%;
  height: 1px;
  background-color: $color-primary;
  flex-shrink: 0;

  @include tb {
    width: 50px;
  }

  @include sp {
    width: 40px;
  }
}

.stories-subtitle {
  font-size: 16px;
  font-weight: 400;
  font-family: $font-family-en;
  color: rgba($color-primary, 0.6);
  margin: 0;

  @include tb {
    font-size: 14px;
  }

  @include sp {
    font-size: 13px;
  }
}

.stories-image {
  position: relative;

  padding: 12px;
  border-radius: 24px;
  overflow: hidden;

  border: 1px solid #000;

  @include tb {
    border-radius: 20px;
  }

  @include sp {
    border-radius: 16px;
  }

  img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 22px;

    @include tb {
      border-radius: 18px;
    }

    @include sp {
      border-radius: 14px;
    }
  }
}

// ==========================================
// Services Section
// ==========================================
.services-content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 60px;
  letter-spacing: 3px;
  margin-bottom: 40px;
  box-sizing: border-box;

  @include tb {
    padding: 0 24px;
    margin-bottom: 32px;
  }

  @include sp {
    padding: 0 12px;
    margin-bottom: 24px;
  }
}

.services-title {
  font-size: 20px;
  font-weight: 400;
  font-family: $font-family-en;
  color: $color-primary;
  margin-bottom: 40px;
  text-align: center;

  @include tb {
    font-size: 18px;
    margin-bottom: 32px;
  }

  @include sp {
    font-size: 16px;
    margin-bottom: 24px;
  }
}

.services-text {
  letter-spacing: 3px;

  p {
    letter-spacing: 3px;

    font-size: 16px;
    line-height: 1.2;
    font-family: $font-family-en;
    color: $color-primary;
    margin-bottom: 24px;

    @include tb {
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 20px;
    }

    @include sp {
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 18px;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// ==========================================
// YOU are HERE Section
// ==========================================

.you-are-here-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 40px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @include tb {
    padding: 0 24px;
  }

  @include sp {
    padding: 0 16px;
  }
}

.you-are-here-text {
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 2px;
  font-family: $font-family-en;
  color: $color-secondary;
  line-height: 1.3;
  margin: 0;

  @include tb {
    font-size: 42px;
  }

  @include sp {
    font-size: 28px;
  }
}

// ==========================================
// Studio Section
// ==========================================
.studio-card {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 60px;
  background-color: #1e1e1e;
  color: white;
  border-radius: 8px;
  box-sizing: border-box;

  @include tb {
    padding: 50px 40px;
    margin: 0 auto;
  }

  @include sp {
    padding: 32px 16px;
    margin: 0 auto;
    border-radius: 6px;
  }
}

.studio-lead {
  font-size: 18px;
  font-weight: 400;
  font-family: $font-family-en;
  line-height: 1.6;
  margin-bottom: 40px;
  color: white;

  @include tb {
    font-size: 16px;
    margin-bottom: 32px;
  }

  @include sp {
    font-size: 15px;
    margin-bottom: 24px;
  }
}

.studio-subtitle {
  font-size: 16px;
  font-weight: 400;
  font-family: $font-family-en;
  margin-bottom: 24px;
  color: white;

  @include tb {
    font-size: 15px;
    margin-bottom: 20px;
  }

  @include sp {
    font-size: 14px;
    margin-bottom: 16px;
  }
}

.studio-list {
  list-style: none;
  padding: 0;
  margin: 0 0 40px 0;
  letter-spacing: 2px;

  @include tb {
    margin-bottom: 32px;
  }

  @include sp {
    margin-bottom: 24px;
  }

  li {
    font-size: 16px;
    line-height: 1.8;
    font-family: $font-family-en;
    margin-bottom: 16px;
    padding-left: 20px;
    position: relative;
    color: white;
    font-weight: normal;
    letter-spacing: 2px;
    @include tb {
      font-size: 15px;
      margin-bottom: 14px;
    }

    @include sp {
      font-size: 14px;
      margin-bottom: 12px;
      padding-left: 18px;
    }

    &::before {
      content: "•";
      position: absolute;
      left: 0;
      color: white;
      font-size: 18px;
      line-height: 1;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.studio-quote {
  font-size: 16px;
  font-style: italic;
  font-family: $font-family-en;
  line-height: 1.7;
  opacity: 0.9;
  margin: 0;
  color: white;

  @include tb {
    font-size: 15px;
  }

  @include sp {
    font-size: 14px;
  }
}
</style>
