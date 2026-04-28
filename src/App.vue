<script setup lang="ts">
import ThemeToggle from './components/ThemeToggle.vue'
import LandingPage from './components/LandingPage.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-inner">
        <a href="#" class="app-logo" aria-label="Andy Anderson">
          <svg class="app-logo-mark" aria-hidden="true" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
            <text class="logo-a logo-a--back" x="0" y="26" fill="currentColor"
              font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              font-weight="900" font-size="34" letter-spacing="-3">A</text>
            <text class="logo-a logo-a--front" x="7" y="33" fill="currentColor"
              font-family="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              font-weight="900" font-size="34" letter-spacing="-3">A</text>
          </svg>
          <span class="app-logo-text">
            <span class="app-logo-first">andy</span>
            <span class="app-logo-sep">/</span>
            <span class="app-logo-last">anderson</span>
          </span>
        </a>
        <ThemeToggle />
      </div>
    </header>
    <LandingPage />
  </div>
</template>

<style scoped>
.app-shell {
  --app-header-height: 4.5rem;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
  transition: background-color var(--transition-base), border-color var(--transition-base);
}

.app-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-text);
}

/* --- Geometric mark: two overlapping A letterforms --- */
.app-logo-mark {
  width: 2rem;
  height: 2.25rem;
  flex-shrink: 0;
  color: var(--color-accent);
  overflow: visible;
}

.logo-a {
  transition: transform var(--transition-base), opacity var(--transition-base);
  transform-origin: center center;
}

.logo-a--back {
  opacity: 0.3;
}

.logo-a--front {
  opacity: 1;
}

/* Hover: the two A's separate along the diagonal */
.app-logo:hover .logo-a--back {
  transform: translate(-2px, -2px);
  opacity: 0.5;
}

.app-logo:hover .logo-a--front {
  transform: translate(2px, 2px);
}

/* --- Name text treatment --- */
.app-logo-text {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  letter-spacing: -0.02em;
  user-select: none;
}

.app-logo-first {
  font-weight: 700;
  color: var(--color-text);
}

.app-logo-sep {
  color: var(--color-accent);
  font-weight: 400;
  opacity: 0.6;
  margin: 0 0.05rem;
}

.app-logo-last {
  font-weight: 400;
  color: var(--color-text-secondary);
}
</style>
