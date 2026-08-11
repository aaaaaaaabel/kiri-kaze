<template>
  <div class="about-page">
    <!-- Hero Section - 深色背景 -->
    <section
      ref="youAreHereSection"
      class="about-section about-section--you-are-here"
      :style="youAreHereBgStyle"
    >
      <div class="you-are-here-content">
        <p ref="youAreHereText" class="you-are-here-text tracking en0">
          About Lacunae
        </p>
      </div>
    </section>

    <!-- THE STORIES Section -->
    <section ref="storiesSection" class="about-section about-section--stories">
      <div class="stories-content">
        <div class="stories-header">
          <h2 class="stories-title tracking en0">THE STORIES</h2>
          <div class="stories-subtitle-wrapper">
            <div class="stories-subtitle-line"/>
            <p class="stories-subtitle tracking en0">
              Here's what makes my heart beat.
            </p>
          </div>
        </div>
        <div v-if="storiesImage" class="stories-image">
          <img :src="storiesImage" alt="Fossil" >
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section
      ref="servicesSection"
      class="about-section about-section--services"
    >
      <div class="services-content">
        <h2 class="services-title tracking en0">
          Services / 67. they're gonna say we're right
        </h2>
        <div ref="servicesText" class="services-text">
          <p class="tracking en0">
            Lacunae is a digital encyclopedia project dedicated to building a
            structured, scalable fossil knowledge platform. Rather than
            presenting fossils as isolated images, the project focuses on data
            modeling, taxonomy systems, geological timelines, and content
            pipelines that support long-term growth.
          </p>
          <p class="tracking en0">
            The platform is developed with a product mindset: separating
            development, staging, and production environments; designing
            schema-first data structures; and establishing workflows for expert
            collaboration, review, and publication.
          </p>
          <p class="tracking en0">
            By working with experienced collectors and domain specialists,
            Fossil-Index aims to create a trustworthy reference library where
            every specimen is accompanied by provenance, stratigraphic context,
            and image credits.
          </p>
          <p class="tracking en0">
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
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--2">
        <div class="marquee-band__track">
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--3">
        <div class="marquee-band__track">
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
        </div>
      </div>
    </div>
    <!-- Lacunae Studio Section -->
    <section ref="studioSection" class="about-section about-section--studio">
      <div class="studio-card">
        <p ref="studioLead" class="studio-lead tracking en0">
          Lacunae Studio aims to transform fossil and geological records into
          a structured, verifiable, and sustainable digital knowledge system.
        </p>
        <p ref="studioSubtitle" class="studio-subtitle tracking en0">
          We are committed to:
        </p>
        <ul ref="studioList" class="studio-list">
          <li class="tracking en0">
            Building rigorous taxonomic and stratigraphic frameworks that
            support scientific clarity and comparability.
          </li>
          <li class="tracking en0">
            Preserving provenance, image credits, and licensing information for
            every specimen.
          </li>
          <li class="tracking en0">
            Collaborating with domain specialists and experienced collectors
            through review-based publication workflows.
          </li>
          <li class="tracking en0">
            Applying modern web engineering and product design principles to
            create a platform designed for long-term growth.
          </li>
        </ul>
        <p ref="studioQuote" class="studio-quote tracking en0">
          We believe that understanding deep time should not be limited to
          specialists. Through an open and reliable digital platform, we hope to
          make Earth's prehistoric history accessible to a wider audience.
        </p>
      </div>
    </section>
    <section ref="heroSection" class="about-hero" :style="heroBgStyle">
      <div class="hero-content">
        <div v-if="heroImage" class="hero-image">
          <img :src="heroImage" alt="Lacunae" >
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
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--2">
        <div class="marquee-band__track">
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
        </div>
      </div>
      <div class="marquee-band marquee-band--3">
        <div class="marquee-band__track">
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
          <span class="marquee-band__text">LACUNAE LACUNAE LACUNAE</span>
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

    images.forEach(({ ref, path: _path }) => {
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
        "Lacunae Studio - A digital encyclopedia project dedicated to building a structured, scalable fossil knowledge platform.",
    },
  ],
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.about-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  font-family: $font-family-en;
  background-color: $color-bg;
}

