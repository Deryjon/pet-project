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
  runtimeConfig: {
    public: {
      // Use same-origin path for API to enable cookies/CSRF on localhost and prod.
      // Can be overridden by NUXT_PUBLIC_API_BASE
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      // Example local backend: 'http://127.0.0.1:8000/api'
    },
  },
  // Proxy external API to same-origin path so cookies and CSRF work on localhost.
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: 'https://konkurentcases.vercel.app/api/**',
      },
    },
    // Ensure proxy also works in local dev server
    devProxy: {
      '/api': {
        target: 'https://konkurentcases.vercel.app/api',
        changeOrigin: true,
      },
    },
  },
})
