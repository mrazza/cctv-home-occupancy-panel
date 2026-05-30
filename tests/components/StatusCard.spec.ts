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

    toLocaleTimeStringSpy.mockRestore()
  })
})
