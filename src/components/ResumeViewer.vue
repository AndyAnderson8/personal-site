<script setup lang="ts">
import { ref, computed } from 'vue'
import { resume } from '../data/resume.ts'
import type { ResumeBlock } from '../data/resume.ts'
import DetailCard from './DetailCard.vue'

const hoveredBlock = ref<ResumeBlock | null>(null)
const pinnedBlocks = ref<ResumeBlock[]>([])

// Show pinned cards persistently; hover can still show a live preview below them
const hasPinnedBlocks = computed(() => pinnedBlocks.value.length > 0)
const previewBlock = computed(() => {
  if (!hoveredBlock.value) return null
  return isPinned(hoveredBlock.value.id) ? null : hoveredBlock.value
})

function isPinned(blockId: string) {
  return pinnedBlocks.value.some((block) => block.id === blockId)
}

function onMouseEnter(block: ResumeBlock) {
  hoveredBlock.value = block
}

function onClick(block: ResumeBlock) {
  // Toggle pin: clicking an already-pinned block unpins just that one
  if (isPinned(block.id)) {
    pinnedBlocks.value = pinnedBlocks.value.filter((pinned) => pinned.id !== block.id)
    return
  }

  pinnedBlocks.value = [...pinnedBlocks.value, block]
}

function onClickOutside() {
  pinnedBlocks.value = []
}
</script>

<template>
  <div class="resume-viewer" @click.self="onClickOutside">
    <!-- Paper -->
    <div class="resume-paper">
      <!-- Header -->
      <div class="resume-header">
        <div class="resume-name">{{ resume.name }}</div>
        <div class="resume-contact">
          <a :href="`mailto:${resume.email}`">{{ resume.email }}</a>
          <span>❖</span>
          <span>{{ resume.location }}</span>
        </div>
      </div>

      <!-- Summary -->
      <div class="resume-section">
        <div class="resume-section-title">Professional Summary</div>
        <div>{{ resume.summary }}</div>
      </div>

      <!-- Dynamic sections -->
      <div
        v-for="section in resume.sections"
        :key="section.id"
        class="resume-section"
      >
        <div class="resume-section-title">{{ section.heading }}</div>

        <!-- Skills section: rendered as bullet list -->
        <template v-if="section.id === 'skills'">
          <ul class="resume-bullets">
            <li
              v-for="block in section.blocks"
              :key="block.id"
              class="resume-block resume-skills-item"
              :class="{
                active: hoveredBlock?.id === block.id,
                pinned: isPinned(block.id),
              }"
              @mouseenter="onMouseEnter(block)"
              @click.stop="onClick(block)"
            >
              <span class="resume-skills-label">{{ block.title }}: </span>
              {{ block.tags?.join(', ') }}
            </li>
          </ul>
        </template>

        <!-- All other sections -->
        <template v-else>
          <div
            v-for="block in section.blocks"
            :key="block.id"
            class="resume-block"
            :class="{
              'resume-block--job': section.id === 'experience' || section.id === 'education',
              active: hoveredBlock?.id === block.id,
              pinned: isPinned(block.id),
            }"
            @mouseenter="onMouseEnter(block)"
            @click.stop="onClick(block)"
          >
            <div class="resume-block-header">
              <span class="resume-block-title">{{ block.title }}</span>
              <span v-if="block.date" class="resume-block-date">{{ block.date }}</span>
            </div>
            <div v-if="block.subtitle || block.location" class="resume-block-subtitle">
              <span>{{ block.subtitle }}</span>
              <span v-if="block.location">{{ block.location }}</span>
            </div>
            <ul v-if="block.bullets" class="resume-bullets">
              <li v-for="(bullet, i) in block.bullets" :key="i">{{ bullet }}</li>
            </ul>
          </div>
        </template>
      </div>
    </div>

    <!-- Detail card -->
    <div class="detail-card-wrapper">
      <template v-if="hasPinnedBlocks">
        <div v-for="block in pinnedBlocks" :key="block.id" class="detail-card-stack-item">
          <DetailCard :block="block" :pinned="true" />
        </div>
      </template>
      <div v-if="previewBlock" class="detail-card-stack-item">
        <DetailCard :block="previewBlock" :pinned="false" />
      </div>
      <DetailCard v-else-if="!hasPinnedBlocks" :block="null" :pinned="false" />
    </div>
  </div>
</template>

<style scoped>
@import '../styles/resume.css';

.resume-viewer {
  display: flex;
  gap: var(--space-10);
  align-items: flex-start;
  width: 100%;
}

.detail-card-wrapper {
  position: sticky;
  top: calc(var(--app-header-height, 0px) + var(--space-4));
  width: 360px;
  flex-shrink: 0;
  min-height: 200px;
}

.detail-card-stack-item + .detail-card-stack-item {
  margin-top: var(--space-4);
}

/* Pinned blocks get a slightly stronger highlight */
:deep(.resume-block.pinned) {
  background-color: var(--color-highlight);
  border-color: var(--color-accent);
}



@media (max-width: 900px) {
  .resume-viewer {
    flex-direction: column;
  }

  .detail-card-wrapper {
    position: static;
    width: 100%;
  }

  .detail-card {
    width: 100%;
  }
}
</style>
