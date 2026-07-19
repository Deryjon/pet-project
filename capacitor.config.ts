import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.konkurent.crmapp',
  appName: 'Konkurent CRM',
  webDir: '.output/public',
  server: {
    // Custom capacitor:// scheme behaves inconsistently with fetch/cookies
    // in WKWebView; https://localhost is a proper secure context and
    // matches the FRONTEND_URL entry already added on the backend.
    iosScheme: 'https',
  },
};

export default config;
