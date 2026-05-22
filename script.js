/* =========================================================
   Rakesh L — QA Portfolio · Flagship interactions
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const ls = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== year =====
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
  const root = document.documentElement;

  // ===== mobile nav =====
  const nav = $('#nav');
  $('.nav-toggle')?.addEventListener('click', () => nav.classList.toggle('open'));
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  // ===== scroll progress + nav scrolled state + active nav link =====
  const progress = $('#scroll-progress');
  const sections = $$('section[id], header[id]');
  const navLinks = $$('.nav-links a');
  const updateScroll = () => {
    const sc = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = ((sc / Math.max(1, max)) * 100) + '%';
    nav.classList.toggle('scrolled', sc > 8);
    // active link
    let cur = sections[0]?.id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= 120) cur = s.id;
    }
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + cur));
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  // ===== reveal on scroll (safe — adds .anim-up only when JS runs, so no FOUC if JS fails) =====
  if (!prefersReduced) {
    const animEls = $$('.bento-card, .stack-card, .timeline li, .c-card, .stat, .lab');
    animEls.forEach(el => el.classList.add('anim-up'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    animEls.forEach(el => io.observe(el));
    // safety net: after 2s mark everything in (so cards always become visible)
    setTimeout(() => animEls.forEach(el => el.classList.add('in')), 2000);
  }

  // ===== bento cards: spotlight follow mouse =====
  $$('.bento-card').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  // ===== custom cursor + magnetic buttons (flagship) =====
  (() => {
    const cd = $('#cursor-dot'), cr = $('#cursor-ring');
    if (!cd || !cr) return;
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    // pointer + smoothed positions
    let mx = innerWidth / 2, my = innerHeight / 2; // raw
    let rx = mx, ry = my;                           // ring (lerped)
    let dx = mx, dy = my;                           // dot  (lerped, faster)

    // trail particles
    const trail = [];
    const TRAIL_N = 5;
    for (let i = 0; i < TRAIL_N; i++) {
      const t = document.createElement('div');
      t.className = 'cursor-trail';
      t.style.opacity = String(0.28 - i * 0.05);
      document.body.appendChild(t);
      trail.push({ el: t, x: mx, y: my });
    }

    // state
    let stuckEl = null;          // element we're sticking to
    let stuckRect = null;
    let labelText = '';
    let invert = false;

    const HOVER_SEL = 'a, button, input, textarea, select, [data-magnetic], [data-cursor]';

    const setLabel = (txt) => {
      labelText = txt || '';
      cr.textContent = labelText;
      cr.classList.toggle('label', !!labelText);
    };

    // pointermove
    window.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;

      const t = e.target;
      // inputs → hide cursor so native I-beam shows
      const isText = t.matches && t.matches('input:not([type="range"]):not([type="checkbox"]):not([type="number"]), textarea, [contenteditable="true"]');
      cd.classList.toggle('hide', !!isText);
      cr.classList.toggle('hide', !!isText);

      // find nearest cursor-relevant element
      const target = t.closest ? t.closest(HOVER_SEL) : null;

      // invert mode (over dark sections)
      const dark = t.closest ? t.closest('[data-cursor-invert]') : null;
      const newInvert = !!dark;
      if (newInvert !== invert) {
        invert = newInvert;
        cr.classList.toggle('invert', invert);
        cd.classList.toggle('invert', invert);
      }

      if (target) {
        cr.classList.add('hover');
        // pick up data-cursor label (from target or any ancestor with data-cursor)
        const labelHost = t.closest('[data-cursor]');
        const lbl = labelHost ? labelHost.getAttribute('data-cursor') : '';

        // bug arena → "grab" style
        const isGrab = target.id === 'bug-arena' || (target.closest && target.closest('#bug-arena'));
        cr.classList.toggle('grab', !!isGrab);

        setLabel(lbl);

        // sticky for solid buttons/links with bounded size
        const stickable = target.matches('a, button, [data-magnetic]') && !target.matches('#bug-arena, .bento, .bento *');
        if (stickable) {
          stuckEl = target;
          stuckRect = target.getBoundingClientRect();
        } else {
          stuckEl = null; stuckRect = null;
        }
      } else {
        cr.classList.remove('hover', 'grab');
        setLabel('');
        stuckEl = null; stuckRect = null;
      }
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      cd.classList.add('hide'); cr.classList.add('hide');
    });
    window.addEventListener('pointerenter', () => {
      cd.classList.remove('hide'); cr.classList.remove('hide');
    });

    // click ripple
    window.addEventListener('pointerdown', e => {
      const r = document.createElement('div');
      r.className = 'cursor-ripple';
      if (invert) r.style.borderColor = 'var(--bg)';
      r.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 560);
      // squeeze the ring
      cr.style.transform += ' scale(.85)';
      setTimeout(() => { /* reset handled by loop */ }, 120);
    });

    // RAF loop
    const loop = () => {
      // dot — fast follow
      dx += (mx - dx) * 0.45;
      dy += (my - dy) * 0.45;
      cd.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;

      // ring — slower; if stuck to an element, blend toward its center + slight magnetism toward pointer
      let tx = mx, ty = my;
      if (stuckEl && stuckRect && document.contains(stuckEl)) {
        // refresh rect (cheap-ish, only when stuck)
        stuckRect = stuckEl.getBoundingClientRect();
        const cx = stuckRect.left + stuckRect.width / 2;
        const cy = stuckRect.top + stuckRect.height / 2;
        // ring sticks to center, plus ~30% pull toward the cursor — feels alive
        tx = cx + (mx - cx) * 0.30;
        ty = cy + (my - cy) * 0.30;
      }
      rx += (tx - rx) * 0.22;
      ry += (ty - ry) * 0.22;
      cr.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;

      // trail — each particle lerps toward the previous one (chain)
      let px = dx, py = dy;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        p.x += (px - p.x) * (0.32 - i * 0.04);
        p.y += (py - p.y) * (0.32 - i * 0.04);
        p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        px = p.x; py = p.y;
      }
      requestAnimationFrame(loop);
    };
    loop();

    // magnetic pull on elements
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dxm = e.clientX - (r.left + r.width / 2);
        const dym = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dxm * 0.20}px, ${dym * 0.24}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  })();

  // ===== CI/CD Pipeline (flagship, QA-themed background) =====
  // Left: 3 devs at workstations — cute bugs crawl out of their monitors.
  // Pipeline: UNIT (kills ~20%) → QA ENV (kills 99%, only stealth survive)
  // → STAGE (sentinels with lasers finish off any stealth bugs).
  // PROD line on the far right stays clean. Cursor can still squash any bug.
  (() => {
    const c = $('#bg-canvas');
    if (!c || prefersReduced) return;
    const ctx = c.getContext('2d');
    let w, h, dpr;

    // ---- palettes ----
    const ACCENT = '24, 169, 87';
    const FAIL   = '255, 90, 54';
    const INK    = '10, 10, 12';
    const SPECIES = {
      ladybug:    { primary: '#ef4444', secondary: '#0a0a0c', accent: '#fff1f1', size: 7,   speed: [0.30, 0.55] },
      bee:        { primary: '#fbbf24', secondary: '#0a0a0c', accent: '#fff7d1', size: 6.5, speed: [0.55, 0.95] },
      caterpillar:{ primary: '#22c55e', secondary: '#15803d', accent: '#bbf7d0', size: 5.5, speed: [0.25, 0.45] },
      butterfly:  { primary: '#a855f7', secondary: '#ec4899', accent: '#fce7f3', size: 7.5, speed: [0.45, 0.80] }
    };
    const SPECIES_KEYS = Object.keys(SPECIES);

    const bugs = [];
    const lasers = [];        // {x1,y1,x2,y2,t0,life,color}
    const confetti = [];      // {x,y,vx,vy,life,t0,color,size}
    const trail = [];
    const sentinels = [];

    const MAX_BUGS = 12;
    const SQUASH_R = 70;
    const PROD_X_FRAC = 0.94;
    let prodFlashT = 0;
    let killCount = 0;
    let leakCount = 0;
    let stealthKills = 0;
    let bugsSpawned = 0;

    let mx = -9999, my = -9999;
    let mLast = { x: 0, y: 0, t: 0 };

    // gates + devs
    let gates = [];
    let devs  = [];

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = innerWidth, H = innerHeight;
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = W; h = H;
      gates = [
        // p = kill probability for *non-stealth* bugs;
        // stealthP = override for stealth bugs (lower = more survive)
        { x: W * 0.38, label: 'UNIT',   p: 0.20, stealthP: 0.15, color: '#0ea5e9' },
        { x: W * 0.60, label: 'QA ENV', p: 1.00, stealthP: 0.55, color: '#f97316' },
        { x: W * 0.80, label: 'STAGE',  p: 1.00, stealthP: 1.00, color: '#a855f7' }
      ];
      // devs at left edge (3 workstations)
      const devY = [H * 0.30, H * 0.55, H * 0.78];
      const devColors = [
        { shirt: '#2563eb', hair: '#1e293b', skin: '#fcd9b6' },
        { shirt: '#10b981', hair: '#7c2d12', skin: '#fde2b8' },
        { shirt: '#ef4444', hair: '#0a0a0c', skin: '#f7d1a8' }
      ];
      devs = [];
      for (let i = 0; i < 3; i++) {
        devs.push({
          x: 78, y: devY[i],
          color: devColors[i],
          typePhase: Math.random() * Math.PI * 2,
          spawnT: 0,
          screenGlow: 0
        });
      }
      // 3 sentinels in front of STAGE gate (not PROD)
      const stageX = W * 0.80;
      const sentY = [H * 0.28, H * 0.55, H * 0.80];
      const sentColor = ['#0ea5e9', '#18a957', '#f97316'];
      sentinels.length = 0;
      for (let i = 0; i < 3; i++) {
        sentinels.push({
          x: stageX - 30, y: sentY[i],
          color: sentColor[i], aim: Math.PI,
          lastFire: 0, charge: 0
        });
      }
    };

    const spawnBug = () => {
      if (bugs.length >= MAX_BUGS) return;
      if (!devs.length) return;
      const speciesKey = SPECIES_KEYS[(Math.random() * SPECIES_KEYS.length) | 0];
      const sp = SPECIES[speciesKey];
      // spawn from a random dev's monitor
      const dev = devs[(Math.random() * devs.length) | 0];
      dev.screenGlow = performance.now();
      const x = dev.x + 28;
      const y = dev.y - 6 + (Math.random() - 0.5) * 8;
      bugsSpawned++;
      bugs.push({
        species: speciesKey,
        x, y,
        vx: sp.speed[0] + Math.random() * (sp.speed[1] - sp.speed[0]),
        vy: (Math.random() - 0.5) * 0.18,
        phase: Math.random() * Math.PI * 2,
        wiggleAmp: 0.4 + Math.random() * 0.7,
        size: sp.size * (0.85 + Math.random() * 0.35),
        flapPhase: Math.random() * Math.PI * 2,
        state: 'crawling',
        dieT: 0,
        passedGates: new Set(),
        targeted: false,
        stealth: Math.random() < 0.32
      });
    };

    const spawnLoop = () => {
      spawnBug();
      setTimeout(spawnLoop, 800 + Math.random() * 1400);
    };
    setTimeout(spawnLoop, 600);

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      const now = performance.now();
      if (now - mLast.t > 16) {
        trail.push({ x: mx, y: my, t: now });
        if (trail.length > 18) trail.shift();
        mLast = { x: mx, y: my, t: now };
      }
    }, { passive: true });
    window.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });
    window.addEventListener('pointerdown', (e) => {
      for (const b of bugs) {
        if (b.state !== 'crawling') continue;
        const dx = b.x - e.clientX, dy = b.y - e.clientY;
        if (dx*dx + dy*dy < 110*110) killBug(b, 'squash');
      }
    });

    const killBug = (b, mode, color) => {
      if (b.state !== 'crawling') return;
      b.state = 'dying';
      b.dieT = performance.now();
      b.killMode = mode;
      const sp = SPECIES[b.species];
      const palette = [sp.primary, sp.secondary, sp.accent, color || sp.primary];
      const n = mode === 'leak' ? 18 : 14;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.0 + Math.random() * 2.6;
        confetti.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.8,
          t0: performance.now(),
          life: 600 + Math.random() * 380,
          color: palette[(Math.random() * palette.length) | 0],
          size: 1.4 + Math.random() * 2.2,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3
        });
      }
      if (mode === 'leak') { prodFlashT = performance.now(); leakCount++; }
      else { killCount++; if (b.stealth) stealthKills++; }
    };

    // ---- bug drawers ----
    const drawLadybug = (b, now) => {
      const sp = SPECIES.ladybug;
      const s = b.size;
      const legPhase = now / 70 + b.phase;
      ctx.save(); ctx.translate(b.x, b.y);
      // legs
      ctx.strokeStyle = sp.secondary; ctx.lineWidth = 1; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        const off = i * s * 0.45;
        const sw = Math.sin(legPhase + i * 1.3) * s * 0.5;
        ctx.beginPath();
        ctx.moveTo(off, -s * 0.3); ctx.lineTo(off + sw * 0.3, -s * 1.1); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(off,  s * 0.3); ctx.lineTo(off - sw * 0.3,  s * 1.1); ctx.stroke();
      }
      // body dome
      ctx.fillStyle = sp.primary;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.4, s * 1.05, 0, 0, Math.PI * 2); ctx.fill();
      // center line
      ctx.strokeStyle = sp.secondary; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-s * 1.0, 0); ctx.lineTo(s * 0.9, 0); ctx.stroke();
      // spots
      ctx.fillStyle = sp.secondary;
      [[-0.5, -0.45], [-0.5, 0.45], [0.3, -0.45], [0.3, 0.45]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.22, 0, Math.PI * 2); ctx.fill();
      });
      // head
      ctx.fillStyle = sp.secondary;
      ctx.beginPath(); ctx.arc(s * 1.25, 0, s * 0.55, 0, Math.PI * 2); ctx.fill();
      // shine
      ctx.fillStyle = sp.accent;
      ctx.beginPath(); ctx.arc(-s * 0.5, -s * 0.55, s * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawBee = (b, now) => {
      const sp = SPECIES.bee;
      const s = b.size;
      const legPhase = now / 60 + b.phase;
      const wingPhase = now / 30 + b.flapPhase;
      ctx.save(); ctx.translate(b.x, b.y);
      // legs (small)
      ctx.strokeStyle = sp.secondary; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        const off = i * s * 0.4;
        const sw = Math.sin(legPhase + i) * s * 0.3;
        ctx.beginPath(); ctx.moveTo(off, -s * 0.35); ctx.lineTo(off + sw * 0.2, -s * 0.95); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(off,  s * 0.35); ctx.lineTo(off - sw * 0.2,  s * 0.95); ctx.stroke();
      }
      // wings (flapping)
      const wingY = Math.abs(Math.sin(wingPhase)) * s * 0.4 + s * 0.4;
      ctx.fillStyle = 'rgba(180, 220, 255, 0.55)';
      ctx.beginPath(); ctx.ellipse(-s * 0.1, -wingY, s * 0.7, s * 0.4, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-s * 0.1,  wingY, s * 0.7, s * 0.4,  0.3, 0, Math.PI * 2); ctx.fill();
      // body
      ctx.fillStyle = sp.primary;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.3, s * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      // stripes
      ctx.fillStyle = sp.secondary;
      for (const sx of [-0.4, 0.2]) {
        ctx.beginPath();
        ctx.ellipse(sx * s, 0, s * 0.18, s * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // head
      ctx.fillStyle = sp.secondary;
      ctx.beginPath(); ctx.arc(s * 1.15, 0, s * 0.5, 0, Math.PI * 2); ctx.fill();
      // eye
      ctx.fillStyle = sp.accent;
      ctx.beginPath(); ctx.arc(s * 1.3, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
      // stinger
      ctx.fillStyle = sp.secondary;
      ctx.beginPath();
      ctx.moveTo(-s * 1.3, 0); ctx.lineTo(-s * 1.7, -s * 0.15); ctx.lineTo(-s * 1.7, s * 0.15);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    const drawCaterpillar = (b, now) => {
      const sp = SPECIES.caterpillar;
      const s = b.size;
      const wave = now / 140 + b.phase;
      ctx.save(); ctx.translate(b.x, b.y);
      // 5 segments along motion (backward)
      for (let i = 4; i >= 0; i--) {
        const seg = i * s * 1.05;
        const yOff = Math.sin(wave + i * 0.7) * s * 0.35;
        ctx.fillStyle = i % 2 === 0 ? sp.primary : sp.secondary;
        ctx.beginPath(); ctx.arc(-seg, yOff, s * 0.75, 0, Math.PI * 2); ctx.fill();
        // legs underneath
        if (i > 0) {
          ctx.strokeStyle = sp.secondary; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-seg, yOff + s * 0.6); ctx.lineTo(-seg, yOff + s * 1.1); ctx.stroke();
        }
      }
      // head (front)
      ctx.fillStyle = sp.primary;
      ctx.beginPath(); ctx.arc(s * 0.4, Math.sin(wave) * s * 0.2, s * 0.95, 0, Math.PI * 2); ctx.fill();
      // eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s * 0.8, -s * 0.25, s * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.8,  s * 0.05, s * 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(s * 0.88, -s * 0.25, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.88,  s * 0.05, s * 0.08, 0, Math.PI * 2); ctx.fill();
      // antennae
      ctx.strokeStyle = sp.secondary; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(s * 0.7, -s * 0.7); ctx.lineTo(s * 1.0, -s * 1.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.7,  s * 0.5); ctx.lineTo(s * 1.0,  s * 1.05); ctx.stroke();
      ctx.restore();
    };

    const drawButterfly = (b, now) => {
      const sp = SPECIES.butterfly;
      const s = b.size;
      const flap = Math.sin(now / 90 + b.flapPhase);   // -1..1
      ctx.save(); ctx.translate(b.x, b.y);
      // wings
      const wScale = 0.5 + Math.abs(flap) * 0.7;
      ctx.fillStyle = sp.primary;
      ctx.beginPath();
      ctx.ellipse(-s * 0.2, -s * 0.7 * wScale, s * 0.95, s * 1.05 * wScale, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-s * 0.2,  s * 0.7 * wScale, s * 0.95, s * 1.05 * wScale,  0.5, 0, Math.PI * 2);
      ctx.fill();
      // lower wing
      ctx.fillStyle = sp.secondary;
      ctx.beginPath();
      ctx.ellipse(-s * 0.6, -s * 0.55 * wScale, s * 0.55, s * 0.7 * wScale, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-s * 0.6,  s * 0.55 * wScale, s * 0.55, s * 0.7 * wScale,  0.5, 0, Math.PI * 2);
      ctx.fill();
      // wing dots
      ctx.fillStyle = sp.accent;
      ctx.beginPath(); ctx.arc(s * 0.1, -s * 0.7 * wScale, s * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.1,  s * 0.7 * wScale, s * 0.2, 0, Math.PI * 2); ctx.fill();
      // body
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.2, s * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      // head
      ctx.beginPath(); ctx.arc(s * 1.2, 0, s * 0.35, 0, Math.PI * 2); ctx.fill();
      // antennae
      ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s * 1.4, -s * 0.2); ctx.lineTo(s * 1.85, -s * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 1.4,  s * 0.2); ctx.lineTo(s * 1.85,  s * 0.7); ctx.stroke();
      ctx.restore();
    };

    const DRAWERS = {
      ladybug: drawLadybug, bee: drawBee,
      caterpillar: drawCaterpillar, butterfly: drawButterfly
    };

    // QA sentinel (cute little operator with laser gun)
    const drawSentinel = (s, now) => {
      const x = s.x, y = s.y;
      const charging = s.charge > 0;
      ctx.save();
      // base shadow
      ctx.fillStyle = 'rgba(10,10,12,0.10)';
      ctx.beginPath(); ctx.ellipse(x, y + 18, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
      // body (rounded)
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.roundRect(x - 7, y - 4, 14, 18, 4);
      ctx.fill();
      // head
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath(); ctx.arc(x, y - 10, 7, 0, Math.PI * 2); ctx.fill();
      // QA cap
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(x, y - 13, 7, Math.PI, 0); ctx.fill();
      ctx.fillRect(x - 7, y - 13, 14, 2);
      // visor / "Q" badge
      ctx.fillStyle = INK;
      ctx.font = '700 6px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText('QA', x - 5, y - 11);
      // eyes
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x - 2.2, y - 9, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 2.2, y - 9, 0.9, 0, Math.PI * 2); ctx.fill();
      // laser gun (rotates with aim)
      ctx.save();
      ctx.translate(x, y + 2);
      ctx.rotate(s.aim);
      ctx.fillStyle = '#1f2937';
      ctx.beginPath(); ctx.roundRect(0, -2.2, 14, 4.4, 2); ctx.fill();
      // muzzle glow
      const glowA = charging ? Math.min(1, s.charge / 200) : 0;
      if (glowA > 0) {
        ctx.fillStyle = `rgba(${ACCENT}, ${glowA})`;
        ctx.beginPath(); ctx.arc(15, 0, 3 + glowA * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    };

    const drawCheck = (x, y, sz, alpha) => {
      ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x - sz, y);
      ctx.lineTo(x - sz * 0.25, y + sz * 0.75);
      ctx.lineTo(x + sz, y - sz * 0.65);
      ctx.stroke();
    };

    // ---- cute developer at workstation ----
    const drawDev = (d, now) => {
      const x = d.x, y = d.y;
      const type = Math.sin(now / 90 + d.typePhase);   // -1..1, typing motion
      const glow = Math.max(0, 1 - (now - d.screenGlow) / 350);
      ctx.save();
      // chair/desk shadow
      ctx.fillStyle = 'rgba(10,10,12,0.10)';
      ctx.beginPath(); ctx.ellipse(x, y + 24, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
      // monitor stand
      ctx.fillStyle = '#374151';
      ctx.fillRect(x + 12, y + 8, 4, 12);
      ctx.fillRect(x + 6, y + 19, 16, 3);
      // monitor (rounded rect)
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath(); ctx.roundRect(x + 2, y - 14, 24, 22, 3); ctx.fill();
      // screen (glowing on spawn)
      const screenCol = glow > 0
        ? `rgba(34, 197, 94, ${0.55 + glow * 0.45})`
        : 'rgba(34, 197, 94, 0.40)';
      ctx.fillStyle = screenCol;
      ctx.fillRect(x + 4, y - 12, 20, 18);
      // code lines on screen
      ctx.fillStyle = 'rgba(10,10,12,0.75)';
      ctx.fillRect(x + 6, y - 10, 6 + (type * 2 + 2), 1.4);
      ctx.fillRect(x + 6, y - 7,  10, 1.4);
      ctx.fillRect(x + 6, y - 4,  4 + (type * 3 + 3), 1.4);
      ctx.fillRect(x + 6, y - 1,  12, 1.4);
      ctx.fillRect(x + 6, y + 2,  6 + (type * 2 + 2), 1.4);
      // dev (behind monitor)
      // body
      ctx.fillStyle = d.color.shirt;
      ctx.beginPath();
      ctx.roundRect(x - 14, y - 4, 14, 18, 4);
      ctx.fill();
      // head
      ctx.fillStyle = d.color.skin;
      ctx.beginPath(); ctx.arc(x - 7, y - 12, 6.5, 0, Math.PI * 2); ctx.fill();
      // hair (top cap)
      ctx.fillStyle = d.color.hair;
      ctx.beginPath();
      ctx.arc(x - 7, y - 14, 6.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(x - 13, y - 14, 12, 2);
      // eyes (looking at screen)
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath(); ctx.arc(x - 4.5, y - 11, 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 9.0, y - 11, 0.8, 0, Math.PI * 2); ctx.fill();
      // typing arm (animated)
      ctx.strokeStyle = d.color.skin;
      ctx.lineWidth = 3.6; ctx.lineCap = 'round';
      const armY = y + 4 + type * 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 2);
      ctx.lineTo(x + 4, armY);
      ctx.stroke();
      // keyboard hint (under monitor)
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(x + 2, y + 23, 22, 2);
      ctx.restore();
    };

    // pipeline funnel label between gates (small caption)
    const drawFunnel = (x1, x2, label, color, yPos) => {
      const cx = (x1 + x2) / 2;
      ctx.font = '600 8px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillStyle = color + 'aa';
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, cx - tw / 2, yPos);
    };

    // ---- main loop ----
    const tick = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, w, h);

      const prodX = w * PROD_X_FRAC;

      // ---- devs (left side) ----
      for (const d of devs) drawDev(d, now);

      // ---- gates (vivid colored test stations) ----
      ctx.setLineDash([6, 6]);
      for (const g of gates) {
        // line (semi-transparent colored)
        ctx.strokeStyle = g.color + '88';      // ~53% alpha hex
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(g.x, 110); ctx.lineTo(g.x, h - 30); ctx.stroke();
        // label pill at top
        ctx.setLineDash([]);
        const txt = g.label;
        ctx.font = '700 11px ui-monospace, "JetBrains Mono", monospace';
        const tw = ctx.measureText(txt).width;
        const px = g.x - tw / 2 - 8, py = 76;
        // pill bg
        ctx.fillStyle = g.color;
        ctx.beginPath(); ctx.roundRect(px, py, tw + 16, 18, 9); ctx.fill();
        // label
        ctx.fillStyle = '#ffffff';
        ctx.fillText(txt, px + 8, py + 13);
        // small "GATE" caption below
        ctx.fillStyle = g.color + 'aa';
        ctx.font = '600 8px ui-monospace, "JetBrains Mono", monospace';
        ctx.fillText('TEST GATE', g.x - 23, py + 30);
        ctx.font = '700 11px ui-monospace, "JetBrains Mono", monospace';
        ctx.setLineDash([6, 6]);
      }
      ctx.setLineDash([]);

      // ---- PROD line (bold emerald wall) ----
      const prodFade = Math.max(0, 1 - (now - prodFlashT) / 700);
      const prodCol = prodFade > 0 ? FAIL : ACCENT;
      // soft outer glow
      ctx.strokeStyle = `rgba(${prodCol}, ${0.18 + prodFade * 0.4})`;
      ctx.lineWidth = 8 + prodFade * 4;
      ctx.beginPath(); ctx.moveTo(prodX, 110); ctx.lineTo(prodX, h - 20); ctx.stroke();
      // core line
      ctx.strokeStyle = `rgba(${prodCol}, ${0.85 + prodFade * 0.15})`;
      ctx.lineWidth = 2.4 + prodFade * 1.6;
      ctx.beginPath(); ctx.moveTo(prodX, 110); ctx.lineTo(prodX, h - 20); ctx.stroke();
      // top PROD label as pill
      ctx.font = '800 11px ui-monospace, "JetBrains Mono", monospace';
      const ptw = ctx.measureText('▶ PROD').width;
      ctx.fillStyle = `rgba(${prodCol}, 1)`;
      ctx.beginPath(); ctx.roundRect(prodX - ptw / 2 - 9, 76, ptw + 18, 20, 10); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('▶ PROD', prodX - ptw / 2, 90);

      // ---- sentinels: aim at closest crawling bug, fire if cooldown elapsed ----
      for (const s of sentinels) {
        // find closest bug
        let target = null, bestD = 1e9;
        for (const b of bugs) {
          if (b.state !== 'crawling') continue;
          if (b.x > prodX - 8) continue;
          const dx = b.x - s.x, dy = b.y - s.y;
          const d = dx*dx + dy*dy;
          if (d < bestD && d < 380 * 380) { bestD = d; target = b; }
        }
        if (target) {
          const desired = Math.atan2(target.y - s.y, target.x - s.x);
          // smooth aim toward target
          let diff = desired - s.aim;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          s.aim += diff * 0.18;
          // charge then fire
          if (now - s.lastFire > 1100) {
            s.charge += 16;
            if (s.charge > 240 && Math.abs(diff) < 0.15) {
              // fire
              const muzzleX = s.x + Math.cos(s.aim) * 16;
              const muzzleY = (s.y + 2) + Math.sin(s.aim) * 16;
              lasers.push({
                x1: muzzleX, y1: muzzleY,
                x2: target.x, y2: target.y,
                t0: now, life: 180, color: s.color
              });
              killBug(target, 'laser', s.color);
              s.lastFire = now;
              s.charge = 0;
            }
          }
        } else {
          // idle: slowly aim leftward
          let diff = Math.PI - s.aim;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          s.aim += diff * 0.04;
          s.charge = Math.max(0, s.charge - 8);
        }
        drawSentinel(s, now);
      }

      // ---- update + draw bugs ----
      for (let i = bugs.length - 1; i >= 0; i--) {
        const b = bugs[i];
        if (b.state === 'crawling') {
          const w2 = Math.sin(now / 230 + b.phase) * b.wiggleAmp * 0.4;
          b.x += b.vx;
          b.y += b.vy + w2;
          b.vy += ((h * 0.55 - b.y) * 0.00002);

          // cursor squash
          if (mx > -9000) {
            const dx = b.x - mx, dy = b.y - my;
            if (dx*dx + dy*dy < SQUASH_R * SQUASH_R) killBug(b, 'squash');
          }

          // gates: stage-specific kill probabilities (UNIT/QA/STAGE)
          for (const g of gates) {
            if (b.state !== 'crawling') break;
            if (!b.passedGates.has(g.label) && b.x >= g.x && b.x <= g.x + b.vx + 1) {
              b.passedGates.add(g.label);
              const killChance = b.stealth ? g.stealthP : g.p;
              if (Math.random() < killChance) {
                // electric arc spark on gate line
                for (let k = 0; k < 7; k++) {
                  confetti.push({
                    x: g.x, y: b.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    t0: now, life: 380,
                    color: g.color, size: 1.7
                  });
                }
                killBug(b, 'zap', g.color);
              }
            }
          }

          // reached prod = leak
          if (b.state === 'crawling' && b.x >= prodX) {
            b.x = prodX;
            killBug(b, 'leak');
          }

          // render — stealth bugs are faint, with a subtle dashed outline
          if (b.stealth) {
            ctx.globalAlpha = 0.38;
            DRAWERS[b.species](b, now);
            ctx.globalAlpha = 1;
            // hint outline (very subtle, dashed)
            ctx.setLineDash([2, 3]);
            ctx.strokeStyle = `rgba(${INK}, 0.18)`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 1.9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            DRAWERS[b.species](b, now);
          }
        } else if (b.state === 'dying') {
          const age = now - b.dieT;
          if (age > 600) { bugs.splice(i, 1); continue; }
          const fade = 1 - age / 600;
          if (b.killMode === 'leak') {
            ctx.strokeStyle = `rgba(${FAIL}, ${fade})`;
            ctx.lineWidth = 1.8; ctx.lineCap = 'round';
            const s = 7;
            ctx.beginPath();
            ctx.moveTo(b.x - s, b.y - s); ctx.lineTo(b.x + s, b.y + s);
            ctx.moveTo(b.x + s, b.y - s); ctx.lineTo(b.x - s, b.y + s);
            ctx.stroke();
          } else {
            drawCheck(b.x, b.y, 7, fade);
          }
        }
      }

      // ---- lasers ----
      for (let i = lasers.length - 1; i >= 0; i--) {
        const L = lasers[i];
        const age = now - L.t0;
        if (age > L.life) { lasers.splice(i, 1); continue; }
        const a = 1 - age / L.life;
        // outer glow
        ctx.strokeStyle = L.color + '40';
        ctx.lineWidth = 6 * a + 2;
        ctx.beginPath(); ctx.moveTo(L.x1, L.y1); ctx.lineTo(L.x2, L.y2); ctx.stroke();
        // core
        ctx.strokeStyle = L.color;
        ctx.lineWidth = 1.6 * a + 0.6;
        ctx.beginPath(); ctx.moveTo(L.x1, L.y1); ctx.lineTo(L.x2, L.y2); ctx.stroke();
      }

      // ---- confetti ----
      for (let i = confetti.length - 1; i >= 0; i--) {
        const p = confetti[i];
        const age = now - p.t0;
        if (age > p.life) { confetti.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.99;
        p.rot = (p.rot || 0) + (p.vr || 0);
        const a = 1 - age / p.life;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ---- cursor halo + squash ring when hostile ----
      if (mx > -9000) {
        let hostile = false;
        for (const b of bugs) {
          if (b.state !== 'crawling') continue;
          const dx = b.x - mx, dy = b.y - my;
          if (dx*dx + dy*dy < (SQUASH_R + 30) * (SQUASH_R + 30)) { hostile = true; break; }
        }
        const col = hostile ? ACCENT : INK;
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
        g.addColorStop(0, `rgba(${col}, ${hostile ? 0.18 : 0.05})`);
        g.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(mx - 90, my - 90, 180, 180);
        if (hostile) {
          ctx.strokeStyle = `rgba(${ACCENT}, 0.5)`;
          ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
          ctx.beginPath(); ctx.arc(mx, my, SQUASH_R, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // ---- cursor trace ----
      if (trail.length > 1) {
        while (trail.length && now - trail[0].t > 360) trail.shift();
        ctx.setLineDash([3, 4]);
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1], bb = trail[i];
          const k = i / trail.length;
          ctx.strokeStyle = `rgba(${ACCENT}, ${0.04 + k * 0.16})`;
          ctx.lineWidth = 0.5 + k * 1.1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bb.x, bb.y); ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // ---- HUD (bottom-right pill stack, away from CTAs) ----
      const hudW = 200, hudH = 72;
      // place vertically between sentinel 2 and 3, just left of PROD line
      const hudX = prodX - hudW - 18, hudY = h * 0.66;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 10); ctx.fill();
      ctx.strokeStyle = `rgba(${INK}, 0.10)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 10); ctx.stroke();
      ctx.font = '700 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(${ACCENT}, 0.95)`;
      ctx.fillText(`● bugs squashed: ${killCount}`, hudX + 12, hudY + 18);
      ctx.fillStyle = `rgba(168, 85, 247, 0.95)`;
      ctx.fillText(`◆ stealth caught: ${stealthKills}`, hudX + 12, hudY + 38);
      ctx.fillStyle = `rgba(${FAIL}, ${leakCount > 0 ? 0.95 : 0.65})`;
      ctx.fillText(`✖ leaked to prod: ${leakCount}`, hudX + 12, hudY + 58);

      requestAnimationFrame(tick);
    };

    // Polyfill roundRect for older Chromium just in case
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
    }

    resize();
    window.addEventListener('resize', resize);
    tick();
  })();

  // ===== _OLD_SHIFT_LEFT_REMOVED =====
  if (false) (() => {
    const c = $('#bg-canvas');
    if (!c || prefersReduced) return;
    const ctx = c.getContext('2d');
    let w, h, dpr;

    const bugs = [];
    const sparks = [];          // {x,y,t0,kind:'kill'|'leak'|'gate', color}
    const trail = [];
    const TRAIL_MAX = 18;

    const accentRGB = '24, 169, 87';
    const failRGB   = '255, 90, 54';
    const inkRGB    = '10, 10, 12';

    const MAX_BUGS  = 12;
    const SQUASH_R  = 70;
    const PROD_X_FRAC = 0.94;   // production line near right edge
    let prodFlashT = 0;

    let mx = -9999, my = -9999;
    let mLast = { x: 0, y: 0, t: 0 };
    let killCount = 0;

    // Two test gates between spawn area and prod line
    let gates = [];

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = innerWidth, H = innerHeight;
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = W; h = H;
      gates = [
        { x: W * 0.40, label: 'unit',   p: 0.55 },
        { x: W * 0.70, label: 'e2e',    p: 0.65 }
      ];
    };

    const spawnBug = () => {
      if (bugs.length >= MAX_BUGS) return;
      // spawn from left edge or top/bottom edges
      const side = Math.random();
      let x, y;
      if (side < 0.7) { x = -20; y = 40 + Math.random() * (h - 80); }
      else if (side < 0.85) { x = Math.random() * w * 0.5; y = -20; }
      else { x = Math.random() * w * 0.5; y = h + 20; }
      bugs.push({
        x, y,
        vx: 0.35 + Math.random() * 0.55,    // CSS px per frame, rightward
        vy: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        wiggleAmp: 0.6 + Math.random() * 0.9,
        size: 5.2 + Math.random() * 1.6,
        state: 'crawling',                  // crawling | dying
        dieT: 0,
        passedGates: new Set(),
        seed: Math.random()
      });
    };

    // periodic spawner
    const spawnLoop = () => {
      spawnBug();
      setTimeout(spawnLoop, 900 + Math.random() * 1600);
    };
    setTimeout(spawnLoop, 700);

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      const now = performance.now();
      if (now - mLast.t > 16) {
        trail.push({ x: mx, y: my, t: now });
        if (trail.length > TRAIL_MAX) trail.shift();
        mLast = { x: mx, y: my, t: now };
      }
    }, { passive: true });
    window.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });
    window.addEventListener('pointerdown', (e) => {
      // click = "manual squash" — kill any bug in radius
      for (const b of bugs) {
        if (b.state !== 'crawling') continue;
        const dx = b.x - e.clientX, dy = b.y - e.clientY;
        if (dx*dx + dy*dy < 110*110) killBug(b, 'kill');
      }
    });

    const killBug = (b, kind) => {
      b.state = 'dying';
      b.dieT = performance.now();
      const color = kind === 'leak' ? failRGB : accentRGB;
      // burst of sparks
      const n = kind === 'leak' ? 14 : 10;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 0.8 + Math.random() * 2.2;
        sparks.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          t0: performance.now(), life: 480 + Math.random() * 220,
          color
        });
      }
      if (kind === 'leak') { prodFlashT = performance.now(); }
      else { killCount++; }
    };

    // draw a bug (top-down cartoon insect)
    const drawBug = (b, now) => {
      const wiggle = Math.sin(now / 80 + b.phase) * b.wiggleAmp;
      const angle = Math.atan2(b.vy + wiggle * 0.04, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      const s = b.size;

      // legs (animated)
      const legPhase = now / 60 + b.phase;
      ctx.strokeStyle = `rgba(${inkRGB}, 0.85)`;
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        const off = i * (s * 0.55);
        const swing = Math.sin(legPhase + i * 1.4) * s * 0.55;
        // left leg
        ctx.beginPath();
        ctx.moveTo(off, -s * 0.35);
        ctx.lineTo(off + swing * 0.4, -s * 1.25);
        ctx.stroke();
        // right leg
        ctx.beginPath();
        ctx.moveTo(off, s * 0.35);
        ctx.lineTo(off - swing * 0.4, s * 1.25);
        ctx.stroke();
      }

      // body
      ctx.fillStyle = `rgba(${inkRGB}, 0.92)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.55, s * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      // body sheen
      ctx.fillStyle = `rgba(${failRGB}, 0.32)`;
      ctx.beginPath();
      ctx.ellipse(s * 0.3, -s * 0.25, s * 0.55, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      // head
      ctx.fillStyle = `rgba(${inkRGB}, 1)`;
      ctx.beginPath();
      ctx.arc(s * 1.45, 0, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      // antennae
      ctx.strokeStyle = `rgba(${inkRGB}, 0.85)`;
      ctx.lineWidth = 0.9;
      const aw = Math.sin(legPhase * 1.4) * s * 0.25;
      ctx.beginPath();
      ctx.moveTo(s * 1.7, -s * 0.25); ctx.lineTo(s * 2.4 + aw, -s * 0.9);
      ctx.moveTo(s * 1.7,  s * 0.25); ctx.lineTo(s * 2.4 - aw,  s * 0.9);
      ctx.stroke();

      ctx.restore();
    };

    const drawCheck = (x, y, s, alpha, color = accentRGB) => {
      ctx.strokeStyle = `rgba(${color}, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x - s * 0.25, y + s * 0.75);
      ctx.lineTo(x + s, y - s * 0.65);
      ctx.stroke();
    };
    const drawCross = (x, y, s, alpha) => {
      ctx.strokeStyle = `rgba(${failRGB}, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
      ctx.stroke();
    };

    const tick = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, w, h);

      const prodX = w * PROD_X_FRAC;

      // ---- gates (vertical dashed test stations) ----
      ctx.setLineDash([4, 6]);
      for (const g of gates) {
        ctx.strokeStyle = `rgba(${inkRGB}, 0.12)`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(g.x, 60); ctx.lineTo(g.x, h - 60); ctx.stroke();
        // label
        ctx.save();
        ctx.translate(g.x, 40);
        ctx.fillStyle = `rgba(${inkRGB}, 0.32)`;
        ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
        ctx.fillText(g.label.toUpperCase(), -10, 0);
        ctx.restore();
      }
      ctx.setLineDash([]);

      // ---- PROD line (glowing emerald) ----
      const prodFlash = Math.max(0, 1 - (now - prodFlashT) / 600);
      const prodColor = prodFlash > 0 ? failRGB : accentRGB;
      ctx.strokeStyle = `rgba(${prodColor}, ${0.35 + prodFlash * 0.5})`;
      ctx.lineWidth = 1.6 + prodFlash * 1.4;
      ctx.beginPath(); ctx.moveTo(prodX, 30); ctx.lineTo(prodX, h - 30); ctx.stroke();
      // PROD label rotated
      ctx.save();
      ctx.translate(prodX + 10, 60);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = `rgba(${prodColor}, ${0.55 + prodFlash * 0.3})`;
      ctx.font = '700 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText('▶ PROD', 0, 0);
      ctx.restore();

      // ---- update + draw bugs ----
      for (let i = bugs.length - 1; i >= 0; i--) {
        const b = bugs[i];
        if (b.state === 'crawling') {
          // wiggle perpendicular to motion
          const w2 = Math.sin(now / 220 + b.phase) * b.wiggleAmp * 0.35;
          b.x += b.vx;
          b.y += b.vy + w2;
          // gentle vertical drift correction toward middle band
          b.vy += ((h * 0.55 - b.y) * 0.00002);

          // cursor squash check
          if (mx > -9000) {
            const dx = b.x - mx, dy = b.y - my;
            if (dx * dx + dy * dy < SQUASH_R * SQUASH_R) {
              killBug(b, 'kill');
            }
          }

          // gates auto-zap (probabilistic, once per gate)
          for (const g of gates) {
            if (b.state !== 'crawling') break;
            if (!b.passedGates.has(g.label) && b.x >= g.x && b.x <= g.x + b.vx + 1) {
              b.passedGates.add(g.label);
              if (Math.random() < g.p) {
                // gate zap spark on the line at bug y
                sparks.push({ x: g.x, y: b.y, vx: 0, vy: 0, t0: now, life: 420, color: accentRGB, gate: true });
                killBug(b, 'kill');
              }
            }
          }

          // reached prod = leak
          if (b.state === 'crawling' && b.x >= prodX) {
            b.x = prodX;
            killBug(b, 'leak');
          }

          drawBug(b, now);
        } else if (b.state === 'dying') {
          const age = now - b.dieT;
          if (age > 520) { bugs.splice(i, 1); continue; }
          const fade = 1 - age / 520;
          // squash mark: ✓ (kill) or ✗ (leak) — leak handled via prodFlash so draw ✗
          if (b.dieT && b.x >= prodX - 2) {
            drawCross(b.x, b.y, 7 * (0.6 + (1 - fade) * 0.6), fade);
          } else {
            drawCheck(b.x, b.y, 7 * (0.6 + (1 - fade) * 0.6), fade);
          }
        }
      }

      // ---- sparks ----
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        const age = now - sp.t0;
        if (age > sp.life) { sparks.splice(i, 1); continue; }
        if (!sp.gate) {
          sp.x += sp.vx; sp.y += sp.vy;
          sp.vy += 0.04;
        }
        const a = 1 - age / sp.life;
        ctx.fillStyle = `rgba(${sp.color}, ${a * 0.85})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.gate ? 2.4 * a + 1 : 1.6 * a + 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- cursor "scope" — soft red→green halo (green when bug near) ----
      if (mx > -9000) {
        let hostile = false;
        for (const b of bugs) {
          if (b.state !== 'crawling') continue;
          const dx = b.x - mx, dy = b.y - my;
          if (dx*dx + dy*dy < (SQUASH_R + 30) * (SQUASH_R + 30)) { hostile = true; break; }
        }
        const col = hostile ? accentRGB : inkRGB;
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
        g.addColorStop(0, `rgba(${col}, ${hostile ? 0.18 : 0.06})`);
        g.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(mx - 90, my - 90, 180, 180);
        if (hostile) {
          ctx.strokeStyle = `rgba(${accentRGB}, 0.45)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath(); ctx.arc(mx, my, SQUASH_R, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // ---- cursor trace (dashed code-trace) ----
      if (trail.length > 1) {
        while (trail.length && now - trail[0].t > 380) trail.shift();
        ctx.setLineDash([3, 4]);
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1], bb = trail[i];
          const k = i / trail.length;
          ctx.strokeStyle = `rgba(${accentRGB}, ${0.04 + k * 0.18})`;
          ctx.lineWidth = 0.5 + k * 1.1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bb.x, bb.y); ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // ---- HUD counter (subtle, bottom-left) ----
      ctx.fillStyle = `rgba(${inkRGB}, 0.32)`;
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText(`bugs squashed: ${killCount}`, 20, h - 18);

      requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    tick();
  })();

  // ===== _OLD_TEST_MATRIX_REMOVED =====
  if (false) (() => {
    const c = $('#bg-canvas');
    if (!c || prefersReduced) return;
    const ctx = c.getContext('2d');
    let w, h, dpr;
    let cells = [];
    const trail = [];
    const TRAIL_MAX = 22;
    const SPACING   = 46;
    const RUN_R     = 130;
    const PASS_FADE = 2200;
    const RUN_MS    = 280;

    let mx = -9999, my = -9999;
    let mLast = { x: 0, y: 0, t: 0 };
    let ripple = null;                 // {x,y,r,t0}
    const ripples = [];

    const accentRGB = '24, 169, 87';   // emerald (pass)
    const failRGB   = '255, 90, 54';   // coral  (fail)
    const inkRGB    = '10, 10, 12';

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = innerWidth, H = innerHeight;
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = W; h = H;
      cells = [];
      const cols = Math.ceil(W / SPACING) + 1;
      const rows = Math.ceil(H / SPACING) + 1;
      const offX = (W - (cols - 1) * SPACING) / 2;
      const offY = (H - (rows - 1) * SPACING) / 2;
      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          cells.push({
            x: offX + cc * SPACING,
            y: offY + r * SPACING,
            state: 'idle',    // idle | running | passed | failed
            t: 0,             // state-entered timestamp
            seed: Math.random()
          });
        }
      }
    };

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      const now = performance.now();
      if (now - mLast.t > 16) {
        trail.push({ x: mx, y: my, t: now });
        if (trail.length > TRAIL_MAX) trail.shift();
        mLast = { x: mx, y: my, t: now };
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', e => {
      ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      if (ripples.length > 3) ripples.shift();
    });
    window.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });

    // schedule rare bug events (failed cell that auto-heals)
    const scheduleBug = () => {
      const delay = 3500 + Math.random() * 5000;
      setTimeout(() => {
        if (cells.length) {
          // pick an idle cell far from cursor
          for (let tries = 0; tries < 12; tries++) {
            const cell = cells[(Math.random() * cells.length) | 0];
            const dx = cell.x - mx, dy = cell.y - my;
            if (dx*dx + dy*dy > 260*260 && cell.state === 'idle') {
              cell.state = 'failed'; cell.t = performance.now();
              break;
            }
          }
        }
        scheduleBug();
      }, delay);
    };
    scheduleBug();

    // draw a tiny check ✓
    const drawCheck = (x, y, s, alpha) => {
      ctx.strokeStyle = `rgba(${accentRGB}, ${alpha})`;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x - s * 0.25, y + s * 0.75);
      ctx.lineTo(x + s, y - s * 0.65);
      ctx.stroke();
    };
    // draw a tiny cross ✗
    const drawCross = (x, y, s, alpha) => {
      ctx.strokeStyle = `rgba(${failRGB}, ${alpha})`;
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
      ctx.stroke();
    };

    const tick = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, w, h);

      // ---- cursor halo (soft emerald) ----
      if (mx > -9000) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
        g.addColorStop(0, `rgba(${accentRGB}, 0.09)`);
        g.addColorStop(0.55, `rgba(${accentRGB}, 0.03)`);
        g.addColorStop(1, `rgba(${accentRGB}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(mx - 200, my - 200, 400, 400);
      }

      // ---- update + draw cells ----
      const R2 = RUN_R * RUN_R;
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const dx = cell.x - mx, dy = cell.y - my;
        const dd = dx * dx + dy * dy;
        const near = dd < R2;

        // promote idle → running near cursor (staggered by seed)
        if (cell.state === 'idle' && near) {
          const proximity = 1 - Math.sqrt(dd) / RUN_R;
          if (Math.random() < proximity * 0.08 + cell.seed * 0.002) {
            cell.state = 'running'; cell.t = now;
          }
        }
        // running → passed after RUN_MS
        if (cell.state === 'running' && now - cell.t > RUN_MS) {
          cell.state = 'passed'; cell.t = now;
        }
        // failed auto-heals to passed after ~700ms
        if (cell.state === 'failed' && now - cell.t > 700) {
          cell.state = 'passed'; cell.t = now;
        }
        // passed → idle fade
        if (cell.state === 'passed' && now - cell.t > PASS_FADE) {
          cell.state = 'idle'; cell.t = now;
        }

        // ---- ripple sweep: assertion burst on click ----
        for (let k = 0; k < ripples.length; k++) {
          const rp = ripples[k];
          const age = now - rp.t0;
          if (age > 700) continue;
          const radius = age * 0.55;        // px
          const rdx = cell.x - rp.x, rdy = cell.y - rp.y;
          const rd = Math.sqrt(rdx * rdx + rdy * rdy);
          if (Math.abs(rd - radius) < 28 && cell.state !== 'passed') {
            cell.state = 'passed'; cell.t = now;
          }
        }

        // ---- render ----
        if (cell.state === 'idle') {
          ctx.fillStyle = `rgba(${inkRGB}, 0.10)`;
          ctx.beginPath(); ctx.arc(cell.x, cell.y, 1.1, 0, Math.PI * 2); ctx.fill();
        } else if (cell.state === 'running') {
          // spinner ring sweep
          const p = (now - cell.t) / RUN_MS;          // 0→1
          const a0 = (now / 220) % (Math.PI * 2);
          ctx.strokeStyle = `rgba(${accentRGB}, ${0.55 + 0.25 * Math.sin(p * Math.PI)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, 5.2, a0, a0 + Math.PI * 1.3);
          ctx.stroke();
          // center pulse dot
          ctx.fillStyle = `rgba(${accentRGB}, 0.7)`;
          ctx.beginPath(); ctx.arc(cell.x, cell.y, 1.4, 0, Math.PI * 2); ctx.fill();
        } else if (cell.state === 'passed') {
          const age = now - cell.t;
          const fade = age < 220
            ? age / 220                                  // pop-in
            : Math.max(0, 1 - (age - 220) / (PASS_FADE - 220));
          const s = 3.6 * (age < 220 ? (0.6 + 0.4 * (age / 220)) : 1);
          drawCheck(cell.x, cell.y, s, 0.75 * fade);
        } else if (cell.state === 'failed') {
          const age = now - cell.t;
          const fade = age < 120 ? age / 120 : Math.max(0, 1 - (age - 120) / 580);
          drawCross(cell.x, cell.y, 3.8, 0.85 * fade);
        }
      }

      // ---- click ripple ring (visual) ----
      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k];
        const age = now - rp.t0;
        if (age > 800) { ripples.splice(k, 1); continue; }
        const radius = age * 0.55;
        const a = Math.max(0, 1 - age / 800);
        ctx.strokeStyle = `rgba(${accentRGB}, ${a * 0.5})`;
        ctx.lineWidth = 1.2 + a * 1.6;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2); ctx.stroke();
      }

      // ---- code-trace cursor trail (dashed) ----
      if (trail.length > 1) {
        // expire
        while (trail.length && now - trail[0].t > 460) trail.shift();
        ctx.setLineDash([3, 4]);
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1], b = trail[i];
          const k = i / trail.length;
          ctx.strokeStyle = `rgba(${accentRGB}, ${0.05 + k * 0.22})`;
          ctx.lineWidth = 0.6 + k * 1.4;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    tick();
  })();

  // ===== loader =====
  (() => {
    const loader = $('#loader'); if (!loader) return;
    const log = $('#loader-log');
    const lines = [
      '<span class="info">$</span> npx playwright test',
      '<span class="info">▸</span> resolving dependencies…',
      '<span class="ok">✓</span> all tests green',
      '<span class="info">▸</span> portfolio.ready()'
    ];
    let i = 0;
    const tick = () => {
      if (i < lines.length) {
        log.innerHTML += (i ? '\n' : '') + lines[i];
        i++;
        setTimeout(tick, 380);
      }
    };
    tick();
    const finish = () => {
      loader.classList.add('gone');
      document.body.classList.remove('loading');
      setTimeout(() => loader.remove(), 700);
    };
    // wait at least 1.8s OR until window loaded — whichever later
    const minWait = new Promise(r => setTimeout(r, 1800));
    const winLoad = new Promise(r => { if (document.readyState === 'complete') r(); else window.addEventListener('load', r, { once: true }); });
    Promise.all([minWait, winLoad]).then(finish);
    // ultimate fallback
    setTimeout(finish, 4500);
  })();

  // ===== animated counters =====
  (() => {
    const counters = $$('[data-count]');
    if (!counters.length) return;
    const animate = (el) => {
      const target = +el.getAttribute('data-count');
      const suf = el.getAttribute('data-suffix') || '';
      const dur = 1400;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suf;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suf;
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(c => io.observe(c));
  })();

  // ===== terminal typing =====
  (() => {
    const code = $('#term-code'); if (!code) return;
    const lines = [
      { t: '<span class="c-prompt">$</span> <span class="c-cmd">npx playwright test</span>', d: 700 },
      { t: '<span class="c-dim">Running 24 tests using 4 workers</span>', d: 500 },
      { t: '  <span class="c-pass">✓</span> login.spec.ts › valid user signs in <span class="c-dim">(1.2s)</span>', d: 240 },
      { t: '  <span class="c-pass">✓</span> checkout.spec.ts › cart totals <span class="c-dim">(2.0s)</span>', d: 240 },
      { t: '  <span class="c-pass">✓</span> api.spec.ts › POST /declarations <span class="c-dim">(0.4s)</span>', d: 240 },
      { t: '  <span class="c-pass">✓</span> customs.spec.ts › import workflow <span class="c-dim">(3.1s)</span>', d: 240 },
      { t: '  <span class="c-pass">✓</span> a11y.spec.ts › landmarks present <span class="c-dim">(0.6s)</span>', d: 240 },
      { t: '<span class="c-info">  24 passed</span> <span class="c-dim">(12.4s)</span>', d: 400 },
      { t: '<span class="c-prompt">$</span> <span class="c-cmd">_</span>', d: 600 },
    ];
    let i = 0;
    const tick = () => {
      if (i >= lines.length) return;
      code.innerHTML += (i ? '\n' : '') + lines[i].t;
      i++;
      setTimeout(tick, lines[i - 1].d);
    };
    setTimeout(tick, 700);
  })();

  // ===== LAB TABS =====
  $$('.lab-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      $$('.lab-tab').forEach(t => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', t === tab); });
      $$('.lab-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === id));
    });
  });

  // =========================================================
  // GAME 1 · BUG HUNT
  // =========================================================
  (() => {
    const arena = $('#bug-arena'), startBtn = $('#bug-start');
    const scoreEl = $('#bug-score'), comboEl = $('#bug-combo'), timeEl = $('#bug-time'), bestEl = $('#bug-best');
    if (!arena) return;
    const emojis = ['🐛', '🐞', '🪲', '🦗', '🕷️'];
    let score = 0, combo = 1, lastHit = 0, timeLeft = 30, spawnT, tickT, running = false;
    bestEl.textContent = ls.get('rl-bug-best', 0);

    const spawn = () => {
      const bug = document.createElement('span');
      bug.className = 'bug';
      bug.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const x = 6 + Math.random() * 88, y = 12 + Math.random() * 78;
      bug.style.left = x + '%'; bug.style.top = y + '%';
      bug.style.transform += ` rotate(${(Math.random() - 0.5) * 60}deg)`;
      bug.addEventListener('click', (ev) => {
        if (!running || bug.classList.contains('squashed')) return;
        bug.classList.add('squashed');
        const now = performance.now();
        if (now - lastHit < 1200) combo = Math.min(8, combo + 1); else combo = 1;
        lastHit = now;
        const gain = combo;
        score += gain; scoreEl.textContent = score; comboEl.textContent = '×' + combo;
        // flash
        const flash = document.createElement('div'); flash.className = 'bug-flash';
        flash.style.setProperty('--fx', x + '%'); flash.style.setProperty('--fy', y + '%');
        arena.appendChild(flash); setTimeout(() => flash.remove(), 500);
        const pop = document.createElement('span'); pop.className = 'bug-pop'; pop.textContent = '+' + gain;
        pop.style.left = x + '%'; pop.style.top = y + '%'; arena.appendChild(pop);
        setTimeout(() => pop.remove(), 800);
        setTimeout(() => bug.remove(), 400);
        ev.stopPropagation();
      });
      arena.appendChild(bug);
      setTimeout(() => { if (bug.parentNode && !bug.classList.contains('squashed')) bug.remove(); }, 1700);
    };

    const stop = () => {
      running = false; clearInterval(spawnT); clearInterval(tickT);
      startBtn.textContent = 'Play again'; startBtn.disabled = false;
      const best = ls.get('rl-bug-best', 0);
      if (score > best) { ls.set('rl-bug-best', score); bestEl.textContent = score; }
    };

    startBtn.addEventListener('click', () => {
      if (running) return;
      arena.innerHTML = ''; score = 0; combo = 1; timeLeft = 30;
      scoreEl.textContent = '0'; comboEl.textContent = '×1'; timeEl.textContent = '30';
      running = true; startBtn.textContent = 'Squashing…'; startBtn.disabled = true;
      spawnT = setInterval(spawn, 520);
      tickT = setInterval(() => {
        timeLeft--; timeEl.textContent = timeLeft;
        if (timeLeft <= 0) stop();
        // reset combo if idle
        if (performance.now() - lastHit > 1200) { combo = 1; comboEl.textContent = '×1'; }
      }, 1000);
    });
  })();

  // =========================================================
  // GAME 2 · SELECTOR MASTER
  // =========================================================
  (() => {
    const taskEl = $('#sel-task'), domEl = $('#sel-dom'), input = $('#sel-input'), typeSel = $('#sel-type');
    const checkBtn = $('#sel-check'), skipBtn = $('#sel-skip'), resultEl = $('#sel-result');
    const levelEl = $('#sel-level'), scoreEl = $('#sel-score'), bestEl = $('#sel-best');
    if (!taskEl) return;

    bestEl.textContent = ls.get('rl-sel-best', 0);

    // each level: { task, html, wantIds (which data-id elements must be matched) }
    const levels = [
      {
        task: 'Select the primary <span class="target">button</span>.',
        html: `
<button data-id="A" class="primary">Sign up</button>
<button data-id="B" class="ghost">Cancel</button>`,
        wantIds: ['A']
      },
      {
        task: 'Select <span class="target">all list items</span> in the bug list.',
        html: `
<ul class="bugs">
  <li data-id="A">Bug #101</li>
  <li data-id="B">Bug #102</li>
  <li data-id="C">Bug #103</li>
</ul>
<ul class="features">
  <li data-id="X">Feature A</li>
</ul>`,
        wantIds: ['A', 'B', 'C']
      },
      {
        task: 'Select bugs with <span class="target">status="open"</span>.',
        html: `
<ul>
  <li data-id="A" data-status="open">Bug #101 — login</li>
  <li data-id="B" data-status="closed">Bug #102 — typo</li>
  <li data-id="C" data-status="open">Bug #103 — checkout</li>
  <li data-id="D" data-status="open">Bug #104 — API 500</li>
</ul>`,
        wantIds: ['A', 'C', 'D']
      },
      {
        task: 'Select the input with <span class="target">name="email"</span>.',
        html: `
<form>
  <input data-id="A" name="username" />
  <input data-id="B" name="email" type="email" />
  <input data-id="C" name="password" type="password" />
</form>`,
        wantIds: ['B']
      },
      {
        task: 'Select <span class="target">the third</span> row of the table.',
        html: `
<table>
  <tr data-id="A"><td>Order 1</td><td>$10</td></tr>
  <tr data-id="B"><td>Order 2</td><td>$20</td></tr>
  <tr data-id="C"><td>Order 3</td><td>$30</td></tr>
  <tr data-id="D"><td>Order 4</td><td>$40</td></tr>
</table>`,
        wantIds: ['C']
      },
      {
        task: 'Select every link <span class="target">that opens in a new tab</span>.',
        html: `
<nav>
  <a data-id="A" href="/">Home</a>
  <a data-id="B" href="https://google.com" target="_blank">Google</a>
  <a data-id="C" href="/about">About</a>
  <a data-id="D" href="https://github.com" target="_blank">GitHub</a>
</nav>`,
        wantIds: ['B', 'D']
      },
      {
        task: 'Select buttons that are <span class="target">disabled</span>.',
        html: `
<div class="actions">
  <button data-id="A">Save</button>
  <button data-id="B" disabled>Submit</button>
  <button data-id="C">Cancel</button>
  <button data-id="D" disabled>Delete</button>
</div>`,
        wantIds: ['B', 'D']
      },
      {
        task: 'Select cards containing the <span class="target">word "checkout"</span>.',
        html: `
<div class="card" data-id="A"><h4>Login flow</h4><p>login regression</p></div>
<div class="card" data-id="B"><h4>Checkout</h4><p>cart totals</p></div>
<div class="card" data-id="C"><h4>API</h4><p>declarations</p></div>
<div class="card" data-id="D"><h4>Mobile</h4><p>checkout on phone</p></div>`,
        wantIds: ['B', 'D']
      }
    ];

    let level = 0, score = 0;

    const escape = (s) => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

    const renderLevel = () => {
      const L = levels[level];
      levelEl.textContent = level + 1;
      taskEl.innerHTML = L.task;
      // render DOM pretty-printed with data-id highlighted on `.want` elements
      domEl.innerHTML = L.html.trim();
      // highlight wanted elements
      L.wantIds.forEach(id => {
        const n = domEl.querySelector(`[data-id="${id}"]`);
        if (n) n.classList.add('want');
      });
      input.value = '';
      input.focus();
      resultEl.textContent = `Match exactly ${L.wantIds.length} highlighted node${L.wantIds.length === 1 ? '' : 's'}.`;
      resultEl.className = 'sel-result';
    };

    const evaluate = () => {
      // remove old hit/miss
      domEl.querySelectorAll('.hit, .miss').forEach(n => n.classList.remove('hit', 'miss'));
      const q = input.value.trim();
      if (!q) { resultEl.textContent = 'Enter a selector first.'; resultEl.className = 'sel-result err'; return; }
      const L = levels[level];
      let matched = [];
      try {
        if (typeSel.value === 'css') {
          matched = Array.from(domEl.querySelectorAll(q));
        } else {
          const r = document.evaluate(q, domEl, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < r.snapshotLength; i++) matched.push(r.snapshotItem(i));
        }
      } catch (e) {
        resultEl.textContent = 'Invalid selector: ' + e.message;
        resultEl.className = 'sel-result err';
        return;
      }
      const matchedIds = matched.map(n => n.getAttribute && n.getAttribute('data-id')).filter(Boolean);
      const want = L.wantIds.slice().sort();
      const got = Array.from(new Set(matchedIds)).sort();
      const isMatch = want.length === got.length && want.every((v, i) => v === got[i]);
      // visual: hit for correct, miss for extra
      matched.forEach(n => {
        const id = n.getAttribute && n.getAttribute('data-id');
        if (id && want.includes(id)) n.classList.add('hit');
        else if (n.classList) n.classList.add('miss');
      });
      if (isMatch) {
        score += 10 * (typeSel.value === 'xpath' ? 1.2 : 1);
        scoreEl.textContent = Math.round(score);
        resultEl.textContent = '✓ Nailed it! Loading next level…';
        resultEl.className = 'sel-result ok';
        setTimeout(() => {
          level++;
          if (level >= levels.length) {
            const best = ls.get('rl-sel-best', 0);
            if (Math.round(score) > best) { ls.set('rl-sel-best', Math.round(score)); bestEl.textContent = Math.round(score); }
            resultEl.textContent = `🏆 You cleared all ${levels.length} levels! Final score: ${Math.round(score)}.`;
            resultEl.className = 'sel-result ok';
            level = 0; score = 0; setTimeout(() => { scoreEl.textContent = 0; renderLevel(); }, 2200);
          } else {
            renderLevel();
          }
        }, 900);
      } else {
        resultEl.innerHTML = `Got ${got.length}/${want.length} correct. <span style="opacity:.7">Expected: ${want.join(', ')} · Yours: ${got.length ? got.join(', ') : '∅'}</span>`;
        resultEl.className = 'sel-result err';
      }
    };

    checkBtn.addEventListener('click', evaluate);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') evaluate(); });
    skipBtn.addEventListener('click', () => {
      level = (level + 1) % levels.length; renderLevel();
    });
    typeSel.addEventListener('change', () => {
      input.placeholder = typeSel.value === 'css'
        ? 'e.g.  button.primary  or  li[data-status="open"]'
        : 'e.g.  //li[@data-status="open"]';
    });
    renderLevel();
  })();

  // =========================================================
  // GAME 3 · FLAKY STORM
  // =========================================================
  (() => {
    const rate = $('#flaky-rate'), rateV = $('#flaky-rate-v'), runs = $('#flaky-runs'), retry = $('#flaky-retry');
    const runBtn = $('#flaky-run'), grid = $('#flaky-grid'), chart = $('#flaky-chart');
    const passEl = $('#flaky-pass'), failEl = $('#flaky-fail'), rtEl = $('#flaky-rt'), pctEl = $('#flaky-pct');
    if (!rate) return;
    rate.addEventListener('input', () => rateV.textContent = rate.value + '%');

    const drawChart = (history) => {
      const ctx = chart.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = chart.clientWidth, H = chart.clientHeight;
      chart.width = W * dpr; chart.height = H * dpr; ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#18a957';
      const border = getComputedStyle(root).getPropertyValue('--line').trim() || '#e6e3da';
      // axes
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(30, 10); ctx.lineTo(30, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
      // gridlines + labels
      ctx.fillStyle = getComputedStyle(root).getPropertyValue('--muted').trim() || '#6b6b73';
      ctx.font = '10px JetBrains Mono, monospace';
      for (let p = 0; p <= 100; p += 25) {
        const y = H - 20 - (p / 100) * (H - 30);
        ctx.fillText(p + '%', 4, y + 3);
        ctx.strokeStyle = border; ctx.globalAlpha = .35;
        ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 10, y); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // line
      if (history.length < 2) return;
      const xStep = (W - 40) / (history.length - 1);
      ctx.strokeStyle = accent; ctx.lineWidth = 2;
      ctx.beginPath();
      history.forEach((v, i) => {
        const x = 30 + i * xStep;
        const y = H - 20 - (v / 100) * (H - 30);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
      // fill area
      ctx.lineTo(30 + (history.length - 1) * xStep, H - 20);
      ctx.lineTo(30, H - 20);
      ctx.fillStyle = accent; ctx.globalAlpha = .12; ctx.fill(); ctx.globalAlpha = 1;
    };

    runBtn.addEventListener('click', () => {
      const total = Math.max(4, Math.min(500, parseInt(runs.value, 10) || 80));
      const f = parseInt(rate.value, 10) / 100;
      const useRetry = retry.checked;
      grid.innerHTML = '';
      let pass = 0, fail = 0, retries = 0;
      const cells = [];
      for (let i = 0; i < total; i++) {
        const c = document.createElement('span');
        grid.appendChild(c); cells.push(c);
      }
      const history = [];
      let i = 0;
      const step = () => {
        if (i >= cells.length) {
          passEl.textContent = pass; failEl.textContent = fail; rtEl.textContent = useRetry ? retries : '—';
          pctEl.textContent = ((pass / total) * 100).toFixed(1) + '%';
          return;
        }
        let passed = Math.random() > f;
        if (!passed && useRetry) {
          retries++;
          if (Math.random() > f) passed = true;
          cells[i].classList.add('retry');
        }
        if (passed) { pass++; cells[i].classList.add('pass'); }
        else { fail++; cells[i].classList.add('fail'); }
        i++;
        const cur = (pass / i) * 100;
        history.push(cur);
        if (i % Math.max(1, Math.floor(total / 60)) === 0 || i === cells.length) drawChart(history);
        passEl.textContent = pass; failEl.textContent = fail; rtEl.textContent = useRetry ? retries : '—';
        pctEl.textContent = cur.toFixed(1) + '%';
        setTimeout(step, Math.max(8, 600 / total));
      };
      step();
    });
    // initial empty chart
    setTimeout(() => drawChart([]), 200);
    window.addEventListener('resize', () => drawChart([]));
  })();

  // =========================================================
  // GAME 4 · REGEX WIZARD
  // =========================================================
  (() => {
    const stepEl = $('#rx-step'), scoreEl = $('#rx-score'), bestEl = $('#rx-best');
    const challengeEl = $('#rx-challenge'), patIn = $('#rx-pattern'), flgIn = $('#rx-flags');
    const checkBtn = $('#rx-check'), preview = $('#rx-preview'), resultEl = $('#rx-result');
    if (!challengeEl) return;
    bestEl.textContent = ls.get('rl-rx-best', 0);

    const challenges = [
      {
        title: 'Match every order ID like ORD-12345 (4+ digits, case-insensitive).',
        text: 'Order ORD-12345 was placed.\nInvoice ord-9981 is paid.\nSkip ORD-12 — too short.\nConfirmed ORD-7777771.',
        expected: ['ORD-12345', 'ord-9981', 'ORD-7777771']
      },
      {
        title: 'Match all email addresses.',
        text: 'Contact us at hello@example.com or sales@my-shop.co.uk.\nNo email here. Also: rakesh.lella@gmail.com',
        expected: ['hello@example.com', 'sales@my-shop.co.uk', 'rakesh.lella@gmail.com']
      },
      {
        title: 'Match all hex colors (#abc or #abcdef).',
        text: 'Use #fff or #000 for text, accents #10ffa0 and #7aa2ff. Bad: #12, #ZZZ.',
        expected: ['#fff', '#000', '#10ffa0', '#7aa2ff']
      },
      {
        title: 'Match every ISO date (YYYY-MM-DD).',
        text: 'Release 2024-11-04, retro 2025-01-12. Not a date: 2024/11/04. Final 2026-03-09.',
        expected: ['2024-11-04', '2025-01-12', '2026-03-09']
      },
      {
        title: 'Match each test ID exactly (e.g. TC-1234).',
        text: 'Run TC-1234, then TC-87 and TC-9999.\nLog ID-1000 (not a TC). Also TC-1.',
        expected: ['TC-1234', 'TC-87', 'TC-9999', 'TC-1']
      }
    ];

    let idx = 0, score = 0;

    const escape = (s) => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

    const render = () => {
      const C = challenges[idx];
      stepEl.textContent = idx + 1;
      challengeEl.innerHTML = `<span class="ch-title">${C.title}</span><span class="ch-target">Expected: ${C.expected.map(e => '<code>' + escape(e) + '</code>').join(', ')}</span>`;
      patIn.value = ''; flgIn.value = 'g';
      preview.innerHTML = escape(C.text);
      resultEl.textContent = 'Type a pattern and click Check.';
      resultEl.className = 'rx-result';
    };

    const live = () => {
      const C = challenges[idx];
      const p = patIn.value;
      let f = (flgIn.value || '').replace(/[^gimsuy]/g, '');
      if (!f.includes('g')) f += 'g';
      let count = 0; let html = escape(C.text);
      if (p) {
        try {
          const re = new RegExp(p, f);
          html = escape(C.text).replace(re, m => { count++; return `<mark>${m}</mark>`; });
        } catch (e) {
          preview.innerHTML = escape(C.text);
          resultEl.textContent = 'Invalid regex: ' + e.message;
          resultEl.className = 'rx-result err';
          return;
        }
      }
      preview.innerHTML = html;
    };

    const evaluate = () => {
      const C = challenges[idx];
      let p = patIn.value;
      if (!p) { resultEl.textContent = 'Enter a pattern first.'; resultEl.className = 'rx-result err'; return; }
      let f = (flgIn.value || '').replace(/[^gimsuy]/g, '');
      if (!f.includes('g')) f += 'g';
      let matches = [];
      try { const re = new RegExp(p, f); matches = C.text.match(re) || []; }
      catch (e) { resultEl.textContent = 'Invalid regex: ' + e.message; resultEl.className = 'rx-result err'; return; }
      const want = C.expected.slice().sort();
      const got = matches.slice().sort();
      const ok = want.length === got.length && want.every((v, i) => v === got[i]);
      if (ok) {
        score += 10; scoreEl.textContent = score;
        resultEl.textContent = '✓ Perfect! Loading next challenge…';
        resultEl.className = 'rx-result ok';
        setTimeout(() => {
          idx++;
          if (idx >= challenges.length) {
            const best = ls.get('rl-rx-best', 0);
            if (score > best) { ls.set('rl-rx-best', score); bestEl.textContent = score; }
            resultEl.textContent = `🏆 You solved all ${challenges.length} challenges! Score: ${score}.`;
            resultEl.className = 'rx-result ok';
            idx = 0; score = 0; setTimeout(() => { scoreEl.textContent = 0; render(); }, 2500);
          } else { render(); }
        }, 900);
      } else {
        resultEl.innerHTML = `Got ${got.length}/${want.length} matches. <span style="opacity:.7">Yours: ${got.length ? got.join(', ') : '∅'}</span>`;
        resultEl.className = 'rx-result err';
      }
    };

    [patIn, flgIn].forEach(el => el.addEventListener('input', live));
    checkBtn.addEventListener('click', evaluate);
    patIn.addEventListener('keydown', e => { if (e.key === 'Enter') evaluate(); });
    render();
  })();

  // =========================================================
  // GAME 5 · CI PIPELINE BUILDER
  // =========================================================
  (() => {
    const list = $('#ci-list'), checkBtn = $('#ci-check'), shuffleBtn = $('#ci-shuffle');
    const resultEl = $('#ci-result'), attEl = $('#ci-att'), bestEl = $('#ci-best');
    if (!list) return;
    bestEl.textContent = ls.get('rl-ci-best', '—');

    const correct = [
      { id: 'checkout', icon: '📥', name: 'Checkout', desc: 'git clone repo' },
      { id: 'install', icon: '📦', name: 'Install', desc: 'npm ci' },
      { id: 'lint', icon: '🧹', name: 'Lint', desc: 'eslint .' },
      { id: 'unit', icon: '🧪', name: 'Unit tests', desc: 'jest --coverage' },
      { id: 'build', icon: '🔨', name: 'Build', desc: 'npm run build' },
      { id: 'e2e', icon: '🎭', name: 'E2E', desc: 'playwright test' },
      { id: 'deploy', icon: '🚀', name: 'Deploy', desc: 'aws s3 sync' }
    ];
    let order = [];
    let attempt = 1;

    const render = () => {
      list.innerHTML = '';
      order.forEach((s, i) => {
        const li = document.createElement('li'); li.className = 'ci-stage'; li.dataset.id = s.id;
        li.innerHTML = `
          <span class="ci-icon">${s.icon}</span>
          <div><b class="ci-name">${s.name}</b><div class="ci-desc">${s.desc}</div></div>
          <div class="ci-arrows">
            <button class="ci-arrow" data-act="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>▲</button>
            <button class="ci-arrow" data-act="down" aria-label="Move down" ${i === order.length - 1 ? 'disabled' : ''}>▼</button>
          </div>`;
        li.querySelectorAll('.ci-arrow').forEach(b => b.addEventListener('click', () => {
          const dir = b.dataset.act === 'up' ? -1 : 1;
          const j = i + dir;
          if (j < 0 || j >= order.length) return;
          [order[i], order[j]] = [order[j], order[i]];
          render();
        }));
        list.appendChild(li);
      });
    };

    const shuffle = () => {
      order = correct.slice();
      do {
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
      } while (order.every((s, i) => s.id === correct[i].id));
      render(); resultEl.textContent = 'Reorder the stages, then run.'; resultEl.style.color = '';
    };

    const check = () => {
      const lis = Array.from(list.children);
      let correctCount = 0;
      lis.forEach((li, i) => {
        li.classList.remove('correct', 'wrong');
        if (order[i].id === correct[i].id) { li.classList.add('correct'); correctCount++; }
        else li.classList.add('wrong');
      });
      attEl.textContent = ++attempt;
      if (correctCount === correct.length) {
        resultEl.innerHTML = `✓ Pipeline passed in ${attempt - 1} attempt${attempt - 1 === 1 ? '' : 's'}.`;
        resultEl.style.color = 'var(--accent)';
        const best = ls.get('rl-ci-best', null);
        if (best == null || attempt - 1 < best) { ls.set('rl-ci-best', attempt - 1); bestEl.textContent = attempt - 1; }
      } else {
        resultEl.innerHTML = `${correctCount}/${correct.length} stages in correct position. Keep going.`;
        resultEl.style.color = 'var(--danger)';
      }
    };

    checkBtn.addEventListener('click', check);
    shuffleBtn.addEventListener('click', () => { attempt = 1; attEl.textContent = 1; shuffle(); });
    shuffle();
  })();

  // =========================================================
  // GAME 6 · SPOT THE BUG
  // =========================================================
  (() => {
    const good = $('#diff-good'), bad = $('#diff-bad'), startBtn = $('#diff-start');
    const foundEl = $('#diff-found'), timeEl = $('#diff-time'), bestEl = $('#diff-best');
    if (!good) return;
    bestEl.textContent = ls.get('rl-diff-best', '—');

    // 4 bugs: differences between good and bad. Each has a bbox (percent of bad side).
    const buildGood = () => `
      <span class="label">Expected</span>
      <div class="mock">
        <h4>Customs Declaration</h4>
        <p>Submit your import declaration to begin processing.</p>
        <div class="row">
          <span class="pill primary">Active</span>
          <span class="pill">Draft</span>
          <span class="pill">Archived</span>
        </div>
        <input class="input" value="Tracking: ORD-100245" />
        <div class="card"><b>Shell Logistics</b><div>Status: Approved · $1,240.00</div></div>
        <div class="card"><b>FedEx Express</b><div>Status: Pending · $980.50</div></div>
        <button class="btn">Submit declaration</button>
      </div>`;

    const buildBad = () => `
      <span class="label">Actual (buggy)</span>
      <div class="mock">
        <h4>Customs Decleration</h4>
        <p>Submit your import declaration to begin processing.</p>
        <div class="row">
          <span class="pill">Active</span>
          <span class="pill">Draft</span>
          <span class="pill">Archived</span>
        </div>
        <input class="input" value="Tracking: ORD-100245" />
        <div class="card"><b>Shell Logistics</b><div>Status: Approved · $1240</div></div>
        <div class="card"><b>FedEx Express</b><div>Status: Pending · $980.50</div></div>
        <button class="btn" style="background:#dc2647">Submit declaration</button>
      </div>`;

    // bug bboxes (% of bad-side container)
    const bugs = [
      { x: 6, y: 16, w: 60, h: 8,  label: 'Typo: "Decleration"' },
      { x: 6, y: 28, w: 20, h: 10, label: '"Active" pill missing primary state' },
      { x: 6, y: 60, w: 70, h: 10, label: 'Missing decimals on $1240' },
      { x: 6, y: 88, w: 60, h: 10, label: 'Submit button has wrong color' }
    ];

    let found = 0, timer = 0, tick, running = false;

    const reset = () => {
      good.innerHTML = buildGood();
      bad.innerHTML = buildBad();
      found = 0; foundEl.textContent = '0'; timeEl.textContent = '0';
      timer = 0;
      bugs.forEach(b => b._found = false);
    };

    const start = () => {
      reset();
      running = true;
      clearInterval(tick);
      tick = setInterval(() => { timer++; timeEl.textContent = timer; }, 1000);
      startBtn.textContent = 'Restart';
    };

    bad.addEventListener('click', (e) => {
      if (!running) return;
      const r = bad.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;
      const hit = bugs.find(b => !b._found && px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
      if (hit) {
        hit._found = true; found++; foundEl.textContent = found;
        const m = document.createElement('div'); m.className = 'diff-marker';
        m.style.left = (hit.x + hit.w / 2) + '%'; m.style.top = (hit.y + hit.h / 2) + '%';
        m.title = hit.label;
        bad.appendChild(m);
        if (found >= bugs.length) {
          clearInterval(tick); running = false;
          const best = ls.get('rl-diff-best', null);
          if (best == null || timer < best) { ls.set('rl-diff-best', timer); bestEl.textContent = timer + 's'; }
          startBtn.textContent = 'Play again';
        }
      } else {
        const m = document.createElement('div'); m.className = 'diff-miss';
        m.style.left = px + '%'; m.style.top = py + '%';
        bad.appendChild(m);
        setTimeout(() => m.remove(), 600);
      }
    });

    startBtn.addEventListener('click', start);
    reset();
  })();

})();
