<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{
  openResume: []
}>()

const cardArea = ref<HTMLElement | null>(null)
const rotateX = ref(-7)
const rotateY = ref(-12)
const hoverRotateX = ref(0)
const hoverRotateY = ref(0)
const dragging = ref(false)
const coasting = ref(false)
const dragHintDismissed = ref(false)
const flipped = computed(() => {
  const normalized = ((rotateY.value % 360) + 360) % 360
  return normalized > 90 && normalized < 270
})

let pointerId = -1
let startX = 0
let startY = 0
let startRotateX = 0
let startRotateY = 0
let previousX = 0
let previousY = 0
let velocityX = 0
let velocityY = 0
let inertiaFrame = 0
let hoverFrame = 0
let hintTimer = 0
let movedDuringDrag = false
let frontControls: HTMLElement[] = []
let backControls: HTMLElement[] = []

function onPointerDown(event: PointerEvent) {
  if ((event.target as HTMLElement).closest('a, button')) return
  cancelAnimationFrame(inertiaFrame)
  clearTimeout(hintTimer)
  coasting.value = false
  pointerId = event.pointerId
  startX = previousX = event.clientX
  startY = previousY = event.clientY
  startRotateX = rotateX.value
  startRotateY = rotateY.value
  velocityX = 0
  velocityY = 0
  movedDuringDrag = false
  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) {
    if (event.pointerType === 'mouse' && !coasting.value) {
      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
      const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
      hoverRotateX.value = vertical * -2.7
      hoverRotateY.value = horizontal * 3.6
      scheduleProxiedHover(event.clientX, event.clientY)
    }
    return
  }
  if (event.pointerId !== pointerId) return
  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY
  rotateY.value = startRotateY + deltaX * 0.42
  rotateX.value = Math.max(-68, Math.min(68, startRotateX - deltaY * 0.32))
  velocityX = event.clientX - previousX
  velocityY = event.clientY - previousY
  previousX = event.clientX
  previousY = event.clientY
  if (!movedDuringDrag && Math.abs(deltaX) + Math.abs(deltaY) > 8) {
    movedDuringDrag = true
    dragHintDismissed.value = true
    hoverRotateX.value = 0
    hoverRotateY.value = 0
    clearProxiedHover()
  }
}

function onPointerLeave() {
  if (dragging.value) return
  hoverRotateX.value = 0
  hoverRotateY.value = 0
  clearProxiedHover()
  scheduleHintReturn()
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  dragging.value = false
  coasting.value = false
  pointerId = -1
  velocityX = 0
  velocityY = 0
  movedDuringDrag = false
  hoverRotateX.value = 0
  hoverRotateY.value = 0
  clearProxiedHover()
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  dragging.value = false
  pointerId = -1

  if (!movedDuringDrag && activateControlAt(event.clientX, event.clientY)) {
    velocityX = 0
    velocityY = 0
    coasting.value = false
    return
  }

  if (movedDuringDrag) scheduleHintReturn()

  let momentumX = Math.max(-7, Math.min(7, velocityX * 0.34))
  let momentumY = Math.max(-4, Math.min(4, velocityY * 0.2))
  coasting.value = Math.abs(momentumX) + Math.abs(momentumY) > 0.04

  const coast = () => {
    momentumX *= 0.972
    momentumY *= 0.958
    rotateY.value += momentumX
    rotateX.value = Math.max(-68, Math.min(68, rotateX.value - momentumY))
    if (Math.abs(momentumX) + Math.abs(momentumY) > 0.025) {
      inertiaFrame = requestAnimationFrame(coast)
    } else {
      coasting.value = false
    }
  }
  coast()
}

function activateControlAt(clientX: number, clientY: number) {
  const match = findControlAt(clientX, clientY)
  if (!match) return false
  match.click()
  return true
}

function findControlAt(clientX: number, clientY: number) {
  const candidates = flipped.value ? backControls : frontControls

  const matches = candidates
    .map((element) => {
      const bounds = element.getBoundingClientRect()
      const padding = 7
      const contains =
        clientX >= bounds.left - padding &&
        clientX <= bounds.right + padding &&
        clientY >= bounds.top - padding &&
        clientY <= bounds.bottom + padding
      const centerX = bounds.left + bounds.width / 2
      const centerY = bounds.top + bounds.height / 2
      return {
        element,
        contains,
        distance: Math.hypot(clientX - centerX, clientY - centerY),
      }
    })
    .filter((candidate) => candidate.contains)
    .sort((a, b) => a.distance - b.distance)

  return matches[0]?.element ?? null
}

