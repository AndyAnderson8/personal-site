<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'
import AaMark from './components/AaMark.vue'
import BusinessCard from './components/BusinessCard.vue'
import { useMotionPreference } from './composables/useMotionPreference'

const resumeOpen = ref(false)
const resumeMounted = ref(false)
const { motionDisabled, toggleMotion } = useMotionPreference()
const AmbientScene = defineAsyncComponent(() => import('./components/AmbientScene.vue'))
const ResumeModal = defineAsyncComponent(() => import('./components/ResumeModal.vue'))

function openResume() {
  resumeMounted.value = true
  resumeOpen.value = true
}

const stopWatchingMotion = watch(
  motionDisabled,
  (disabled) => document.documentElement.classList.toggle('motion-disabled', disabled),
  { immediate: true },
)

onBeforeUnmount(() => {
  stopWatchingMotion()
  document.documentElement.classList.remove('motion-disabled')
})
</script>

<template>
  <div class="site-shell">
    <AmbientScene />

    <header class="site-header">
      <div class="site-header-inner">
        <a class="brand" href="#" aria-label="Andy Anderson, home">
          <AaMark class="brand-mark" />
          <span class="brand-name">andy<span>/</span>anderson</span>
        </a>

        <div class="header-status">
          <span class="status-dot" aria-hidden="true"></span>
          Phoenix, Arizona
        </div>
      </div>
    </header>

    <main class="card-stage">
      <BusinessCard @open-resume="openResume" />
    </main>

    <footer class="site-footer">
      <div class="site-footer-inner">
        <span>© {{ new Date().getFullYear() }} Andy Anderson</span>
      </div>
    </footer>

    <ResumeModal v-if="resumeMounted" :open="resumeOpen" @close="resumeOpen = false" />
  </div>

  <Teleport to="body">
    <button
      class="motion-toggle"
      type="button"
      :aria-pressed="motionDisabled"
      @click="toggleMotion"
    >
      {{ motionDisabled ? 'Enable motion' : 'Disable motion' }}
    </button>
  </Teleport>
</template>

<style scoped>
.site-shell {
  --content-gutter: clamp(1.25rem, 4vw, 4.5rem);
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  color: #f7f4ee;
  isolation: isolate;
}

.site-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 20;
  height: 5.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(6, 13, 24, 0.52), rgba(6, 13, 24, 0));
}

.site-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0 var(--content-gutter);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: #fff;
  text-decoration: none;
}

.brand-mark {
  --aa-accent: #dfb26a;
  font-size: 1.75rem;
}

.brand-name {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.brand-name span {
  padding: 0 0.2rem;
  color: #dfb26a;
  font-weight: 400;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: #e8b86d;
  box-shadow: 0 0 0.8rem rgba(232, 184, 109, 0.8);
  animation: breathe 2.8s ease-in-out infinite;
}

.card-stage {
  position: relative;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 8rem 2rem 6rem;
  perspective: 1500px;
}

.site-footer {
  position: fixed;
  inset: auto 0 0;
  z-index: 10;
  color: rgba(255, 255, 255, 0.48);
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.04em;
}

.site-footer-inner {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 1.5rem var(--content-gutter);
}

.motion-toggle {
  position: fixed;
  z-index: 110;
  right: clamp(1.25rem, 4vw, 4.5rem);
  bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.48);
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.04em;
}

.motion-toggle:hover,
.motion-toggle[aria-pressed='true'] {
  color: rgba(255, 255, 255, 0.82);
}

@keyframes breathe {
  50% {
    opacity: 0.45;
    transform: scale(0.75);
  }
}

@media (max-width: 700px) {
  .site-header {
    height: 4.75rem;
  }

  .header-status {
    display: none;
  }

  .card-stage {
    padding: 8.5rem 1rem 5rem;
    align-content: center;
  }
}
</style>
