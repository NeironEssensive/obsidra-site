(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Год в подвале ---------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Шапка ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */
  const burger = document.querySelector('.burger');
  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('no-scroll', open);
  };
  burger.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  document.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Свечение за курсором ---------- */
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  if (finePointer && !reduceMotion) {
    const root = document.documentElement;
    let raf = 0;
    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${pointer.x}px`);
        root.style.setProperty('--my', `${pointer.y}px`);
        raf = 0;
      });
    }, { passive: true });
  }

  /* ---------- Подсветка карточек ---------- */
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - r.left}px`);
      card.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Появление при скролле ---------- */
  const revealEls = [...document.querySelectorAll('[data-reveal]')];
  revealEls.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--rd', `${Math.min(i, 6) * 0.08}s`);
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Смена слова в заголовке ---------- */
  const rotator = document.querySelector('.rotator');
  if (rotator && !reduceMotion) {
    const words = rotator.dataset.words.split(',');
    const glyphs = 'абвгдежзиклмнопрстуфхцчшщэюя#%&*+=<>/01';
    let index = 0;

    const scrambleTo = (target) => {
      const from = rotator.textContent;
      const queue = Array.from({ length: Math.max(from.length, target.length) }, (_, i) => {
        const start = Math.floor(Math.random() * 10);
        return { from: from[i] || '', to: target[i] || '', start, end: start + 8 + Math.floor(Math.random() * 12), ch: '' };
      });
      let frame = 0;
      const tick = () => {
        let out = '';
        let done = 0;
        for (const q of queue) {
          if (frame >= q.end) {
            out += q.to;
            done++;
          } else if (frame >= q.start) {
            if (!q.ch || Math.random() < 0.3) q.ch = glyphs[Math.floor(Math.random() * glyphs.length)];
            out += q.ch;
          } else {
            out += q.from;
          }
        }
        rotator.textContent = out;
        if (done < queue.length) {
          frame++;
          requestAnimationFrame(tick);
        }
      };
      tick();
    };

    setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % words.length;
      scrambleTo(words[index]);
    }, 2600);
  }

  /* ---------- Шаги процесса ---------- */
  const steps = document.querySelector('.steps');
  if (steps) {
    const items = [...steps.querySelectorAll('.step')];
    const bar = steps.querySelector('.steps__progress');
    const nums = items.map((item) => item.querySelector('.step__num'));
    let ticking = false;

    const layout = () => {
      // линия идёт от центра первого номера до центра последнего
      const lastNum = nums[nums.length - 1];
      const first = nums[0].offsetTop + nums[0].offsetHeight / 2;
      const last = lastNum.offsetTop + lastNum.offsetHeight / 2;
      steps.style.setProperty('--line-top', `${first}px`);
      steps.style.setProperty('--line-h', `${last - first}px`);
    };

    const update = () => {
      const anchor = window.innerHeight * 0.6;
      const r = bar.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (anchor - r.top) / (r.height || 1)));
      bar.style.transform = `scaleY(${p})`;
      nums.forEach((num, i) => {
        const nr = num.getBoundingClientRect();
        items[i].classList.toggle('is-active', nr.top + nr.height / 2 <= anchor);
      });
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    layout();
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', () => { layout(); requestUpdate(); });
    if (document.fonts) document.fonts.ready.then(() => { layout(); update(); });
  }

  /* ---------- Обсидиановый кристалл ---------- */
  const canvas = document.querySelector('.hero__crystal');
  if (canvas && canvas.getContext) initCrystal(canvas);

  function initCrystal(canvas) {
    const ctx = canvas.getContext('2d');
    const rand = mulberry32(11);
    const N = 7;

    // вершина, верхний и нижний «пояс» по N точек, нижняя вершина
    const verts = [[0.03, 1.6, 0]];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const r = 0.62 + (rand() - 0.5) * 0.14;
      verts.push([Math.cos(a) * r, 0.46 + (rand() - 0.5) * 0.2, Math.sin(a) * r]);
    }
    for (let i = 0; i < N; i++) {
      const a = ((i + 0.5) / N) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const r = 0.76 + (rand() - 0.5) * 0.14;
      verts.push([Math.cos(a) * r, -0.36 + (rand() - 0.5) * 0.22, Math.sin(a) * r]);
    }
    verts.push([-0.05, -1.48, 0.04]);

    const TOP = 0;
    const BOTTOM = 2 * N + 1;
    const U = (i) => 1 + (i % N);
    const L = (i) => 1 + N + (i % N);
    const faces = [];
    for (let i = 0; i < N; i++) {
      faces.push([TOP, U(i), U(i + 1)]);
      faces.push([U(i), L(i), U(i + 1)]);
      faces.push([U(i + 1), L(i), L(i + 1)]);
      faces.push([BOTTOM, L(i + 1), L(i)]);
    }
    // разворачиваем грани нормалями наружу
    faces.forEach((f) => {
      const n = normal(verts[f[0]], verts[f[1]], verts[f[2]]);
      const c = centroid(verts[f[0]], verts[f[1]], verts[f[2]]);
      if (dot(n, c) < 0) f.reverse();
    });

    const L1 = norm([-0.55, 0.75, -0.5]);   // основной свет: сверху слева
    const L2 = norm([0.65, -0.55, 0.55]);   // контровой «лавовый» свет снизу справа
    const H1 = norm([L1[0], L1[1], L1[2] - 1]);
    const D = 5.2;

    const sparks = Array.from({ length: reduceMotion ? 0 : 34 }, () => spawnSpark(true));
    const tilt = { x: 0, y: 0 };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let running = false;
    let last = performance.now();
    let spin = 0.6;

    function spawnSpark(initial) {
      return {
        x: (rand() - 0.5) * 0.9,
        y: initial ? rand() * 1.4 - 0.2 : 0.62 + rand() * 0.1,
        vy: 0.00006 + rand() * 0.00012,
        vx: (rand() - 0.5) * 0.00004,
        size: 0.6 + rand() * 1.6,
        life: initial ? rand() : 1,
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!running) draw(0);
    }

    function draw(dt) {
      if (!w || !h) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const size = Math.min(w, h);
      const cx = w / 2;
      const cy = h / 2;
      const F = size * 0.27 * D;

      // лавовое свечение под кристаллом
      const glow = ctx.createRadialGradient(cx, cy + size * 0.3, 0, cx, cy + size * 0.3, size * 0.5);
      glow.addColorStop(0, 'rgba(255, 90, 31, 0.26)');
      glow.addColorStop(0.45, 'rgba(255, 90, 31, 0.07)');
      glow.addColorStop(1, 'rgba(255, 90, 31, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const halo = ctx.createRadialGradient(cx - size * 0.1, cy - size * 0.2, 0, cx, cy - size * 0.2, size * 0.42);
      halo.addColorStop(0, 'rgba(155, 140, 255, 0.07)');
      halo.addColorStop(1, 'rgba(155, 140, 255, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      // поворот: медленное вращение + наклон за курсором
      spin += dt * 0.00016;
      // окно, открытое в фоне, может иметь нулевой размер — без защиты наклон навсегда станет NaN
      const targetX = ((pointer.y / (window.innerHeight || 1)) - 0.5) * 0.5;
      const targetY = ((pointer.x / (window.innerWidth || 1)) - 0.5) * 0.9;
      tilt.x += (targetX - tilt.x) * 0.05;
      tilt.y += (targetY - tilt.y) * 0.05;
      if (!Number.isFinite(tilt.x) || !Number.isFinite(tilt.y)) {
        tilt.x = 0;
        tilt.y = 0;
      }
      const ry = spin + tilt.y;
      const rx = -0.18 + tilt.x;
      const rz = 0.14;

      const pts = verts.map((v) => rotate(v, rx, ry, rz));
      const proj = pts.map((p) => {
        const k = F / (p[2] + D);
        return [cx + p[0] * k, cy - p[1] * k];
      });

      const visible = [];
      for (const f of faces) {
        const a = pts[f[0]];
        const b = pts[f[1]];
        const c = pts[f[2]];
        const n = normal(a, b, c);
        const m = centroid(a, b, c);
        // камера в (0, 0, -D)
        if (dot(n, [m[0], m[1], m[2] + D]) >= 0) continue;
        visible.push({ f, n, z: m[2] });
      }
      visible.sort((p, q) => q.z - p.z);

      const t = performance.now();
      for (const { f, n } of visible) {
        const d1 = Math.max(0, dot(n, L1));
        const d2 = Math.max(0, dot(n, L2));
        const s1 = Math.pow(Math.max(0, dot(n, H1)), 34);
        const fres = Math.pow(1 - Math.abs(n[2]), 2.2);
        const ir = 0.5 + 0.5 * Math.sin(Math.atan2(n[1], n[0]) * 3 + t * 0.0004);

        const rim = Math.pow(d2, 1.6);
        const r = 7 + d1 * 22 + rim * 235 + s1 * 230 + fres * (ir * 70 + (1 - ir) * 20);
        const g = 7 + d1 * 21 + rim * 80 + s1 * 215 + fres * (ir * 40 + (1 - ir) * 105);
        const b = 10 + d1 * 30 + rim * 30 + s1 * 225 + fres * (ir * 150 + (1 - ir) * 115);

        const p0 = proj[f[0]];
        const p1 = proj[f[1]];
        const p2 = proj[f[2]];
        const grad = ctx.createLinearGradient(p0[0], p0[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
        grad.addColorStop(0, rgb(r * 1.18, g * 1.18, b * 1.18));
        grad.addColorStop(1, rgb(r * 0.72, g * 0.72, b * 0.72));

        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 196, 160, ${0.05 + s1 * 0.5 + d2 * 0.28})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // искры, поднимающиеся от лавы
      if (sparks.length) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < sparks.length; i++) {
          const s = sparks[i];
          s.y -= s.vy * dt;
          s.x += s.vx * dt;
          s.life -= dt * 0.00011;
          if (s.life <= 0 || s.y < -0.75) {
            sparks[i] = spawnSpark(false);
            continue;
          }
          const a = Math.min(1, s.life * 1.6) * 0.8;
          const px = cx + s.x * size * 0.5;
          const py = cy + s.y * size * 0.5;
          ctx.beginPath();
          ctx.arc(px, py, s.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, ${120 + Math.round(s.life * 80)}, 60, ${a})`;
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    function loop(now) {
      if (!running) return;
      const dt = Math.min(48, now - last);
      last = now;
      draw(dt);
      requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    }

    function stop() { running = false; }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* ---------- Векторная математика ---------- */
  function rotate([x, y, z], rx, ry, rz) {
    // Y
    let c = Math.cos(ry), s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
    // X
    c = Math.cos(rx); s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
    // Z
    c = Math.cos(rz); s = Math.sin(rz);
    [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  }

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function normal(a, b, c) { return norm(cross(sub(b, a), sub(c, a))); }
  function centroid(a, b, c) { return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]; }
  function rgb(r, g, b) {
    const k = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `rgb(${k(r)}, ${k(g)}, ${k(b)})`;
  }

  function mulberry32(seed) {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
})();