// ==========================================
// Hero Section
// ==========================================
.about-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  overflow: visible; // 改為 visible 讓圖片可以破版

  @include sp {
    overflow-x: hidden;
  }

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    content: "";
    background: rgb(0 0 0 / 80%);
  }
}

.hero-content {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  width: 100%;
  max-width: 1000px;
  padding: 10px 40px; // 增加底部 padding 讓 hero-name 有空間
  margin: 0 auto;
  text-align: center;

  @include tb {
    padding: 80px 30px 160px;
  }

  @include sp {
    padding: 48px 16px 100px;
  }
}

.hero-title {
  margin-bottom: 30px;
  font-family: $font-family-en;
  font-size: 16px;
  font-weight: 400;
  color: $color-secondary;
  text-transform: uppercase;
  letter-spacing: 2px;

  @include tb {
    margin-bottom: 24px;
    font-size: 14px;
  }

  @include sp {
    margin-bottom: 20px;
    font-size: 12px;
  }
}

.hero-name {
  position: absolute;
  bottom: 0;
  left: 50%;
  z-index: 3;
  box-sizing: border-box;
  width: 100%;
  padding: 0 16px;
  margin: 0;
  font-family: $font-family-en;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.1;
  color: $color-secondary;
  text-align: center;
  letter-spacing: 0.35em; // 35%
  transform: translateX(-50%);

  h3 {
    margin-bottom: 10px;
    font-size: 12px;
    text-decoration: line-through;

    @include sp {
      margin-bottom: 6px;
      font-size: 11px;
    }
  }

  @include tb {
    bottom: 60px;
    padding: 0 24px;
    font-size: 56px;
  }

  @include sp {
    bottom: 32px;
    font-size: 32px;
    letter-spacing: 0.2em;
  }
}

.hero-image {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  margin-bottom: 120px;
  overflow: hidden;
  border-radius: 8px;
  transform: translateY(60px);

  @include tb {
    max-width: 500px;
    margin-bottom: 100px;
    transform: translateY(50px);
  }

  @include sp {
    max-width: 100%;
    margin-bottom: 80px;
    border-radius: 6px;
    transform: translateY(40px);
  }

  img {
    display: block;
    width: 100%;
    height: auto;
  }
}

// ==========================================
// Marquee - 三條黑色橫帶（稍微傾斜）
// ==========================================
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
  background-color: $color-primary;
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
  font-family: $font-family-en;
  font-size: 96px;
  font-weight: 400;
  line-height: 1;
  color: $color-secondary;
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

