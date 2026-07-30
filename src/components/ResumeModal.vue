<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const canvasWrap = ref<HTMLElement | null>(null)
const resumeDialog = ref<HTMLElement | null>(null)
const pageElement = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const textLayer = ref<HTMLElement | null>(null)
const zoom = ref(1)
const pageNumber = ref(1)
const pageCount = ref(0)
const loading = ref(true)
const error = ref('')
const usingFallback = ref(false)
const baseUrl = import.meta.env.BASE_URL
const resumePageUrl = computed(() => `${baseUrl}resume-pages/page-${pageNumber.value}.png`)
const resumePdfUrl = 'https://local.andy.uno/Andy-Anderson-Resume.pdf'
let pdf: PDFDocumentProxy | null = null
let page: PDFPageProxy | null = null
let loadTask: PDFDocumentLoadingTask | null = null
let renderTask: RenderTask | null = null
let textLayerTask: InstanceType<typeof pdfjs.TextLayer> | null = null
let resizeTimer = 0
let previousFocus: HTMLElement | null = null

async function loadPdf() {
  loading.value = true
  error.value = ''
  usingFallback.value = false

  try {
    loadTask = pdfjs.getDocument({
      url: resumePdfUrl,
      isEvalSupported: false,
    })
    pdf = await loadTask.promise
    pageCount.value = pdf.numPages
    pageNumber.value = 1
    page = await pdf.getPage(pageNumber.value)
    await renderPage()
  } catch (reason) {
    console.error('PDF preview failed; using rendered fallback.', reason)
    usingFallback.value = true
    error.value = 'Selectable text is unavailable in this browser. Showing a visual preview.'
  } finally {
    loading.value = false
  }
}

async function renderPage() {
  if (!page || !canvasWrap.value || !pageElement.value || !canvas.value || !textLayer.value) return

  renderTask?.cancel()
  textLayerTask?.cancel()
  textLayer.value.replaceChildren()

  const unscaledViewport = page.getViewport({ scale: 1 })
  const fittedWidth = Math.min(canvasWrap.value.clientWidth - 32, 940)
  const scale = Math.max(0.45, fittedWidth / unscaledViewport.width) * zoom.value
  const viewport = page.getViewport({ scale })
  const outputScale = Math.min(devicePixelRatio, 2)
  const context = canvas.value.getContext('2d', { alpha: false })
  if (!context) throw new Error('Canvas rendering is not supported.')

  pageElement.value.style.width = `${viewport.width}px`
  pageElement.value.style.height = `${viewport.height}px`
  pageElement.value.style.setProperty('--total-scale-factor', String(scale))
  canvas.value.width = Math.floor(viewport.width * outputScale)
  canvas.value.height = Math.floor(viewport.height * outputScale)
  canvas.value.style.width = `${viewport.width}px`
  canvas.value.style.height = `${viewport.height}px`

  renderTask = page.render({
    canvas: canvas.value,
    canvasContext: context,
    viewport,
    transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
  })
  textLayerTask = new pdfjs.TextLayer({
    textContentSource: page.streamTextContent({ includeMarkedContent: true }),
    container: textLayer.value,
    viewport,
  })

  try {
    await Promise.all([renderTask.promise, textLayerTask.render()])
  } catch (reason) {
    if ((reason as { name?: string }).name !== 'RenderingCancelledException') throw reason
  }
}

async function changeZoom(amount: number) {
  zoom.value = Math.min(1.6, Math.max(0.65, zoom.value + amount))
  if (!usingFallback.value) await renderPage()
}

async function changePage(amount: number) {
  if (!pdf) return
  const nextPage = Math.min(pageCount.value, Math.max(1, pageNumber.value + amount))
  if (nextPage === pageNumber.value) return

  loading.value = true
  try {
    renderTask?.cancel()
    textLayerTask?.cancel()
    pageNumber.value = nextPage
    page = await pdf.getPage(nextPage)
    await nextTick()
    await renderPage()
    canvasWrap.value?.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (reason) {
    if ((reason as { name?: string }).name !== 'RenderingCancelledException') {
      console.error('PDF page rendering failed; using rendered fallback.', reason)
      usingFallback.value = true
      error.value = 'Selectable text is unavailable in this browser. Showing a visual preview.'
    }
  } finally {
    loading.value = false
  }
}

function useFallback() {
  usingFallback.value = true
  loading.value = false
  error.value = 'This fallback page is unavailable. Please download the PDF instead.'
}

function downloadPdf() {
  const anchor = document.createElement('a')
  anchor.href = resumePdfUrl
  anchor.download = 'Andy-Anderson-Resume.pdf'
  anchor.click()
}

function printPdf() {
  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.width = '1px'
  frame.style.height = '1px'
  frame.style.opacity = '0'
  frame.src = resumePdfUrl
  frame.onload = () => {
    const printWindow = frame.contentWindow
    const cleanup = () => frame.remove()
    printWindow?.addEventListener('afterprint', cleanup, { once: true })
    printWindow?.focus()
    printWindow?.print()
    setTimeout(cleanup, 60_000)
  }
  document.body.appendChild(frame)
}

function closeModal() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeModal()
  if (event.key === 'ArrowLeft' && pageNumber.value > 1) void changePage(-1)
  if (event.key === 'ArrowRight' && pageNumber.value < pageCount.value) void changePage(1)
  if ((event.ctrlKey || event.metaKey) && event.key === '=') {
    event.preventDefault()
    changeZoom(0.1)
  }
  if ((event.ctrlKey || event.metaKey) && event.key === '-') {
    event.preventDefault()
    changeZoom(-0.1)
  }
  if (event.key === 'Tab') trapFocus(event)
}

