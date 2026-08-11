// composables/useAuth.ts
import { computed, ref } from "vue";
import type { AuthUser } from "~/stores/auth";

/**
 * Auth is disabled until first-party session auth lands (see refactor-roadmap Phase 4).
 * Keep the same public API so Menu / AuthModal callers do not need a rewrite.
 */
export function useAuth() {
  const user = ref<AuthUser | null>(null);

  return {
    user,
    isLoggedIn: computed(() => false),
    loginWithGoogle: async () => {
      throw new Error("資料庫維護中，登入功能暫停使用，請稍後再試");
    },
    logout: async () => {},
  };
}
