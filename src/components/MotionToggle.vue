<script setup lang="ts">
import { useMotionPreference } from '../composables/useMotionPreference'

const { motionDisabled, toggleMotion } = useMotionPreference()
</script>

<template>
  <button
    class="motion-toggle-control floating-label"
    type="button"
    :aria-pressed="motionDisabled"
    @click="toggleMotion"
  >
    {{ motionDisabled ? 'Enable motion' : 'Disable motion' }}
  </button>
</template>

<style scoped>
.motion-toggle-control:hover,
.motion-toggle-control[aria-pressed='true'] {
  color: rgba(255, 255, 255, 0.82);
}
</style>
