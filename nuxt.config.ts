// https://nuxt.com/docs/api/configuration/nuxt-config
const isMobileBuild = import.meta.env.NUXT_APP_MODE === 'mobile';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: import.meta.env.NUXT_DEVTOOLS === 'true' },
  // Mobile (Capacitor) build ships as a static SPA — no Node server on-device.
  // Website deploy stays SSR (NUXT_APP_MODE unset).
  ssr: !isMobileBuild,
  css: ['~/assets/css/tailwind.css', '~/assets/css/receipt-print.css'],
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
      appMode: import.meta.env.NUXT_APP_MODE || 'web',
      backendOrigin: (
        import.meta.env.NUXT_PUBLIC_BACKEND_ORIGIN ||
        import.meta.env.NUXT_API_PROXY_TARGET ||
        'https://api.konkurent-group.uz/api'
      ).replace(/\/api\/?$/i, ''),
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
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon.png' },
        { rel: 'shortcut icon', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.png' },
      ]
    }
  }
})
