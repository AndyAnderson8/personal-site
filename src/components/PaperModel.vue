<script setup lang="ts">
withDefaults(
  defineProps<{
    transform: string
    flat?: boolean
    interactive?: boolean
    backActive?: boolean
  }>(),
  { flat: false, interactive: false, backActive: false },
)
</script>

<template>
  <div
    class="paper-model"
    :class="{ flat, interactive, 'back-active': backActive }"
    :style="{ transform }"
  >
    <div class="paper-layer layer-back"></div>
    <div class="paper-layer layer-center"></div>
    <div class="paper-layer layer-front"></div>
    <div class="paper-face paper-front">
      <slot name="front"></slot>
    </div>
    <div class="paper-face paper-back">
      <slot name="back"></slot>
    </div>
  </div>
</template>

<style scoped>
.paper-model {
  --paper-depth: 1px;
  --paper-step: 0.5px;
  --paper-radius: 0.16rem;
  --paper-border: rgba(25, 28, 31, 0.15);
  --paper-background: #fff;
  --paper-shadow: 0 1.8rem 5rem rgba(0, 0, 0, 0.46);
  --paper-edge: #d9dadd;
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform;
}

.paper-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 1px solid var(--paper-border);
  border-radius: var(--paper-radius);
  background: var(--paper-background);
  box-shadow: var(--paper-shadow);
  backface-visibility: hidden;
  pointer-events: none;
}

.paper-model.interactive:not(.back-active) .paper-front,
.paper-model.interactive.back-active .paper-back {
  visibility: visible;
  pointer-events: auto;
}

.paper-model.interactive {
  pointer-events: none;
}

.paper-model.interactive .paper-face {
  visibility: hidden;
}

.paper-front {
  transform: translateZ(var(--paper-depth));
}

.paper-model.flat .paper-front {
  transform: none;
}

.paper-model.flat {
  transform-style: flat;
  will-change: auto;
}

.paper-model.flat .paper-back,
.paper-model.flat.back-active .paper-front,
.paper-model.flat .paper-layer {
  display: none;
}

.paper-model.flat.back-active .paper-back {
  display: block;
  transform: none;
}

.paper-back {
  transform: rotateY(180deg) translateZ(var(--paper-depth));
}

.paper-layer {
  position: absolute;
  inset: 0;
  border-radius: var(--paper-radius);
  background: var(--paper-edge);
  backface-visibility: visible;
  pointer-events: none;
}

.layer-back {
  transform: translateZ(calc(0px - var(--paper-step)));
}

.layer-center {
  transform: translateZ(0);
}

.layer-front {
  transform: translateZ(var(--paper-step));
}
</style>
