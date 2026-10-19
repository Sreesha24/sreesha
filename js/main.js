/* Sreesha Suresh — homepage interactions */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Typing animation ---------- */
  const typed = document.getElementById('typed');
  const caret = document.querySelector('.caret');
  const phrase = 'product designer. builder. artist.';
  if (reduceMotion) {
    typed.textContent = phrase;
    caret.classList.add('is-done');
  } else {
    let i = 0;
    const tick = () => {
      typed.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) {
        const ch = phrase[i - 1];
        setTimeout(tick, ch === '.' ? 380 : 45 + Math.random() * 55);
      } else {
        caret.classList.add('is-done');
      }
    };
    setTimeout(tick, 500);
  }

  /* ---------- 2. 3D swivel avatar ---------- */
  const avatar = document.getElementById('avatar');
  const card = avatar.querySelector('.avatar__card');
  // coin flip: one full spin around the vertical axis each time the pointer enters (or on tap)
  let spins = 0, spinning = false;
  function flip() {
    if (spinning) return;
    spinning = true; spins += 1;
    card.style.setProperty('--ry', `${spins * 360}deg`);
    setTimeout(() => { spinning = false; }, 2000);
  }
  avatar.addEventListener('pointerenter', flip);
  avatar.addEventListener('click', flip);

  /* ---------- 3. Ruler nav ("clicker") ---------- */
  const ruler = document.querySelector('.ruler');
  const indicator = ruler.querySelector('.ruler__indicator');
  const items = [...ruler.querySelectorAll('.ruler__item')];
  const isHorizontal = () => window.matchMedia('(max-width: 1100px)').matches;
  let current = items[0];

  function placeIndicator(item) {
    const tick = item.querySelector('.ruler__tick');
    const listBox = ruler.querySelector('.ruler__list').getBoundingClientRect();
    const t = tick.getBoundingClientRect();
    if (isHorizontal()) {
      indicator.style.setProperty('--x', `${t.left - ruler.getBoundingClientRect().left + ruler.scrollLeft}px`);
    } else {
      indicator.style.setProperty('--y', `${t.top - listBox.top + t.height / 2 - 0.75}px`);
    }
  }
  function flickBetween(from, to) {
    // every minor tick the indicator passes "clicks"
    const all = [...ruler.querySelectorAll('.ruler__list > li')];
    const a = all.indexOf(from.parentElement), b = all.indexOf(to.parentElement);
    const [lo, hi] = a < b ? [a, b] : [b, a];
    let ticks = [];
    for (let k = lo + 1; k < hi; k++) {
      if (all[k].classList.contains('ruler__minor')) ticks.push(...all[k].children);
    }
    if (a > b) ticks.reverse();
    ticks.forEach((el, n) => {
      setTimeout(() => {
        el.classList.remove('flick'); void el.offsetWidth; el.classList.add('flick');
      }, n * 38);
    });
  }
  function setActive(item, animate = true) {
    if (item === current && animate) return;
    if (animate) flickBetween(current, item);
    items.forEach((i) => { i.classList.toggle('is-active', i === item); i.removeAttribute('aria-current'); });
    item.setAttribute('aria-current', 'page');
    current = item;
    requestAnimationFrame(() => placeIndicator(item));
  }
  items.forEach((item) => {
    item.addEventListener('click', (e) => {
      const key = item.dataset.nav;
      if (key === 'home') {
        e.preventDefault(); setActive(item); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else if (key === 'work') {
        e.preventDefault(); setActive(item);
        document.getElementById('work').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      } else if (item.hasAttribute('data-soon')) {
        e.preventDefault(); setActive(item);
        setTimeout(() => setActive(items[spyIndex()]), 900);
      }
    });
  });
  // keep indicator aligned once fonts load / on resize
  const realign = () => placeIndicator(current);
  window.addEventListener('resize', realign);
  if (document.fonts) document.fonts.ready.then(realign);
  realign();

  // Scroll spy: "work" while the shipped-projects section is on screen, otherwise "home"
  const workSec = document.getElementById('work');
  function spyIndex() {
    const r = workSec.getBoundingClientRect();
    const mid = window.innerHeight * 0.45;
    return (r.top < mid && r.bottom > mid) ? items.findIndex((i) => i.dataset.nav === 'work') : 0;
  }

  /* ---------- 4. Off the clock: vertical scroll → horizontal travel ---------- */
  const otc = document.querySelector('.otc');
  const track = document.getElementById('otcTrack');
  const CANVAS_W = 4865, CANVAS_H = 608;
  let distance = 0, scale = 1;
  const prog = document.getElementById('otcProgress');
  const TICKS = 31;
  for (let k = 0; k < TICKS; k++) prog.appendChild(document.createElement('i'));
  const ticks = [...prog.children];
  let lastTick = -1;

  const clientsEl = otc.querySelector('.clients');
  function layoutOtc() {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    // strip takes ~60% of the screen, but always leaves room for the logos above it
    const navH = vw <= 1100 ? 72 : 48;   // keep clear of the top bar / top edge
    const room = vh - clientsEl.offsetHeight - 72 - navH;
    const h = Math.max(200, Math.min(vh * (vw < 760 ? 0.5 : 0.6), room, CANVAS_H));
    scale = h / CANVAS_H;
    otc.style.setProperty('--s', scale.toFixed(4));
    otc.style.setProperty('--strip-h', `${h}px`);
    distance = Math.max(0, CANVAS_W * scale - vw);
    otc.style.height = `${vh + distance}px`;
    updateOtc();
  }
  function updateOtc() {
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (window.scrollY - otc.offsetTop) / (distance || 1)));
    track.style.transform = `translate3d(${-p * distance}px,0,0)`;
    const at = Math.round(p * (TICKS - 1));
    if (at !== lastTick) {
      ticks.forEach((t, k) => { t.classList.toggle('on', k < at); t.classList.toggle('now', k === at); });
      lastTick = at;
    }
    const r = otc.getBoundingClientRect();
    // when the strip starts leaving the screen, send the side nav down to sit above the footer
    const navBox = ruler.getBoundingClientRect();
    const footerTop = vh - 120;
    ruler.style.setProperty('--navdrop', `${Math.max(0, footerTop - 87 - navBox.height)}px`);
    document.body.classList.toggle('nav-down', r.bottom < vh - 2);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateOtc();
      const idx = spyIndex();
      if (items[idx] !== current && !current.hasAttribute('data-soon')) setActive(items[idx]);
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener('resize', layoutOtc);
  window.addEventListener('load', layoutOtc);
  layoutOtc();

  // only play the stop-motion clip while it's visible
  const vid = document.querySelector('.otc video');
  if (vid && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { en.isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }, { threshold: 0.2 }).observe(vid);
  }

  /* ---------- 5. Focus zoom: the section you're reading is full size, neighbours ease back ---------- */
  const focusEls = [
    document.querySelector('.hero'),
    document.getElementById('work'),
    document.querySelector('.otc__sticky'),
    document.querySelector('.cta'),
  ].filter(Boolean);
  focusEls.forEach((el) => el.classList.add('focusable'));
  function updateFocus() {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    const center = vh / 2;
    const maxShrink = window.innerWidth < 760 ? 0.06 : 0.1;   // how far out-of-focus sections zoom back
    focusEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      // 0 when the section covers the middle of the screen, grows as it moves away
      const d = r.top > center ? r.top - center : r.bottom < center ? center - r.bottom : 0;
      const t = Math.min(1, d / (vh * 0.45));
      const e = t * t * (3 - 2 * t);   // smoothstep
      el.style.setProperty('--fz', (1 - maxShrink * e).toFixed(4));
      el.style.setProperty('--fo', (1 - 0.35 * e).toFixed(3));
      el.style.transformOrigin = r.top > center ? '50% 0%' : r.bottom < center ? '50% 100%' : '50% 50%';
    });
  }
  window.addEventListener('scroll', () => requestAnimationFrame(updateFocus), { passive: true });
  window.addEventListener('resize', updateFocus);
  updateFocus();

  /* ---------- 6. "View project" cursor label ---------- */
  const vl = document.getElementById('viewLabel');
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach((c) => {
      c.addEventListener('pointerenter', () => vl.classList.add('is-on'));
      c.addEventListener('pointerleave', () => vl.classList.remove('is-on'));
      c.addEventListener('pointermove', (e) => {
        vl.style.setProperty('--vx', `${e.clientX}px`);
        vl.style.setProperty('--vy', `${e.clientY}px`);
      });
    });
    window.addEventListener('scroll', () => vl.classList.remove('is-on'), { passive: true });
  }

  /* ---------- 7. "Work with me": vine grows along the heading, then real flowers open ---------- */
  const cta = document.querySelector('.cta__inner');
  const gBackSvg = document.getElementById('gardenBack'), gFrontSvg = document.getElementById('gardenFront');
  const NS = 'http://www.w3.org/2000/svg';
  const GPAD = 200;
  const FLOWERS = {
    orange: ['gerbera-2', 'gerbera-3', 'calendula-1', 'calendula-3', 'calendula-4'],
    pink: ['rose-1', 'rose-2', 'rose-3', 'rose-4'],
    white: ['cosmos-1', 'cosmos-2', 'cosmos-3', 'cosmos-4'],
    small: ['calendula-2', 'calendula-5', 'rose-4', 'cosmos-3'],
  };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function el(tag, attrs, parent) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function smooth(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function timing(n, inD, outD) { n.style.setProperty('--in', `${inD.toFixed(2)}s`); n.style.setProperty('--out', `${outD.toFixed(2)}s`); return n; }
  function stemPath(parent, d, width, color, inD, dur, outD) {
    const p = el('path', { class: 'stem', d, 'stroke-width': width.toFixed(2), stroke: color }, parent);
    const L = p.getTotalLength();
    p.style.setProperty('--len', (L + 2).toFixed(1));
    p.style.setProperty('--dur', `${dur.toFixed(2)}s`);
    p.style.setProperty('--dout', `${Math.max(0.25, dur * 0.35).toFixed(2)}s`);
    timing(p, inD, outD);
    return p;
  }
  function makeDefs(svg) {
    const defs = el('defs', {}, svg);
    [['leafA', '#2f5d2a', '#6f9e4f'], ['leafB', '#3d6b30', '#8db56a'], ['leafC', '#284f26', '#5e8b45']].forEach(([id, a, b]) => {
      const g = el('linearGradient', { id, x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
      el('stop', { offset: '0', 'stop-color': a }, g); el('stop', { offset: '1', 'stop-color': b }, g);
    });
  }
  function leafAt(parent, x, y, angle, size, inD, outD, rnd) {
    const s = size;
    const g = el('g', { class: 'leaf' }, parent);
    const tone = 'ABC'[Math.floor(rnd() * 3)];
    // lower (shaded) half, upper (lit) half, then the midrib
    el('path', { d: `M${x} ${y} C${x + s * 0.35} ${y + s * 0.44} ${x + s * 1.35} ${y + s * 0.5} ${x + s * 2.1} ${y} Z`, fill: '#2a4f25' }, g);
    el('path', { d: `M${x} ${y} C${x + s * 0.35} ${y - s * 0.44} ${x + s * 1.35} ${y - s * 0.5} ${x + s * 2.1} ${y} Z`, fill: `url(#leaf${tone})` }, g);
    el('path', { d: `M${x} ${y} Q${x + s} ${y - s * 0.04} ${x + s * 2.05} ${y}`, stroke: 'rgba(220,236,190,.6)', 'stroke-width': Math.max(0.6, s * 0.045), fill: 'none' }, g);
    for (let k = 1; k <= 3; k++) {   // side veins
      const vx = x + s * 0.45 * k;
      el('path', { d: `M${vx} ${y - s * 0.02} q${s * 0.18} ${-s * 0.14} ${s * 0.32} ${-s * 0.24}`, stroke: 'rgba(220,236,190,.35)', 'stroke-width': Math.max(0.4, s * 0.025), fill: 'none' }, g);
    }
    g.style.setProperty('--rot', `${angle.toFixed(1)}deg`);
    g.style.setProperty('--ox', `${x}px`); g.style.setProperty('--oy', `${y}px`);
    return timing(g, inD, outD);
  }
  function flowerAt(parent, name, x, y, size, inD, outD, rnd) {
    const g = el('g', { class: 'flower' }, parent);
    el('image', { href: `assets/img/flowers/${name}.webp`, x: x - size / 2, y: y - size / 2, width: size, height: size, preserveAspectRatio: 'xMidYMid meet' }, g);
    g.style.setProperty('--ox', `${x}px`); g.style.setProperty('--oy', `${y}px`);
    g.style.setProperty('--r0', `${Math.round(-60 + rnd() * 30)}deg`);
    return timing(g, inD, outD);
  }
  function budAt(parent, x, y, r, inD, outD) {
    const g = el('g', { class: 'bud' }, parent);
    el('circle', { cx: x, cy: y, r, fill: '#fbfaf4', stroke: '#d9d6c4', 'stroke-width': Math.max(0.5, r * 0.15) }, g);
    el('circle', { cx: x, cy: y, r: r * 0.35, fill: '#e9d98a' }, g);
    g.style.setProperty('--ox', `${x}px`); g.style.setProperty('--oy', `${y}px`);
    return timing(g, inD, outD);
  }
  function buildGarden() {
    gBackSvg.innerHTML = ''; gFrontSvg.innerHTML = '';
    makeDefs(gBackSvg); makeDefs(gFrontSvg);
    const title = cta.querySelector('.cta__title a');
    const fs = parseFloat(getComputedStyle(title).fontSize);
    const sc = fs / 184;
    const box = cta.getBoundingClientRect();
    const letters = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.length; i++) {
        if (!node.data[i].trim()) continue;
        const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1);
        const b = r.getBoundingClientRect();
        letters.push({ ch: node.data[i], x: b.left - box.left + GPAD, w: b.width, base: b.top - box.top + GPAD + b.height * 0.77 });
      }
    }
    if (!letters.length) return;
    const rnd = rng(5);
    const back = el('g', {}, gBackSvg), front = el('g', {}, gFrontSvg), top = el('g', {}, gFrontSvg);
    const base = letters[0].base + fs * 0.07;
    const x0 = letters[0].x - fs * 0.25, x1 = letters[letters.length - 1].x + letters[letters.length - 1].w + fs * 0.25;
    const RUN = 2.6;                                   // seconds for the main vine to cross the heading
    const tAt = (x) => ((x - x0) / (x1 - x0)) * RUN;
    const outAt = (x) => ((x1 - x) / (x1 - x0)) * 0.6;
    const VINE = '#5b6b38', STEM = '#5f7d3c';

    // main vine: gentle wave along the baseline, split so it passes behind some letters and in front of others
    const pts = [];
    for (let x = x0, k = 0; x <= x1 + 1; x += fs * 0.22, k++) pts.push([x, base + Math.sin(k * 0.9) * fs * 0.05]);
    const yAt = (x) => { const k = (x - x0) / (fs * 0.22); return base + Math.sin(k * 0.9) * fs * 0.05; };
    let segStart = 0;
    const layerFor = (x) => {
      const L = letters.find((l) => x >= l.x && x <= l.x + l.w);
      return L ? (letters.indexOf(L) % 2 ? front : back) : front;
    };
    for (let i = 1; i <= pts.length; i++) {
      if (i === pts.length || layerFor(pts[i][0]) !== layerFor(pts[segStart][0])) {
        const seg = pts.slice(Math.max(0, segStart - 1), Math.min(pts.length, i + 1));
        if (seg.length > 1) {
          const sx = seg[0][0], ex = seg[seg.length - 1][0];
          stemPath(layerFor(pts[segStart][0]), smooth(seg), 4.2 * sc, VINE, tAt(sx), tAt(ex) - tAt(sx), outAt(ex) + 0.35);
        }
        segStart = i;
      }
    }
    // leaves along the main vine
    for (let x = x0 + fs * 0.08, k = 0; x < x1 - fs * 0.08; x += fs * (0.1 + rnd() * 0.08), k++) {
      const up = k % 2 === 0;
      leafAt(rnd() < 0.55 ? front : back, x, yAt(x), (up ? -35 : 30) + (rnd() - 0.5) * 40 + (rnd() < 0.5 ? 0 : 180), (17 + rnd() * 11) * sc, tAt(x) + 0.15, outAt(x) + 0.2, rnd);
    }

    // sprays rising from the vine, ending in flowers (positions loosely follow the reference)
    const palette = ['orange', 'pink', 'white', 'pink', 'orange', 'white', 'pink', 'orange'];
    const anchors = [];
    letters.forEach((l, i) => {
      if (i % 1 === 0) anchors.push(l.x + l.w * (i % 2 ? 0.85 : 0.2));
    });
    anchors.push(x1 - fs * 0.1);
    anchors.forEach((ax, i) => {
      const tall = i % 3 !== 1 && i < anchors.length - 2;   // keep the right end low, clear of the badge
      const h = fs * (tall ? 0.55 + rnd() * 0.5 : 0.25 + rnd() * 0.2);
      const lean = (rnd() - 0.5) * fs * 0.35;
      const sy = yAt(ax);
      const tip = [ax + lean, sy - h];
      const mid = [ax + lean * 0.3 + (rnd() - 0.5) * fs * 0.1, sy - h * 0.5];
      const layer = i % 2 ? back : front;
      const start = tAt(ax);
      const dur = 0.5 + h / fs * 0.5;
      const p = stemPath(layer, smooth([[ax, sy], mid, tip]), 2.4 * sc, STEM, start, dur, outAt(ax) + 0.25);
      const L = p.getTotalLength();
      // leaves on the spray
      [0.22, 0.42, 0.6, 0.78].forEach((t, j) => {
        const q = p.getPointAtLength(L * t), q2 = p.getPointAtLength(Math.min(L, L * t + 2));
        const tan = Math.atan2(q2.y - q.y, q2.x - q.x) * 180 / Math.PI;
        leafAt(rnd() < 0.5 ? front : back, q.x, q.y, tan + (j % 2 ? 50 : -50) + (rnd() - 0.5) * 20, (13 + rnd() * 8) * sc * (1 - t * 0.35), start + dur * t, outAt(ax) + 0.1, rnd);
      });
      // a side twig with tiny buds
      if (rnd() < 0.6) {
        const q = p.getPointAtLength(L * 0.55);
        const side = rnd() < 0.5 ? -1 : 1;
        const tw = [q.x + side * fs * 0.14, q.y - fs * 0.12];
        stemPath(layer, smooth([[q.x, q.y], [q.x + side * fs * 0.07, q.y - fs * 0.08], tw]), 1.4 * sc, STEM, start + dur * 0.55, 0.4, outAt(ax));
        for (let b = 0; b < 6; b++) {
          const bx = tw[0] + (rnd() - 0.5) * 16 * sc, by = tw[1] + (rnd() - 0.6) * 14 * sc;
          budAt(top, bx, by, (2.4 + rnd() * 1.8) * sc, start + dur * 0.55 + 0.3 + b * 0.05, outAt(ax) * 0.5);
        }
      }
      // the flower opens once the stem arrives
      const kind = tall ? palette[i % palette.length] : 'small';
      const list = FLOWERS[kind];
      const size = fs * (tall ? 0.3 + rnd() * 0.08 : 0.17 + rnd() * 0.05);
      flowerAt(top, list[i % list.length], tip[0], tip[1], size, start + dur * 0.9, outAt(ax) * 0.4, rnd);
      if (tall && rnd() < 0.5) {
        const q = p.getPointAtLength(L * 0.5);
        const side = lean > 0 ? -1 : 1;
        const fork = [q.x + side * fs * 0.2, q.y - fs * 0.16];
        stemPath(layer, smooth([[q.x, q.y], [q.x + side * fs * 0.1, q.y - fs * 0.12], fork]), 1.8 * sc, STEM, start + dur * 0.5, 0.45, outAt(ax));
        const k2 = palette[(i + 3) % palette.length];
        flowerAt(top, FLOWERS[k2][(i + 2) % FLOWERS[k2].length], fork[0], fork[1], size * 0.7, start + dur * 0.5 + 0.4, outAt(ax) * 0.4, rnd);
      }
    });
    // a few flowers tucked along the vine at the foot of the letters
    letters.forEach((l, i) => {
      if (i % 3 !== 2) return;
      const fx = l.x + l.w * 0.5;
      const kind = ['pink', 'white', 'orange'][i % 3];
      flowerAt(top, FLOWERS[kind][(i + 1) % FLOWERS[kind].length], fx, yAt(fx) - fs * 0.02, fs * 0.2, tAt(fx) + 0.4, outAt(fx) * 0.4, rnd);
    });
  }
  const grow = () => cta.classList.add('is-grown');
  const retract = () => cta.classList.remove('is-grown');
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    buildGarden();
    if (window.matchMedia('(hover: hover)').matches) {
      cta.querySelector('.cta__title').addEventListener('pointerenter', grow);
      cta.addEventListener('pointerleave', retract);
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => (en.isIntersecting ? grow() : retract()), { threshold: 0.6 }).observe(cta);
    }
  });
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(buildGarden, 200); });

  // badge sits just off the top-right of the final "e"
  function placeBadge() {
    const title = cta.querySelector('.cta__title a');
    const badge = cta.querySelector('.cta__badge');
    badge.removeAttribute('style');
    if (window.innerWidth <= 860) return;
    const fs = parseFloat(getComputedStyle(title).fontSize);
    const box = cta.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    const mctx = document.createElement('canvas').getContext('2d');
    mctx.font = `${fs}px ${getComputedStyle(title).fontFamily}`;
    const mx = mctx.measureText('x');
    const baseY = t.top - box.top + t.height * 0.77;
    const maxLeft = document.documentElement.clientWidth - 24 - box.left - badge.offsetWidth;
    Object.assign(badge.style, { left: `${Math.min(t.right - box.left + fs * 0.06, maxLeft)}px`, top: `${baseY - mx.actualBoundingBoxAscent - badge.offsetHeight - fs * 0.04}px` });
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(placeBadge);
  window.addEventListener('resize', placeBadge);

  /* ---------- 8. "Coming soon" for pages not built yet ---------- */
  const toast = document.getElementById('toast');
  let tt;
  document.querySelectorAll('[data-soon]').forEach((el) => {
    if (el.classList.contains('ruler__item')) return; // handled above
    el.addEventListener('click', (e) => { e.preventDefault(); showToast('Coming soon ✦'); });
  });
  ruler.querySelectorAll('.ruler__item[data-soon]').forEach((el) => el.addEventListener('click', () => showToast(`${el.dataset.nav} page — coming soon ✦`)));
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 1600);
  }
})();
