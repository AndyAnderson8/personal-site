<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useMotionPreference } from '../composables/useMotionPreference'
import { useRotatableMotion } from '../composables/useRotatableMotion'
import PaperModel from './PaperModel.vue'

defineSlots<{
  front(props: { flip: () => void }): unknown
  back(props: { flip: () => void }): unknown
}>()

const FULL_TURN = 360
const HALF_TURN = 180
const FLIP_COOLDOWN_MS = 400

type FlipDirection = -1 | 1

const { motionDisabled } = useMotionPreference()
const motion = useRotatableMotion({ initialX: -7, initialY: -12 })
const { rotationX, rotationY, targetRotationY, dragging, moved } = motion
const dragHintDismissed = ref(false)
const isBackFacing = (angle: number) => {
  const normalized = ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN
  return normalized > HALF_TURN / 2 && normalized < FULL_TURN - HALF_TURN / 2
}
const backActive = computed(() => isBackFacing(rotationY.value))
const targetFlipped = computed(() => isBackFacing(targetRotationY.value))

let hintTimer = 0
let projectedHover: HTMLElement | null = null
let pressedControl: HTMLElement | null = null
let permittedControl: HTMLElement | null = null
let forwardingControlClick = false
let nextButtonFlipDirection: FlipDirection = 1
let flipLockedUntil = 0

function setProjectedHover(control: HTMLElement | null) {
  if (projectedHover === control) return
  projectedHover?.classList.remove('projected-hover')
  projectedHover = control
  projectedHover?.classList.add('projected-hover')
}

function controlAt(event: MouseEvent | PointerEvent) {
  const direct = (event.target as HTMLElement).closest<HTMLElement>('a, button')
  if (direct) return direct

  const controls = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('a, button')
  return [...controls].find((candidate) => {
    if (getComputedStyle(candidate).visibility !== 'visible') return false
    const bounds = candidate.getBoundingClientRect()
    return (
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom
    )
  })
}

function onPointerDown(event: PointerEvent) {
  pressedControl = controlAt(event) ?? null
  permittedControl = null
  if (pressedControl) {
    motion.freeze()
    return
  }
  clearTimeout(hintTimer)
  motion.pointerDown(event)
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === 'mouse') setProjectedHover(controlAt(event) ?? null)
  motion.pointerMove(event)
  if (moved.value) dragHintDismissed.value = true
}

function onPointerLeave() {
  setProjectedHover(null)
  motion.pointerLeave()
}

function onPointerUp(event: PointerEvent) {
  const releasedControl = controlAt(event) ?? null
  permittedControl = pressedControl === releasedControl ? pressedControl : null
  pressedControl = null
  if (permittedControl) {
    motion.freeze()
    return
  }
  const wasMoved = moved.value
  motion.pointerUp(event)
  if (wasMoved) scheduleHintReturn()
}

function nextFaceAngle(currentY: number, backFacing: boolean, direction: FlipDirection) {
  const faceOffset = backFacing ? 0 : HALF_TURN
  const turnCount =
    direction > 0
      ? Math.floor((currentY - faceOffset) / FULL_TURN + 1)
      : Math.ceil((currentY - faceOffset) / FULL_TURN - 1)
  return faceOffset + turnCount * FULL_TURN
}

function flipInDirection(direction: FlipDirection) {
  const now = performance.now()
  if (now < flipLockedUntil) return false
  flipLockedUntil = now + FLIP_COOLDOWN_MS
  clearTimeout(hintTimer)
  const nextY = nextFaceAngle(targetRotationY.value, targetFlipped.value, direction)
  motion.setTarget(motionDisabled.value ? 0 : -4, nextY)
  dragHintDismissed.value = true
  scheduleHintReturn()
  return true
}

function flipFromButton() {
  const direction = nextButtonFlipDirection
  if (flipInDirection(direction)) nextButtonFlipDirection = direction === 1 ? -1 : 1
}

function scheduleHintReturn() {
  clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => {
    if (!dragging.value) dragHintDismissed.value = false
  }, 5_000)
}

function onDoubleClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('a, button')) return
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  flipInDirection(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1)
}

function forwardControlClick(event: MouseEvent) {
  if (forwardingControlClick || event.detail === 0) return

  const directControl = (event.target as HTMLElement).closest<HTMLElement>('a, button')
  const control = permittedControl
  permittedControl = null

  if (!control || (directControl && directControl !== control)) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    return
  }

  if (directControl) return

  event.preventDefault()
  event.stopPropagation()
  forwardingControlClick = true
  control.click()
  forwardingControlClick = false
}

function onPointerCancel(event: PointerEvent) {
  pressedControl = null
  permittedControl = null
  motion.pointerCancel(event)
}

onBeforeUnmount(() => {
  clearTimeout(hintTimer)
  setProjectedHover(null)
})
</script>

<template>
  <div
    class="card-area"
    :class="{ dragging, 'motion-disabled': motionDisabled }"
    role="group"
    :aria-label="
      motionDisabled
        ? 'Business card. Double-click to flip.'
        : 'Interactive business card. Drag to rotate.'
    "
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerLeave"
    @click.capture="forwardControlClick"
    @dblclick="onDoubleClick"
  >
    <div class="card-float rotatable-float">
      <PaperModel
        class="business-paper"
        interactive
        :back-active="backActive"
        :flat="motionDisabled"
        :transform="motionDisabled ? 'none' : `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`"
      >
        <template #front><slot name="front" :flip="flipFromButton" /></template>
        <template #back><slot name="back" :flip="flipFromButton" /></template>
      </PaperModel>
    </div>

    <Transition name="hint" appear>
      <div v-if="!motionDisabled && !dragHintDismissed" class="drag-hint">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2 9 5h2v4H7V7l-3 3 3 3v-2h4v4H9l3 3 3-3h-2v-4h4v2l3-3-3-3v2h-4V5h2l-3-3Z" />
        </svg>
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

.card-area.motion-disabled {
  cursor: default;
  touch-action: auto;
}

.card-float {
  position: absolute;
  inset: 0;
  z-index: 2;
  transform-style: preserve-3d;
  will-change: transform;
}

.business-paper {
  --paper-depth: 0.32cqw;
  --paper-step: 0.16cqw;
  --paper-radius: 0.884cqw;
  --paper-border: rgba(106, 91, 67, 0.28);
  --paper-background:
    linear-gradient(
      to left,
      rgba(255, 255, 255, 0.72),
      rgba(255, 255, 255, 0.2) 26%,
      transparent 52%
    ),
    #ebe5d8;
  --paper-shadow:
    inset 0 0 0.465cqw rgba(255, 255, 255, 0.9), inset 0 0 4.65cqw rgba(99, 78, 49, 0.06);
  --paper-edge: repeating-linear-gradient(0deg, #d6cdbd 0 1px, #f0ebdf 1px 2px);
  color: #182127;
  transition: none;
}

.card-area.dragging :deep(.card-actions a),
.card-area.dragging :deep(.card-actions button),
.card-area.dragging :deep(.corner-flip) {
  pointer-events: none;
}

.drag-hint {
  position: absolute;
  z-index: 5;
  bottom: -4.5rem;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(255, 255, 255, 0.66);
  font-family: var(--font-mono);
  font-size: clamp(0.55rem, 0.75vw, 0.67rem);
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
    display: none;
  }
}

@media (max-height: 720px) {
  .drag-hint {
    display: none;
  }
}
</style>
