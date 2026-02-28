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
            <div class="auth-modal__spinner"></div>
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
    const e = err as { code?: string; message?: string };
    const code = e?.code ?? "";
    const errorMap: Record<string, string> = {
      "auth/not-ready": "Sign-in service is not ready. Please refresh the page and try again.",
      "auth/popup-closed-by-user": "Sign-in window was closed. Please try again.",
      "auth/cancelled-popup-request": "Sign-in was cancelled.",
      "auth/network-request-failed": "Network error. Please check your connection.",
      "auth/unauthorized-domain": "This domain is not authorized for Firebase. Add it in Firebase Console > Authentication > Authorized domains (e.g. localhost).",
      "auth/operation-not-allowed": "Google sign-in is not enabled. Enable it in Firebase Console > Build > Authentication > Sign-in method.",
      "auth/popup-blocked": "Pop-up was blocked by your browser. Please allow pop-ups and try again.",
      "auth/invalid-api-key": "Firebase API key is invalid. Copy the correct apiKey from Firebase Console > Project settings > General > Your apps to NUXT_PUBLIC_FIREBASE_API_KEY in .env",
      "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Firebase API key is invalid. Copy the correct apiKey from Firebase Console > Project settings > General > Your apps to NUXT_PUBLIC_FIREBASE_API_KEY in .env",
      "auth/configuration-not-found": "Firebase auth configuration is missing. Please check project settings.",
      "auth/tenant-id-mismatch": "Firebase tenant configuration mismatch.",
    };
    const msg = errorMap[code] ?? "Sign-in failed. Please try again.";
    // 開發時在 console 印出完整錯誤；若為未知錯誤碼，訊息後附上 code 方便排查
    if (import.meta.dev) {
      console.error("[Auth] Google 登入錯誤:", code, e?.message ?? err);
      if (!errorMap[code]) errorMessage.value = `${msg} (code: ${code || "none"})`;
      else errorMessage.value = msg;
    } else {
      errorMessage.value = msg;
    }
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
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.auth-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.auth-modal__card {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 32px 28px;
  background: $color-bg;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.auth-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #666;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    background: $color-gray-light;
    color: $color-primary;
  }
}

.auth-modal__title {
  margin: 0 0 24px;
  font-family: $font-family-en;
  font-size: 1.5rem;
  font-weight: 600;
  color: $color-primary;
}

.auth-modal__error {
  margin-bottom: 16px;
  padding: 12px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.875rem;
  border-radius: 8px;
}

.auth-modal__hint {
  margin: 0 0 20px;
  font-size: 0.95rem;
  color: #666;
}

.auth-modal__google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  background: #fff;
  font-family: $font-family-en;
  font-size: 1rem;
  color: #3c4043;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;

  &:hover:not(:disabled) {
    background: $color-gray-light;
    border-color: #ccc;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.auth-modal__google-icon {
  width: 20px;
  height: 20px;
}

.auth-modal__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;

  p {
    margin: 0;
    font-size: 0.95rem;
    color: #666;
  }
}

.auth-modal__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $color-gray-light;
  border-top-color: $color-primary;
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
  transition: opacity 0.2s ease;

  .auth-modal__card {
    transition: transform 0.2s ease;
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
