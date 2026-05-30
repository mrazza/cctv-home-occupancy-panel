<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['toast-card', `toast-${toast.type}`]"
        role="alert"
      >
        <span class="toast-icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 20 20" fill="currentColor" class="icon" data-testid="icon-success">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.8-11.2a1 1 0 00-1.4-1.4L9 8.6 7.6 7.2a1 1 0 00-1.4 1.4l2.1 2.1a1 1 0 001.4 0l4.1-4.1z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="toast.type === 'error'" viewBox="0 0 20 20" fill="currentColor" class="icon" data-testid="icon-error">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 112 0v4a1 1 0 11-2 0v-4zm1 7.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" clip-rule="evenodd" />
          </svg>
          <svg v-else viewBox="0 0 20 20" fill="currentColor" class="icon" data-testid="icon-info">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="$emit('dismiss', toast.id)" aria-label="Dismiss notification">
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { Toast } from '../types'

defineProps<{
  toasts: Toast[]
}>()

defineEmits<{
  (e: 'dismiss', id: string): void
}>()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  width: 100%;
}

.toast-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  font-size: 14px;
  pointer-events: auto;
}

.toast-success {
  border-left: 4px solid var(--accent-success);
  box-shadow: var(--shadow-lg), rgba(16, 185, 129, 0.05) 0px 4px 20px;
}

.toast-error {
  border-left: 4px solid var(--accent-danger);
  box-shadow: var(--shadow-lg), rgba(244, 63, 94, 0.05) 0px 4px 20px;
}

.toast-info {
  border-left: 4px solid var(--accent-info);
  box-shadow: var(--shadow-lg), rgba(14, 165, 233, 0.05) 0px 4px 20px;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-success .toast-icon { color: var(--accent-success); }
.toast-error .toast-icon { color: var(--accent-danger); }
.toast-info .toast-icon { color: var(--accent-info); }

.icon {
  width: 20px;
  height: 20px;
}

.toast-message {
  flex-grow: 1;
  font-family: var(--font-sans);
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  transition: color var(--transition-fast);
}

.toast-close:hover {
  color: var(--text-primary);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  transform: translateY(20px) scale(0.9);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(40px);
  opacity: 0;
}
</style>
