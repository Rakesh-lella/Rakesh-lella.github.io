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
      ladybug:    { primary: '#ef4444', secondary: '#0a0a0c', accent: '#fff1f1', size: 9,    speed: [0.40, 0.75] },
      bee:        { primary: '#fbbf24', secondary: '#0a0a0c', accent: '#fff7d1', size: 8.5,  speed: [0.70, 1.20] },
      caterpillar:{ primary: '#22c55e', secondary: '#15803d', accent: '#bbf7d0', size: 7,    speed: [0.35, 0.60] },
      butterfly:  { primary: '#a855f7', secondary: '#ec4899', accent: '#fce7f3', size: 9.5,  speed: [0.60, 1.05] }
    };
    const SPECIES_KEYS = Object.keys(SPECIES);

    const bugs = [];
    const lasers = [];        // {x1,y1,x2,y2,t0,life,color}
    const confetti = [];      // {x,y,vx,vy,life,t0,color,size}
    const trail = [];
    const sentinels = [];

    const MAX_BUGS = 18;
    const SQUASH_R = 90;
    const PROD_X_FRAC = 0.94;
    let prodFlashT = 0;
    let killCount = 0;
    let leakCount = 0;
    let stealthKills = 0;
    let bugsSpawned = 0;
    let devKills = 0;     // bugs caught by dev-owned unit tests
    let qaKills = 0;      // bugs caught by QA (QA env, STAGE gate, sentinels, manual cursor)

    let mx = -9999, my = -9999;
    let mLast = { x: 0, y: 0, t: 0 };

    // gates + devs
    let gates = [];
    let devs  = [];

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = c.getBoundingClientRect();
      const W = Math.max(320, r.width);
      const H = Math.max(280, r.height);
      c.width = W * dpr; c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = W; h = H;
      gates = [
        // p = kill probability for *non-stealth* bugs;
        // stealthP = override for stealth bugs (lower = more survive)
        // owner: 'dev' (unit tests, written by devs) | 'qa' (QA-owned envs)
        { x: W * 0.38, label: 'UNIT',   caption: 'DEV UNIT TESTS', owner: 'dev', p: 0.12, stealthP: 0.08, color: '#0ea5e9' },
        { x: W * 0.60, label: 'QA ENV', caption: 'QA TESTS',       owner: 'qa',  p: 1.00, stealthP: 0.55, color: '#f97316' },
        { x: W * 0.80, label: 'STAGE',  caption: 'QA STAGE',       owner: 'qa',  p: 1.00, stealthP: 1.00, color: '#a855f7' }
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
      // 3 sentinels stand right in front of PROD line, guarding production
      const prodX = W * PROD_X_FRAC;
      const sentY = [H * 0.28, H * 0.55, H * 0.80];
      const sentColor = ['#0ea5e9', '#18a957', '#f97316'];
      sentinels.length = 0;
      for (let i = 0; i < 3; i++) {
        sentinels.push({
          x: prodX - 34, y: sentY[i],
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
      setTimeout(spawnLoop, 500 + Math.random() * 900);
    };
    setTimeout(spawnLoop, 400);

    const localPt = (e) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
    };
    c.addEventListener('pointermove', (e) => {
      const p = localPt(e);
      mx = p.x; my = p.y;
      const now = performance.now();
      if (now - mLast.t > 16) {
        trail.push({ x: mx, y: my, t: now });
        if (trail.length > 18) trail.shift();
        mLast = { x: mx, y: my, t: now };
      }
    }, { passive: true });
    c.addEventListener('pointerleave', () => { mx = -9999; my = -9999; });
    c.addEventListener('pointerdown', (e) => {
      const p = localPt(e);
      const qaEnvX = gates.length > 1 ? gates[1].x : 0;
      for (const b of bugs) {
        if (b.state !== 'crawling') continue;
        if (b.x < qaEnvX) continue;    // QA only acts AFTER QA ENV line — guarding prod
        const dx = b.x - p.x, dy = b.y - p.y;
        if (dx*dx + dy*dy < 110*110) killBug(b, 'squash', null, 'qa');
      }
    });

    const killBug = (b, mode, color, owner) => {
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
      else {
        killCount++;
        if (b.stealth) stealthKills++;
        if (owner === 'dev') devKills++;
        else qaKills++;
      }
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
        // small caption below pill (per-gate)
        ctx.fillStyle = g.color + 'cc';
        ctx.font = '700 8px ui-monospace, "JetBrains Mono", monospace';
        const ctw = ctx.measureText(g.caption).width;
        ctx.fillText(g.caption, g.x - ctw / 2, py + 32);
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

      // ---- sentinels: QA guards PROD — only fire at bugs that crossed QA ENV ----
      const unitX = gates.length ? gates[0].x : 0;
      const qaEnvX = gates.length > 1 ? gates[1].x : 0;
      for (const s of sentinels) {
        // find closest bug past QA ENV line (only bugs in QA territory)
        let target = null, bestD = 1e9;
        for (const b of bugs) {
          if (b.state !== 'crawling') continue;
          if (b.x < qaEnvX) continue;           // QA can't shoot bugs still in dev/unit territory
          if (b.x > prodX - 8) continue;
          const dx = b.x - s.x, dy = b.y - s.y;
          const d = dx*dx + dy*dy;
          if (d < bestD && d < 620 * 620) { bestD = d; target = b; }
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
              killBug(target, 'laser', s.color, 'qa');
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

          // dev pre-UNIT zone: small per-frame chance the nearest dev swats this bug
          // (~5% overall kill rate before the UNIT line)
          if (b.x < unitX && Math.random() < 0.00035) {
            // flash nearest dev's screen + tiny blue spark trail from dev to bug
            let bestDev = null, bestDD = 1e9;
            for (const d of devs) {
              const dd = (d.x - b.x) ** 2 + (d.y - b.y) ** 2;
              if (dd < bestDD) { bestDD = dd; bestDev = d; }
            }
            if (bestDev) {
              bestDev.screenGlow = now;
              // small dev-swat "thrown" sparks from monitor to bug
              for (let k = 0; k < 8; k++) {
                confetti.push({
                  x: bestDev.x + 14, y: bestDev.y,
                  vx: ((b.x - bestDev.x) / 40) + (Math.random() - 0.5) * 1.4,
                  vy: ((b.y - bestDev.y) / 40) + (Math.random() - 0.5) * 1.4,
                  t0: now, life: 420,
                  color: '#0ea5e9', size: 1.6
                });
              }
            }
            killBug(b, 'dev-swat', '#0ea5e9', 'dev');
            continue;
          }

          // cursor squash (counts as QA — you, the QA engineer, did it)
          // QA can only act on bugs that have crossed the QA ENV line — guarding prod
          if (mx > -9000 && b.x >= qaEnvX) {
            const dx = b.x - mx, dy = b.y - my;
            if (dx*dx + dy*dy < SQUASH_R * SQUASH_R) killBug(b, 'squash', null, 'qa');
          }

          // QA zone scheduled kill (a bug condemned at a QA gate dies at a random spot inside the zone)
          if (b.state === 'crawling' && b.qaKillAtX != null && b.x >= b.qaKillAtX) {
            const g = b.qaKillGate;
            for (let k = 0; k < 9; k++) {
              confetti.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                t0: now, life: 420,
                color: g.color, size: 1.7
              });
            }
            killBug(b, 'zap', g.color, g.owner);
            b.qaKillAtX = null;
          }

          // gates: stage-specific kill probabilities; attribute to owner
          for (const g of gates) {
            if (b.state !== 'crawling') break;
            if (!b.passedGates.has(g.label) && b.x >= g.x && b.x <= g.x + b.vx + 1) {
              b.passedGates.add(g.label);
              const killChance = b.stealth ? g.stealthP : g.p;
              if (Math.random() < killChance) {
                if (g.owner === 'dev') {
                  // dev unit-test kill: happens right at the line (the test runs there)
                  for (let k = 0; k < 7; k++) {
                    confetti.push({
                      x: g.x, y: b.y,
                      vx: (Math.random() - 0.5) * 3,
                      vy: (Math.random() - 0.5) * 3,
                      t0: now, life: 380,
                      color: g.color, size: 1.7
                    });
                  }
                  killBug(b, 'zap', g.color, g.owner);
                } else {
                  // QA gate: condemn the bug, but let it die at a RANDOM spot inside the QA zone
                  // zone runs from this gate to the next gate (or PROD line for the last gate)
                  let zoneEnd = prodX;
                  for (const g2 of gates) { if (g2.x > g.x && g2.x < zoneEnd) zoneEnd = g2.x; }
                  const zoneStart = g.x + 14;
                  const zoneSpan = Math.max(40, zoneEnd - zoneStart - 14);
                  b.qaKillAtX = zoneStart + Math.random() * zoneSpan;
                  b.qaKillGate = g;
                }
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

      // ---- HUD (kill attribution) ----
      const hudW = 268, hudH = 110;
      const hudX = prodX - hudW - 18, hudY = h * 0.60;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 12); ctx.fill();
      ctx.strokeStyle = `rgba(${INK}, 0.12)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 12); ctx.stroke();
      ctx.font = '700 12px ui-monospace, "JetBrains Mono", monospace';
      // dev unit-test kills (blue)
      ctx.fillStyle = 'rgba(14, 165, 233, 0.95)';
      ctx.fillText(`⚙ caught by devs (unit): ${devKills}`, hudX + 14, hudY + 24);
      // QA kills (emerald)
      ctx.fillStyle = `rgba(${ACCENT}, 0.95)`;
      ctx.fillText(`● caught by QA:          ${qaKills}`, hudX + 14, hudY + 47);
      // stealth (purple)
      ctx.fillStyle = `rgba(168, 85, 247, 0.95)`;
      ctx.fillText(`◆ stealth bugs caught:   ${stealthKills}`, hudX + 14, hudY + 70);
      // leaked (coral)
      ctx.fillStyle = `rgba(${FAIL}, ${leakCount > 0 ? 0.95 : 0.65})`;
      ctx.fillText(`✖ leaked to prod:        ${leakCount}`, hudX + 14, hudY + 93);

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
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(c);
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

/* =========================================================
   WORK SECTION BACKGROUND — CI/CD pipeline storyboard (detailed)
   QA writes → git push → GitHub → CI/CD → Tests → Deploy → Production
   Each stage renders a richer mini-card with dynamic content
   ========================================================= */
(() => {
  const c = document.getElementById('work-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let dpr = 1, W = 0, H = 0;

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = c.getBoundingClientRect();
    W = Math.max(360, r.width);
    H = Math.max(280, r.height);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(c);
  window.addEventListener('resize', resize);
  resize();

  const STAGES = [
    { key: 'qa',     label: 'QA writes',  caption: 'Playwright',  color: '#0ea5e9', icon: '✎' },
    { key: 'term',   label: 'git push',   caption: 'origin main', color: '#1d1d22', icon: '>_' },
    { key: 'gh',     label: 'GitHub',     caption: 'main',        color: '#6d3df1', icon: '◆' },
    { key: 'ci',     label: 'CI / CD',    caption: 'pipeline',    color: '#f5a623', icon: '⚙' },
    { key: 'tests',  label: 'Tests',      caption: '120/120',     color: '#18a957', icon: '✓' },
    { key: 'deploy', label: 'Deploy',     caption: 'rollout',     color: '#ff5a36', icon: '↗' },
    { key: 'prod',   label: 'Production', caption: '99.99% live', color: '#0a6f3a', icon: '☁' }
  ];

  let packet = { i: 0, t: 0, phase: 'travel', dwellStart: 0, restartAt: 0 };
  let lastT = 0;
  const PACKET_SPEED = 0.48;
  const DWELL = 900;        // ms per station — longer so detailed body anim plays
  const PAUSE_AFTER_LOOP = 1600;

  const SAFE_LEFT  = 0.085;
  const SAFE_RIGHT = 0.915;
  const CARD_W = 132;
  const CARD_H = 100;
  const CARD_Y = 76;        // vertical center of card row (above the section-head)

  const stationFor = (i) => {
    const f = SAFE_LEFT + (SAFE_RIGHT - SAFE_LEFT) * (i / (STAGES.length - 1));
    return { x: W * f, y: CARD_Y, ...STAGES[i] };
  };

  // ----- frame helpers -----
  const roundRectPath = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // dwell progress 0..1 for the currently-dwelling station (used to drive body animations)
  const dwellProg = (now) => {
    if (packet.phase !== 'dwell') return 0;
    return Math.min(1, (now - packet.dwellStart) / DWELL);
  };

  // ===== per-station body renderers =====
  // (cx, cy) is card center; bodyX/bodyY/bodyW/bodyH are the body area inside the card
  const bodyRect = (cx, cy) => ({
    x: cx - CARD_W / 2 + 10,
    y: cy - CARD_H / 2 + 24,
    w: CARD_W - 20,
    h: CARD_H - 42
  });

  // 1. QA writes — code lines being typed
  const drawBodyQA = (cx, cy, active, prog) => {
    const b = bodyRect(cx, cy);
    const lineH = 7;
    const lines = [
      { w: 0.55, c: '#0ea5e9' },  // import
      { w: 0.72, c: '#a855f7' },  // test('login'...
      { w: 0.45, c: '#1d1d22' },  //   await page.fill
      { w: 0.62, c: '#1d1d22' },  //   await page.click
      { w: 0.34, c: '#18a957' }   //   expect(...).toBeVisible
    ];
    const showCount = active ? Math.ceil(lines.length * (0.4 + 0.6 * prog)) : lines.length;
    for (let i = 0; i < lines.length; i++) {
      const yy = b.y + i * (lineH + 2);
      const visible = i < showCount;
      ctx.fillStyle = visible
        ? (active ? lines[i].c : 'rgba(10,10,12,0.30)')
        : 'rgba(10,10,12,0.08)';
      roundRectPath(b.x, yy, b.w * lines[i].w, lineH - 2, 2);
      ctx.fill();
    }
    // blinking cursor at end of currently-typing line
    if (active && showCount > 0 && showCount <= lines.length) {
      const li = Math.min(showCount - 1, lines.length - 1);
      const yy = b.y + li * (lineH + 2);
      const cursorX = b.x + b.w * lines[li].w + 2;
      if ((performance.now() % 700) < 380) {
        ctx.fillStyle = lines[li].c;
        ctx.fillRect(cursorX, yy, 2, lineH - 2);
      }
    }
  };

  // 2. git push — terminal showing typed command
  const drawBodyTerm = (cx, cy, active, prog) => {
    const b = bodyRect(cx, cy);
    // dark terminal background
    ctx.fillStyle = '#0f1115';
    roundRectPath(b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    // prompt + command
    const cmd = 'git push origin main';
    const shown = active ? Math.floor(cmd.length * Math.min(1, prog * 1.6)) : cmd.length;
    ctx.fillStyle = '#18a957';
    ctx.font = '700 8px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('$', b.x + 4, b.y + 5);
    ctx.fillStyle = '#e6e3da';
    ctx.fillText(cmd.slice(0, shown), b.x + 12, b.y + 5);
    // blinking cursor
    if (active && (performance.now() % 700) < 380) {
      ctx.fillStyle = '#18a957';
      ctx.fillRect(b.x + 12 + ctx.measureText(cmd.slice(0, shown)).width + 1, b.y + 4, 4, 9);
    }
    // response line when nearly done
    if (active && prog > 0.65) {
      ctx.fillStyle = 'rgba(125,125,135,0.85)';
      ctx.font = '500 7px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText('→ a1b2c3d main', b.x + 4, b.y + 18);
    }
    if (active && prog > 0.85) {
      ctx.fillStyle = '#18a957';
      ctx.fillText('✓ pushed', b.x + 4, b.y + 30);
    }
  };

  // 3. GitHub — commit graph with branching node
  const drawBodyGH = (cx, cy, active, prog) => {
    const b = bodyRect(cx, cy);
    // main branch vertical line
    const mx = b.x + 12;
    ctx.strokeStyle = active ? '#6d3df1' : 'rgba(10,10,12,0.18)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(mx, b.y + 4);
    ctx.lineTo(mx, b.y + b.h - 4);
    ctx.stroke();
    // 3 commit dots
    const commits = ['a1b2c3d', 'e4f5a6b', '7c8d9e0'];
    for (let i = 0; i < 3; i++) {
      const yy = b.y + 8 + i * 14;
      const isNew = active && prog > (i * 0.25);
      ctx.fillStyle = isNew ? '#6d3df1' : (active ? 'rgba(109,61,241,0.35)' : 'rgba(10,10,12,0.22)');
      ctx.beginPath();
      ctx.arc(mx, yy, 3, 0, Math.PI * 2);
      ctx.fill();
      // commit label
      ctx.fillStyle = isNew ? 'rgba(10,10,12,0.78)' : 'rgba(10,10,12,0.32)';
      ctx.font = '600 7px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(commits[i], mx + 8, yy);
    }
    // branch label
    ctx.fillStyle = active ? '#6d3df1' : 'rgba(10,10,12,0.40)';
    ctx.font = '700 7px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillText('★ main', mx + 8, b.y + b.h - 5);
  };

  // 4. CI/CD — 4 sub-stages filling in sequence
  const drawBodyCI = (cx, cy, active, prog) => {
    const b = bodyRect(cx, cy);
    const subs = ['lint', 'build', 'test', 'deploy'];
    const subH = 9;
    const gap = 2;
    for (let i = 0; i < subs.length; i++) {
      const yy = b.y + 2 + i * (subH + gap);
      const fillP = active ? Math.max(0, Math.min(1, (prog - i * 0.18) * 5)) : 0;
      // bg
      ctx.fillStyle = 'rgba(10,10,12,0.06)';
      roundRectPath(b.x, yy, b.w, subH, 2);
      ctx.fill();
      // progress fill
      if (fillP > 0) {
        ctx.fillStyle = '#f5a623';
        roundRectPath(b.x, yy, b.w * fillP, subH, 2);
        ctx.fill();
      }
      // label
      ctx.fillStyle = fillP > 0.5 ? '#ffffff' : 'rgba(10,10,12,0.6)';
      ctx.font = '700 7px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(subs[i], b.x + 4, yy + subH / 2);
      // tick when fully done
      if (fillP >= 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 7px ui-monospace, "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('✓', b.x + b.w - 4, yy + subH / 2);
      }
    }
  };

  // 5. Tests — 5×3 grid of dots filling green sequentially
  const drawBodyTests = (cx, cy, active, prog) => {
    const b = bodyRect(cx, cy);
    const cols = 6, rows = 3;
    const total = cols * rows;
    const passed = active ? Math.floor(total * prog) : total;
    const cw = (b.w - 2) / cols;
    const ch = (b.h - 4) / rows;
    for (let r = 0; r < rows; r++) {
      for (let cc = 0; cc < cols; cc++) {
        const idx = r * cols + cc;
        const xx = b.x + cc * cw + cw / 2;
        const yy = b.y + r * ch + ch / 2;
        const on = idx < passed;
        ctx.fillStyle = on ? '#18a957' : (active ? 'rgba(24,169,87,0.18)' : 'rgba(10,10,12,0.10)');
        ctx.beginPath();
        ctx.arc(xx, yy, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // counter
    if (active) {
      ctx.fillStyle = '#18a957';
      ctx.font = '700 7px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${passed}/${total} ✓`, b.x + b.w, b.y + b.h);
    }
  };

  // 6. Deploy — progress bar + rocket moving across
  const drawBodyDeploy = (cx, cy, active, prog) => {
    const b = bodyRect(cx, cy);
    const barY = b.y + b.h * 0.55;
    const barH = 6;
    // track
    ctx.fillStyle = 'rgba(10,10,12,0.08)';
    roundRectPath(b.x, barY, b.w, barH, 3);
    ctx.fill();
    // fill
    const fillP = active ? Math.min(1, prog * 1.1) : 1;
    if (fillP > 0) {
      const g = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
      g.addColorStop(0, '#ff7d54');
      g.addColorStop(1, '#ff5a36');
      ctx.fillStyle = g;
      roundRectPath(b.x, barY, b.w * fillP, barH, 3);
      ctx.fill();
    }
    // rocket
    const rx = b.x + b.w * fillP;
    ctx.font = '700 12px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff5a36';
    ctx.fillText('↗', Math.max(b.x + 4, Math.min(b.x + b.w - 4, rx)), barY - 8);
    // pct text
    if (active) {
      ctx.fillStyle = '#ff5a36';
      ctx.font = '700 8px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(fillP * 100)}%`, b.x + b.w, barY + 16);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(10,10,12,0.6)';
      ctx.font = '600 8px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText('rollout', b.x, barY + 16);
    }
  };

  // 7. Production — heartbeat pulse + 200 OK
  const drawBodyProd = (cx, cy, active, prog) => {
    const b = bodyRect(cx, cy);
    const px = b.x + b.w / 2;
    const py = b.y + b.h / 2 - 4;
    // pulse rings
    if (active) {
      for (let k = 0; k < 2; k++) {
        const t = ((performance.now() / 1100) + k * 0.5) % 1;
        const rr = 6 + t * 22;
        ctx.strokeStyle = '#0a6f3a';
        ctx.globalAlpha = (1 - t) * 0.4;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(px, py, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // core dot
    ctx.fillStyle = active ? '#0a6f3a' : 'rgba(10,10,12,0.18)';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 8px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', px, py + 1);
    // status text
    ctx.fillStyle = active ? '#0a6f3a' : 'rgba(10,10,12,0.4)';
    ctx.font = '700 8px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('200 OK', px, b.y + b.h - 4);
  };

  const BODY_RENDERERS = {
    qa: drawBodyQA, term: drawBodyTerm, gh: drawBodyGH, ci: drawBodyCI,
    tests: drawBodyTests, deploy: drawBodyDeploy, prod: drawBodyProd
  };

  // ===== station card frame + header =====
  const drawStation = (i, active, glow, prog) => {
    const s = stationFor(i);
    const x = s.x - CARD_W / 2;
    const y = s.y - CARD_H / 2;
    ctx.save();

    // outer glow when active
    if (glow > 0) {
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 18 * glow;
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 0.5 * glow;
      ctx.lineWidth = 2;
      roundRectPath(x - 2, y - 2, CARD_W + 4, CARD_H + 4, 12);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // card body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = active ? s.color : 'rgba(10,10,12,0.10)';
    ctx.lineWidth = active ? 1.6 : 1;
    ctx.shadowColor = 'rgba(10,10,12,0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    roundRectPath(x, y, CARD_W, CARD_H, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // header strip
    ctx.fillStyle = active ? s.color : 'rgba(10,10,12,0.04)';
    roundRectPath(x, y, CARD_W, 22, 10);
    ctx.fill();
    // clip header bottom corners flat
    ctx.fillStyle = active ? s.color : 'rgba(10,10,12,0.04)';
    ctx.fillRect(x, y + 14, CARD_W, 8);

    // icon
    ctx.fillStyle = active ? '#ffffff' : s.color;
    ctx.font = '700 11px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.icon, x + 8, y + 11);

    // label
    ctx.fillStyle = active ? '#ffffff' : 'rgba(10,10,12,0.78)';
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillText(s.label.toUpperCase(), x + 24, y + 11);

    // caption (top right)
    ctx.fillStyle = active ? 'rgba(255,255,255,0.85)' : 'rgba(10,10,12,0.45)';
    ctx.font = '500 7px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(s.caption, x + CARD_W - 8, y + 11);

    // body
    const renderer = BODY_RENDERERS[s.key];
    if (renderer) renderer(s.x, s.y, active, prog);

    // status indicator bottom
    ctx.fillStyle = active ? s.color : 'rgba(10,10,12,0.08)';
    roundRectPath(x + 6, y + CARD_H - 4, CARD_W - 12, 2, 1);
    ctx.fill();

    ctx.restore();
  };

  // ===== pipe between cards (only the visible gap, not under the card) =====
  const drawPipe = () => {
    ctx.save();
    ctx.strokeStyle = 'rgba(10,10,12,0.14)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 6]);
    for (let i = 0; i < STAGES.length - 1; i++) {
      const a = stationFor(i);
      const b = stationFor(i + 1);
      const x1 = a.x + CARD_W / 2;
      const x2 = b.x - CARD_W / 2;
      if (x2 > x1) {
        ctx.beginPath();
        ctx.moveTo(x1, a.y);
        ctx.lineTo(x2, b.y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  };

  // ===== packet between cards =====
  const drawPacket = () => {
    if (packet.phase !== 'travel') return;
    if (packet.i >= STAGES.length - 1) return;
    const a = stationFor(packet.i);
    const b = stationFor(packet.i + 1);
    const x1 = a.x + CARD_W / 2;
    const x2 = b.x - CARD_W / 2;
    const t = packet.t;
    const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    const px = x1 + (x2 - x1) * e;
    const py = a.y + (b.y - a.y) * e;
    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // trailing sparks
    for (let k = 1; k <= 4; k++) {
      const tk = Math.max(0, e - k * 0.05);
      const tx = x1 + (x2 - x1) * tk;
      const ty = a.y + (b.y - a.y) * tk;
      ctx.globalAlpha = (4 - k) / 6;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(tx, ty, 2.6 - k * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const tick = (now) => {
    if (!lastT) lastT = now;
    const dt = Math.min(80, now - lastT); lastT = now;

    ctx.clearRect(0, 0, W, H);
    drawPipe();

    // state machine
    if (packet.phase === 'travel') {
      packet.t += (dt / 1000) * PACKET_SPEED;
      if (packet.t >= 1) {
        packet.t = 1;
        packet.phase = 'dwell';
        packet.dwellStart = now;
      }
    } else if (packet.phase === 'dwell') {
      if (now - packet.dwellStart > DWELL) {
        packet.i += 1;
        if (packet.i >= STAGES.length - 1) {
          packet.phase = 'restart';
          packet.restartAt = now + PAUSE_AFTER_LOOP;
        } else {
          packet.phase = 'travel';
          packet.t = 0;
        }
      }
    } else if (packet.phase === 'restart') {
      if (now > packet.restartAt) {
        packet.i = 0;
        packet.t = 0;
        packet.phase = 'travel';
      }
    }

    const prog = dwellProg(now);

    // draw all stations
    for (let i = 0; i < STAGES.length; i++) {
      const active =
        i < packet.i ||
        (i === packet.i && (packet.phase === 'dwell' || packet.phase === 'restart')) ||
        (packet.phase === 'restart' && i === STAGES.length - 1);
      const glow = (i === packet.i && packet.phase === 'dwell')
        ? Math.max(0, 1 - (now - packet.dwellStart) / DWELL)
        : 0;
      const stationProg = (i === packet.i && packet.phase === 'dwell') ? prog : (active ? 1 : 0);
      drawStation(i, active, glow, stationProg);
    }

    drawPacket();

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();


/* =========================================================
   STACK SECTION BACKGROUND — API client mock-up
   Cycles through GET, POST, PUT, DELETE — collection on left,
   request panel in middle, response panel on right, packet flies
   from request to response on each "Send".
   ========================================================= */
(() => {
  const c = document.getElementById('stack-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let dpr = 1, W = 0, H = 0;

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = c.getBoundingClientRect();
    W = Math.max(360, r.width);
    H = Math.max(280, r.height);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(c);
  window.addEventListener('resize', resize);
  resize();

  // ---- data ----
  const METHODS = [
    {
      name: 'GET', color: '#18a957', path: '/api/users',
      hasBody: false,
      status: '200 OK', statusColor: '#18a957', ms: 84,
      resp: [
        '[',
        '  { "id": 1, "name": "Ada" },',
        '  { "id": 2, "name": "Lin" },',
        '  { "id": 3, "name": "Rio" }',
        ']'
      ]
    },
    {
      name: 'POST', color: '#6d3df1', path: '/api/users',
      hasBody: true,
      req: [
        '{',
        '  "name": "Lin",',
        '  "role": "qa"',
        '}'
      ],
      status: '201 Created', statusColor: '#18a957', ms: 142,
      resp: [
        '{',
        '  "id": 42,',
        '  "name": "Lin",',
        '  "role": "qa"',
        '}'
      ]
    },
    {
      name: 'PUT', color: '#f59e0b', path: '/api/users/42',
      hasBody: true,
      req: [
        '{',
        '  "role": "admin"',
        '}'
      ],
      status: '200 OK', statusColor: '#18a957', ms: 96,
      resp: [
        '{',
        '  "id": 42,',
        '  "name": "Lin",',
        '  "role": "admin"',
        '}'
      ]
    },
    {
      name: 'DELETE', color: '#ef4444', path: '/api/users/42',
      hasBody: false,
      status: '204 No Content', statusColor: '#475569', ms: 53,
      resp: []
    }
  ];

  // phases (per method cycle): select → type → body → send → response → pause
  const D = {
    select: 600,
    type: 900,
    body: 800,    // skipped when method has no body
    send: 700,
    response: 1500,
    pause: 1400
  };

  let st = { mi: 0, phase: 'select', t0: 0 };
  let lastT = 0;

  // ---- helpers ----
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const advance = (now) => {
    const m = METHODS[st.mi];
    const dur = (() => {
      if (st.phase === 'body' && !m.hasBody) return 0;
      return D[st.phase];
    })();
    if (now - st.t0 < dur) return;
    st.t0 = now;
    const order = ['select', 'type', 'body', 'send', 'response', 'pause'];
    let i = order.indexOf(st.phase);
    i += 1;
    if (i >= order.length) {
      st.mi = (st.mi + 1) % METHODS.length;
      st.phase = 'select';
    } else {
      st.phase = order[i];
    }
  };

  const phaseProg = (now) => {
    const m = METHODS[st.mi];
    let dur = D[st.phase];
    if (st.phase === 'body' && !m.hasBody) dur = 1;
    return Math.max(0, Math.min(1, (now - st.t0) / dur));
  };

  // states that imply a thing is "done"
  const ORDER = ['select', 'type', 'body', 'send', 'response', 'pause'];
  const isDone = (key) => ORDER.indexOf(st.phase) > ORDER.indexOf(key);
  const isAt = (key) => st.phase === key;
  const isAtOrAfter = (key) => ORDER.indexOf(st.phase) >= ORDER.indexOf(key);

  // ---- layout ----
  const layout = () => {
    const SAFE_L = Math.max(20, W * 0.06);
    const SAFE_R = Math.max(20, W * 0.06);
    const top = 18;
    const panelH = 200;
    const totalW = W - SAFE_L - SAFE_R;
    const gap = 14;
    // left panel ~ 26%, middle 40%, right 34%
    const wL = Math.round(totalW * 0.26);
    const wR = Math.round(totalW * 0.32);
    const wM = totalW - wL - wR - gap * 2;
    return {
      L: { x: SAFE_L,                       y: top, w: wL, h: panelH },
      M: { x: SAFE_L + wL + gap,            y: top, w: wM, h: panelH },
      R: { x: SAFE_L + wL + gap + wM + gap, y: top, w: wR, h: panelH }
    };
  };

  // ---- drawing panels ----
  const drawPanel = (r, label, accent) => {
    // shadow + body
    ctx.save();
    ctx.shadowColor = 'rgba(10,10,12,0.10)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#ffffff';
    roundRect(r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.restore();
    // border
    ctx.strokeStyle = 'rgba(10,10,12,0.08)';
    ctx.lineWidth = 1;
    roundRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 12);
    ctx.stroke();
    // header strip
    ctx.fillStyle = 'rgba(10,10,12,0.04)';
    roundRect(r.x, r.y, r.w, 26, 12);
    ctx.fill();
    ctx.fillRect(r.x, r.y + 18, r.w, 8);
    // accent dot
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(r.x + 12, r.y + 13, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // label
    ctx.fillStyle = 'rgba(10,10,12,0.70)';
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, r.x + 22, r.y + 13);
    // three traffic-light dots top right
    const tx = r.x + r.w - 10;
    const colors = ['#ef4444', '#f59e0b', '#18a957'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[2 - i];
      ctx.beginPath();
      ctx.arc(tx - i * 9, r.y + 13, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // method pill (used in collection list + request panel)
  const methodPillW = (name, font) => {
    ctx.font = font;
    return Math.max(40, ctx.measureText(name).width + 12);
  };
  const drawMethodPill = (x, y, h, name, color, filled) => {
    const font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    const w = methodPillW(name, font);
    if (filled) {
      ctx.fillStyle = color;
      roundRect(x, y, w, h, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 3);
      ctx.stroke();
      ctx.fillStyle = color;
    }
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + w / 2, y + h / 2);
    return w;
  };

  // ---- LEFT panel: Collection ----
  const drawCollection = (r) => {
    drawPanel(r, 'COLLECTION', '#0ea5e9');
    // title hint
    ctx.fillStyle = 'rgba(10,10,12,0.45)';
    ctx.font = '600 8px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('users-api / endpoints', r.x + 12, r.y + 32);

    const rowH = 28;
    const top = r.y + 50;
    for (let i = 0; i < METHODS.length; i++) {
      const m = METHODS[i];
      const ry = top + i * (rowH + 4);
      const active = (i === st.mi);
      // row background
      if (active) {
        ctx.fillStyle = m.color + '14'; // 8% alpha hex
        // canvas doesn't support hex+alpha consistently; use rgba
        const rgb = hexToRgb(m.color);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.10)`;
        roundRect(r.x + 8, ry, r.w - 16, rowH, 6);
        ctx.fill();
        // left accent bar
        ctx.fillStyle = m.color;
        roundRect(r.x + 8, ry, 3, rowH, 1.5);
        ctx.fill();
      }
      // pill
      const px = r.x + 18;
      const py = ry + (rowH - 14) / 2;
      const pw = drawMethodPill(px, py, 14, m.name, m.color, active);
      // path text
      ctx.fillStyle = active ? 'rgba(10,10,12,0.85)' : 'rgba(10,10,12,0.55)';
      ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.path, px + pw + 6, ry + rowH / 2);
      // status dot right
      if (active && isAtOrAfter('response')) {
        const rgb2 = hexToRgb(m.statusColor);
        ctx.fillStyle = `rgba(${rgb2.r},${rgb2.g},${rgb2.b},1)`;
        ctx.beginPath();
        ctx.arc(r.x + r.w - 14, ry + rowH / 2, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // ---- MIDDLE panel: Request builder ----
  const drawRequest = (r) => {
    drawPanel(r, 'REQUEST', '#6d3df1');
    const m = METHODS[st.mi];
    // METHOD pill + URL bar
    const barY = r.y + 36;
    const barH = 22;
    const px = r.x + 12;
    const pw = drawMethodPill(px, barY + (barH - 16) / 2, 16, m.name, m.color, true);
    // url bar
    const urlX = px + pw + 6;
    const urlW = r.w - 12 - (urlX - r.x) - 64; // leave room for Send btn
    ctx.fillStyle = 'rgba(10,10,12,0.05)';
    roundRect(urlX, barY, urlW, barH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,12,0.10)';
    ctx.lineWidth = 1;
    roundRect(urlX + 0.5, barY + 0.5, urlW - 1, barH - 1, 4);
    ctx.stroke();
    // typed URL
    let typed = m.path;
    if (isAt('select')) typed = '';
    else if (isAt('type')) typed = m.path.slice(0, Math.ceil(m.path.length * phaseProg(performance.now())));
    ctx.fillStyle = 'rgba(10,10,12,0.80)';
    ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(typed, urlX + 8, barY + barH / 2);
    // cursor during typing
    if (isAt('type') && (performance.now() % 700) < 380) {
      const cw = ctx.measureText(typed).width;
      ctx.fillStyle = m.color;
      ctx.fillRect(urlX + 8 + cw + 1, barY + 4, 2, barH - 8);
    }
    // Send button
    const btnW = 52, btnH = 22;
    const btnX = r.x + r.w - btnW - 12;
    const sendActive = isAt('send');
    if (sendActive) {
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = isDone('type') ? m.color : 'rgba(109,61,241,0.30)';
    roundRect(btnX, barY, btnW, btnH, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sendActive ? 'Send…' : 'Send ↗', btnX + btnW / 2, barY + btnH / 2);

    // tabs row
    const tabsY = barY + barH + 10;
    const tabs = ['Params', 'Headers', m.hasBody ? 'Body •' : 'Body', 'Auth'];
    let tx = r.x + 12;
    for (let i = 0; i < tabs.length; i++) {
      const isActive = (m.hasBody && i === 2) || (!m.hasBody && i === 1);
      ctx.fillStyle = isActive ? '#1d1d22' : 'rgba(10,10,12,0.45)';
      ctx.font = isActive ? '700 9px ui-monospace, "JetBrains Mono", monospace'
                           : '600 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(tabs[i], tx, tabsY);
      if (isActive) {
        const tw = ctx.measureText(tabs[i]).width;
        ctx.fillStyle = m.color;
        ctx.fillRect(tx, tabsY + 12, tw, 2);
      }
      tx += ctx.measureText(tabs[i]).width + 14;
    }

    // content area
    const contentY = tabsY + 22;
    const contentH = r.y + r.h - contentY - 12;
    // dark editor box
    ctx.fillStyle = '#0f1115';
    roundRect(r.x + 12, contentY, r.w - 24, contentH, 6);
    ctx.fill();

    if (m.hasBody) {
      // show body JSON typing during 'body' phase, full once 'body' is done
      const totalChars = m.req.reduce((a, l) => a + l.length + 1, 0);
      let chars = totalChars;
      if (!isAtOrAfter('body')) chars = 0;
      else if (isAt('body')) chars = Math.floor(totalChars * phaseProg(performance.now()));
      // render
      let used = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      for (let i = 0; i < m.req.length; i++) {
        const ln = m.req[i];
        const take = Math.max(0, Math.min(ln.length, chars - used));
        const part = ln.slice(0, take);
        // color tokens (very simple: keys in violet, strings in green, braces in white)
        const color = /^[{\}\[\]]/.test(part.trim()) ? '#e6e3da'
                    : (part.includes(':') ? '#a78bfa' : '#7dd3a0');
        ctx.fillStyle = color;
        ctx.fillText(part, r.x + 20, contentY + 8 + i * 13);
        used += ln.length + 1;
        if (used > chars) break;
      }
      // cursor
      if (isAt('body') && (performance.now() % 700) < 380) {
        // place cursor at end of last drawn line
        let drawnLines = 0;
        let acc = 0;
        for (let i = 0; i < m.req.length; i++) {
          if (acc + m.req[i].length >= chars) { drawnLines = i; break; }
          acc += m.req[i].length + 1;
          drawnLines = i + 1;
        }
        const li = Math.min(drawnLines, m.req.length - 1);
        const partLen = Math.max(0, Math.min(m.req[li].length, chars - (acc)));
        const partStr = m.req[li].slice(0, partLen);
        ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
        const cw = ctx.measureText(partStr).width;
        ctx.fillStyle = '#18a957';
        ctx.fillRect(r.x + 20 + cw + 1, contentY + 8 + li * 13, 6, 12);
      }
    } else {
      // no body — hint
      ctx.fillStyle = 'rgba(230,227,218,0.45)';
      ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('// no body', r.x + 20, contentY + contentH / 2);
    }
  };

  // ---- RIGHT panel: Response ----
  const drawResponse = (r) => {
    drawPanel(r, 'RESPONSE', '#18a957');
    const m = METHODS[st.mi];
    // status row
    const sy = r.y + 38;
    if (isAtOrAfter('response')) {
      const rgb = hexToRgb(m.statusColor);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},1)`;
      roundRect(r.x + 12, sy, 80, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.status, r.x + 12 + 40, sy + 9);
      // time
      ctx.fillStyle = 'rgba(10,10,12,0.60)';
      ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${m.ms} ms · 1.2 KB`, r.x + r.w - 12, sy + 9);
    } else {
      // pending state
      ctx.fillStyle = 'rgba(10,10,12,0.06)';
      roundRect(r.x + 12, sy, 80, 18, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(10,10,12,0.35)';
      ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isAt('send') ? '…sending' : '— waiting', r.x + 12 + 40, sy + 9);
    }

    // body editor
    const bodyY = sy + 28;
    const bodyH = r.y + r.h - bodyY - 12;
    ctx.fillStyle = '#0f1115';
    roundRect(r.x + 12, bodyY, r.w - 24, bodyH, 6);
    ctx.fill();

    if (isAtOrAfter('response') && m.resp.length) {
      const totalChars = m.resp.reduce((a, l) => a + l.length + 1, 0);
      let chars = totalChars;
      if (isAt('response')) chars = Math.floor(totalChars * Math.min(1, phaseProg(performance.now()) * 1.2));
      let used = 0;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      for (let i = 0; i < m.resp.length; i++) {
        const ln = m.resp[i];
        const take = Math.max(0, Math.min(ln.length, chars - used));
        const part = ln.slice(0, take);
        const trimmed = part.trim();
        let color = '#e6e3da';
        if (/^"[^"]+":/.test(trimmed)) color = '#a78bfa';        // key
        else if (/^"/.test(trimmed)) color = '#7dd3a0';            // string value
        else if (/^\d/.test(trimmed)) color = '#fbbf24';           // number
        else if (/^[{\}\[\],]/.test(trimmed)) color = '#e6e3da';   // braces
        else if (part.includes(':')) color = '#a78bfa';
        ctx.fillStyle = color;
        ctx.fillText(part, r.x + 20, bodyY + 8 + i * 13);
        used += ln.length + 1;
        if (used > chars) break;
      }
    } else if (isAtOrAfter('response') && !m.resp.length) {
      ctx.fillStyle = 'rgba(230,227,218,0.50)';
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('(empty body)', r.x + r.w / 2, bodyY + bodyH / 2);
    }
  };

  // ---- packet flying from request to response during 'send' ----
  const drawSendPacket = (mid, right) => {
    if (!isAt('send')) return;
    const m = METHODS[st.mi];
    const x1 = mid.x + mid.w - 6;
    const x2 = right.x + 6;
    const y = mid.y + 50;
    const t = phaseProg(performance.now());
    const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    const px = x1 + (x2 - x1) * e;
    ctx.save();
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(px, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, y, 2, 0, Math.PI * 2);
    ctx.fill();
    // tail
    for (let k = 1; k <= 5; k++) {
      const tk = Math.max(0, e - k * 0.05);
      const tx = x1 + (x2 - x1) * tk;
      ctx.globalAlpha = (5 - k) / 7;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(tx, y, 3 - k * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // connecting dashed line between panels (faint)
    ctx.strokeStyle = 'rgba(10,10,12,0.12)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  const tick = (now) => {
    if (!lastT) { lastT = now; st.t0 = now; }
    lastT = now;
    advance(now);

    ctx.clearRect(0, 0, W, H);
    const lay = layout();

    drawCollection(lay.L);
    drawRequest(lay.M);
    drawResponse(lay.R);
    drawSendPacket(lay.M, lay.R);

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();


/* =========================================================
   JOURNEY SECTION BACKGROUND — Locust performance dashboard
   Cycles through five perf-test profiles in order:
     LOAD · SPIKE · STRESS · SOAK · STEP
   Each profile drives its own users(t) and rps(t) curve, so the
   chart shape changes every cycle. Header banner shows the
   profile name + a one-line description.
   ========================================================= */
(() => {
  const c = document.getElementById('journey-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let dpr = 1, W = 0, H = 0;

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = c.getBoundingClientRect();
    W = Math.max(360, r.width);
    H = Math.max(280, r.height);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(c);
  window.addEventListener('resize', resize);
  resize();

  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // ---- per-endpoint config ----
  const ENDPOINTS = [
    { method: 'GET',  path: '/api/users',    color: '#18a957', weight: 0.45 },
    { method: 'POST', path: '/api/login',    color: '#6d3df1', weight: 0.30 },
    { method: 'GET',  path: '/api/products', color: '#0ea5e9', weight: 0.25 }
  ];

  // ---- test PROFILES ----
  // p = progress in run-phase 0..1
  // returns { users, rps, failRate? }  failRate is added on top of base 0.01
  const PROFILES = [
    {
      name: 'LOAD',  title: 'Load test',
      desc: 'gradual ramp · sustain at target',
      color: '#16c47b',
      maxUsers: 100, maxRps: 500,
      curve: (p) => {
        // ramp 0..0.35, sustain 0.35..1
        const u = p < 0.35 ? (p / 0.35) * 100 : 100;
        const r = p < 0.35 ? (p / 0.35) * 460 : 460 + Math.sin(p * 18) * 16;
        return { users: u, rps: r, failRate: 0 };
      }
    },
    {
      name: 'SPIKE', title: 'Spike test',
      desc: 'sudden burst · then drop',
      color: '#ef4444',
      maxUsers: 250, maxRps: 950,
      curve: (p) => {
        // small steady 0..0.25, burst 0.25..0.40, hold 0.40..0.80, drop 0.80..1
        let u, r;
        if (p < 0.25) { u = (p / 0.25) * 40; r = (p / 0.25) * 180; }
        else if (p < 0.40) { const k = (p - 0.25) / 0.15; u = 40 + k * 210; r = 180 + k * 760; }
        else if (p < 0.80) { u = 250; r = 920 + Math.sin(p * 30) * 18; }
        else { const k = 1 - (p - 0.80) / 0.20; u = 250 * k; r = 920 * k; }
        // brief failure burst at peak
        const fr = (p > 0.32 && p < 0.55) ? 0.07 : 0;
        return { users: u, rps: r, failRate: fr };
      }
    },
    {
      name: 'STRESS', title: 'Stress test',
      desc: 'push past capacity · find break point',
      color: '#f59e0b',
      maxUsers: 300, maxRps: 750,
      curve: (p) => {
        // climb users linearly, but rps degrades after breakpoint at 0.65
        const u = Math.min(300, p * 320);
        let r;
        if (p < 0.65) r = (p / 0.65) * 700;
        else { const k = (p - 0.65) / 0.35; r = Math.max(180, 700 - k * 520) + Math.sin(p * 22) * 14; }
        const fr = p > 0.55 ? Math.min(0.30, (p - 0.55) * 0.7) : 0;
        return { users: u, rps: r, failRate: fr };
      }
    },
    {
      name: 'SOAK', title: 'Soak test',
      desc: 'sustained moderate load · long duration',
      color: '#0ea5e9',
      maxUsers: 80, maxRps: 360,
      curve: (p) => {
        const u = p < 0.10 ? (p / 0.10) * 80 : 80;
        const r = p < 0.10 ? (p / 0.10) * 340 : 340 + Math.sin(p * 40) * 12 + Math.sin(p * 13) * 6;
        return { users: u, rps: r, failRate: 0.005 };
      }
    },
    {
      name: 'STEP', title: 'Step test',
      desc: 'staircase · +20 users per step',
      color: '#a855f7',
      maxUsers: 100, maxRps: 500,
      curve: (p) => {
        const steps = 5; // 5 plateaus
        const sIdx = Math.min(steps, Math.floor(p * steps) + 1);
        const u = sIdx * 20;
        const targetR = sIdx * 100;
        // within each step, slight rise to target
        const local = (p * steps) - Math.floor(p * steps);
        const r = targetR * (0.85 + local * 0.15) + Math.sin(p * 60) * 6;
        return { users: u, rps: r, failRate: 0 };
      }
    }
  ];

  // ---- phases per cycle ----
  // intro (banner shows) → run (curve plays) → cooldown (drain) → reset (clear)
  const PHASE_DUR = { intro: 900, run: 7000, cooldown: 1100, reset: 500 };
  const PHASE_ORDER = ['intro', 'run', 'cooldown', 'reset'];

  let st = { pi: 0, phase: 'intro', t0: 0 };
  let lastT = 0;

  const phase = () => st.phase;
  const profile = () => PROFILES[st.pi];
  const phaseProg = (now) => Math.max(0, Math.min(1, (now - st.t0) / PHASE_DUR[st.phase]));

  // ---- rolling samples ----
  const RPS_POINTS = 60;
  let rpsBuf = new Array(RPS_POINTS).fill(0);
  let usrBuf = new Array(RPS_POINTS).fill(0);
  let head = 0;

  // accumulators
  let totalRequests = 0;
  let totalFailures = 0;
  const epStats = ENDPOINTS.map(() => ({ req: 0, fail: 0, avgMs: 0, p95Ms: 0 }));

  // 10x10 user dot jitter params
  const USER_DOTS = [];
  for (let i = 0; i < 100; i++) {
    USER_DOTS.push({
      jitterPhase: Math.random() * Math.PI * 2,
      jitterSpeed: 0.6 + Math.random() * 0.9
    });
  }

  const advance = (now) => {
    if (now - st.t0 < PHASE_DUR[st.phase]) return;
    st.t0 = now;
    const next = PHASE_ORDER[(PHASE_ORDER.indexOf(st.phase) + 1) % PHASE_ORDER.length];
    st.phase = next;
    if (next === 'intro') {
      // moving to next profile — reset accumulators + buffers
      st.pi = (st.pi + 1) % PROFILES.length;
      rpsBuf.fill(0); usrBuf.fill(0); head = 0;
      totalRequests = 0; totalFailures = 0;
      for (const s of epStats) { s.req = 0; s.fail = 0; s.avgMs = 0; s.p95Ms = 0; }
    }
  };

  // sample the current state
  const sampleState = (now) => {
    const pr = profile();
    const ph = phase();
    if (ph === 'intro') return { users: 0, rps: 0, failRate: 0 };
    if (ph === 'reset') return { users: 0, rps: 0, failRate: 0 };
    if (ph === 'run') return pr.curve(phaseProg(now));
    // cooldown — drain over cooldown duration from the last 'run' state
    const k = 1 - phaseProg(now);
    const last = pr.curve(1);
    return { users: last.users * k, rps: last.rps * k, failRate: 0 };
  };

  // ---- layout ----
  const layout = () => {
    const SAFE = Math.max(20, W * 0.06);
    const top = 18;
    const totalW = W - SAFE * 2;
    const headerH = 42;
    const panelH = 168;
    const header = { x: SAFE, y: top, w: totalW, h: headerH };
    const py = top + headerH + 10;
    const gap = 12;
    const wL = Math.round(totalW * 0.28);
    const wR = Math.round(totalW * 0.28);
    const wM = totalW - wL - wR - gap * 2;
    return {
      header,
      L: { x: SAFE,                       y: py, w: wL, h: panelH },
      M: { x: SAFE + wL + gap,            y: py, w: wM, h: panelH },
      R: { x: SAFE + wL + gap + wM + gap, y: py, w: wR, h: panelH }
    };
  };

  // ---- header ----
  const drawHeader = (now, h) => {
    const pr = profile();
    const ph = phase();

    // dark bar
    ctx.save();
    ctx.shadowColor = 'rgba(10,10,12,0.12)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#0f1115';
    roundRect(h.x, h.y, h.w, h.h, 10);
    ctx.fill();
    ctx.restore();

    // accent strip on left (profile color)
    ctx.fillStyle = pr.color;
    roundRect(h.x, h.y, 4, h.h, 10);
    ctx.fill();
    ctx.fillRect(h.x + 2, h.y, 2, h.h);

    // locust brand
    ctx.fillStyle = '#16c47b';
    ctx.font = '900 12px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦗 locust', h.x + 14, h.y + h.h / 2 - 8);
    const brandW = ctx.measureText('🦗 locust').width;
    ctx.fillStyle = 'rgba(230,227,218,0.55)';
    ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillText('· users-api', h.x + 14 + brandW + 8, h.y + h.h / 2 - 8);

    // profile NAME big
    ctx.fillStyle = pr.color;
    ctx.font = '900 14px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const introBlink = (ph === 'intro' && (performance.now() % 600) < 320) ? 0.4 : 1;
    ctx.globalAlpha = introBlink;
    ctx.fillText(pr.name, h.x + 14, h.y + h.h / 2 + 9);
    ctx.globalAlpha = 1;
    // subtitle
    const nameW = ctx.measureText(pr.name).width;
    ctx.fillStyle = 'rgba(230,227,218,0.55)';
    ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillText('· ' + pr.desc, h.x + 14 + nameW + 8, h.y + h.h / 2 + 9);

    // status pill (right)
    const labelMap = { intro: 'ARMED', run: 'RUNNING', cooldown: 'STOPPING', reset: 'RESET' };
    const colorMap = { intro: pr.color, run: '#18a957', cooldown: '#f59e0b', reset: '#475569' };
    const pillW = 110;
    const pillY = h.y + (h.h - 22) / 2;
    const pillX = h.x + h.w - 14 - pillW;
    const pulse = (ph === 'intro' || ph === 'run' || ph === 'cooldown');
    if (pulse) { ctx.shadowColor = colorMap[ph]; ctx.shadowBlur = 14; }
    ctx.fillStyle = colorMap[ph];
    roundRect(pillX, pillY, pillW, 22, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (pulse) {
      const a = 0.55 + 0.45 * Math.sin(now / 220);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pillX + 12, pillY + 11, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelMap[ph], pillX + pillW / 2 + 6, pillY + 11);

    // users + spawn (left of pill)
    const s = sampleState(now);
    const uNow = Math.round(s.users);
    ctx.fillStyle = 'rgba(230,227,218,0.85)';
    ctx.font = '700 11px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`users ${uNow}/${pr.maxUsers}`, pillX - 14, h.y + h.h / 2);
    const uW = ctx.measureText(`users ${uNow}/${pr.maxUsers}`).width;
    // profile progress dots (top right)
    for (let i = 0; i < PROFILES.length; i++) {
      const dx = pillX - 14 - uW - 14 - (PROFILES.length - 1 - i) * 10;
      ctx.fillStyle = (i === st.pi) ? PROFILES[i].color : 'rgba(230,227,218,0.20)';
      ctx.beginPath();
      ctx.arc(dx, h.y + h.h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ---- left panel: users grid + big count ----
  const drawUsersPanel = (now, r) => {
    panelChrome(r, 'USERS', profile().color);
    const s = sampleState(now);
    const u = Math.round(s.users);
    const pr = profile();
    ctx.fillStyle = '#1d1d22';
    ctx.font = '900 32px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(u), r.x + 14, r.y + 30);
    ctx.fillStyle = 'rgba(10,10,12,0.45)';
    ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillText(`/ ${pr.maxUsers} target`, r.x + 14, r.y + 64);

    // ramp progress bar (current/max)
    const barX = r.x + 14;
    const barY = r.y + 84;
    const barW = r.w - 28;
    ctx.fillStyle = 'rgba(10,10,12,0.06)';
    roundRect(barX, barY, barW, 4, 2);
    ctx.fill();
    const ratio = Math.min(1, u / pr.maxUsers);
    if (ratio > 0) {
      const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      g.addColorStop(0, pr.color);
      g.addColorStop(1, pr.color);
      ctx.fillStyle = g;
      roundRect(barX, barY, barW * ratio, 4, 2);
      ctx.fill();
    }

    // dots grid (10x10) — visualize active workers up to 100
    const gridX = r.x + 14;
    const gridY = r.y + 98;
    const gridW = r.w - 28;
    const gridH = r.h - (gridY - r.y) - 10;
    const cols = 10, rows = 10;
    const cw = gridW / cols;
    const ch = gridH / rows;
    const activeDots = Math.min(100, Math.round((u / pr.maxUsers) * 100));
    for (let i = 0; i < 100; i++) {
      const dot = USER_DOTS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = gridX + col * cw + cw / 2;
      const cy = gridY + row * ch + ch / 2;
      const active = i < activeDots;
      if (active) {
        const jx = Math.sin(now / 600 * dot.jitterSpeed + dot.jitterPhase) * 0.6;
        const jy = Math.cos(now / 600 * dot.jitterSpeed + dot.jitterPhase) * 0.6;
        ctx.fillStyle = pr.color;
        ctx.beginPath();
        ctx.arc(cx + jx, cy + jy, 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(10,10,12,0.10)';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // ---- middle panel: RPS chart ----
  const drawChartPanel = (now, r) => {
    panelChrome(r, 'REQUESTS / SEC', '#0ea5e9');
    const pr = profile();
    const s = sampleState(now);

    // push samples
    if (!drawChartPanel.lastSample || now - drawChartPanel.lastSample > 80) {
      rpsBuf[head] = s.rps;
      usrBuf[head] = s.users;
      head = (head + 1) % RPS_POINTS;
      drawChartPanel.lastSample = now;
      const dt = 0.08;
      const inc = s.rps * dt;
      totalRequests += inc;
      for (let i = 0; i < ENDPOINTS.length; i++) {
        const subInc = inc * ENDPOINTS[i].weight;
        epStats[i].req += subInc;
        const baseFail = (i === 1) ? 0.012 : 0.004;
        const failInc = subInc * (baseFail + (s.failRate || 0));
        epStats[i].fail += failInc;
        totalFailures += failInc;
        const targetAvg = 40 + i * 22 + (s.rps / 14) + (s.failRate ? s.failRate * 200 : 0);
        epStats[i].avgMs += (targetAvg - epStats[i].avgMs) * 0.18;
        epStats[i].p95Ms += (targetAvg * 2.2 - epStats[i].p95Ms) * 0.18;
      }
    }

    const cx0 = r.x + 14;
    const cy0 = r.y + 36;
    const cw  = r.w - 28;
    const ch  = r.h - (cy0 - r.y) - 16;

    // grid + axis labels
    ctx.strokeStyle = 'rgba(10,10,12,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = cy0 + (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(cx0, yy);
      ctx.lineTo(cx0 + cw, yy);
      ctx.stroke();
    }
    const maxRps = pr.maxRps;
    ctx.fillStyle = 'rgba(10,10,12,0.40)';
    ctx.font = '600 8px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      ctx.fillText(String(Math.round(maxRps - (maxRps / 4) * i)), cx0 + 2, cy0 + (ch / 4) * i);
    }

    // line
    ctx.beginPath();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = pr.color;
    for (let i = 0; i < RPS_POINTS; i++) {
      const idx = (head + i) % RPS_POINTS;
      const v = Math.max(0, Math.min(maxRps, rpsBuf[idx]));
      const xx = cx0 + (i / (RPS_POINTS - 1)) * cw;
      const yy = cy0 + ch - (v / maxRps) * ch;
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();

    // area fill
    ctx.lineTo(cx0 + cw, cy0 + ch);
    ctx.lineTo(cx0, cy0 + ch);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, cy0, 0, cy0 + ch);
    const rgb = hexToRgb(pr.color);
    g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.30)`);
    g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.00)`);
    ctx.fillStyle = g;
    ctx.fill();

    // current value (big, top right)
    const curr = Math.round(s.rps);
    ctx.fillStyle = pr.color;
    ctx.font = '900 18px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${curr}`, r.x + r.w - 16, r.y + 30);
    ctx.fillStyle = 'rgba(10,10,12,0.45)';
    ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillText('rps', r.x + r.w - 16, r.y + 52);

    // cursor dot at last sample
    if (curr > 0) {
      const lastIdx = (head - 1 + RPS_POINTS) % RPS_POINTS;
      const xx = cx0 + cw;
      const yy = cy0 + ch - (Math.max(0, Math.min(maxRps, rpsBuf[lastIdx])) / maxRps) * ch;
      ctx.shadowColor = pr.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(xx, yy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // breakpoint marker for STRESS
    if (pr.name === 'STRESS' && phase() === 'run' && phaseProg(now) > 0.65) {
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      const bx = cx0 + cw * 0.65;
      ctx.beginPath();
      ctx.moveTo(bx, cy0);
      ctx.lineTo(bx, cy0 + ch);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '700 8px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('break', bx + 3, cy0 + 2);
    }
  };

  // ---- right panel: metrics ----
  const drawMetricsPanel = (now, r) => {
    panelChrome(r, 'METRICS', '#6d3df1');
    const failPct = totalRequests > 0 ? (totalFailures / totalRequests * 100) : 0;
    const rows = [
      { label: 'TOTAL', value: formatNum(Math.round(totalRequests)), color: '#1d1d22' },
      { label: 'FAILS',
        value: `${Math.round(totalFailures)}` + (totalRequests > 0 ? `  ${failPct.toFixed(2)}%` : ''),
        color: failPct > 1 ? '#ef4444' : (failPct > 0.1 ? '#f59e0b' : '#0a6f3a') },
      { label: 'AVG ms', value: epStats[0].avgMs ? Math.round(avg(epStats.map(s => s.avgMs))) + ' ms' : '— ms', color: '#1d1d22' },
      { label: 'P95 ms', value: epStats[0].p95Ms ? Math.round(avg(epStats.map(s => s.p95Ms))) + ' ms' : '— ms', color: '#f59e0b' }
    ];
    const rowH = (r.h - 38) / rows.length;
    for (let i = 0; i < rows.length; i++) {
      const yy = r.y + 30 + i * rowH;
      ctx.fillStyle = 'rgba(10,10,12,0.45)';
      ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(rows[i].label, r.x + 14, yy + rowH / 2);
      ctx.fillStyle = rows[i].color;
      ctx.font = '900 13px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(rows[i].value, r.x + r.w - 14, yy + rowH / 2);
      if (i < rows.length - 1) {
        ctx.strokeStyle = 'rgba(10,10,12,0.06)';
        ctx.beginPath();
        ctx.moveTo(r.x + 12, yy + rowH);
        ctx.lineTo(r.x + r.w - 12, yy + rowH);
        ctx.stroke();
      }
    }
  };

  // panel chrome
  const panelChrome = (r, label, accent) => {
    ctx.save();
    ctx.shadowColor = 'rgba(10,10,12,0.10)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#ffffff';
    roundRect(r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(10,10,12,0.08)';
    ctx.lineWidth = 1;
    roundRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 12);
    ctx.stroke();
    ctx.fillStyle = 'rgba(10,10,12,0.04)';
    roundRect(r.x, r.y, r.w, 22, 12);
    ctx.fill();
    ctx.fillRect(r.x, r.y + 14, r.w, 8);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(r.x + 12, r.y + 11, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(10,10,12,0.70)';
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, r.x + 22, r.y + 11);
  };

  function avg(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
  function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 1 : 2) + 'k';
    return String(n);
  }
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  const tick = (now) => {
    if (!lastT) { lastT = now; st.t0 = now; }
    lastT = now;
    advance(now);

    ctx.clearRect(0, 0, W, H);
    const lay = layout();

    drawHeader(now, lay.header);
    drawUsersPanel(now, lay.L);
    drawChartPanel(now, lay.M);
    drawMetricsPanel(now, lay.R);

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();


/* =========================================================
   INLINE CARD ANIMATIONS — full-width horizontal strips
   Each has a TAB UI at top so the viewer instantly sees
   which mode is being demonstrated. Below tabs is a
   live mock of the tool's actual interface.

   - card-canvas-api    : Postman-style with GET/POST/PUT/DELETE tabs
   - card-canvas-locust : Locust dashboard with LOAD/SPIKE/STRESS/SOAK/STEP tabs
   - card-canvas-zap    : OWASP ZAP console with SPIDER/ACTIVE/REPORT tabs
   ========================================================= */

(() => {
  if (window.__cardCanvasShared) return;
  window.__cardCanvasShared = true;

  window.__setupCardCanvas = (id, sizer) => {
    const c = document.getElementById(id);
    if (!c) return null;
    const ctx = c.getContext('2d');
    let dpr = 1, W = 0, H = 0;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = c.getBoundingClientRect();
      W = Math.max(360, r.width);
      H = Math.max(180, r.height);
      c.width = W * dpr; c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (sizer) sizer(W, H);
    };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(c);
    window.addEventListener('resize', resize);
    resize();
    return { c, ctx, get W(){ return W; }, get H(){ return H; } };
  };

  window.__roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  window.__hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  };

  // shared tab drawing helper
  // tabs: [{ label, color }], activeIdx, layout: { x, y, w, h }
  window.__drawTabs = (ctx, tabs, activeIdx, layout, opts) => {
    const { x, y, w, h } = layout;
    const o = opts || {};
    const fontSize = o.fontSize || 11;
    const gap = o.gap != null ? o.gap : 4;
    const tabW = (w - gap * (tabs.length - 1)) / tabs.length;
    ctx.font = `700 ${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
    for (let i = 0; i < tabs.length; i++) {
      const tx = x + i * (tabW + gap);
      const isActive = i === activeIdx;
      const t = tabs[i];
      // tab body
      if (isActive) {
        // active tab — colored
        ctx.fillStyle = t.color;
        window.__roundRect(ctx, tx, y, tabW, h, 6);
        ctx.fill();
        // glow
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 8;
        window.__roundRect(ctx, tx, y, tabW, h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = 'rgba(10,10,12,0.04)';
        window.__roundRect(ctx, tx, y, tabW, h, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(10,10,12,0.08)';
        ctx.lineWidth = 1;
        window.__roundRect(ctx, tx + 0.5, y + 0.5, tabW - 1, h - 1, 6);
        ctx.stroke();
        ctx.fillStyle = 'rgba(10,10,12,0.45)';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.label, tx + tabW / 2, y + h / 2);
    }
  };
})();


/* ---------- 1. REST API — Postman with method tabs ---------- */
(() => {
  const cv = window.__setupCardCanvas && window.__setupCardCanvas('card-canvas-api');
  if (!cv) return;
  const { ctx } = cv;
  const roundRect = (x, y, w, h, r) => window.__roundRect(ctx, x, y, w, h, r);

  const METHODS = [
    { name: 'GET',    color: '#18a957', path: '/api/v2/users',         status: '200 OK',      sColor: '#18a957', time: '142', body: ['[', '  { "id": 1, "name": "Ada"  },', '  { "id": 2, "name": "Lin"  },', '  { "id": 3, "name": "Sage" }', ']'] },
    { name: 'POST',   color: '#6d3df1', path: '/api/v2/users',         status: '201 Created', sColor: '#18a957', time: '188', body: ['{', '  "id": 42,', '  "name": "Lin",', '  "created": "2026-05-22T10:14:00Z"', '}'] },
    { name: 'PUT',    color: '#f59e0b', path: '/api/v2/users/42',      status: '200 OK',      sColor: '#18a957', time: '167', body: ['{', '  "id": 42,', '  "role": "admin",', '  "updated": true', '}'] },
    { name: 'DELETE', color: '#ef4444', path: '/api/v2/users/42',      status: '204 No Content', sColor: '#16c47b', time: ' 98', body: ['(empty response body)'] }
  ];

  const PHASES = ['type', 'send', 'resp', 'pause'];
  const DUR = { type: 1100, send: 700, resp: 1100, pause: 1300 };
  let mi = 0, ph = 0, t0 = 0, last = 0;

  const advance = (now) => {
    if (now - t0 < DUR[PHASES[ph]]) return;
    t0 = now;
    ph = (ph + 1) % PHASES.length;
    if (ph === 0) mi = (mi + 1) % METHODS.length;
  };
  const prog = (now) => Math.min(1, Math.max(0, (now - t0) / DUR[PHASES[ph]]));
  const phase = () => PHASES[ph];

  const tick = (now) => {
    if (!last) { last = now; t0 = now; }
    last = now;
    advance(now);
    const W = cv.W, H = cv.H;
    const m = METHODS[mi];

    // ----- bg -----
    ctx.clearRect(0, 0, W, H);

    // ----- tabs -----
    const padX = 14;
    const tabY = 12;
    const tabH = 28;
    window.__drawTabs(
      ctx,
      METHODS.map(x => ({ label: x.name, color: x.color })),
      mi,
      { x: padX, y: tabY, w: W - padX * 2, h: tabH },
      { fontSize: 11, gap: 6 }
    );

    // ----- URL bar + Send -----
    const urlY = tabY + tabH + 12;
    const urlH = 30;
    const btnW = 70;
    const urlW = W - padX * 2 - btnW - 8;
    // url field
    ctx.fillStyle = '#ffffff';
    roundRect(padX, urlY, urlW, urlH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,12,0.12)';
    ctx.lineWidth = 1;
    roundRect(padX + 0.5, urlY + 0.5, urlW - 1, urlH - 1, 6);
    ctx.stroke();
    // small method label in url (left)
    ctx.fillStyle = m.color;
    ctx.font = '900 11px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.name, padX + 10, urlY + urlH / 2);
    const mw = ctx.measureText(m.name).width;
    // divider
    ctx.strokeStyle = 'rgba(10,10,12,0.10)';
    ctx.beginPath();
    ctx.moveTo(padX + 10 + mw + 8, urlY + 6);
    ctx.lineTo(padX + 10 + mw + 8, urlY + urlH - 6);
    ctx.stroke();
    // typed path
    let typed = m.path;
    if (phase() === 'type') typed = m.path.slice(0, Math.ceil(m.path.length * prog(now)));
    ctx.fillStyle = '#1d1d22';
    ctx.font = '600 12px ui-monospace, "JetBrains Mono", monospace';
    const pathX = padX + 10 + mw + 16;
    ctx.fillText(typed, pathX, urlY + urlH / 2);
    if (phase() === 'type' && (performance.now() % 700) < 380) {
      const cw = ctx.measureText(typed).width;
      ctx.fillStyle = m.color;
      ctx.fillRect(pathX + cw + 2, urlY + 7, 2, urlH - 14);
    }
    // send button
    const btnX = W - padX - btnW;
    const sending = phase() === 'send';
    if (sending) { ctx.shadowColor = m.color; ctx.shadowBlur = 14; }
    ctx.fillStyle = m.color;
    roundRect(btnX, urlY, btnW, urlH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 12px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sending ? 'Sending…' : 'Send', btnX + btnW / 2, urlY + urlH / 2);

    // ----- arrow / packet lane -----
    const laneY = urlY + urlH + 14;
    ctx.strokeStyle = 'rgba(10,10,12,0.10)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, laneY);
    ctx.lineTo(W - padX, laneY);
    ctx.stroke();
    ctx.setLineDash([]);
    // direction labels
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(10,10,12,0.40)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('REQUEST →', padX, laneY - 9);
    ctx.textAlign = 'right';
    ctx.fillText('← RESPONSE', W - padX, laneY - 9);
    if (sending) {
      const t = prog(now);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const px = padX + (W - padX * 2) * e;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(px, laneY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      for (let k = 1; k <= 6; k++) {
        const tk = Math.max(0, e - k * 0.05);
        const tx = padX + (W - padX * 2) * tk;
        ctx.globalAlpha = (6 - k) / 8;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(tx, laneY, 4 - k * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ----- response panel -----
    const respY = laneY + 14;
    const respH = H - respY - 10;
    // dark code panel
    ctx.fillStyle = '#0e1116';
    roundRect(padX, respY, W - padX * 2, respH, 8);
    ctx.fill();
    // header row inside panel
    const headerH = 24;
    ctx.fillStyle = '#181c23';
    roundRect(padX, respY, W - padX * 2, headerH, 8);
    ctx.fill();
    // mask bottom corners of header
    ctx.fillStyle = '#181c23';
    ctx.fillRect(padX, respY + headerH - 8, W - padX * 2, 8);
    const showResp = phase() === 'resp' || phase() === 'pause';
    if (showResp) {
      // status pill
      const statusText = m.status;
      ctx.font = '800 10px ui-monospace, "JetBrains Mono", monospace';
      const sw = ctx.measureText(statusText).width + 14;
      ctx.fillStyle = m.sColor;
      roundRect(padX + 8, respY + 5, sw, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(statusText, padX + 8 + sw / 2, respY + 12);
      // time
      ctx.fillStyle = '#9bc3a8';
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${m.time} ms`, padX + 8 + sw + 10, respY + 12);
      // content-type tag right
      ctx.fillStyle = '#7aa8d8';
      ctx.textAlign = 'right';
      ctx.fillText('application/json', W - padX - 10, respY + 12);
    } else {
      ctx.fillStyle = '#5b6776';
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const label = phase() === 'type' ? 'Building request…' : (sending ? 'Awaiting response…' : 'Ready');
      ctx.fillText(label, padX + 12, respY + 12);
      // animated dots when sending
      if (sending) {
        const dots = '...'.slice(0, 1 + Math.floor((now / 220) % 3));
        const lw = ctx.measureText(label).width;
        ctx.fillStyle = m.color;
        ctx.fillText(dots, padX + 12 + lw + 4, respY + 12);
      }
    }

    // body lines
    if (showResp) {
      const bodyY = respY + headerH + 8;
      const lineH = 14;
      ctx.font = '600 11px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const maxLines = Math.floor((respH - headerH - 16) / lineH);
      const lines = m.body.slice(0, maxLines);
      // typing animation during 'resp' phase
      const totalChars = lines.reduce((a, l) => a + l.length, 0);
      const charsToShow = phase() === 'resp' ? Math.ceil(totalChars * prog(now)) : totalChars;
      let used = 0;
      for (let i = 0; i < lines.length; i++) {
        const remain = charsToShow - used;
        if (remain <= 0) break;
        const ln = lines[i].slice(0, remain);
        used += lines[i].length;
        // line number
        ctx.fillStyle = '#3a4452';
        ctx.fillText(String(i + 1).padStart(2, ' '), padX + 10, bodyY + i * lineH);
        // syntax-ish coloring
        let color = '#cfd6df';
        if (/^\s*[\[\]{}]/.test(ln) || /^\s*\)/.test(ln)) color = '#cfd6df';
        if (/".*"\s*:/.test(ln)) color = '#7aa8d8';
        if (/:\s*"/.test(ln)) color = '#9bd1a8';
        if (/:\s*\d/.test(ln)) color = '#f5b56b';
        if (ln.includes('(empty')) color = '#5b6776';
        ctx.fillStyle = color;
        ctx.fillText(ln, padX + 30, bodyY + i * lineH);
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();


/* ---------- 2. Locust — dashboard with profile tabs ---------- */
(() => {
  const cv = window.__setupCardCanvas && window.__setupCardCanvas('card-canvas-locust');
  if (!cv) return;
  const { ctx } = cv;
  const roundRect = (x, y, w, h, r) => window.__roundRect(ctx, x, y, w, h, r);
  const hexToRgb = window.__hexToRgb;

  const PROFILES = [
    { name: 'LOAD',   color: '#16c47b', desc: 'sustained users',
      curve: (p) => ({ u: p < 0.35 ? (p / 0.35) * 100 : 100, r: p < 0.35 ? (p / 0.35) * 480 : 480 + Math.sin(p * 18) * 14, f: p < 0.5 ? 0.1 : 0.3 }), maxU: 100, maxR: 520 },
    { name: 'SPIKE',  color: '#ef4444', desc: 'sudden surge',
      curve: (p) => {
        let u, r, f;
        if (p < 0.25) { u = (p / 0.25) * 40; r = (p / 0.25) * 150; f = 0.1; }
        else if (p < 0.40) { const k = (p - 0.25) / 0.15; u = 40 + k * 210; r = 150 + k * 750; f = 0.1 + k * 6; }
        else if (p < 0.80) { u = 250; r = 900 + Math.sin(p * 30) * 18; f = 6 + Math.sin(p * 20) * 1.5; }
        else { const k = 1 - (p - 0.80) / 0.20; u = 250 * k; r = 900 * k; f = 1.5 * k; }
        return { u, r, f };
      }, maxU: 250, maxR: 950 },
    { name: 'STRESS', color: '#f59e0b', desc: 'find breaking point',
      curve: (p) => {
        const u = Math.min(300, p * 320);
        let r;
        if (p < 0.65) r = (p / 0.65) * 680;
        else r = Math.max(160, 680 - ((p - 0.65) / 0.35) * 500);
        const f = p < 0.65 ? p * 1.5 : 1 + (p - 0.65) * 25;
        return { u, r, f };
      }, maxU: 300, maxR: 720 },
    { name: 'SOAK',   color: '#0ea5e9', desc: '24h endurance',
      curve: (p) => ({ u: p < 0.1 ? (p / 0.1) * 80 : 80, r: p < 0.1 ? (p / 0.1) * 330 : 330 + Math.sin(p * 40) * 8, f: 0.4 }), maxU: 80, maxR: 360 },
    { name: 'STEP',   color: '#a855f7', desc: 'staged ramp',
      curve: (p) => {
        const steps = 5;
        const idx = Math.min(steps, Math.floor(p * steps) + 1);
        return { u: idx * 20, r: idx * 100 - 5, f: 0.2 + idx * 0.1 };
      }, maxU: 100, maxR: 500 }
  ];

  const PH_DUR = { intro: 500, run: 5500, cooldown: 700 };
  const PH_ORDER = ['intro', 'run', 'cooldown'];
  let st = { pi: 0, ph: 0, t0: 0 };
  let last = 0;

  const POINTS = 60;
  const usersBuf = new Array(POINTS).fill(0);
  const rpsBuf = new Array(POINTS).fill(0);
  let head = 0;

  const advance = (now) => {
    const cur = PH_ORDER[st.ph];
    if (now - st.t0 < PH_DUR[cur]) return;
    st.t0 = now;
    st.ph = (st.ph + 1) % PH_ORDER.length;
    if (st.ph === 0) {
      st.pi = (st.pi + 1) % PROFILES.length;
      usersBuf.fill(0); rpsBuf.fill(0); head = 0;
    }
  };
  const prog = (now) => {
    const cur = PH_ORDER[st.ph];
    return Math.min(1, Math.max(0, (now - st.t0) / PH_DUR[cur]));
  };
  const phaseN = () => PH_ORDER[st.ph];

  const sample = (now) => {
    const pr = PROFILES[st.pi];
    if (phaseN() === 'intro') return { u: 0, r: 0, f: 0 };
    if (phaseN() === 'run') return pr.curve(prog(now));
    const k = 1 - prog(now);
    const lastS = pr.curve(1);
    return { u: lastS.u * k, r: lastS.r * k, f: lastS.f * k };
  };

  const fmt = (v) => Math.round(v).toString();

  const tick = (now) => {
    if (!last) { last = now; st.t0 = now; }
    last = now;
    advance(now);
    const W = cv.W, H = cv.H;
    ctx.clearRect(0, 0, W, H);
    const pr = PROFILES[st.pi];
    const s = sample(now);

    if (!tick._lastSample || now - tick._lastSample > 70) {
      usersBuf[head] = s.u; rpsBuf[head] = s.r;
      head = (head + 1) % POINTS;
      tick._lastSample = now;
    }

    const padX = 14;

    // ----- tabs -----
    const tabY = 12;
    const tabH = 26;
    window.__drawTabs(
      ctx,
      PROFILES.map(x => ({ label: x.name, color: x.color })),
      st.pi,
      { x: padX, y: tabY, w: W - padX * 2, h: tabH },
      { fontSize: 10, gap: 5 }
    );

    // ----- KPI strip -----
    const kpiY = tabY + tabH + 10;
    const kpiH = 46;
    const kpiGap = 10;
    const kpiW = (W - padX * 2 - kpiGap * 2) / 3;
    const kpis = [
      { label: 'USERS', val: fmt(s.u), max: `/ ${pr.maxU}`, color: pr.color },
      { label: 'RPS',   val: fmt(s.r), max: `/ ${pr.maxR}`, color: pr.color },
      { label: 'FAIL%', val: s.f.toFixed(1), max: 'target < 1', color: s.f > 1 ? '#ef4444' : '#16c47b' }
    ];
    for (let i = 0; i < 3; i++) {
      const kx = padX + i * (kpiW + kpiGap);
      // box
      ctx.fillStyle = '#ffffff';
      roundRect(kx, kpiY, kpiW, kpiH, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(10,10,12,0.08)';
      ctx.lineWidth = 1;
      roundRect(kx + 0.5, kpiY + 0.5, kpiW - 1, kpiH - 1, 6);
      ctx.stroke();
      // label
      ctx.fillStyle = 'rgba(10,10,12,0.50)';
      ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(kpis[i].label, kx + 10, kpiY + 6);
      // value
      ctx.fillStyle = kpis[i].color;
      ctx.font = '900 20px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText(kpis[i].val, kx + 10, kpiY + 18);
      // suffix
      ctx.fillStyle = 'rgba(10,10,12,0.40)';
      ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
      const vw = ctx.measureText(kpis[i].val).width;
      ctx.fillText(kpis[i].max, kx + 10 + vw + 6, kpiY + 28);
    }

    // ----- big chart -----
    const cx0 = padX;
    const cy0 = kpiY + kpiH + 10;
    const cw  = W - padX * 2;
    const ch  = H - cy0 - 18;
    // chart bg
    ctx.fillStyle = '#ffffff';
    roundRect(cx0, cy0, cw, ch, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,12,0.08)';
    ctx.lineWidth = 1;
    roundRect(cx0 + 0.5, cy0 + 0.5, cw - 1, ch - 1, 8);
    ctx.stroke();
    // gridlines
    ctx.strokeStyle = 'rgba(10,10,12,0.05)';
    for (let i = 1; i < 4; i++) {
      const yy = cy0 + (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(cx0 + 6, yy);
      ctx.lineTo(cx0 + cw - 6, yy);
      ctx.stroke();
    }
    // y-axis labels
    ctx.fillStyle = 'rgba(10,10,12,0.30)';
    ctx.font = '600 8px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const yy = cy0 + (ch / 4) * i;
      const v = Math.round(pr.maxR * (1 - i / 4));
      ctx.fillText(String(v), cx0 - 2, yy);
    }
    // RPS area + line
    const rgb = hexToRgb(pr.color);
    ctx.beginPath();
    for (let i = 0; i < POINTS; i++) {
      const idx = (head + i) % POINTS;
      const v = Math.max(0, Math.min(pr.maxR, rpsBuf[idx]));
      const xx = cx0 + 8 + (i / (POINTS - 1)) * (cw - 16);
      const yy = cy0 + ch - 6 - (v / pr.maxR) * (ch - 12);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.lineTo(cx0 + cw - 8, cy0 + ch - 6);
    ctx.lineTo(cx0 + 8, cy0 + ch - 6);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, cy0, 0, cy0 + ch);
    g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`);
    g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.02)`);
    ctx.fillStyle = g;
    ctx.fill();
    // line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = pr.color;
    for (let i = 0; i < POINTS; i++) {
      const idx = (head + i) % POINTS;
      const v = Math.max(0, Math.min(pr.maxR, rpsBuf[idx]));
      const xx = cx0 + 8 + (i / (POINTS - 1)) * (cw - 16);
      const yy = cy0 + ch - 6 - (v / pr.maxR) * (ch - 12);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    // current point
    if (phaseN() === 'run' || phaseN() === 'cooldown') {
      const lastIdx = (head - 1 + POINTS) % POINTS;
      const v = Math.max(0, Math.min(pr.maxR, rpsBuf[lastIdx]));
      const xx = cx0 + 8 + ((POINTS - 1) / (POINTS - 1)) * (cw - 16);
      const yy = cy0 + ch - 6 - (v / pr.maxR) * (ch - 12);
      ctx.shadowColor = pr.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(xx, yy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // STRESS breakpoint marker
    if (pr.name === 'STRESS' && phaseN() === 'run' && prog(now) > 0.65) {
      const bx = cx0 + 8 + 0.65 * (cw - 16);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, cy0 + 8);
      ctx.lineTo(bx, cy0 + ch - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '800 8px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('BREAK', bx + 3, cy0 + 8);
    }
    // chart title
    ctx.fillStyle = 'rgba(10,10,12,0.50)';
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`RPS · ${pr.desc}`, cx0 + 10, cy0 + 8);
    // status at bottom
    ctx.fillStyle = 'rgba(10,10,12,0.55)';
    ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    let statusTxt;
    if (phaseN() === 'intro') statusTxt = `Starting ${pr.name} test…`;
    else if (phaseN() === 'cooldown') statusTxt = `Cooldown · ${pr.name} complete`;
    else statusTxt = `Running ${pr.name} · ${Math.round(s.u)} users → ${Math.round(s.r)} req/s`;
    ctx.fillText(statusTxt, padX, H - 4);

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();


/* ---------- 3. OWASP ZAP — scanner with phase tabs ---------- */
(() => {
  const cv = window.__setupCardCanvas && window.__setupCardCanvas('card-canvas-zap');
  if (!cv) return;
  const { ctx } = cv;
  const roundRect = (x, y, w, h, r) => window.__roundRect(ctx, x, y, w, h, r);

  const TABS = [
    { name: 'SPIDER',  color: '#0ea5e9', dur: 2600, label: 'crawling site map' },
    { name: 'ACTIVE',  color: '#f59e0b', dur: 3400, label: 'injection & XSS tests' },
    { name: 'REPORT',  color: '#18a957', dur: 2600, label: 'severity summary' }
  ];

  // urls discovered progressively
  const URLS = [
    '/login',
    '/api/v2/users',
    '/api/v2/orders',
    '/admin/dashboard',
    '/search?q=',
    '/go?u=',
    '/api/v2/profile',
    '/static/cookie'
  ];

  // attack payloads tested
  const PAYLOADS = [
    { method: 'POST', path: '/login',        payload: "' OR 1=1 --",         finding: 'SQL Injection',     sev: 'HIGH' },
    { method: 'GET',  path: '/search',       payload: '<script>x</script>',  finding: 'Reflected XSS',     sev: 'HIGH' },
    { method: 'POST', path: '/api/profile',  payload: 'no csrf token',       finding: 'Missing CSRF',      sev: 'MED'  },
    { method: 'GET',  path: '/go?u=',        payload: 'evil.example.com',    finding: 'Open Redirect',     sev: 'MED'  },
    { method: 'GET',  path: '/',             payload: 'HSTS header probe',   finding: 'Missing HSTS',      sev: 'LOW'  },
    { method: 'GET',  path: '/',             payload: 'X-Frame probe',       finding: 'No X-Frame-Options',sev: 'LOW'  }
  ];

  // report findings (final)
  const FINDINGS = [
    { sev: 'HIGH', label: 'SQL Injection · /login',         color: '#ef4444' },
    { sev: 'HIGH', label: 'XSS Reflected · /search',        color: '#ef4444' },
    { sev: 'MED',  label: 'Missing CSRF · /api/profile',    color: '#f59e0b' },
    { sev: 'MED',  label: 'Open Redirect · /go?u=',         color: '#f59e0b' },
    { sev: 'LOW',  label: 'Missing HSTS header',            color: '#16c47b' },
    { sev: 'LOW',  label: 'X-Frame-Options absent',         color: '#16c47b' }
  ];

  let ti = 0, t0 = 0, last = 0;

  const advance = (now) => {
    if (now - t0 < TABS[ti].dur) return;
    t0 = now;
    ti = (ti + 1) % TABS.length;
  };
  const prog = (now) => Math.min(1, Math.max(0, (now - t0) / TABS[ti].dur));

  const drawShield = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 8, y - 5);
    ctx.lineTo(x + 8, y + 3);
    ctx.quadraticCurveTo(x + 8, y + 8, x, y + 10);
    ctx.quadraticCurveTo(x - 8, y + 8, x - 8, y + 3);
    ctx.lineTo(x - 8, y - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 10px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', x, y);
  };

  const tick = (now) => {
    if (!last) { last = now; t0 = now; }
    last = now;
    advance(now);
    const W = cv.W, H = cv.H;
    ctx.clearRect(0, 0, W, H);
    const tab = TABS[ti];
    const padX = 14;

    // ----- tabs -----
    const tabY = 12;
    const tabH = 26;
    window.__drawTabs(
      ctx,
      TABS.map(x => ({ label: x.name, color: x.color })),
      ti,
      { x: padX, y: tabY, w: W - padX * 2, h: tabH },
      { fontSize: 11, gap: 6 }
    );

    // ----- target URL bar -----
    const urlY = tabY + tabH + 10;
    const urlH = 28;
    ctx.fillStyle = '#ffffff';
    roundRect(padX, urlY, W - padX * 2, urlH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,10,12,0.10)';
    ctx.lineWidth = 1;
    roundRect(padX + 0.5, urlY + 0.5, W - padX * 2 - 1, urlH - 1, 6);
    ctx.stroke();
    drawShield(padX + 16, urlY + urlH / 2, tab.color);
    ctx.fillStyle = '#1d1d22';
    ctx.font = '700 11px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('target:', padX + 30, urlY + urlH / 2);
    ctx.fillStyle = tab.color;
    ctx.fillText('https://staging.app.example.com', padX + 30 + ctx.measureText('target:').width + 6, urlY + urlH / 2);
    // status pill right
    const pillW = 90;
    const pillX = W - padX - pillW - 8;
    ctx.shadowColor = tab.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = tab.color;
    roundRect(pillX, urlY + 5, pillW, urlH - 10, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    const pulse = 0.55 + 0.45 * Math.sin(now / 220);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pillX + 9, urlY + urlH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 10px ui-monospace, "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RUNNING', pillX + pillW / 2 + 5, urlY + urlH / 2);

    // ----- main content area (tab-specific) -----
    const conY = urlY + urlH + 10;
    const conH = H - conY - 8;
    ctx.fillStyle = '#0e1116';
    roundRect(padX, conY, W - padX * 2, conH, 8);
    ctx.fill();

    if (tab.name === 'SPIDER') {
      // discovered URLs list
      const visibleCount = Math.min(URLS.length, Math.ceil(prog(now) * URLS.length * 1.2));
      ctx.font = '700 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      // header
      ctx.fillStyle = '#5b6776';
      ctx.fillText('SPIDER · discovered endpoints', padX + 12, conY + 8);
      ctx.fillStyle = '#0ea5e9';
      ctx.textAlign = 'right';
      ctx.fillText(`${visibleCount} URLs`, W - padX - 12, conY + 8);
      // list (2 columns)
      const listY = conY + 26;
      const colW = (W - padX * 2 - 24) / 2;
      const rowH = 14;
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < visibleCount; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const rx = padX + 12 + col * colW;
        const ry = listY + row * rowH;
        if (ry + rowH > conY + conH - 4) break;
        ctx.fillStyle = '#7dd3a0';
        ctx.textAlign = 'left';
        ctx.fillText('✓', rx, ry + rowH / 2);
        ctx.fillStyle = '#cfd6df';
        ctx.fillText(URLS[i], rx + 14, ry + rowH / 2);
      }
      // scanning cursor on last item
      if (visibleCount < URLS.length) {
        const i = visibleCount;
        const col = i % 2;
        const row = Math.floor(i / 2);
        const rx = padX + 12 + col * colW;
        const ry = listY + row * rowH;
        ctx.fillStyle = tab.color;
        const blink = Math.sin(now / 120) > 0;
        if (blink) ctx.fillRect(rx, ry + 4, 6, rowH - 8);
        ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
        ctx.fillStyle = '#5b6776';
        ctx.fillText('scanning…', rx + 14, ry + rowH / 2);
      }

    } else if (tab.name === 'ACTIVE') {
      // active scan with payload row + progress
      const phaseHeaderY = conY + 8;
      ctx.fillStyle = '#5b6776';
      ctx.font = '700 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('ACTIVE SCAN · testing payloads', padX + 12, phaseHeaderY);
      // progress
      const pctText = `${Math.round(prog(now) * 100)}%`;
      ctx.fillStyle = tab.color;
      ctx.textAlign = 'right';
      ctx.fillText(pctText, W - padX - 12, phaseHeaderY);
      // progress bar
      const pbY = phaseHeaderY + 14;
      const pbH = 5;
      const pbW = W - padX * 2 - 24;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(padX + 12, pbY, pbW, pbH, 2);
      ctx.fill();
      ctx.fillStyle = tab.color;
      roundRect(padX + 12, pbY, pbW * prog(now), pbH, 2);
      ctx.fill();
      // current payload (cycles every 500ms)
      const pi = Math.floor((now - t0) / 540) % PAYLOADS.length;
      const cur = PAYLOADS[pi];
      const rowY = pbY + 14;
      // method pill
      const methodColors = { GET: '#18a957', POST: '#6d3df1', PUT: '#f59e0b', DELETE: '#ef4444' };
      ctx.font = '800 9px ui-monospace, "JetBrains Mono", monospace';
      const mw = Math.max(38, ctx.measureText(cur.method).width + 12);
      ctx.fillStyle = methodColors[cur.method];
      roundRect(padX + 12, rowY, mw, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cur.method, padX + 12 + mw / 2, rowY + 8);
      // path
      ctx.fillStyle = '#cfd6df';
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(cur.path, padX + 12 + mw + 8, rowY + 8);
      // payload line
      const plY = rowY + 22;
      ctx.fillStyle = '#5b6776';
      ctx.font = '600 9px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('payload:', padX + 12, plY);
      ctx.fillStyle = '#f5b56b';
      ctx.font = '700 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillText(cur.payload, padX + 12 + ctx.measureText('payload:').width + 6, plY);
      // alert / finding (revealed after ~250ms inside this payload)
      const phaseSubProg = ((now - t0) / 540) % 1;
      if (phaseSubProg > 0.4) {
        const aY = plY + 18;
        const sevColor = cur.sev === 'HIGH' ? '#ef4444' : cur.sev === 'MED' ? '#f59e0b' : '#16c47b';
        ctx.fillStyle = sevColor;
        ctx.beginPath();
        ctx.arc(padX + 16, aY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '800 9px ui-monospace, "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('ALERT', padX + 22, aY);
        ctx.fillStyle = '#cfd6df';
        ctx.font = '700 10px ui-monospace, "JetBrains Mono", monospace';
        ctx.fillText(`${cur.finding} · severity ${cur.sev}`, padX + 22 + ctx.measureText('ALERT').width + 6, aY);
      }

    } else { // REPORT
      const headerY = conY + 8;
      ctx.fillStyle = '#5b6776';
      ctx.font = '700 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('REPORT · scan complete', padX + 12, headerY);
      ctx.fillStyle = '#18a957';
      ctx.textAlign = 'right';
      ctx.fillText('PDF ready ✓', W - padX - 12, headerY);
      // severity boxes
      const sbY = headerY + 18;
      const sbH = 38;
      const sbGap = 8;
      const sbW = (W - padX * 2 - 24 - sbGap * 2) / 3;
      const sevs = [
        { name: 'HIGH', count: 2, color: '#ef4444' },
        { name: 'MED',  count: 2, color: '#f59e0b' },
        { name: 'LOW',  count: 2, color: '#16c47b' }
      ];
      const revealCount = Math.min(3, Math.ceil(prog(now) * 4));
      for (let i = 0; i < 3; i++) {
        const sx = padX + 12 + i * (sbW + sbGap);
        const sv = sevs[i];
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(sx, sbY, sbW, sbH, 6);
        ctx.fill();
        ctx.strokeStyle = `rgba(${window.__hexToRgb(sv.color).r},${window.__hexToRgb(sv.color).g},${window.__hexToRgb(sv.color).b},0.4)`;
        ctx.lineWidth = 1;
        roundRect(sx + 0.5, sbY + 0.5, sbW - 1, sbH - 1, 6);
        ctx.stroke();
        ctx.fillStyle = sv.color;
        ctx.font = '700 9px ui-monospace, "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(sv.name, sx + 8, sbY + 6);
        ctx.font = '900 20px ui-monospace, "JetBrains Mono", monospace';
        ctx.fillText(i < revealCount ? String(sv.count) : '0', sx + 8, sbY + 16);
      }
      // top findings list below
      const flY = sbY + sbH + 8;
      const lineH = 13;
      const maxLines = Math.floor((conY + conH - 6 - flY) / lineH);
      const visibleFindings = Math.min(FINDINGS.length, Math.ceil(prog(now) * (FINDINGS.length + 1)));
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < Math.min(visibleFindings, maxLines); i++) {
        const f = FINDINGS[i];
        const fy = flY + i * lineH;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(padX + 16, fy + lineH / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = f.color;
        ctx.font = '800 9px ui-monospace, "JetBrains Mono", monospace';
        ctx.fillText(f.sev, padX + 22, fy + lineH / 2);
        const sw = ctx.measureText(f.sev).width;
        ctx.fillStyle = '#cfd6df';
        ctx.font = '600 10px ui-monospace, "JetBrains Mono", monospace';
        ctx.fillText(f.label, padX + 22 + sw + 6, fy + lineH / 2);
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