function scheduleProxiedHover(clientX: number, clientY: number) {
  cancelAnimationFrame(hoverFrame)
  hoverFrame = requestAnimationFrame(() => updateProxiedHover(clientX, clientY))
}

function updateProxiedHover(clientX: number, clientY: number) {
  const match = findControlAt(clientX, clientY)
  const controls = [...frontControls, ...backControls]
  controls.forEach((element) => {
    if (element !== match) element.classList.remove('proxy-hover')
  })
  match?.classList.add('proxy-hover')
}

function clearProxiedHover() {
  cancelAnimationFrame(hoverFrame)
  const controls = [...frontControls, ...backControls]
  controls.forEach((element) => {
    element.classList.remove('proxy-hover')
  })
}

function flipCard() {
  cancelAnimationFrame(inertiaFrame)
  clearTimeout(hintTimer)
  coasting.value = false
  const turns = Math.round(rotateY.value / 360) * 360
  rotateY.value = flipped.value ? turns : turns + 180
  rotateX.value = -4
  dragHintDismissed.value = true
  scheduleHintReturn()
}

function scheduleHintReturn() {
  clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => {
    if (!dragging.value) dragHintDismissed.value = false
  }, 5_000)
}

function onDoubleClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('a, button')) return
  flipCard()
}

onMounted(() => {
  if (!cardArea.value) return
  frontControls = Array.from(
    cardArea.value.querySelectorAll<HTMLElement>(
      '.card-front .card-actions a, .card-front .card-actions button, .card-front .corner-flip',
    ),
  )
  backControls = Array.from(
    cardArea.value.querySelectorAll<HTMLElement>('.card-back .corner-flip'),
  )
})

onBeforeUnmount(() => {
  cancelAnimationFrame(inertiaFrame)
  cancelAnimationFrame(hoverFrame)
  clearTimeout(hintTimer)
  clearProxiedHover()
})
</script>

<template>
  <div
    ref="cardArea"
    class="card-area"
    :class="{ dragging, coasting }"
    role="group"
    aria-label="Interactive business card. Drag to rotate."
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerLeave"
    @dblclick="onDoubleClick"
  >
    <div
      class="hover-tilt"
      :style="{ transform: `rotateX(${hoverRotateX}deg) rotateY(${hoverRotateY}deg)` }"
    >
      <div
        class="card-object"
        :class="{ dragging, coasting }"
        :style="{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }"
      >
      <article class="card-face card-front">
        <div class="paper-fibers"></div>
        <div class="card-topline">
          <span class="mini-mark">AA<span>.</span></span>
        </div>

        <div class="identity">
          <p class="kicker">Backend Engineer</p>
          <h2>Andy<br />Anderson</h2>
          <div class="rule"></div>
          <p class="company">Microchip Technology</p>
        </div>
        <span class="front-location">PHX · AZ</span>

        <nav class="card-actions" aria-label="Contact links">
          <a href="https://www.linkedin.com/in/andyanderson8" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.7 8.4H3.2V20h3.5V8.4ZM5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8.1 5.4H9.7V20h3.4v-5.7c0-1.5.3-3 2.2-3 1.8 0 1.9 1.7 1.9 3.1V20h3.5v-6.2c0-3-0.7-5.7-4.5-5.7-1.8 0-3 1-3.5 1.9h-.1V8.4h.5Z"/></svg>
            LinkedIn
          </a>
          <a href="https://github.com/AndyAnderson8" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.6 2.4 1.1 2.9.9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-5A4 4 0 0 1 6.7 8c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1.1a9.6 9.6 0 0 1 5.1 0c2-1.4 2.8-1 2.8-1 .6 1.3.2 2.4.1 2.7a4 4 0 0 1 1.1 3c0 4-2.4 4.8-4.7 5 .4.4.7 1 .7 1.9v3c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>
            GitHub
          </a>
          <a href="mailto:andy@andylabs.org">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2L19.2 7H4.8l7.2 5.2Zm0 2.4L4 8.8V17h16V8.8l-8 5.8Z"/></svg>
            Email
          </a>
          <button type="button" @click="emit('openResume')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l5 5v15H6V2Zm8 1.8V8h4.2L14 3.8ZM8 12v1.5h9V12H8Zm0 4v1.5h9V16H8Z"/></svg>
            Résumé
          </button>
        </nav>

        <button class="corner-flip" type="button" aria-label="Flip to back" @click="flipCard">
          <span>Flip</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.8 7.2A7 7 0 1 0 19 12h2a9 9 0 1 1-2.6-6.4L21 3v7h-7l2.8-2.8Z"/></svg>
        </button>
      </article>

      <article class="card-face card-back">
        <div class="paper-fibers"></div>
        <div class="back-grid">
          <div class="back-mark">AA<span>.</span></div>
          <div class="back-content">
            <p class="kicker">Secure systems · Thoughtful software</p>
            <p class="back-summary">
              I design and build secure, data-driven software—from backend architecture
              and cloud systems to real-time platforms and applied AI.
            </p>
            <div class="back-meta">
              <span>andy@andylabs.org</span>
            </div>
          </div>
        </div>
        <button class="corner-flip" type="button" aria-label="Flip to front" @click="flipCard">
          <span>Flip</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.8 7.2A7 7 0 1 0 19 12h2a9 9 0 1 1-2.6-6.4L21 3v7h-7l2.8-2.8Z"/></svg>
        </button>
      </article>

      <div class="card-edge edge-top"></div>
      <div class="card-edge edge-bottom"></div>
      <div class="card-edge edge-left"></div>
        <div class="card-edge edge-right"></div>
      </div>
    </div>

    <div class="card-shadow" :class="{ dragging }"></div>
    <Transition name="hint" appear>
      <div v-if="!dragHintDismissed" class="drag-hint">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 9 5h2v4H7V7l-3 3 3 3v-2h4v4H9l3 3 3-3h-2v-4h4v2l3-3-3-3v2h-4V5h2l-3-3Z"/></svg>
        Drag to explore · double-click to flip
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.card-area {
  position: relative;
  width: min(72vw, 43rem);
  aspect-ratio: 1.75;
  container-type: inline-size;
  transform-style: preserve-3d;
  cursor: grab;
  touch-action: none;
}

