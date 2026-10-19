/* Staggers the intro and reveals content as it scrolls into view (paired with css/motion.css) */
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // stagger indexes for nav items and top links
  document.querySelectorAll('.ruler__list > li, .toplinks > *').forEach((el, i, all) => {
    const list = el.parentElement.children; el.style.setProperty('--i', [...list].indexOf(el));
  });
  // drop the intro class once it has played, so later hover/transition styles aren't affected
  setTimeout(() => root.classList.remove('intro'), 2300);

  const groups = [
    ['.section-title', 'reveal--title', 0],
    ['.card', '', 0.12],
    ['.clients__logos li', 'reveal--logo', 0.05],
    ['.ab-facts__list li', '', 0.06],
    ['.ab-facts__wall', '', 0],
    ['.ab-story__body p', '', 0.1],
    ['.ab-rows li', '', 0.05],
    ['.board', '', 0],
    ['.ab-connect__title, .ab-connect__row', '', 0.12],
  ];
  const targets = [];
  groups.forEach(([sel, extra, step]) => {
    // items that share a parent get a small stagger
    const byParent = new Map();
    document.querySelectorAll(sel).forEach((el) => {
      const k = el.parentElement; const n = byParent.get(k) || 0; byParent.set(k, n + 1);
      el.classList.add('reveal'); if (extra) el.classList.add(extra);
      el.style.setProperty('--rd', `${(n * step).toFixed(2)}s`);
      targets.push(el);
    });
  });
  if (reduce || !('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting || en.boundingClientRect.top < 0) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  targets.forEach((t) => io.observe(t));
})();
