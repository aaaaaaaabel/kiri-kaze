// plugins/auth.client.ts
export default defineNuxtPlugin(() => {
  // Auth is disabled; mark the store ready so UI that waits on isReady can proceed.
  const authStore = useAuthStore();
  authStore.setUser(null);
});
