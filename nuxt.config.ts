// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',

    devtools: { enabled: true },

    typescript: {
        strict: true,
        typeCheck: true,
    },

    modules: ['nuxt-vuefire'],

    css: ['~/assets/styles/main.scss'],

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
            enabled: false, // 目前不需要認證功能
        },
    },

    runtimeConfig: {
        public: {
            firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        },
    },
})
