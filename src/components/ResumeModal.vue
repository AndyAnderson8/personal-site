<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useMotionPreference } from '../composables/useMotionPreference'
import ResumeCard from './ResumeCard.vue'

const resumePdfUrl = 'https://local.andy.uno/Andy-Anderson-Resume.pdf'

const props = defineProps<{
  open: boolean
}>()

const { motionDisabled } = useMotionPreference()
const emit = defineEmits<{
  close: []
}>()

const resumeDialog = ref<HTMLElement | null>(null)
const loading = ref(true)
const failed = ref(false)
let previousFocus: HTMLElement | null = null
let printFrame: HTMLIFrameElement | null = null
let printUrl = ''
let printTimer = 0

function closeResume() {
  emit('close')
}

function clearPrint() {
  clearTimeout(printTimer)
  printFrame?.remove()
  if (printUrl) URL.revokeObjectURL(printUrl)
  printFrame = null
  printUrl = ''
}

async function printResume() {
  clearPrint()

  try {
    const response = await fetch(resumePdfUrl)
    if (!response.ok) throw new Error(`PDF request failed with ${response.status}.`)

    printUrl = URL.createObjectURL(await response.blob())
    printFrame = document.createElement('iframe')
    printFrame.title = 'Print résumé'
    printFrame.style.cssText =
      'position:fixed;width:1px;height:1px;right:0;bottom:0;border:0;opacity:0;pointer-events:none'
    printFrame.addEventListener(
      'load',
      () => {
        const printWindow = printFrame?.contentWindow
        if (!printWindow) return clearPrint()
        printWindow.addEventListener('afterprint', clearPrint, { once: true })
        setTimeout(() => {
          printWindow.focus()
          printWindow.print()
        }, 100)
      },
      { once: true },
    )
    printFrame.src = printUrl
    document.body.append(printFrame)
    printTimer = window.setTimeout(clearPrint, 60_000)
  } catch (reason) {
    console.warn('Direct printing is unavailable; opening the résumé instead.', reason)
    window.open(resumePdfUrl, '_blank', 'noopener,noreferrer')
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeResume()
  if (event.key === 'Tab') trapFocus(event)
}

function trapFocus(event: KeyboardEvent) {
  if (!resumeDialog.value) return
  const controls = Array.from(
    resumeDialog.value.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  )
  const first = controls[0]
  const last = controls.at(-1)
  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      loading.value = true
      failed.value = false
      previousFocus = document.activeElement as HTMLElement | null
      addEventListener('keydown', onKeydown)
      await nextTick()
      resumeDialog.value?.focus({ preventScroll: true })
    } else {
      removeEventListener('keydown', onKeydown)
      previousFocus?.focus({ preventScroll: true })
      previousFocus = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  removeEventListener('keydown', onKeydown)
  clearPrint()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="resume" appear>
      <div
        v-if="open"
        ref="resumeDialog"
        class="resume-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Interactive 3D résumé"
        tabindex="-1"
      >
        <div class="resume-backdrop" @click="closeResume"></div>

        <ResumeCard
          :pdf-url="resumePdfUrl"
          @ready="loading = false"
          @error="((loading = false), (failed = true))"
        />

        <div class="resume-actions">
          <a
            :href="resumePdfUrl"
            download="Andy-Anderson-Resume.pdf"
            aria-label="Download résumé PDF"
            title="Download PDF"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M11 3h2v10l3.5-3.5 1.4 1.4-5.9 5.9-5.9-5.9 1.4-1.4L11 13V3ZM5 19h14v2H5v-2Z"
              />
            </svg>
          </a>
          <button type="button" aria-label="Print résumé" title="Print" @click="printResume">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 3h12v5h1a3 3 0 0 1 3 3v6h-4v4H6v-4H2v-6a3 3 0 0 1 3-3h1V3Zm2 2v3h8V5H8Zm8 14v-5H8v5h8Zm3-8.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
              />
            </svg>
          </button>
          <button type="button" aria-label="Close résumé" title="Close" @click="closeResume">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z"
              />
            </svg>
          </button>
        </div>

        <div v-if="loading" class="resume-status" aria-live="polite">Preparing résumé…</div>
        <div v-else-if="failed" class="resume-status error" aria-live="polite">
          <span>Couldn’t render the 3D preview.</span>
          <a :href="resumePdfUrl" download="Andy-Anderson-Resume.pdf">Download the PDF</a>
        </div>
        <div v-else class="rotate-hint">
          {{
            motionDisabled ? 'Scroll or pinch to zoom' : 'Drag to rotate · scroll or pinch to zoom'
          }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.resume-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #f7f4ee;
}

.resume-backdrop {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(2, 7, 13, 0.82);
  backdrop-filter: blur(18px) saturate(0.72);
}

.resume-actions {
  position: absolute;
  z-index: 4;
  top: clamp(1rem, 2.5vw, 2rem);
  right: clamp(1rem, 2.5vw, 2rem);
  display: flex;
  gap: 0.45rem;
}

.resume-actions button,
.resume-actions a {
  display: grid;
  place-items: center;
  width: 2.65rem;
  height: 2.65rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 50%;
  background: rgba(7, 14, 22, 0.48);
  color: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(10px);
  text-decoration: none;
  transition:
    color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.resume-actions button:hover,
.resume-actions a:hover {
  border-color: #dca865;
  color: #efbc75;
  transform: translateY(-1px);
}

.resume-actions svg {
  width: 1rem;
  fill: currentColor;
}

.resume-status,
.rotate-hint {
  position: absolute;
  z-index: 4;
  bottom: clamp(1.25rem, 3vw, 2.5rem);
  left: 50%;
  padding: 0.48rem 0.72rem;
  border-radius: 999px;
  background: rgba(6, 13, 21, 0.46);
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transform: translateX(-50%);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.resume-status.error {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  pointer-events: auto;
}

.resume-status.error a {
  color: #e7b36e;
  text-decoration: underline;
  text-underline-offset: 0.18rem;
}

.resume-enter-active,
.resume-leave-active,
.resume-enter-active .resume-backdrop,
.resume-leave-active .resume-backdrop {
  transition:
    opacity 360ms ease,
    backdrop-filter 420ms ease;
}

.resume-enter-from,
.resume-leave-to,
.resume-enter-from .resume-backdrop,
.resume-leave-to .resume-backdrop {
  opacity: 0;
}

.resume-enter-from .resume-backdrop,
.resume-leave-to .resume-backdrop {
  backdrop-filter: blur(0);
}

@media (max-width: 620px) {
  .resume-actions button,
  .resume-actions a {
    width: 2.45rem;
    height: 2.45rem;
  }

  .rotate-hint {
    bottom: 1rem;
  }
}
</style>