function trapFocus(event: KeyboardEvent) {
  if (!resumeDialog.value) return
  const focusable = Array.from(
    resumeDialog.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('hidden'))
  if (!focusable.length) {
    event.preventDefault()
    resumeDialog.value.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const activeElement = document.activeElement
  if (event.shiftKey && (activeElement === first || activeElement === resumeDialog.value)) {
    event.preventDefault()
    last?.focus()
  } else if (
    !event.shiftKey &&
    (activeElement === last || !resumeDialog.value.contains(activeElement))
  ) {
    event.preventDefault()
    first?.focus()
  }
}

function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    if (!usingFallback.value) void renderPage()
  }, 140)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = document.activeElement as HTMLElement | null
      document.body.classList.add('modal-open')
      addEventListener('keydown', onKeydown)
      addEventListener('resize', onResize)
      await nextTick()
      resumeDialog.value?.focus({ preventScroll: true })
      if (!pdf) {
        await loadPdf()
      } else if (!usingFallback.value) {
        loading.value = true
        await renderPage()
        loading.value = false
      }
    } else {
      document.body.classList.remove('modal-open')
      removeEventListener('keydown', onKeydown)
      removeEventListener('resize', onResize)
      previousFocus?.focus({ preventScroll: true })
      previousFocus = null
    }
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => {
  clearTimeout(resizeTimer)
  renderTask?.cancel()
  textLayerTask?.cancel()
  void loadTask?.destroy()
  pdf = null
  page = null
  document.body.classList.remove('modal-open')
  removeEventListener('keydown', onKeydown)
  removeEventListener('resize', onResize)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="open"
        ref="resumeDialog"
        class="resume-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-title"
        tabindex="-1"
      >
        <div class="modal-backdrop" @click="closeModal"></div>
        <section class="resume-window">
          <header class="viewer-header">
            <div>
              <span class="viewer-kicker">Curriculum vitae</span>
              <h2 id="resume-title">Andy Anderson</h2>
            </div>

            <div class="viewer-actions">
              <button type="button" title="Download PDF" @click="downloadPdf">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10l3.5-3.5 1.4 1.4-5.9 5.9-5.9-5.9 1.4-1.4L11 13V3ZM5 19h14v2H5v-2Z"/></svg>
                <span>Download</span>
              </button>
              <button type="button" title="Print résumé" @click="printPdf">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v5H6V3Zm-2 6h16a2 2 0 0 1 2 2v7h-4v3H6v-3H2v-7a2 2 0 0 1 2-2Zm4 7v3h8v-5H8v2Zm11-4.5a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z"/></svg>
                <span>Print</span>
              </button>
              <button class="close-button" type="button" title="Close" @click="closeModal">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z"/></svg>
              </button>
            </div>
          </header>

          <div class="viewer-toolbar">
            <div class="pager">
              <button type="button" :disabled="pageNumber <= 1" aria-label="Previous page" @click="changePage(-1)">←</button>
              <span>Page {{ pageNumber }} / {{ pageCount || '—' }}</span>
              <button type="button" :disabled="pageNumber >= pageCount" aria-label="Next page" @click="changePage(1)">→</button>
            </div>
            <div class="zoom">
              <button type="button" aria-label="Zoom out" @click="changeZoom(-0.1)">−</button>
              <span>{{ Math.round(zoom * 100) }}%</span>
              <button type="button" aria-label="Zoom in" @click="changeZoom(0.1)">+</button>
            </div>
          </div>

          <div ref="canvasWrap" class="canvas-wrap">
            <div v-if="loading" class="viewer-message">
              <span class="loader"></span>
              Rendering selectable résumé…
            </div>
            <div v-if="usingFallback && error" class="fallback-notice">
              {{ error }}
            </div>
            <div
              v-show="!usingFallback"
              ref="pageElement"
              class="pdf-page"
              :class="{ hidden: loading }"
            >
              <canvas ref="canvas"></canvas>
              <div ref="textLayer" class="text-layer" aria-label="Selectable résumé text"></div>
            </div>
            <img
              v-if="usingFallback"
              class="resume-page fallback-page"
              :src="resumePageUrl"
              alt="Andy Anderson résumé, page 1 of 1"
              @error="useFallback"
            />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.resume-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: clamp(0.7rem, 2vw, 2rem);
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 7, 13, 0.82);
  backdrop-filter: blur(18px);
}

