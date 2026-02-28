// plugins/auth.client.ts
import { onAuthStateChanged } from "firebase/auth";

export default defineNuxtPlugin(() => {
  const auth = useFirebaseAuth();
  if (!auth) return;
  const authStore = useAuthStore();

  // 監聽 Firebase Auth 狀態變化，同步到 Pinia store
  onAuthStateChanged(auth, (user) => {
    const wasLoggedOut = !authStore.user;
    authStore.setUser(user);
    // 登入瞬間：把 localStorage 收藏合併進 Firestore（失敗不影響登入狀態）
    if (wasLoggedOut && user) {
      useFavorites()
        .mergeFavorites()
        .catch((e) => {
          if (import.meta.dev) console.warn("[Auth] mergeFavorites 失敗，不影響登入:", e);
        });
    }
  });
});
