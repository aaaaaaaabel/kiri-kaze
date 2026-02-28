<template>
  <div class="menu">
    <div class="menu_inner">
      <div class="menu_back"><div class="menu_circle"></div></div>
      <div class="menu_contents">
        <Transition name="menu-view" mode="out-in">
          <!-- Menu view: 導航列表 + 底部 Sign in / Profile -->
          <div v-if="overlayView === 'menu'" class="menu_contents__main" key="menu">
            <div class="menu_element">
              <div>
                <img src="/images/element01.svg" alt="" />
              </div>
              <div>
                <img src="/images/element11.svg" alt="" />
              </div>
              <div>
                <img src="/images/element11.svg" alt="" />
              </div>
            </div>
            <div class="menu_area">
              <div class="menu_block">
                <div class="menu_list menu_list3">
                  <NuxtLink to="/about" class="link" @click="closeMenu">
                    <div class="menu_number">
                      <span></span>
                      <p class="kiri en0">1</p>
                    </div>
                    <div class="menu_title">
                      <p class="kiri ja0">About kiri</p>
                    </div>
                  </NuxtLink>
                </div>
                <div class="menu_list menu_list2">
                  <NuxtLink to="/portfolio" class="link" @click="closeMenu">
                    <div class="menu_number">
                      <span></span>
                      <p class="kiri en0">2</p>
                    </div>
                    <div class="menu_title">
                      <p class="kiri ja0">Portfolio</p>
                    </div>
                  </NuxtLink>
                </div>
                <div class="menu_list menu_list2">
                  <NuxtLink to="/collection" class="link" @click="closeMenu">
                    <div class="menu_number">
                      <span></span>
                      <p class="kiri en0">3</p>
                    </div>
                    <div class="menu_title">
                      <p class="kiri ja0">Collection</p>
                    </div>
                  </NuxtLink>
                </div>
                <div class="menu_list menu_list2">
                  <NuxtLink to="/events" class="link" @click="closeMenu">
                    <div class="menu_number">
                      <span></span>
                      <p class="kiri en0">4</p>
                    </div>
                    <div class="menu_title">
                      <p class="kiri ja0">Events</p>
                    </div>
                  </NuxtLink>
                </div>
              </div>
              <!-- Sign in / Profile：與 menu_title 同寬度、同起點，text-align: center -->
              <div class="menu_auth_section">
                <button
                  v-if="!isLoggedIn"
                  type="button"
                  class="menu_auth_trigger"
                  @click="emit('update:overlayView', 'login')"
                >
                  Sign in
                </button>
                <button
                  v-else
                  type="button"
                  class="menu_auth_trigger"
                  @click="emit('update:overlayView', 'profile')"
                >
                  Profile
                </button>
              </div>
            </div>
            <div class="menu_filter"><span></span><span></span></div>

            <div class="menu_button">
              <div class="round_button round_button_bt">
                <a href="https://line.me/ti/p/By5dhWxd1m" target="_blank" rel="noopener noreferrer">
                  <p class="kiri ja0">聯絡詢問服務</p>
                </a>
              </div>
            </div>
          </div>

          <!-- Login view: Google 登入 + Back -->
          <div v-else-if="overlayView === 'login'" class="menu_contents__auth" key="login">
            <button type="button" class="menu_overlay_back" @click="emit('update:overlayView', 'menu')">
              ← Back
            </button>
            <h2 class="menu_overlay_title">Sign in</h2>
            <div v-if="loginError" class="menu_overlay_error">{{ loginError }}</div>
            <div v-if="loginLoading" class="menu_overlay_loading">
              <div class="menu_overlay_spinner"></div>
              <p>Signing in...</p>
            </div>
            <template v-else>
              <p class="menu_overlay_hint">Sign in with your Google account</p>
              <button
                type="button"
                class="menu_overlay_google"
                :disabled="loginLoading"
                @click="handleGoogleLogin"
              >
                <svg class="menu_overlay_google_icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </template>
          </div>

          <!-- Profile view: 使用者名稱 + Sign out + Back -->
          <div v-else-if="overlayView === 'profile'" class="menu_contents__profile" key="profile">
            <button type="button" class="menu_overlay_back" @click="emit('update:overlayView', 'menu')">
              ← Back
            </button>
            <p class="menu_overlay_name">{{ displayName || "User" }}</p>
            <button type="button" class="menu_overlay_logout" @click="handleSignOut">
              Sign out
            </button>
          </div>
        </Transition>
      </div>
      <div class="menu_front"><div class="menu_circle"></div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  overlayView: "menu" | "login" | "profile";
  isLoggedIn: boolean;
  displayName: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update:overlayView", value: "menu" | "login" | "profile"): void;
  (e: "loginSuccess"): void;
}>();

