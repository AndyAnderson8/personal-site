<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMotionPreference } from '../composables/useMotionPreference'

const canvas = ref<HTMLCanvasElement | null>(null)
const { motionDisabled } = useMotionPreference()
const backgroundUrl = `${import.meta.env.BASE_URL}desert-dusk.png`
let cleanup = () => {}

type Particle = {
  x: number
  y: number
  size: number
  alpha: number
  speed: number
}

onBeforeUnmount(() => {
  cleanup()
})

onMounted(() => {
  if (!canvas.value) return

  const context = canvas.value.getContext('2d')
  if (!context) return

  const reducedMotion = () => motionDisabled.value
  const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 }
  let width = innerWidth
  let height = innerHeight
  let particles: Particle[] = []
  let animationFrame = 0
  let pointerListening = false

  const createParticles = () => {
    const count = width < 700 ? 280 : 620
    particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.45 + Math.random() * 1.1,
      alpha: 0.12 + Math.random() * 0.3,
      speed: 0.004 + Math.random() * 0.012,
    }))
  }

  const draw = (timestamp = 0) => {
    context.clearRect(0, 0, width, height)
    context.globalCompositeOperation = 'lighter'
    pointer.currentX += (pointer.x - pointer.currentX) * 0.018
    pointer.currentY += (pointer.y - pointer.currentY) * 0.018

    for (const particle of particles) {
      const drift = reducedMotion() ? 0 : timestamp * particle.speed
      const x = particle.x * width + pointer.currentX * 32
      const y = (particle.y * height + drift + pointer.currentY * 18) % height
      context.beginPath()
      context.fillStyle = `rgba(232, 193, 139, ${particle.alpha})`
      context.arc(x, y, particle.size, 0, Math.PI * 2)
      context.fill()
    }

    if (!reducedMotion()) animationFrame = requestAnimationFrame(draw)
  }

  const onPointerMove = (event: PointerEvent) => {
    pointer.x = event.clientX / width - 0.5
    pointer.y = event.clientY / height - 0.5
  }

  const onResize = () => {
    width = innerWidth
    height = innerHeight
    const pixelRatio = Math.min(devicePixelRatio, 1.5)
    canvas.value!.width = Math.round(width * pixelRatio)
    canvas.value!.height = Math.round(height * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    createParticles()
    if (reducedMotion()) draw()
  }

  const startMotion = () => {
    if (reducedMotion() || animationFrame) return
    if (!pointerListening) {
      addEventListener('pointermove', onPointerMove, { passive: true })
      pointerListening = true
    }
    animationFrame = requestAnimationFrame(draw)
  }

  const stopMotion = () => {
    cancelAnimationFrame(animationFrame)
    animationFrame = 0
    if (pointerListening) {
      removeEventListener('pointermove', onPointerMove)
      pointerListening = false
    }
    pointer.x = pointer.y = pointer.currentX = pointer.currentY = 0
    draw()
  }

  onResize()
  addEventListener('resize', onResize, { passive: true })
  startMotion()
  const stopWatchingMotion = watch(motionDisabled, (disabled) => {
    if (disabled) stopMotion()
    else startMotion()
  })

  cleanup = () => {
    cancelAnimationFrame(animationFrame)
    stopWatchingMotion()
    removeEventListener('pointermove', onPointerMove)
    removeEventListener('resize', onResize)
  }
})
</script>

<template>
  <div class="ambient" aria-hidden="true">
    <div class="ambient-photo" :style="{ backgroundImage: `url(${backgroundUrl})` }"></div>
    <div class="ambient-vignette"></div>
    <div class="ambient-haze"></div>
    <canvas ref="canvas" class="ambient-canvas"></canvas>
  </div>
</template>

<style scoped>
.ambient,
.ambient-photo,
.ambient-vignette,
.ambient-haze,
.ambient-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ambient {
  z-index: -1;
  overflow: hidden;
  background: #07111f;
}

.ambient-photo {
  inset: -2.5%;
  width: 105%;
  height: 105%;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  animation: landscape-drift 24s ease-in-out infinite alternate;
  filter: saturate(0.9) contrast(1.04);
}

.ambient-vignette {
  background:
    radial-gradient(
      circle at 50% 48%,
      transparent 15%,
      rgba(2, 8, 15, 0.16) 58%,
      rgba(2, 7, 13, 0.67) 110%
    ),
    linear-gradient(180deg, rgba(1, 8, 18, 0.3), transparent 37%, rgba(2, 8, 14, 0.25));
}

.ambient-haze {
  top: auto;
  bottom: 0;
  height: 34%;
  background: linear-gradient(0deg, rgba(5, 11, 18, 0.35), transparent);
  backdrop-filter: blur(0.35px);
}

.ambient-canvas {
  pointer-events: none;
}

@keyframes landscape-drift {
  from {
    transform: scale(1.01) translate3d(-0.35%, 0, 0);
  }
  to {
    transform: scale(1.045) translate3d(0.35%, -0.2%, 0);
  }
}
</style>
