/* Obinna Oti — flip book portfolio
 * Page turning is handled by StPageFlip (assets/js/vendor/page-flip.browser.js, MIT).
 * This file sizes the book to the screen, switches between two-page spreads and
 * single pages, and wires up navigation, the index, deep links and sound. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const pad = (n) => String(n).padStart(2, '0');

  const SPREAD_RATIO = 900 / 800; // page height ÷ width → two pages form a 16:9 spread, like the Figma frames
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  const stage = $('#stage');
  const wrap = $('#bookWrap');
  const scrollView = $('#scrollView');
  const counter = $('#counter');
  const sectionLabel = $('#sectionLabel');
  const progressFill = $('#progressFill');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const indexBtn = $('#indexBtn');
  const indexPanel = $('#indexPanel');
  const indexList = $('#indexList');
  const viewBtn = $('#viewBtn');
  const soundBtn = $('#soundBtn');
  const fsBtn = $('#fsBtn');
  const hint = $('#hint');

  /* ---------- 1. Prepare the pages once ---------- */
  const source = $('#book');
  const pageEls = $$('.page', source);
  const total = pageEls.length;
  const headLeft = source.dataset.headLeft || '';
  const headRight = source.dataset.headRight || '';
  const sections = [];

  pageEls.forEach((page, i) => {
    page.dataset.index = i;
    // With the cover shown alone, odd pages sit on the left of a spread
    page.classList.add(i % 2 ? 'page--l' : 'page--r');
    if (page.dataset.section) {
      sections.push({ name: page.dataset.section, anchor: page.dataset.anchor || `page-${i}`, index: i });
    }
    const isCover = i === 0 || i === total - 1;
    const inner = $('.page__inner', page);
    if (!isCover && inner) {
      inner.insertAdjacentHTML('afterbegin',
        `<div class="page__head" aria-hidden="true"><span>${headLeft}</span><span>${headRight}</span></div>`);
      inner.insertAdjacentHTML('beforeend', `<div class="page__folio" aria-hidden="true">${pad(i)}</div>`);
    }
  });

  // "p. 05" references on the contents pages
  $$('[data-page-of]', source).forEach((el) => {
    const s = sections.find((x) => x.anchor === el.dataset.pageOf);
    if (s) el.textContent = `p. ${pad(s.index)}`;
  });

  const sectionAt = (i) => sections.reduce((found, s) => (s.index <= i ? s : found), sections[0]);
  const sectionByAnchor = (a) => sections.find((s) => s.anchor === a);
  const pristine = source.innerHTML;

  if (!window.St || !window.St.PageFlip) { // library missing: fall back to a plain scrolling document
    document.documentElement.classList.replace('js', 'no-js');
    return;
  }
  source.remove();

  /* ---------- 2. State ---------- */
  let pf = null;          // StPageFlip instance
  let layout = null;      // current book geometry
  let view = 'book';      // 'book' | 'scroll'
  let current = 0;        // current page index
  let lastState = 'read';
  let turned = false;     // has the reader turned a page yet?

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  let soundOn = store.get('oo-sound') !== 'off';

  /* ---------- 3. Geometry ---------- */
  function stageBox() {
    const r = stage.getBoundingClientRect();
    const gx = clamp(r.width * 0.04, 16, 56);
    const gy = clamp(r.height * 0.045, 14, 36);
    return { aw: Math.max(200, r.width - gx * 2), ah: Math.max(200, r.height - gy * 2) };
  }

  function computeLayout() {
    const { aw, ah } = stageBox();
    const single = aw < 600 || aw / ah < 1.1;
    if (single) {
      // One page at a time; let it grow taller on phones so text has room
      const ratio = clamp(ah / aw, SPREAD_RATIO, 1.75);
      const W = Math.floor(Math.min(aw, ah / ratio));
      return { single, ratio, W, pageW: W, pageH: W * ratio };
    }
    const W = Math.floor(Math.min(aw, (ah * 2) / SPREAD_RATIO));
    return { single, ratio: SPREAD_RATIO, W, pageW: W / 2, pageH: (W / 2) * SPREAD_RATIO };
  }

  // Lay every page out offscreen at the real size and shrink the type on any
  // page whose text would overflow (only happens on very small screens).
  function computeFits(L) {
    const m = document.createElement('div');
    m.className = `measure ${L.single ? 'is-single' : 'is-spread'}`;
    m.innerHTML = pristine;
    document.body.appendChild(m);
    const fits = $$('.page', m).map((page) => {
      page.style.width = `${L.pageW}px`;
      page.style.height = `${L.pageH}px`;
      const inner = $('.page__inner', page);
      let fit = 1;
      while (fit > 0.66 && inner.scrollHeight > inner.clientHeight + 1) {
        fit -= 0.04;
        inner.style.setProperty('--fit', fit.toFixed(2));
      }
      return fit;
    });
    m.remove();
    return fits;
  }

  function applyFits(root, fits) {
    $$('.page__inner', root).forEach((inner, i) => {
      if (fits[i] < 1) inner.style.setProperty('--fit', fits[i].toFixed(2));
    });
  }

  /* ---------- 4. Build the book ---------- */
  function build(L, startPage) {
    if (pf) { try { pf.destroy(); } catch (e) { /* already gone */ } pf = null; }
    $$('.book', wrap).forEach((el) => el.remove());

    layout = { ...L, builtW: L.W };
    wrap.classList.toggle('is-single', L.single);
    wrap.classList.toggle('is-spread', !L.single);
    wrap.style.width = `${L.W}px`;

    const el = document.createElement('div');
    el.className = 'book';
    el.innerHTML = pristine;
    applyFits(el, computeFits(L));
    wrap.appendChild(el);

    pf = new window.St.PageFlip(el, {
      width: 800,
      height: Math.round(800 * L.ratio),
      size: 'stretch',
      // In single-page mode the book switches to portrait when narrower than 2 × minWidth
      minWidth: L.single ? Math.ceil(L.W / 2) + 1 : 100,
      maxWidth: 4000,
      minHeight: 100,
      maxHeight: 4000,
      showCover: true,
      usePortrait: L.single,
      autoSize: true,
      startPage: clamp(startPage, 0, total - 1),
      flippingTime: reduceMotion ? 450 : 900,
      drawShadow: true,
      maxShadowOpacity: 0.45,
      showPageCorners: true,
      mobileScrollSupport: false,
      swipeDistance: 24,
    });

    pf.on('init', (e) => {
      current = e.data.page;
      sync();
      requestAnimationFrame(() => wrap.classList.add('is-ready'));
    });
    pf.on('flip', (e) => {
      current = e.data;
      if (!turned) { turned = true; hideHint(); }
      sync();
    });
    pf.on('changeState', (e) => {
      const state = e.data;
      if (state === 'flipping' && lastState !== 'flipping') {
        playFlip(current === 0 || current >= total - 2);
        // Start sliding a closed book back to the middle as soon as it opens
        wrap.classList.remove('is-shift-front', 'is-shift-back');
      }
      if (state === 'read') sync();
      lastState = state;
    });
    pf.on('changeOrientation', updateBase);

    pf.loadFromHTML($$('.page', el));
  }

  /* ---------- 5. Keep the UI in step with the book ---------- */
  function updateBase() {
    if (!pf || !layout) return;
    const r = pf.getBoundsRect();
    if (!r) return;
    const s = wrap.style;
    s.setProperty('--bx', `${r.left}px`);
    s.setProperty('--by', `${r.top}px`);
    s.setProperty('--bw', `${r.width}px`);
    s.setProperty('--bh', `${r.height}px`);
    s.setProperty('--pw', `${r.pageWidth}px`);
    // Stack of page edges: grows on the left as you read, shrinks on the right
    const thick = clamp(r.pageWidth * 0.012, 2, 7);
    const done = current / (total - 1);
    s.setProperty('--lt', `${(thick * done).toFixed(1)}px`);
    s.setProperty('--rt', `${(thick * (1 - done)).toFixed(1)}px`);
  }

  function sync() {
    if (view !== 'book') { syncScroll(); return; }
    const last = total - 1;
    const single = layout && layout.single;

    ['front', 'back'].forEach((side) => {
      const closed = !single && current === (side === 'front' ? 0 : last);
      wrap.classList.toggle(`is-closed-${side}`, closed); // shadow + page edges
      wrap.classList.toggle(`is-shift-${side}`, closed); // centring slide
    });

    let label;
    if (current === 0) label = 'Cover';
    else if (current === last) label = 'Back cover';
    else if (single || current + 1 >= last) label = `${pad(current)} <span>/ ${pad(total - 2)}</span>`;
    else label = `${pad(current)}–${pad(current + 1)} <span>/ ${pad(total - 2)}</span>`;
    counter.innerHTML = label;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === last;
    progressFill.style.transform = `scaleX(${current / last})`;
    updateSection(current);
    updateBase();
  }

  function updateSection(i) {
    const s = sectionAt(i);
    sectionLabel.textContent = i === 0 ? 'Portfolio 2020—2025' : s.name;
    $$('button', indexList).forEach((b) => b.setAttribute('aria-current', String(b.dataset.goto === s.anchor)));
    const url = s.anchor === 'cover' ? location.pathname + location.search : `#${s.anchor}`;
    if (url !== location.hash && !(s.anchor === 'cover' && !location.hash)) {
      try { history.replaceState(null, '', url); } catch (e) { /* sandboxed frame */ }
    }
  }

  /* ---------- 6. Navigation ---------- */
  function next() {
    if (view === 'scroll') return scrollToPage(Math.min(current + 1, total - 1));
    if (pf) pf.flipNext(isTouch ? 'bottom' : 'top');
  }
  function prev() {
    if (view === 'scroll') return scrollToPage(Math.max(current - 1, 0));
    if (pf) pf.flipPrev(isTouch ? 'bottom' : 'top');
  }
  function goTo(i) {
    if (view === 'scroll') return scrollToPage(i);
    if (!pf || i === current) return;
    pf.flip(i);
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-goto]');
    if (!t) return;
    e.preventDefault();
    const s = sectionByAnchor(t.dataset.goto);
    if (s) goTo(s.index);
    closeIndex();
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') { closeIndex(); return; }
    if (view !== 'book') return;
    const keys = {
      ArrowRight: next, ArrowDown: next, PageDown: next,
      ArrowLeft: prev, ArrowUp: prev, PageUp: prev,
      Home: () => goTo(0), End: () => goTo(total - 1),
    };
    if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
  });

  window.addEventListener('hashchange', () => {
    const s = sectionByAnchor(location.hash.slice(1));
    if (s) goTo(s.index);
  });

  /* ---------- 7. Index menu ---------- */
  indexList.innerHTML = sections
    .map((s) => `<li><button type="button" data-goto="${s.anchor}"><span>${s.index ? pad(s.index) : '—'}</span>${s.name}</button></li>`)
    .join('');

  function closeIndex() {
    indexPanel.hidden = true;
    indexBtn.setAttribute('aria-expanded', 'false');
  }
  indexBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = indexPanel.hidden;
    indexPanel.hidden = !open;
    indexBtn.setAttribute('aria-expanded', String(open));
    if (open) { const b = $('[aria-current="true"]', indexList) || $('button', indexList); b && b.focus(); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!indexPanel.hidden && !indexPanel.contains(e.target) && e.target !== indexBtn) closeIndex();
  });

  /* ---------- 8. Scroll view ---------- */
  function buildScroll() {
    const { aw } = stageBox();
    const twoUp = aw >= 720;
    const pageW = Math.floor(twoUp ? Math.min(620, aw / 2) : Math.min(560, aw));
    const L = { single: !twoUp, ratio: twoUp ? SPREAD_RATIO : 1.45, pageW, pageH: pageW * (twoUp ? SPREAD_RATIO : 1.45) };
    scrollView.className = `scroll-view ${L.single ? 'is-single' : 'is-spread'}`;
    scrollView.style.setProperty('--sw', `${pageW}px`);
    scrollView.style.setProperty('--sr', String(L.ratio));
    scrollView.innerHTML = `<div class="scroll-book">${pristine}</div>`;
    applyFits(scrollView, computeFits(L));
  }

  function scrollToPage(i, instant) {
    const el = $(`.page[data-index="${i}"]`, scrollView);
    if (el) el.scrollIntoView({ block: 'center', behavior: instant || reduceMotion ? 'auto' : 'smooth' });
  }

  let scrollTick = false;
  scrollView.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => { scrollTick = false; syncScroll(); });
  }, { passive: true });

  function syncScroll() {
    const mid = scrollView.getBoundingClientRect().top + scrollView.clientHeight / 2;
    const pages = $$('.page', scrollView);
    const hit = pages.find((p) => p.getBoundingClientRect().bottom >= mid) || pages[pages.length - 1];
    if (!hit) return;
    current = Number(hit.dataset.index);
    counter.innerHTML = current === 0 ? 'Cover' : current === total - 1 ? 'Back cover' : `${pad(current)} <span>/ ${pad(total - 2)}</span>`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    progressFill.style.transform = `scaleX(${current / (total - 1)})`;
    updateSection(current);
  }

  function setView(v) {
    view = v;
    const scroll = v === 'scroll';
    viewBtn.setAttribute('aria-pressed', String(scroll));
    viewBtn.setAttribute('aria-label', scroll ? 'Switch to book view' : 'Switch to scroll view');
    viewBtn.title = scroll ? 'Book view' : 'Scroll view';
    wrap.hidden = scroll;
    scrollView.hidden = !scroll;
    hideHint();
    if (scroll) {
      if (pf) { try { pf.destroy(); } catch (e) { /* noop */ } pf = null; }
      wrap.classList.remove('is-ready');
      buildScroll();
      scrollToPage(current, true);
      syncScroll();
    } else {
      scrollView.innerHTML = '';
      build(computeLayout(), current);
    }
    store.set('oo-view', v);
  }
  viewBtn.addEventListener('click', () => setView(view === 'book' ? 'scroll' : 'book'));

  /* ---------- 9. Resize ---------- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    if (view === 'book' && layout) {
      const L = computeLayout();
      if (L.single === layout.single) wrap.style.width = `${L.W}px`; // StPageFlip re-fits itself right after this
      requestAnimationFrame(updateBase);
    }
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (view === 'scroll') { buildScroll(); scrollToPage(current, true); return; }
      const L = computeLayout();
      const changed = !layout
        || L.single !== layout.single
        || (L.single && (Math.abs(L.ratio - layout.ratio) > 0.06 || L.W > 2 * Math.ceil(layout.builtW / 2)))
        || Math.abs(L.pageW - layout.pageW) / layout.pageW > 0.12;
      if (changed) build(L, current);
      else { layout = { ...layout, W: L.W, pageW: L.pageW, pageH: L.pageH }; updateBase(); }
    }, 200);
  });

  /* ---------- 10. Sound: a soft paper swish, synthesised (no audio files) ---------- */
  let audio = null;
  function playFlip(hard) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      const dur = hard ? 0.38 : 0.55;
      const buf = audio.createBuffer(1, Math.floor(audio.sampleRate * dur), audio.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const p = i / d.length;
        const crackle = Math.random() < 0.004 ? 2.5 : 1;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, 1.6) * Math.sin(Math.PI * Math.min(1, p * 6)) * crackle;
      }
      const src = audio.createBufferSource();
      src.buffer = buf;
      const filter = audio.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(hard ? 900 : 2600, t);
      filter.frequency.exponentialRampToValueAtTime(hard ? 300 : 700, t + dur);
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(hard ? 0.5 : 0.22, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter).connect(gain).connect(audio.destination);
      src.start(t);
    } catch (e) { /* audio unavailable */ }
  }
  function setSound(on) {
    soundOn = on;
    soundBtn.setAttribute('aria-pressed', String(on));
    store.set('oo-sound', on ? 'on' : 'off');
  }
  setSound(soundOn);
  soundBtn.addEventListener('click', () => setSound(!soundOn));

  /* ---------- 11. Full screen ---------- */
  const root = document.documentElement;
  if (!(root.requestFullscreen || root.webkitRequestFullscreen)) fsBtn.hidden = true;
  fsBtn.addEventListener('click', () => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    const req = fsEl
      ? (document.exitFullscreen || document.webkitExitFullscreen).call(document)
      : (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    if (req && req.catch) req.catch(() => { /* not allowed here */ });
  });

  /* ---------- 12. Hint ---------- */
  hint.textContent = isTouch
    ? 'Swipe or tap the page edges to turn'
    : 'Click a page or drag its corner to turn  ·  ← → keys';
  function hideHint() { hint.classList.add('is-hidden'); }
  setTimeout(hideHint, 7000);

  /* ---------- 13. Go ---------- */
  const startSection = sectionByAnchor(location.hash.slice(1));
  current = startSection ? startSection.index : 0;
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([
      document.fonts.load('800 1em "Tomato Grotesk"'),
      document.fonts.load('italic 600 1em "Tomato Grotesk"'),
      document.fonts.load('italic 200 1em "Tomato Grotesk"'),
      document.fonts.load('italic 100 1em "Tomato Grotesk"'),
    ]).catch(() => {})
    : Promise.resolve();
  fontsReady.then(() => {
    if (store.get('oo-view') === 'scroll') setView('scroll');
    else build(computeLayout(), current);
  });
})();
