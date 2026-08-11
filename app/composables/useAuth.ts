// composables/useAuth.ts
import { ref, computed } from "vue";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export function useAuth() {
  const { public: { isMockDataEnabled } } = useRuntimeConfig();
  // mock 模式：Firebase 連不上，登入功能暫停，收藏改走 useFavorites 的 localStorage 路徑
  if (isMockDataEnabled) {
    const user = ref<unknown>(null);
    return {
      user,
      isLoggedIn: computed(() => false),
      loginWithGoogle: async () => {
        throw new Error("資料庫維護中，登入功能暫停使用，請稍後再試");
      },
      logout: async () => {},
    };
  }

  // SSR 時 Firebase 未初始化，回傳 stub 避免 500
  if (import.meta.server) {
    const user = ref<unknown>(null);
    return {
      user,
      isLoggedIn: computed(() => false),
      loginWithGoogle: async () => {},
      logout: async () => {},
    };
  }

  const auth = useFirebaseAuth();
  const db = useFirestore();
  const user = useCurrentUser();

  // Google 登入
  const loginWithGoogle = async () => {
    if (!auth) {
      throw Object.assign(new Error("Firebase Auth 尚未就緒"), { code: "auth/not-ready" });
    }
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const u = credential.user;

    // 檢查 Firestore 是否已有此 user，沒有才建立
    const userRef = doc(db, "users", u.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        createdAt: serverTimestamp(),
        favorites: [],
      });
    }

    return u;
  };

  // 登出
  const logout = async () => {
    if (auth) await signOut(auth);
  };

  // 是否已登入
  const isLoggedIn = computed(() => !!user.value);

  return {
    user,
    isLoggedIn,
    loginWithGoogle,
    logout,
  };
}
