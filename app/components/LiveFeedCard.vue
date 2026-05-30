<template>
  <div class="glass-card stream-card">
    <div class="card-header">
      <h2 class="card-title">Live Video Feed</h2>
      <div class="stream-controls">
        <label class="toggle-control" data-testid="tripwire-toggle-label">
          <input type="checkbox" v-model="showTripwire" @change="refreshFrame" />
          <span class="toggle-slider"></span>
          <span class="toggle-label">Tripwire</span>
        </label>
        <label class="toggle-control" data-testid="roi-toggle-label">
          <input type="checkbox" v-model="showRoi" @change="refreshFrame" />
          <span class="toggle-slider"></span>
          <span class="toggle-label">ROI</span>
        </label>
      </div>
    </div>

    <div class="video-container" @click="openExpanded" data-testid="live-feed-container">
      <img 
        :src="frameSrc" 
        alt="CCTV Live Stream Feed" 
        class="video-feed" 
        @error="handleImageError"
        @load="handleImageLoad"
        data-testid="live-feed-img"
      />
      <div v-if="imageError" class="video-error-overlay" data-testid="stream-error-overlay">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p>Camera Stream Offline</p>
      </div>
      <div class="video-expand-hover-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="expand-icon-hint">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        <span>Expand Feed</span>
      </div>
      <div class="video-overlay-badge">
        <span class="live-dot"></span>
        LIVE
      </div>
    </div>
  </div>

  <!-- Teleport Expanded Live Feed Overlay -->
  <Teleport to="body">
    <Transition name="lightbox">
      <div 
        v-if="isExpanded" 
        class="overlay-backdrop" 
        @click.self="closeExpanded"
        role="dialog"
        aria-modal="true"
        aria-label="Expanded Live Video Feed"
        data-testid="expanded-feed-overlay"
      >
        <button 
          class="overlay-close-btn" 
          @click="closeExpanded" 
          aria-label="Close Expanded Feed"
          data-testid="expanded-feed-close"
        >
          &times;
        </button>
        
        <div class="overlay-content animate-zoom expanded-video-content">
          <div class="expanded-video-header">
            <h3 class="expanded-video-title">
              <span class="live-dot-pulse"></span>
              LIVE VIDEO FEED
            </h3>
            <div class="stream-controls in-overlay">
              <label class="toggle-control" data-testid="expanded-tripwire-toggle-label">
                <input type="checkbox" v-model="showTripwire" @change="refreshFrame" />
                <span class="toggle-slider"></span>
                <span class="toggle-label">Tripwire</span>
              </label>
              <label class="toggle-control" data-testid="expanded-roi-toggle-label">
                <input type="checkbox" v-model="showRoi" @change="refreshFrame" />
                <span class="toggle-slider"></span>
                <span class="toggle-label">ROI</span>
              </label>
            </div>
          </div>

          <div class="expanded-image-container">
            <img 
              :src="frameSrc" 
              alt="CCTV Live Stream Feed (Expanded)" 
              class="expanded-video-feed"
              @error="handleImageError"
              @load="handleImageLoad"
              data-testid="expanded-feed-img"
            />
            <div v-if="imageError" class="video-error-overlay expanded" data-testid="expanded-stream-error-overlay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon big">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p>Camera Stream Offline</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSafeConfig } from '../composables/useSafeConfig'
import type { OccupancyStatus } from '../types'

const props = withDefaults(
  defineProps<{
    status: OccupancyStatus
  }>(),
  {
    status: () => ({
      is_someone_home: false,
      current_occupancy: 0,
      system_state: 'OFFLINE',
      last_updated: '',
      last_processed_frame: ''
    })
  }
)

const showTripwire = ref(false)
const showRoi = ref(false)
const frameSrc = ref('/api/frame')
const imageError = ref(false)
const isExpanded = ref(false)

const config = useSafeConfig()
const cctvRefreshInterval = config.public.cctvRefreshInterval

let refreshInterval: ReturnType<typeof setInterval> | null = null

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isExpanded.value) {
    closeExpanded()
  }
}

const openExpanded = () => {
  isExpanded.value = true
  window.addEventListener('keydown', handleKeyDown)
}

const closeExpanded = () => {
  isExpanded.value = false
  window.removeEventListener('keydown', handleKeyDown)
}

const updateFrameSrc = () => {
  const timestamp = Date.now()
  const tripwireParam = showTripwire.value ? '&draw_tripwire=true' : ''
  const roiParam = showRoi.value ? '&draw_roi=true' : ''
  frameSrc.value = `/api/frame?t=${timestamp}${tripwireParam}${roiParam}`
}

const refreshFrame = () => {
  imageError.value = false
  updateFrameSrc()
}

const handleImageError = () => {
  imageError.value = true
}

const handleImageLoad = () => {
  imageError.value = false
}

onMounted(() => {
  updateFrameSrc()
  // Poll live video frame every configured interval
  refreshInterval = setInterval(updateFrameSrc, cctvRefreshInterval)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
  window.removeEventListener('keydown', handleKeyDown)
})

watch(() => props.status, () => {
  // If status updates, trigger an immediate frame reload check
  if (imageError.value) {
    refreshFrame()
  }
}, { deep: true })
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

/* Video Feed card styles */
.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #000;
  border: 1px solid var(--border-color);
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.8);
  cursor: pointer;
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
}

.video-container:hover {
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: var(--shadow-md), inset 0 2px 10px rgba(0,0,0,0.8);
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity var(--transition-fast);
}

.video-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 15, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.error-icon {
  width: 48px;
  height: 48px;
  color: var(--accent-danger);
}

.video-overlay-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(10, 10, 15, 0.75);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border: 1px solid var(--border-glass);
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--accent-danger);
  box-shadow: var(--glow-danger);
  animation: pulse-active 1.2s infinite ease-in-out;
}

/* Video Control toggles */
.stream-controls {
  display: flex;
  gap: 16px;
}

.toggle-control {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.toggle-control input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  transition: var(--transition-fast);
  border: 1px solid var(--border-color);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-primary);
  border-radius: 50%;
  transition: var(--transition-fast);
}

.toggle-control input:checked + .toggle-slider {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}

.toggle-control input:checked + .toggle-slider:before {
  transform: translateX(14px);
}

/* Expand hint styling */
.video-expand-hover-hint {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 15, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity var(--transition-normal);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.video-container:hover .video-expand-hover-hint {
  opacity: 1;
}

.expand-icon-hint {
  width: 24px;
  height: 24px;
  transition: transform var(--transition-normal);
}

.video-container:hover .expand-icon-hint {
  transform: scale(1.1);
}

/* Component-specific expanded overlay styles */
.expanded-video-content {
  width: 100%;
  background: rgba(22, 22, 38, 0.8);
  border: 1px solid var(--border-glass);
  padding: 20px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg), 0 0 50px rgba(99, 102, 241, 0.1);
}

.expanded-video-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.expanded-video-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.live-dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background-color: var(--accent-danger);
  box-shadow: var(--glow-danger);
  animation: pulse-active 1.2s infinite ease-in-out;
}

.expanded-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  max-height: 70vh;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #000;
  border: 1px solid var(--border-color);
}

.expanded-video-feed {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-error-overlay.expanded {
  background: rgba(10, 10, 15, 0.95);
}

.error-icon.big {
  width: 64px;
  height: 64px;
}

.stream-controls.in-overlay {
  background: rgba(255, 255, 255, 0.02);
  padding: 6px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
}
</style>
