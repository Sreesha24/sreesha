/* Inner pages (about, …): the same ruler-nav behaviour as the homepage, plus the About photo pile */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Ruler nav ("clicker") — mirrors js/main.js ---------- */
  const ruler = document.querySelector('.ruler');
  const indicator = ruler.querySelector('.ruler__indicator');
  const items = [...ruler.querySelectorAll('.ruler__item')];
  const isHorizontal = () => window.matchMedia('(max-width: 1100px)').matches;
  const home = items.find((i) => i.classList.contains('is-active')) || items[0];   // this page's own item
  let current = home;

  function placeIndicator(item) {
    const listBox = ruler.querySelector('.ruler__list').getBoundingClientRect();
    const t = item.querySelector('.ruler__tick').getBoundingClientRect();
    if (isHorizontal()) indicator.style.setProperty('--x', `${t.left - ruler.getBoundingClientRect().left + ruler.scrollLeft}px`);
    else indicator.style.setProperty('--y', `${t.top - listBox.top + t.height / 2 - 0.75}px`);
  }
  function flickBetween(from, to) {
    // every minor tick the indicator passes "clicks"
    const all = [...ruler.querySelectorAll('.ruler__list > li')];
    const a = all.indexOf(from.parentElement), b = all.indexOf(to.parentElement);
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const ticks = [];
    for (let k = lo + 1; k < hi; k++) if (all[k].classList.contains('ruler__minor')) ticks.push(...all[k].children);
    if (a > b) ticks.reverse();
    ticks.forEach((el, n) => setTimeout(() => { el.classList.remove('flick'); void el.offsetWidth; el.classList.add('flick'); }, n * 38));
  }
  function setActive(item, animate = true) {
    if (item === current && animate) return;
    if (animate) flickBetween(current, item);
    items.forEach((i) => { i.classList.toggle('is-active', i === item); i.removeAttribute('aria-current'); });
    item.setAttribute('aria-current', 'page');
    current = item;
    requestAnimationFrame(() => placeIndicator(item));
  }

  let spyLock = 0;
  items.forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // let new-tab clicks through
      const key = item.dataset.nav;
      if (item === home) {
        e.preventDefault(); setActive(item); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else if (key === 'contact') {
        e.preventDefault(); setActive(item); spyLock = Date.now() + 2500;
        document.getElementById('contact-footer').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
      } else if (item.hasAttribute('data-soon')) {
        e.preventDefault(); setActive(item); showToast(`${key} page — coming soon ✦`);
        setTimeout(() => setActive(items[spyIndex()]), 900);
      } else {
        // another page: let the marker glide there first, then go
        e.preventDefault(); setActive(item);
        setTimeout(() => { window.location.href = item.href; }, reduceMotion ? 0 : 420);
      }
    });
  });
  const realign = () => placeIndicator(current);
  window.addEventListener('resize', realign);
  if (document.fonts) document.fonts.ready.then(realign);
  realign();
  // coming back with the back button: reset the marker to this page
  window.addEventListener('pageshow', (e) => { if (e.persisted) setActive(items[spyIndex()], false); });

  // scroll spy: this page's item, or "contact" once you reach the bottom
  function spyIndex() {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) return items.findIndex((i) => i.dataset.nav === 'contact');
    return items.indexOf(home);
  }
  // when the last section leaves the screen, the side nav glides down to rest above the footer (as on the homepage)
  const lastSection = document.querySelector('.ab-life') || document.querySelector('main > section:last-of-type');
  function updateNavDrop() {
    if (!lastSection) return;
    const vh = window.innerHeight;
    // rest just above where the footer will sit once you reach the bottom (measured, so it never overlaps)
    const foot = document.getElementById('contact-footer');
    const maxY = document.documentElement.scrollHeight - vh;
    const footTop = foot ? foot.getBoundingClientRect().top + (maxY - window.scrollY) : vh - 120;
    const room = footTop - 40 - (ruler.offsetTop + ruler.offsetHeight);
    ruler.style.setProperty('--navdrop', `${Math.max(0, room)}px`);
    // too short a window to fit it above the footer: tuck the nav away as the footer arrives
    const footNow = foot ? foot.getBoundingClientRect().top : vh;
    document.body.classList.toggle('nav-tuck', room < 0 && footNow < ruler.offsetTop + ruler.offsetHeight + 24);
    document.body.classList.toggle('nav-down', lastSection.getBoundingClientRect().bottom < vh - 2);
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateNavDrop();
      const idx = spyIndex();
      if (items[idx] !== current && !current.hasAttribute('data-soon') && Date.now() > spyLock) setActive(items[idx]);
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener('resize', updateNavDrop);
  updateNavDrop();

  /* ---------- Toast ---------- */
  const toast = document.getElementById('toast');
  let tt;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 1600);
  }
  document.querySelectorAll('[data-soon]:not(.ruler__item)').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); showToast('Coming soon ✦'); }));

  /* ---------- About: the photo pile ---------- */
  const pile = document.getElementById('pile');
  if (pile) {
    const pieces = [...pile.querySelectorAll('.pc')];
    // each piece gets its own little tilt for hover, and a stagger for the drop-in
    const tilts = [-2.5, 2, -1.5, 3, -2, 2.5, -3, 2, 1.5, -2, 2.5];
    const order = [...pieces].sort((a, b) => parseFloat(a.style.getPropertyValue('--x')) - parseFloat(b.style.getPropertyValue('--x')));
    pieces.forEach((p, i) => {
      p.style.setProperty('--tilt', `${tilts[i % tilts.length]}deg`);
      p.style.setProperty('--drop', `${-tilts[i % tilts.length] * 2}deg`);
      p.style.setProperty('--d', `${(order.indexOf(p) * 0.06).toFixed(2)}s`);
    });
    const videos = pieces.filter((p) => p.tagName === 'VIDEO');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      pile.classList.add('is-in', 'is-settled');
    } else {
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        io.disconnect(); pile.classList.add('is-in');
        setTimeout(() => pile.classList.add('is-settled'), 1400);
      }, { threshold: 0.25 });
      io.observe(pile);
    }
    // clips only play while the pile is on screen (and never with reduced motion)
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        videos.forEach((v) => { if (en.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); });
      }, { threshold: 0.1 }).observe(pile);
    }

    // drag pieces around (mouse / trackpad); the one you touch comes to the top
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let z = 20;
      pieces.forEach((pc) => {
        let sx, sy, ox = 0, oy = 0, lim;
        pc.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return;
          e.preventDefault(); pc.setPointerCapture(e.pointerId);
          sx = e.clientX; sy = e.clientY;
          ox = parseFloat(pc.style.getPropertyValue('--dx')) || 0; oy = parseFloat(pc.style.getPropertyValue('--dy')) || 0;
          // keep at least ~40% of the piece inside the pile
          const b = pile.getBoundingClientRect(), r = pc.getBoundingClientRect();
          lim = { l: b.left - r.left - r.width * 0.6, r: b.right - r.right + r.width * 0.6, t: b.top - r.top - r.height * 0.6, b: b.bottom - r.bottom + r.height * 0.6 };
          pc.classList.add('is-drag'); pc.style.zIndex = ++z;
        });
        pc.addEventListener('pointermove', (e) => {
          if (!pc.classList.contains('is-drag')) return;
          const mx = Math.max(lim.l, Math.min(lim.r, e.clientX - sx)), my = Math.max(lim.t, Math.min(lim.b, e.clientY - sy));
          pc.style.setProperty('--dx', `${ox + mx}px`); pc.style.setProperty('--dy', `${oy + my}px`);
        });
        const end = () => pc.classList.remove('is-drag');
        pc.addEventListener('pointerup', end); pc.addEventListener('pointercancel', end);
      });
      // positions are in px, so a resize puts everything back where it belongs
      window.addEventListener('resize', () => pieces.forEach((pc) => { pc.style.removeProperty('--dx'); pc.style.removeProperty('--dy'); }));
    }
  }
})();
