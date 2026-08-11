// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",

  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      title: "Lacunae",
      titleTemplate: "%s | Lacunae",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Lacunae Studio — Web Fossil Excavator",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Lacunae" },
        {
          property: "og:description",
          content: "Lacunae Studio — Web Fossil Excavator",
        },
        { property: "og:image", content: "/og-image.png" },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  modules: [
    "@pinia/nuxt", // 狀態管理（用於 route 和 transition 系統）
    "@nuxthub/core",
    "@nuxt/eslint",
  ],

  hub: {
    db: "sqlite",
    blob: true,
  },

  css: ["~/assets/fonts/index.ts", "~/assets/styles/main.scss"],

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
