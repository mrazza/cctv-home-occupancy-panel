// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Custom styling system import
  css: ['~/assets/css/main.css'],

  // Runtime configuration
  runtimeConfig: {
    apiBaseUrl: 'http://localhost:8000', // Can be overridden by NUXT_API_BASE_URL env var
    public: {
      panelTitle: 'CCTV OCCUPANCY PANEL', // Can be overridden by NUXT_PUBLIC_PANEL_TITLE env var
      cctvRefreshInterval: parseInt(process.env.CCTV_REFRESH_INTERVAL || process.env.NUXT_PUBLIC_CCTV_REFRESH_INTERVAL || '2000', 10),
      statusPollInterval: parseInt(process.env.STATUS_POLL_INTERVAL || process.env.NUXT_PUBLIC_STATUS_POLL_INTERVAL || '3000', 10),
      eventsPollInterval: parseInt(process.env.EVENTS_POLL_INTERVAL || process.env.NUXT_PUBLIC_EVENTS_POLL_INTERVAL || '5000', 10)
    }
  }
})