.resume-window {
  position: relative;
  display: grid;
  grid-template-rows: auto auto 1fr;
  width: min(74rem, 96vw);
  height: 94svh;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  background: #111820;
  box-shadow: 0 2rem 7rem rgba(0, 0, 0, 0.58);
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 5.2rem;
  padding: 1rem 1.25rem 1rem 1.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  color: #f5f1e9;
}

.viewer-kicker {
  color: #dca865;
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.viewer-header h2 {
  margin-top: 0.12rem;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 500;
}

.viewer-actions {
  display: flex;
  gap: 0.4rem;
}

.viewer-actions button {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.56rem 0.72rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.3rem;
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  transition: 150ms ease;
}

.viewer-actions button:hover {
  border-color: #dca865;
  color: #efbc75;
}

.viewer-actions svg {
  width: 0.95rem;
  fill: currentColor;
}

.viewer-actions .close-button {
  margin-left: 0.35rem;
  border-color: transparent;
}

.viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3rem;
  padding: 0.4rem 1rem;
  background: #0c1218;
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--font-mono);
  font-size: 0.62rem;
}

.pager,
.zoom {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.viewer-toolbar button {
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.22rem;
  color: #fff;
}

.viewer-toolbar button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.viewer-toolbar button:disabled {
  opacity: 0.25;
  cursor: default;
}

.canvas-wrap {
  overflow: auto;
  padding: 1rem;
  background:
    radial-gradient(circle at 50% 0, rgba(255, 255, 255, 0.06), transparent 45%),
    #252c32;
  scrollbar-color: #59616a #252c32;
}

.pdf-page,
.resume-page {
  position: relative;
  display: block;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0.7rem 2.2rem rgba(0, 0, 0, 0.35);
}

.pdf-page.hidden {
  position: absolute;
  visibility: hidden;
}

.pdf-page canvas {
  position: absolute;
  inset: 0;
  display: block;
}

.text-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: clip;
  color-scheme: only light;
  line-height: 1;
  text-align: initial;
  letter-spacing: normal;
  word-spacing: normal;
  transform-origin: 0 0;
  forced-color-adjust: none;
  text-size-adjust: none;
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
}

.text-layer :deep(span),
.text-layer :deep(br) {
  position: absolute;
  color: transparent;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
  user-select: text;
}

.text-layer :deep(> :not(.markedContent)),
.text-layer :deep(.markedContent span:not(.markedContent)) {
  z-index: 1;
  font-size: calc(var(--text-scale-factor) * var(--font-height));
  transform:
    rotate(var(--rotate, 0deg))
    scaleX(var(--scale-x, 1))
    scale(var(--min-font-size-inv));
}

.text-layer :deep(.markedContent) {
  display: contents;
}

.text-layer :deep(::selection) {
  background: rgba(201, 133, 61, 0.38);
  color: transparent;
}

.fallback-page {
  width: min(100%, 940px);
}

.fallback-notice {
  width: min(100%, 940px);
  margin: 0 auto 0.7rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(232, 184, 109, 0.22);
  border-radius: 0.28rem;
  background: rgba(8, 15, 22, 0.72);
  color: rgba(255, 255, 255, 0.65);
  font-family: var(--font-mono);
  font-size: 0.58rem;
  text-align: center;
}

.viewer-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  min-height: 20rem;
  color: rgba(255, 255, 255, 0.55);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}

.loader {
  width: 0.9rem;
  height: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-top-color: #dfad68;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.modal-enter-active {
  transition: opacity 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-leave-active {
  transition: opacity 280ms ease;
}

.modal-enter-active .modal-backdrop,
.modal-leave-active .modal-backdrop {
  transition: opacity 360ms ease, backdrop-filter 420ms ease;
}

.modal-enter-active .resume-window {
  transition:
    transform 520ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 340ms ease,
    filter 420ms ease;
}

.modal-leave-active .resume-window {
  transition:
    transform 280ms cubic-bezier(0.4, 0, 0.8, 0.2),
    opacity 240ms ease,
    filter 260ms ease;
}

.modal-enter-active .canvas-wrap {
  transition: opacity 420ms 80ms ease, transform 520ms 70ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active .canvas-wrap {
  transition: opacity 180ms ease, transform 240ms ease;
}

.modal-enter-from,
.modal-leave-to,
.modal-enter-from .modal-backdrop,
.modal-leave-to .modal-backdrop {
  opacity: 0;
}

.modal-enter-from .modal-backdrop,
.modal-leave-to .modal-backdrop {
  backdrop-filter: blur(0);
}

.modal-enter-from .resume-window {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(1.25rem) scale(0.975);
}

.modal-leave-to .resume-window {
  opacity: 0;
  filter: blur(3px);
  transform: translateY(0.65rem) scale(0.988);
}

.modal-enter-from .canvas-wrap,
.modal-leave-to .canvas-wrap {
  opacity: 0;
  transform: translateY(0.45rem);
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 620px) {
  .resume-modal {
    padding: 0;
  }

  .resume-window {
    width: 100vw;
    height: 100svh;
    border: 0;
    border-radius: 0;
  }

  .viewer-header {
    min-height: 4.5rem;
  }

  .viewer-actions button span {
    display: none;
  }
}
</style>
