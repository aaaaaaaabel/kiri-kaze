// stores/auth.ts
import { defineStore } from "pinia";

/** Local auth user shape while first-party session auth is not ready. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as AuthUser | null,
    isReady: false, // Auth 狀態是否已初始化完成
    authModalOpen: false, // 供各頁面開啟登入 modal（例如收藏時未登入）
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    displayName: (state) => state.user?.displayName ?? "",
    photoURL: (state) => state.user?.photoURL ?? "",
    email: (state) => state.user?.email ?? "",
    uid: (state) => state.user?.uid ?? "",
  },

  actions: {
    setUser(user: AuthUser | null) {
      this.user = user;
      this.isReady = true;
    },
    setAuthModalOpen(open: boolean) {
      this.authModalOpen = open;
    },
  },
});
