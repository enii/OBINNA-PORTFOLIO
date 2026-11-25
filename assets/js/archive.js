/* The Archives page (archives.html): the files in archives/archives.js, one at a time, newest first.
 *
 * A file with a 3D model ("model": a .glb) shows in the middle as a hidden-line drawing you can turn and
 * zoom: its outline and its sharp edges drawn in ink, its faces filled with the paper's own colour, so the
 * lines behind them stay hidden, like a technical view in Rhino. Smooth edges and seams aren't drawn. The
 * lines are found on screen from each frame (where the depth or the surface's direction jumps), so they
 * stay one weight however close you zoom. The drawing comes in from the bottom up, as if being plotted.
 *
 * A file without a model shows as a folder. Every file has a Download button.
 * Leaving the page (Back) fades it out before the home page comes back. */
import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';

const $ = (s, el = document) => el.querySelector(s);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const assetUrl = (u) => encodeURI(String(u || '').replace(/^\/+/, ''));
const nameOf = (f) => String(f.file).split('/').pop();
const slugOf = (f) => nameOf(f).replace(/\.[^.]+$/, '').toLowerCase();
const pad = (n) => String(n).padStart(2, '0');
const size = (b) => {
  if (!b) return '';
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  const mb = b / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
};
const date = (d) => {
  const t = new Date(`${d}T12:00:00`);
  return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const files = (Array.isArray(window.ARCHIVES) ? window.ARCHIVES : []).filter((f) => f && f.file && f.title);
const view = $('#view');
const stage = $('#stage');
const hint = $('#hint');
const load = $('#load');
const loadBar = $('#loadBar');
const spinBtn = $('#spinBtn');
const resetBtn = $('#resetBtn');
const getBtn = $('#getBtn');

/* ---------- Light / dark switch, as on the home page (boot.js applied the saved pick before drawing) ---------- */
const themeBtn = $('.bar__theme');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (document.documentElement.dataset.theme || (darkQuery.matches ? 'dark' : 'light')) === 'dark';
function syncTheme() {
  const dark = isDark();
  if (themeBtn) {
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.title = dark ? 'Light mode' : 'Dark mode';
  }
  const paper = css('--vault-bg');
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => { meta.removeAttribute('media'); meta.content = paper; });
  if (viewer) viewer.setColours(paper, css('--vault-ink'));
}
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('oo-theme-v2', next); } catch (e) { /* storage blocked: still switches for this visit */ }
    syncTheme();
  });
}
darkQuery.addEventListener?.('change', syncTheme);

/* ---------- The hidden-line viewer ---------- */
const EDGE_VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Reads the normals and depth of the model (drawn off screen) and inks every pixel where they jump:
// the outline against the paper, one part passing in front of another, and sharp creases.
const EDGE_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec2 uTexel;     // one texel of the off-screen picture, in 0-1 units
uniform float uK;        // off-screen texels per screen pixel, across (1 or 2)
uniform float uR;        // half the line weight, in off-screen texels
uniform float uNear;
uniform float uFar;
uniform float uDepthTol; // how far one surface must stand in front of another to draw a line (model units)
uniform vec3 uInk;
uniform vec3 uFill;
uniform float uReveal;   // 0-1: how much of the drawing has been plotted, from the bottom up
varying vec2 vUv;

