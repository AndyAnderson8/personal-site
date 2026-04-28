<script setup lang="ts">
import type { ResumeBlock } from '../data/resume.ts'

defineProps<{
  block: ResumeBlock | null
  pinned?: boolean
}>()
</script>

<template>
  <Transition name="card">
    <div v-if="block" class="detail-card">
      <!-- Header row: icon + title + pin indicator -->
      <div class="detail-card-header">
        <img v-if="block.icon" :src="block.icon" :alt="block.title" class="detail-card-icon" />
        <div class="detail-card-header-text">
          <div class="detail-card-title">{{ block.title }}</div>
          <div v-if="block.subtitle" class="detail-card-subtitle">{{ block.subtitle }}</div>
          <div v-if="block.date" class="detail-card-date">{{ block.date }}</div>
        </div>
        <span v-if="pinned" class="detail-card-pin" title="Pinned - click block to unpin">📌</span>
      </div>

      <div v-if="block.detail" class="detail-card-body">
        {{ block.detail }}
      </div>
      <div v-if="block.imageUrl" class="detail-card-image-wrap">
        <img
          :src="block.imageUrl"
          :alt="`${block.title} preview image`"
          class="detail-card-image"
          loading="lazy"
        />
      </div>
      <div v-if="block.tags?.length" class="detail-card-tags">
        <span
          v-for="tag in block.tags"
          :key="tag"
          class="detail-card-tag"
        >{{ tag }}</span>
      </div>
      <div v-if="block.links?.length" class="detail-card-links">
        <a
          v-for="link in block.links"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener"
          class="detail-card-link"
        >
          <span>↗</span> {{ link.label }}
        </a>
      </div>
    </div>
    <div v-else class="detail-card detail-card--placeholder">
      <div class="detail-card-placeholder">
        Hover a section to preview · click to pin
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@import '../styles/resume.css';

.detail-card-header {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding-right: 1.25rem;
  margin-bottom: var(--space-4);
}

.detail-card-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.detail-card-header-text {
  flex: 1;
  min-width: 0;
}

.detail-card-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  margin-bottom: 0;
}

.detail-card-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: 0;
}

.detail-card-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: 0;
}

.detail-card-pin {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.85rem;
  line-height: 1;
  opacity: 0.7;
}

.card-enter-active,
.card-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}
.card-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.card-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
