<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import type { PDFDocumentLoadingTask, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { useMotionPreference } from '../composables/useMotionPreference'
import { useRotatableMotion } from '../composables/useRotatableMotion'
import AaMark from './AaMark.vue'
import PaperModel from './PaperModel.vue'

const props = defineProps<{ pdfUrl: string }>()
const emit = defineEmits<{
  ready: []
  error: []
  pdfLoaded: [data: Uint8Array]
}>()

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const canvas = ref<HTMLCanvasElement | null>(null)
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
let loadTask: PDFDocumentLoadingTask | null = null
let renderTask: RenderTask | null = null
let page: PDFPageProxy | null = null
let resizeObserver: ResizeObserver | null = null
let resizeFrame = 0
let zoomRenderTimer = 0
let renderVersion = 0
let ready = false
let pinchDistance = 0
let pinchZoom = 1
let pinchPanX = 0
let pinchPanY = 0
let pinchCenterX = 0
let pinchCenterY = 0
let pinchAnchorX = 0
let pinchAnchorY = 0
const pointers = new Map<number, { x: number; y: number }>()

async function renderResume() {
  if (!canvas.value || !page) return

  const cssWidth = canvas.value.clientWidth
  if (!cssWidth) return

  const version = ++renderVersion
  renderTask?.cancel()

  const original = page.getViewport({ scale: 1 })
  const pixelRatio = Math.min(devicePixelRatio || 1, 3)
  const viewport = page.getViewport({ scale: cssWidth / original.width })
  const outputScale = Math.min(pixelRatio * Math.max(1, zoom.value), 5_120 / viewport.width)
  const buffer = document.createElement('canvas')
  const context = buffer.getContext('2d', { alpha: false })
  if (!context) throw new Error('Canvas rendering is unavailable.')

  buffer.width = Math.ceil(viewport.width * outputScale)
  buffer.height = Math.ceil(viewport.height * outputScale)
  context.textRendering = 'optimizeLegibility'
  renderTask = page.render({
    canvas: buffer,
    canvasContext: context,
    viewport,
    transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
    background: '#fff',
  })

  try {
    await renderTask.promise
    if (version !== renderVersion || !canvas.value) return

    const visibleContext = canvas.value.getContext('2d', { alpha: false })
    if (!visibleContext) throw new Error('Canvas rendering is unavailable.')
    canvas.value.width = buffer.width
    canvas.value.height = buffer.height
    visibleContext.drawImage(buffer, 0, 0)

    if (!ready) {
      ready = true
      emit('ready')
    }
  } catch (reason) {
    if ((reason as { name?: string }).name !== 'RenderingCancelledException') throw reason
  }
}

function scheduleRender() {
  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => void renderResume())
}

function clampZoom(value: number) {
  return Math.max(0.8, Math.min(1.65, value))
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
  zoomAt(
    zoom.value * Math.exp(-delta * 0.0012),
    event.clientX,
    event.clientY,
    event.currentTarget as HTMLElement,
  )
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

watch(zoom, () => {
  clearTimeout(zoomRenderTimer)
  zoomRenderTimer = window.setTimeout(scheduleRender, 140)
})

onMounted(async () => {
  if (!canvas.value) return

  try {
    loadTask = pdfjs.getDocument({ url: props.pdfUrl, isEvalSupported: false })
    const pdf = await loadTask.promise
    emit('pdfLoaded', await pdf.getData())
    page = await pdf.getPage(1)
    resizeObserver = new ResizeObserver(scheduleRender)
    resizeObserver.observe(canvas.value)
    await renderResume()
  } catch (reason) {
    if ((reason as { name?: string }).name !== 'RenderingCancelledException') {
      console.error('The résumé could not be rendered.', reason)
      emit('error')
    }
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  cancelAnimationFrame(resizeFrame)
  clearTimeout(zoomRenderTimer)
  renderTask?.cancel()
  void loadTask?.destroy()
})
</script>

<template>
  <div class="resume-arrival" :class="{ 'motion-disabled': motionDisabled }">
    <div
      class="resume-float rotatable-float"
      :style="{ scale: zoom, translate: `${panX}px ${panY}px` }"
    >
      <PaperModel class="resume-model" :flat :transform="objectTransform">
        <template #front>
          <canvas ref="canvas" class="resume-canvas" aria-label="Andy Anderson résumé"></canvas>
        </template>
        <template #back>
          <div class="resume-back-content" aria-label="Andy Anderson logo">
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
.resume-model {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.resume-float {
  transform-origin: 0 0;
}

.resume-model {
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

.resume-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
  pointer-events: none;
}

.resume-back-content {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}

.back-brand {
  display: grid;
  justify-items: center;
  gap: 1.2rem;
  color: #4c5053;
  font-family: var(--font-mono);
  font-size: clamp(0.66rem, 1.2vw, 0.9rem);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.resume-mark {
  --aa-color: #3f4346;
  --aa-accent: #aeb1b3;
  font-size: clamp(6rem, 13vw, 9rem);
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