float dist(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return (uNear * uFar) / (uFar - (uFar - uNear) * d);
}
float pairEdge(vec4 c, vec3 n0, float z0, vec2 q) {
  vec4 o = texture2D(tNormal, q);
  float e = abs(o.a - c.a); // the outline: model on one side, paper on the other
  if (c.a > 0.5 && o.a > 0.5) {
    vec3 n1 = o.rgb * 2.0 - 1.0;
    float turn = 1.0 - dot(n0, n1);
    e = max(e, smoothstep(0.16, 0.26, turn)); // a crease sharper than about 35-40 degrees
    float dz = abs(dist(q) - z0);
    // one surface in front of another: a jump in depth where the surface also changes direction,
    // or a big jump anywhere. A smooth surface seen almost edge-on changes depth fast without changing
    // direction, so it draws nothing, even where two of its faces meet.
    e = max(e, smoothstep(uDepthTol, uDepthTol * 2.0, dz) * max(smoothstep(0.08, 0.16, turn), smoothstep(uDepthTol * 5.0, uDepthTol * 10.0, dz)));
  }
  return e;
}
float edgeAt(vec2 p, out float cover) {
  vec4 c = texture2D(tNormal, p);
  cover = c.a;
  vec3 n0 = c.rgb * 2.0 - 1.0;
  float z0 = c.a > 0.5 ? dist(p) : 0.0;
  vec2 s = uR * uTexel;
  vec2 d = s * 0.7071;
  float e = pairEdge(c, n0, z0, p + vec2(s.x, 0.0));
  e = max(e, pairEdge(c, n0, z0, p - vec2(s.x, 0.0)));
  e = max(e, pairEdge(c, n0, z0, p + vec2(0.0, s.y)));
  e = max(e, pairEdge(c, n0, z0, p - vec2(0.0, s.y)));
  e = max(e, pairEdge(c, n0, z0, p + d));
  e = max(e, pairEdge(c, n0, z0, p - d));
  e = max(e, pairEdge(c, n0, z0, p + vec2(d.x, -d.y)));
  e = max(e, pairEdge(c, n0, z0, p + vec2(-d.x, d.y)));
  return e;
}
void main() {
  float e = 0.0;
  float a = 0.0;
  float cov;
  if (uK > 1.5) { // four samples a pixel, for smooth lines on screens with big pixels
    vec2 h = 0.5 * uTexel;
    e += edgeAt(vUv + vec2(-h.x, -h.y), cov); a += cov;
    e += edgeAt(vUv + vec2( h.x, -h.y), cov); a += cov;
    e += edgeAt(vUv + vec2(-h.x,  h.y), cov); a += cov;
    e += edgeAt(vUv + vec2( h.x,  h.y), cov); a += cov;
    e *= 0.25; a *= 0.25;
  } else {
    e = edgeAt(vUv, cov); a = cov;
  }
  float front = uReveal * 1.25;
  float m = 1.0 - smoothstep(front - 0.25, front, vUv.y);
  e *= m; a *= m;
  float alpha = max(a, e);
  vec3 col = mix(uFill, uInk, e / max(alpha, 1e-4));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha);
}`;

const easeOut = (t) => 1 - (1 - t) ** 3;
const START = { theta: THREE.MathUtils.degToRad(38), phi: THREE.MathUtils.degToRad(68) };
const INTRO_FROM = { theta: THREE.MathUtils.degToRad(-55), phi: THREE.MathUtils.degToRad(84), far: 1.55 };

class HiddenLineViewer {
  constructor(host) {
    this.host = host;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;
    host.append(renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    this.fitDist = 4;

    const depthTexture = new THREE.DepthTexture(1, 1);
    depthTexture.type = THREE.FloatType;
    this.rt = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, depthTexture,
    });
    this.edgeMat = new THREE.ShaderMaterial({
      vertexShader: EDGE_VERT,
      fragmentShader: EDGE_FRAG,
      uniforms: {
        tNormal: { value: this.rt.texture },
        tDepth: { value: depthTexture },
        uTexel: { value: new THREE.Vector2(1, 1) },
        uK: { value: 1 },
        uR: { value: 1 },
        uNear: { value: 0.1 },
        uFar: { value: 10 },
        uDepthTol: { value: 0.035 },
        uInk: { value: new THREE.Color(0x111111) },
        uFill: { value: new THREE.Color(0xffffff) },
        uReveal: { value: reduceMotion ? 1 : 0 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    this.quadScene = new THREE.Scene();
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.edgeMat));
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    controls.autoRotateSpeed = 1.1; // about one turn a minute
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI - 0.12;
    this.controls = controls;
    this.spinning = !reduceMotion;
    this.held = false;
    this.lastHandled = -Infinity; // when someone last turned or zoomed it: it waits a while before turning by itself
    this.resumeTimer = 0;
    controls.addEventListener('start', () => {
      this.held = true;
      this.intro = null; // a hand on the model ends the opening move where it is
      this.edgeMat.uniforms.uReveal.value = 1;
      clearTimeout(this.resumeTimer);
      this.onInteract?.();
    });
    controls.addEventListener('end', () => {
      this.held = false;
      clearTimeout(this.resumeTimer);
      this.resumeTimer = setTimeout(() => { this.dirty = true; }, 5000); // carries on turning a while after you let go
      this.lastHandled = performance.now();
    });
    controls.addEventListener('change', () => { this.dirty = true; });

    this.clock = new THREE.Clock();
    this.dirty = true;
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    const loop = () => { this.raf = requestAnimationFrame(loop); this.frame(); };
    loop();
  }

  setColours(fill, ink) {
    this.edgeMat.uniforms.uFill.value.set(fill || '#ffffff');
    this.edgeMat.uniforms.uInk.value.set(ink || '#111111');
    this.dirty = true;
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    const k = pr < 1.5 ? 2 : 1; // big pixels: draw off screen at twice the size, for smooth lines
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    const rw = Math.round(w * pr * k);
    const rh = Math.round(h * pr * k);
    this.rt.setSize(rw, rh);
    const u = this.edgeMat.uniforms;
    u.uTexel.value.set(1 / rw, 1 / rh);
    u.uK.value = k;
    u.uR.value = 0.7 * pr * k; // lines about 1.4 px wide
    this.camera.aspect = w / h;
    // frame the model so it fits the narrower side of the stage
    this.fitDist = 1.12 / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2)) / Math.min(1, this.camera.aspect);
    this.controls.minDistance = this.fitDist * 0.35;
    this.controls.maxDistance = this.fitDist * 2.2;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  // Loads a .glb, centres it and scales it to a unit sphere, so the lines and the camera behave the same
  // whatever the model's units. Lines and points in the file are left out: the drawing makes its own.
  load(url, onProgress) {
    const token = (this.token = {});
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(url, (gltf) => {
        if (token !== this.token) return;
        this.clear();
        const model = gltf.scene;
        model.traverse((o) => {
          if (o.isMesh) {
            if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
          } else if (o.isLine || o.isPoints) o.visible = false;
        });
        const box = new THREE.Box3().setFromObject(model);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const s = 1 / (sphere.radius || 1);
        model.position.sub(sphere.center).multiplyScalar(s);
        model.scale.multiplyScalar(s);
        this.root.add(model);
        this.model = model;
        this.edgeMat.uniforms.uReveal.value = reduceMotion ? 1 : 0; // a new drawing is plotted afresh
        this.home(!reduceMotion);
        resolve();
      }, (e) => { if (token === this.token && e.total) onProgress?.(e.loaded / e.total); }, (err) => {
        if (token === this.token) reject(err);
      });
    });
  }

  clear() {
    if (!this.model) return;
    this.root.remove(this.model);
    this.model.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.model = null;
    this.dirty = true;
  }

  place(theta, phi, dist) {
    this.camera.position.setFromSphericalCoords(dist, phi, theta);
    this.controls.target.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
  }

  // The first view: three-quarters, a little from above. With intro, the camera swings round into it
  // from low on the other side while the drawing is plotted.
  home(intro) {
    const to = { theta: START.theta, phi: START.phi, dist: this.fitDist };
    if (!intro) {
      this.intro = null;
      this.place(to.theta, to.phi, to.dist);
      this.edgeMat.uniforms.uReveal.value = 1;
      this.controls.update();
      this.dirty = true;
      return;
    }
    const sph = new THREE.Spherical().setFromVector3(this.camera.position);
    const fresh = !this.model || this.edgeMat.uniforms.uReveal.value < 1 || sph.radius === 0;
    const from = fresh
      ? { theta: INTRO_FROM.theta, phi: INTRO_FROM.phi, dist: this.fitDist * INTRO_FROM.far }
      : { theta: sph.theta, phi: sph.phi, dist: sph.radius };
    if (!fresh) { // going back to the first view: the short way round
      const turn = Math.PI * 2;
      from.theta = to.theta + ((((from.theta - to.theta) % turn) + turn * 1.5) % turn) - turn / 2;
    } else this.edgeMat.uniforms.uReveal.value = 0;
    this.intro = { from, to, start: performance.now(), length: fresh ? 2200 : 1100, reveal: fresh };
    this.place(from.theta, from.phi, from.dist);
    this.dirty = true;
  }

  frame() {
    const dt = this.clock.getDelta();
    let dirty = this.dirty;
    this.dirty = false;
    if (this.intro) {
      const { from, to, start, length, reveal } = this.intro;
      const t = Math.min(1, (performance.now() - start) / length);
      const k = easeOut(t);
      this.place(from.theta + (to.theta - from.theta) * k, from.phi + (to.phi - from.phi) * k, from.dist + (to.dist - from.dist) * k);
      if (reveal) this.edgeMat.uniforms.uReveal.value = Math.min(1, t * 1.35);
      if (t >= 1) this.intro = null;
      dirty = true;
    } else {
      const idle = !this.held && performance.now() - this.lastHandled > 5000;
      this.controls.autoRotate = this.spinning && idle && !!this.model;
      if (this.controls.update(dt)) dirty = true;
    }
    if (dirty && this.model) this.render();
    else if (dirty) this.renderer.clear();
  }

  render() {
    const { camera, renderer } = this;
    // keep the near and far planes snug round the model, for clean depth
    const d = camera.position.length();
    camera.near = Math.max(d - 1.3, d * 0.02);
    camera.far = d + 1.3;
    camera.updateProjectionMatrix();
    const u = this.edgeMat.uniforms;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    renderer.setRenderTarget(this.rt);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(this.scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(this.quadScene, this.quadCam);
  }

  // keyboard: arrows turn the model, + and - zoom
  nudge(dTheta, dPhi, zoom) {
    const sph = new THREE.Spherical().setFromVector3(this.camera.position);
    sph.theta += dTheta;
    sph.phi = THREE.MathUtils.clamp(sph.phi + dPhi, this.controls.minPolarAngle, this.controls.maxPolarAngle);
    sph.radius = THREE.MathUtils.clamp(sph.radius * zoom, this.controls.minDistance, this.controls.maxDistance);
    this.intro = null;
    this.edgeMat.uniforms.uReveal.value = 1;
    this.camera.position.setFromSpherical(sph);
    this.camera.lookAt(0, 0, 0);
    this.lastHandled = performance.now();
    this.dirty = true;
  }
}

let viewer = null;
function getViewer() {
  if (viewer !== null) return viewer;
  try {
    viewer = new HiddenLineViewer(view);
    viewer.onInteract = () => { hint.classList.add('is-gone'); };
    syncTheme();
  } catch (e) {
    viewer = false; // no WebGL here: every file shows as a folder
  }
  return viewer;
}

/* ---------- The page ---------- */
const FOLDER = '<svg class="folder" viewBox="0 0 120 92" aria-hidden="true"><path class="folder__back" d="M2 10a6 6 0 0 1 6-6h30.5a6 6 0 0 1 4.6 2.2L49 13h63a6 6 0 0 1 6 6v65a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6z"/><path class="folder__paper" d="M13 19h94v44H13z"/><path class="folder__front" d="M2 29a5 5 0 0 1 5-5h106a5 5 0 0 1 5 5v55a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6z"/></svg>';
let current = -1;

function show(i, first) {
  if (!files.length) return;
  i = ((i % files.length) + files.length) % files.length;
  if (i === current) return;
  current = i;
  const f = files[i];
  const three = !!f.model && !!getViewer();
  $('#num').textContent = pad(i + 1);
  $('#title').textContent = f.title;
  $('#meta').textContent = [f.note, [f.type, size(f.size)].filter(Boolean).join(' '), date(f.added) && `Added ${date(f.added)}`].filter(Boolean).join(' · ');
  document.title = `${f.title} — Archives — Obinna Oti`;
  getBtn.hidden = false;
  getBtn.href = assetUrl(f.file);
  getBtn.setAttribute('download', nameOf(f));
  getBtn.textContent = `Download ${f.type ? `.${f.type.toLowerCase()}` : ''}`.trim();
  getBtn.setAttribute('aria-label', `Download ${f.title}${f.size ? `, ${size(f.size)}` : ''}`);
  if (files.length > 1) $('#pager').innerHTML = `${pad(i + 1)} <span>/ ${pad(files.length)}</span>`;
  try { history.replaceState(null, '', `#${slugOf(f)}`); } catch (e) { /* sandboxed */ }

  stage.classList.toggle('is-3d', three);
  spinBtn.hidden = !three;
  resetBtn.hidden = !three;
  $('.vault__card', stage)?.remove();
  if (three) {
    view.hidden = false;
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', `3D drawing of ${f.title}${f.alt ? `: ${f.alt}` : ''}. Drag to turn it; scroll or pinch to zoom; or use the arrow keys.`);
    stage.tabIndex = 0;
    load.hidden = false;
    loadBar.style.transform = 'scaleX(0)';
    viewer.clear();
    viewer.load(assetUrl(f.model), (p) => { loadBar.style.transform = `scaleX(${p})`; }).then(() => {
      load.hidden = true;
      if (first) showHint();
    }, () => {
      load.hidden = true;
      folderCard(f, 'The 3D view didn’t load. You can still download the file.');
    });
  } else {
    if (viewer) viewer.clear();
    view.hidden = !!viewer;
    stage.removeAttribute('role');
    stage.removeAttribute('aria-label');
    stage.tabIndex = -1;
    load.hidden = true;
    hint.hidden = true;
    folderCard(f, f.model ? 'This device can’t show the 3D view. You can still download the file.' : '');
  }
}

