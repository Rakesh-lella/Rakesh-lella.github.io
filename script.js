/* =========================================================
   Rakesh L — QA Engineer Portfolio · interactions + test lab
   ========================================================= */
(() => {
  'use strict';

  // ---- year ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- theme toggle ----
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('rl-theme');
  if (stored) root.setAttribute('data-theme', stored);
  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('rl-theme', next);
  });

  // ---- mobile nav ----
  const nav = document.querySelector('.nav');
  document.querySelector('.nav-toggle')?.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  // ---- reveal on scroll ----
  const revealEls = document.querySelectorAll('.section, .hero-stats > div, .work-card, .stack-card, .lab-card, .timeline li, .c-card');
  revealEls.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  revealEls.forEach(el => io.observe(el));

  // =========================================================
  // TERMINAL TYPING
  // =========================================================
  const termCode = document.getElementById('term-code');
  if (termCode) {
    const lines = [
      { t: '<span class="c-prompt">$</span> <span class="c-cmd">npx playwright test</span>', d: 600 },
      { t: '<span class="c-dim">Running 24 tests using 4 workers</span>', d: 500 },
      { t: '  <span class="c-pass">✓</span> login.spec.ts › valid user signs in <span class="c-dim">(1.2s)</span>', d: 220 },
      { t: '  <span class="c-pass">✓</span> checkout.spec.ts › cart totals <span class="c-dim">(2.0s)</span>', d: 220 },
      { t: '  <span class="c-pass">✓</span> api.spec.ts › POST /declarations <span class="c-dim">(0.4s)</span>', d: 220 },
      { t: '  <span class="c-pass">✓</span> customs.spec.ts › import workflow <span class="c-dim">(3.1s)</span>', d: 220 },
      { t: '  <span class="c-pass">✓</span> a11y.spec.ts › landmarks present <span class="c-dim">(0.6s)</span>', d: 220 },
      { t: '<span class="c-info">  24 passed</span> <span class="c-dim">(12.4s)</span>', d: 400 },
      { t: '<span class="c-prompt">$</span> <span class="c-cmd">_</span>', d: 600 },
    ];
    let i = 0;
    const tick = () => {
      if (i >= lines.length) return;
      termCode.innerHTML += (i === 0 ? '' : '\n') + lines[i].t;
      i++;
      setTimeout(tick, lines[i - 1].d);
    };
    setTimeout(tick, 400);
  }

  // =========================================================
  // BUG SQUASHER
  // =========================================================
  (() => {
    const arena = document.getElementById('bug-arena');
    const startBtn = document.getElementById('bug-start');
    const scoreEl = document.getElementById('bug-score');
    const timeEl = document.getElementById('bug-time');
    const bestEl = document.getElementById('bug-best');
    if (!arena || !startBtn) return;

    const emojis = ['🐛','🐞','🪲','🦗','🕷️'];
    let score = 0, timeLeft = 20, spawnT = null, tickT = null, running = false;
    bestEl.textContent = localStorage.getItem('rl-bug-best') || 0;

    const spawn = () => {
      const bug = document.createElement('span');
      bug.className = 'bug';
      bug.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const x = 6 + Math.random() * 88;
      const y = 12 + Math.random() * 78;
      bug.style.left = x + '%';
      bug.style.top = y + '%';
      bug.style.transform += ` rotate(${Math.random()*360}deg)`;
      bug.addEventListener('click', () => {
        if (!running || bug.classList.contains('squashed')) return;
        bug.classList.add('squashed');
        score++;
        scoreEl.textContent = score;
        const pop = document.createElement('span');
        pop.className = 'bug-pop';
        pop.textContent = '+1';
        pop.style.left = x + '%';
        pop.style.top = y + '%';
        arena.appendChild(pop);
        setTimeout(() => pop.remove(), 700);
        setTimeout(() => bug.remove(), 400);
      });
      arena.appendChild(bug);
      setTimeout(() => { if (bug.parentNode) bug.remove(); }, 1800);
    };

    const stop = () => {
      running = false;
      clearInterval(spawnT); clearInterval(tickT);
      startBtn.textContent = 'Play again';
      startBtn.disabled = false;
      const best = parseInt(localStorage.getItem('rl-bug-best') || '0', 10);
      if (score > best) {
        localStorage.setItem('rl-bug-best', score);
        bestEl.textContent = score;
      }
    };

    startBtn.addEventListener('click', () => {
      if (running) return;
      arena.innerHTML = '';
      score = 0; timeLeft = 20;
      scoreEl.textContent = '0'; timeEl.textContent = '20';
      running = true;
      startBtn.textContent = 'Squashing...';
      startBtn.disabled = true;
      spawnT = setInterval(spawn, 600);
      tickT = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) stop();
      }, 1000);
    });
  })();

  // =========================================================
  // LOCATOR PLAYGROUND
  // =========================================================
  (() => {
    const typeSel = document.getElementById('loc-type');
    const input = document.getElementById('loc-input');
    const result = document.getElementById('loc-result');
    const dom = document.getElementById('loc-dom');
    if (!typeSel || !input || !dom) return;

    const clear = () => dom.querySelectorAll('.hit').forEach(n => n.classList.remove('hit'));

    const run = () => {
      clear();
      const q = input.value.trim();
      if (!q) { result.textContent = '0 matches'; result.className = 'loc-result'; return; }
      try {
        let nodes = [];
        if (typeSel.value === 'css') {
          nodes = Array.from(dom.querySelectorAll(q));
        } else {
          const r = document.evaluate(q, dom, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < r.snapshotLength; i++) nodes.push(r.snapshotItem(i));
        }
        nodes.forEach(n => n.classList && n.classList.add('hit'));
        result.textContent = `${nodes.length} match${nodes.length === 1 ? '' : 'es'}`;
        result.className = 'loc-result ' + (nodes.length ? 'ok' : '');
      } catch (e) {
        result.textContent = 'Invalid selector: ' + e.message;
        result.className = 'loc-result err';
      }
    };

    input.addEventListener('input', run);
    typeSel.addEventListener('change', () => {
      input.placeholder = typeSel.value === 'css'
        ? 'e.g.  button.primary  or  li[data-status="open"]'
        : 'e.g.  //li[@data-status="open"]  or  //button[contains(@class,"primary")]';
      run();
    });
    input.value = 'li[data-status="open"]';
    run();
  })();

  // =========================================================
  // FLAKY TEST SIMULATOR
  // =========================================================
  (() => {
    const rate = document.getElementById('flaky-rate');
    const rateV = document.getElementById('flaky-rate-v');
    const runs = document.getElementById('flaky-runs');
    const retry = document.getElementById('flaky-retry');
    const runBtn = document.getElementById('flaky-run');
    const grid = document.getElementById('flaky-grid');
    const summary = document.getElementById('flaky-summary');
    if (!rate || !runBtn) return;

    rate.addEventListener('input', () => rateV.textContent = rate.value + '%');

    runBtn.addEventListener('click', () => {
      const r = Math.max(1, Math.min(500, parseInt(runs.value, 10) || 50));
      const f = parseInt(rate.value, 10) / 100;
      const useRetry = retry.checked;
      grid.innerHTML = '';
      let pass = 0, fail = 0, retries = 0;
      const cells = [];
      for (let i = 0; i < r; i++) {
        const c = document.createElement('span');
        grid.appendChild(c);
        cells.push(c);
      }
      let i = 0;
      const step = () => {
        if (i >= cells.length) {
          summary.innerHTML = `Pass rate: <b>${((pass / r) * 100).toFixed(1)}%</b> &nbsp;·&nbsp; <span style="color:var(--accent)">${pass} pass</span> &nbsp;·&nbsp; <span style="color:var(--danger)">${fail} fail</span>${useRetry ? ` &nbsp;·&nbsp; <span style="color:var(--accent-warm)">${retries} retried</span>` : ''}`;
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
        setTimeout(step, Math.max(6, 400 / r));
      };
      step();
    });
  })();

  // =========================================================
  // REGEX ASSERTER
  // =========================================================
  (() => {
    const pat = document.getElementById('rx-pattern');
    const flg = document.getElementById('rx-flags');
    const text = document.getElementById('rx-text');
    const result = document.getElementById('rx-result');
    if (!pat || !text) return;

    const escapeHtml = (s) => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

    const overlay = document.createElement('div');
    // we'll just keep a mirrored preview below the textarea instead
    const preview = document.createElement('pre');
    preview.style.cssText = 'margin:0;padding:12px;font-family:JetBrains Mono,monospace;font-size:.85rem;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;white-space:pre-wrap;word-break:break-word;color:var(--fg-dim);max-height:160px;overflow:auto';
    text.insertAdjacentElement('afterend', preview);

    const run = () => {
      const p = pat.value;
      const f = flg.value;
      if (!p) { result.textContent = '0 matches'; result.className = 'rx-result'; preview.innerHTML = escapeHtml(text.value); return; }
      try {
        const safeFlags = f.replace(/[^gimsuy]/g, '');
        const re = new RegExp(p, safeFlags.includes('g') ? safeFlags : safeFlags + 'g');
        let count = 0;
        const html = escapeHtml(text.value).replace(re, m => { count++; return `<mark>${m}</mark>`; });
        preview.innerHTML = html;
        result.textContent = `${count} match${count === 1 ? '' : 'es'}`;
        result.className = 'rx-result ' + (count ? 'ok' : '');
      } catch (e) {
        result.textContent = 'Invalid regex: ' + e.message;
        result.className = 'rx-result err';
        preview.innerHTML = escapeHtml(text.value);
      }
    };

    [pat, flg, text].forEach(el => el.addEventListener('input', run));
    run();
  })();

})();
