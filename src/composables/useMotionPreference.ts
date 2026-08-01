import { readonly, ref } from 'vue'

const storageKey = 'andy.uno.motion'
const savedPreference = readPreference()
const motionDisabled = ref(
  savedPreference ?? matchMedia('(prefers-reduced-motion: reduce)').matches,
)
const readonlyMotionDisabled = readonly(motionDisabled)

function readPreference() {
  try {
    const value = localStorage.getItem(storageKey)
    if (value === 'disabled') return true
    if (value === 'enabled') return false
  } catch {}
  return null
}

function toggleMotion() {
  motionDisabled.value = !motionDisabled.value
  try {
    localStorage.setItem(storageKey, motionDisabled.value ? 'disabled' : 'enabled')
  } catch {}
}

export function useMotionPreference() {
  return {
    motionDisabled: readonlyMotionDisabled,
    toggleMotion,
  }
}
