/* ============================================================================
   Bell Path Group — Interaction layer
   - Scroll-aware floating nav (transparent over hero → solid on scroll)
   - Mobile menu toggle
   - Reveal-on-scroll via IntersectionObserver
   - Smooth, performant hero parallax (rAF + transform only)
   All motion respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     1. Scroll-aware navigation
     -------------------------------------------------------------------- */
  var nav = document.querySelector('[data-nav]');
  var hero = document.querySelector('[data-hero]');

  function syncNav() {
    if (!nav) return;
    // Become "solid" once the user scrolls past most of the hero (or 80px on
    // pages without a full hero, e.g. the About page).
    var threshold = hero ? hero.offsetHeight - 120 : 40;
    if (window.scrollY > threshold) {
      nav.classList.add('nav--solid');
    } else {
      nav.classList.remove('nav--solid');
    }
  }

  /* ----------------------------------------------------------------------
     2. Mobile menu
     -------------------------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var links = document.querySelector('[data-nav-links]');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close the menu when any link/button is tapped.
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ----------------------------------------------------------------------
     3. Reveal-on-scroll
     -------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------------------
     4. Hero parallax — depth via differential transform.
        Each layer carries data-speed; we translate on the Y axis only,
        batched into a single rAF tick so scrolling stays at 60fps.
     -------------------------------------------------------------------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll('.parallax-layer'));
  var ticking = false;

  function renderParallax() {
    var y = window.scrollY;
    for (var i = 0; i < layers.length; i++) {
      var speed = parseFloat(layers[i].getAttribute('data-speed')) || 0;
      // translate3d promotes the layer to its own compositor layer.
      layers[i].style.transform = 'translate3d(0,' + (y * speed).toFixed(2) + 'px,0)';
    }
    ticking = false;
  }

  function onScroll() {
    syncNav();
    if (reduceMotion || layers.length === 0) return;
    if (!ticking) {
      window.requestAnimationFrame(renderParallax);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncNav, { passive: true });

  // Initial paint
  syncNav();
  if (!reduceMotion) renderParallax();

  /* ----------------------------------------------------------------------
     5. Current year in footer
     -------------------------------------------------------------------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
