<template>
  <Teleport to="body">
    <Transition name="auth-modal">
      <div
        v-if="isOpen"
        class="auth-modal__backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        @click.self="emit('close')"
      >
        <div class="auth-modal__card">
          <button
            type="button"
            class="auth-modal__close"
            aria-label="Close"
            @click="emit('close')"
          >
            ✕
          </button>
          <h2 id="auth-modal-title" class="auth-modal__title">Sign in</h2>

          <div v-if="errorMessage" class="auth-modal__error">
            {{ errorMessage }}
          </div>

          <div v-if="loading" class="auth-modal__loading">
            <div class="auth-modal__spinner"/>
            <p>Signing in...</p>
          </div>

          <template v-else>
            <p class="auth-modal__hint">Sign in with your Google account</p>
            <button
              type="button"
              class="auth-modal__google"
              :disabled="loading"
              @click="handleGoogleLogin"
            >
              <svg
                class="auth-modal__google-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { loginWithGoogle } = useAuth();
const loading = ref(false);
const errorMessage = ref("");

async function handleGoogleLogin() {
  if (loading.value) return;
  errorMessage.value = "";
  loading.value = true;
  try {
    await loginWithGoogle();
    emit("close");
  } catch (err: unknown) {
    const e = err as { message?: string };
    const msg = e?.message ?? "Sign-in failed. Please try again.";
    if (import.meta.dev) {
      console.error("[Auth] Google 登入錯誤:", err);
    }
    errorMessage.value = msg;
  } finally {
    loading.value = false;
  }
}

// 關閉時清空錯誤與 loading
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      errorMessage.value = "";
      loading.value = false;
    }
  },
);
</script>

<style scoped lang="scss">
@use "~/assets/styles/abstracts" as *;

.auth-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(0 0 0 / 50%);
  backdrop-filter: blur(4px);
}

.auth-modal__card {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 32px 28px;
  background: var(--lc-color-bg);
  border-radius: var(--lc-radius-md);
  box-shadow: 0 12px 40px rgb(0 0 0 / 15%);
}

.auth-modal__close {
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
  transition:
    background var(--lc-transition-quick),
    color var(--lc-transition-quick);

  &:hover {
    color: var(--lc-color-black);
    background: var(--lc-color-gray-light);
  }
}

.auth-modal__title {
  margin: 0 0 24px;
  font-family: var(--lc-font-en);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--lc-color-black);
}

.auth-modal__error {
  padding: 12px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #b91c1c;
  background: #fef2f2;
  border-radius: var(--lc-radius-sm);
}

.auth-modal__hint {
  margin: 0 0 20px;
  font-size: 0.95rem;
  color: var(--lc-color-text-muted);
}

.auth-modal__google {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px 20px;
  font-family: var(--lc-font-en);
  font-size: 1rem;
  color: #3c4043;
  cursor: pointer;
  background: var(--lc-color-white);
  border: 1px solid #dadce0;
  border-radius: var(--lc-radius-sm);
  transition:
    background var(--lc-transition-quick),
    border-color var(--lc-transition-quick);

  &:hover:not(:disabled) {
    background: var(--lc-color-gray-light);
    border-color: var(--lc-color-gray-mid);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.auth-modal__google-icon {
  width: 20px;
  height: 20px;
}

.auth-modal__loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 24px 0;

  p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--lc-color-text-muted);
  }
}

.auth-modal__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lc-color-gray-light);
  border-top-color: var(--lc-color-black);
  border-radius: 50%;
  animation: auth-modal-spin 0.8s linear infinite;
}

@keyframes auth-modal-spin {
  to {
    transform: rotate(360deg);
  }
}

// Transition
.auth-modal-enter-active,
.auth-modal-leave-active {
  transition: opacity var(--lc-transition-quick) ease;

  .auth-modal__card {
    transition: transform var(--lc-transition-quick) ease;
  }
}

.auth-modal-enter-from,
.auth-modal-leave-to {
  opacity: 0;

  .auth-modal__card {
    transform: scale(0.96);
  }
}
</style>
