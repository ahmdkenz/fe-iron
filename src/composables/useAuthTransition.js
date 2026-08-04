import { reactive } from 'vue'

// Module-level singleton so the transition survives the Login -> Dashboard
// route swap (Login.vue unmounts mid-animation; a local ref would vanish with it).
const state = reactive({
  active: false,
  phase: 'enter', // 'enter' | 'leave'
  variant: 'login', // 'login' | 'logout' — decides palette/greeting/exit motion in AuthTransitionOverlay.vue
  originX: 50,
  originY: 70,
  employeeName: '',
  statusText: '',
})

export function useAuthTransition() {
  function start({ employeeName, originX = 50, originY = 70, statusText = '', variant = 'login' }) {
    state.active = true
    state.phase = 'enter'
    state.variant = variant
    state.employeeName = employeeName
    state.originX = originX
    state.originY = originY
    state.statusText = statusText
  }

  function setStatus(text) {
    state.statusText = text
  }

  function leave() {
    state.phase = 'leave'
  }

  function reset() {
    state.active = false
  }

  return {
    state,
    start,
    setStatus,
    leave,
    reset,
  }
}
