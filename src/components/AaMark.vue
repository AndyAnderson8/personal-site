<template>
  <span class="aa-mark" aria-hidden="true">AA<span>.</span></span>
</template>

<style scoped>
.aa-mark {
  display: inline-block;
  color: var(--aa-color, currentColor);
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.12em;
  line-height: 1;
}

.aa-mark span {
  color: var(--aa-accent, #a9682e);
}
</style>
