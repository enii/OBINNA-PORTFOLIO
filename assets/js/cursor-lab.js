/* Cursor lab, temporary: open the site with ?cursorlab (…/?cursorlab#sting-rays) for a bar of book cursors
   to try, drawn in the drafting-cross style. Visitors without the link never load this file.
   Delete it, and its loader at the end of main.js, once a cursor is chosen.
   Each option has an idle and a held state; "Turn" also points the way the page will go. */
(() => {
  const enc = (s) => 'url("data:image/svg+xml,' + s.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23') + '")';
  // Same recipe as the site's cross: a soft halo under a 1px line, swapped for dark mode.
  // Drawn at 64px and declared 2x, so Retina screens get a sharp cursor instead of a blown-up 32px one.
  const draw = (lines, fills, dark, opts = {}) => {
    const ink = dark ? 'white' : 'black';
    const halo = dark ? 'black' : 'white';
    const { tf = '', solid = [], round = false } = opts;
    const cap = round ? " stroke-linecap='round'" : '';
    const g = (stroke, w, op, fillCol) =>
      `<g stroke='${stroke}' stroke-width='${w}' stroke-opacity='${op}' fill='none' stroke-linejoin='round'${cap}>` +
      lines.map((d) => `<path d='${d}'/>`).join('') +
      fills.map((d) => `<path d='${d}' fill='${fillCol}'/>`).join('') + '</g>';
    // solid: shapes filled with the halo colour under the line work (a hand's palm)
    const under = solid.map((d) => `<path d='${d}' fill='${halo}'/>`).join('');
    return `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 32 32'><g transform='${tf}'>${g(halo, 3, '.55', 'none')}${under}${g(ink, 1, 1, ink)}</g></svg>`;
  };
  const cur = (lines, fills, dark, fallback, opts) => `image-set(${enc(draw(lines, fills, dark, opts))} 2x) 16 16, ${fallback}`;

  const CROSS = ['M16.5 0.5v14M16.5 18.5v13M0.5 16.5h14M18.5 16.5h13'];
  // The hand, after Lucide's hand / hand-grab (ISC), redrawn with the cross's 1px line and halo
  const HAND_TF = 'translate(4 3.5)';
  const options = {
    hand: { label: 'System hand (live now)', note: 'the browser’s own open hand, closing while you hold a page' },
    thinhand: {
      label: 'Thin hand',
      note: 'Phosphor’s thin hand and grab (MIT licence): a white hand with a 1px line, like the Mac one but slimmer',
      css: {
        idle: `image-set(url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 256 256'%3E%3Cpath d='M188,52a23.9,23.9,0,0,0-16,6.13V44a24,24,0,0,0-47.93-1.8A24,24,0,0,0,84,60v78L72.75,119.94a24,24,0,0,0-41.62,23.92C64.44,214.12,82.17,236,128,236a84.09,84.09,0,0,0,84-84V76A24,24,0,0,0,188,52Z' fill='white' stroke='white' stroke-opacity='.6' stroke-width='22' stroke-linejoin='round'/%3E%3Cpath d='M188,52a23.9,23.9,0,0,0-16,6.13V44a24,24,0,0,0-47.93-1.8A24,24,0,0,0,84,60v78L72.75,119.94a24,24,0,0,0-41.62,23.92C64.44,214.12,82.17,236,128,236a84.09,84.09,0,0,0,84-84V76A24,24,0,0,0,188,52Zm16,100a76.09,76.09,0,0,1-76,76c-37.29,0-53.59-11.51-89.71-87.71l-.15-.29a16,16,0,0,1,27.71-16,.75.75,0,0,1,.07.12l18.68,30A4,4,0,0,0,92,152V60a16,16,0,0,1,32,0v60a4,4,0,0,0,8,0V44a16,16,0,0,1,32,0v76a4,4,0,0,0,8,0V76a16,16,0,0,1,32,0Z' fill='black'/%3E%3C/svg%3E") 2x) 16 16, grab`,
        held: `image-set(url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 256 256'%3E%3Cpath d='M188,84a23.87,23.87,0,0,0-16.07,6.2A24,24,0,0,0,128,78.75,24,24,0,0,0,84,92v24H68a24,24,0,0,0-24,24v12a84,84,0,0,0,168,0V108A24,24,0,0,0,188,84Z' fill='white' stroke='white' stroke-opacity='.6' stroke-width='22' stroke-linejoin='round'/%3E%3Cpath d='M188,84a23.87,23.87,0,0,0-16.07,6.2A24,24,0,0,0,128,78.75,24,24,0,0,0,84,92v24H68a24,24,0,0,0-24,24v12a84,84,0,0,0,168,0V108A24,24,0,0,0,188,84Zm16,68a76,76,0,0,1-152,0V140a16,16,0,0,1,16-16H84v28a4,4,0,0,0,8,0V92a16,16,0,0,1,32,0v28a4,4,0,0,0,8,0V92a16,16,0,0,1,32,0v28a4,4,0,0,0,8,0V108a16,16,0,0,1,32,0Z' fill='black'/%3E%3C/svg%3E") 2x) 16 16, grabbing`,
      },
    },
    slimhand: {
      label: 'Slim hand',
      note: 'the hand redrawn with the cross’s 1px line, sharp on Retina; it closes while you hold a page',
      opts: { tf: HAND_TF, round: true },
      idle: () => [['M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2', 'M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2',
        'M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8',
        'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15'], []],
      held: () => [['M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4', 'M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2',
        'M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5', 'M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2',
        'M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0'], []],
      solidIdle: ['M6 14V6a2 2 0 0 1 4 0V4a2 2 0 0 1 4 0V6a2 2 0 0 1 4 0V8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15z'],
      solidHeld: ['M2 14a2 2 0 0 1 4 0V9a2 2 0 0 1 4 0a2 2 0 0 1 4 0a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z'],
    },
    cross: {
      label: 'Cross',
      note: 'the site cursor, centre filled over a book; arms draw in while you hold a page',
      idle: () => [CROSS, ['M14.5 14.5h4v4h-4z']],
      held: () => [['M16.5 6.5v8M16.5 18.5v8M6.5 16.5h8M18.5 16.5h8'], ['M14.5 14.5h4v4h-4z']],
    },
    turn: {
      label: 'Turn',
      note: 'the cross with an arrowhead pointing the way the page will turn',
      idle: (dir) => dir > 0
        ? [['M16.5 0.5v14M16.5 18.5v13M0.5 16.5h14M18.5 16.5h12M26.5 12.5l4 4-4 4', 'M14.5 14.5h4v4h-4z'], []]
        : [['M16.5 0.5v14M16.5 18.5v13M31.5 16.5h-13M14.5 16.5h-12M6.5 12.5l-4 4 4 4', 'M14.5 14.5h4v4h-4z'], []],
      held: (dir) => dir > 0
        ? [['M16.5 0.5v14M16.5 18.5v13M0.5 16.5h14M18.5 16.5h12M26.5 12.5l4 4-4 4'], ['M14.5 14.5h4v4h-4z']]
        : [['M16.5 0.5v14M16.5 18.5v13M31.5 16.5h-13M14.5 16.5h-12M6.5 12.5l-4 4 4 4'], ['M14.5 14.5h4v4h-4z']],
    },
    dogear: {
      label: 'Dog-ear',
      note: 'the cross around a little page with its corner turned down; it fills while held',
      idle: () => [['M16.5 0.5v10M16.5 22.5v9M0.5 16.5h11M21.5 16.5h10', 'M12.5 11.5h5l3 3v7h-8z', 'M17.5 11.5v3h3'], []],
      held: () => [['M16.5 0.5v10M16.5 22.5v9M0.5 16.5h11M21.5 16.5h10', 'M17.5 11.5v3h3'], ['M12.5 11.5h5l3 3v7h-8z']],
    },
    bookmark: {
      label: 'Bookmark',
      note: 'the cross around a ribbon bookmark (your “page stopper”); it fills while held',
      idle: () => [['M16.5 0.5v10M16.5 22.5v9M0.5 16.5h12M20.5 16.5h11', 'M14 11.5h5v10l-2.5-2.5-2.5 2.5z'], []],
      held: () => [['M16.5 0.5v10M16.5 22.5v9M0.5 16.5h12M20.5 16.5h11'], ['M14 11.5h5v10l-2.5-2.5-2.5 2.5z']],
    },
  };

  const root = document.documentElement;
  const isDark = () => root.dataset.theme === 'dark' ||
    (root.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  let pick = new URLSearchParams(location.search).get('cursor') || 'turn';
  let dir = 1;

  function apply() {
    const o = options[pick];
    if (!o || (!o.idle && !o.css)) { root.style.removeProperty('--cursor-hand'); root.style.removeProperty('--cursor-grab'); $note.textContent = o ? o.note || '' : ''; return; }
    if (o.css) {
      root.style.setProperty('--cursor-hand', o.css.idle);
      root.style.setProperty('--cursor-grab', o.css.held);
      $note.textContent = o.note;
      return;
    }
    const dark = isDark();
    const base = o.opts || {};
    root.style.setProperty('--cursor-hand', cur(...o.idle(dir), dark, 'grab', { ...base, solid: o.solidIdle || [] }));
    root.style.setProperty('--cursor-grab', cur(...o.held(dir), dark, 'grabbing', { ...base, solid: o.solidHeld || [] }));
    $note.textContent = o.note;
  }

  // Which way would the page turn? Left half of the book turns back, right half forward.
  addEventListener('pointermove', (e) => {
    if (pick !== 'turn') return;
    const book = document.querySelector('#bookWrap .book');
    if (!book || document.querySelector('#bookWrap.is-holding')) return;
    const r = book.getBoundingClientRect();
    const d = e.clientX < r.left + r.width / 2 ? -1 : 1;
    if (d !== dir) { dir = d; apply(); }
  }, { passive: true });
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);

  // The switcher
  const css = document.createElement('style');
  css.textContent = `
    .clab { position: fixed; z-index: 2147483647; left: 50%; bottom: 14px; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 6px; font: 12px/1.3 system-ui, sans-serif; }
    .clab__row { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(20,20,20,.88); }
    .clab button { all: unset; cursor: pointer; padding: 6px 12px; border-radius: 999px; color: #ddd; }
    .clab button[aria-pressed="true"] { background: #fff; color: #000; }
    .clab__note { max-width: 520px; text-align: center; padding: 4px 10px; border-radius: 8px; background: rgba(20,20,20,.75); color: #eee; }
    .clab__note:empty { display: none; }`;
  document.head.appendChild(css);
  const bar = document.createElement('div');
  bar.className = 'clab';
  bar.innerHTML = '<div class="clab__row"></div><div class="clab__note"></div>';
  const $row = bar.firstChild;
  const $note = bar.lastChild;
  Object.entries(options).forEach(([key, o]) => {
    const b = document.createElement('button');
    b.textContent = o.label;
    b.setAttribute('aria-pressed', String(key === pick));
    b.addEventListener('click', () => {
      pick = key;
      $row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $note.textContent = '';
      apply();
      const u = new URL(location.href); u.searchParams.set('cursor', key); history.replaceState(null, '', u);
    });
    $row.appendChild(b);
  });
  document.body.appendChild(bar);
  apply();
})();
