/* Obinna Oti — portfolio
 * A carousel of projects; choosing one opens that project's flip book.
 * Page turning is handled by StPageFlip (assets/js/vendor/page-flip.browser.js, MIT).
 * This file builds the carousel, sizes each book to the screen, switches between
 * two-page spreads and single pages, and wires up navigation, links and sound. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const pad = (n) => String(n).padStart(2, '0');

  const SPREAD_RATIO = 900 / 800; // page height ÷ width → two pages form a 16:9 spread, like the Figma frames
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  const shelf = $('#shelf');
  const reader = $('#reader');
  const carousel = $('#carousel');
  const track = $('#track');
  const stage = $('#stage');
  const wrap = $('#bookWrap');
  const counter = $('#counter');
  const progressFill = $('#progressFill');
  const readerTitle = $('#readerTitle');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const soundBtn = $('#soundBtn');
  const fsBtn = $('#fsBtn');
  const hint = $('#hint');

  /* ---------- 1. Read the books ---------- */
  const books = $$('.book-src').map((src) => {
    const pages = $$(':scope > .page', src);
    const total = pages.length;
    pages.forEach((page, i) => {
      page.dataset.index = i;
      // With the cover shown alone, odd pages sit on the left of a spread
      page.classList.add(i % 2 ? 'page--l' : 'page--r');
      const inner = $('.page__inner', page);
      if (i > 0 && i < total - 1 && inner) {
        inner.insertAdjacentHTML('afterbegin',
          '<div class="page__head" aria-hidden="true"><span>Obinna Oti</span><span>2020—2025</span></div>');
        inner.insertAdjacentHTML('beforeend', `<div class="page__folio" aria-hidden="true">${pad(i)}</div>`);
      }
    });
    return {
      el: src,
      slug: src.dataset.slug,
      number: src.dataset.number || '',
      title: src.dataset.title || '',
      meta: src.dataset.meta || '',
      total,
    };
  });
  books.forEach((b, i) => {
    const nextBook = books[(i + 1) % books.length];
    $$('[data-action="next"]', b.el).forEach((btn) => {
      if (books.length < 2) btn.remove();
      else btn.textContent = `Next: ${nextBook.title}`;
    });
    b.cover = $('.page', b.el).outerHTML;
    b.html = b.el.innerHTML;
  });

  if (!books.length || !window.St || !window.St.PageFlip) { // fall back to plain stacked pages
    document.documentElement.classList.replace('js', 'no-js');
    return;
  }
  $('#library').remove();

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  /* ---------- 2. Carousel ---------- */
  track.innerHTML = books.map((b, i) => `
    <div class="card" role="listitem" data-i="${i}">
      <button class="card__btn" type="button" aria-label="${b.number} ${b.title}, ${b.meta}. Open the book">
        <span class="card__cover" aria-hidden="true">${b.cover}</span>
      </button>
    </div>`).join('');
  const cards = $$('.card', track);
  const capNum = $('#capNum');
  const capTitle = $('#capTitle');
  const capMeta = $('#capMeta');
  const capPager = $('#capPager');
  const carPrev = $('#carPrev');
  const carNext = $('#carNext');
  let active = -1;

  function sizeCards() {
    const h = carousel.clientHeight - 48;
    const w = carousel.clientWidth;
    const cw = Math.max(140, Math.min(h * 0.889, w * (w < 600 ? 0.72 : 0.42), 600));
    track.style.setProperty('--cw', `${cw}px`);
    track.style.setProperty('--gap', `${Math.round(clamp(cw * 0.22, 28, 96))}px`);
    cards.forEach((c) => $('.card__cover', c).style.setProperty('--s', (cw / 800).toFixed(4)));
  }

  function updateCarousel() {
    const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid) / (c.offsetWidth || 1);
      c.style.setProperty('--d', Math.min(d, 1.5).toFixed(3));
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best !== active) setActive(best);
  }

  function setActive(i) {
    const first = active < 0;
    active = i;
    const b = books[i];
    capNum.textContent = b.number;
    capTitle.textContent = b.title;
    capMeta.textContent = b.meta;
    capPager.innerHTML = `${pad(i + 1)} <span>/ ${pad(books.length)}</span>`;
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
    carPrev.disabled = i === 0;
    carNext.disabled = i === books.length - 1;
    if (!first && !reduceMotion && capTitle.animate) {
      [capNum, capTitle, capMeta].forEach((el, k) => el.animate(
        [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, delay: k * 40, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'backwards' },
      ));
    }
  }

  function goCard(i, smooth = true) {
    const c = cards[clamp(i, 0, cards.length - 1)];
    track.scrollTo({
      left: c.offsetLeft + c.offsetWidth / 2 - track.clientWidth / 2,
      behavior: smooth && !reduceMotion ? 'smooth' : 'auto',
    });
  }

  let carTick = false;
  track.addEventListener('scroll', () => {
    if (carTick) return;
    carTick = true;
    requestAnimationFrame(() => { carTick = false; updateCarousel(); });
  }, { passive: true });

  // A vertical mouse wheel moves one project at a time
  let wheelLock = 0;
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // trackpads scroll sideways natively
    e.preventDefault();
    const now = Date.now();
    if (now < wheelLock || Math.abs(e.deltaY) < 4) return;
    wheelLock = now + 500;
    goCard(active + Math.sign(e.deltaY));
  }, { passive: false });

  track.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const i = Number(card.dataset.i);
    if (i === active) openBook(books[i].slug);
    else goCard(i);
  });
  carPrev.addEventListener('click', () => goCard(active - 1));
  carNext.addEventListener('click', () => goCard(active + 1));
  $('#openBtn').addEventListener('click', () => openBook(books[active].slug));

  /* ---------- 3. Views + links ---------- */
  let book = null; // the open book
  let pf = null; // its StPageFlip instance
  let layout = null;
  let current = 0;
  let lastState = 'read';
  let turned = false;
  let autoOpen = false;
  let hintTimer;

  // Each book has its own link: …/#sting-rays
  function openBook(slug) {
    if (location.hash.slice(1) === slug) route();
    else location.hash = slug;
  }
  function closeBook() {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sandboxed */ }
    route();
  }
  function route() {
    const b = books.find((x) => x.slug === location.hash.slice(1));
    if (b) showReader(b);
    else showShelf();
  }
  window.addEventListener('hashchange', route);

  function showShelf() {
    const from = book;
    destroyBook();
    book = null;
    reader.hidden = true;
    shelf.hidden = false;
    document.title = 'Obinna Oti — Product Design Portfolio';
    sizeCards();
    const i = from ? books.indexOf(from) : Math.max(active, 0);
    goCard(i, false);
    updateCarousel();
    if (from) $('.card__btn', cards[i]).focus({ preventScroll: true });
  }

  function showReader(b) {
    if (book === b && pf) return;
    book = b;
    shelf.hidden = true;
    reader.hidden = false;
    readerTitle.textContent = `${b.number} — ${b.title}`;
    document.title = `${b.title} — Obinna Oti`;
    current = 0;
    autoOpen = true;
    if (!turned) {
      hint.classList.remove('is-hidden');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(hideHint, 8000);
    }
    build(computeLayout(), 0);
  }

  /* ---------- 4. Book geometry ---------- */
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
    m.innerHTML = book.html;
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

  /* ---------- 5. Build a book ---------- */
  function destroyBook() {
    if (pf) { try { pf.destroy(); } catch (e) { /* already gone */ } }
    pf = null;
    $$('.book', wrap).forEach((el) => el.remove());
    wrap.classList.remove('is-ready');
  }

  function build(L, startPage) {
    destroyBook();
    layout = { ...L, builtW: L.W };
    wrap.classList.add('no-anim');
    wrap.classList.toggle('is-single', L.single);
    wrap.classList.toggle('is-spread', !L.single);
    wrap.style.width = `${L.W}px`;

    const el = document.createElement('div');
    el.className = 'book';
    el.innerHTML = book.html;
    const fits = computeFits(L);
    $$('.page__inner', el).forEach((inner, i) => {
      if (fits[i] < 1) inner.style.setProperty('--fit', fits[i].toFixed(2));
    });
    wrap.appendChild(el);

    const instance = new window.St.PageFlip(el, {
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
      startPage: clamp(startPage, 0, book.total - 1),
      flippingTime: reduceMotion ? 450 : 900,
      drawShadow: true,
      maxShadowOpacity: 0.45,
      showPageCorners: true,
      mobileScrollSupport: false,
      swipeDistance: 24,
    });
    pf = instance;

    instance.on('init', (e) => {
      current = e.data.page;
      sync();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        wrap.classList.remove('no-anim');
        wrap.classList.add('is-ready');
      }));
      if (autoOpen) {
        autoOpen = false;
        // The book arrives closed, then its cover swings open
        setTimeout(() => { if (pf === instance && current === 0) instance.flipNext(); }, reduceMotion ? 100 : 650);
      }
    });
    instance.on('flip', (e) => {
      current = e.data;
      if (!turned && current > 1) { turned = true; hideHint(); }
      sync();
    });
    instance.on('changeState', (e) => {
      const state = e.data;
      if (state === 'flipping' && lastState !== 'flipping') {
        playFlip(current === 0 || current >= book.total - 2);
        // Start sliding a closed book back to the middle as soon as it opens
        wrap.classList.remove('is-shift-front', 'is-shift-back');
      }
      if (state === 'read') sync();
      lastState = state;
    });
    instance.on('changeOrientation', updateBase);

    instance.loadFromHTML($$('.page', el));
  }

  /* ---------- 6. Keep the UI in step with the book ---------- */
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
    const thick = clamp(r.pageWidth * 0.008, 2, 5);
    const done = current / (book.total - 1);
    s.setProperty('--lt', `${(thick * done).toFixed(1)}px`);
    s.setProperty('--rt', `${(thick * (1 - done)).toFixed(1)}px`);
  }

  function sync() {
    if (!book) return;
    const last = book.total - 1;
    const single = layout && layout.single;
    ['front', 'back'].forEach((side) => {
      const closed = !single && current === (side === 'front' ? 0 : last);
      wrap.classList.toggle(`is-closed-${side}`, closed); // shadow + page edges
      wrap.classList.toggle(`is-shift-${side}`, closed); // centring slide
    });

    let label;
    if (current === 0) label = 'Cover';
    else if (current === last) label = 'Back cover';
    else if (single || current + 1 >= last) label = `${pad(current)} <span>/ ${pad(last - 1)}</span>`;
    else label = `${pad(current)}–${pad(current + 1)} <span>/ ${pad(last - 1)}</span>`;
    counter.innerHTML = label;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === last;
    progressFill.style.transform = `scaleX(${current / last})`;
    updateBase();
  }

  /* ---------- 7. Navigation ---------- */
  const next = () => pf && pf.flipNext(isTouch ? 'bottom' : 'top');
  const prev = () => pf && pf.flipPrev(isTouch ? 'bottom' : 'top');
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  $('#closeBtn').addEventListener('click', closeBook);

  // Buttons on the back covers
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || !book) return;
    const action = btn.dataset.action;
    if (action === 'close') closeBook();
    if (action === 'restart' && pf) pf.flip(0);
    if (action === 'next') {
      const nextBook = books[(books.indexOf(book) + 1) % books.length];
      try { history.replaceState(null, '', `#${nextBook.slug}`); } catch (err) { /* sandboxed */ }
      showReader(nextBook);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!reader.hidden) {
      const keys = {
        ArrowRight: next, ArrowDown: next, PageDown: next,
        ArrowLeft: prev, ArrowUp: prev, PageUp: prev,
        Home: () => pf && pf.flip(0),
        End: () => pf && pf.flip(book.total - 1),
        Escape: closeBook,
      };
      if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); goCard(active + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goCard(active - 1); }
  });

  /* ---------- 8. Resize ---------- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    if (!reader.hidden && layout) {
      const L = computeLayout();
      if (L.single === layout.single) wrap.style.width = `${L.W}px`; // StPageFlip re-fits itself right after this
      requestAnimationFrame(updateBase);
    }
    if (!shelf.hidden) { sizeCards(); updateCarousel(); }
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!shelf.hidden) { goCard(active, false); return; }
      if (!book) return;
      const L = computeLayout();
      const changed = !layout
        || L.single !== layout.single
        || (L.single && (Math.abs(L.ratio - layout.ratio) > 0.06 || L.W > 2 * Math.ceil(layout.builtW / 2)))
        || Math.abs(L.pageW - layout.pageW) / layout.pageW > 0.12;
      if (changed) build(L, current);
      else { layout = { ...layout, W: L.W, pageW: L.pageW, pageH: L.pageH }; updateBase(); }
    }, 200);
  });

  /* ---------- 9. Sound: a soft paper swish, synthesised (no audio files) ---------- */
  let audio = null;
  let soundOn = store.get('oo-sound') !== 'off';
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

  /* ---------- 10. Full screen ---------- */
  const root = document.documentElement;
  if (!(root.requestFullscreen || root.webkitRequestFullscreen)) fsBtn.hidden = true;
  fsBtn.addEventListener('click', () => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    const req = fsEl
      ? (document.exitFullscreen || document.webkitExitFullscreen).call(document)
      : (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    if (req && req.catch) req.catch(() => { /* not allowed here */ });
  });

  /* ---------- 11. Hint ---------- */
  hint.textContent = isTouch
    ? 'Swipe or tap the page edges to turn'
    : 'Click a page or drag its corner to turn  ·  ← → keys  ·  Esc to close';
  function hideHint() { hint.classList.add('is-hidden'); }
  hideHint();

  /* ---------- 12. Go ---------- */
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all(['800 1em', 'italic 100 1em']
      .map((f) => document.fonts.load(`${f} "Tomato Grotesk"`))).catch(() => {})
    : Promise.resolve();
  if (window.ResizeObserver) new ResizeObserver(() => { if (!shelf.hidden) { sizeCards(); updateCarousel(); } }).observe(carousel);
  fontsReady.then(() => {
    sizeCards();
    setActive(0);
    route();
  });
})();
