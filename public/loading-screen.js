;(function () {
  var shield    = document.getElementById('iron-shield');
  var brand     = document.getElementById('iron-brand-wrap');
  var container = document.getElementById('loading-container');

  // ── Phase 1: Draw shield outline ──────────────────────────────────────
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      if (shield) shield.classList.add('draw');
    });
  });

  // ── Phase 2: Fill shield facets + glow core ─────────────────────────────
  setTimeout(function () {
    if (shield) shield.classList.add('fill');
  }, 1150);

  // ── Phase 3: Reveal "I.R.O.N" title ─────────────────────────────────────
  setTimeout(function () {
    if (brand) brand.classList.add('iron-visible');
  }, 1350);

  // ── Phase 4: Subtitle scatter-assemble ──────────────────────────────────
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?+=~';
  var TEXT  = 'Intelligent Record of Organization Number';
  var el    = document.getElementById('iron-decrypt');

  function startSubtitle() {
    el.innerHTML = '';
    var charData = [];
    TEXT.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'iron-char';
      if (ch === ' ') {
        span.textContent = ' ';
        span.style.opacity = '1';
      } else {
        span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
        span.style.opacity = '0';
      }
      el.appendChild(span);
      charData.push({ el: span, target: ch, isSpace: ch === ' ' });
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        charData.forEach(function (d) {
          if (d.isSpace) return;
          var rx  = (Math.random() - 0.5) * vw * 1.5;
          var ry  = (Math.random() - 0.5) * vh * 1.3;
          var rot = (Math.random() - 0.5) * 720;
          d.el.style.transform  = 'translate(' + rx + 'px, ' + ry + 'px) rotate(' + rot + 'deg)';
          d.el.style.opacity    = '0.25';
          d.el.style.transition = 'none';
        });

        // ── Assemble after scatter display ──────────────────────────────
        setTimeout(function () {
          var settled   = 0;
          var nonSpaces = charData.filter(function (d) { return !d.isSpace; });
          var total     = nonSpaces.length;

          nonSpaces.forEach(function (d) {
            var delay = Math.random() * 350; // max 350ms stagger

            setTimeout(function () {
              // Fly to natural position
              d.el.style.transition = 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';
              d.el.style.transform  = 'translate(0px, 0px) rotate(0deg)';
              d.el.style.opacity    = '1';

              // Scramble during flight, settle at arrival
              var ticks    = 0;
              var maxTicks = 8;
              var timer = setInterval(function () {
                if (ticks >= maxTicks) {
                  d.el.textContent = d.target;
                  clearInterval(timer);
                  settled++;
                  if (settled >= total) {
                    setTimeout(function () {
                      var div = document.getElementById('iron-divider');
                      if (div) div.classList.add('iron-visible');
                    }, 150);
                  }
                } else {
                  d.el.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
                  ticks++;
                }
              }, 50);

            }, delay);
          });
        }, 300);
      });
    });
  }

  // ── Progress Bar Simulation ─────────────────────────────────────────────
  var fill     = document.getElementById('iron-progress-fill');
  var glow     = document.getElementById('iron-progress-glow');
  var pctEl    = document.getElementById('iron-progress-pct');
  var statusEl = document.getElementById('iron-status');
  var section  = document.getElementById('iron-progress-section');

  var statuses = [
    { at: 5,  text: 'Initializing modules...' },
    { at: 25, text: 'Loading configuration...' },
    { at: 45, text: 'Connecting to services...' },
    { at: 65, text: 'Verifying session...' },
    { at: 82, text: 'Almost ready...' },
  ];

  var progress  = 0;
  var statusIdx = 0;
  var progressTimer = null;

  function startProgress() {
    if (section) section.classList.add('iron-visible');

    progressTimer = setInterval(function () {
      var inc = progress < 50
        ? Math.random() * 7 + 3
        : progress < 75
          ? Math.random() * 4 + 1
          : Math.random() * 1.5 + 0.5;

      progress = Math.min(progress + inc, 90);

      var pct = Math.floor(progress);
      if (fill)  fill.style.width  = pct + '%';
      if (glow)  glow.style.left   = Math.max(0, pct - 4) + '%';
      if (pctEl) pctEl.textContent = pct;

      if (statusIdx < statuses.length && progress >= statuses[statusIdx].at) {
        if (statusEl) statusEl.textContent = statuses[statusIdx].text;
        statusIdx++;
      }

      if (progress >= 90) clearInterval(progressTimer);
    }, 110);
  }

  setTimeout(function () {
    startSubtitle();
    startProgress();
  }, 1650);

  // ── Completion Callback (called by main.js after Vue mount) ────────────
  window.__ironLoadingComplete = function () {
    if (progressTimer) clearInterval(progressTimer);
    progress = 100;

    if (fill) {
      fill.style.transition = 'width 0.35s cubic-bezier(0.4,0,0.2,1)';
      fill.style.width = '100%';
    }
    if (glow)     glow.style.left       = '96%';
    if (pctEl)    pctEl.textContent     = '100';
    if (statusEl) statusEl.textContent  = 'Ready.';

    setTimeout(function () {
      var flash = document.getElementById('iron-flash');
      if (flash) flash.classList.add('iron-active');

      // Swing the gate panels open + fade the content, then unmount.
      if (container) {
        container.classList.add('gates-open');
        setTimeout(function () {
          if (container.parentNode) container.parentNode.removeChild(container);
        }, 1300); // must outlast the 1.2s gate-panel transition
      }
    }, 300);
  };
})();
