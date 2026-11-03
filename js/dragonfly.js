/* A dragonfly flies in from the top right once the tagline has typed, and perches on the last "s" of "systems".
   Hovering the tagline makes it lift off, loop once and land again. Wings beat during flight (three cutouts: body + each wing pair). */
(() => {
  const typed = document.getElementById('typed');
  const tagline = typed && typed.closest('.hero__tagline');
  if (!tagline) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fly = document.createElement('div');
  fly.className = 'dfly'; fly.setAttribute('aria-hidden', 'true');
  fly.innerHTML = '<img class="dfly__wing dfly__wing--l" src="assets/img/dragonfly/left.webp" alt="">'
                + '<img class="dfly__wing dfly__wing--r" src="assets/img/dragonfly/right.webp" alt="">'
                + '<img class="dfly__body" src="assets/img/dragonfly/body.webp" alt="">';
  document.body.appendChild(fly);
  const wings = fly.querySelectorAll('.dfly__wing');

  // where the last letter of the tagline sits on the page
  function perch() {
    const node = (function last(n) { for (let i = n.childNodes.length - 1; i >= 0; i--) { const c = n.childNodes[i]; if (c.nodeType === 3 && c.textContent.trim()) return c; if (c.nodeType === 1) { const r = last(c); if (r) return r; } } return null; })(typed);
    if (!node) return null;
    const rg = document.createRange(); rg.setStart(node, node.length - 1); rg.setEnd(node, node.length);
    const b = rg.getBoundingClientRect();
    return { x: b.left + b.width * 0.55 + scrollX, y: b.top + b.height * 0.42 + scrollY };
  }

  const W = () => (innerWidth < 760 ? 76 : 104);   // wingspan on screen
  let landed = false, busy = false;

  function place(x, y, rot, scale) {
    fly.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
  }
  function beat(on) { wings.forEach((w) => w.classList.toggle('is-beating', on)); }

  // flight path: a few waypoints with the body turned toward the direction of travel
  function flight(points, dur, done) {
    busy = true; beat(true);
    const frames = points.map((p, i) => {
      const n = points[Math.min(i + 1, points.length - 1)], pr = points[Math.max(i - 1, 0)];
      const ang = Math.atan2(n.y - pr.y, n.x - pr.x) * 180 / Math.PI - 90;
      return { transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${p.rot ?? ang}deg) scale(${p.s ?? 1})`, offset: p.t, easing: p.e || 'ease-in-out' };
    });
    const a = fly.animate(frames, { duration: dur, fill: 'forwards' });
    a.onfinish = () => { const l = points[points.length - 1]; place(l.x, l.y, l.rot ?? 0, l.s ?? 1); a.cancel(); beat(false); busy = false; done && done(); };
  }

  function land() {
    const p = perch(); if (!p) return;
    const w = W();
    fly.style.width = `${w}px`;
    const start = { x: scrollX + innerWidth + w, y: scrollY - w * 0.5, t: 0, s: 1.15 };
    const mid1 = { x: p.x + Math.min(360, innerWidth * 0.3), y: p.y - 150, t: 0.42, s: 1.05 };
    const hover = { x: p.x + 70, y: p.y - 60, t: 0.68, s: 1, e: 'ease-out' };
    const hover2 = { x: p.x + 58, y: p.y - 52, t: 0.8, s: 1 };
    const end = { x: p.x + w * 0.08, y: p.y - w * 0.2, t: 1, rot: -28, s: 1, e: 'cubic-bezier(.2,.8,.3,1)' };
    fly.classList.add('is-on');
    flight([start, mid1, hover, hover2, end], 2600, () => { landed = true; fly.classList.add('is-perched'); });
  }

  // hover on the tagline: lift, loop round and settle back
  function loop() {
    if (!landed || busy) return;
    const p = perch(); if (!p) return;
    const w = W();
    fly.classList.remove('is-perched');
    landed = false;
    const pts = [
      { x: p.x, y: p.y - w * 0.2, t: 0, rot: -28 },
      { x: p.x + 40, y: p.y - 90, t: 0.22 },
      { x: p.x + 150, y: p.y - 130, t: 0.45 },
      { x: p.x + 190, y: p.y - 30, t: 0.62 },
      { x: p.x + 90, y: p.y - 20, t: 0.8 },
      { x: p.x + w * 0.08, y: p.y - w * 0.2, t: 1, rot: -28, e: 'cubic-bezier(.2,.8,.3,1)' },
    ];
    flight(pts, 2200, () => { landed = true; fly.classList.add('is-perched'); });
  }

  function start() {
    if (reduceMotion) {
      const p = perch(); if (!p) return;
      fly.style.width = `${W()}px`; fly.classList.add('is-on', 'is-perched');
      place(p.x, p.y - W() * 0.2, -28, 1); landed = true;
      return;
    }
    setTimeout(land, 350);
  }
  if (typed.querySelector('.tw')) start(); else document.addEventListener('tagline:typed', start, { once: true });

  tagline.addEventListener('pointerenter', loop);
  // keep it on the letter if the layout shifts (resize, fonts)
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (landed && !busy) { const p = perch(); if (p) { fly.style.width = `${W()}px`; place(p.x, p.y - W() * 0.2, -28, 1); } } }, 120); });
})();