const { loginWithGoogle, logout } = useAuth();
const loginLoading = ref(false);
const loginError = ref("");

async function handleGoogleLogin() {
  if (loginLoading.value) return;
  loginError.value = "";
  loginLoading.value = true;
  try {
    await loginWithGoogle();
    emit("loginSuccess");
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    const code = e?.code ?? "";
    const errorMap: Record<string, string> = {
      "auth/not-ready": "Sign-in service is not ready. Please refresh the page and try again.",
      "auth/popup-closed-by-user": "Sign-in window was closed. Please try again.",
      "auth/cancelled-popup-request": "Sign-in was cancelled.",
      "auth/network-request-failed": "Network error. Please check your connection.",
      "auth/unauthorized-domain": "This domain is not authorized for Firebase.",
      "auth/operation-not-allowed": "Google sign-in is not enabled.",
      "auth/popup-blocked": "Pop-up was blocked. Please allow pop-ups and try again.",
      "auth/invalid-api-key": "Firebase API key is invalid.",
      "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Firebase API key is invalid.",
      "auth/configuration-not-found": "Firebase auth configuration is missing.",
      "auth/tenant-id-mismatch": "Firebase tenant configuration mismatch.",
    };
    const msg = errorMap[code] ?? "Sign-in failed. Please try again.";
    if (import.meta.dev && !errorMap[code]) {
      console.error("[Auth] Google 登入錯誤:", code, e?.message ?? err);
      loginError.value = `${msg} (code: ${code || "none"})`;
    } else {
      loginError.value = msg;
    }
  } finally {
    loginLoading.value = false;
  }
}

function handleSignOut() {
  logout();
  emit("close");
}

watch(
  () => props.overlayView,
  (view) => {
    if (view !== "login") {
      loginError.value = "";
      loginLoading.value = false;
    }
  },
);

function closeMenu() {
  emit("close");
}
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as *;

.menu_contents__main {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* menu_area 改為 flex，讓 menu_block 與 menu_auth_section 上下分散 */
.menu_contents__main :deep(.menu_area) {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Sign in / Profile：與 menu_list 同區，無 padding-left；trigger 寬度 10% */
.menu_auth_section {
  width: 100%;
  padding-top: 24px;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
  box-sizing: border-box;
}

.menu_auth_section .menu_auth_trigger {
  display: block;
  width: 100%;
  padding: 12px 0 12px 5%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: $font-family-en;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 500;
  color: rgb(255, 255, 255);
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  @include tb {
    font-size: 24px;
  }

  @include sp {
    font-size: 22px;
  }
}

.menu_contents__auth,
.menu_contents__profile {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  padding: 120px 60px 60px;
  overflow: auto;
  @include tb {
    padding: 80px 40px 40px;
  }
  @include sp {
    padding: 60px 24px 24px;
  }
}

.menu_overlay_back {
  margin-bottom: 32px;
  padding: 8px 0;
  border: none;
  background: none;
  font-family: $font-family-en;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  &:hover {
    color: #fff;
  }
}

.menu_overlay_title {
  margin: 0 0 24px;
  font-family: $font-family-en;
  font-size: 1.75rem;
  font-weight: 600;
  color: #fff;
}

.menu_overlay_name {
  margin: 0 0 24px;
  font-family: $font-family-en;
  font-size: 1.25rem;
  color: #fff;
}

.menu_overlay_error {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  color: #fca5a5;
  font-size: 0.875rem;
  border-radius: 8px;
}

.menu_overlay_hint {
  margin: 0 0 20px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
}

.menu_overlay_google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  background: #fff;
  font-family: $font-family-en;
  font-size: 1rem;
  color: #3c4043;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  &:hover:not(:disabled) {
    background: $color-gray-light;
    border-color: #ccc;
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.menu_overlay_google_icon {
  width: 20px;
  height: 20px;
}

.menu_overlay_loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  p {
    margin: 0;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
  }
}

.menu_overlay_spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: menu-overlay-spin 0.8s linear infinite;
}

@keyframes menu-overlay-spin {
  to {
    transform: rotate(360deg);
  }
}

.menu_overlay_logout {
  display: block;
  padding: 12px 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 999px;
  background: transparent;
  font-family: $font-family-en;
  font-size: 1rem;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #fff;
  }
}

.menu-view-enter-active,
.menu-view-leave-active {
  transition: opacity 0.2s ease;
}
.menu-view-enter-from,
.menu-view-leave-to {
  opacity: 0;
}
</style>
