import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ResetForm from '../../app/components/ResetForm.vue'

describe('ResetForm component', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders correctly with default collapsed form', () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: true,
        initialOccupantCount: 2
      }
    })

    expect(wrapper.find('[data-testid="form-content-container"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-testid="counter-display"]').text()).toBe('2')
    expect(wrapper.find('[data-testid="presence-home-btn"]').classes()).toContain('active-home')
  })

  it('collapses and expands form when header is clicked', async () => {
    const wrapper = mount(ResetForm)

    const header = wrapper.find('[data-testid="collapse-toggle-btn"]')
    
    // Expand
    await header.trigger('click')
    expect(wrapper.vm.isExpanded).toBe(true)

    // Collapse
    await header.trigger('click')
    expect(wrapper.vm.isExpanded).toBe(false)
  })

  it('changes presence state when buttons are clicked', async () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: true,
        initialOccupantCount: 3
      }
    })

    // Click Vacant
    await wrapper.find('[data-testid="presence-away-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="presence-away-btn"]').classes()).toContain('active-away')
    expect(wrapper.find('[data-testid="presence-home-btn"]').classes()).not.toContain('active-home')
    expect(wrapper.find('[data-testid="counter-display"]').text()).toBe('0') // Resets occupant count

    // Click Home
    await wrapper.find('[data-testid="presence-home-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="presence-home-btn"]').classes()).toContain('active-home')
  })

  it('supports incrementing and decrementing occupants count', async () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: true,
        initialOccupantCount: 1
      }
    })

    // Increment
    await wrapper.find('[data-testid="counter-inc-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="counter-display"]').text()).toBe('2')

    // Decrement
    await wrapper.find('[data-testid="counter-dec-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="counter-display"]').text()).toBe('1')

    // Decrement again
    await wrapper.find('[data-testid="counter-dec-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="counter-display"]').text()).toBe('0')

    // Decrementing at 0 should be disabled/blocked
    const decBtn = wrapper.find('[data-testid="counter-dec-btn"]')
    expect(decBtn.attributes()).toHaveProperty('disabled')
  })

  it('disables counter buttons when vacant is active', async () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: false,
        initialOccupantCount: 0
      }
    })

    expect(wrapper.find('.form-group:nth-child(2)').classes()).toContain('disabled-field')
    expect(wrapper.find('[data-testid="counter-inc-btn"]').attributes()).toHaveProperty('disabled')
    expect(wrapper.find('[data-testid="counter-dec-btn"]').attributes()).toHaveProperty('disabled')
  })

  it('shows and hides confirmation modal dialog correctly', async () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: true,
        initialOccupantCount: 2
      }
    })

    expect(document.body.querySelector('[data-testid="confirmation-modal"]')).toBeNull()

    // Trigger Reconcile
    await wrapper.find('[data-testid="open-reconcile-modal-btn"]').trigger('click')

    const modal = document.body.querySelector('[data-testid="confirmation-modal"]')
    expect(modal).not.toBeNull()

    // Cancel modal
    const cancelBtn = modal?.querySelector('[data-testid="modal-cancel-btn"]') as HTMLButtonElement
    cancelBtn.click()
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('[data-testid="confirmation-modal"]')).toBeNull()
  })

  it('emits submit event when state override is confirmed inside modal', async () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: true,
        initialOccupantCount: 3
      }
    })

    await wrapper.find('[data-testid="open-reconcile-modal-btn"]').trigger('click')

    const modal = document.body.querySelector('[data-testid="confirmation-modal"]')
    const confirmBtn = modal?.querySelector('[data-testid="modal-confirm-btn"]') as HTMLButtonElement
    
    confirmBtn.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      is_someone_home: true,
      current_occupancy: 3
    }])
    expect(document.body.querySelector('[data-testid="confirmation-modal"]')).toBeNull()
  })

  it('closes modal when close "X" is clicked', async () => {
    const wrapper = mount(ResetForm)

    await wrapper.find('[data-testid="open-reconcile-modal-btn"]').trigger('click')

    const modal = document.body.querySelector('[data-testid="confirmation-modal"]')
    const closeX = modal?.querySelector('[data-testid="modal-close-x"]') as HTMLButtonElement
    closeX.click()
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('[data-testid="confirmation-modal"]')).toBeNull()
  })

  it('updates form values when initial prop values change', async () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: false,
        initialOccupantCount: 0
      }
    })

    await wrapper.setProps({
      initialIsHome: true,
      initialOccupantCount: 5
    })

    expect(wrapper.find('[data-testid="presence-home-btn"]').classes()).toContain('active-home')
    expect(wrapper.find('[data-testid="counter-display"]').text()).toBe('5')
  })

  it('closes modal when backdrop is clicked', async () => {
    const wrapper = mount(ResetForm)

    await wrapper.find('[data-testid="open-reconcile-modal-btn"]').trigger('click')

    const modal = document.body.querySelector('[data-testid="confirmation-modal"]') as HTMLDivElement
    expect(modal).not.toBeNull()

    // Trigger click on backdrop
    const event = new MouseEvent('click', { bubbles: true })
    modal.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('[data-testid="confirmation-modal"]')).toBeNull()
  })

  it('ignores increment and decrement calls under incorrect states', () => {
    const wrapper = mount(ResetForm, {
      props: {
        initialIsHome: false,
        initialOccupantCount: 0
      }
    })

    // Try to increment when vacant
    wrapper.vm.increment()
    expect(wrapper.vm.occupantCount).toBe(0)

    // Try to decrement when vacant
    wrapper.vm.decrement()
    expect(wrapper.vm.occupantCount).toBe(0)

    // Change to home but count = 0, then try to decrement
    wrapper.vm.isHome = true
    wrapper.vm.decrement()
    expect(wrapper.vm.occupantCount).toBe(0)
  })
})
