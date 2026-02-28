// https://nuxt.com/docs/api/configuration/nuxt-config
import path from "node:path";

// VueFire SSR + auth 會讀此變數，若未設則用專案根目錄的 serviceAccountKey.json
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    process.cwd(),
    "serviceAccountKey.json",
  );
}

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",

  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      title: "Kiri Kaze",
      titleTemplate: "%s | Kiri Kaze",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Kiri Kaze Studio — Web Fossil Excavator",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Kiri Kaze" },
        {
          property: "og:description",
          content: "Kiri Kaze Studio — Web Fossil Excavator",
        },
        { property: "og:image", content: "/og-image.png" },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  modules: [
    "nuxt-vuefire",
    "@pinia/nuxt", // 狀態管理（用於 route 和 transition 系統）
  ],

  css: ["~/assets/styles/main.scss"],

  vuefire: {
    config: {
      apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
    },
    auth: {
      enabled: true,
    },
    admin: {
      // 使用絕對路徑；或設環境變數 GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
      serviceAccount: path.resolve(process.cwd(), "serviceAccountKey.json"),
    },
  },

  runtimeConfig: {
    public: {
      emailjsServiceId: process.env.NUXT_PUBLIC_EMAILJS_SERVICE_ID,
      emailjsTemplateConfirmation: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_CONFIRMATION,
      emailjsTemplateNotification: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_NOTIFICATION,
      emailjsPublicKey: process.env.NUXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    },
  },

  // 路由配置：排除靜態資源路徑
  router: {
    options: {
      // 排除圖片路徑，避免被當成路由處理
      strict: false,
    },
  },

  // 處理 GET /_nuxt/ 或 GET /_nuxt（無檔名）回 204，避免 404 未處理
  serverHandlers: [
    { route: "/_nuxt", method: "get", handler: "#server/handlers/nuxt-204.ts" },
    {
      route: "/_nuxt/",
      method: "get",
      handler: "#server/handlers/nuxt-204.ts",
    },
  ],
});
