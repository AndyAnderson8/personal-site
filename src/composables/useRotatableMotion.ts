import { onBeforeUnmount, ref, watch } from 'vue'
import { useMotionPreference } from './useMotionPreference'

const MOTION = {
  dragX: 0.5,
  dragY: 0.4,
  releaseX: 0.15,
  releaseY: 0.1,
  hoverX: 4.5,
  hoverY: 3.15,
  maxPitch: 60,
  frictionX: 0.97,
  frictionY: 0.5,
  response: 0.1,
  dragResponse: 0.3,
  hoverResponse: 0.1,
  cutoff: 0.01,
  settle: 0.001,
}

type MotionOptions = {
  initialX?: number
  initialY?: number
  disabledX?: number
  disabledY?: number
}

export function useRotatableMotion(options: MotionOptions = {}) {
  const { motionDisabled } = useMotionPreference()
  const initialX = options.initialX ?? 0
  const initialY = options.initialY ?? 0
  const disabledX = options.disabledX ?? 0
  const disabledY = options.disabledY ?? 0
  const rotationX = ref(initialX)
  const rotationY = ref(initialY)
  const targetRotationY = ref(initialY)
  const dragging = ref(false)
  const moved = ref(false)

  let targetX = initialX
  let targetY = initialY
  let currentX = initialX
  let currentY = initialY
  let hoverX = 0
  let hoverY = 0
  let hoverTargetX = 0
  let hoverTargetY = 0
  let velocityX = 0
  let velocityY = 0
  let pointerId = -1
  let startX = 0
  let startY = 0
  let previousX = 0
  let previousY = 0
  let lastFrame = 0
  let animationFrame = 0

  function pointerDown(event: PointerEvent) {
    if (motionDisabled.value) return
    pointerId = event.pointerId
    startX = previousX = event.clientX
    startY = previousY = event.clientY
    velocityX = velocityY = 0
    dragging.value = true
    moved.value = false
    clearHover()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    startAnimation()
  }

  function pointerMove(event: PointerEvent) {
    if (motionDisabled.value) return
    if (pointerId === -1) {
      if (event.pointerType === 'mouse') {
        const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
        hoverTargetX = (((event.clientY - bounds.top) / bounds.height) * 2 - 1) * -MOTION.hoverY
        hoverTargetY = (((event.clientX - bounds.left) / bounds.width) * 2 - 1) * MOTION.hoverX
        startAnimation()
      }
      return
    }
    if (event.pointerId !== pointerId) return

    const deltaX = event.clientX - previousX
    const deltaY = event.clientY - previousY
    targetY += deltaX * MOTION.dragX
    targetX = clamp(targetX - deltaY * MOTION.dragY, -MOTION.maxPitch, MOTION.maxPitch)
    targetRotationY.value = targetY
    velocityY = deltaX * MOTION.releaseX
    velocityX = -deltaY * MOTION.releaseY
    previousX = event.clientX
    previousY = event.clientY
    moved.value ||= Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) > 8
    startAnimation()
  }

  function pointerUp(event: PointerEvent, cancelMomentum = false) {
    if (motionDisabled.value) return
    if (event.pointerId !== pointerId) return
    pointerId = -1
    dragging.value = false
    if (cancelMomentum) velocityX = velocityY = 0
    startAnimation()
  }

  function pointerCancel(event: PointerEvent) {
    if (event.pointerId === pointerId) cancelDrag()
  }

  function cancelDrag() {
    pointerId = -1
    dragging.value = false
    moved.value = false
    velocityX = velocityY = 0
    clearHover()
  }

  function pointerLeave() {
    if (!dragging.value) clearHover()
  }

  function clearHover() {
    hoverTargetX = hoverTargetY = 0
    startAnimation()
  }

  function setTarget(nextX: number, nextY: number) {
    targetX = clamp(nextX, -MOTION.maxPitch, MOTION.maxPitch)
    targetY = targetRotationY.value = nextY
    velocityX = velocityY = 0
    if (motionDisabled.value) {
      currentX = rotationX.value = targetX
      currentY = rotationY.value = targetY
      hoverX = hoverY = hoverTargetX = hoverTargetY = 0
      return
    }
    clearHover()
    startAnimation()
  }

  function freeze() {
    cancelAnimationFrame(animationFrame)
    animationFrame = 0
    lastFrame = 0
    pointerId = -1
    dragging.value = false
    velocityX = velocityY = 0
    hoverX = hoverY = hoverTargetX = hoverTargetY = 0
    targetX = currentX = rotationX.value
    targetY = currentY = targetRotationY.value = rotationY.value
  }

  function startAnimation() {
    if (motionDisabled.value) return
    if (animationFrame) return
    lastFrame = 0
    animationFrame = requestAnimationFrame(animate)
  }

  function animate(timestamp: number) {
    const frameScale = lastFrame ? clamp((timestamp - lastFrame) / (1000 / 60), 0.25, 3) : 1
    lastFrame = timestamp

    if (!dragging.value) {
      targetY += velocityY * frameScale
      targetX = clamp(targetX + velocityX * frameScale, -MOTION.maxPitch, MOTION.maxPitch)
      targetRotationY.value = targetY
      velocityY *= Math.pow(MOTION.frictionX, frameScale)
      velocityX *= Math.pow(MOTION.frictionY, frameScale)
      if (Math.abs(velocityY) < MOTION.cutoff) velocityY = 0
      if (Math.abs(velocityX) < MOTION.cutoff) velocityX = 0
    }

    const response =
      1 - Math.pow(1 - (dragging.value ? MOTION.dragResponse : MOTION.response), frameScale)
    const hoverResponse = 1 - Math.pow(1 - MOTION.hoverResponse, frameScale)
    currentX += (targetX - currentX) * response
    currentY += (targetY - currentY) * response
    hoverX += (hoverTargetX - hoverX) * hoverResponse
    hoverY += (hoverTargetY - hoverY) * hoverResponse
    if (Math.abs(targetX - currentX) < MOTION.settle) currentX = targetX
    if (Math.abs(targetY - currentY) < MOTION.settle) currentY = targetY
    if (Math.abs(hoverTargetX - hoverX) < MOTION.settle) hoverX = hoverTargetX
    if (Math.abs(hoverTargetY - hoverY) < MOTION.settle) hoverY = hoverTargetY
    rotationX.value = currentX + hoverX
    rotationY.value = currentY + hoverY

    const moving =
      dragging.value ||
      velocityX !== 0 ||
      velocityY !== 0 ||
      currentX !== targetX ||
      currentY !== targetY ||
      hoverX !== hoverTargetX ||
      hoverY !== hoverTargetY

    if (moving) {
      animationFrame = requestAnimationFrame(animate)
    } else {
      animationFrame = 0
      lastFrame = 0
    }
  }

  watch(
    motionDisabled,
    (disabled) => {
      if (!disabled) return

      cancelAnimationFrame(animationFrame)
      animationFrame = 0
      lastFrame = 0
      pointerId = -1
      dragging.value = false
      moved.value = false
      velocityX = velocityY = 0
      hoverX = hoverY = hoverTargetX = hoverTargetY = 0
      targetX = currentX = rotationX.value = disabledX
      targetY = currentY = rotationY.value = targetRotationY.value = disabledY
    },
    { immediate: true },
  )

  onBeforeUnmount(() => cancelAnimationFrame(animationFrame))

  return {
    rotationX,
    rotationY,
    targetRotationY,
    dragging,
    moved,
    pointerDown,
    pointerMove,
    pointerUp,
    pointerCancel,
    cancelDrag,
    pointerLeave,
    setTarget,
    freeze,
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}
