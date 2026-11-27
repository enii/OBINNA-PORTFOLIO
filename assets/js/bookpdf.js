/* Book PDFs
 * Makes a PDF of a flip book in the browser, when someone asks for one (the Download PDF buttons in
 * main.js), from the same images the book shows:
 *   the front cover · each Figma frame as one landscape page · the back cover.
 * There are no PDF files to keep up to date: a book has a PDF as soon as it has frames, and the PDF
 * changes when its frames do. The covers are drawn here to match the site's (style.css, "Covers"),
 * as the book shows them with its text off (book-text-off); the back cover's buttons become one,
 * the site's address, which opens the site from the PDF.
 *
 *   window.bookPDF(project, onProgress)  →  a Promise of the PDF (a Blob)
 *   project     a book from projects/books.js or projects/projects.js
 *   onProgress  called with (pages done, pages in all) as it goes
 */
(function () {
  'use strict';

  const PAGE_W = 960;          // a frame's page is 960 pt wide (13.3 in, a 16:9 slide); its height follows the frame
  const COVER = [480, 540];    // a cover is one page of the book: half a spread, 8:9 (main.js, SPREAD_RATIO)
  const PX = 4;                // pixels per point on the covers (1920 × 2160): as sharp as the frames
  const QUALITY = 0.9;         // JPEG quality of every page
  const FONT = '"Tomato Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif';
  const SITE = 'obinnaoti.com';

  /* ---------- Images ---------- */
  function load(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = new URL(src, location.href);
      if (/^https?:$/.test(url.protocol) && url.origin !== location.origin) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Couldn't load ${src}`));
      img.src = url.href;
    });
  }

  const jpeg = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Couldn\'t make a JPEG'))), 'image/jpeg', QUALITY);
  });

  // object-fit: cover / contain, with object-position, clipped to its box
  function drawFit(ctx, img, box, fit, pos) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = fit === 'contain' ? Math.min(box.w / iw, box.h / ih) : Math.max(box.w / iw, box.h / ih);
    const w = iw * s, h = ih * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    ctx.drawImage(img, box.x + (box.w - w) * pos[0], box.y + (box.h - h) * pos[1], w, h);
    ctx.restore();
  }

  /* ---------- Type ---------- */
  // Text with CSS letter-spacing (px), from the left edge, the right edge or the middle; returns its width
  function spaced(ctx, text, x, y, spacing, align) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const native = 'letterSpacing' in ctx;
    const chars = Array.from(text);
    let width;
    if (native) {
      ctx.letterSpacing = `${spacing}px`;
      width = ctx.measureText(text).width;
    } else {
      width = chars.reduce((w, ch) => w + ctx.measureText(ch).width + spacing, 0);
    }
    let cx = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x;
    if (native) {
      ctx.fillText(text, cx, y);
      ctx.letterSpacing = '0px';
    } else {
      chars.forEach((ch) => { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; });
    }
    return width;
  }

  // Where the baseline falls in a CSS line box of this height, for the current font
  function baseline(ctx, top, lineHeight) {
    const m = ctx.measureText('Hg');
    const a = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
    const d = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
    return top + (lineHeight - (a + d)) / 2 + a;
  }

  function wrap(ctx, text, maxWidth, spacing) {
    const lines = [];
    String(text).split(/\s+/).filter(Boolean).forEach((word) => {
      const last = lines[lines.length - 1];
      const tryLine = last ? `${last} ${word}` : word;
      if (last && ctx.measureText(tryLine).width + spacing * tryLine.length > maxWidth) lines.push(word);
      else if (last) lines[lines.length - 1] = tryLine;
      else lines.push(word);
    });
    return lines;
  }

  /* ---------- The covers, as style.css draws them ---------- */
  function looks(p) {
    const style = ['dark', 'light', 'image'].includes(p.coverStyle) ? p.coverStyle : 'dark';
    const light = style === 'light';
    return {
      style,
      light,
      paper: light ? (/\bpage--tangerine\b/.test(p.pageClass || '') ? '#f9f7f7' : '#fff') : null,
      ink: light ? '#0d0d0d' : '#f1f1f1',
    };
  }

  function paper(ctx, W, H, look) {
    if (look.light) {
      ctx.fillStyle = look.paper;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    // radial-gradient(130% 100% at 15% 0%, #1e1e1e 0%, #0b0b0b 55%, #050505 100%)
    const rx = 1.3 * W, ry = H;
    ctx.save();
    ctx.translate(0.15 * W, 0);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, '#1e1e1e');
    g.addColorStop(0.55, '#0b0b0b');
    g.addColorStop(1, '#050505');
    ctx.fillStyle = g;
    ctx.fillRect(-0.15 * W, 0, W, H * (rx / ry));
    ctx.restore();
  }

  // the hinge groove of a hardback: by the spine, on the left of the front cover and the right of the back
  function hinge(ctx, W, H, look, right) {
    const w = 0.013 * W;
    const x = right ? W - 0.034 * W - w : 0.034 * W;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    const stops = look.light
      ? ['rgba(0, 0, 0, .14)', 'rgba(255, 255, 255, .7)', 'rgba(0, 0, 0, .08)']
      : ['rgba(0, 0, 0, .55)', 'rgba(255, 255, 255, .07)', 'rgba(0, 0, 0, .35)'];
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.55, stops[1]);
    g.addColorStop(1, stops[2]);
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, H);
  }

  // .cover__img and the classes that change it, in the order style.css gives them
  function coverBox(p, look) {
    const cls = String(p.coverClass || '').split(/\s+/);
    let b = { x: 0, y: 0.14, w: 1, h: 0.52, fit: 'cover', pos: [0.9, 0.5], blend: 'lighten' };
    if (look.light) b = { x: 0.13, y: 0.11, w: 0.82, h: 0.58, fit: 'contain', pos: [0.5, 0.5], blend: 'multiply' };
    if (cls.includes('cover__img--photo')) b = { x: 0, y: 0, w: 1, h: 1, fit: 'cover', pos: [0.5, 0.5], blend: 'source-over' };
    if (cls.includes('cover__img--centred')) b.pos = [0.5, 0.53];
    if (look.style === 'image') Object.assign(b, { y: 0, h: 1, pos: [0.5, 0.5], blend: 'source-over' });
    return b;
  }

  async function frontCover(canvas, p) {
    const W = COVER[0] * PX, H = COVER[1] * PX, cqw = W / 100;
    const look = looks(p);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    paper(ctx, W, H, look);
    if (p.cover) {
      const img = await load(p.cover);
      const b = coverBox(p, look);
      ctx.globalCompositeOperation = b.blend;
      drawFit(ctx, img, { x: b.x * W, y: b.y * H, w: b.w * W, h: b.h * H }, b.fit, b.pos);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (look.style === 'image') { // the photo darkens towards the foot, under the title
      const g = ctx.createLinearGradient(0, 0.35 * H, 0, H);
      g.addColorStop(0, 'rgba(0, 0, 0, 0)');
      g.addColorStop(1, 'rgba(0, 0, 0, .7)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0.35 * H, W, 0.65 * H);
    }
    const ink = look.style === 'image' ? '#fff' : look.ink;
    ctx.fillStyle = ink;

    // the title, at the foot of the cover: a hand-set one keeps its lines, a Studio one wraps and shrinks
    const left = 10 * cqw, right = 7.5 * cqw, foot = H - 7 * cqw;
    let size = 15 * cqw, lines;
    if (p.coverTitle) lines = String(p.coverTitle).split('\n');
    else {
      const longest = Math.max(1, ...String(p.title).split(/\s+/).map((w) => w.length));
      size *= Math.min(1, 7.5 / longest);
    }
    ctx.font = `800 ${size}px ${FONT}`;
    if (!lines) lines = wrap(ctx, p.title, W - left - right, -0.04 * size);
    const lh = 0.84 * size;
    const top = foot - lines.length * lh;
    lines.forEach((line, i) => spaced(ctx, line, left, baseline(ctx, top + i * lh, lh), -0.04 * size, 'left'));

    // "Issue 01", bottom right, level with the foot of the title
    const issue = 2.3 * cqw;
    ctx.font = `200 ${issue}px ${FONT}`;
    spaced(ctx, 'ISSUE 01', W - right, baseline(ctx, foot - issue, issue), 0.14 * issue, 'right');

    hinge(ctx, W, H, look, false);
    return { w: COVER[0], h: COVER[1], jpeg: await jpeg(canvas) };
  }

  async function backCover(canvas, p) {
    const W = COVER[0] * PX, H = COVER[1] * PX, cqw = W / 100;
    const look = looks(p);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    paper(ctx, W, H, look);
    ctx.fillStyle = look.ink;

    const mark = p.backTitle || (p.coverTitle ? String(p.coverTitle).replace(/\n/g, ' ') : p.title);
    const size = 6.2 * cqw;
    const small = 1.55 * cqw; // the pills' type
    const pillH = 3.1 * small;
    const gap = 1.6 * size;
    const top = (H - (size + gap + pillH)) / 2;
    ctx.font = `800 ${size}px ${FONT}`;
    spaced(ctx, String(mark), W / 2, baseline(ctx, top, size), -0.025 * size, 'center');

    // one pill, as the back cover's buttons are drawn: the site's address
    ctx.font = `800 ${small}px ${FONT}`;
    const label = SITE.toUpperCase();
    const tw = 'letterSpacing' in ctx
      ? (ctx.letterSpacing = `${0.08 * small}px`, ctx.measureText(label).width)
      : Array.from(label).reduce((w, ch) => w + ctx.measureText(ch).width + 0.08 * small, 0);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    const pillW = Math.max(15 * small, tw + 3.8 * small);
    const px = (W - pillW) / 2, py = top + size + gap;
    ctx.strokeStyle = 'rgba(128, 128, 128, .45)';
    ctx.lineWidth = 0.75 * PX;
    ctx.beginPath();
    const r = pillH / 2;
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + pillW, py, px + pillW, py + pillH, r);
    ctx.arcTo(px + pillW, py + pillH, px, py + pillH, r);
    ctx.arcTo(px, py + pillH, px, py, r);
    ctx.arcTo(px, py, px + pillW, py, r);
    ctx.closePath();
    ctx.stroke();
    spaced(ctx, label, W / 2, baseline(ctx, py + 1.1 * small, small), 0.08 * small, 'center');

    hinge(ctx, W, H, look, true);
    // the pill opens the site: its rectangle in PDF points, from the bottom left
    const link = { uri: `https://${SITE}`, rect: [px / PX, (H - py - pillH) / PX, (px + pillW) / PX, (H - py) / PX] };
    return { w: COVER[0], h: COVER[1], jpeg: await jpeg(canvas), links: [link] };
  }

  async function framePage(canvas, src) {
    const img = await load(src);
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // a frame with see-through parts sits on white, as in the book
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return { w: PAGE_W, h: PAGE_W * img.naturalHeight / img.naturalWidth, jpeg: await jpeg(canvas) };
  }

  /* ---------- The PDF itself: one JPEG per page ---------- */
  const num = (v) => String(Math.round(v * 100) / 100);
  const text16 = (s) => `<FEFF${Array.from(String(s)).map((ch) => {
    const c = ch.codePointAt(0);
    if (c < 0x10000) return c.toString(16).padStart(4, '0');
    const v = c - 0x10000;
    return (0xd800 + (v >> 10)).toString(16) + (0xdc00 + (v & 0x3ff)).toString(16);
  }).join('').toUpperCase()}>`;

  function writePDF(pages, title) {
    const parts = [];
    const offsets = [];
    let size = 0;
    const put = (x) => {
      parts.push(x);
      size += typeof x === 'string' ? x.length : (x.byteLength !== undefined ? x.byteLength : x.size);
    };
    const begin = (id) => { offsets[id] = size; put(`${id} 0 obj\n`); };

    let n = 3; // 1 catalogue, 2 page list, 3 document info
    const ids = pages.map((pg) => ({
      page: ++n,
      content: ++n,
      image: ++n,
      links: (pg.links || []).map(() => ++n),
    }));

    put('%PDF-1.4\n');
    put(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // marks the file as binary
    begin(1); put('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    begin(2); put(`<< /Type /Pages /Kids [${ids.map((i) => `${i.page} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`);
    const d = new Date();
    const two = (v) => String(v).padStart(2, '0');
    const date = `D:${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
    begin(3); put(`<< /Title ${text16(title)} /Author (Obinna Oti) /Creator (${SITE}) /CreationDate (${date}) >>\nendobj\n`);

    pages.forEach((pg, k) => {
      const id = ids[k];
      const annots = id.links.length ? ` /Annots [${id.links.map((l) => `${l} 0 R`).join(' ')}]` : '';
      begin(id.page);
      put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(pg.w)} ${num(pg.h)}] /Resources << /XObject << /Im ${id.image} 0 R >> >> /Contents ${id.content} 0 R${annots} >>\nendobj\n`);
      const draw = `q ${num(pg.w)} 0 0 ${num(pg.h)} 0 0 cm /Im Do Q`;
      begin(id.content);
      put(`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream\nendobj\n`);
      begin(id.image);
      put(`<< /Type /XObject /Subtype /Image /Width ${pg.px[0]} /Height ${pg.px[1]} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.size} >>\nstream\n`);
      put(pg.jpeg);
      put('\nendstream\nendobj\n');
      (pg.links || []).forEach((l, j) => {
        begin(id.links[j]);
        put(`<< /Type /Annot /Subtype /Link /Rect [${l.rect.map(num).join(' ')}] /Border [0 0 0] /A << /S /URI /URI (${l.uri}) >> >>\nendobj\n`);
      });
    });

    const xref = size;
    let table = `xref\n0 ${n + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= n; i++) table += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    put(table);
    put(`trailer\n<< /Size ${n + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: 'application/pdf' });
  }

  /* ---------- A book's PDF ---------- */
  window.bookPDF = async function (p, onProgress) {
    const frames = (p.frames || []).map((f) => (typeof f === 'string' ? f : f.src)).filter(Boolean);
    const total = frames.length + 2;
    const progress = (done) => { if (onProgress) onProgress(done, total); };
    const pause = () => new Promise((resolve) => setTimeout(resolve, 0)); // let the page breathe between pages
    if (document.fonts && document.fonts.load) {
      await Promise.all([`800 40px ${FONT}`, `200 40px ${FONT}`].map((f) => document.fonts.load(f).catch(() => {})));
    }
    const canvas = document.createElement('canvas');
    const pages = [];
    const add = (pg) => {
      pg.px = [canvas.width, canvas.height];
      pages.push(pg);
      progress(pages.length);
      return pause();
    };
    progress(0);
    try {
      await add(await frontCover(canvas, p));
      for (const src of frames) await add(await framePage(canvas, src));
      await add(await backCover(canvas, p));
    } finally {
      canvas.width = 0; // let the browser have its memory back
      canvas.height = 0;
    }
    return writePDF(pages, `${p.title} — Obinna Oti`);
  };
})();
