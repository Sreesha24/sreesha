/* Sparkle dust: tiny four-point stars (the site's sparkle) pop open just behind the cursor, twinkle and vanish.
   A slightly bigger burst over links and cards. Desktop pointers only; off for reduced motion. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cv = document.createElement('canvas');
  cv.className = 'sparkles';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', size);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const stars = [];
  const MAX = 10;
  let last = { x: 0, y: 0, t: 0 }, raf = 0;

  function spawn(x, y, big) {
    if (stars.length >= MAX) stars.shift();
    stars.push({
      x: x + rnd(-6, 6), y: y + rnd(-6, 6),
      r: big ? rnd(5, 8) : rnd(2.5, 4.5),      // full size
      life: 0, dur: big ? rnd(520, 700) : rnd(380, 520),
      rot: rnd(0, Math.PI), spin: rnd(-0.6, 0.6),
      vx: rnd(-0.08, 0.08), vy: rnd(-0.14, -0.04),
      born: performance.now(),
      dark: Math.random() < 0.25,              // a few ink ones for depth, like the sparkle next to "Shipped projects"
    });
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function star(x, y, r, rot, a, dark) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
    ctx.beginPath();
    const w = r * 0.22;   // waist: makes the four points slim and twinkly
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(0, -r);
      ctx.lineTo(w, -w);
      ctx.rotate(Math.PI / 2);
    }
    ctx.closePath();
    ctx.fillStyle = dark ? '#1b6a2c' : '#8fe88a';
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const t = (now - s.born) / s.dur;
      if (t >= 1) { stars.splice(i, 1); continue; }
      // pop open fast, twinkle, then shrink away
      const pop = t < 0.25 ? 1 - Math.pow(1 - t / 0.25, 3) : 1 - Math.pow((t - 0.25) / 0.75, 2);
      const twinkle = 1 + Math.sin(t * Math.PI * 5) * 0.12;
      s.x += s.vx; s.y += s.vy;
      star(s.x, s.y, s.r * pop * twinkle, s.rot + t * s.spin, Math.min(1, pop * 1.2) * 0.95, s.dark);
    }
    raf = stars.length ? requestAnimationFrame(frame) : 0;
  }

  const hot = (el) => !!el && !!el.closest('a, button, .card, .cta__title, .otc__item');
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now();
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    const dist = Math.hypot(dx, dy);
    const big = hot(e.target);
    // leave a star every so often along the path: more when moving fast, more over links
    const gap = big ? 22 : 34;
    if (dist > gap || now - last.t > 90 && dist > 4) {
      // drop it a touch behind the cursor
      spawn(e.clientX - dx * 0.35, e.clientY - dy * 0.35, big);
      if (big && Math.random() < 0.5) spawn(e.clientX - dx * 0.6, e.clientY - dy * 0.6, true);
      last = { x: e.clientX, y: e.clientY, t: now };
    }
  }, { passive: true });
  // entering something clickable: a small burst
  addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || !hot(e.target)) return;
    const el = e.target.closest('a, button, .card, .cta__title, .otc__item');
    if (el === lastHot) return; lastHot = el;
    for (let k = 0; k < 3; k++) spawn(e.clientX + rnd(-10, 10), e.clientY + rnd(-10, 10), true);
  }, { passive: true });
  let lastHot = null;
  addEventListener('pointerout', (e) => { if (!e.relatedTarget || !hot(e.relatedTarget)) lastHot = null; }, { passive: true });
})();
