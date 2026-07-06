<script setup>
// Purely decorative, non-interactive backdrop rendered once at the layout level
// (see DefaultLayoutWithVerticalNav.vue / DefaultLayoutWithHorizontalNav.vue) so it
// appears behind every authenticated page. It reads as an "accounting dashboard":
// a revenue area chart, candlesticks, a bar chart and an expense donut, all coloured
// from the Vuetify theme tokens so it adapts to light/dark and the custom primary colour.
</script>

<template>
  <div
    class="accounting-ambient-backdrop"
    aria-hidden="true"
  >
    <!-- 👉 Graph-paper grid -->
    <div class="accounting-ambient-backdrop__grid" />

    <!-- 👉 Hero revenue area chart (full viewport) -->
    <svg
      class="accounting-ambient-backdrop__trend"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bd-area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop class="area-grad-top" offset="0%" />
          <stop class="area-grad-bottom" offset="100%" />
        </linearGradient>
      </defs>

      <!-- filled area -->
      <path
        class="area-fill"
        d="M0 880
          C213 850, 320 800, 480 815
          C640 830, 746 700, 960 720
          C1173 740, 1280 560, 1440 600
          C1600 640, 1706 450, 1920 430
          L1920 1080 L0 1080 Z"
      />

      <!-- secondary comparison line (dashed) -->
      <path
        class="area-line-2"
        d="M0 960
          C240 950, 420 930, 600 920
          C780 910, 900 890, 1080 880
          C1260 870, 1380 840, 1560 820
          C1740 800, 1860 780, 1920 770"
      />

      <!-- primary revenue line -->
      <path
        class="area-line"
        d="M0 880
          C213 850, 320 800, 480 815
          C640 830, 746 700, 960 720
          C1173 740, 1280 560, 1440 600
          C1600 640, 1706 450, 1920 430"
      />

      <circle class="area-node" cx="480" cy="815" r="6" />
      <circle class="area-node" cx="960" cy="720" r="6" />
      <circle class="area-node" cx="1440" cy="600" r="6" />
      <circle class="area-node" cx="1770" cy="442" r="6" />
    </svg>

    <!-- 👉 Expense donut (top-right) -->
    <svg
      class="accounting-ambient-backdrop__donut"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle class="donut-track" cx="50" cy="50" r="38" pathLength="100" />
      <circle class="donut-seg donut-seg--primary" cx="50" cy="50" r="38" pathLength="100" stroke-dasharray="40 60" stroke-dashoffset="0" />
      <circle class="donut-seg donut-seg--success" cx="50" cy="50" r="38" pathLength="100" stroke-dasharray="25 75" stroke-dashoffset="-40" />
      <circle class="donut-seg donut-seg--warning" cx="50" cy="50" r="38" pathLength="100" stroke-dasharray="20 80" stroke-dashoffset="-65" />
      <circle class="donut-seg donut-seg--error" cx="50" cy="50" r="38" pathLength="100" stroke-dasharray="15 85" stroke-dashoffset="-85" />
    </svg>

    <!-- 👉 Candlesticks (right) -->
    <svg
      class="accounting-ambient-backdrop__chart"
      viewBox="0 0 246 140"
      aria-hidden="true"
    >
      <g class="candle candle--up">
        <line class="candle-wick" x1="18" y1="34" x2="18" y2="108" />
        <rect class="candle-body" x="15" y="52" width="6" height="40" rx="1.5" />
      </g>
      <g class="candle candle--down">
        <line class="candle-wick" x1="48" y1="44" x2="48" y2="116" />
        <rect class="candle-body" x="45" y="60" width="6" height="40" rx="1.5" />
      </g>
      <g class="candle candle--up">
        <line class="candle-wick" x1="78" y1="30" x2="78" y2="104" />
        <rect class="candle-body" x="75" y="46" width="6" height="40" rx="1.5" />
      </g>
      <g class="candle candle--up">
        <line class="candle-wick" x1="108" y1="24" x2="108" y2="98" />
        <rect class="candle-body" x="105" y="38" width="6" height="40" rx="1.5" />
      </g>
      <g class="candle candle--down">
        <line class="candle-wick" x1="138" y1="40" x2="138" y2="112" />
        <rect class="candle-body" x="135" y="54" width="6" height="40" rx="1.5" />
      </g>
      <g class="candle candle--up">
        <line class="candle-wick" x1="168" y1="28" x2="168" y2="100" />
        <rect class="candle-body" x="165" y="42" width="6" height="40" rx="1.5" />
      </g>
      <g class="candle candle--down">
        <line class="candle-wick" x1="198" y1="46" x2="198" y2="118" />
        <rect class="candle-body" x="195" y="60" width="6" height="38" rx="1.5" />
      </g>
      <g class="candle candle--up">
        <line class="candle-wick" x1="228" y1="32" x2="228" y2="104" />
        <rect class="candle-body" x="225" y="46" width="6" height="42" rx="1.5" />
      </g>
    </svg>

    <!-- 👉 Bar chart (bottom-left) -->
    <svg
      class="accounting-ambient-backdrop__bars"
      viewBox="0 0 176 120"
      aria-hidden="true"
    >
      <rect class="bar bar--primary" x="6"   y="66"  width="16" height="54"  rx="3" />
      <rect class="bar bar--info"    x="30"  y="42"  width="16" height="78"  rx="3" />
      <rect class="bar bar--success" x="54"  y="80"  width="16" height="40"  rx="3" />
      <rect class="bar bar--primary" x="78"  y="28"  width="16" height="92"  rx="3" />
      <rect class="bar bar--warning" x="102" y="56"  width="16" height="64"  rx="3" />
      <rect class="bar bar--info"    x="126" y="16"  width="16" height="104" rx="3" />
      <rect class="bar bar--success" x="150" y="72"  width="16" height="48"  rx="3" />
    </svg>

    <!-- 👉 Floating figures -->
    <span class="accounting-ambient-backdrop__figure accounting-ambient-backdrop__figure--one">Rp 84,71 jt</span>
    <span class="accounting-ambient-backdrop__figure accounting-ambient-backdrop__figure--two">Rp 26.417 K</span>
    <span class="accounting-ambient-backdrop__figure accounting-ambient-backdrop__figure--three">+12,4%</span>
  </div>
