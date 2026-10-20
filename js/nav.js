/* Shared behaviour for inner pages (about, …): ruler nav marker, fact/photo pairing, coming-soon toast */
(function () {
  const ruler = document.querySelector('.ruler');
  const indicator = ruler.querySelector('.ruler__indicator');
  const isHorizontal = () => window.matchMedia('(max-width: 1100px)').matches;
  function placeIndicator() {
    const item = ruler.querySelector('.ruler__item.is-active');
    if (!item) return;
    const t = item.querySelector('.ruler__tick').getBoundingClientRect();
    if (isHorizontal()) indicator.style.setProperty('--x', `${t.left - ruler.getBoundingClientRect().left + ruler.scrollLeft}px`);
    else indicator.style.setProperty('--y', `${t.top - ruler.querySelector('.ruler__list').getBoundingClientRect().top + t.height / 2 - 0.75}px`);
  }
  window.addEventListener('resize', placeIndicator);
  if (document.fonts) document.fonts.ready.then(placeIndicator);
  placeIndicator();

  // contact → glide down to the footer
  const contactLink = ruler.querySelector('[data-nav="contact"]');
  if (contactLink) contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('contact-footer').scrollIntoView({ behavior: 'smooth', block: 'end' });
  });

  // About: hovering a fact brings its photo forward
  const facts = document.querySelector('.ab-facts');
  if (facts) {
    const lines = facts.querySelectorAll('.ab-facts__list li');
    const photos = facts.querySelectorAll('.ab-photo');
    const show = (key) => {
      facts.classList.toggle('has-focus', !!key);
      lines.forEach((l) => l.classList.toggle('is-on', l.dataset.photo === key));
      photos.forEach((p) => p.classList.toggle('is-on', p.dataset.photo === key));
    };
    lines.forEach((l) => {
      l.addEventListener('pointerenter', () => show(l.dataset.photo));
      l.addEventListener('pointerleave', () => show(null));
    });
    photos.forEach((p) => {
      p.addEventListener('pointerenter', () => show(p.dataset.photo));
      p.addEventListener('pointerleave', () => show(null));
    });
  }

  // Sticker board: drag stickers around (desktop); last one touched comes to the top
  const board = document.getElementById('board');
  if (board && window.matchMedia('(min-width: 861px)').matches) {
    let z = 10;
    board.querySelectorAll('.stk').forEach((st) => {
      let sx, sy, ox = 0, oy = 0, lim;
      st.addEventListener('pointerdown', (e) => {
        e.preventDefault(); st.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY;
        ox = parseFloat(st.style.getPropertyValue('--dx')) || 0; oy = parseFloat(st.style.getPropertyValue('--dy')) || 0;
        // how far it can travel while keeping ~40% of it on the board
        const b = board.getBoundingClientRect(), r = st.getBoundingClientRect();
        lim = { l: b.left - r.left - r.width * 0.6, r: b.right - r.right + r.width * 0.6, t: b.top - r.top - r.height * 0.6, b: b.bottom - r.bottom + r.height * 0.6 };
        st.classList.add('is-drag'); st.style.zIndex = ++z;
      });
      st.addEventListener('pointermove', (e) => {
        if (!st.classList.contains('is-drag')) return;
        const mx = Math.max(lim.l, Math.min(lim.r, e.clientX - sx)), my = Math.max(lim.t, Math.min(lim.b, e.clientY - sy));
        st.style.setProperty('--dx', `${ox + mx}px`); st.style.setProperty('--dy', `${oy + my}px`);
      });
      const end = () => st.classList.remove('is-drag');
      st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
    });
  }

  // "Coming soon" for pages that aren't built yet
  const toast = document.getElementById('toast');
  let tt;
  document.querySelectorAll('[data-soon]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      toast.textContent = el.dataset.nav ? `${el.dataset.nav} page — coming soon ✦` : 'Coming soon ✦';
      toast.classList.add('is-on');
      clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 1600);
    });
  });
})();
