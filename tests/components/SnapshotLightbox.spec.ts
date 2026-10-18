import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SnapshotLightbox from '../../app/components/SnapshotLightbox.vue'

describe('SnapshotLightbox component', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders nothing when isOpen is false', () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: false,
        imageSrc: '/api/snapshot/test.jpg'
      }
    })
    
    expect(document.body.querySelector('.overlay-backdrop')).toBeNull()
  })

  it('renders nothing when imageSrc is empty', () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: true,
        imageSrc: ''
      }
    })
    
    expect(document.body.querySelector('.overlay-backdrop')).toBeNull()
  })

  it('renders inside Teleport when open with correct properties', () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: true,
        imageSrc: '/api/snapshot/test.jpg',
        title: 'Occupant Crossing',
        subtitle: '2026-05-30 | Confidence: 95%'
      }
    })

    const overlay = document.body.querySelector('.overlay-backdrop')
    expect(overlay).not.toBeNull()

    const img = overlay?.querySelector('.lightbox-image') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.src).toContain('/api/snapshot/test.jpg')

    const titleEl = overlay?.querySelector('.lightbox-title')
    expect(titleEl?.textContent).toBe('Occupant Crossing')

    const subtitleEl = overlay?.querySelector('.lightbox-subtitle')
    expect(subtitleEl?.textContent).toBe('2026-05-30 | Confidence: 95%')
  })

  it('renders default title when none is specified', () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: true,
        imageSrc: '/api/snapshot/test.jpg'
      }
    })

    const overlay = document.body.querySelector('.overlay-backdrop')
    const titleEl = overlay?.querySelector('.lightbox-title')
    expect(titleEl?.textContent).toBe('Snapshot Details')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: true,
        imageSrc: '/api/snapshot/test.jpg'
      }
    })

    const closeBtn = document.body.querySelector('.overlay-close-btn') as HTMLButtonElement
    expect(closeBtn).not.toBeNull()

    // Dispatch click event on the native element because it's teleported outside wrapper root
    closeBtn.click()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when backdrop is clicked', async () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: true,
        imageSrc: '/api/snapshot/test.jpg'
      }
    })

    const overlay = document.body.querySelector('.overlay-backdrop') as HTMLDivElement
    expect(overlay).not.toBeNull()

    // Trigger click on backdrop
    const event = new MouseEvent('click', { bubbles: true })
    overlay.dispatchEvent(event)

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('renders video tab and switches between snapshot and video when videoSrc is provided', async () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: true,
        imageSrc: '/api/snapshot/test.jpg',
        videoSrc: '/api/clip/test.mp4',
        title: 'Occupant Crossing',
        subtitle: '2026-05-30 | Confidence: 95%'
      }
    })

    const overlay = document.body.querySelector('.overlay-backdrop')
    expect(overlay).not.toBeNull()

    // Tabs should be visible
    const tabsBar = overlay?.querySelector('[data-testid="lightbox-media-tabs"]')
    expect(tabsBar).not.toBeNull()

    const videoTab = overlay?.querySelector('[data-testid="tab-video"]') as HTMLButtonElement
    expect(videoTab).not.toBeNull()

    // Initially on snapshot tab
    expect(overlay?.querySelector('.lightbox-image')).not.toBeNull()
    expect(overlay?.querySelector('.lightbox-video')).toBeNull()

    // Switch to video tab
    videoTab.click()
    await wrapper.vm.$nextTick()

    const videoEl = overlay?.querySelector('[data-testid="lightbox-video"]') as HTMLVideoElement
    expect(videoEl).not.toBeNull()
    expect(videoEl.src).toContain('/api/clip/test.mp4')
  })

  it('falls back to snapshot tab if video encounters an error', async () => {
    const wrapper = mount(SnapshotLightbox, {
      props: {
        isOpen: true,
        imageSrc: '/api/snapshot/test.jpg',
        videoSrc: '/api/clip/missing.mp4'
      }
    })

    const overlay = document.body.querySelector('.overlay-backdrop')
    const videoTab = overlay?.querySelector('[data-testid="tab-video"]') as HTMLButtonElement
    videoTab.click()
    await wrapper.vm.$nextTick()

    // Trigger video error
    wrapper.vm.handleVideoError()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.activeTab).toBe('snapshot')
    expect(wrapper.vm.videoError).toBe(true)
  })
})
