/* Studio: add, edit, reorder and publish portfolio projects.
 *
 * Projects live in projects/projects.js (a JSON list) with their images in projects/<slug>/.
 * Publishing writes everything to the website's GitHub repository in a single commit through
 * the GitHub API, using a fine-grained access token that stays in this browser. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');

  const LIST_FILE = 'projects/projects.js';
  const FRAME_MAX = 3200; // px wide: crisp on large screens, light enough for the web
  const COVER_MAX = 1600;
  const QUALITY = 0.86;
  const FILE_HEAD = `/* Projects added with the Studio (studio.html).
 *
 * The Studio writes this file for you. To edit it by hand, keep the first and last
 * lines as they are; everything between the brackets is plain JSON. Projects appear
 * in the carousel in this order, after the two hand-built books in index.html.
 *
 *   slug        short name used in the link (…/#my-project) and the image folder
 *   title       shown on the cover and in the carousel
 *   discipline  e.g. "Product design · Footwear"
 *   coverStyle  "dark" (renders on black), "light" (drawings on white) or "image" (photo fills the cover)
 *   cover       cover image (optional: without one the cover is set in type only)
 *   frames      Figma frames in reading order; each one fills a two-page spread
 *   draft       true hides the project (preview it at …/?drafts)
 */
window.PROJECTS = `;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* private mode */ } },
  };

  /* ---------- State ---------- */
  let conn = null; // { token, repo, branch }
  let projects = Array.isArray(window.PROJECTS) ? window.PROJECTS.slice() : [];
  let builtIns = []; // the hand-built books in index.html
  let listDirty = false;
  let model = null; // the project in the editor
  let busy = false;

  /* ---------- Helpers ---------- */
  const slugify = (t) => String(t).normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  const rand = () => Math.random().toString(36).slice(2, 8);
  const branchPath = () => conn.branch.split('/').map(encodeURIComponent).join('/'); // branch names may contain "/"
  const b64ToUtf8 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
  const blobToB64 = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  const parseList = (text) => {
    const i = text.indexOf('[');
    const j = text.lastIndexOf(']');
    if (i < 0 || j < i) return [];
    return JSON.parse(text.slice(i, j + 1));
  };
  const serialize = (list) => `${FILE_HEAD}${JSON.stringify(list, null, 2)};\n`;
  const imgSrc = (path) => {
    if (!path || /^(blob:|data:|https?:)/.test(path)) return path;
    const clean = path.replace(/^\/+/, '');
    return conn ? `https://raw.githubusercontent.com/${conn.repo}/${branchPath()}/${clean}` : clean;
  };
  const icon = (d) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const ICON_UP = icon('M8 13V3M4 7l4-4 4 4');
  const ICON_DOWN = icon('M8 3v10M4 9l4 4 4-4');
  const ICON_LEFT = icon('M13 8H3m4-4L3 8l4 4');
  const ICON_RIGHT = icon('M3 8h10M9 4l4 4-4 4');

  function friendly(err) {
    if (!navigator.onLine) return 'You seem to be offline. Check your connection and try again.';
    switch (err && err.status) {
      case 401: return 'GitHub didn’t accept the token. Check it was copied in full and hasn’t expired.';
      case 403: return 'The token can’t write to this repository. Give it Contents: Read and write access.';
      case 404: return 'Couldn’t find that repository or branch. Check the names, and that the token has access to the repository.';
      case 409: case 422: return 'The site changed on GitHub while you were working. Try again.';
      default: return err && err.status
        ? `GitHub returned an error (${err.status}). Try again in a moment.`
        : 'Couldn’t reach GitHub. Check your connection and try again.';
    }
  }

  /* ---------- GitHub ---------- */
  async function gh(path, { method = 'GET', body } = {}) {
    const res = await fetch(`https://api.github.com/repos/${conn.repo}/${path}`, {
      method,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${conn.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = new Error(`GitHub ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  async function readRemoteList() {
    try {
      const file = await gh(`contents/${LIST_FILE}?ref=${encodeURIComponent(conn.branch)}`);
      return parseList(b64ToUtf8(file.content));
    } catch (e) {
      if (e.status === 404) return [];
      throw e;
    }
  }

  // Write several files (and remove some) in one commit
  async function commit(changes, message, log) {
    const ref = await gh(`git/ref/heads/${branchPath()}`);
    const parent = ref.object.sha;
    const base = await gh(`git/commits/${parent}`);
    const tree = [];
    for (const c of changes) {
      if (c.remove) {
        tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null });
      } else if (c.blob) {
        if (log) log(`Uploading ${c.label}…`);
        const blob = await gh('git/blobs', { method: 'POST', body: { content: await blobToB64(c.blob), encoding: 'base64' } });
        tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
      } else {
        tree.push({ path: c.path, mode: '100644', type: 'blob', content: c.text });
      }
    }
    let newTree;
    try {
      newTree = await gh('git/trees', { method: 'POST', body: { base_tree: base.tree.sha, tree } });
    } catch (e) {
      // a file we meant to remove may already be gone: try again without removals
      if (e.status !== 422 || !tree.some((t) => t.sha === null)) throw e;
      newTree = await gh('git/trees', { method: 'POST', body: { base_tree: base.tree.sha, tree: tree.filter((t) => t.sha !== null) } });
    }
    const made = await gh('git/commits', { method: 'POST', body: { message, tree: newTree.sha, parents: [parent] } });
    await gh(`git/refs/heads/${branchPath()}`, { method: 'PATCH', body: { sha: made.sha } });
    return made;
  }

  /* ---------- Connect ---------- */
  const connectMsg = $('#connectMsg');
  function setMsg(el, text, kind) {
    el.textContent = text || '';
    el.classList.toggle('is-error', kind === 'error');
    el.classList.toggle('is-ok', kind === 'ok');
  }

  async function connect(details, quiet) {
    conn = details;
    if (!quiet) setMsg(connectMsg, 'Connecting…');
    try {
      await gh(`git/ref/heads/${branchPath()}`);
      projects = await readRemoteList();
      listDirty = false;
      showConnected(true);
      renderList();
      return true;
    } catch (e) {
      conn = null;
      showConnected(false);
      setMsg(connectMsg, friendly(e), 'error');
      return false;
    }
  }

  function showConnected(on) {
    $('#connectCard').hidden = on;
    $('#connectedCard').hidden = !on;
    const status = $('#connStatus');
    status.textContent = on ? 'Connected' : 'Not connected';
    status.classList.toggle('is-on', on);
    if (on) {
      $('#connRepo').textContent = conn.repo;
      $('#connBranch').textContent = conn.branch;
      setMsg(connectMsg, '');
    }
    updateButtons();
  }

  $('#connectBtn').addEventListener('click', async () => {
    const details = {
      token: $('#token').value.trim(),
      repo: $('#repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, ''),
      branch: $('#branch').value.trim() || 'main',
    };
    if (!details.token) { setMsg(connectMsg, 'Paste your access token first.', 'error'); return; }
    if (!/^[\w.-]+\/[\w.-]+$/.test(details.repo)) { setMsg(connectMsg, 'Repository should look like owner/name.', 'error'); return; }
    const ok = await connect(details);
    if (ok) {
      if ($('#remember').checked) store.set('oo-studio', details);
      else store.del('oo-studio');
      $('#token').value = '';
    }
  });
  $('#disconnectBtn').addEventListener('click', () => {
    conn = null;
    store.del('oo-studio');
    projects = Array.isArray(window.PROJECTS) ? window.PROJECTS.slice() : [];
    showConnected(false);
    renderList();
  });

  /* ---------- Project list ---------- */
  const listEl = $('#projectList');
  const listMsg = $('#listMsg');

  function renderList() {
    const fixed = builtIns.map((b) => `
      <li class="st-item st-item--fixed">
        <span class="st-item__num">${b.number}</span>
        <span class="st-item__body"><b>${escapeHtml(b.title)}</b><small>${escapeHtml(b.meta)}</small></span>
        <span></span>
      </li>`).join('');
    const own = projects.map((p, i) => `
      <li class="st-item${model && model.slug === p.slug ? ' is-current' : ''}" data-i="${i}">
        <span class="st-item__num">${pad(builtIns.length + i + 1)}</span>
        <span class="st-item__body"><b>${escapeHtml(p.title)}</b><small>${escapeHtml(p.discipline || '')}</small></span>
        <span class="st-item__actions">
          <button class="st-badge${p.draft ? ' is-draft' : ''}" type="button" data-act="draft" title="Show or hide on the site">${p.draft ? 'Draft' : 'Live'}</button>
          <button class="st-icon" type="button" data-act="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${ICON_UP}</button>
          <button class="st-icon" type="button" data-act="down" aria-label="Move down" ${i === projects.length - 1 ? 'disabled' : ''}>${ICON_DOWN}</button>
          <button class="btn" type="button" data-act="edit">Edit</button>
        </span>
      </li>`).join('');
    listEl.innerHTML = fixed + own;
    $('#saveBar').hidden = !listDirty;
  }

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || busy) return;
    const i = Number(btn.closest('.st-item').dataset.i);
    const act = btn.dataset.act;
    if (act === 'edit') { openEditor(projects[i]); return; }
    if (act === 'draft') projects[i] = { ...projects[i], draft: !projects[i].draft };
    if (act === 'up' && i > 0) [projects[i - 1], projects[i]] = [projects[i], projects[i - 1]];
    if (act === 'down' && i < projects.length - 1) [projects[i + 1], projects[i]] = [projects[i], projects[i + 1]];
    listDirty = true;
    setMsg(listMsg, conn ? '' : 'Connect to GitHub to save these changes.');
    renderList();
  });

  $('#saveListBtn').addEventListener('click', async () => {
    if (!conn) { setMsg(listMsg, 'Connect to GitHub to save these changes.', 'error'); return; }
    setBusy(true);
    setMsg(listMsg, 'Saving…');
    try {
      const remote = await readRemoteList();
      // keep projects added elsewhere in the meantime, at the end
      const bySlug = new Map(remote.map((p) => [p.slug, p]));
      const local = projects.filter((p) => bySlug.has(p.slug)).map((p) => ({ ...bySlug.get(p.slug), draft: !!p.draft }));
      const next = local.concat(remote.filter((p) => !projects.some((q) => q.slug === p.slug)));
      await commit([{ path: LIST_FILE, text: serialize(next) }], 'Update project order');
      projects = next;
      listDirty = false;
      renderList();
      setMsg(listMsg, 'Saved. The site updates in about a minute.', 'ok');
    } catch (e) {
      setMsg(listMsg, friendly(e), 'error');
    } finally {
      setBusy(false);
    }
  });

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  // The hand-built books, read from the live index.html
  fetch('index.html', { cache: 'no-store' }).then((r) => r.text()).then((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    builtIns = $$('.book-src', doc).map((a) => ({ number: a.dataset.number || '', title: a.dataset.title || '', meta: a.dataset.meta || '', slug: a.dataset.slug }));
    renderList();
  }).catch(() => { /* opened from disk: the list just shows Studio projects */ });

  /* ---------- Editor ---------- */
  const form = $('#form');
  const empty = $('#emptyState');
  const fTitle = $('#fTitle');
  const fDiscipline = $('#fDiscipline');
  const fDraft = $('#fDraft');
  const thumbsEl = $('#frameThumbs');
  const logEl = $('#log');

  function openEditor(p) {
    model = p ? {
      slug: p.slug,
      original: p,
      title: p.title,
      discipline: p.discipline || '',
      coverStyle: p.coverStyle || 'dark',
      draft: !!p.draft,
      cover: p.cover ? { path: p.cover } : null,
      frames: (p.frames || []).map((path) => ({ path })),
    } : {
      slug: null, original: null, title: '', discipline: '', coverStyle: 'dark', draft: false, cover: null, frames: [],
    };
    fTitle.value = model.title;
    fDiscipline.value = model.discipline;
    fDraft.checked = model.draft;
    $(`input[name="coverStyle"][value="${model.coverStyle}"]`).checked = true;
    $('#formKicker').textContent = p ? 'Edit project' : 'New project';
    $('#deleteBtn').hidden = !p;
    disarmDelete();
    logEl.innerHTML = '';
    empty.hidden = true;
    form.hidden = false;
    renderTitle();
    renderCover();
    renderFrames();
    renderList();
    updateButtons();
    fTitle.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function closeEditor() {
    model = null;
    form.hidden = true;
    empty.hidden = false;
    renderList();
  }

  function renderTitle() { $('#formTitle').textContent = fTitle.value.trim() || 'Untitled'; }
  fTitle.addEventListener('input', () => { model.title = fTitle.value; renderTitle(); });
  fDiscipline.addEventListener('input', () => { model.discipline = fDiscipline.value; });
  fDraft.addEventListener('change', () => { model.draft = fDraft.checked; });
  $$('input[name="coverStyle"]').forEach((r) => r.addEventListener('change', () => { model.coverStyle = r.value; }));

  // Load an image file and read its size
  const readImage = (file) => new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ file, url, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

  /* Cover */
  function renderCover() {
    const thumb = $('#coverThumb');
    thumb.hidden = !model.cover;
    if (model.cover) $('img', thumb).src = model.cover.url || imgSrc(model.cover.path);
  }
  async function setCover(files) {
    const file = [...files].find((f) => f.type.startsWith('image/'));
    if (!file) return;
    const item = await readImage(file);
    if (item) { model.cover = item; renderCover(); }
  }
  $('#coverRemove').addEventListener('click', () => { model.cover = null; renderCover(); });

  /* Frames */
  function renderFrames() {
    thumbsEl.innerHTML = model.frames.map((f, i) => {
      const ratio = f.w && f.h ? f.w / f.h : 0;
      const warn = ratio && Math.abs(ratio - 16 / 9) > 0.04
        ? 'Not 16:9: it will sit inside the spread with a border.' : '';
      return `
        <li class="st-thumb" draggable="true" data-i="${i}">
          <span class="st-thumb__img"><img src="${escapeHtml(f.url || imgSrc(f.path))}" alt="Frame ${i + 1}"></span>
          <span class="st-thumb__meta">
            <b>Frame ${pad(i + 1)}</b>
            <button class="st-icon" type="button" data-act="left" aria-label="Move earlier" ${i === 0 ? 'disabled' : ''}>${ICON_LEFT}</button>
            <button class="st-icon" type="button" data-act="right" aria-label="Move later" ${i === model.frames.length - 1 ? 'disabled' : ''}>${ICON_RIGHT}</button>
          </span>
          <span class="st-thumb__warn">${warn}</span>
          <button class="st-x" type="button" data-act="remove" aria-label="Remove frame ${i + 1}">×</button>
        </li>`;
    }).join('');
    updateButtons();
  }
  async function addFrames(files) {
    const images = [...files].filter((f) => f.type.startsWith('image/'))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); // Figma names: Frame 1, Frame 2…
    const items = (await Promise.all(images.map(readImage))).filter(Boolean);
    model.frames.push(...items);
    renderFrames();
  }
  thumbsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const i = Number(btn.closest('.st-thumb').dataset.i);
    const f = model.frames;
    if (btn.dataset.act === 'remove') f.splice(i, 1);
    if (btn.dataset.act === 'left' && i > 0) [f[i - 1], f[i]] = [f[i], f[i - 1]];
    if (btn.dataset.act === 'right' && i < f.length - 1) [f[i + 1], f[i]] = [f[i], f[i + 1]];
    renderFrames();
  });
  // Drag a thumbnail onto another to reorder
  let dragFrom = -1;
  thumbsEl.addEventListener('dragstart', (e) => {
    const t = e.target.closest('.st-thumb');
    if (!t) return;
    dragFrom = Number(t.dataset.i);
    t.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragFrom));
  });
  thumbsEl.addEventListener('dragover', (e) => {
    if (dragFrom < 0) return;
    e.preventDefault();
    $$('.st-thumb', thumbsEl).forEach((t) => t.classList.toggle('is-target', t === e.target.closest('.st-thumb')));
  });
  thumbsEl.addEventListener('drop', (e) => {
    if (dragFrom < 0) return;
    e.preventDefault();
    const t = e.target.closest('.st-thumb');
    if (t) {
      const to = Number(t.dataset.i);
      const [moved] = model.frames.splice(dragFrom, 1);
      model.frames.splice(to, 0, moved);
    }
    dragFrom = -1;
    renderFrames();
  });
  thumbsEl.addEventListener('dragend', () => { dragFrom = -1; renderFrames(); });

  /* Drop zones */
  function dropZone(zone, input, onFiles) {
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { onFiles(input.files); input.value = ''; });
    zone.addEventListener('dragover', (e) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      zone.classList.add('is-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
    zone.addEventListener('drop', (e) => {
      if (!e.dataTransfer.files.length) return;
      e.preventDefault();
      zone.classList.remove('is-over');
      onFiles(e.dataTransfer.files);
    });
  }
  dropZone($('#framesDrop'), $('#framesInput'), addFrames);
  dropZone($('#coverDrop'), $('#coverInput'), setCover);

  /* ---------- Preview ---------- */
  const preview = $('#preview');
  const previewFrame = $('#previewFrame');
  $('#previewBtn').addEventListener('click', () => {
    const slug = model.slug || slugify(fTitle.value) || 'preview';
    const draft = {
      slug,
      title: fTitle.value.trim() || 'Untitled',
      discipline: fDiscipline.value.trim(),
      coverStyle: model.coverStyle,
      cover: model.cover ? (model.cover.url || imgSrc(model.cover.path)) : '',
      frames: model.frames.map((f) => f.url || imgSrc(f.path)),
    };
    try { sessionStorage.setItem('oo-preview', JSON.stringify(draft)); } catch (e) { /* storage off */ }
    previewFrame.src = `index.html?preview=${Date.now()}#${encodeURIComponent(slug)}`;
    preview.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#closePreview').focus();
  });
  function closePreview() {
    preview.hidden = true;
    previewFrame.src = 'about:blank';
    document.body.style.overflow = '';
  }
  $('#closePreview').addEventListener('click', closePreview);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !preview.hidden) closePreview(); });

  /* ---------- Publish ---------- */
  function log(text, kind) {
    const p = document.createElement('p');
    p.textContent = text;
    if (kind) p.className = `is-${kind}`;
    logEl.appendChild(p);
  }

  // Resize and compress an image for the web (JPEG, white behind any transparency)
  async function optimise(file, maxW) {
    const img = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  }

  function uniqueSlug(base, list) {
    const taken = new Set(list.map((p) => p.slug).concat(builtIns.map((b) => b.slug)));
    let slug = base || `project-${rand()}`;
    for (let k = 2; taken.has(slug); k++) slug = `${base}-${k}`;
    return slug;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    logEl.innerHTML = '';
    const title = fTitle.value.trim();
    if (!title) { log('Give the project a title.', 'error'); fTitle.focus(); return; }
    if (!model.frames.length) { log('Add at least one frame.', 'error'); return; }
    if (!conn) { log('Connect to GitHub (on the left) to publish.', 'error'); return; }

    setBusy(true);
    try {
      log('Checking the site…');
      const remote = await readRemoteList();
      const existing = model.slug ? remote.find((p) => p.slug === model.slug) : null;
      const slug = model.slug || uniqueSlug(slugify(title), remote);
      const folder = `projects/${slug}/`;
      const changes = [];

      const frames = [];
      for (let i = 0; i < model.frames.length; i++) {
        const f = model.frames[i];
        if (f.path) { frames.push(f.path); continue; }
        log(`Preparing frame ${i + 1} of ${model.frames.length}…`);
        const path = `${folder}frame-${pad(i + 1)}-${rand()}.jpg`;
        changes.push({ path, blob: await optimise(f.file, FRAME_MAX), label: `frame ${i + 1}` });
        frames.push(path);
      }
      let cover = '';
      if (model.cover) {
        if (model.cover.path) cover = model.cover.path;
        else {
          log('Preparing the cover…');
          cover = `${folder}cover-${rand()}.jpg`;
          changes.push({ path: cover, blob: await optimise(model.cover.file, COVER_MAX), label: 'the cover' });
        }
      }
      if (existing) { // tidy up images this project no longer uses
        const keep = new Set(frames.concat(cover));
        [...(existing.frames || []), existing.cover]
          .filter((p) => p && !keep.has(p) && p.startsWith(folder))
          .forEach((path) => changes.push({ path, remove: true }));
      }

      const entry = {
        slug,
        title,
        discipline: fDiscipline.value.trim(),
        coverStyle: model.coverStyle,
        cover,
        frames,
        draft: fDraft.checked,
      };
      const next = existing ? remote.map((p) => (p.slug === slug ? entry : p)) : remote.concat(entry);
      changes.push({ path: LIST_FILE, text: serialize(next) });

      await commit(changes, `${existing ? 'Update' : 'Add'} project: ${title}`, log);
      projects = next;
      listDirty = false;
      model.slug = slug;
      model.original = entry;
      // keep showing the local images: GitHub takes a few minutes to serve new files
      model.frames = frames.map((path, i) => ({ ...model.frames[i], path, file: null }));
      model.cover = cover ? { ...model.cover, path: cover, file: null } : null;
      $('#formKicker').textContent = 'Edit project';
      $('#deleteBtn').hidden = false;
      renderFrames();
      renderCover();
      renderList();
      log(entry.draft
        ? `Published as a draft. It will appear at …/?drafts#${slug} in about a minute.`
        : `Published. “${title}” will appear on the site in about a minute.`, 'ok');
    } catch (err) {
      log(friendly(err), 'error');
    } finally {
      setBusy(false);
    }
  });

  /* ---------- Delete ---------- */
  const deleteBtn = $('#deleteBtn');
  let armTimer;
  function disarmDelete() {
    clearTimeout(armTimer);
    deleteBtn.classList.remove('is-armed');
    deleteBtn.textContent = 'Delete project';
  }
  deleteBtn.addEventListener('click', async () => {
    if (!model || !model.slug || busy) return;
    if (!conn) { log('Connect to GitHub to delete projects.', 'error'); return; }
    if (!deleteBtn.classList.contains('is-armed')) {
      deleteBtn.classList.add('is-armed');
      deleteBtn.textContent = 'Click again to delete';
      armTimer = setTimeout(disarmDelete, 4000);
      return;
    }
    disarmDelete();
    setBusy(true);
    logEl.innerHTML = '';
    try {
      const remote = await readRemoteList();
      const gone = remote.find((p) => p.slug === model.slug);
      const next = remote.filter((p) => p.slug !== model.slug);
      const folder = `projects/${model.slug}/`;
      const changes = [{ path: LIST_FILE, text: serialize(next) }];
      if (gone) {
        [...(gone.frames || []), gone.cover].filter((p) => p && p.startsWith(folder))
          .forEach((path) => changes.push({ path, remove: true }));
      }
      await commit(changes, `Remove project: ${model.title || model.slug}`);
      projects = next;
      closeEditor();
      setMsg(listMsg, 'Project deleted. The site updates in about a minute.', 'ok');
    } catch (err) {
      log(friendly(err), 'error');
    } finally {
      setBusy(false);
    }
  });

  /* ---------- Buttons ---------- */
  function setBusy(on) {
    busy = on;
    updateButtons();
  }
  function updateButtons() {
    $('#publishBtn').disabled = busy;
    $('#publishBtn').textContent = busy ? 'Working…' : 'Publish';
    $('#previewBtn').disabled = busy || !model || !model.frames.length;
    $('#saveListBtn').disabled = busy;
    deleteBtn.disabled = busy;
  }

  const startNew = () => { if (!busy) openEditor(null); };
  $('#newBtn').addEventListener('click', startNew);
  $('#emptyNewBtn').addEventListener('click', startNew);
  $('#cancelBtn').addEventListener('click', closeEditor);

  /* ---------- Start ---------- */
  renderList();
  const saved = store.get('oo-studio');
  if (saved && saved.token) {
    $('#repo').value = saved.repo;
    $('#branch').value = saved.branch;
    connect(saved, true);
  }
})();
