import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastNotification from '../../app/components/ToastNotification.vue'

describe('ToastNotification component', () => {
  it('renders nothing when toasts array is empty', () => {
    const wrapper = mount(ToastNotification, {
      props: {
        toasts: []
      }
    })
    expect(wrapper.find('.toast-card').exists()).toBe(false)
  })

  it('renders multiple toasts with correct types, messages, and icons', () => {
    const mockToasts = [
      { id: '1', message: 'Override success', type: 'success' },
      { id: '2', message: 'Override failed', type: 'error' },
      { id: '3', message: 'System update', type: 'info' }
    ]

    const wrapper = mount(ToastNotification, {
      props: {
        toasts: mockToasts
      }
    })

    const cards = wrapper.findAll('.toast-card')
    expect(cards).toHaveLength(3)

    // Verify Success
    expect(cards[0].classes()).toContain('toast-success')
    expect(cards[0].text()).toContain('Override success')
    expect(cards[0].find('[data-testid="icon-success"]').exists()).toBe(true)

    // Verify Error
    expect(cards[1].classes()).toContain('toast-error')
    expect(cards[1].text()).toContain('Override failed')
    expect(cards[1].find('[data-testid="icon-error"]').exists()).toBe(true)

    // Verify Info
    expect(cards[2].classes()).toContain('toast-info')
    expect(cards[2].text()).toContain('System update')
    expect(cards[2].find('[data-testid="icon-info"]').exists()).toBe(true)
  })

  it('emits dismiss event with toast ID when close button is clicked', async () => {
    const mockToasts = [
      { id: 'custom-toast-id-999', message: 'Click me to close', type: 'info' }
    ]

    const wrapper = mount(ToastNotification, {
      props: {
        toasts: mockToasts
      }
    })

    const closeButton = wrapper.find('.toast-close')
    expect(closeButton.exists()).toBe(true)

    await closeButton.trigger('click')

    expect(wrapper.emitted('dismiss')).toBeTruthy()
    expect(wrapper.emitted('dismiss')?.[0]).toEqual(['custom-toast-id-999'])
  })
})
