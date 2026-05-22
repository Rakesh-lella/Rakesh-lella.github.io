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

  // ===== particle constellation canvas =====
  (() => {
    const c = $('#bg-canvas');
    if (!c || prefersReduced) return;
    const ctx = c.getContext('2d');
    let w, h, dpr, parts;
    const COUNT = Math.min(70, Math.floor(innerWidth / 22));
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    };
    const init = () => {
      parts = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18 * dpr,
        vy: (Math.random() - 0.5) * 0.18 * dpr,
        r: (Math.random() * 1.2 + 0.6) * dpr
      }));
    };
    // ink dots on white background
    const dotCol = 'rgba(10,10,12,1)';
    const lineCol = 'rgba(10,10,12,1)';
    let mx2 = -9999, my2 = -9999;
    window.addEventListener('mousemove', e => { mx2 = e.clientX * dpr; my2 = e.clientY * dpr; }, { passive: true });
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.fillStyle = dotCol; ctx.globalAlpha = .28;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          const max = 130 * dpr * 130 * dpr;
          if (d < max) {
            ctx.globalAlpha = (1 - d / max) * 0.12;
            ctx.strokeStyle = lineCol;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const dxm = parts[i].x - mx2, dym = parts[i].y - my2, dm = dxm * dxm + dym * dym;
        const maxM = 180 * dpr * 180 * dpr;
        if (dm < maxM) {
          ctx.globalAlpha = (1 - dm / maxM) * 0.22;
          ctx.strokeStyle = 'rgba(24,169,87,1)';
          ctx.beginPath(); ctx.moveTo(parts[i].x, parts[i].y); ctx.lineTo(mx2, my2); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    };
    resize(); init();
    window.addEventListener('resize', () => { resize(); init(); });
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
