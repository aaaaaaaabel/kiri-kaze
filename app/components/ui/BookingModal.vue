<template>
  <Teleport to="body">
    <Transition name="booking-modal">
      <div
        v-if="isOpen && event"
        class="booking-modal__backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        @click.self="emit('close')"
      >
        <div class="booking-modal__card">
          <button
            type="button"
            class="booking-modal__close"
            aria-label="Close"
            @click="emit('close')"
          >
            ✕
          </button>
          <h2 id="booking-modal-title" class="booking-modal__title">{{ event.title }}</h2>
          <p class="booking-modal__subtitle">Register for this event</p>

          <div v-if="success" class="booking-modal__success">
            <div class="booking-modal__success-icon" aria-hidden="true">
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle
class="booking-modal__success-circle"
cx="26"
cy="26"
r="24" />
                <path
class="booking-modal__success-check"
d="M14 27l8 8 16-18"
stroke-width="3"
stroke-linecap="round"
stroke-linejoin="round" />
              </svg>
            </div>
            <h3 class="booking-modal__success-title">Thank you for your registration</h3>
            <p class="booking-modal__success-desc">
              We will send a confirmation email to <strong>{{ form.email }}</strong>, please check your inbox.
            </p>
            <button type="button" class="booking-modal__btn-close" @click="emit('close')">
              關閉
            </button>
          </div>

          <form
            v-else
            class="booking-modal__form"
            @submit.prevent="handleSubmit"
          >
            <div v-if="formError" class="booking-modal__error">{{ formError }}</div>
            <div class="booking-modal__field">
              <label for="booking-name">Name *</label>
              <input
                id="booking-name"
                v-model="form.name"
                type="text"
                required
                placeholder="Your name"
              >
            </div>
            <div class="booking-modal__field">
              <label for="booking-email">Email *</label>
              <input
                id="booking-email"
                v-model="form.email"
                type="email"
                required
                placeholder="your@email.com"
              >
            </div>
            <div class="booking-modal__field">
              <label for="booking-phone">Phone *</label>
              <input
                id="booking-phone"
                v-model="form.phone"
                type="tel"
                required
                placeholder="Your phone"
              >
            </div>
            <div class="booking-modal__field">
              <label for="booking-notes">Notes (optional)</label>
              <textarea
                id="booking-notes"
                v-model="form.notes"
                rows="3"
                placeholder="Any notes..."
              />
            </div>
            <button
              type="submit"
              class="booking-modal__submit"
              :disabled="submitting"
            >
              <span v-if="submitting" class="booking-modal__spinner" />
              {{ submitting ? "Submitting..." : "Submit registration" }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { IEvent } from "~/composables/useEvents";
import emailjs from "@emailjs/browser";

const props = defineProps<{
  isOpen: boolean;
  event: IEvent | null;
}>();

const emit = defineEmits<{
  (e: "close" | "registered"): void;
}>();

const config = useRuntimeConfig();
const authStore = useAuthStore();
const { checkBookingByUser, checkBookingExists, createBooking } = useEvents();

const form = reactive({
  name: "",
  email: "",
  phone: "",
  notes: "",
});

const submitting = ref(false);
const success = ref(false);
const formError = ref("");

function setDefaultEmail() {
  if (authStore.email) form.email = authStore.email;
}

watch(
  () => [props.isOpen, props.event] as const,
  ([open, ev]) => {
    if (open && ev) {
      formError.value = "";
      success.value = false;
      setDefaultEmail();
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  const ev = props.event;
  if (!ev) return;

  const name = form.name.trim();
  const email = form.email.trim().toLowerCase();
  const phone = form.phone.trim();
  if (!name || !email || !phone) {
    formError.value = "Please fill in name, email and phone.";
    return;
  }

  // 登入停用時允許 guest 報名（uid 可為 null）
  const uid = authStore.uid || null;

  formError.value = "";
  submitting.value = true;
  try {
    if (uid) {
      const already = await checkBookingByUser(ev.id, uid);
      if (already) {
        formError.value = "You have already registered for this event.";
        return;
      }
    } else {
      const already = await checkBookingExists(ev.id, email);
      if (already) {
        formError.value = "You have already registered for this event.";
        return;
      }
    }

    await createBooking({
      eventId: ev.id,
      eventTitle: ev.title,
      uid,
      name,
      email,
      phone,
      notes: form.notes.trim(),
    });

    // EmailJS：發送報名者確認信 + 管理員通知信（失敗不影響報名成功）
    try {
      const publicKey = config.public.emailjsPublicKey as string;
      const serviceId = config.public.emailjsServiceId as string;
      const templateConfirmation = config.public.emailjsTemplateConfirmation as string;
      const templateNotification = config.public.emailjsTemplateNotification as string;
      const notes = form.notes.trim();

      if (publicKey) emailjs.init(publicKey);

      if (serviceId && templateConfirmation) {
        await emailjs.send(serviceId, templateConfirmation, {
          name,
          email,
          phone,
          event_title: ev.title,
          event_date: ev.date,
          event_time: ev.time,
          event_location: ev.location,
          notes,
        });
      }

      if (serviceId && templateNotification) {
        await emailjs.send(serviceId, templateNotification, {
          name,
          email,
          phone,
          event_title: ev.title,
          notes,
        });
      }
    } catch (emailErr) {
      if (import.meta.dev) console.error("[BookingModal] EmailJS send error", emailErr);
    }

    success.value = true;
    emit("registered");
  } catch (err) {
    if (import.meta.dev) console.error("[BookingModal] submit error", err);
    formError.value = "Registration failed. Please try again.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;
@use "sass:color";

.booking-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--lc-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--lc-space-sm);
  background: rgb(0 0 0 / 50%);
  backdrop-filter: blur(4px);
}

.booking-modal__card {
  position: relative;
  width: 100%;
  max-width: 380px;
  max-height: 90vh;
  padding: 32px 28px;
  overflow-y: auto;
  background: $color-bg;
  border-radius: var(--lc-radius-md);
  box-shadow: 0 12px 40px rgb(0 0 0 / 15%);
}

.booking-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--lc-color-text-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: background var(--lc-transition-quick), color var(--lc-transition-quick);

  &:hover {
    color: $color-primary;
    background: $color-gray-light;
  }
}

.booking-modal__title {
  margin: 0 0 4px;
  font-family: $font-family-en;
  font-size: 1.35rem;
  font-weight: 600;
  color: $color-primary;
}

.booking-modal__subtitle {
  margin: 0 0 24px;
  font-size: 0.9rem;
  color: var(--lc-color-text-muted);
}

.booking-modal__error {
  padding: 12px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #b91c1c;
  background: #fef2f2;
  border-radius: var(--lc-radius-sm);
}

.booking-modal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.booking-modal__field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: $color-primary;
  }

  input,
  textarea {
    padding: 10px 12px;
    font-family: inherit;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: var(--lc-radius-sm);

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }

  textarea {
    min-height: 72px;
    resize: vertical;
  }
}

