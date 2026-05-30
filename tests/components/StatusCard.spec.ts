import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusCard from '../../app/components/StatusCard.vue'

describe('StatusCard component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders correct home status metrics (occupied)', () => {
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: true,
          current_occupancy: 3,
          system_state: 'ACTIVE',
          last_updated: '2026-05-30T03:12:44Z',
          last_processed_frame: '2026-05-30T03:13:00Z'
        }
      }
    })

    const statusBadge = wrapper.find('[data-testid="home-status-badge"]')
    expect(statusBadge.text()).toContain('OCCUPIED')
    expect(statusBadge.classes()).toContain('status-occupied')

    const countDisplay = wrapper.find('[data-testid="occupants-count"]')
    expect(countDisplay.text()).toBe('3')

    const systemStateBadge = wrapper.find('[data-testid="system-state-badge"]')
    expect(systemStateBadge.text()).toContain('ACTIVE')
    expect(systemStateBadge.classes()).toContain('state-active')
  })

  it('renders correct home status metrics (vacant & offline)', () => {
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'OFFLINE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    const statusBadge = wrapper.find('[data-testid="home-status-badge"]')
    expect(statusBadge.text()).toContain('VACANT')
    expect(statusBadge.classes()).toContain('status-vacant')

    const countDisplay = wrapper.find('[data-testid="occupants-count"]')
    expect(countDisplay.text()).toBe('0')

    const systemStateBadge = wrapper.find('[data-testid="system-state-badge"]')
    expect(systemStateBadge.text()).toContain('OFFLINE')
    expect(systemStateBadge.classes()).toContain('state-offline')
  })

  it('polls the live video frame periodically', async () => {
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    const img = wrapper.find('[data-testid="live-feed-img"]') as any
    
    // Allow initial onMounted updateFrameSrc to execute and bind to the DOM
    await wrapper.vm.$nextTick()
    const initialSrc = img.element.src
    expect(initialSrc).toContain('t=')

    // Fast-forward 2 seconds
    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()

    const updatedSrc = img.element.src
    expect(updatedSrc).not.toBe(initialSrc)
    expect(updatedSrc).toContain('t=')
  })

  it('polls the live video frame periodically with a configured custom refresh interval', async () => {
    // Mock custom refresh interval (e.g. 5000ms)
    ;(globalThis as any).useRuntimeConfig = () => ({
      public: {
        cctvRefreshInterval: 5000
      }
    })

    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    const img = wrapper.find('[data-testid="live-feed-img"]') as any
    await wrapper.vm.$nextTick()
    const initialSrc = img.element.src

    // Fast-forward 2 seconds (original default interval, shouldn't trigger reload)
    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()
    expect(img.element.src).toBe(initialSrc)

    // Fast-forward another 3 seconds (reaching 5000ms custom interval)
    vi.advanceTimersByTime(3000)
    await wrapper.vm.$nextTick()
    expect(img.element.src).not.toBe(initialSrc)

    // Cleanup mock
    delete (globalThis as any).useRuntimeConfig
  })

  it('adjusts feed query parameters when tripwire or ROI is toggled', async () => {
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    const tripwireLabel = wrapper.find('[data-testid="tripwire-toggle-label"]')
    const tripwireCheckbox = tripwireLabel.find('input[type="checkbox"]')
    
    // Toggle tripwire check
    await tripwireCheckbox.setValue(true)

    const img = wrapper.find('[data-testid="live-feed-img"]') as any
    expect(img.element.src).toContain('draw_tripwire=true')

    const roiLabel = wrapper.find('[data-testid="roi-toggle-label"]')
    const roiCheckbox = roiLabel.find('input[type="checkbox"]')

    // Toggle ROI check
    await roiCheckbox.setValue(true)
    expect(img.element.src).toContain('draw_tripwire=true')
    expect(img.element.src).toContain('draw_roi=true')
  })

  it('shows error overlay when camera stream fails to load', async () => {
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    expect(wrapper.find('[data-testid="stream-error-overlay"]').exists()).toBe(false)

    const img = wrapper.find('[data-testid="live-feed-img"]')
    await img.trigger('error')

    expect(wrapper.find('[data-testid="stream-error-overlay"]').exists()).toBe(true)

    // Trigger image load again to verify recovery
    await img.trigger('load')
    expect(wrapper.find('[data-testid="stream-error-overlay"]').exists()).toBe(false)
  })

  it('immediately triggers feed reload when status updates while error was present', async () => {
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'OFFLINE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    const img = wrapper.find('[data-testid="live-feed-img"]') as any
    await wrapper.vm.$nextTick()
    await img.trigger('error')
    expect(wrapper.find('[data-testid="stream-error-overlay"]').exists()).toBe(true)

    const oldSrc = img.element.src

    // Advance clock so that Date.now() returns a different value
    vi.advanceTimersByTime(500)

    // Update status to verify watcher
    await wrapper.setProps({
      status: {
        is_someone_home: true,
        current_occupancy: 1,
        system_state: 'ACTIVE',
        last_updated: '2026-05-30T03:12:44Z',
        last_processed_frame: ''
      }
    })
    await wrapper.vm.$nextTick()

    expect(img.element.src).not.toBe(oldSrc)
  })

  it('clears interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    wrapper.unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('renders original string when formatTimestamp encounters an invalid date', () => {
    const toLocaleTimeStringSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(() => {
      throw new Error('Mock time format failure')
    })

    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: 'malformed-date-string-123',
          last_processed_frame: 'malformed-date-string-456'
        }
      }
    })

    const text = wrapper.text()
    expect(text).toContain('malformed-date-string-123')
    expect(text).toContain('malformed-date-string-456')

    // Test falsy paths directly
    expect(wrapper.vm.formatTimestamp('')).toBe('')
    expect(wrapper.vm.formatTimestamp(null)).toBe('')
    expect(wrapper.vm.formatTimestamp(undefined)).toBe('')

    toLocaleTimeStringSpy.mockRestore()
  })

  it('opens, interacts, and closes the expanded video feed overlay', async () => {
    document.body.innerHTML = ''

    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    // Initially overlay does not exist in body
    expect(document.body.querySelector('[data-testid="expanded-feed-overlay"]')).toBeNull()

    // Click container to expand
    const container = wrapper.find('[data-testid="live-feed-container"]')
    await container.trigger('click')

    // Now overlay exists in body
    const overlay = document.body.querySelector('[data-testid="expanded-feed-overlay"]') as HTMLDivElement
    expect(overlay).not.toBeNull()

    // Assert "LIVE" blinks and is active
    expect(overlay.querySelector('.expanded-video-title')?.textContent).toContain('LIVE VIDEO FEED')

    // Find Tripwire toggle inside the overlay and set to checked
    const tripwireCheckbox = overlay.querySelector('[data-testid="expanded-tripwire-toggle-label"] input[type="checkbox"]') as HTMLInputElement
    tripwireCheckbox.click()
    await wrapper.vm.$nextTick()

    // Find ROI toggle inside the overlay and set to checked
    const roiCheckbox = overlay.querySelector('[data-testid="expanded-roi-toggle-label"] input[type="checkbox"]') as HTMLInputElement
    roiCheckbox.click()
    await wrapper.vm.$nextTick()

    // Check expanded image src has both tripwire and roi query params
    const expandedImg = overlay.querySelector('[data-testid="expanded-feed-img"]') as HTMLImageElement
    expect(expandedImg.src).toContain('draw_tripwire=true')
    expect(expandedImg.src).toContain('draw_roi=true')

    // Trigger image error inside expanded overlay
    expect(overlay.querySelector('[data-testid="expanded-stream-error-overlay"]')).toBeNull()
    
    // Create and dispatch an error event on expanded image
    const errorEvent = new Event('error')
    expandedImg.dispatchEvent(errorEvent)
    await wrapper.vm.$nextTick()
    expect(overlay.querySelector('[data-testid="expanded-stream-error-overlay"]')).not.toBeNull()

    // Image load clears error
    const loadEvent = new Event('load')
    expandedImg.dispatchEvent(loadEvent)
    await wrapper.vm.$nextTick()
    expect(overlay.querySelector('[data-testid="expanded-stream-error-overlay"]')).toBeNull()

    // Close using click-outside on backdrop
    const clickOutsideEvent = new MouseEvent('click', { bubbles: true })
    overlay.dispatchEvent(clickOutsideEvent)
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('[data-testid="expanded-feed-overlay"]')).toBeNull()
  })

  it('closes expanded overlay on ESC keypress and close button click', async () => {
    document.body.innerHTML = ''

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(StatusCard, {
      props: {
        status: {
          is_someone_home: false,
          current_occupancy: 0,
          system_state: 'IDLE',
          last_updated: '',
          last_processed_frame: ''
        }
      }
    })

    // Click container to open
    const container = wrapper.find('[data-testid="live-feed-container"]')
    await container.trigger('click')

    expect(document.body.querySelector('[data-testid="expanded-feed-overlay"]')).not.toBeNull()

    // Close via Close button click
    const closeBtn = document.body.querySelector('[data-testid="expanded-feed-close"]') as HTMLButtonElement
    closeBtn.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[data-testid="expanded-feed-overlay"]')).toBeNull()

    // Reopen and close via ESC keydown event
    await container.trigger('click')
    expect(document.body.querySelector('[data-testid="expanded-feed-overlay"]')).not.toBeNull()

    // Dispatch a non-Escape keydown first to test uncovered branch
    const otherEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    window.dispatchEvent(otherEvent)
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[data-testid="expanded-feed-overlay"]')).not.toBeNull()

    // Dispatch Escape keydown
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(escapeEvent)
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('[data-testid="expanded-feed-overlay"]')).toBeNull()

    // Unmount and verify clean up
    wrapper.unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
