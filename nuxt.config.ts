// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: import.meta.env.NUXT_DEVTOOLS === 'true' },
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
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 300,
        ignored: [
          "**/.git/**",
          "**/.nuxt/**",
          "**/.output/**",
          "**/node_modules/**",
        ],
      },
    },
  },
  runtimeConfig: {
    apiProxyTarget: import.meta.env.NUXT_API_PROXY_TARGET || 'https://api.konkurent-group.uz/api',
    public: {
      // Prefer direct backend requests unless explicitly overridden.
      // Can still be set to '/api' via NUXT_PUBLIC_API_BASE to use the Nuxt proxy.
      apiBase:
        import.meta.env.NUXT_PUBLIC_API_BASE ||
        import.meta.env.NUXT_API_PROXY_TARGET ||
        'https://api.konkurent-group.uz/api',
      posPaymentTypeIds: {
        cash: import.meta.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_CASH || '41839fa3-4121-4572-ab19-394e3a7319fe',
        card: import.meta.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_CARD || '41839fa3-4121-4572-ab19-394e3a7319fe',
        payme: import.meta.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_PAYME || '41839fa3-4121-4572-ab19-394e3a7319fe',
        click: import.meta.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_CLICK || '41839fa3-4121-4572-ab19-394e3a7319fe',
        transfer: import.meta.env.NUXT_PUBLIC_POS_PAYMENT_TYPE_TRANSFER || '41839fa3-4121-4572-ab19-394e3a7319fe',
      },
    },
  },
})
