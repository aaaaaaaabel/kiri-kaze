/**
 * 從 VueFire 的 Firebase App 取得設定（單一來源，避免與 runtimeConfig 重複）。
 * 僅在 client 有值；SSR 時回傳 undefined。
 */
import { getApp } from 'firebase/app'

export interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
}

export function useFirebaseConfig(): FirebaseConfig {
  const empty: FirebaseConfig = {
    apiKey: undefined,
    authDomain: undefined,
    projectId: undefined,
    storageBucket: undefined,
  };
  if (import.meta.server) {
    return empty;
  }
  try {
    const app = getApp();
    const opts = app?.options as { apiKey?: string; authDomain?: string; projectId?: string; storageBucket?: string } | undefined;
    return {
      apiKey: opts?.apiKey,
      authDomain: opts?.authDomain,
      projectId: opts?.projectId,
      storageBucket: opts?.storageBucket,
    };
  } catch {
    return empty;
  }
}
