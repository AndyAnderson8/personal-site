<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useMotionPreference } from '../composables/useMotionPreference'
import { useRotatableMotion } from '../composables/useRotatableMotion'
import AaMark from './AaMark.vue'
import PaperModel from './PaperModel.vue'

defineProps<{
  svgUrl: string
}>()

const emit = defineEmits<{
  ready: []
  error: []
}>()

const { motionDisabled } = useMotionPreference()
const motion = useRotatableMotion()
const { rotationX, rotationY, dragging } = motion
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const pinching = ref(false)
const flat = computed(() => {
  const frontY = ((((rotationY.value + 180) % 360) + 360) % 360) - 180
  return !dragging.value && Math.abs(rotationX.value) < 0.02 && Math.abs(frontY) < 0.02
})
const objectTransform = computed(() =>
  flat.value ? 'none' : `rotateX(${rotationX.value}deg) rotateY(${rotationY.value}deg)`,
)
let pinchDistance = 0
let pinchZoom = 1
let pinchPanX = 0
let pinchPanY = 0
let pinchCenterX = 0
let pinchCenterY = 0
let pinchAnchorX = 0
let pinchAnchorY = 0
const pointers = new Map<number, { x: number; y: number }>()
let wheelFrame = 0
let wheelScale = 1
let wheelX = 0
let wheelY = 0
let wheelSurface: HTMLElement | null = null

function clampZoom(value: number) {
  return Math.max(0.8, Math.min(5, value))
}

function pointerDistance() {
  const [first, second] = [...pointers.values()]
  return first && second ? Math.hypot(second.x - first.x, second.y - first.y) : 0
}

function pointerCenter() {
  const [first, second] = [...pointers.values()]
  return first && second ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 } : null
}

function reverseZoomOffset(previousZoom: number, nextZoom: number, bounds: DOMRect) {
  if (previousZoom > 1 && nextZoom >= 1) {
    const remainingZoom = (nextZoom - 1) / (previousZoom - 1)
    panX.value *= remainingZoom
    panY.value *= remainingZoom
    return
  }

  panX.value = (bounds.width * (1 - nextZoom)) / 2
  panY.value = (bounds.height * (1 - nextZoom)) / 2
}

function zoomAt(value: number, clientX: number, clientY: number, surface: HTMLElement) {
  const nextZoom = clampZoom(value)
  if (nextZoom === zoom.value) return

  const bounds = surface.parentElement!.parentElement!.getBoundingClientRect()
  const previousZoom = zoom.value
  if (nextZoom < previousZoom) {
    reverseZoomOffset(previousZoom, nextZoom, bounds)
  } else {
    const ratio = nextZoom / previousZoom
    panX.value = panX.value * ratio + (clientX - bounds.left) * (1 - ratio)
    panY.value = panY.value * ratio + (clientY - bounds.top) * (1 - ratio)
  }
  zoom.value = nextZoom
}

function resetZoom() {
  zoom.value = 1
  panX.value = panY.value = 0
}

function onPointerDown(event: PointerEvent) {
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pointers.size === 1 && !pinching.value) {
    motion.pointerDown(event)
  } else if (pointers.size === 2) {
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    pinching.value = true
    pinchDistance = pointerDistance()
    pinchZoom = zoom.value
    pinchPanX = panX.value
    pinchPanY = panY.value
    const center = pointerCenter()!
    const bounds = (event.currentTarget as HTMLElement).parentElement!.getBoundingClientRect()
    pinchCenterX = center.x
    pinchCenterY = center.y
    pinchAnchorX = (center.x - bounds.left) / zoom.value
    pinchAnchorY = (center.y - bounds.top) / zoom.value
    motion.cancelDrag()
  }
}

function onPointerMove(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) {
    motion.pointerMove(event)
    return
  }

  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pinching.value) {
    const distance = pointerDistance()
    const center = pointerCenter()
    if (distance && pinchDistance && center) {
      const nextZoom = clampZoom(pinchZoom * (distance / pinchDistance))
      const previousZoom = zoom.value
      if (nextZoom < previousZoom) {
        const bounds = (
          event.currentTarget as HTMLElement
        ).parentElement!.parentElement!.getBoundingClientRect()
        reverseZoomOffset(previousZoom, nextZoom, bounds)
      } else {
        panX.value = pinchPanX + (center.x - pinchCenterX) + (pinchZoom - nextZoom) * pinchAnchorX
        panY.value = pinchPanY + (center.y - pinchCenterY) + (pinchZoom - nextZoom) * pinchAnchorY
      }
      zoom.value = nextZoom
    }
    return
  }

  motion.pointerMove(event)
}

