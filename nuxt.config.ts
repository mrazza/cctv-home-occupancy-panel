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
      panelTitle: 'CCTV OCCUPANCY PANEL' // Can be overridden by NUXT_PUBLIC_PANEL_TITLE env var
    }
  }
})