.booking-modal__submit {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  margin-top: 8px;
  font-size: 1rem;
  color: var(--lc-color-white);
  cursor: pointer;
  background: $color-primary;
  border: none;
  border-radius: var(--lc-radius-sm);
  transition: background var(--lc-transition-quick);

  &:hover:not(:disabled) {
    background: color.adjust($color-primary, $lightness: -8%);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.booking-modal__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgb(255 255 255 / 40%);
  border-top-color: var(--lc-color-white);
  border-radius: 50%;
  animation: booking-modal-spin 0.7s linear infinite;
}

@keyframes booking-modal-spin {
  to {
    transform: rotate(360deg);
  }
}

.booking-modal__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 8px;
  text-align: center;
}

.booking-modal__success-icon {
  width: 72px;
  height: 72px;
  margin-bottom: 24px;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.booking-modal__success-circle {
  fill: none;
  stroke: #15803d;
  stroke-width: 2;
  stroke-dasharray: 151;
  stroke-dashoffset: 151;
  animation: booking-modal-success-circle var(--lc-transition-normal) ease-out forwards;
}

.booking-modal__success-check {
  fill: none;
  stroke: #15803d;
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: booking-modal-success-check 0.4s ease-out 0.25s forwards;
}

@keyframes booking-modal-success-circle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes booking-modal-success-check {
  to {
    stroke-dashoffset: 0;
  }
}

.booking-modal__success-title {
  margin: 0 0 12px;
  font-family: $font-family-en;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: $color-primary;
}

.booking-modal__success-desc {
  margin: 0 0 28px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--lc-color-text-muted);

  strong {
    font-weight: 600;
    color: $color-primary;
  }
}

.booking-modal__btn-close {
  padding: 10px 20px;
  font-size: 1rem;
  color: var(--lc-color-white);
  cursor: pointer;
  background: $color-primary;
  border: none;
  border-radius: var(--lc-radius-sm);
  transition: background var(--lc-transition-quick);

  &:hover {
    background: color.adjust($color-primary, $lightness: -8%);
  }
}

.booking-modal-enter-active,
.booking-modal-leave-active {
  transition: opacity var(--lc-transition-quick) ease;

  .booking-modal__card {
    transition: transform var(--lc-transition-quick) ease;
  }
}

.booking-modal-enter-from,
.booking-modal-leave-to {
  opacity: 0;

  .booking-modal__card {
    transform: scale(0.96);
  }
}
</style>
