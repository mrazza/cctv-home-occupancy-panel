<template>
  <div class="status-card-grid">
    <!-- Occupancy Metrics Card -->
    <div class="glass-card metric-card">
      <div class="card-header">
        <h2 class="card-title">Household Status</h2>
        <div class="status-badge-container">
          <span 
            :class="['status-pill', isSomeoneHome ? 'status-occupied' : 'status-vacant']"
            data-testid="home-status-badge"
          >
            <span class="status-dot"></span>
            {{ isSomeoneHome ? 'OCCUPIED' : 'VACANT' }}
          </span>
        </div>
      </div>

      <div class="metric-display">
        <div class="metric-circle animate-pulse-glow" :class="{ 'occupied': isSomeoneHome }">
          <span class="metric-number" data-testid="occupants-count">{{ occupantsCount }}</span>
          <span class="metric-label">Occupants</span>
        </div>
      </div>

      <div class="system-meta">
        <div class="meta-row">
          <span class="meta-label">System State</span>
          <span :class="['system-state-badge', `state-${systemState.toLowerCase()}`]" data-testid="system-state-badge">
            <span v-if="systemState === 'ACTIVE'" class="pulse-dot"></span>
            {{ systemState }}
          </span>
        </div>
        <div class="meta-row" v-if="lastUpdated">
          <span class="meta-label">Last Change</span>
          <span class="meta-value">{{ formatTimestamp(lastUpdated) }}</span>
        </div>
        <div class="meta-row" v-if="lastProcessedFrame">
          <span class="meta-label">Last Frame</span>
          <span class="meta-value">{{ formatTimestamp(lastProcessedFrame) }}</span>
        </div>
      </div>
    </div>

    <!-- Live Stream Card -->
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
          class="lightbox-overlay" 
          @click.self="closeExpanded"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded Live Video Feed"
          data-testid="expanded-feed-overlay"
        >
          <button 
            class="lightbox-close" 
            @click="closeExpanded" 
            aria-label="Close Expanded Feed"
            data-testid="expanded-feed-close"
          >
            &times;
          </button>
          
          <div class="lightbox-content animate-zoom expanded-video-content">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

const isSomeoneHome = computed(() => props.status?.is_someone_home ?? false)
const occupantsCount = computed(() => props.status?.current_occupancy ?? 0)
const systemState = computed(() => props.status?.system_state ?? 'OFFLINE')
const lastUpdated = computed(() => props.status?.last_updated ?? '')
const lastProcessedFrame = computed(() => props.status?.last_processed_frame ?? '')

const showTripwire = ref(false)
const showRoi = ref(false)
const frameSrc = ref('/api/frame')
const imageError = ref(false)
const isExpanded = ref(false)

const config = useSafeConfig()
const cctvRefreshInterval = config.public.cctvRefreshInterval

let refreshInterval: any = null

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

const formatTimestamp = (isoString?: string | null) => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    return isoString
  }
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
.status-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .status-card-grid {
    grid-template-columns: 1fr 1fr;
  }
}

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

/* Metric Display styles */
.metric-display {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0 24px;
}

.metric-circle {
  width: 140px;
  height: 140px;
  border-radius: var(--radius-full);
  border: 4px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  transition: all var(--transition-normal);
}

.metric-circle.occupied {
  border-color: var(--accent-success);
  box-shadow: var(--glow-success);
}

.metric-number {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.metric-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

/* Status badge pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  border: 1px solid transparent;
}

.status-occupied {
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-success);
  border-color: rgba(16, 185, 129, 0.2);
}

.status-vacant {
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-secondary);
  border-color: rgba(148, 163, 184, 0.2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: currentColor;
}

/* System State and metadata */
.system-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 18px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.meta-label {
  color: var(--text-secondary);
}

.meta-value {
  font-family: var(--font-sans);
  color: var(--text-primary);
  font-weight: 500;
}

.system-state-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.state-offline {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-danger);
  border-color: rgba(244, 63, 94, 0.2);
}

.state-idle {
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-secondary);
  border-color: rgba(148, 163, 184, 0.2);
}

.state-active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-primary);
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--accent-primary);
  animation: pulse-active 1.5s infinite ease-in-out;
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

/* Expanded Lightbox overlay & animations */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 10, 15, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.lightbox-close {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 32px;
  line-height: 1;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  z-index: 10002;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.lightbox-content {
  position: relative;
  width: 100%;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 10001;
}

.expanded-video-content {
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

/* Animations */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-enter-active .animate-zoom {
  animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.lightbox-leave-active .animate-zoom {
  animation: zoom-out 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes zoom-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes zoom-out {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
