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
  const base = $('.book-base', wrap);
  const counter = $('#counter');
  const progressFill = $('#progressFill');
  const readerTitle = $('#readerTitle');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const soundBtn = $('#soundBtn');
  const fsBtn = $('#fsBtn');
  const hint = $('#hint');

  /* ---------- 0. Projects added with the Studio (projects/projects.js) ----------
     Each project is a list of Figma frames. Every frame becomes a two-page spread:
     the left half on the left page, the right half on the right page. */
  const params = new URLSearchParams(location.search);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const assetUrl = (u) => esc(/^(blob:|data:|https?:)/.test(u) ? u : String(u || '').replace(/^\/+/, ''));

  function projectBook(p, number) {
    const style = ['dark', 'light', 'image'].includes(p.coverStyle) ? p.coverStyle : 'dark';
    const light = style === 'light';
    const coverImg = p.cover; // without a cover image the cover is set in type only
    const kicker = `${number} — ${(p.discipline || '').replace(/\s*·\s*/g, ', ')}`;
    const longest = Math.max(1, ...String(p.title).split(/\s+/).map((w) => w.length));
    const titleScale = Math.min(1, 7.5 / longest).toFixed(3); // long words get a smaller title
    const coverClass = light ? 'page page--cover page--board' : 'page page--dark page--cover';
    const imgClass = { dark: 'cover__img', light: 'cover__img cover__img--drawing', image: 'cover__img cover__img--full' }[style];
    const frames = p.frames.map((src, k) => ['l', 'r'].map((side) => `
      <div class="page page--frame" data-bare>
        <div class="page__inner page__inner--frame">
          <img class="frame frame--${side}" src="${assetUrl(src)}" alt="${side === 'l' ? `${esc(p.title)}, frame ${k + 1}` : ''}" draggable="false">
        </div>
      </div>`).join('')).join('');
    return `
      <article class="book-src" data-slug="${esc(p.slug)}" data-number="${number}" data-title="${esc(p.title)}" data-meta="${esc(p.discipline)}">
        <div class="${coverClass}${style === 'image' ? ' page--cover-image' : ''}" data-density="soft">
          <div class="page__inner cover">
            ${coverImg ? `<img class="${imgClass}" src="${assetUrl(coverImg)}" alt="" draggable="false">` : ''}
            <div class="cover__top"><span>Obinna Oti</span><span>2020—2025</span></div>
            <div class="cover__foot">
              <p class="cover__kicker">${esc(kicker)}</p>
              <h2 class="cover__title" style="font-size: calc(var(--fit) * ${titleScale} * 15cqw)">${esc(p.title)}</h2>
            </div>
            <p class="cover__issue">Issue 01</p>
          </div>
        </div>
        ${frames}
        <div class="${coverClass}" data-density="soft">
          <div class="page__inner backcover">
            <p class="backcover__mark">${esc(p.title)}</p>
            <p class="backcover__sub">Obinna Oti — Product Design</p>
            <div class="backcover__actions">
              <button class="pill" type="button" data-action="next">Next project</button>
              <button class="pill" type="button" data-action="restart">Read again</button>
              <button class="pill" type="button" data-action="close">All projects</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  (function addStudioProjects() {
    let list = Array.isArray(window.PROJECTS) ? window.PROJECTS.slice() : [];
    if (!params.has('drafts')) list = list.filter((p) => p && !p.draft);
    if (params.has('preview')) { // a project being prepared in the Studio
      try {
        const draft = JSON.parse(sessionStorage.getItem('oo-preview'));
        if (draft) list = list.filter((p) => p.slug !== draft.slug).concat(draft);
      } catch (e) { /* no preview */ }
    }
    const library = $('#library');
    const builtIn = $$('.book-src', library).length;
    list.filter((p) => p && p.slug && p.title && Array.isArray(p.frames) && p.frames.length)
      .forEach((p, i) => library.insertAdjacentHTML('beforeend', projectBook(p, pad(builtIn + i + 1))));
  }());

  /* ---------- 1. Read the books ---------- */
  const books = $$('.book-src').map((src) => {
    const pages = $$(':scope > .page', src);
    const total = pages.length;
    pages.forEach((page, i) => {
      page.dataset.index = i;
      // With the cover shown alone, odd pages sit on the left of a spread
      page.classList.add(i % 2 ? 'page--l' : 'page--r');
      const inner = $('.page__inner', page);
      if (i > 0 && i < total - 1 && inner && !page.hasAttribute('data-bare')) {
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

  /* ---------- 2. Carousel: the books drift slowly across in an endless loop ---------- */
  const n = books.length;
  const capNum = $('#capNum');
  const capTitle = $('#capTitle');
  const capMeta = $('#capMeta');
  const capPager = $('#capPager');
  const caption = $('.shelf__caption');
  let cards = []; // the books, repeated enough times to fill the width
  let cw = 300; // card width
  let step = 360; // card width + gap
  let setW = 720; // width of one full run of books
  let offset = 0; // how far the strip has travelled (px)
  let vel = 0; // current speed (px/s)
  let active = -1; // book named in the caption
  let hoverBook = -1; // book under the mouse (pauses the drift)
  let held = false; // keyboard focus is on the caption controls (pauses the drift)
  let pauseUntil = 0; // a short pause after the arrows or the wheel are used
  let glide = null; // eased move to a given offset (arrow buttons)
  let drag = null; // pointer drag in progress
  let suppressClick = false;
  let raf = 0;
  let lastT = 0;
  let lastW = 0; // carousel width at the last layout

  const cruise = () => (reduceMotion ? 0 : step / 11); // one book passes the centre about every 11 s
  const stripX = () => -(((offset % setW) + setW) % setW); // always in (-setW, 0]

  function renderCards(sets) {
    track.innerHTML = Array.from({ length: sets * n }, (_, k) => `
      <div class="card" data-book="${k % n}">
        <span class="card__btn"><span class="card__cover">${books[k % n].cover}</span></span>
      </div>`).join('');
    cards = $$('.card', track).map((el) => ({ el, cover: $('.card__cover', el), book: Number(el.dataset.book) }));
  }

  function sizeCards() {
    const h = carousel.clientHeight - 48;
    const w = carousel.clientWidth;
    if (!w || !h) return;
    // which point of the strip sits in the centre now, measured in books
    const centre = cards.length && lastW ? (lastW / 2 - cw / 2 - stripX()) / step : null;
    cw = Math.max(140, Math.min(h * 0.889, w * (w < 600 ? 0.62 : 0.34), 560));
    const gap = Math.round(clamp(cw * 0.2, 24, 88));
    step = cw + gap;
    setW = n * step;
    lastW = w;
    if (centre !== null) { // keep that same point in the centre at the new size
      let x = w / 2 - cw / 2 - centre * step;
      while (x > 0) x -= setW;
      while (x <= -setW) x += setW;
      offset = -x;
    }
    track.style.setProperty('--cw', `${cw}px`);
    track.style.setProperty('--gap', `${gap}px`);
    const sets = Math.max(2, Math.ceil(w / setW) + 2);
    if (cards.length !== sets * n) renderCards(sets);
    cards.forEach((c) => c.cover.style.setProperty('--s', (cw / 800).toFixed(4)));
    paint();
  }

  // Position the strip, scale books by their distance from the centre, update the caption
  function paint() {
    const W = carousel.clientWidth;
    const x = stripX();
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    let best = 0;
    let bestD = Infinity;
    cards.forEach((c, k) => {
      const d = Math.abs(x + k * step + cw / 2 - W / 2) / step;
      c.el.style.transform = `scale(${(1 - 0.14 * Math.min(d, 1)).toFixed(4)})`;
      c.el.style.opacity = (1 - 0.3 * Math.min(d, 1)).toFixed(3);
      if (d < bestD) { bestD = d; best = c.book; }
    });
    const show = hoverBook >= 0 ? hoverBook : best;
    if (show !== active) setActive(show);
  }

  function setActive(i) {
    const first = active < 0;
    active = i;
    const b = books[i];
    capNum.textContent = b.number;
    capTitle.textContent = b.title;
    capMeta.textContent = b.meta;
    capPager.innerHTML = `${pad(i + 1)} <span>/ ${pad(n)}</span>`;
    if (!first && !reduceMotion && capTitle.animate) {
      [capNum, capTitle, capMeta].forEach((el, k) => el.animate(
        [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, delay: k * 40, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'backwards' },
      ));
    }
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;
    if (glide) {
      const p = Math.min(1, (t - glide.t0) / glide.dur);
      offset = glide.from + (glide.to - glide.from) * (1 - Math.pow(1 - p, 3));
      if (p >= 1) { glide = null; vel = 0; }
    } else if (!drag) {
      const target = hoverBook >= 0 || held || t < pauseUntil ? 0 : cruise();
      vel += (target - vel) * (1 - Math.exp(-dt * (target ? 1.5 : 6))); // glide into the drift, settle quickly on hover
      if (!target && Math.abs(vel) < 0.5) vel = 0;
      offset += vel * dt;
    }
    paint();
  }
  function startDrift() { if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); } }
  function stopDrift() { cancelAnimationFrame(raf); raf = 0; }

  // Bring the next (dir 1) or previous (dir -1) book to the centre; dir 0 centres the nearest
  function stepBy(dir) {
    const W = carousel.clientWidth;
    const x = stripX();
    const k = Math.round((W / 2 - cw / 2 - x) / step);
    const target = x + (k + dir) * step + cw / 2;
    const now = performance.now();
    glide = { from: offset, to: offset + target - W / 2, t0: now, dur: reduceMotion ? 1 : 750 };
    pauseUntil = now + 3500;
  }

  // Jump (no animation) so that a given book sits in the centre
  function centreBook(i) {
    const W = carousel.clientWidth;
    let x = W / 2 - cw / 2 - i * step;
    while (x > 0) x -= setW;
    while (x <= -setW) x += setW;
    offset = -x;
    vel = 0;
    paint();
  }

  // Mouse over a book pauses the drift
  track.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || drag) return;
    const c = e.target.closest('.card');
    hoverBook = c ? Number(c.dataset.book) : -1;
  });
  carousel.addEventListener('pointerleave', () => { hoverBook = -1; });

  // Drag or swipe the strip; a quick fling carries on and eases back into the drift
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    glide = null;
    drag = { id: e.pointerId, x: e.clientX, offset, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      carousel.classList.add('is-dragging');
      try { track.setPointerCapture(e.pointerId); } catch (err) { /* not needed */ }
    }
    if (!drag.moved) return;
    offset = drag.offset - dx;
    const now = performance.now();
    drag.v = 0.75 * drag.v + 0.25 * ((drag.lastX - e.clientX) / Math.max(1, now - drag.lastT)) * 1000;
    drag.lastX = e.clientX;
    drag.lastT = now;
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved) {
      vel = clamp(drag.v, -2500, 2500);
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      carousel.classList.remove('is-dragging');
    }
    drag = null;
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Mouse wheel or trackpad scrubs the strip
  // Sideways trackpad swipes (or Shift + wheel) scrub the strip; vertical scrolling moves the page
  carousel.addEventListener('wheel', (e) => {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    e.preventDefault();
    glide = null;
    vel = 0;
    offset += dx;
    pauseUntil = performance.now() + 1200;
  }, { passive: false });

  // Only drift while the carousel is on screen
  let carouselInView = true;
  if (window.IntersectionObserver) {
    new IntersectionObserver(([entry]) => {
      carouselInView = entry.isIntersecting;
      if (carouselInView && !shelf.hidden) startDrift();
      else stopDrift();
    }).observe(carousel);
  }

  // Clicking any book opens it
  track.addEventListener('click', (e) => {
    if (suppressClick) return;
    const c = e.target.closest('.card');
    if (c) openBook(books[Number(c.dataset.book)].slug);
  });

  // Keyboard users: hold the drift while they're on the caption controls
  caption.addEventListener('focusin', (e) => { held = e.target.matches(':focus-visible'); });
  caption.addEventListener('focusout', () => { held = false; });
  $('#carPrev').addEventListener('click', () => stepBy(-1));
  $('#carNext').addEventListener('click', () => stepBy(1));
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
  let shelfShown = false;
  let shelfScroll = 0; // where the landing was scrolled to when a book opened
  function route() {
    const b = books.find((x) => x.slug === location.hash.slice(1));
    if (b) showReader(b);
    else if (!shelfShown) showShelf();
  }
  window.addEventListener('hashchange', route);

  function showShelf() {
    const from = book;
    destroyBook();
    book = null;
    reader.hidden = true;
    shelf.hidden = false;
    document.title = 'Obinna Oti — Product Design Portfolio';
    shelfShown = true;
    document.body.classList.add('is-shelf');
    held = false;
    hoverBook = -1;
    sizeCards();
    centreBook(from ? books.indexOf(from) : 0);
    if (from) window.scrollTo(0, shelfScroll);
    if (carouselInView) startDrift();
  }

  function showReader(b) {
    if (book === b && pf) return;
    book = b;
    stopDrift();
    reels.forEach((v) => v.pause());
    if (shelfShown) shelfScroll = window.scrollY;
    shelfShown = false;
    document.body.classList.remove('is-shelf');
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
    // With showCover, StPageFlip turns a lone first and last page (the covers) into hard boards.
    // Give every page back the density its markup asks for, so the covers peel like paper.
    instance.getPageCollection().getPages().forEach((page) => {
      const density = page.getElement().dataset.density === 'hard' ? 'hard' : 'soft';
      page.setDensity(density);
      page.setDrawingDensity(density);
    });
    // Turning onto a cover there is no page to uncover beside it: StPageFlip uses the cover as both the
    // turning sheet and the page underneath, so the page being lifted stayed whole under the turn.
    // Cut the turned-away part out of that page instead, so the desk shows through as the book closes.
    const render = instance.getRender();
    const drawFrame = render.drawFrame;
    render.drawFrame = function () {
      drawFrame.call(this);
      const sheet = this.flippingPage;
      if (!sheet || sheet !== this.bottomPage || sheet.getDrawingDensity() !== 'soft' || this.getOrientation() !== 'landscape') return;
      const back = this.getDirection() === 1;
      const lifted = back ? this.leftPage : this.rightPage;
      const calc = instance.getFlipController().calc;
      if (!lifted || !calc) return;
      const rect = this.getRect();
      const left = rect.left + (back ? 0 : rect.pageWidth);
      const w = rect.pageWidth;
      const h = rect.height;
      const hole = calc.getBottomClipArea().filter(Boolean)
        .map((point) => this.convertToGlobal(point))
        .map((g) => `${(g.x - left).toFixed(1)}px ${(g.y - rect.top).toFixed(1)}px`);
      if (hole.length < 3) return;
      const clip = `polygon(evenodd, 0 0, ${w}px 0, ${w}px ${h}px, 0 ${h}px, 0 0, ${hole.join(', ')}, ${hole[0]})`;
      const style = lifted.getElement().style;
      style.clipPath = clip;
      style.webkitClipPath = clip;
      if (this.outerShadow) this.outerShadow.style.display = 'none'; // it would fall on the empty desk
      // and the shadow under the book shrinks with the turn, rather than outlining an empty page
      const lift = w * Math.min(1, calc.getFlippingProgress() / 100);
      base.style.transition = 'none';
      base.style.left = `${rect.left + (back ? lift : 0)}px`;
      base.style.width = `${rect.width - lift}px`;
    };
    toneFrames(el);
  }

  // Frame pages fill any space above and below the frame with the colour of its top and bottom edges
  const tones = new Map();
  function frameTone(img, side) {
    try {
      const N = 64;
      const c = document.createElement('canvas');
      c.width = N; c.height = N;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, N, N);
      // the median colour along the top and bottom rows of this page's half of the frame,
      // so artwork touching a corner doesn't tint it
      const x0 = side === 'r' ? N / 2 : 0;
      const row = (y) => {
        const d = ctx.getImageData(x0, y, N / 2, 1).data;
        const mid = (ch) => Array.from({ length: N / 2 }, (_, x) => d[x * 4 + ch]).sort((a, b) => a - b)[N >> 2];
        return `rgb(${mid(0)},${mid(1)},${mid(2)})`;
      };
      return { top: row(0), bottom: row(N - 1) };
    } catch (e) { return null; }
  }
  function toneFrames(root) {
    $$('img.frame', root).forEach((img) => {
      const side = img.classList.contains('frame--r') ? 'r' : 'l';
      const key = `${img.src}#${side}`;
      const apply = () => {
        if (!tones.has(key)) tones.set(key, frameTone(img, side));
        const tone = tones.get(key);
        if (tone) {
          img.parentElement.style.setProperty('--tone-top', tone.top);
          img.parentElement.style.setProperty('--tone-bottom', tone.bottom);
        }
      };
      if (img.complete && img.naturalWidth) apply();
      else img.addEventListener('load', apply, { once: true });
    });
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
    base.style.removeProperty('transition'); // hand the shadow back to the stylesheet after a turn onto a cover
    base.style.removeProperty('left');
    base.style.removeProperty('width');
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
    if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1); }
  });

  /* ---------- 8. Resize ---------- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    if (!reader.hidden && layout) {
      const L = computeLayout();
      if (L.single === layout.single) wrap.style.width = `${L.W}px`; // StPageFlip re-fits itself right after this
      requestAnimationFrame(updateBase);
    }
    if (!shelf.hidden) sizeCards();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!shelf.hidden) return;
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

  /* ---------- 12. Motion: animation players under the carousel ---------- */
  // No control bar: the video loops on its own; clicking it (or its button) pauses and plays.
  const reels = [];
  $$('.reel').forEach((reel) => {
    const video = $('.reel__video', reel);
    const frame = $('.reel__frame', reel);
    const big = $('.reel__big', reel);
    if (!video) return;
    reels.push(video);

    let userPaused = false; // once a visitor pauses, scrolling doesn't restart it
    const play = () => { const r = video.play(); if (r && r.catch) r.catch(() => { /* blocked or interrupted */ }); };
    const togglePlay = () => {
      if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); }
    };
    const showState = () => {
      const playing = !video.paused;
      reel.classList.toggle('is-playing', playing);
      big.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    };
    ['play', 'pause'].forEach((ev) => video.addEventListener(ev, showState));
    big.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
    frame.addEventListener('click', togglePlay);

    // Plays on a loop while it's on screen, and pauses once it has scrolled away.
    // With reduced motion turned on, it waits for the play button instead.
    if (window.IntersectionObserver) {
      new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) { if (!video.paused) video.pause(); }
        else if (entry.intersectionRatio >= 0.2 && video.paused && !userPaused && !reduceMotion) play();
      }, { threshold: [0, 0.2] }).observe(frame);
    }
  });

  // The links in the top bar scroll to their section without changing the address.
  // One whose section isn't on the page yet shows as plain text until it is.
  $$('a[data-scroll]').forEach((link) => {
    if (!document.getElementById(link.dataset.scroll)) link.removeAttribute('href');
  });
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-scroll][href]');
    if (!link) return;
    const target = document.getElementById(link.dataset.scroll);
    if (!target) return;
    e.preventDefault();
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (getComputedStyle(target).position === 'sticky') {
      // a banner that sticks while you scroll (Clients): go to where it comes to rest, at the end of its run
      const end = target.parentElement.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: end - window.innerHeight, behavior });
    } else {
      target.scrollIntoView({ behavior, block: 'start' });
    }
  });

  /* ---------- 12b. Landing text rises into view as it scrolls in ---------- */
  function watchReveals() {
    const els = $$('.reveal');
    const done = (el) => { el.classList.remove('reveal', 'is-in'); el.style.removeProperty('--d'); };
    if (!window.IntersectionObserver || reduceMotion) { els.forEach(done); return; }
    const io = new IntersectionObserver((entries) => {
      // whatever arrives together comes in one after another
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        const el = e.target;
        io.unobserve(el);
        el.style.setProperty('--d', `${i * 90}ms`);
        el.addEventListener('animationend', function end(ev) {
          if (ev.target !== el) return;
          el.removeEventListener('animationend', end);
          done(el);
        });
        el.classList.add('is-in');
      });
    }, { threshold: 0.4 }); // a margin here would keep the footer, at the very bottom, from ever counting
    els.forEach((el) => io.observe(el));
  }

  /* ---------- 12c. Light / dark switch ---------- */
  // Follows the device until the visitor picks; the choice is remembered (and read before
  // first paint by the small script in <head>)
  const themeBtn = $('.bar__theme');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (document.documentElement.dataset.theme || (darkQuery.matches ? 'dark' : 'light')) === 'dark';
  function showTheme() {
    const dark = isDark();
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(dark));
      themeBtn.title = dark ? 'Light mode' : 'Dark mode';
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--desk').trim();
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('oo-theme', next); } catch (e) { /* storage blocked: still switches for this visit */ }
      showTheme();
    });
  }
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', showTheme);
  showTheme();

  /* ---------- 12d. Companies: the logo strip drifts along in an endless loop ---------- */
  const logos = $('.logos');
  const logoBelt = logos && $('.logos__belt', logos);
  function fillLogos() {
    if (!logoBelt || reduceMotion) return;
    const set = logoBelt.firstElementChild;
    const w = set.offsetWidth; // layout width, unaffected by the page's entrance animation
    if (!w) return;
    // enough copies to cover the screen while one copy's width slides off it
    const need = Math.ceil(logoBelt.parentElement.clientWidth / w) + 1;
    while (logoBelt.children.length < need) {
      const copy = set.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      logoBelt.appendChild(copy);
    }
    // the copies are identical, so sliding by 1/copies of the belt moves exactly one copy
    logoBelt.style.setProperty('--copies', logoBelt.children.length);
    logoBelt.style.setProperty('--dur', `${(w / 40).toFixed(1)}s`); // 40px a second, however many logos
  }
  function startLogos() {
    if (!logoBelt || reduceMotion) return;
    logos.classList.add('is-moving'); // the row stops wrapping, so measure after this
    fillLogos();
    $$('img', logoBelt.firstElementChild).forEach((img) => img.addEventListener('load', fillLogos));
    if (window.ResizeObserver) new ResizeObserver(fillLogos).observe(logos);
  }

  /* ---------- 12e. Auto-scroll: the page drifts slowly down on its own ---------- */
  // It starts a few seconds after the page opens. Any wheel, swipe, key or click hands control back to
  // the visitor, and it picks up again once they've been idle for a while. It stops at the bottom, and
  // never runs while a book is open or with reduced motion turned on.
  const DRIFT_SPEED = 20; // px a second
  const DRIFT_START = 4000; // ms after the page opens
  const DRIFT_RESUME = 8000; // ms after the visitor last did something
  let driftAt = performance.now() + DRIFT_START;
  let driftCarry = 0; // whole pixels only, so fractions add up between frames
  let driftLast = 0;
  function drift(now) {
    const dt = driftLast ? Math.min(now - driftLast, 100) : 0;
    driftLast = now;
    if (now >= driftAt && !shelf.hidden && document.body.classList.contains('is-shelf')) {
      const bottom = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY < bottom - 1) {
        driftCarry += DRIFT_SPEED * dt / 1000;
        const step = Math.floor(driftCarry);
        if (step) { driftCarry -= step; window.scrollBy(0, step); }
      }
    }
    requestAnimationFrame(drift);
  }
  if (!reduceMotion) {
    const holdDrift = () => { driftAt = performance.now() + DRIFT_RESUME; driftCarry = 0; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) => window.addEventListener(type, holdDrift, { passive: true }));
    requestAnimationFrame(drift);
  }

  /* ---------- 13. Go ---------- */
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([
      ...['800 1em', '100 1em'].map((f) => document.fonts.load(`${f} "Tomato Grotesk"`)),
      document.fonts.load('400 1em "Tomato Grotesk Text"'), // measured before laying out the books
    ]).catch(() => {})
    : Promise.resolve();
  if (window.ResizeObserver) new ResizeObserver(() => { if (!shelf.hidden) sizeCards(); }).observe(carousel);
  fontsReady.then(() => {
    route();
    watchReveals(); // after the fonts, so text doesn't rise in a fallback face
    startLogos(); // measured in the real face too
  });
})();
