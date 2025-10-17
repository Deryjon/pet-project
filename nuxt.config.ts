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
      // Can be overridden by NUXT_PUBLIC_API_BASE
      // apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://test-pdvcbwrha-iskandars-projects-1875bffc.vercel.app/api/',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://konkurentcases.vercel.app/api/',
    },
  },
})
