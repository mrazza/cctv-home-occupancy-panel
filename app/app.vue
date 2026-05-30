<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="app-header">
      <div class="header-container">
        <div class="logo-area">
          <img :src="'/favicon.png'" alt="Logo" class="logo-icon" data-testid="app-logo-icon" />
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
          <div class="left-column-grid">
            <StatusCard :status="status" />
            <LiveFeedCard :status="status" />
          </div>
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

<script setup lang="ts">
import { useSafeConfig } from './composables/useSafeConfig'
import { useOccupancy } from './composables/useOccupancy'

const config = useSafeConfig()
const panelTitle = config.public.panelTitle

const {
  status,
  isOffline,
  events,
  eventsLimit,
  toasts,
  lightbox,
  handleLoadMore,
  handleReconcile,
  addToast,
  dismissToast,
  openLightbox,
  closeLightbox
} = useOccupancy()
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

.logo-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
  animation: pulse-active 2s infinite ease-in-out;
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

.left-column-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .left-column-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
