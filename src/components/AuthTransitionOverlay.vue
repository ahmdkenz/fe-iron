<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useAuthTransition } from '@/composables/useAuthTransition.js'

const { state } = useAuthTransition()

const expanded = ref(false)

const greetingPrefix = computed(() => (state.variant === 'logout' ? 'Sampai jumpa' : 'Halo'))

watch(() => state.active, async active => {
  if (active) {
    expanded.value = false
    await nextTick()
    requestAnimationFrame(() => {
      expanded.value = true
    })
  } else {
    expanded.value = false
  }
})
</script>

<template>
  <div
    v-if="state.active"
    class="atx"
    :class="{
      'atx--expanded': expanded,
      'atx--leaving': state.phase === 'leave',
      'atx--logout': state.variant === 'logout',
    }"
    :style="{ '--atx-ox': `${state.originX}%`, '--atx-oy': `${state.originY}%` }"
  >
    <div class="atx-content">
      <h1 class="atx-greet">
        {{ greetingPrefix }}, {{ state.employeeName }}!
      </h1>
      <p class="atx-status">
        {{ state.statusText }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.atx {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 1.5rem;
  text-align: center;

  background: linear-gradient(135deg, #102b57, #173b73 45%, rgb(var(--v-theme-primary)) 130%);
  background-size: 180% 180%;

  clip-path: circle(0% at var(--atx-ox) var(--atx-oy));
  transition: clip-path 0.7s cubic-bezier(0.65, 0, 0.35, 1);

  animation: atx-drift 6s ease-in-out infinite alternate;
}

.atx--expanded {
  clip-path: circle(150% at var(--atx-ox) var(--atx-oy));
}

.atx--leaving {
  transition:
    clip-path 0.7s cubic-bezier(0.65, 0, 0.35, 1),
    transform 0.6s cubic-bezier(0.6, 0, 0.2, 1) 0.05s;
  transform: translateY(-100%);
}

.atx--logout {
  background: linear-gradient(135deg, #2b0f0f, #5c1414 45%, rgb(var(--v-theme-error)) 130%);
}

/* Logout reveals the page underneath by shrinking back into its origin point
   (mirrors the enter animation in reverse) instead of sliding away. */
.atx--leaving.atx--logout {
  transition: clip-path 0.7s cubic-bezier(0.65, 0, 0.35, 1);
  transform: none;
  clip-path: circle(0% at var(--atx-ox) var(--atx-oy));
}

@keyframes atx-drift {
  from {
    background-position: 20% 30%;
  }

  to {
    background-position: 80% 70%;
  }
}

.atx-content {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: 0.45s;
}

.atx--expanded .atx-content {
  opacity: 1;
  transform: translateY(0);
}

.atx-greet {
  margin: 0 0 0.5rem;

  color: #ffffff;
  font-family: "Inter", sans-serif;
  font-size: clamp(1.6rem, 4vw, 2.75rem);
  font-weight: 800;
}

.atx-status {
  margin: 0;

  color: rgba(255, 255, 255, 0.85);
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
}

@media (prefers-reduced-motion: reduce) {
  .atx {
    animation: none;
    transition-duration: 0.2s;
  }

  .atx--leaving,
  .atx--leaving.atx--logout {
    transition-duration: 0.2s;
  }

  .atx-content {
    transition-delay: 0s;
  }
}
</style>