function folderCard(f, note) {
  stage.classList.remove('is-3d');
  spinBtn.hidden = true;
  resetBtn.hidden = true;
  const card = document.createElement('a');
  card.className = 'vault__card';
  card.href = assetUrl(f.file);
  card.setAttribute('download', nameOf(f));
  card.innerHTML = `<span class="archives__icon">${FOLDER}<span class="archives__type" aria-hidden="true">${esc(f.type || 'FILE')}</span></span>
    ${note ? `<span class="vault__note">${esc(note)}</span>` : ''}<span class="sr-only">Download ${esc(f.title)}</span>`;
  stage.append(card);
}

function showHint() {
  if (reduceMotion) return;
  hint.textContent = coarse ? 'Drag to turn · Pinch to zoom' : 'Drag to turn · Scroll to zoom';
  hint.hidden = false;
  setTimeout(() => hint.classList.add('is-gone'), 6000);
}

if (files.length) {
  const wanted = location.hash.slice(1).toLowerCase();
  const at = Math.max(0, files.findIndex((f) => slugOf(f) === wanted));
  if (files.length > 1) {
    $('#pager').hidden = false;
    $('#prevBtn').hidden = false;
    $('#nextBtn').hidden = false;
    $('#prevBtn').addEventListener('click', () => show(current - 1));
    $('#nextBtn').addEventListener('click', () => show(current + 1));
  }
  show(at, true);
} else {
  $('#title').textContent = 'Nothing here yet';
  $('#meta').textContent = 'Files will appear here as they’re added.';
}
syncTheme();

