<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div 
        v-if="isOpen && imageSrc" 
        class="lightbox-overlay" 
        @click.self="$emit('close')"
        role="dialog"
        aria-modal="true"
        aria-label="Snapshot Image Lightbox"
      >
        <button class="lightbox-close" @click="$emit('close')" aria-label="Close Lightbox">
          &times;
        </button>
        <div class="lightbox-content animate-zoom">
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

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  imageSrc: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  }
})

defineEmits(['close'])
</script>

<style scoped>
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
  max-width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 10001;
}

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
    transform: scale(0.9);
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
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>
