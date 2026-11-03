/* Dandelion seeds: a few fluffs drift lazily after the cursor and float up and away when it rests.
   Desktop pointers only; off for reduced motion. Drawn on one canvas that never takes clicks. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cv = document.createElement('canvas');
  cv.className = 'seeds';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', size);

  const N = 6;
  const mouse = { x: -999, y: -999, seen: false, last: 0 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const seeds = Array.from({ length: N }, (_, i) => ({
    ox: Math.cos((i / N) * Math.PI * 2) * rnd(16, 38), oy: Math.sin((i / N) * Math.PI * 2) * rnd(12, 30) + 10,
    x: -999, y: -999, vx: 0, vy: 0, a: 0, tilt: 0,
    s: rnd(0.75, 1.25), ease: rnd(0.025, 0.06), ph: rnd(0, 6.28), spin: rnd(-0.004, 0.004),
    rays: Math.round(rnd(12, 17)), floating: false, fade: rnd(0.0025, 0.005),
  }));

  // one seed: a fine stem with a tiny achene, topped by a puff of radiating hairs
  function drawSeed(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt);
    ctx.scale(p.s, p.s);
    ctx.globalAlpha = p.a;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(120,120,108,0.55)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 11); ctx.stroke();
    ctx.fillStyle = 'rgba(140,128,104,0.7)';
    ctx.beginPath(); ctx.ellipse(0, 12.5, 0.9, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(0, -3, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,108,0.42)';
    ctx.lineWidth = 0.45;
    for (let k = 0; k < p.rays; k++) {
      const ang = -Math.PI / 2 + (k / (p.rays - 1) - 0.5) * Math.PI * 1.55;
      const r = 7 + Math.sin(k * 2.3 + p.ph) * 0.9;
      const ex = Math.cos(ang) * r, ey = Math.sin(ang) * r - 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(ex * 0.45, ey * 0.6 - 0.6, ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, 0.55, 0, Math.PI * 2); ctx.fillStyle = 'rgba(150,150,138,0.5)'; ctx.fill();
    }
    ctx.restore();
  }

  let raf = 0, t = 0;
  function frame() {
    t += 1;
    const idle = performance.now() - mouse.last > 700;
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of seeds) {
      if (!idle && mouse.seen) {
        // follow lazily, each seed with its own lag and a gentle sway
        if (p.floating || p.a <= 0.01) { if (p.a <= 0.01) { p.x = mouse.x + p.ox; p.y = mouse.y + p.oy + 20; } p.floating = false; }
        const tx = mouse.x + p.ox + Math.sin(t * 0.02 + p.ph) * 6;
        const ty = mouse.y + p.oy + Math.cos(t * 0.017 + p.ph) * 4;
        p.vx = (tx - p.x) * p.ease; p.vy = (ty - p.y) * p.ease;
        p.a = Math.min(0.9, p.a + 0.03);
      } else if (mouse.seen) {
        // cursor rests: let go and drift up on the air, fading out
        p.floating = true;
        p.vx = p.vx * 0.96 + Math.sin(t * 0.015 + p.ph) * 0.05;
        p.vy = p.vy * 0.96 - 0.018;
        p.a = Math.max(0, p.a - p.fade);
      }
      p.x += p.vx; p.y += p.vy;
      p.tilt = p.tilt * 0.9 + (p.vx * 0.06 + Math.sin(t * 0.01 + p.ph) * 0.04) * 0.1 + p.spin;
      if (p.a > 0.01) { alive = true; drawSeed(p); }
    }
    raf = (alive || !idle) && !document.hidden ? requestAnimationFrame(frame) : 0;
  }
  const wake = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true; mouse.last = performance.now();
    wake();
  }, { passive: true });
  document.addEventListener('mouseleave', () => { mouse.last = 0; });
  document.addEventListener('visibilitychange', wake);
})();