spinBtn.addEventListener('click', () => {
  if (!viewer) return;
  viewer.spinning = !viewer.spinning;
  viewer.lastHandled = -Infinity;
  spinBtn.setAttribute('aria-pressed', String(viewer.spinning));
  spinBtn.title = viewer.spinning ? 'Stop turning' : 'Turn by itself';
});
if (reduceMotion) { spinBtn.setAttribute('aria-pressed', 'false'); spinBtn.title = 'Turn by itself'; }
resetBtn.addEventListener('click', () => { if (viewer) { viewer.lastHandled = -Infinity; viewer.home(!reduceMotion); } });

stage.addEventListener('keydown', (e) => {
  if (!viewer || !stage.classList.contains('is-3d')) return;
  const step = THREE.MathUtils.degToRad(e.shiftKey ? 45 : 15);
  const moves = {
    ArrowLeft: [step, 0, 1], ArrowRight: [-step, 0, 1], ArrowUp: [0, -step, 1], ArrowDown: [0, step, 1],
    '+': [0, 0, 0.85], '=': [0, 0, 0.85], '-': [0, 0, 1 / 0.85],
  }[e.key];
  if (!moves) return;
  e.preventDefault();
  viewer.nudge(...moves);
  hint.classList.add('is-gone');
});

/* ---------- Leaving: the page fades back before the home page comes in ---------- */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-leave]');
  if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (reduceMotion) return;
  e.preventDefault();
  document.body.classList.add('is-leaving');
  setTimeout(() => { location.href = link.href; }, 380);
});
// coming back with the browser's Back button after leaving: the page shows again as it was
window.addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('is-leaving'); });
