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
