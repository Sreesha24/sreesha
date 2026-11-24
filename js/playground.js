/* Playground: filter tabs + pause-all-motion button */
(function () {
  const pg = document.querySelector('.pg');
  if (!pg) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tabs = [...pg.querySelectorAll('.pg__tab')];
  const cards = [...pg.querySelectorAll('.pg-card')];
  const videos = cards.map((c) => c.querySelector('video')).filter(Boolean);
  const status = document.getElementById('pgStatus');
  const empty = document.getElementById('pgEmpty');
  const pauseBtn = document.getElementById('pgPause');
  let paused = reduceMotion;   // reduced motion: start paused, the visitor can still press play

  function applyFilter(key, label) {
    let shown = 0;
    cards.forEach((c) => {
      const match = key === 'all' || c.dataset.cat.split(' ').includes(key);
      const wasHidden = c.hidden;
      c.hidden = !match;
      if (match) {
        shown++;
        if (wasHidden && !paused) { c.classList.remove('is-entering'); void c.offsetWidth; c.classList.add('is-entering'); }
      }
    });
    empty.hidden = shown > 0;
    if (status) status.textContent = `${label}: ${shown} ${shown === 1 ? 'piece' : 'pieces'}`;
    syncVideos();
  }

  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    applyFilter(t.dataset.filter, t.textContent.trim());
  }));

  /* videos only play while on screen, visible and not paused */
  const onScreen = new Set();
  function syncVideos() {
    videos.forEach((v) => {
      const card = v.closest('.pg-card');
      if (!paused && !card.hidden && onScreen.has(v)) v.play().catch(() => {});
      else v.pause();
    });
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? onScreen.add(en.target) : onScreen.delete(en.target)));
      syncVideos();
    }, { threshold: 0.15 });
    videos.forEach((v) => io.observe(v));
  } else videos.forEach((v) => onScreen.add(v));

  function setPaused(p) {
    paused = p;
    pg.classList.toggle('is-paused', p);
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.setAttribute('aria-label', p ? 'Play motion' : 'Pause motion');
    syncVideos();
  }
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  setPaused(paused);
})();
