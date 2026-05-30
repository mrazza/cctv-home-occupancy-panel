// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Custom styling system import
  css: ['~/assets/css/main.css'],

  // Runtime configuration — override via NUXT_* env vars at runtime
  // (e.g. NUXT_API_BASE_URL, NUXT_PUBLIC_PANEL_TITLE, NUXT_PUBLIC_CCTV_REFRESH_INTERVAL)
  runtimeConfig: {
    apiBaseUrl: 'http://localhost:8000',
    public: {
      panelTitle: 'CCTV OCCUPANCY PANEL',
      cctvRefreshInterval: 2000,
      statusPollInterval: 3000,
      eventsPollInterval: 5000
    }
  }
})
