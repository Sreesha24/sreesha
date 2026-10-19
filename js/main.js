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

  /* ---------- 7. Botanical blooms grow through a few letters of "Work with me" ---------- */
  const cta = document.querySelector('.cta__inner');
  const bloomBox = document.getElementById('blooms');
  // which letter, which illustration, how tall (× font size), and the flower that sits in front of the letter
  const BLOOMS = [
    { letter: 0, src: 'assets/img/bloom-nasturtium.webp', ratio: 719 / 909, h: 1.22, dx: 0.02, front: [[60, 38, 17]] },
    { letter: 3, src: 'assets/img/bloom-calendula.webp', ratio: 621 / 889, h: 1.15, dx: 0.08, front: [[36, 38, 13], [74, 40, 11]] },
    { letter: -1, src: 'assets/img/bloom-peony.webp', ratio: 662 / 857, h: 1.0, dx: -0.02, front: [[40, 47, 21]] },
  ];
  function layoutBlooms() {
    bloomBox.innerHTML = '';
    const title = cta.querySelector('.cta__title a');
    const fs = parseFloat(getComputedStyle(title).fontSize);
    const box = cta.getBoundingClientRect();
    const chars = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.length; i++) {
        if (!node.data[i].trim()) continue;
        const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1);
        chars.push(r.getBoundingClientRect());
      }
    }
    const baseline = (rect) => rect.top - box.top + rect.height * 0.77;

    // badge + arrow: arrow tip points at the top-right of the final "e", badge sits on the arrow's tail
    const badge = cta.querySelector('.cta__badge'), arrow = cta.querySelector('.cta__arrow');
    [badge, arrow].forEach((n) => n.removeAttribute('style'));
    if (window.innerWidth > 860 && chars.length) {
      const last = chars[chars.length - 1];
      const mctx = document.createElement('canvas').getContext('2d');
      mctx.font = `${fs}px ${getComputedStyle(title).fontFamily}`;
      const mx = mctx.measureText('x'), me = mctx.measureText('e');
      // right edge of the whole heading (its advance box), which always sits just past the final "e"
      const eRight = Math.max(title.getBoundingClientRect().right, last.left + me.actualBoundingBoxRight) - box.left;
      const xTop = baseline(last) - mx.actualBoundingBoxAscent;
      const size = Math.max(36, 51 * fs / 184), k = size / 52;
      const tipX = eRight + fs * 0.06, tipY = xTop + fs * 0.16;   // a clear gap so the tip never touches the letter
      const aLeft = tipX - 4 * k, aTop = tipY - 46 * k;
      Object.assign(arrow.style, { left: `${aLeft}px`, top: `${aTop}px`, width: `${size}px`, height: `${size}px`, transform: 'none' });
      const maxLeft = document.documentElement.clientWidth - 24 - box.left - badge.offsetWidth;   // never run off the screen
      Object.assign(badge.style, { left: `${Math.min(aLeft + 38 * k, maxLeft)}px`, top: `${aTop + 6 * k - badge.offsetHeight}px` });
    }
    BLOOMS.forEach((b, n) => {
      const c = chars[b.letter < 0 ? chars.length + b.letter : b.letter];
      if (!c) return;
      const h = fs * b.h, w = h * b.ratio;
      const left = c.left - box.left + c.width / 2 - w / 2 + fs * b.dx;
      const top = baseline(c) + fs * 0.12 - h;   // stems poke out a little below the letter
      const mask = b.front.map(([x, y, r]) => `radial-gradient(circle at ${x}% ${y}%, #000 ${r * 0.72}%, transparent ${r}%)`).join(',');
      ['back', 'front'].forEach((layer) => {
        const img = document.createElement('img');
        img.src = b.src; img.alt = '';
        img.className = `bloom bloom--${layer}`;
        Object.assign(img.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` });
        img.style.setProperty('--d', `${n * 0.35}s`);
        img.style.setProperty('--dout', `${(BLOOMS.length - n - 1) * 0.15}s`);
        if (layer === 'front') { img.style.webkitMaskImage = mask; img.style.maskImage = mask; }
        bloomBox.appendChild(img);
      });
    });
  }
  const grow = () => cta.classList.add('is-grown');
  const retract = () => cta.classList.remove('is-grown');
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    layoutBlooms();
    if (window.matchMedia('(hover: hover)').matches) {
      cta.querySelector('.cta__title').addEventListener('pointerenter', grow);
      cta.addEventListener('pointerleave', retract);
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => (en.isIntersecting ? grow() : retract()), { threshold: 0.6 }).observe(cta);
    }
  });
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layoutBlooms, 200); });

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
