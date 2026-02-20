// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    "@nuxt/icon",
    'nuxt-headlessui',
  ],
  components: true,
  headlessui: { prefix: "H" },
  icon: {
    provider: "server",
    fallbackToApi: false,
  },
  runtimeConfig: {
    public: {
      // Use same-origin path for API to enable cookies/CSRF on localhost and prod.
      // Can be overridden by NUXT_PUBLIC_API_BASE
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      // Example local backend: 'http://127.0.0.1:8000/api'
    },
  },
})
