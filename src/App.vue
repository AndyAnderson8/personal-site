<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import BusinessCard from './components/BusinessCard.vue'

const resumeOpen = ref(false)
const resumeMounted = ref(false)
const AmbientScene = defineAsyncComponent(() => import('./components/AmbientScene.vue'))
const ResumeModal = defineAsyncComponent(() => import('./components/ResumeModal.vue'))

function openResume() {
  resumeMounted.value = true
  resumeOpen.value = true
}
</script>

<template>
  <div class="site-shell">
    <AmbientScene />

    <header class="site-header">
      <div class="site-header-inner">
        <a class="brand" href="#" aria-label="Andy Anderson, home">
          <svg class="brand-mark" viewBox="0 0 42 42" aria-hidden="true">
            <path
              class="brand-mark-outline"
              d="M8 33 20.8 7 34 33h-7.1l-2.3-5.2h-8.3L14 33H8Zm10.7-10.9h3.6L20.5 18l-1.8 4.1Z"
            />
            <path
              class="brand-mark-solid"
              d="M8 33 20.8 7 34 33h-7.1l-2.3-5.2h-8.3L14 33H8Zm10.7-10.9h3.6L20.5 18l-1.8 4.1Z"
            />
          </svg>
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
        <span>Built with Vue + Three.js</span>
      </div>
    </footer>

    <ResumeModal v-if="resumeMounted" :open="resumeOpen" @close="resumeOpen = false" />
  </div>
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
  width: 2.15rem;
  height: 2.15rem;
  overflow: visible;
}

.brand-mark path {
  transform-box: fill-box;
  transform-origin: center;
  transition:
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 260ms ease;
}

.brand-mark-outline {
  fill: none;
  stroke: rgba(255, 255, 255, 0.62);
  stroke-width: 1.2;
  opacity: 0.78;
}

.brand-mark-solid {
  fill: #dfb26a;
  opacity: 0.92;
  transform: translate(6px, 6px);
}

.brand:hover .brand-mark-outline {
  opacity: 1;
  transform: translate(-2.5px, -2.5px) rotate(-1deg);
}

.brand:hover .brand-mark-solid {
  opacity: 1;
  transform: translate(8.5px, 8.5px) rotate(1deg);
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

@media (prefers-reduced-motion: reduce) {
  .status-dot {
    animation: none;
  }

  .brand-mark path {
    transition: opacity 120ms ease;
  }

  .brand:hover .brand-mark-outline {
    transform: none;
  }

  .brand:hover .brand-mark-solid {
    transform: translate(6px, 6px);
  }
}
</style>