</template>

<style scoped lang="scss">
.accounting-ambient-backdrop {
  position: fixed;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  // 👉 structure
  --bd-grid: rgba(var(--v-theme-on-surface), 0.07);
  --bd-grid-strong: rgba(var(--v-theme-on-surface), 0.11);

  // 👉 line + fill strengths (VIVID)
  --bd-line-op: 0.55;
  --bd-line-2-op: 0.4;
  --bd-fill-top-op: 0.24;
  --bd-fill-bot-op: 0;
  --bd-body-op: 0.28;
  --bd-bar-op: 0.42;
  --bd-donut-op: 0.62;
  --bd-figure-op: 0.5;
}

:global(.v-theme--dark) .accounting-ambient-backdrop {
  --bd-grid: rgba(var(--v-theme-on-surface), 0.09);
  --bd-grid-strong: rgba(var(--v-theme-on-surface), 0.14);

  --bd-line-op: 0.68;
  --bd-line-2-op: 0.5;
  --bd-fill-top-op: 0.3;
  --bd-body-op: 0.34;
  --bd-bar-op: 0.5;
  --bd-donut-op: 0.72;
  --bd-figure-op: 0.6;
}

/* ---------------------------------------------------------------- grid */
.accounting-ambient-backdrop__grid {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, var(--bd-grid) 0 1px, transparent 1px 40px),
    repeating-linear-gradient(90deg, var(--bd-grid) 0 1px, transparent 1px 40px),
    repeating-linear-gradient(0deg, var(--bd-grid-strong) 0 1.5px, transparent 1.5px 160px),
    repeating-linear-gradient(90deg, var(--bd-grid-strong) 0 1.5px, transparent 1.5px 160px);
  animation: grid-pulse 12s ease-in-out infinite alternate;
}

/* --------------------------------------------------------- area chart */
.accounting-ambient-backdrop__trend {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
}

.area-grad-top {
  stop-color: rgb(var(--v-theme-primary));
  stop-opacity: var(--bd-fill-top-op);
}

.area-grad-bottom {
  stop-color: rgb(var(--v-theme-primary));
  stop-opacity: var(--bd-fill-bot-op);
}

