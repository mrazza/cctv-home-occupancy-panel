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
          <!-- Media Selector Tabs if video is available -->
          <div v-if="videoSrc" class="media-tabs-bar" data-testid="lightbox-media-tabs">
            <button 
              type="button"
              class="media-tab-btn" 
              :class="{ active: activeTab === 'snapshot' }"
              @click="activeTab = 'snapshot'"
              data-testid="tab-snapshot"
            >
              Snapshot Crop
            </button>
            <button 
              type="button"
              class="media-tab-btn" 
              :class="{ active: activeTab === 'video' }"
              @click="activeTab = 'video'"
              data-testid="tab-video"
            >
              5s Video Replay
            </button>
          </div>

          <!-- Video Player -->
          <div v-if="activeTab === 'video' && videoSrc" class="lightbox-video-wrapper">
            <video 
              :src="videoSrc" 
              controls 
              autoplay 
              loop 
              class="lightbox-video"
              data-testid="lightbox-video"
              @error="handleVideoError"
            />
            <div v-if="videoError" class="video-error-badge">
              Video replay unavailable for this event
            </div>
          </div>

          <!-- Static Snapshot Image -->
          <img 
            v-else
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
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    imageSrc?: string
    videoSrc?: string
    title?: string
    subtitle?: string
  }>(),
  {
    imageSrc: '',
    videoSrc: '',
    title: '',
    subtitle: ''
  }
)

defineEmits<{
  (e: 'close'): void
}>()

const activeTab = ref<'snapshot' | 'video'>('snapshot')
const videoError = ref(false)

const handleVideoError = () => {
  videoError.value = true
  activeTab.value = 'snapshot'
}

watch(() => props.isOpen, (open) => {
  if (open) {
    activeTab.value = 'snapshot'
    videoError.value = false
  }
})
</script>

<style scoped>
.media-tabs-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.media-tab-btn {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.media-tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.media-tab-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #fff;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.lightbox-video-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-video {
  max-width: 100%;
  max-height: 70vh;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg), 0 0 50px rgba(99, 102, 241, 0.15);
  border: 1px solid var(--border-glass);
  background: #000;
}

.video-error-badge {
  margin-top: 8px;
  font-size: 11px;
  color: var(--accent-warning);
  background: rgba(245, 158, 11, 0.1);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(245, 158, 11, 0.2);
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
  max-width: 480px;
  margin-top: 14px;
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
