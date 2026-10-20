/* "Work with me": vine grows along the heading, then real flowers open; badge types itself in. Shared by every page that has the .cta block. */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.querySelector('.cta__inner')) return;
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
  // finds a letter's main vertical stroke by rendering it to a small canvas
  function mainStroke(ch, font, w, h, baseline, fs, pad) {
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h);
    const ctx = cv.getContext('2d'); ctx.font = font; ctx.fillText(ch, pad, baseline);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let cur = null; const stems = [];
    for (let x = 0; x < cv.width; x++) {
      let best = 0, run = 0, end = 0;
      for (let y = 0; y < cv.height; y++) { if (d[(y * cv.width + x) * 4 + 3] > 120) { if (++run > best) { best = run; end = y; } } else run = 0; }
      if (best >= fs * 0.3) {
        if (cur && x === cur.xR + 1) { cur.xR = x; cur.top = Math.min(cur.top, end - best); cur.bot = Math.max(cur.bot, end); cur.len = Math.max(cur.len, best); }
        else { cur = { xL: x, xR: x, top: end - best, bot: end, len: best }; stems.push(cur); }
      } else cur = null;
    }
    const ok = stems.filter((st) => st.xR - st.xL < fs * 0.2);
    return ok.length ? ok.reduce((a, c) => (c.len > a.len ? c : a)) : null;
  }
  function buildGarden() {
    gBackSvg.innerHTML = ''; gFrontSvg.innerHTML = '';
    makeDefs(gBackSvg); makeDefs(gFrontSvg);
    const title = cta.querySelector('.cta__title a');
    const cs = getComputedStyle(title);
    const fs = parseFloat(cs.fontSize);
    const sc = fs / 184;
    const box = cta.getBoundingClientRect();
    const rnd = rng(9);
    const back = el('g', {}, gBackSvg), front = el('g', {}, gFrontSvg), top = el('g', {}, gFrontSvg);
    const VINE = '#4f6b34';
    const mctx = document.createElement('canvas').getContext('2d');
    // which letters get a creeper (index among non-space characters), and what blooms at the tip
    const PLAN = { 0: 'orange', 1: 'pink', 3: 'pink', 5: 'white', 7: 'orange', 8: 'pink', 9: 'white' };
    let n = 0, order = 0;
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const italic = getComputedStyle(node.parentElement).fontStyle === 'italic';
      const font = `${italic ? 'italic ' : ''}${fs}px ${cs.fontFamily}`;
      mctx.font = font;
      const m = mctx.measureText('Hg');
      for (let i = 0; i < node.length; i++) {
        const ch = node.data[i];
        if (!ch.trim()) continue;
        const idx = n++;
        if (!(idx in PLAN)) continue;
        const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1);
        const b = r.getBoundingClientRect();
        const lineH = b.height;
        const baseline = (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
        const pad = fs * 0.15;
        const ox = b.left - box.left + GPAD - pad, oy = b.top - box.top + GPAD;
        if (ch === 'o') {   // the "o" gets a wreath: a vine coiling round its bowl, with flowers tucked in
          const mo = mctx.measureText('o');
          const cxo = ox + pad + b.width / 2, oBase = oy + baseline;
          const xh = mo.actualBoundingBoxAscent;
          const cyo = oBase - xh / 2, rxo = b.width * 0.47, ryo = xh * 0.53, coil = fs * 0.045;
          const t0 = order * 0.42, outBase = (7 - order) * 0.08; order++;
          const start = Math.PI * 0.62, sweep = Math.PI * 1.75, turnsO = 9, N = 260;
          const pts = [];
          for (let k = 0; k <= N; k++) {
            const t = k / N, th = start + t * sweep, ph = t * turnsO * Math.PI * 2;
            const ex = Math.cos(th), ey = Math.sin(th);
            const w = coil * Math.sin(ph);
            pts.push({ x: cxo + ex * (rxo + w), y: cyo + ey * (ryo + w), front: Math.cos(ph) > 0, ex, ey });
          }
          let total = 0; const cum = [0];
          for (let k = 1; k < pts.length; k++) { total += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y); cum.push(total); }
          const speed = 420 * sc;
          let s0 = 0;
          for (let k = 1; k <= pts.length; k++) {
            if (k === pts.length || pts[k].front !== pts[s0].front) {
              const seg = pts.slice(s0, Math.min(k + 1, pts.length));
              if (seg.length > 1) {
                const kk = Math.min(k, pts.length - 1);
                stemPath(pts[s0].front ? front : back, 'M' + seg.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L'), 2.6 * sc, VINE, t0 + cum[s0] / speed, Math.max(0.05, (cum[kk] - cum[s0]) / speed), outBase + (total - cum[kk]) / (speed * 3));
              }
              s0 = k;
            }
          }
          const tAt = (k) => t0 + cum[k] / speed, outK = (k) => outBase + (total - cum[k]) / (speed * 3);
          for (let k = 12; k < N - 6; k += 22 + Math.floor(rnd() * 8)) {        // leaves point outward from the ring
            const p = pts[k];
            const outward = Math.atan2(p.ey, p.ex) * 180 / Math.PI;
            leafAt(rnd() < 0.7 ? front : back, p.x, p.y, outward + (rnd() - 0.5) * 60, (11 + rnd() * 7) * sc, tAt(k), outK(k), rnd);
          }
          const at = (frac) => { const k = Math.floor(N * frac); const p = pts[k]; return [cxo + p.ex * (rxo + fs * 0.03), cyo + p.ey * (ryo + fs * 0.03), k]; };
          const [f1x, f1y, k1] = at(0.38);   // lower right
          flowerAt(top, 'rose-2', f1x, f1y, fs * 0.17, tAt(k1) + 0.1, outK(k1) * 0.5, rnd);
          const [f2x, f2y, k2] = at(0.97);   // top left, where the vine ends
          flowerAt(top, 'calendula-2', f2x, f2y, fs * 0.13, tAt(k2) + 0.05, 0, rnd);
          const [bxq, byq, kq] = at(0.7);
          for (let q = 0; q < 5; q++) budAt(top, bxq + (rnd() - 0.5) * 14 * sc, byq + (rnd() - 0.5) * 12 * sc, (2.3 + rnd() * 1.6) * sc, tAt(kq) + q * 0.05, outK(kq) * 0.5);
          continue;
        }
        const st = /[Ww]/.test(ch) ? null : mainStroke(ch, font, b.width + pad * 2, lineH, baseline, fs, pad);   // W/w only have diagonals
        // axis of the coil: the vertical stroke if there is one, otherwise the letter's first diagonal (W, w)
        let bx, by, tx, ty, rad;
        if (st) {
          const cx = ox + (st.xL + st.xR) / 2;
          rad = (st.xR - st.xL) / 2 + 5 * sc;
          by = oy + st.bot - fs * 0.01; ty = oy + st.top + fs * 0.04;
          const lean = italic ? (by - ty) * 0.2 : 0;
          bx = cx - lean / 2; tx = cx + lean / 2;
        } else {
          const capTop = oy + baseline - fs * (/[A-Z]/.test(ch) ? 0.68 : 0.46);
          bx = ox + pad + b.width * 0.3; by = oy + baseline - fs * 0.02;
          tx = ox + pad + b.width * 0.06; ty = capTop + fs * 0.03;
          rad = fs * 0.07;
        }
        const H = Math.hypot(tx - bx, ty - by);
        const ux = (tx - bx) / H, uy = (ty - by) / H, nx = -uy, ny = ux;   // axis + its normal
        const turns = Math.max(1.6, H / (fs * 0.17));
        const ph0 = rnd() * Math.PI * 2;
        const t0 = order * 0.42, outBase = (6 - order) * 0.08;
        order++;
        const pts = [];
        const N = Math.ceil(turns * 26);
        for (let k = 0; k <= N; k++) {
          const t = k / N, ph = ph0 + t * turns * Math.PI * 2;
          const swell = 1 + 0.12 * Math.sin(t * Math.PI);                  // slightly fuller mid-coil
          pts.push({ x: bx + ux * H * t + nx * Math.sin(ph) * rad * swell, y: by + uy * H * t + ny * Math.sin(ph) * rad * swell, front: Math.cos(ph) > 0 });
        }
        // free tendril curling up past the top of the letter
        const last = pts[pts.length - 1];
        const isLast = idx === Math.max(...Object.keys(PLAN).map(Number));
        let ang = Math.atan2(uy, ux) + (isLast ? -0.6 : (rnd() - 0.5) * 0.8), cx2 = last.x, cy2 = last.y;   // last one curls away from the badge
        const tail = fs * (0.18 + rnd() * 0.16), steps = 12, curl = (isLast ? -1 : (rnd() < 0.5 ? -1 : 1)) * (0.12 + rnd() * 0.06);
        for (let k = 1; k <= steps; k++) { ang += curl; cx2 += Math.cos(ang) * tail / steps; cy2 += Math.sin(ang) * tail / steps; pts.push({ x: cx2, y: cy2, front: true }); }
        // draw in front/back runs, timed so the vine grows continuously from the bottom up
        let total = 0; const cum = [0];
        for (let k = 1; k < pts.length; k++) { total += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y); cum.push(total); }
        const speed = 340 * sc;
        let s0 = 0;
        for (let k = 1; k <= pts.length; k++) {
          if (k === pts.length || pts[k].front !== pts[s0].front) {
            const seg = pts.slice(s0, Math.min(k + 1, pts.length));
            if (seg.length > 1) {
              const d = 'M' + seg.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L');
              const L = cum[Math.min(k, pts.length - 1)] - cum[s0];
              stemPath(pts[s0].front ? front : back, d, 2.8 * sc, VINE, t0 + cum[s0] / speed, Math.max(0.05, L / speed), outBase + (total - cum[Math.min(k, pts.length - 1)]) / (speed * 3));
            }
            s0 = k;
          }
        }
        const tAt = (k) => t0 + cum[k] / speed, outK = (k) => outBase + (total - cum[k]) / (speed * 3);
        // leaves on the front of the coil, pointing outward so the letter stays readable
        for (let k = 10; k < pts.length - 4; k += 14 + Math.floor(rnd() * 8)) {
          if (!pts[k].front) continue;
          const side = (pts[k].x - (bx + ux * (pts[k].y - by) / (uy || -1))) >= 0 ? 1 : -1;
          const outward = Math.atan2(ny * side, nx * side) * 180 / Math.PI;
          leafAt(front, pts[k].x, pts[k].y, outward + (rnd() - 0.5) * 50 - 20, (12 + rnd() * 8) * sc, tAt(k), outK(k), rnd);
        }
        // a small bloom halfway up, sitting beside the stroke (not on top of it)
        const midK = Math.floor(N * (0.45 + rnd() * 0.2));
        const sideSign = rnd() < 0.5 ? -1 : 1;
        const mx = bx + ux * H * (midK / N) + nx * sideSign * (rad + fs * 0.07), my = by + uy * H * (midK / N) + ny * sideSign * (rad + fs * 0.07);
        const kindMid = ['pink', 'white', 'orange'][(order + 1) % 3];
        if (rnd() < 0.85) flowerAt(top, FLOWERS[kindMid][order % FLOWERS[kindMid].length], mx, my, fs * 0.15, tAt(midK) + 0.15, outK(midK) * 0.5, rnd);
        else for (let q = 0; q < 5; q++) budAt(top, mx + (rnd() - 0.5) * 14 * sc, my + (rnd() - 0.5) * 12 * sc, (2.4 + rnd() * 1.6) * sc, tAt(midK) + 0.1 + q * 0.05, outK(midK) * 0.5);
        // the main flower opens at the tip of the tendril
        const kind = PLAN[idx];
        flowerAt(top, FLOWERS[kind][idx % FLOWERS[kind].length], cx2, cy2, fs * (0.26 + rnd() * 0.06), t0 + total / speed - 0.05, 0, rnd);
        leafAt(front, cx2, cy2 + fs * 0.03, 120 + rnd() * 40, 14 * sc, t0 + total / speed - 0.2, 0.05, rnd);
      }
    }
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
  // badge types itself out the first time "Work with me" comes into view
  const badgeText = cta.querySelector('.cta__badge-text'), badgeCaret = cta.querySelector('.cta__caret');
  const badgeFull = badgeText.textContent;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    placeBadge();                                  // measure with the full text first
    if (reduceMotion || !('IntersectionObserver' in window)) { badgeCaret.classList.add('is-done'); return; }
    badgeText.textContent = '';
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      let i = 0;
      const step = () => {
        badgeText.textContent = badgeFull.slice(0, ++i);
        if (i < badgeFull.length) setTimeout(step, 38 + Math.random() * 40);
        else badgeCaret.classList.add('is-done');
      };
      setTimeout(step, 350);
    }, { threshold: 0.6 });
    io.observe(cta);
  });
  window.addEventListener('resize', () => { const t = badgeText.textContent; badgeText.textContent = badgeFull; placeBadge(); badgeText.textContent = t; });

})();