.area-fill {
  fill: url(#bd-area-gradient);
  stroke: none;
}

.area-line {
  fill: none;
  stroke: rgba(var(--v-theme-primary), var(--bd-line-op));
  stroke-width: 2.25;
  stroke-linecap: round;
  animation: line-breathe 9s ease-in-out infinite;
}

.area-line-2 {
  fill: none;
  stroke: rgba(var(--v-theme-info), var(--bd-line-2-op));
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-dasharray: 10 9;
  animation: line-breathe 11s ease-in-out infinite;
  animation-delay: 1.5s;
}

.area-node {
  fill: rgba(var(--v-theme-primary), var(--bd-line-op));
  transform-box: fill-box;
  transform-origin: center;
  animation: node-blink 4s ease-in-out infinite;
}

.area-node:nth-of-type(2) { animation-delay: 1s; }
.area-node:nth-of-type(3) { animation-delay: 2s; }
.area-node:nth-of-type(4) { animation-delay: 3s; }

/* -------------------------------------------------------------- donut */
.accounting-ambient-backdrop__donut {
  position: absolute;
  inset-block-start: 6%;
  inset-inline-end: 4%;
  inline-size: clamp(120px, 10vw, 180px);
  block-size: auto;
  transform: rotate(-90deg);
  animation: donut-spin 120s linear infinite;
}

.donut-track {
  fill: none;
  stroke: rgba(var(--v-theme-on-surface), 0.08);
  stroke-width: 12;
}

.donut-seg {
  fill: none;
  stroke-width: 12;
  stroke-linecap: butt;
}

.donut-seg--primary { stroke: rgba(var(--v-theme-primary), var(--bd-donut-op)); }
.donut-seg--success { stroke: rgba(var(--v-theme-success), var(--bd-donut-op)); }
.donut-seg--warning { stroke: rgba(var(--v-theme-warning), var(--bd-donut-op)); }
.donut-seg--error   { stroke: rgba(var(--v-theme-error), var(--bd-donut-op)); }

/* -------------------------------------------------------- candlesticks */
.accounting-ambient-backdrop__chart {
  position: absolute;
  inset-block-start: 28%;
  inset-inline-end: 5%;
  inline-size: clamp(180px, 16vw, 260px);
  block-size: auto;
}

.candle--up { --candle-color: var(--v-theme-success); }
.candle--down { --candle-color: var(--v-theme-error); }

.candle-wick {
  stroke: rgba(var(--candle-color), var(--bd-line-op));
  stroke-width: 1.5;
}

.candle-body {
  fill: rgba(var(--candle-color), var(--bd-body-op));
  stroke: rgba(var(--candle-color), var(--bd-line-op));
  stroke-width: 1.5;
  transform-box: fill-box;
  transform-origin: bottom;
  animation: candle-breathe 6s ease-in-out infinite;
}

.candle:nth-of-type(2) .candle-body { animation-delay: 0.4s; }
.candle:nth-of-type(3) .candle-body { animation-delay: 0.8s; }
.candle:nth-of-type(4) .candle-body { animation-delay: 1.2s; }
.candle:nth-of-type(5) .candle-body { animation-delay: 1.6s; }
.candle:nth-of-type(6) .candle-body { animation-delay: 2s; }
.candle:nth-of-type(7) .candle-body { animation-delay: 2.4s; }
.candle:nth-of-type(8) .candle-body { animation-delay: 2.8s; }

/* ---------------------------------------------------------- bar chart */
.accounting-ambient-backdrop__bars {
  position: absolute;
  inset-block-end: 7%;
  inset-inline-start: 4%;
  inline-size: clamp(160px, 14vw, 220px);
  block-size: auto;
}

.bar {
  transform-box: fill-box;
  transform-origin: bottom;
  animation: bar-grow 7s ease-in-out infinite;
}

.bar--primary { fill: rgba(var(--v-theme-primary), var(--bd-bar-op)); }
.bar--info    { fill: rgba(var(--v-theme-info), var(--bd-bar-op)); }
.bar--success { fill: rgba(var(--v-theme-success), var(--bd-bar-op)); }
.bar--warning { fill: rgba(var(--v-theme-warning), var(--bd-bar-op)); }

.bar:nth-of-type(2) { animation-delay: 0.3s; }
.bar:nth-of-type(3) { animation-delay: 0.6s; }
.bar:nth-of-type(4) { animation-delay: 0.9s; }
.bar:nth-of-type(5) { animation-delay: 1.2s; }
.bar:nth-of-type(6) { animation-delay: 1.5s; }
.bar:nth-of-type(7) { animation-delay: 1.8s; }

/* ------------------------------------------------------------ figures */
.accounting-ambient-backdrop__figure {
  position: absolute;
  color: rgba(var(--v-theme-primary), var(--bd-figure-op));
  font-size: clamp(1.5rem, 2.6vw, 2.9rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  animation: figure-float 12s ease-in-out infinite;
}

.accounting-ambient-backdrop__figure--one {
  inset-block-start: 9%;
  inset-inline-start: 5%;
}

.accounting-ambient-backdrop__figure--two {
  inset-block-start: 46%;
  inset-inline-start: 3%;
  font-size: clamp(1.15rem, 1.9vw, 2rem);
  animation-duration: 14s;
  animation-delay: 2s;
}

.accounting-ambient-backdrop__figure--three {
  inset-block-end: 24%;
  inset-inline-start: 40%;
  color: rgba(var(--v-theme-success), var(--bd-figure-op));
  font-size: clamp(1.25rem, 2.1vw, 2.15rem);
  animation-duration: 13s;
  animation-delay: 1s;
}

/* --------------------------------------------------------- keyframes */
@keyframes grid-pulse {
  from { opacity: 0.75; }
  to { opacity: 1; }
}

@keyframes line-breathe {
  0%, 100% {
    opacity: 0.9;
    stroke-width: 2.25;
  }
  50% {
    opacity: 1;
    stroke-width: 2.6;
  }
}

@keyframes node-blink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.5);
  }
}

@keyframes candle-breathe {
  0%, 100% { transform: scaleY(1); }
  40% { transform: scaleY(1.08); }
  70% { transform: scaleY(0.96); }
}

@keyframes bar-grow {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.9); }
}

@keyframes donut-spin {
  from { transform: rotate(-90deg); }
  to { transform: rotate(270deg); }
}

@keyframes figure-float {
  0%, 100% {
    opacity: 0.9;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .accounting-ambient-backdrop__grid,
  .area-line,
  .area-line-2,
  .area-node,
  .accounting-ambient-backdrop__donut,
  .candle-body,
  .bar,
  .accounting-ambient-backdrop__figure {
    animation: none;
  }
}

@media print {
  .accounting-ambient-backdrop {
    display: none;
  }
}
</style>
