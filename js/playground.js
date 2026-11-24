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

  /* ---------- Masonry: each visible piece goes into the shortest column, in page order ---------- */
  const grid = document.getElementById('pgGrid');
  function layout() {
    const cs = getComputedStyle(grid);
    const cols = parseInt(cs.getPropertyValue('--cols'), 10) || 3;
    const gap = Math.round(parseFloat(cs.columnGap) || 0);
    const vis = cards.filter((c) => !c.hidden);
    if (cols < 2) { grid.classList.remove('is-masonry'); vis.forEach((c) => { c.style.gridColumn = ''; c.style.gridRow = ''; }); return; }
    grid.classList.add('is-masonry');
    const h = new Array(cols).fill(0);
    vis.forEach((c) => {
      let col = 0;
      for (let i = 1; i < cols; i++) if (h[i] < h[col] - 1) col = i;
      const ht = Math.ceil(c.getBoundingClientRect().height);
      c.style.gridColumn = String(col + 1);
      c.style.gridRow = `${h[col] + 1} / span ${Math.max(1, ht)}`;
      h[col] += ht + gap;
    });
  }
  let raf = 0;
  const relayout = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };
  window.addEventListener('resize', relayout);
  if (document.fonts) document.fonts.ready.then(relayout);
  cards.forEach((c) => c.querySelectorAll('img, video').forEach((m) => m.addEventListener(m.tagName === 'IMG' ? 'load' : 'loadedmetadata', relayout)));
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(grid.parentElement);

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
    layout();
    if (status) status.textContent = `${label}: ${shown} ${shown === 1 ? 'piece' : 'pieces'}`;
    syncVideos();
  }

  /* counts beside each filter */
  tabs.forEach((t) => {
    const k = t.dataset.filter;
    const n = k === 'all' ? cards.length : cards.filter((c) => c.dataset.cat.split(' ').includes(k)).length;
    const c = t.querySelector('.pg__count');
    if (c) { c.textContent = String(n).padStart(2, '0'); c.setAttribute('aria-label', `${n} pieces`); }
  });

  /* the marker glides under the selected filter */
  const tabsBox = pg.querySelector('.pg__tabs');
  const marker = pg.querySelector('.pg__marker');
  function placeMarker() {
    const on = tabs.find((t) => t.getAttribute('aria-pressed') === 'true');
    if (!on || !marker) return;
    const lab = on.querySelector('.pg__label');
    const b = tabsBox.getBoundingClientRect(), r = lab.getBoundingClientRect();
    marker.style.setProperty('--x', `${r.left - b.left}px`);
    marker.style.setProperty('--w', `${on.getBoundingClientRect().right - r.left}px`);
    marker.style.top = `${on.offsetTop + on.offsetHeight - 1}px`; marker.style.bottom = 'auto';
  }
  window.addEventListener('resize', placeMarker);
  if (document.fonts) document.fonts.ready.then(placeMarker);
  placeMarker();

  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    placeMarker();
    applyFilter(t.dataset.filter, t.querySelector('.pg__label').textContent.trim());
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
    const lbl = pauseBtn.querySelector('.pg__pause-text');
    if (lbl) lbl.textContent = p ? 'play motion' : 'pause motion';
    syncVideos();
  }
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  setPaused(paused);
  layout();

  /* ---------- Click a piece to see it full size ---------- */
  const view = document.getElementById('pgView');
  if (view && typeof view.showModal === 'function') {
    const vMedia = document.getElementById('pgViewMedia');
    const vCap = document.getElementById('pgViewCap');
    const vPrev = document.getElementById('pgViewPrev');
    const vNext = document.getElementById('pgViewNext');
    let idx = -1, opener = null;

    // make each piece a real button
    cards.forEach((c) => {
      const media = c.querySelector('img, video');
      const title = c.querySelector('figcaption').textContent.replace(/^\s*\d+\/\s*/, '').trim();
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pg-card__open';
      b.setAttribute('aria-label', `View ${title} full size`);
      media.parentNode.insertBefore(b, media); b.appendChild(media);
      b.addEventListener('click', () => open(c, b));
    });

    const visible = () => cards.filter((c) => !c.hidden);
    function show(card) {
      const list = visible(); idx = list.indexOf(card);
      const src = card.querySelector('img, video');
      vMedia.textContent = '';
      let el;
      if (src.tagName === 'VIDEO') {
        el = document.createElement('video');
        el.src = src.currentSrc || src.src; el.poster = src.poster;
        el.muted = true; el.loop = true; el.playsInline = true; el.controls = true;
        el.setAttribute('aria-label', src.getAttribute('aria-label') || '');
        if (!paused) el.play().catch(() => {});
      } else {
        el = document.createElement('img');
        el.src = src.dataset.full || src.currentSrc || src.src; el.alt = src.alt;
      }
      vMedia.appendChild(el);
      vCap.innerHTML = card.querySelector('figcaption').innerHTML;
      vPrev.hidden = idx <= 0; vNext.hidden = idx >= list.length - 1;
    }
    function open(card, btn) {
      opener = btn; show(card);
      document.documentElement.classList.add('pg-view-open');
      view.showModal();
      document.getElementById('pgViewClose').focus();
    }
    function close() { view.close(); }
    view.addEventListener('close', () => {
      document.documentElement.classList.remove('pg-view-open');
      vMedia.textContent = '';
      if (opener) opener.focus();
    });
    document.getElementById('pgViewClose').addEventListener('click', close);
    vPrev.addEventListener('click', () => { const l = visible(); if (idx > 0) show(l[idx - 1]); });
    vNext.addEventListener('click', () => { const l = visible(); if (idx < l.length - 1) show(l[idx + 1]); });
    view.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); vPrev.click(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); vNext.click(); }
    });
    // click on the empty space around the piece closes it
    view.addEventListener('click', (e) => { if (e.target === view || e.target.classList.contains('pg-view__inner') || e.target === vMedia) close(); });
  }
})();
