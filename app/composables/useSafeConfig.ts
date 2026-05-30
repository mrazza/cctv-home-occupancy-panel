/**
 * Default configuration values, used as fallbacks when runtime config
 * is unavailable (e.g., during unit tests or if Nuxt context is missing).
 */
export const CONFIG_DEFAULTS = {
  panelTitle: 'CCTV OCCUPANCY PANEL',
  cctvRefreshInterval: 2000,
  statusPollInterval: 3000,
  eventsPollInterval: 5000
} as const

/**
 * Safe wrapper around Nuxt's `useRuntimeConfig()`. Returns public config
 * values with fallbacks to CONFIG_DEFAULTS if runtime config is unavailable
 * or throws (e.g., outside Nuxt context in tests).
 *
 * In test environments where Nuxt auto-imports aren't available,
 * `useRuntimeConfig` can be provided via `globalThis` (e.g., vi.stubGlobal).
 */
export function useSafeConfig() {
  try {
    // Resolve useRuntimeConfig — prefer globalThis for test environments where
    // Nuxt auto-imports aren't available, then fall through to Nuxt's auto-import.
    const runtimeConfigFn = (globalThis as any).useRuntimeConfig ?? useRuntimeConfig
    const config = runtimeConfigFn()

    return {
      public: {
        panelTitle: config?.public?.panelTitle ?? CONFIG_DEFAULTS.panelTitle,
        cctvRefreshInterval: config?.public?.cctvRefreshInterval ?? CONFIG_DEFAULTS.cctvRefreshInterval,
        statusPollInterval: config?.public?.statusPollInterval ?? CONFIG_DEFAULTS.statusPollInterval,
        eventsPollInterval: config?.public?.eventsPollInterval ?? CONFIG_DEFAULTS.eventsPollInterval
      }
    }
  } catch {
    return { public: { ...CONFIG_DEFAULTS } }
  }
}