.card-area.dragging {
  cursor: grabbing;
}

.hover-tilt {
  position: absolute;
  inset: 0;
  z-index: 2;
  transform-style: preserve-3d;
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.card-object {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 850ms cubic-bezier(0.18, 0.8, 0.2, 1);
  will-change: transform;
}

.card-object.dragging,
.card-object.coasting {
  transition: none;
}

.card-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid rgba(106, 91, 67, 0.28);
  border-radius: 0.884cqw;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.75), transparent 35%),
    #ebe5d8;
  color: #182127;
  box-shadow:
    inset 0 0 0.465cqw rgba(255, 255, 255, 0.9),
    inset 0 0 4.65cqw rgba(99, 78, 49, 0.06);
  backface-visibility: hidden;
  transform: translateZ(1.017cqw);
  transform-style: preserve-3d;
  user-select: none;
}

.card-back {
  transform: rotateY(180deg) translateZ(1.017cqw);
}

.paper-fibers {
  position: absolute;
  inset: 0;
  opacity: 0.6;
  pointer-events: none;
  mix-blend-mode: multiply;
  filter: contrast(140%);
  background-image:
    repeating-linear-gradient(83deg, transparent 0 7px, rgba(77, 62, 41, 0.025) 8px, transparent 9px),
    repeating-linear-gradient(3deg, transparent 0 5px, rgba(255, 255, 255, 0.22) 6px, transparent 7px),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.22'/%3E%3C/svg%3E");
}

