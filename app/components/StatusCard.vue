<template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatTime as formatTimestamp } from '../utils/formatTime'
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
</style>
