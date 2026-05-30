<template>
  <div class="glass-card timeline-card">
    <h2 class="card-title timeline-header">Recent Activity</h2>

    <div v-if="!events || events.length === 0" class="empty-state animate-fade-in" data-testid="timeline-empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <p>No recent activity logged.</p>
    </div>

    <div v-else class="timeline-container" data-testid="timeline-list">
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="timeline-item"
        :class="`event-${event.event_type.toLowerCase()}`"
        data-testid="timeline-item"
      >
        <!-- Timeline track line indicator node -->
        <div class="timeline-node">
          <span class="node-dot">
            <!-- Icon for enter -->
            <svg v-if="event.event_type === 'ENTER'" viewBox="0 0 20 20" fill="currentColor" class="node-icon" data-testid="icon-enter">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1.293-11.293a1 1 0 00-1.414 0l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.879-1.879a1 1 0 000-1.414z" clip-rule="evenodd" transform="rotate(180 10 10)" />
            </svg>
            <!-- Icon for leave -->
            <svg v-else-if="event.event_type === 'LEAVE'" viewBox="0 0 20 20" fill="currentColor" class="node-icon" data-testid="icon-leave">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1.293-11.293a1 1 0 00-1.414 0l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.879-1.879a1 1 0 000-1.414z" clip-rule="evenodd" />
            </svg>
            <!-- Icon for manual reset -->
            <svg v-else viewBox="0 0 20 20" fill="currentColor" class="node-icon" data-testid="icon-reset">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </span>
        </div>

        <!-- Event content card -->
        <div class="timeline-content-card">
          <div class="event-header">
            <span class="event-title">{{ formatEventTitle(event.event_type) }}</span>
            <span class="event-time">{{ formatTime(event.timestamp) }}</span>
          </div>

          <div class="event-body">
            <div class="event-details">
              <div class="detail-pill" v-if="event.tracker_id !== null && event.tracker_id !== undefined">
                <span class="pill-label">Tracker ID:</span>
                <span class="pill-value">#{{ event.tracker_id }}</span>
              </div>
              <div class="detail-pill" v-if="event.confidence !== null && event.confidence !== undefined">
                <span class="pill-label">Confidence:</span>
                <span class="pill-value">{{ (event.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>

            <!-- Thumbnail if snapshot exists -->
            <div 
              v-if="event.snapshot_path" 
              class="snapshot-container"
              @click="triggerLightbox(event)"
              data-testid="snapshot-thumbnail"
            >
              <img 
                :src="getSnapshotUrl(event.snapshot_path)" 
                alt="Event Snapshot Crop" 
                class="snapshot-thumb"
              />
              <div class="snapshot-hover-overlay">
                <svg viewBox="0 0 20 20" fill="currentColor" class="zoom-icon">
                  <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5zm-2 4a2 2 0 112.24 1.977A1.994 1.994 0 019 9z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <div class="load-more-container" v-if="events && events.length >= limit">
        <button 
          class="load-more-btn" 
          @click="$emit('load-more')"
          data-testid="load-more-btn"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="load-more-icon">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Load More Activity
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  events: {
    type: Array,
    required: true,
    default: () => []
  },
  limit: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['view-snapshot', 'load-more'])

const formatEventTitle = (type) => {
  switch (type) {
    case 'ENTER': return 'Occupant Entered'
    case 'LEAVE': return 'Occupant Left'
    case 'FORCE_RESET': return 'System State Reset'
    default: return type
  }
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    return isoString
  }
}

const getSnapshotUrl = (path) => {
  if (!path) return ''
  // E.g. 'snapshots/crop_xxx.jpg' -> extract 'crop_xxx.jpg'
  const filename = path.replace(/^snapshots\//, '')
  return `/api/snapshot/${filename}`
}

const triggerLightbox = (event) => {
  const imageSrc = getSnapshotUrl(event.snapshot_path)
  const title = formatEventTitle(event.event_type)
  const formattedDate = new Date(event.timestamp).toLocaleString()
  const confidenceStr = event.confidence ? ` | Confidence: ${(event.confidence * 100).toFixed(0)}%` : ''
  const trackerStr = event.tracker_id !== null && event.tracker_id !== undefined ? ` | Tracker ID: #${event.tracker_id}` : ''
  const subtitle = `${formattedDate}${trackerStr}${confidenceStr}`

  emit('view-snapshot', {
    imageSrc,
    title,
    subtitle
  })
}
</script>

<style scoped>
.timeline-card {
  display: flex;
  flex-direction: column;
}

.timeline-header {
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-muted);
  gap: 12px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

/* Timeline Layout */
.timeline-container {
  position: relative;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-container::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--border-color);
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 16px;
  animation: slide-in-bottom 0.4s ease-out forwards;
}

.timeline-node {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.node-dot {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.node-icon {
  width: 14px;
  height: 14px;
}

/* Event color branding */
.event-enter .node-dot {
  border-color: var(--accent-success);
  color: var(--accent-success);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
}

.event-leave .node-dot {
  border-color: var(--accent-danger);
  color: var(--accent-danger);
  box-shadow: 0 0 8px rgba(244, 63, 94, 0.2);
}

.event-force_reset .node-dot {
  border-color: var(--accent-warning);
  color: var(--accent-warning);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
}

/* Timeline card content */
.timeline-content-card {
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  transition: all var(--transition-fast);
}

.timeline-content-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
}

.white-text { color: var(--text-primary); }

.event-time {
  font-size: 11px;
  color: var(--text-muted);
}

.event-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-pill {
  display: inline-flex;
  gap: 4px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.pill-label {
  color: var(--text-muted);
}

.pill-value {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Snapshot Thumbnail inside timeline */
.snapshot-container {
  position: relative;
  width: 72px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-glass);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.snapshot-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-fast);
}

.snapshot-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 15, 0.6);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: opacity var(--transition-fast);
}

.zoom-icon {
  width: 18px;
  height: 18px;
}

.snapshot-container:hover .snapshot-thumb {
  transform: scale(1.08);
}

.snapshot-container:hover .snapshot-hover-overlay {
  opacity: 1;
}

@keyframes slide-in-bottom {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Load More Button Styles */
.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.load-more-btn {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.load-more-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.4);
  color: var(--text-primary);
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}

.load-more-btn:active {
  transform: translateY(0);
}

.load-more-icon {
  width: 16px;
  height: 16px;
  transition: transform var(--transition-normal);
}

.load-more-btn:hover .load-more-icon {
  transform: translateY(2px);
}
</style>