// ==========================================
// About Sections
// ==========================================
.about-section {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 0 0 0 80px;

  @include tb {
    padding: 60px 40px;
  }

  @include sp {
    padding: 40px 20px;
  }

  &--stories {
    padding: 0;
    background-color: $color-bg;

    @include tb {
      padding: 50px 40px;
    }

    @include sp {
      padding: 40px 20px;
    }
  }

  &--services {
    padding: 60px 0;
    background-color: $color-bg;

    @include tb {
      padding: 50px 40px;
    }

    @include sp {
      padding: 40px 20px;
    }
  }

  &--you-are-here {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 250px;
    padding: 80px 0;
    overflow: hidden;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      content: "";
      background: rgb(0 0 0 / 20%);
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
    padding: 60px 0;
    background-color: $color-bg;

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
  box-sizing: border-box;
  width: 100%;
  max-width: 1200px;
  padding: 0 60px;
  margin: 0 auto;

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
  margin: 0;
  margin-top: 60px;
  font-family: $font-family-en;
  font-size: 24px;
  font-weight: 400;
  color: $color-primary;
  letter-spacing: 2px;

  @include tb {
    margin-top: 40px;
    margin-bottom: 16px;
    font-size: 28px;
  }

  @include sp {
    margin-top: 24px;
    margin-bottom: 12px;
    font-size: 22px;
  }
}

.stories-subtitle-wrapper {
  display: flex;
  gap: 20px;
  align-items: center;

  @include tb {
    gap: 16px;
  }

  @include sp {
    gap: 12px;
  }
}

.stories-subtitle-line {
  flex-shrink: 0;
  width: 70%;
  height: 1px;
  background-color: $color-primary;

  @include tb {
    width: 50px;
  }

  @include sp {
    width: 40px;
  }
}

.stories-subtitle {
  margin: 0;
  font-family: $font-family-en;
  font-size: 16px;
  font-weight: 400;
  color: rgba($color-primary, 0.6);

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
  overflow: hidden;
  border: 1px solid #000;
  border-radius: 24px;

  @include tb {
    border-radius: 20px;
  }

  @include sp {
    border-radius: 16px;
  }

  img {
    display: block;
    width: 100%;
    height: auto;
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
  box-sizing: border-box;
  width: 100%;
  max-width: 900px;
  padding: 0 60px;
  margin: 0 auto;
  margin-bottom: 40px;
  letter-spacing: 3px;

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
  margin-bottom: 40px;
  font-family: $font-family-en;
  font-size: 20px;
  font-weight: 400;
  color: $color-primary;
  text-align: center;

  @include tb {
    margin-bottom: 32px;
    font-size: 18px;
  }

  @include sp {
    margin-bottom: 24px;
    font-size: 16px;
  }
}

.services-text {
  letter-spacing: 3px;

  p {
    margin-bottom: 24px;
    font-family: $font-family-en;
    font-size: 16px;
    line-height: 1.2;
    color: $color-primary;
    letter-spacing: 3px;

    @include tb {
      margin-bottom: 20px;
      font-size: 15px;
      line-height: 1.7;
    }

    @include sp {
      margin-bottom: 18px;
      font-size: 14px;
      line-height: 1.6;
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
  width: 100%;
  max-width: 1200px;
  padding: 0 40px;
  margin: 0 auto;
  text-align: center;

  @include tb {
    padding: 0 24px;
  }

  @include sp {
    padding: 0 16px;
  }
}

.you-are-here-text {
  margin: 0;
  font-family: $font-family-en;
  font-size: 18px;
  font-weight: 300;
  line-height: 1.3;
  color: $color-secondary;
  letter-spacing: 2px;

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
  box-sizing: border-box;
  width: 100%;
  max-width: 900px;
  padding: 60px;
  margin: 0 auto;
  color: white;
  background-color: #1e1e1e;
  border-radius: 8px;

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
  margin-bottom: 40px;
  font-family: $font-family-en;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.6;
  color: white;

  @include tb {
    margin-bottom: 32px;
    font-size: 16px;
  }

  @include sp {
    margin-bottom: 24px;
    font-size: 15px;
  }
}

.studio-subtitle {
  margin-bottom: 24px;
  font-family: $font-family-en;
  font-size: 16px;
  font-weight: 400;
  color: white;

  @include tb {
    margin-bottom: 20px;
    font-size: 15px;
  }

  @include sp {
    margin-bottom: 16px;
    font-size: 14px;
  }
}

.studio-list {
  padding: 0;
  margin: 0 0 40px;
  letter-spacing: 2px;
  list-style: none;

  @include tb {
    margin-bottom: 32px;
  }

  @include sp {
    margin-bottom: 24px;
  }

  li {
    position: relative;
    padding-left: 20px;
    margin-bottom: 16px;
    font-family: $font-family-en;
    font-size: 16px;
    font-weight: normal;
    line-height: 1.8;
    color: white;
    letter-spacing: 2px;

    @include tb {
      margin-bottom: 14px;
      font-size: 15px;
    }

    @include sp {
      padding-left: 18px;
      margin-bottom: 12px;
      font-size: 14px;
    }

    &::before {
      position: absolute;
      left: 0;
      font-size: 18px;
      line-height: 1;
      color: white;
      content: "•";
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.studio-quote {
  margin: 0;
  font-family: $font-family-en;
  font-size: 16px;
  font-style: italic;
  line-height: 1.7;
  color: white;
  opacity: 0.9;

  @include tb {
    font-size: 15px;
  }

  @include sp {
    font-size: 14px;
  }
}
</style>
