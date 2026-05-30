import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EventTimeline from '../../app/components/EventTimeline.vue'

describe('EventTimeline component', () => {
  it('renders empty state when events list is empty', () => {
    const wrapper = mount(EventTimeline, {
      props: {
        events: []
      }
    })

    expect(wrapper.find('[data-testid="timeline-empty-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="timeline-list"]').exists()).toBe(false)
  })

  it('renders events correctly with icons and badges', () => {
    const mockEvents = [
      {
        id: 1,
        event_type: 'ENTER',
        tracker_id: 12,
        confidence: 0.954,
        timestamp: '2026-05-30T03:12:00Z',
        snapshot_path: 'snapshots/crop_1.jpg'
      },
      {
        id: 2,
        event_type: 'LEAVE',
        tracker_id: 14,
        confidence: 0.88,
        timestamp: '2026-05-30T03:14:00Z',
        snapshot_path: null
      },
      {
        id: 3,
        event_type: 'FORCE_RESET',
        tracker_id: null,
        confidence: null,
        timestamp: '2026-05-30T03:15:00Z',
        snapshot_path: null
      }
    ]

    const wrapper = mount(EventTimeline, {
      props: {
        events: mockEvents
      }
    })

    expect(wrapper.find('[data-testid="timeline-empty-state"]').exists()).toBe(false)
    const items = wrapper.findAll('[data-testid="timeline-item"]')
    expect(items).toHaveLength(3)

    // Verify ENTER
    expect(items[0].classes()).toContain('event-enter')
    expect(items[0].text()).toContain('Occupant Entered')
    expect(items[0].text()).toContain('Tracker ID:#12')
    expect(items[0].text()).toContain('Confidence:95%')
    expect(items[0].find('[data-testid="icon-enter"]').exists()).toBe(true)
    expect(items[0].find('[data-testid="snapshot-thumbnail"]').exists()).toBe(true)

    // Verify LEAVE
    expect(items[1].classes()).toContain('event-leave')
    expect(items[1].text()).toContain('Occupant Left')
    expect(items[1].text()).toContain('Tracker ID:#14')
    expect(items[1].text()).toContain('Confidence:88%')
    expect(items[1].find('[data-testid="icon-leave"]').exists()).toBe(true)
    expect(items[1].find('[data-testid="snapshot-thumbnail"]').exists()).toBe(false)

    // Verify FORCE_RESET
    expect(items[2].classes()).toContain('event-force_reset')
    expect(items[2].text()).toContain('System State Reset')
    expect(items[2].find('[data-testid="icon-reset"]').exists()).toBe(true)
  })

  it('emits view-snapshot with metadata details when thumbnail is clicked', async () => {
    const mockEvents = [
      {
        id: 1,
        event_type: 'ENTER',
        tracker_id: 25,
        confidence: 0.99,
        timestamp: '2026-05-30T03:12:00.000Z',
        snapshot_path: 'snapshots/crop_custom.jpg'
      }
    ]

    const wrapper = mount(EventTimeline, {
      props: {
        events: mockEvents
      }
    })

    const thumb = wrapper.find('[data-testid="snapshot-thumbnail"]')
    expect(thumb.exists()).toBe(true)

    await thumb.trigger('click')

    expect(wrapper.emitted('view-snapshot')).toBeTruthy()
    const emittedData = wrapper.emitted('view-snapshot')?.[0]?.[0] as any
    expect(emittedData.imageSrc).toBe('/api/snapshot/crop_custom.jpg')
    expect(emittedData.title).toBe('Occupant Entered')
    expect(emittedData.subtitle).toContain('Confidence: 99%')
    expect(emittedData.subtitle).toContain('Tracker ID: #25')
  })

  it('handles unknown event types and invalid/missing timestamps gracefully', () => {
    const toLocaleTimeStringSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(() => {
      throw new Error('Mock time format failure')
    })

    const mockEvents = [
      {
        id: 1,
        event_type: 'CUSTOM_CROSSING',
        tracker_id: null,
        confidence: null,
        timestamp: 'invalid-date',
        snapshot_path: null
      },
      {
        id: 2,
        event_type: 'ENTER',
        tracker_id: null,
        confidence: null,
        timestamp: '',
        snapshot_path: null
      }
    ]

    const wrapper = mount(EventTimeline, {
      props: {
        events: mockEvents
      }
    })

    const items = wrapper.findAll('[data-testid="timeline-item"]')
    expect(items).toHaveLength(2)

    // Verify unknown title fallback
    expect(items[0].text()).toContain('CUSTOM_CROSSING')
    // Verify invalid date fallback
    expect(items[0].text()).toContain('invalid-date')

    // Verify empty date fallback
    expect(items[1].find('.event-time').text()).toBe('')

    // Test getSnapshotUrl falsy path directly
    expect(wrapper.vm.getSnapshotUrl('')).toBe('')
    expect(wrapper.vm.getSnapshotUrl(null)).toBe('')

    // Test triggerLightbox with missing/null fields to cover falsy branches
    const resetEvent = {
      event_type: 'FORCE_RESET',
      tracker_id: null,
      confidence: null,
      timestamp: '2026-05-30T03:12:00.000Z',
      snapshot_path: 'snapshots/reset.jpg'
    }
    wrapper.vm.triggerLightbox(resetEvent)
    expect(wrapper.emitted('view-snapshot')).toBeTruthy()

    toLocaleTimeStringSpy.mockRestore()
  })

  it('renders load-more button and handles click interaction correctly based on limit', async () => {
    const mockEvents = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      event_type: 'ENTER',
      tracker_id: i,
      confidence: 0.9,
      timestamp: '2026-05-30T03:12:00.000Z',
      snapshot_path: null
    }))

    // Case 1: events length equal to limit (10) -> Load More button should exist
    const wrapper = mount(EventTimeline, {
      props: {
        events: mockEvents,
        limit: 10
      }
    })

    const loadMoreBtn = wrapper.find('[data-testid="load-more-btn"]')
    expect(loadMoreBtn.exists()).toBe(true)

    // Trigger click on load-more button and verify event emission
    await loadMoreBtn.trigger('click')
    expect(wrapper.emitted('load-more')).toBeTruthy()

    // Case 2: events length (10) is less than limit (20) -> Load More button should not exist
    await wrapper.setProps({ limit: 20 })
    expect(wrapper.find('[data-testid="load-more-btn"]').exists()).toBe(false)
  })
})
