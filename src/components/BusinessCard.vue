<script setup lang="ts">
import AaMark from './AaMark.vue'
import BusinessCardModel from './BusinessCardModel.vue'

const emit = defineEmits<{ openResume: [] }>()
</script>

<template>
  <BusinessCardModel>
    <template #front="{ flip }">
      <article class="card-content">
        <div class="paper-fibers"></div>
        <div class="card-topline">
          <AaMark class="mini-mark" />
        </div>

        <div class="identity">
          <p class="kicker">AI Engineer</p>
          <h2>Andy<br />Anderson</h2>
          <div class="rule"></div>
          <p class="company">Microchip Technology</p>
        </div>
        <span class="front-location">PHX · AZ</span>

        <nav class="card-actions" aria-label="Contact links">
          <a
            href="https://www.linkedin.com/in/andyanderson8"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6.7 8.4H3.2V20h3.5V8.4ZM5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8.1 5.4H9.7V20h3.4v-5.7c0-1.5.3-3 2.2-3 1.8 0 1.9 1.7 1.9 3.1V20h3.5v-6.2c0-3-0.7-5.7-4.5-5.7-1.8 0-3 1-3.5 1.9h-.1V8.4h.5Z"
              />
            </svg>
            LinkedIn
          </a>
          <a href="https://github.com/AndyAnderson8" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.6 2.4 1.1 2.9.9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-5A4 4 0 0 1 6.7 8c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1.1a9.6 9.6 0 0 1 5.1 0c2-1.4 2.8-1 2.8-1 .6 1.3.2 2.4.1 2.7a4 4 0 0 1 1.1 3c0 4-2.4 4.8-4.7 5 .4.4.7 1 .7 1.9v3c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"
              />
            </svg>
            GitHub
          </a>
          <a href="mailto:hello@andyanderson.dev">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2L19.2 7H4.8l7.2 5.2Zm0 2.4L4 8.8V17h16V8.8l-8 5.8Z"
              />
            </svg>
            Email
          </a>
          <button type="button" @click="emit('openResume')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 2h8l5 5v15H6V2Zm8 1.8V8h4.2L14 3.8ZM8 12v1.5h9V12H8Zm0 4v1.5h9V16H8Z" />
            </svg>
            Résumé
          </button>
        </nav>

        <button class="corner-flip" type="button" aria-label="Flip to back" @click="flip">
          <span>Flip</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16.8 7.2A7 7 0 1 0 19 12h2a9 9 0 1 1-2.6-6.4L21 3v7h-7l2.8-2.8Z" />
          </svg>
        </button>
      </article>
    </template>

    <template #back="{ flip }">
      <article class="card-content">
        <div class="paper-fibers"></div>
        <div class="back-grid">
          <AaMark class="back-mark" />
          <div class="back-content">
            <p class="kicker">Enterprise AI · Platform Engineering</p>
            <p class="back-summary">
              I turn enterprise AI ideas into secure, scalable production systems, spanning model
              orchestration, intelligent applications, and the APIs and data pipelines that power
              them.
            </p>
            <div class="back-meta">
              <span>Python · TypeScript · C#/.NET</span>
              <span>hello@andyanderson.dev</span>
            </div>
          </div>
        </div>
        <button class="corner-flip" type="button" aria-label="Flip to front" @click="flip">
          <span>Flip</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16.8 7.2A7 7 0 1 0 19 12h2a9 9 0 1 1-2.6-6.4L21 3v7h-7l2.8-2.8Z" />
          </svg>
        </button>
      </article>
    </template>
  </BusinessCardModel>
</template>

<style scoped>
.card-content {
  position: absolute;
  inset: 0;
  color: #182127;
}

.card-topline {
  position: absolute;
  top: 7%;
  right: 5.8%;
  left: 5.8%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-mark {
  font-size: 3.372cqw;
}

.identity {
  position: absolute;
  top: 21%;
  left: 8.5%;
}

.kicker {
  color: #9a5c29;
  font-family: var(--font-mono);
  font-size: 1.581cqw;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.identity h2 {
  margin-top: 2.79cqw;
  font-family: var(--font-display);
  font-size: 10.465cqw;
  font-weight: 520;
  letter-spacing: -0.075em;
  line-height: 0.79;
}

.front-location {
  position: absolute;
  bottom: 8.5%;
  left: 8.5%;
  color: #777c79;
  font-family: var(--font-mono);
  font-size: 1.349cqw;
  letter-spacing: 0.18em;
}

.rule {
  width: 12.79cqw;
  height: 1px;
  margin: 7% 0 5%;
  background: #a9682e;
}

.company {
  color: #596268;
  font-size: 1.907cqw;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.card-actions {
  position: absolute;
  z-index: 5;
  right: 5.8%;
  bottom: 9%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.047cqw;
  width: 39%;
}

.card-actions a,
.card-actions button {
  display: flex;
  align-items: center;
  gap: 0.977cqw;
  min-width: 0;
  padding: 1.442cqw;
  border: 1px solid rgba(38, 47, 53, 0.19);
  border-radius: 0.465cqw;
  background: rgba(255, 255, 255, 0.24);
  color: #29343a;
  font-family: var(--font-mono);
  font-size: 1.372cqw;
  font-weight: 650;
  text-decoration: none;
  transition: 160ms ease;
}

.card-actions a:hover,
.card-actions button:hover,
.card-actions a.projected-hover,
.card-actions button.projected-hover,
.card-actions a:focus-visible,
.card-actions button:focus-visible {
  border-color: #9a5c29;
  background: rgba(255, 255, 255, 0.68);
  color: #814819;
  outline: none;
  transform: translateY(-1px);
}

.card-actions svg {
  width: 2.14cqw;
  flex: 0 0 auto;
  fill: currentColor;
}

.corner-flip {
  position: absolute;
  z-index: 6;
  top: 7%;
  right: 5.8%;
  display: flex;
  align-items: center;
  gap: 0.814cqw;
  color: #7e837f;
  font-family: var(--font-mono);
  font-size: 1.256cqw;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.corner-flip svg {
  width: 2.326cqw;
  fill: currentColor;
}

.back-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 35% 65%;
}

.back-mark {
  display: grid;
  place-items: center;
  border-right: 1px solid rgba(61, 63, 57, 0.15);
  color: #1e282d;
  font-size: 18.605cqw;
}

.back-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 9%;
}

.back-summary {
  margin-top: 5%;
  color: #28343a;
  font-family: var(--font-display);
  font-size: 3.14cqw;
  line-height: 1.25;
}

.back-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 7%;
  padding-top: 4%;
  border-top: 1px solid rgba(61, 63, 57, 0.18);
  color: #747875;
  font-family: var(--font-mono);
  font-size: 1.302cqw;
}

@media (max-width: 700px) {
  .corner-flip span {
    display: none;
  }
}
</style>
