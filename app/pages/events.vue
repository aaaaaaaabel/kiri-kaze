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
            />
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

const authStore = useAuthStore();
const { fetchEvents } = useEvents();
const events = ref<IEvent[]>([]);
const loading = ref(true);
const bookingModalOpen = ref(false);
const bookingEvent = ref<IEvent | null>(null);

function isFull(event: IEvent): boolean {
  return event.registeredCount >= event.capacity;
}

function handleRegister(event: IEvent) {
  if (isFull(event)) return;
  if (!authStore.isLoggedIn) {
    authStore.setAuthModalOpen(true);
    return;
  }
  bookingEvent.value = event;
  bookingModalOpen.value = true;
}

function closeBookingModal() {
  bookingModalOpen.value = false;
  bookingEvent.value = null;
  // 關閉時重新拉取列表，確保人數與 Firestore 一致（例如後台刪除報名後）
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
  title: "Events | Fossil Index",
  meta: [
    {
      name: "description",
      content: "Events page",
    },
  ],
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

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
    font-size: 48px;
    font-weight: 400;
    margin-bottom: 60px;
    color: $color-primary;

    @include tb {
      font-size: 36px;
      margin-bottom: 40px;
    }

    @include sp {
      font-size: 28px;
      margin-bottom: 30px;
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
      width: 100%;
      height: auto;
      object-fit: cover;
      display: block;
    }
  }

  &__item-image-placeholder {
    width: 100%;
    aspect-ratio: 16 / 10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 0.9rem;
  }

  &__item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  &__item-title {
    font-size: 32px;
    font-weight: 400;
    color: $color-primary;
    margin: 0;

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
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  &__item-spots {
    font-size: 14px;
    color: $color-accent;
    margin: 0;
  }

  &__item-cta {
    display: inline-block;
    margin-top: auto;
    padding: 12px 24px;
    background: $color-primary;
    color: #fff;
    font-size: 1rem;
    text-decoration: none;
    border: none;
    border-radius: 8px;
    transition: background 0.2s, opacity 0.2s;
    align-self: flex-start;
    cursor: pointer;

    @include sp {
      align-self: center;
      margin-top: 20px;
    }

    &:hover {
      background: darken($color-primary, 8%);
    }

    &--disabled {
      background: #ccc;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  &__empty {
    font-size: 1rem;
    color: #666;
    margin: 0;
  }
}
</style>
