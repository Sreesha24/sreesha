/* Sreesha Suresh — homepage interactions */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Typing animation ---------- */
  const typed = document.getElementById('typed');
  const caret = document.querySelector('.caret');
  const phrase = 'system-oriented product designer';
  // once typed, split into words so each one can be hovered
  const WORD_GIFS = { 'system-oriented product designer': 'assets/img/hover-product-designer.gif' };
  function splitWords() {
    typed.innerHTML = ['system-oriented product designer']
      .map((w) => `<span class="tw${WORD_GIFS[w] ? ' tw--gif' : ''}" data-w="${w}">${w}</span>`).join(' ');
    const tagline = typed.closest('.hero__tagline');
    const pop = document.createElement('span');
    pop.className = 'tw-pop'; pop.setAttribute('aria-hidden', 'true');
    tagline.appendChild(pop);
    typed.querySelectorAll('.tw--gif').forEach((el) => {
      const src = WORD_GIFS[el.dataset.w];
      new Image().src = src;                                   // preload
      const show = () => {
        pop.style.backgroundImage = `url(${src})`;
        pop.style.left = `${el.offsetLeft + el.offsetWidth + 18}px`;
        tagline.classList.add('is-focus'); el.classList.add('is-on'); pop.classList.add('is-on');
      };
      const hide = () => { tagline.classList.remove('is-focus'); el.classList.remove('is-on'); pop.classList.remove('is-on'); };
      el.addEventListener('pointerenter', show);
      el.addEventListener('pointerleave', hide);
      el.addEventListener('click', () => (pop.classList.contains('is-on') ? hide() : show()));   // tap on phones
    });
  }
  if (reduceMotion) {
    typed.textContent = phrase;
    caret.classList.add('is-done');
    splitWords();
  } else {
    let i = 0;
    const tick = () => {
      typed.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) {
        const ch = phrase[i - 1];
        setTimeout(tick, ch === '.' ? 380 : 45 + Math.random() * 55);
      } else {
        caret.classList.add('is-done');
        splitWords();
      }
    };
    setTimeout(tick, 750);   // starts right after the photo and "hi" appear
  }

  /* ---------- 2. 3D swivel avatar ---------- */
  const avatar = document.getElementById('avatar');
  const card = avatar.querySelector('.avatar__card');
  if (card) {
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

  }

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
      } else if (key === 'contact') {
        e.preventDefault(); setActive(item); spyLock = Date.now() + 2500;   // don't let scroll-spy flip it back mid-glide
        document.getElementById('contact-footer').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
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
  let spyLock = 0;
  const workSec = document.getElementById('work');
  function spyIndex() {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) return items.findIndex((i) => i.dataset.nav === 'contact');
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
    const h = Math.max(200, Math.min(vh * (vw < 760 ? 0.55 : 0.6), vw < 760 ? (vw / 470) * CANVAS_H : 1e9, room, CANVAS_H));
    scale = h / CANVAS_H;
    otc.style.setProperty('--s', scale.toFixed(4));
    otc.style.setProperty('--strip-h', `${h}px`);
    // lead-in on the left so "4x Global Design Awards" (≈ x 290 in the design) starts centred on screen
    const pad = Math.max(0, Math.min(1150, (vw * 0.22) / scale - 276));   // awards sit left of centre
    otc.style.setProperty('--pad', `${pad.toFixed(1)}px`);
    distance = Math.max(0, (CANVAS_W + pad) * scale - vw);
    otc.style.height = `${vh + distance}px`;
    updateOtc();
  }
  function updateOtc() {
    const vh = window.innerHeight;
    const raw = Math.min(1, Math.max(0, (window.scrollY - otc.offsetTop) / (distance || 1)));
    // gentle start: the first stretch of scrolling moves the strip slowly so the awards get a proper look
    const p = raw < 0.12 ? (raw / 0.12) ** 2 * 0.04 : 0.04 + (raw - 0.12) / 0.88 * 0.96;
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

  // sparkle next to "Shipped Projects" turns as you scroll
  const spinners = document.querySelectorAll('.spin-on-scroll');
  function spin() { if (!reduceMotion) spinners.forEach((el) => el.style.setProperty('--spin', `${(window.scrollY * 0.35) % 360}deg`)); }
  window.addEventListener('scroll', () => requestAnimationFrame(spin), { passive: true });
  spin();

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateOtc();
      const idx = spyIndex();
      if (items[idx] !== current && !current.hasAttribute('data-soon') && Date.now() > spyLock) setActive(items[idx]);
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
