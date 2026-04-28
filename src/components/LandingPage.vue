<script setup lang="ts">
import { onMounted } from 'vue'
import ResumeViewer from './ResumeViewer.vue'
import { resume } from '../data/resume.ts'

onMounted(() => {
  const targets = document.querySelectorAll('.fade-in')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.08 }
  )
  targets.forEach((el) => observer.observe(el))
})

const links = [
  {
    label: 'GitHub',
    url: 'https://github.com/AndyAnderson8',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
  },
  {
    label: 'LinkedIn',
    url: resume.linkedin,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  },
  {
    label: 'Email',
    url: `mailto:${resume.email}`,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>`,
  },
  {
    label: 'Resume PDF',
    url: '/Andy-Anderson-CV.pdf',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  },
]
</script>

<template>
  <main class="landing">
    <!-- Hero -->
    <section class="hero fade-in">
      <div class="hero-inner">
        <img src="/pfp.jpg" alt="Andy Anderson" class="hero-avatar" />
        <div class="hero-text">
          <h1 class="hero-name">{{ resume.name }}</h1>
          <p class="hero-role">Software Engineer</p>
          <p class="hero-bio">{{ resume.summary }}</p>
          <div class="hero-links">
            <a
              v-for="link in links"
              :key="link.label"
              :href="link.url"
              :target="link.url.startsWith('mailto') ? undefined : '_blank'"
              rel="noopener"
              class="hero-link"
              :title="link.label"
            >
              <span v-html="link.icon" class="hero-link-icon"></span>
              <span>{{ link.label }}</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Resume -->
    <section id="resume" class="resume-section-wrapper fade-in">
      <h2 class="section-heading">Resume</h2>
      <ResumeViewer />
    </section>

    <!-- Footer -->
    <footer class="site-footer fade-in">
      <div class="footer-inner">
        <span class="footer-copy">&copy; {{ new Date().getFullYear() }} Andy Anderson</span>
        <div class="footer-links">
          <a href="https://github.com/AndyAnderson8" target="_blank" rel="noopener">GitHub</a>
          <span class="footer-sep">·</span>
          <a :href="resume.linkedin" target="_blank" rel="noopener">LinkedIn</a>
          <span class="footer-sep">·</span>
          <a :href="`mailto:${resume.email}`">Email</a>
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
/* Page-enter animation */
.fade-in {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

.landing {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-8);
}

/* Hero */
.hero {
  padding: var(--space-10) 0 var(--space-12);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-12);
}

.hero-inner {
  display: flex;
  gap: var(--space-8);
  align-items: center;
}

.hero-avatar {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 3px solid var(--color-border);
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
}

.hero-text {
  flex: 1;
}

.hero-name {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-1);
  line-height: 1.1;
}

.hero-role {
  font-size: var(--font-size-lg);
  color: var(--color-accent);
  font-weight: 500;
  margin-bottom: var(--space-4);
}

.hero-bio {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 600px;
  margin-bottom: var(--space-6);
}

.hero-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hero-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.hero-link:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  text-decoration: none;
  transform: translateY(-1px);
}

.hero-link-icon {
  display: flex;
  align-items: center;
  line-height: 1;
}

/* Resume section */
.resume-section-wrapper {
  width: 100%;
  scroll-margin-top: 5rem;
}

.section-heading {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin-bottom: var(--space-6);
  color: var(--color-text);
}

/* Footer */
.site-footer {
  margin-top: var(--space-16);
  padding: var(--space-8) 0;
  border-top: 1px solid var(--color-border);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.footer-links a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-links a:hover {
  color: var(--color-accent);
}

.footer-sep {
  color: var(--color-text-muted);
  user-select: none;
}

@media (max-width: 640px) {
  .hero-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-avatar {
    width: 88px;
    height: 88px;
  }

  .hero-name {
    font-size: var(--font-size-2xl);
  }

  .footer-inner {
    flex-direction: column;
    gap: var(--space-2);
    text-align: center;
  }
}
</style>
