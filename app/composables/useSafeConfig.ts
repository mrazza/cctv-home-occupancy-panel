export function useSafeConfig() {
  const defaultConfig = {
    public: {
      panelTitle: 'CCTV OCCUPANCY PANEL',
      cctvRefreshInterval: 2000,
      statusPollInterval: 3000,
      eventsPollInterval: 5000
    }
  }

  try {
    const config = (globalThis as any).useRuntimeConfig
      ? (globalThis as any).useRuntimeConfig()
      : useRuntimeConfig()

    return {
      public: {
        panelTitle: config?.public?.panelTitle ?? defaultConfig.public.panelTitle,
        cctvRefreshInterval: config?.public?.cctvRefreshInterval ?? defaultConfig.public.cctvRefreshInterval,
        statusPollInterval: config?.public?.statusPollInterval ?? defaultConfig.public.statusPollInterval,
        eventsPollInterval: config?.public?.eventsPollInterval ?? defaultConfig.public.eventsPollInterval
      }
    }
  } catch (e) {
    return defaultConfig
  }
}
