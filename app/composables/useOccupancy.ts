import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSafeConfig } from './useSafeConfig'
import type { OccupancyStatus, CctvEvent, Toast, LightboxState } from '../types'

export function useOccupancy() {
  const config = useSafeConfig()
  
  const status = ref<OccupancyStatus>({
    is_someone_home: false,
    current_occupancy: 0,
    system_state: 'OFFLINE',
    last_updated: '',
    last_processed_frame: ''
  })

  const isOffline = computed(() => (status.value?.system_state ?? 'OFFLINE') === 'OFFLINE')

  const events = ref<CctvEvent[]>([])
  const eventsLimit = ref<number>(10)
  const toasts = ref<Toast[]>([])
  const lightbox = ref<LightboxState>({
    isOpen: false,
    imageSrc: '',
    title: '',
    subtitle: ''
  })

  const statusPollIntervalValue = config.public.statusPollInterval
  const eventsPollIntervalValue = config.public.eventsPollInterval

  let statusPollInterval: any = null
  let eventsPollInterval: any = null

  // Load current system presence metrics
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status')
      if (!response.ok) throw new Error('API server returned error code')
      const data = await response.json()
      status.value = data
    } catch (error) {
      status.value = {
        is_someone_home: false,
        current_occupancy: 0,
        system_state: 'OFFLINE',
        last_updated: status.value.last_updated || '',
        last_processed_frame: status.value.last_processed_frame || ''
      }
    }
  }

  // Load historical events
  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events?limit=${eventsLimit.value}`)
      if (!response.ok) throw new Error('API server returned error code')
      const data = await response.json()
      events.value = data
    } catch (error) {
      console.error('Failed to poll events:', error)
    }
  }

  const handleLoadMore = async () => {
    eventsLimit.value += 10
    await fetchEvents()
  }

  // Manual force reset override trigger handler
  const handleReconcile = async (payload: { is_someone_home: boolean; current_occupancy: number }) => {
    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.status === 'success') {
        addToast('Presence state manually reconciled.', 'success')
        // Instantly refresh states following override action
        await fetchStatus()
        await fetchEvents()
      } else {
        throw new Error(result.message || 'Operation failed')
      }
    } catch (error: any) {
      addToast(`Failed to reconcile state: ${error.message}`, 'error')
    }
  }

  // Toast handling utility
  const addToast = (message: string, type: string = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9)
    toasts.value.push({ id, message, type })
    
    // Auto dismiss toast after 5 seconds
    setTimeout(() => {
      dismissToast(id)
    }, 5000)
  }

  const dismissToast = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // Lightbox utility handlers
  const openLightbox = (details: { imageSrc: string; title: string; subtitle: string }) => {
    lightbox.value = {
      isOpen: true,
      imageSrc: details.imageSrc,
      title: details.title,
      subtitle: details.subtitle
    }
  }

  const closeLightbox = () => {
    lightbox.value.isOpen = false
  }

  onMounted(() => {
    fetchStatus()
    fetchEvents()
    
    // Set up polling intervals
    statusPollInterval = setInterval(fetchStatus, statusPollIntervalValue)
    eventsPollInterval = setInterval(fetchEvents, eventsPollIntervalValue)
  })

  onUnmounted(() => {
    clearInterval(statusPollInterval)
    clearInterval(eventsPollInterval)
  })

  return {
    status,
    isOffline,
    events,
    eventsLimit,
    toasts,
    lightbox,
    fetchStatus,
    fetchEvents,
    handleLoadMore,
    handleReconcile,
    addToast,
    dismissToast,
    openLightbox,
    closeLightbox
  }
}
