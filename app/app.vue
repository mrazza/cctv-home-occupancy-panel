<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="app-header">
      <div class="header-container">
        <div class="logo-area">
          <div class="logo-scanner"></div>
          <h1 class="logo-title" data-testid="app-logo-title">{{ panelTitle }}</h1>
        </div>
        <div class="header-meta">
          <span 
            :class="['pulse-indicator', isOffline ? 'indicator-offline' : 'indicator-online']"
            data-testid="header-pulse-indicator"
          ></span>
          <span 
            :class="['meta-status-text', { 'status-offline': isOffline }]"
            data-testid="header-status-text"
          >
            {{ isOffline ? 'SYSTEM OFFLINE' : 'SYSTEM CONNECTED' }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content Grid -->
    <main class="app-main">
      <div class="dashboard-grid">
        <!-- Left Side: Status Metrics and Live Video Feed -->
        <div class="dashboard-left">
          <StatusCard :status="status" />
        </div>

        <!-- Right Side: Reset Override Form and Activity Timeline -->
        <div class="dashboard-right">
          <div class="right-column-layout">
            <ResetForm 
              :initial-is-home="status.is_someone_home"
              :initial-occupant-count="status.current_occupancy"
              @submit="handleReconcile"
            />
            <EventTimeline 
              :events="events"
              :limit="eventsLimit"
              @view-snapshot="openLightbox"
              @load-more="handleLoadMore"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Global Toast Notifications Overlay -->
    <ToastNotification 
      :toasts="toasts" 
      @dismiss="dismissToast"
    />

    <!-- Global Snapshot Inspection Lightbox Overlay -->
    <SnapshotLightbox 
      :is-open="lightbox.isOpen"
      :image-src="lightbox.imageSrc"
      :title="lightbox.title"
      :subtitle="lightbox.subtitle"
      @close="closeLightbox"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

let panelTitle = 'CCTV OCCUPANCY PANEL'
try {
  const config = globalThis.useRuntimeConfig
    ? globalThis.useRuntimeConfig()
    : useRuntimeConfig()
  panelTitle = config.public?.panelTitle || panelTitle
} catch (e) {
  // Standalone unit tests fallback
}

const status = ref({
  is_someone_home: false,
  current_occupancy: 0,
  system_state: 'OFFLINE',
  last_updated: '',
  last_processed_frame: ''
})

const isOffline = computed(() => (status.value?.system_state ?? 'OFFLINE') === 'OFFLINE')

const events = ref([])
const eventsLimit = ref(10)
const toasts = ref([])
const lightbox = ref({
  isOpen: false,
  imageSrc: '',
  title: '',
  subtitle: ''
})

let statusPollIntervalValue = 3000
let eventsPollIntervalValue = 5000
try {
  const config = globalThis.useRuntimeConfig
    ? globalThis.useRuntimeConfig()
    : useRuntimeConfig()
  statusPollIntervalValue = config.public?.statusPollInterval ?? statusPollIntervalValue
  eventsPollIntervalValue = config.public?.eventsPollInterval ?? eventsPollIntervalValue
} catch (e) {
  // Standalone unit tests fallback
}

let statusPollInterval = null
let eventsPollInterval = null

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
const handleReconcile = async (payload) => {
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
  } catch (error) {
    addToast(`Failed to reconcile state: ${error.message}`, 'error')
  }
}

// Toast handling utility
const addToast = (message, type = 'info') => {
  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  toasts.value.push({ id, message, type })
  
  // Auto dismiss toast after 5 seconds
  setTimeout(() => {
    dismissToast(id)
  }, 5000)
}

const dismissToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Lightbox utility handlers
const openLightbox = (details) => {
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
  
  // Set up polling intervals: status every statusPollIntervalValue ms, events every eventsPollIntervalValue ms
  statusPollInterval = setInterval(fetchStatus, statusPollIntervalValue)
  eventsPollInterval = setInterval(fetchEvents, eventsPollIntervalValue)
})

onUnmounted(() => {
  clearInterval(statusPollInterval)
  clearInterval(eventsPollInterval)
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header style tokens */
.app-header {
  border-bottom: 1px solid var(--border-color);
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 16px 24px;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-scanner {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-info));
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  position: relative;
  overflow: hidden;
}

.logo-scanner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #fff;
  box-shadow: 0 0 8px #fff;
  animation: pulse-active 1.5s infinite ease-in-out;
}

.logo-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.05em;
  background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  animation: pulse-active 2s infinite ease-in-out;
  transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
}

.pulse-indicator.indicator-online {
  background-color: var(--accent-success);
  box-shadow: var(--glow-success);
}

.pulse-indicator.indicator-offline {
  background-color: var(--accent-danger);
  box-shadow: var(--glow-danger);
}

.meta-status-text {
  transition: color var(--transition-normal);
}

.meta-status-text.status-offline {
  color: var(--accent-danger);
}

/* Dashboard spacing setup */
.app-main {
  flex-grow: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
}

.right-column-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 1023px) {
  .dashboard-right {
    margin-top: 24px;
  }
}
</style>