.card-topline {
  position: absolute;
  top: 7%;
  right: 5.8%;
  left: 5.8%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-mark {
  font-family: var(--font-display);
  font-size: 3.372cqw;
  font-weight: 700;
  letter-spacing: -0.12em;
}

.mini-mark span,
.back-mark span {
  color: #a9682e;
}

.identity {
  position: absolute;
  top: 21%;
  left: 8.5%;
}

.kicker {
  color: #9a5c29;
  font-family: var(--font-mono);
  font-size: 1.581cqw;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.identity h2 {
  margin-top: 2.79cqw;
  font-family: var(--font-display);
  font-size: 10.465cqw;
  font-weight: 520;
  letter-spacing: -0.075em;
  line-height: 0.79;
}

.front-location {
  position: absolute;
  bottom: 8.5%;
  left: 8.5%;
  color: #777c79;
  font-family: var(--font-mono);
  font-size: 1.349cqw;
  letter-spacing: 0.18em;
}

.rule {
  width: 12.79cqw;
  height: 1px;
  margin: 7% 0 5%;
  background: #a9682e;
}

.company {
  color: #596268;
  font-size: 1.907cqw;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.card-actions {
  position: absolute;
  z-index: 5;
  right: 5.8%;
  bottom: 9%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.047cqw;
  width: 39%;
  transform: translateZ(1px);
}

.card-actions a,
.card-actions button {
  display: flex;
  align-items: center;
  gap: 0.977cqw;
  min-width: 0;
  padding: 1.442cqw;
  border: 1px solid rgba(38, 47, 53, 0.19);
  border-radius: 0.465cqw;
  background: rgba(255, 255, 255, 0.24);
  color: #29343a;
  font-family: var(--font-mono);
  font-size: 1.372cqw;
  font-weight: 650;
  text-decoration: none;
  transition: 160ms ease;
}

.card-actions a:hover,
.card-actions button:hover,
.card-actions a.proxy-hover,
.card-actions button.proxy-hover,
.card-actions a:focus-visible,
.card-actions button:focus-visible {
  border-color: #9a5c29;
  background: rgba(255, 255, 255, 0.68);
  color: #814819;
  outline: none;
  transform: translateY(-1px);
}

.card-area.dragging .card-actions a,
.card-area.dragging .card-actions button,
.card-area.dragging .corner-flip {
  pointer-events: none;
}

.card-actions svg {
  width: 2.14cqw;
  flex: 0 0 auto;
  fill: currentColor;
}

.corner-flip {
  position: absolute;
  z-index: 6;
  top: 7%;
  right: 5.8%;
  display: flex;
  align-items: center;
  gap: 0.814cqw;
  color: #7e837f;
  font-family: var(--font-mono);
  font-size: 1.256cqw;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transform: translateZ(1px);
}

.corner-flip svg {
  width: 2.326cqw;
  fill: currentColor;
}

.back-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 35% 65%;
}

.back-mark {
  display: grid;
  place-items: center;
  border-right: 1px solid rgba(61, 63, 57, 0.15);
  color: #1e282d;
  font-family: var(--font-display);
  font-size: 18.605cqw;
  font-weight: 700;
  letter-spacing: -0.14em;
}

.back-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 9%;
}

.back-summary {
  margin-top: 5%;
  color: #28343a;
  font-family: var(--font-display);
  font-size: 3.14cqw;
  line-height: 1.25;
}

.back-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 7%;
  padding-top: 4%;
  border-top: 1px solid rgba(61, 63, 57, 0.18);
  color: #747875;
  font-family: var(--font-mono);
  font-size: 1.302cqw;
}

.card-edge {
  position: absolute;
  z-index: -1;
  background:
    repeating-linear-gradient(0deg, #d6cdbd 0 1px, #f0ebdf 1px 2px);
  backface-visibility: visible;
}

.edge-top,
.edge-bottom {
  left: 0;
  width: 100%;
  height: 2.035cqw;
}

.edge-top { top: -1.017cqw; transform: rotateX(90deg); }
.edge-bottom { bottom: -1.017cqw; transform: rotateX(90deg); }

.edge-left,
.edge-right {
  top: 0;
  width: 2.035cqw;
  height: 100%;
}

.edge-left { left: -1.017cqw; transform: rotateY(90deg); }
.edge-right { right: -1.017cqw; transform: rotateY(90deg); }

.card-shadow {
  position: absolute;
  z-index: 0;
  right: 6%;
  bottom: -9%;
  left: 6%;
  height: 18%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(1, 4, 8, 0.68) 0%,
    rgba(1, 4, 8, 0.5) 44%,
    rgba(1, 4, 8, 0) 78%
  );
  filter: blur(5.116cqw);
  opacity: 0.72;
  transform: translateZ(-100px);
  transition: 300ms ease;
}

.card-shadow.dragging {
  opacity: 0.5;
  transform: scale(0.88) translateY(12px);
}

.drag-hint {
  position: absolute;
  z-index: 5;
  bottom: -4.5rem;
  color: rgba(255, 255, 255, 0.66);
  font-family: var(--font-mono);
  font-size: clamp(0.55rem, 0.75vw, 0.67rem);
}

.drag-hint {
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  transform: translateX(-50%);
  white-space: nowrap;
}

.drag-hint svg {
  width: 0.95rem;
  fill: #e2b36d;
}

.hint-enter-active {
  transition:
    opacity 700ms 500ms ease,
    transform 700ms 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hint-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.35rem);
}

@media (max-width: 700px) {
  .card-area {
    width: min(91vw, 36rem);
  }

  .drag-hint {
    bottom: -3.4rem;
  }

  .corner-flip span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-object {
    transition-duration: 1ms;
  }

  .hint-enter-active,
  .hint-leave-active {
    transition: opacity 160ms ease;
  }
}
</style>
