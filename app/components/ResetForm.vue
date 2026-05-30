<template>
  <div class="glass-card reset-card">
    <button 
      class="collapse-header" 
      @click="isExpanded = !isExpanded" 
      :aria-expanded="isExpanded"
      data-testid="collapse-toggle-btn"
    >
      <h2 class="card-title">State Reconciliation</h2>
      <span class="chevron-icon" :class="{ 'rotated': isExpanded }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>

    <div v-show="isExpanded" class="form-content animate-fade-in" data-testid="form-content-container">
      <p class="form-description">
        If tracking gets out of sync (e.g. occupants crossing the tripwire together), manually reconcile the state below.
      </p>

      <div class="form-fields">
        <!-- Someone Home Field -->
        <div class="form-group">
          <label class="field-label">Household Presence</label>
          <div class="presence-toggle-buttons">
            <button 
              type="button"
              :class="['toggle-btn', isHome ? 'active-home' : '']"
              @click="isHome = true"
              data-testid="presence-home-btn"
            >
              SOMEONE HOME
            </button>
            <button 
              type="button"
              :class="['toggle-btn', !isHome ? 'active-away' : '']"
              @click="isHome = false; occupantCount = 0"
              data-testid="presence-away-btn"
            >
              VACANT
            </button>
          </div>
        </div>

        <!-- Occupants Count Field -->
        <div class="form-group" :class="{ 'disabled-field': !isHome }">
          <label class="field-label">Occupant Count</label>
          <div class="counter-layout">
            <button 
              type="button" 
              class="counter-btn" 
              @click="decrement" 
              :disabled="!isHome || occupantCount <= 0"
              data-testid="counter-dec-btn"
            >
              &minus;
            </button>
            <span class="counter-value" data-testid="counter-display">{{ occupantCount }}</span>
            <button 
              type="button" 
              class="counter-btn" 
              @click="increment" 
              :disabled="!isHome"
              data-testid="counter-inc-btn"
            >
              &plus;
            </button>
          </div>
        </div>
      </div>

      <button 
        type="button" 
        class="btn btn-primary submit-btn" 
        @click="showModal = true"
        data-testid="open-reconcile-modal-btn"
      >
        Reconcile State
      </button>
    </div>

    <!-- Glassmorphic Confirmation Modal -->
    <Teleport to="body">
      <div 
        v-if="showModal" 
        class="modal-overlay" 
        @click.self="showModal = false"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        data-testid="confirmation-modal"
      >
        <div class="modal-card animate-zoom">
          <div class="modal-header">
            <h3 id="modal-title" class="modal-title-text">Confirm State Overwrite</h3>
            <button class="modal-close-x" @click="showModal = false" aria-label="Close modal" data-testid="modal-close-x">&times;</button>
          </div>
          
          <div class="modal-body">
            <p class="warning-text">
              Warning: This manually overrides the occupancy state. Current active tracker windows will be reset.
            </p>
            <div class="reconcile-summary">
              <div class="summary-item">
                <span class="summary-label">Presence</span>
                <span :class="['summary-value', isHome ? 'color-occupied' : 'color-vacant']">
                  {{ isHome ? 'OCCUPIED' : 'VACANT' }}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Occupants</span>
                <span class="summary-value white-text">{{ occupantCount }}</span>
              </div>
            </div>
            <p class="confirm-query">Are you sure you want to enforce these values?</p>
          </div>

          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showModal = false"
              data-testid="modal-cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmReconcile"
              data-testid="modal-confirm-btn"
            >
              Confirm Override
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    initialIsHome?: boolean
    initialOccupantCount?: number
  }>(),
  {
    initialIsHome: false,
    initialOccupantCount: 0
  }
)

const emit = defineEmits<{
  (e: 'submit', payload: { is_someone_home: boolean; current_occupancy: number }): void
}>()

const isExpanded = ref(false)
const isHome = ref(props.initialIsHome)
const occupantCount = ref(props.initialOccupantCount)
const showModal = ref(false)

// Sync with props when they change
watch(() => props.initialIsHome, (newVal) => {
  isHome.value = newVal
})

watch(() => props.initialOccupantCount, (newVal) => {
  occupantCount.value = newVal
})

const increment = () => {
  if (isHome.value) {
    occupantCount.value++
  }
}

const decrement = () => {
  if (isHome.value && occupantCount.value > 0) {
    occupantCount.value--
  }
}

const confirmReconcile = () => {
  emit('submit', {
    is_someone_home: isHome.value,
    current_occupancy: occupantCount.value
  })
  showModal.value = false
}
</script>

<style scoped>
.reset-card {
  padding: 0;
  overflow: hidden;
}

.collapse-header {
  width: 100%;
  background: none;
  border: none;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  text-align: left;
}

.collapse-header:focus {
  outline: none;
}

.chevron-icon {
  color: var(--text-secondary);
  transition: transform var(--transition-normal);
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.icon {
  width: 20px;
  height: 20px;
}

.form-content {
  padding: 0 24px 24px 24px;
  border-top: 1px solid var(--border-color);
}

.form-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 16px 0 20px 0;
  line-height: 1.5;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: opacity var(--transition-fast);
}

.disabled-field {
  opacity: 0.4;
  pointer-events: none;
}

.field-label {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Presence Toggle Buttons */
.presence-toggle-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 12px;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.toggle-btn.active-home {
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-success);
  border-color: var(--accent-success);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
}

.toggle-btn.active-away {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-danger);
  border-color: var(--accent-danger);
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.2);
}

/* Counter styles */
.counter-layout {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 4px;
  max-width: 160px;
}

.counter-btn {
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
  font-size: 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.counter-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.counter-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.counter-value {
  flex-grow: 1;
  text-align: center;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.submit-btn {
  width: 100%;
  padding: 12px;
}

/* Modal styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  max-width: 440px;
  width: 100%;
  box-shadow: var(--shadow-lg), 0 0 40px rgba(244, 63, 94, 0.1);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title-text {
  font-size: 18px;
  font-weight: 600;
}

.modal-close-x {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  transition: color var(--transition-fast);
}

.modal-close-x:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.warning-text {
  font-size: 13px;
  color: var(--accent-danger);
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.15);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  line-height: 1.4;
}

.reconcile-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 16px;
  border-radius: var(--radius-md);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.summary-value {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
}

.color-occupied { color: var(--accent-success); }
.color-vacant { color: var(--text-secondary); }
.white-text { color: var(--text-primary); }

.confirm-query {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--border-color);
}

/* Modal Animations */
.animate-zoom {
  animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes zoom-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
