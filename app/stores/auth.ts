// stores/auth.ts
import { defineStore } from "pinia";
import type { User } from "firebase/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
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
    setUser(user: User | null) {
      this.user = user;
      this.isReady = true;
    },
    setAuthModalOpen(open: boolean) {
      this.authModalOpen = open;
    },
  },
});
