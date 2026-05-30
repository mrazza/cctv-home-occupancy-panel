<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div 
        v-if="isOpen && imageSrc" 
        class="overlay-backdrop" 
        @click.self="$emit('close')"
        role="dialog"
        aria-modal="true"
        aria-label="Snapshot Image Lightbox"
      >
        <button class="overlay-close-btn" @click="$emit('close')" aria-label="Close Lightbox">
          &times;
        </button>
        <div class="overlay-content animate-zoom">
          <img 
            :src="imageSrc" 
            :alt="title || 'Snapshot Details'" 
            class="lightbox-image"
          />
          <div class="lightbox-details">
            <h3 class="lightbox-title">{{ title || 'Snapshot Details' }}</h3>
            <p v-if="subtitle" class="lightbox-subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen: boolean
    imageSrc?: string
    title?: string
    subtitle?: string
  }>(),
  {
    imageSrc: '',
    title: '',
    subtitle: ''
  }
)

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
/* Component-specific styles only — overlay/close/zoom handled by global utilities */
.lightbox-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg), 0 0 50px rgba(99, 102, 241, 0.15);
  border: 1px solid var(--border-glass);
}

.lightbox-details {
  background: rgba(22, 22, 38, 0.8);
  border: 1px solid var(--border-glass);
  padding: 16px 24px;
  border-radius: var(--radius-md);
  text-align: center;
  max-width: 450px;
  box-shadow: var(--shadow-md);
}

.lightbox-title {
  font-family: var(--font-display);
  font-size: 18px;
  margin-bottom: 4px;
}

.lightbox-subtitle {
  font-family: var(--font-sans);
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
