/* =========================================================
   Kiran Rai — Birthday Celebration
   Vanilla JavaScript (ES6+), no dependencies.
   ---------------------------------------------------------
   Modules:
     1. Config & helpers      6. Surprise modal
     2. Portrait loading      7. Cake & wish
     3. Background particles  8. Lightbox
     4. Confetti + fireworks  9. Scroll effects (nav, reveal, tilt)
     5. Celebrate button     10. Boot
   ========================================================= */
(() => {
  'use strict';

  /* ---------- 1. Config & helpers ---------- */
  const PHOTO_URL = 'kiran.jpg';
  const GOLDS = ['#D4AF37', '#F5E6B3', '#FFD966', '#FFFFFF', '#B8902B'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /** Sizes a canvas for the screen and returns its 2D context (capped at 2x DPR for speed). */
  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* ---------- 2. Portrait loading ---------- */
  // Checks that the photo exists; shows a monogram fallback if it does not.
  function initPhoto() {
    const probe = new Image();
    probe.onload = () => {
      document.documentElement.style.setProperty('--photo', `url("${PHOTO_URL}")`);
      document.body.classList.add('has-photo');
    };
    probe.onerror = () => document.body.classList.add('no-photo');
    probe.src = PHOTO_URL;
  }

  /* ---------- 3. Floating golden background particles ---------- */
  function initParticles() {
    const canvas = $('#bgParticles');
    let ctx, w, h, parts = [];

    const make = () => ({
      x: rand(0, w), y: rand(0, h), r: rand(.5, 2),
      vx: rand(-.12, .12), vy: -rand(.06, .3),
      phase: rand(0, Math.PI * 2), speed: rand(.01, .03),
    });

    const setup = () => {
      ({ ctx, w, h } = fitCanvas(canvas));
      const count = Math.round(Math.min(80, w / 16));
      parts = Array.from({ length: count }, make);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.phase += p.speed;
        if (p.y < -10) { p.y = h + 10; p.x = rand(0, w); }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const a = .25 + .45 * Math.abs(Math.sin(p.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(245, 230, 179, ${a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath(); // soft halo
        ctx.fillStyle = `rgba(212, 175, 55, ${a * .18})`;
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    };

    setup();
    draw();
    let timer;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(setup, 200); });
  }

  /* ---------- 4. Confetti + fireworks engine ---------- */
  const FX = (() => {
    const confettiCanvas = $('#confettiCanvas');
    const fireCanvas = $('#fireworksCanvas');
    let cctx, fctx, w, h;
    let confetti = [], rockets = [], sparks = [];
    let running = false;
    let confettiUntil = 0;

    const resize = () => {
      ({ ctx: cctx, w, h } = fitCanvas(confettiCanvas));
      ({ ctx: fctx } = fitCanvas(fireCanvas));
    };
    resize();
    let timer;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(resize, 200); });

    /* -- Confetti -- */
    const spawnConfetti = (n, x) => {
      for (let i = 0; i < n; i++) {
        confetti.push({
          x: x ?? rand(0, w), y: rand(-40, -10),
          w: rand(6, 11), h: rand(10, 18),
          vx: rand(-1.2, 1.2), vy: rand(1.6, 4),
          rot: rand(0, Math.PI * 2), vr: rand(-.12, .12),
          flip: rand(0, Math.PI * 2), vf: rand(.05, .16),
          sway: rand(.4, 1.6), color: pick(GOLDS),
        });
      }
    };

    const stepConfetti = () => {
      cctx.clearRect(0, 0, w, h);
      for (let i = confetti.length - 1; i >= 0; i--) {
        const p = confetti[i];
        p.y += p.vy; p.x += p.vx + Math.sin(p.flip) * p.sway;
        p.rot += p.vr; p.flip += p.vf;
        if (p.y > h + 30) { confetti.splice(i, 1); continue; }
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot);
        cctx.scale(1, Math.cos(p.flip));     // fake 3D flutter
        cctx.fillStyle = p.color;
        cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        cctx.restore();
      }
    };

    /* -- Fireworks -- */
    const launch = (x = rand(w * .15, w * .85), ty = rand(h * .15, h * .45)) => {
      rockets.push({ x, y: h + 10, ty, vy: -rand(9, 12), color: pick(GOLDS) });
    };

    const explode = (x, y, color) => {
      const count = Math.round(rand(60, 95));
      const second = pick(GOLDS);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + rand(-.05, .05);
        const speed = rand(1.2, 5.6);
        sparks.push({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, decay: rand(.011, .021), size: rand(1.2, 2.6),
          color: i % 3 === 0 ? second : color,
        });
      }
    };

    const stepFireworks = () => {
      // Fade previous frame to leave glowing trails
      fctx.globalCompositeOperation = 'destination-out';
      fctx.fillStyle = 'rgba(0, 0, 0, .2)';
      fctx.fillRect(0, 0, w, h);
      fctx.globalCompositeOperation = 'lighter';

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy; r.vy *= .985;
        fctx.fillStyle = r.color;
        fctx.beginPath(); fctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2); fctx.fill();
        if (r.y <= r.ty || r.vy > -2.2) { explode(r.x, r.y, r.color); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= .985; s.vy = s.vy * .985 + .045;
        s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        fctx.globalAlpha = s.life;
        fctx.fillStyle = s.color;
        fctx.beginPath(); fctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); fctx.fill();
      }
      fctx.globalAlpha = 1;
    };

    /* -- Shared loop: runs only while something is on screen -- */
    const loop = (now) => {
      if (now < confettiUntil) spawnConfetti(3);
      stepConfetti();
      stepFireworks();
      const busy = confetti.length || rockets.length || sparks.length || now < confettiUntil;
      if (busy) {
        requestAnimationFrame(loop);
      } else {
        running = false;
        cctx.clearRect(0, 0, w, h);
        fctx.clearRect(0, 0, w, h);
      }
    };
    const start = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

    return {
      /** Rain of golden confetti for `ms` milliseconds, plus an initial burst. */
      confetti(ms = 5000, burst = 120) {
        if (reduceMotion) return;
        confettiUntil = performance.now() + ms;
        spawnConfetti(burst);
        start();
      },
      /** Launch `n` fireworks at staggered times. */
      fireworks(n = 6, gap = 380) {
        if (reduceMotion) return;
        for (let i = 0; i < n; i++) setTimeout(() => { launch(); start(); }, i * gap);
      },
      /** Cannon of confetti from a single point (used for the wish). */
      pop(x) { if (!reduceMotion) { spawnConfetti(60, x); start(); } },
    };
  })();

  /* ---------- 6. Surprise modal (opened by the celebrate button) ---------- */
  const Surprise = (() => {
    const modal = $('#surprise');
    const text = $('#surpriseText');
    let lastFocus = null;

    // Split the message into animated words
    const words = text.dataset.text.split(' ');
    text.setAttribute('aria-label', text.dataset.text);
    text.innerHTML = words
      .map((word, i) => `<span class="word" aria-hidden="true" style="--w:${i}">${word}</span>`)
      .join(' ');

    const open = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('is-locked');
      requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
      setTimeout(() => $('.modal__close', modal).focus(), 100);
    };
    const close = () => {
      modal.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(() => { modal.hidden = true; }, 500);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };

    modal.addEventListener('click', (e) => {
      const closer = e.target.closest('[data-close]');
      if (!closer) return;
      const target = closer.dataset.scroll;
      close();
      if (target) setTimeout(() => $(target)?.scrollIntoView({ behavior: 'smooth' }), 350);
    });
    return { open, close, isOpen: () => !modal.hidden };
  })();

  /* ---------- 5. Celebrate button ---------- */
  function initCelebrate() {
    const btn = $('#celebrateBtn');
    btn.addEventListener('click', () => {
      FX.confetti(6000, 160);
      FX.fireworks(7, 360);
      // Let the first fireworks bloom, then reveal the surprise message
      setTimeout(Surprise.open, reduceMotion ? 0 : 1300);
    });
  }

  /* ---------- 7. Cake & wish ---------- */
  function initCake() {
    const cake = $('#cake');
    const wishBtn = $('#wishBtn');
    const relightBtn = $('#relightBtn');
    const reveal = $('#wishReveal');

    wishBtn.addEventListener('click', () => {
      if (cake.classList.contains('is-out')) return;
      cake.classList.add('is-out');            // CSS snuffs the flames out one by one
      wishBtn.disabled = true;
      setTimeout(() => {
        reveal.hidden = false;
        relightBtn.hidden = false;
        reveal.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        FX.confetti(2500, 70);
        FX.fireworks(3, 450);
      }, 1100);
    });

    relightBtn.addEventListener('click', () => {
      cake.classList.remove('is-out');
      reveal.hidden = true;
      relightBtn.hidden = true;
      wishBtn.disabled = false;
      $$('.smoke', cake).forEach((s) => { s.style.animation = 'none'; void s.getBoundingClientRect(); s.style.animation = ''; });
    });
  }

  /* ---------- 8. Lightbox ---------- */
  function initLightbox() {
    const box = $('#lightbox');
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.classList.add('is-locked');
      requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('is-open')));
      setTimeout(() => $('.modal__close', box).focus(), 100);
    };
    const close = () => {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(() => { box.hidden = true; }, 450);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };

    $$('[data-lightbox]').forEach((tile) => {
      tile.addEventListener('click', open);
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
    box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('[data-close]')) close(); });
    return { close, isOpen: () => !box.hidden };
  }

  /* ---------- 9. Scroll effects ---------- */
  function initScrollEffects() {
    // Nav background once the page scrolls
    const nav = $('#nav');
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Reveal-on-scroll
    const revealEls = $$('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    // Highlight the active nav link
    const links = $$('.nav__links a');
    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main section[id]').forEach((s) => spy.observe(s));
    }

    // Gentle 3D tilt on the hero portrait (mouse only)
    const portrait = $('#portrait');
    const frame = $('.portrait__frame', portrait);
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
      portrait.addEventListener('pointermove', (e) => {
        const r = portrait.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        frame.style.setProperty('--ty', `${px * 12}deg`);
        frame.style.setProperty('--tx', `${-py * 12}deg`);
      });
      portrait.addEventListener('pointerleave', () => {
        frame.style.setProperty('--ty', '0deg');
        frame.style.setProperty('--tx', '0deg');
      });
    }
  }

  /* ---------- 10. Boot ---------- */
  function init() {
    initPhoto();
    initParticles();
    initCelebrate();
    initCake();
    const lightbox = initLightbox();
    initScrollEffects();

    // Escape closes whichever overlay is open
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (Surprise.isOpen()) Surprise.close();
      if (lightbox.isOpen()) lightbox.close();
    });

    // Start page-entrance animations, plus a small welcome sparkle
    requestAnimationFrame(() => document.body.classList.remove('is-loading'));
    setTimeout(() => FX.confetti(1800, 40), 1400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
