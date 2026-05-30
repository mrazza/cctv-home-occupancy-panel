import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockConfigState = {
  shouldThrow: false,
  panelTitle: 'CCTV OCCUPANCY PANEL',
  statusPollInterval: undefined as number | undefined,
  eventsPollInterval: undefined as number | undefined
}

import { mount } from '@vue/test-utils'
import App from '../app/app.vue'
import EventTimeline from '../app/components/EventTimeline.vue'

describe('App central layout and state coordinator', () => {
  let fetchMock: any

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
    fetchMock = vi.fn()
    global.fetch = fetchMock
    mockConfigState.shouldThrow = false
    mockConfigState.panelTitle = 'CCTV OCCUPANCY PANEL'
    mockConfigState.statusPollInterval = undefined
    mockConfigState.eventsPollInterval = undefined

    // Mock useRuntimeConfig on globalThis to bypass Nuxt's ESM mock limitations in test environment
    ;(globalThis as any).useRuntimeConfig = () => {
      if (mockConfigState.shouldThrow) {
        throw new Error('Mock runtime config error')
      }
      return {
        public: {
          panelTitle: mockConfigState.panelTitle,
          statusPollInterval: mockConfigState.statusPollInterval,
          eventsPollInterval: mockConfigState.eventsPollInterval
        }
      }
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    delete (globalThis as any).useRuntimeConfig
  })

  it('fetches status and events on mount and starts polling', async () => {
    const mockStatus = {
      is_someone_home: true,
      current_occupancy: 2,
      system_state: 'ACTIVE',
      last_updated: '2026-05-30T03:12:00Z',
      last_processed_frame: '2026-05-30T03:13:00Z'
    }

    const mockEvents = [
      {
        id: 1,
        event_type: 'ENTER',
        tracker_id: 5,
        confidence: 0.9,
        timestamp: '2026-05-30T03:12:00Z',
        snapshot_path: 'snapshots/crop_1.jpg'
      }
    ]

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatus)
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvents)
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    mockConfigState.panelTitle = undefined as any
    const wrapper = mount(App)

    // Wait for microtasks
    await vi.runOnlyPendingTimersAsync()
    await wrapper.vm.$nextTick()

    expect(fetchMock).toHaveBeenCalledWith('/api/status')
    expect(fetchMock).toHaveBeenCalledWith('/api/events?limit=10')
    expect(wrapper.find('[data-testid="app-logo-title"]').text()).toBe('CCTV OCCUPANCY PANEL')

    // Verify polling timers trigger subsequent fetches
    fetchMock.mockClear()
    
    // Advance status poll timer (3s)
    await vi.advanceTimersByTimeAsync(3000)
    expect(fetchMock).toHaveBeenCalledWith('/api/status')

    fetchMock.mockClear()
    
    // Advance events poll timer (5s)
    await vi.advanceTimersByTimeAsync(5000)
    expect(fetchMock).toHaveBeenCalledWith('/api/events?limit=10')
  })

  it('handles status and events fetch failure gracefully', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(App)

    await vi.runOnlyPendingTimersAsync()
    await wrapper.vm.$nextTick()

    // Verify status has fallback OFFLINE values on load failure
    expect(wrapper.vm.status.system_state).toBe('OFFLINE')
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('handles status and events fetch failure with non-ok response gracefully', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(App)

    await vi.runOnlyPendingTimersAsync()
    await wrapper.vm.$nextTick()

    // Verify status fallback
    expect(wrapper.vm.status.system_state).toBe('OFFLINE')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('successfully triggers manual presence reconciliation', async () => {
    fetchMock.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            is_someone_home: false,
            current_occupancy: 0,
            system_state: 'IDLE',
            last_updated: '',
            last_processed_frame: ''
          })
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      }
      if (url.includes('/api/reset') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            message: 'Presence state manually reset',
            event_id: 42
          })
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    const wrapper = mount(App)
    await vi.runOnlyPendingTimersAsync()
    await wrapper.vm.$nextTick()

    // Trigger handleReconcile
    const payload = { is_someone_home: true, current_occupancy: 2 }
    await wrapper.vm.handleReconcile(payload)

    expect(fetchMock).toHaveBeenCalledWith('/api/reset', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload)
    }))

    // Success toast should be added
    expect(wrapper.vm.toasts).toHaveLength(1)
    expect(wrapper.vm.toasts[0].message).toBe('Presence state manually reconciled.')
    expect(wrapper.vm.toasts[0].type).toBe('success')

    // Toast automatically dismissed after 5s
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.vm.toasts).toHaveLength(0)
  })

  it('handles manual presence reconciliation connection error', async () => {
    fetchMock.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      }
      if (url.includes('/api/reset')) {
        return Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error'
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    const wrapper = mount(App)
    await vi.runOnlyPendingTimersAsync()

    await wrapper.vm.handleReconcile({ is_someone_home: false, current_occupancy: 0 })

    expect(wrapper.vm.toasts).toHaveLength(1)
    expect(wrapper.vm.toasts[0].message).toContain('Failed to reconcile state')
    expect(wrapper.vm.toasts[0].type).toBe('error')
  })

  it('handles manual presence reconciliation logical error', async () => {
    fetchMock.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      }
      if (url.includes('/api/reset')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'error'
          })
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    const wrapper = mount(App)
    await vi.runOnlyPendingTimersAsync()

    await wrapper.vm.handleReconcile({ is_someone_home: false, current_occupancy: 0 })

    expect(wrapper.vm.toasts).toHaveLength(1)
    expect(wrapper.vm.toasts[0].message).toContain('Operation failed')
    expect(wrapper.vm.toasts[0].type).toBe('error')
  })

  it('coordinates toast dismissal and snapshot lightboxes', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    const wrapper = mount(App)
    await vi.runOnlyPendingTimersAsync()

    // Test Toast Dismiss
    wrapper.vm.addToast('Click to close', 'info')
    expect(wrapper.vm.toasts).toHaveLength(1)
    const toastId = wrapper.vm.toasts[0].id

    wrapper.vm.dismissToast(toastId)
    expect(wrapper.vm.toasts).toHaveLength(0)

    // Test Lightbox coordination
    expect(wrapper.vm.lightbox.isOpen).toBe(false)
    
    const details = {
      imageSrc: '/api/snapshot/1.jpg',
      title: 'Occupant Crossing',
      subtitle: '2026-05-30'
    }

    wrapper.vm.openLightbox(details)
    expect(wrapper.vm.lightbox.isOpen).toBe(true)
    expect(wrapper.vm.lightbox.imageSrc).toBe('/api/snapshot/1.jpg')

    wrapper.vm.closeLightbox()
    expect(wrapper.vm.lightbox.isOpen).toBe(false)
  })

  it('clears pollers on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    const wrapper = mount(App)
    wrapper.unmount()

    expect(clearIntervalSpy).toHaveBeenCalledTimes(3)
  })

  it('renders custom panel title from runtimeConfig when available', () => {
    mockConfigState.panelTitle = 'MY CUSTOM DASHBOARD'
    mockConfigState.shouldThrow = false

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="app-logo-title"]').text()).toBe('MY CUSTOM DASHBOARD')
  })

  it('triggers catch fallback when useRuntimeConfig throws inside app.vue', () => {
    delete (globalThis as any).useRuntimeConfig

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="app-logo-title"]').text()).toBe('CCTV OCCUPANCY PANEL')
  })

  it('updates the header status text and indicator based on system state', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            is_someone_home: true,
            current_occupancy: 1,
            system_state: 'ACTIVE',
            last_updated: '2026-05-30T03:12:00Z',
            last_processed_frame: '2026-05-30T03:13:00Z'
          })
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    const wrapper = mount(App)
    await vi.runOnlyPendingTimersAsync()
    await wrapper.vm.$nextTick()

    // Assert active/connected state
    const indicator = wrapper.find('[data-testid="header-pulse-indicator"]')
    const textSpan = wrapper.find('[data-testid="header-status-text"]')
    expect(textSpan.text()).toBe('SYSTEM CONNECTED')
    expect(indicator.classes()).toContain('indicator-online')
    expect(indicator.classes()).not.toContain('indicator-offline')
    expect(textSpan.classes()).not.toContain('status-offline')

    // Now mock system state changing to OFFLINE
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            is_someone_home: false,
            current_occupancy: 0,
            system_state: 'OFFLINE',
            last_updated: '2026-05-30T03:12:00Z',
            last_processed_frame: '2026-05-30T03:13:00Z'
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    // Advance status poll timer (3s) to trigger fetchStatus
    await vi.advanceTimersByTimeAsync(3000)
    await wrapper.vm.$nextTick()

    expect(textSpan.text()).toBe('SYSTEM OFFLINE')
    expect(indicator.classes()).toContain('indicator-offline')
    expect(indicator.classes()).not.toContain('indicator-online')
    expect(textSpan.classes()).toContain('status-offline')
  })

  it('increments eventsLimit and triggers fetchEvents on load-more event from EventTimeline', async () => {
    const mockEvents = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      event_type: 'ENTER',
      tracker_id: i,
      confidence: 0.9,
      timestamp: '2026-05-30T03:12:00.000Z',
      snapshot_path: null
    }))

    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvents)
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    const wrapper = mount(App)
    await vi.runOnlyPendingTimersAsync()
    await wrapper.vm.$nextTick()

    // Verify initial limit is 10
    expect(wrapper.vm.eventsLimit).toBe(10)
    expect(fetchMock).toHaveBeenCalledWith('/api/events?limit=10')

    // Find the EventTimeline component and trigger its load-more event emitter
    const timeline = wrapper.findComponent(EventTimeline)
    await timeline.vm.$emit('load-more')
    await wrapper.vm.$nextTick()

    // Verify limit increments and calls fetch with limit 20
    expect(wrapper.vm.eventsLimit).toBe(20)
    expect(fetchMock).toHaveBeenCalledWith('/api/events?limit=20')
  })

  it('respects custom poll intervals configured via runtimeConfig', async () => {
    mockConfigState.statusPollInterval = 6000
    mockConfigState.eventsPollInterval = 8000

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    const wrapper = mount(App)
    await vi.runOnlyPendingTimersAsync()
    await wrapper.vm.$nextTick()

    expect(fetchMock).toHaveBeenCalledWith('/api/status')
    expect(fetchMock).toHaveBeenCalledWith('/api/events?limit=10')

    fetchMock.mockClear()

    // Fast-forward 3 seconds (original default status interval). Should not trigger.
    await vi.advanceTimersByTimeAsync(3000)
    expect(fetchMock).not.toHaveBeenCalled()

    // Fast-forward another 3 seconds (reaches 6000ms for status poll)
    await vi.advanceTimersByTimeAsync(3000)
    expect(fetchMock).toHaveBeenCalledWith('/api/status')
    expect(fetchMock).not.toHaveBeenCalledWith('/api/events?limit=10')

    fetchMock.mockClear()

    // Fast-forward another 2 seconds (reaches 8000ms since start for events poll)
    await vi.advanceTimersByTimeAsync(2000)
    expect(fetchMock).toHaveBeenCalledWith('/api/events?limit=10')
  })
})
