<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from 'three'

const canvas = ref<HTMLCanvasElement | null>(null)
const backgroundUrl = `${import.meta.env.BASE_URL}desert-dusk.png`
let renderer: WebGLRenderer | undefined
let animationFrame = 0
let cleanup = () => {}

onBeforeUnmount(() => {
  cleanup()
})

onMounted(() => {
  if (!canvas.value) return

  const scene = new Scene()
  const camera = new PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100)
  camera.position.z = 9

  try {
    renderer = new WebGLRenderer({
      canvas: canvas.value,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    })
  } catch (reason) {
    console.warn('WebGL ambience is unavailable; using the photographic background only.', reason)
    return
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setSize(innerWidth, innerHeight)

  const count = innerWidth < 700 ? 280 : 620
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.65) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))

  const material = new PointsMaterial({
    color: 0xe8c18b,
    size: 0.018,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const dust = new Points(geometry, material)
  scene.add(dust)

  const pointer = { x: 0, y: 0 }
  const onPointerMove = (event: PointerEvent) => {
    pointer.x = event.clientX / innerWidth - 0.5
    pointer.y = event.clientY / innerHeight - 0.5
  }
  const onResize = () => {
    if (!renderer) return
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
    if (reducedMotion) renderer.render(scene, camera)
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const clock = new Clock()
  const animate = () => {
    const elapsed = clock.getElapsedTime()
    if (!reducedMotion) {
      dust.rotation.y = elapsed * 0.008
      dust.position.y = Math.sin(elapsed * 0.18) * 0.12
      camera.position.x += (pointer.x * 0.32 - camera.position.x) * 0.018
      camera.position.y += (-pointer.y * 0.18 - camera.position.y) * 0.018
    }
    renderer?.render(scene, camera)
    animationFrame = requestAnimationFrame(animate)
  }

  addEventListener('resize', onResize, { passive: true })
  if (reducedMotion) {
    renderer.render(scene, camera)
  } else {
    addEventListener('pointermove', onPointerMove, { passive: true })
    animate()
  }

  cleanup = () => {
    cancelAnimationFrame(animationFrame)
    removeEventListener('pointermove', onPointerMove)
    removeEventListener('resize', onResize)
    geometry.dispose()
    material.dispose()
    renderer?.dispose()
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
    radial-gradient(circle at 50% 48%, transparent 15%, rgba(2, 8, 15, 0.16) 58%, rgba(2, 7, 13, 0.67) 110%),
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
  from { transform: scale(1.01) translate3d(-0.35%, 0, 0); }
  to { transform: scale(1.045) translate3d(0.35%, -0.2%, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .ambient-photo {
    animation: none;
  }
}
</style>
