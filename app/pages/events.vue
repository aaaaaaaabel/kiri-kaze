<template>
  <div class="events-page">
    <div class="events-page__container">
      <h1 class="events-page__title">Events</h1>
      <LoadingSpinner v-if="loading" size="small" message="Loading events..." />
      <div v-else class="events-page__list">
        <div
          v-for="event in events"
          :key="event.id"
          class="events-page__item"
        >
          <div class="events-page__item-image">
            <img
              v-if="event.image"
              :src="event.image"
              :alt="event.title"
            >
            <div v-else class="events-page__item-image-placeholder">No image</div>
          </div>
          <div class="events-page__item-content">
            <h2 class="events-page__item-title">{{ event.title }}</h2>
            <p class="events-page__item-description">{{ event.description }}</p>
            <p class="events-page__item-meta">
              {{ event.date }} · {{ event.time }} · {{ event.location }}
            </p>
            <p class="events-page__item-spots">
              {{ event.registeredCount }} / {{ event.capacity }} registered
            </p>
            <button
              v-if="!isFull(event)"
              type="button"
              class="events-page__item-cta"
              @click="handleRegister(event)"
            >
              立即報名
            </button>
            <span
              v-else
              class="events-page__item-cta events-page__item-cta--disabled"
              aria-disabled="true"
            >
              名額已滿
            </span>
          </div>
        </div>
        <p v-if="!loading && events.length === 0" class="events-page__empty">
          No events at the moment.
        </p>
      </div>
    </div>

    <BookingModal
      :is-open="bookingModalOpen"
      :event="bookingEvent"
      @close="closeBookingModal"
      @registered="onRegistered"
    />
  </div>
</template>

<script setup lang="ts">
import type { IEvent } from "~/composables/useEvents";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";
import BookingModal from "~/components/ui/BookingModal.vue";

const { fetchEvents } = useEvents();
const events = ref<IEvent[]>([]);
const loading = ref(true);
const bookingModalOpen = ref(false);
const bookingEvent = ref<IEvent | null>(null);

function isFull(event: IEvent): boolean {
  // capacity <= 0 視為未設定名額，不擋報名（避免 0 >= 0 永遠額滿）
  if (event.capacity <= 0) return false;
  return event.registeredCount >= event.capacity;
}

function handleRegister(event: IEvent) {
  if (isFull(event)) return;
  // 登入目前停用：直接開報名表單（guest 可不帶 uid）
  bookingEvent.value = event;
  bookingModalOpen.value = true;
}

function closeBookingModal() {
  bookingModalOpen.value = false;
  bookingEvent.value = null;
  // 關閉時重新拉取列表，確保人數與資料庫一致（例如後台刪除報名後）
  fetchEvents().then((list) => {
    events.value = list;
  }).catch((e) => {
    if (import.meta.dev) console.error("[events] refetch on close", e);
  });
}

async function onRegistered() {
  // 只更新列表人數，不關閉 Modal，讓使用者看到感謝畫面後再點關閉
  try {
    events.value = await fetchEvents();
  } catch (e) {
    if (import.meta.dev) console.error("[events] refetch after register", e);
  }
}

onMounted(async () => {
  if (import.meta.server) return;
  try {
    events.value = await fetchEvents();
  } catch (e) {
    if (import.meta.dev) console.error("[events] fetchEvents error", e);
  } finally {
    loading.value = false;
  }
});

useHead({
  title: "Events",
  meta: [
    {
      name: "description",
      content: "Events and updates.",
    },
  ],
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;
@use "sass:color";

.events-page {
  min-height: 100vh;
  padding: 120px 60px 60px;

  @include tb {
    padding: 100px 40px 40px;
  }

  @include sp {
    padding: 80px 20px 20px;
  }

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    margin-top: 32px;
  }

  &__title {
    margin-bottom: 60px;
    font-size: 48px;
    font-weight: 400;
    color: $color-primary;

    @include tb {
      margin-bottom: 40px;
      font-size: 36px;
    }

    @include sp {
      margin-bottom: 30px;
      font-size: 28px;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 60px;

    @include tb {
      gap: 40px;
    }

    @include sp {
      gap: 30px;
    }
  }

  &__item {
    display: flex;
    gap: 40px;
    align-items: flex-start;

    @include tb {
      gap: 30px;
    }

    @include sp {
      flex-direction: column;
      gap: 20px;
    }
  }

  &__item-image {
    flex: 0 0 40%;
    width: 40%;
    background: $color-gray-light;

    @include sp {
      flex: 1;
      width: 100%;
    }

    img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }
  }

  &__item-image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 16 / 10;
    font-size: 0.9rem;
    color: #999;
  }

  &__item-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 15px;
  }

  &__item-title {
    margin: 0;
    font-size: 32px;
    font-weight: 400;
    color: $color-primary;

    @include tb {
      font-size: 28px;
    }

    @include sp {
      font-size: 24px;
    }
  }

  &__item-description {
    font-size: 16px;
    line-height: 1.8;
    color: $color-primary;

    @include sp {
      font-size: 14px;
    }
  }

  &__item-meta {
    margin: 0;
    font-size: 14px;
    color: #666;
  }

  &__item-spots {
    margin: 0;
    font-size: 14px;
    color: $color-accent;
  }

  &__item-cta {
    display: inline-block;
    align-self: flex-start;
    padding: 12px 24px;
    margin-top: auto;
    font-size: 1rem;
    color: #fff;
    text-decoration: none;
    cursor: pointer;
    background: $color-primary;
    border: none;
    border-radius: 8px;
    transition: background 0.2s, opacity 0.2s;

    @include sp {
      align-self: center;
      margin-top: 20px;
    }

    &:hover {
      background: color.adjust($color-primary, $lightness: -8%);
    }

    &--disabled {
      pointer-events: none;
      cursor: not-allowed;
      background: #ccc;
    }
  }

  &__empty {
    margin: 0;
    font-size: 1rem;
    color: #666;
  }
}
</style>
