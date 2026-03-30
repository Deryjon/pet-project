// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    "@nuxt/icon",
    'nuxt-headlessui',
  ],
  ui: {
    colorMode: false,
  },
  components: true,
  headlessui: { prefix: "H" },
  icon: {
    provider: "iconify",
    serverBundle: false,
  },
  runtimeConfig: {
    apiProxyTarget: process.env.NUXT_API_PROXY_TARGET || '',
    public: {
      // Use same-origin path for API to enable cookies/CSRF on localhost and prod.
      // Can be overridden by NUXT_PUBLIC_API_BASE
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api',
      posPaymentTypeIds: {
        cash: process.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_CASH || '41839fa3-4121-4572-ab19-394e3a7319fe',
        card: process.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_CARD || '41839fa3-4121-4572-ab19-394e3a7319fe',
        payme: process.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_PAYME || '41839fa3-4121-4572-ab19-394e3a7319fe',
        click: process.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_CLICK || '41839fa3-4121-4572-ab19-394e3a7319fe',
        transfer: process.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_TRANSFER || '41839fa3-4121-4572-ab19-394e3a7319fe',
      },
    },
  },
})