function onPointerEnd(event: PointerEvent, cancelled = false) {
  pointers.delete(event.pointerId)
  if (pinching.value) {
    if (!pointers.size) pinching.value = false
    return
  }

  if (cancelled) motion.pointerCancel(event)
  else motion.pointerUp(event)
}

function onWheel(event: WheelEvent) {
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : innerHeight
  const delta = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : event.deltaY * unit
  wheelScale *= Math.exp(-delta * 0.0012)
  wheelX = event.clientX
  wheelY = event.clientY
  wheelSurface = event.currentTarget as HTMLElement
  if (wheelFrame) return

  wheelFrame = requestAnimationFrame(() => {
    wheelFrame = 0
    const scale = wheelScale
    wheelScale = 1
    if (wheelSurface) zoomAt(zoom.value * scale, wheelX, wheelY, wheelSurface)
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === '0') {
    resetZoom()
  } else {
    const direction = ['+', '=', 'Add'].includes(event.key)
      ? 1.15
      : ['-', '_', 'Subtract'].includes(event.key)
        ? 1 / 1.15
        : 0
    if (!direction) return
    const surface = event.currentTarget as HTMLElement
    const bounds = surface.parentElement!.getBoundingClientRect()
    zoomAt(
      zoom.value * direction,
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
      surface,
    )
  }
  event.preventDefault()
}

onBeforeUnmount(() => cancelAnimationFrame(wheelFrame))
</script>

<template>
  <div
    class="resume-arrival"
    :class="{ 'motion-disabled': motionDisabled }"
    :style="{ perspective: `${1_600 * zoom}px` }"
  >
    <div class="resume-float rotatable-float">
      <div
        class="resume-zoom"
        :style="{
          width: `${zoom * 100}%`,
          height: `${zoom * 100}%`,
          left: `${panX}px`,
          top: `${panY}px`,
        }"
      >
        <PaperModel class="resume-model" :flat :transform="objectTransform">
          <template #front>
            <div class="paper-fibers resume-fibers" aria-hidden="true"></div>
            <img
              class="resume-page"
              :src="svgUrl"
              alt="Andy Anderson résumé"
              draggable="false"
              @load="emit('ready')"
              @error="emit('error')"
            />
          </template>
          <template #back>
            <div class="resume-back-content" aria-label="Andy Anderson logo">
              <div class="paper-fibers resume-fibers" aria-hidden="true"></div>
              <div class="back-brand">
                <AaMark class="resume-mark" />
                <span>andy / anderson</span>
              </div>
            </div>
          </template>
        </PaperModel>

        <div
          class="drag-surface"
          :class="{ dragging, 'motion-disabled': motionDisabled }"
          role="group"
          :aria-label="
            motionDisabled
              ? 'Interactive résumé. Scroll or pinch to zoom.'
              : 'Interactive résumé. Drag to rotate, scroll or pinch to zoom.'
          "
          tabindex="0"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd($event, true)"
          @pointerleave="motion.pointerLeave"
          @wheel.prevent="onWheel"
          @keydown="onKeydown"
          @dblclick="resetZoom"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resume-arrival {
  position: relative;
  z-index: 2;
  width: auto;
  height: min(85svh, calc(90vw * 11 / 8.5));
  height: min(85dvh, calc(90vw * 11 / 8.5));
  aspect-ratio: 8.5 / 11;
  perspective: 1600px;
  animation: resume-arrive 820ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.resume-float,
.resume-zoom,
.resume-model {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.resume-zoom {
  will-change: width, height, left, top;
}

.resume-model {
  container-type: inline-size;
  pointer-events: none;
}

.drag-surface {
  position: absolute;
  z-index: 10;
  inset: -0.9rem;
  cursor: grab;
  touch-action: none;
}

.drag-surface.dragging {
  cursor: grabbing;
}

.drag-surface.motion-disabled {
  cursor: default;
}

.drag-surface:focus-visible {
  outline: 2px solid #e8b86d;
  outline-offset: 0.45rem;
}

.resume-page {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  pointer-events: none;
}

.resume-fibers {
  z-index: 0;
}

.resume-back-content {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}

.back-brand {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 2.9cqw;
  color: #4c5053;
  font-family: var(--font-mono);
  font-size: 2.2cqw;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.resume-mark {
  --aa-color: #3f4346;
  --aa-accent: #aeb1b3;
  font-size: 22cqw;
}

@keyframes resume-arrive {
  from {
    opacity: 0;
    transform: translateY(72vh) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
