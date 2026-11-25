/* The Archives page (archives.html): the files in archives/archives.js, newest first, in a carousel like the
 * books on the home page. The one in the middle is the one you look at; the ones either side are smaller
 * and fainter, and turn slowly by themselves. The arrows, a click on one at the side, or a few seconds
 * left alone slide the next one into the middle.
 *
 * A file with a 3D model ("model": a .glb) shows as a hidden-line drawing you can turn and
 * zoom, with a little transparency: its outline and its sharp edges drawn in ink, its faces filled with the
 * paper's own colour but letting a little of it through, so the lines behind them show faintly, like a
 * technical view in Rhino with the surfaces ghosted. Smooth edges and seams aren't drawn. The lines in
 * front are found on screen from each frame (where the depth or the surface's direction jumps), so they
 * stay one weight however close you zoom; the faint ones behind are worked out from the model's faces
 * (its outline as seen from the camera, and its sharp creases), keeping the parts hidden behind a face.
 * The drawing comes in from the bottom up, as if being plotted.
 *
 * A file without a model shows as a folder. Every file has a Download button.
 * Leaving the page (Back) fades it out before the home page comes back. */
import * as THREE from './vendor/three/three.module.min.js';
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

// Reads the normals and depth of the models (drawn off screen) and inks every pixel where they jump:
// the outline against the paper, one part passing in front of another, and sharp creases. The alpha
// channel holds how strongly each model is drawn, so the ones at the sides come out fainter.
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
uniform float uFillAlpha; // how much of the paper the faces hide: a little less than all of it
varying vec2 vUv;

float dist(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return (uNear * uFar) / (uFar - (uFar - uNear) * d);
}
float pairEdge(vec4 c, vec3 n0, float z0, vec2 q) {
  vec4 o = texture2D(tNormal, q);
  float e = abs(o.a - c.a); // the outline: model on one side, paper on the other (fainter for a fainter model)
  if (c.a > 0.01 && o.a > 0.01) {
    float w = min(c.a, o.a); // how strongly this model is drawn
    vec3 n1 = o.rgb * 2.0 - 1.0;
    float turn = 1.0 - dot(n0, n1);
    e = max(e, w * smoothstep(0.16, 0.26, turn)); // a crease sharper than about 35-40 degrees
    float dz = abs(dist(q) - z0);
    // one surface in front of another: a jump in depth where the surface also changes direction,
    // or a big jump anywhere. A smooth surface seen almost edge-on changes depth fast without changing
    // direction, so it draws nothing, even where two of its faces meet.
    e = max(e, w * smoothstep(uDepthTol, uDepthTol * 2.0, dz) * max(smoothstep(0.08, 0.16, turn), smoothstep(uDepthTol * 5.0, uDepthTol * 10.0, dz)));
  }
  return e;
}
float edgeAt(vec2 p, out float cover) {
  vec4 c = texture2D(tNormal, p);
  cover = c.a;
  vec3 n0 = c.rgb * 2.0 - 1.0;
  float z0 = c.a > 0.01 ? dist(p) : 0.0;
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
  e *= m; a *= m * uFillAlpha;
  float alpha = max(a, e);
  vec3 col = mix(uFill, uInk, e / max(alpha, 1e-4));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha);
}`;

// The faint lines behind the faces: drawn after the drawing, each fragment kept only where it lies behind
// the nearest face (read from the same depth picture), so the lines in front aren't drawn twice.
const BACK_VERT = /* glsl */`
varying float vZ;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const BACK_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tDepth;
uniform vec2 uScreen;   // the canvas, in device pixels
uniform float uNear;
uniform float uFar;
uniform float uEps;     // how far behind the nearest face a line must be to count as behind it
uniform vec3 uInk;
uniform float uAlpha;
uniform float uReveal;
varying float vZ;
void main() {
  vec2 uv = gl_FragCoord.xy / uScreen;
  float d = texture2D(tDepth, uv).x;
  if (d >= 1.0) discard; // nothing in front of it: an outline, already drawn
  float front = (uNear * uFar) / (uFar - (uFar - uNear) * d);
  if (vZ <= front + uEps) discard; // in front, or on the face: already drawn
  float top = uReveal * 1.25;
  float a = uAlpha * (1.0 - smoothstep(top - 0.25, top, uv.y));
  gl_FragColor = vec4(uInk, 1.0);
  #include <colorspace_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb * a, a);
}`;

// The model's faces as one welded set, for the lines behind: which faces meet at each edge, and the
// edges that are always drawn (sharp creases and open edges). The outline is found again each frame.
function buildBackLines(model) {
  const pos = [];
  const keyOf = new Map();
  const tris = [];
  const v = new THREE.Vector3();
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const g = o.geometry;
    const pa = g.attributes.position;
    const map = new Int32Array(pa.count);
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
      const k = `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`; // weld at 1/10000 of the model
      let id = keyOf.get(k);
      if (id === undefined) { id = pos.length / 3; keyOf.set(k, id); pos.push(v.x, v.y, v.z); }
      map[i] = id;
    }
    const idx = g.index ? g.index.array : null;
    const n = idx ? idx.length : pa.count;
    for (let i = 0; i + 2 < n; i += 3) {
      const a = map[idx ? idx[i] : i]; const b = map[idx ? idx[i + 1] : i + 1]; const c = map[idx ? idx[i + 2] : i + 2];
      if (a !== b && b !== c && a !== c) tris.push(a, b, c);
    }
  });
  const P = new Float32Array(pos);
  const T = tris.length / 3;
  const N = new Float32Array(T * 3); // face normals
  const C = new Float32Array(T * 3); // a corner of each face, for which way it faces the camera
  const e1 = new THREE.Vector3(); const e2 = new THREE.Vector3(); const a = new THREE.Vector3(); const nn = new THREE.Vector3();
  for (let t = 0; t < T; t++) {
    const i0 = tris[t * 3] * 3; const i1 = tris[t * 3 + 1] * 3; const i2 = tris[t * 3 + 2] * 3;
    a.set(P[i0], P[i0 + 1], P[i0 + 2]);
    e1.set(P[i1] - a.x, P[i1 + 1] - a.y, P[i1 + 2] - a.z);
    e2.set(P[i2] - a.x, P[i2 + 1] - a.y, P[i2 + 2] - a.z);
    nn.crossVectors(e1, e2).normalize();
    N.set([nn.x, nn.y, nn.z], t * 3);
    C.set([a.x, a.y, a.z], t * 3);
  }
  const edgeOf = new Map();
  const ev = []; const et = [];
  const nv = P.length / 3;
  for (let t = 0; t < T; t++) {
    for (let j = 0; j < 3; j++) {
      const p = tris[t * 3 + j]; const q = tris[t * 3 + ((j + 1) % 3)];
      const key = p < q ? p * nv + q : q * nv + p;
      const e = edgeOf.get(key);
      if (e === undefined) { edgeOf.set(key, ev.length / 2); ev.push(p, q); et.push(t, -1); } else if (et[e * 2 + 1] < 0) et[e * 2 + 1] = t;
    }
  }
  const E = ev.length / 2;
  const fixed = []; const pairs = [];
  const cosCrease = Math.cos(THREE.MathUtils.degToRad(35));
  for (let e = 0; e < E; e++) {
    const t0 = et[e * 2]; const t1 = et[e * 2 + 1];
    const seg = () => { const p = ev[e * 2] * 3; const q = ev[e * 2 + 1] * 3; fixed.push(P[p], P[p + 1], P[p + 2], P[q], P[q + 1], P[q + 2]); };
    if (t1 < 0) { seg(); continue; } // an open edge
    const d = N[t0 * 3] * N[t1 * 3] + N[t0 * 3 + 1] * N[t1 * 3 + 1] + N[t0 * 3 + 2] * N[t1 * 3 + 2];
    if (d < cosCrease) seg(); // a sharp crease
    else pairs.push(e); // smooth: part of the outline whenever one face turns towards the camera and the other away
  }
  return { P, N, C, T, ev: Int32Array.from(ev), et: Int32Array.from(et), pairs: Int32Array.from(pairs), fixed: new Float32Array(fixed) };
}

// The normal pass: each face's direction (as seen from the camera) in colour, and in the alpha channel how
// strongly that model is drawn: 1 for the one in the middle, less for the ones at the sides.
const NORMAL_VERT = /* glsl */`
varying vec3 vN;
void main() {
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const NORMAL_FRAG = /* glsl */`
precision highp float;
uniform float uFade;
varying vec3 vN;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  gl_FragColor = vec4(n * 0.5 + 0.5, uFade);
}`;

const easeOut = (t) => 1 - (1 - t) ** 3;
const MOD = (a, n) => ((a % n) + n) % n;
const CAM_PHI = THREE.MathUtils.degToRad(68); // the camera looks down on the models a little
const START_YAW = THREE.MathUtils.degToRad(-38); // each model starts three-quarters on
const SPIN = 0.105; // radians a second when it turns by itself: about one turn a minute
const SIDE = { scale: 0.42, fade: 0.68 }; // the models at the sides: this much smaller, and this much fainter
const ADVANCE = 9000; // ms: left alone this long, the carousel moves on to the next model

/* A carousel of hidden-line drawings, like the books on the home page: the model in the middle is the one
   you turn (drag) and zoom (scroll or pinch); the ones either side are smaller and fainter and turn slowly
   by themselves. The arrows, a click on a model at the side, or nine seconds left alone slide the next
   one into the middle. Every model keeps its own turn. Models load as they come near the middle. */
class HiddenLineCarousel {
  constructor(host, urls) {
    this.host = host;
    this.urls = urls;
    this.count = urls.length;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;
    host.append(renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = new THREE.ShaderMaterial({
      vertexShader: NORMAL_VERT, fragmentShader: NORMAL_FRAG, uniforms: { uFade: { value: 1 } },
      side: THREE.DoubleSide, blending: THREE.NoBlending,
    });
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
    this.fitDist = 4;
    this.dist = 4;
    this.distGoal = 4;
    this.spacing = 2;

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
        uFillAlpha: { value: 0.86 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    this.quadScene = new THREE.Scene();
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.edgeMat));
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.backMat = new THREE.ShaderMaterial({
      vertexShader: BACK_VERT,
      fragmentShader: BACK_FRAG,
      uniforms: {
        tDepth: { value: depthTexture },
        uScreen: { value: new THREE.Vector2(1, 1) },
        uNear: { value: 0.1 },
        uFar: { value: 10 },
        uEps: { value: 0.015 },
        uInk: this.edgeMat.uniforms.uInk, // the same ink as the drawing, in either theme
        uAlpha: { value: 0.3 },
        uReveal: this.edgeMat.uniforms.uReveal,
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.backScene = new THREE.Scene();
    this.backGroup = new THREE.Group(); // the lines behind the model in the middle, placed with it each frame
    this.backGroup.matrixAutoUpdate = false;
    this.backScene.add(this.backGroup);

    this.items = urls.map(() => ({ model: null, loading: false, failed: false, progress: 0, yaw: START_YAW, pitch: 0, vel: 0, back: null, pool: [] }));
    this.slots = new Map(); // carousel position → the model shown there
    this.pos = 0; // where the carousel is, in models (it slides between whole numbers)
    this.goal = 0;
    this.active = 0;
    this.spinning = !reduceMotion;
    this.held = false;
    this.lastHandled = -Infinity; // when someone last turned, zoomed or moved the carousel
    this.lastAdvance = performance.now();
    this.intro = null;
    this.started = false;
    this.tween = null;
    this.raycaster = new THREE.Raycaster();
    this.listen();

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
    this.backMat.uniforms.uScreen.value.set(Math.round(w * pr), Math.round(h * pr));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // frame the model in the middle so it fits the narrower side of the stage
    const zoom = this.distGoal / this.fitDist;
    this.fitDist = 1.12 / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2)) / Math.min(1, this.camera.aspect);
    this.distGoal = this.fitDist * zoom;
    this.dist = this.distGoal;
    // the models either side sit about at the edges of the stage, half in view (on a phone, just off it)
    const halfW = this.fitDist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
    this.spacing = Math.max(1.7, halfW * 0.95 + 0.15);
    this.dirty = true;
  }

  /* ---------- Loading ---------- */
  // Loads a model's .glb, centres it and scales it to a unit sphere, so the lines and the camera behave the
  // same whatever its units. Lines and points in the file are left out: the drawing makes its own.
  ensure(i) {
    const it = this.items[i];
    if (it.model || it.loading || it.failed || !this.urls[i]) return;
    it.loading = true;
    new GLTFLoader().load(this.urls[i], (gltf) => {
      const model = gltf.scene;
      model.traverse((o) => {
        if (o.isMesh) {
          if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
        } else if (o.isLine || o.isPoints) o.visible = false;
      });
      const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
      const s = 1 / (sphere.radius || 1);
      model.position.sub(sphere.center).multiplyScalar(s);
      model.scale.multiplyScalar(s);
      it.model = model;
      it.back = this.backLines(buildBackLines(model));
      it.loading = false;
      if (i === this.active) { this.showBack(i); this.begin(); }
      this.dirty = true;
      this.onLoaded?.(i);
    }, (e) => {
      if (e.total) { it.progress = e.loaded / e.total; this.onProgress?.(i, it.progress); }
    }, () => {
      it.loading = false;
      it.failed = true;
      this.onFailed?.(i);
    });
  }

  // a copy of a loaded model for one place in the carousel (they share its geometry)
  acquire(it) {
    if (it.pool.length) return it.pool.pop();
    const clone = it.model.clone(true);
    clone.userData.fade = 1;
    clone.traverse((o) => {
      if (!o.isMesh) return;
      o.onBeforeRender = (r, s, c, g, mat) => {
        if (mat.uniforms && mat.uniforms.uFade) { mat.uniforms.uFade.value = clone.userData.fade; mat.uniformsNeedUpdate = true; }
      };
    });
    return clone;
  }

  // the lines behind one model: its creases and open edges, and room for its outline, found each frame
  backLines(data) {
    const fixed = new THREE.BufferGeometry();
    fixed.setAttribute('position', new THREE.BufferAttribute(data.fixed, 3));
    const outline = new THREE.BufferGeometry();
    data.out = new Float32Array(data.pairs.length * 6);
    data.outAttr = new THREE.BufferAttribute(data.out, 3).setUsage(THREE.DynamicDrawUsage);
    outline.setAttribute('position', data.outAttr);
    outline.setDrawRange(0, 0);
    data.outGeo = outline;
    data.facing = new Uint8Array(data.T);
    const a = new THREE.LineSegments(fixed, this.backMat);
    const b = new THREE.LineSegments(outline, this.backMat);
    a.frustumCulled = false;
    b.frustumCulled = false;
    data.objects = [a, b];
    return data;
  }

  showBack(i) {
    this.backGroup.clear();
    const b = this.items[i] && this.items[i].back;
    if (b) this.backGroup.add(...b.objects);
  }

  // the outline as seen from the camera: every smooth edge between a face turned towards it and one turned away
  updateOutline(b, cam) {
    const { x, y, z } = cam;
    const { N, C, T, facing, ev, et, pairs, P, out } = b;
    for (let t = 0; t < T; t++) {
      const i = t * 3;
      facing[t] = N[i] * (x - C[i]) + N[i + 1] * (y - C[i + 1]) + N[i + 2] * (z - C[i + 2]) > 0 ? 1 : 0;
    }
    let n = 0;
    for (let k = 0; k < pairs.length; k++) {
      const e = pairs[k];
      if (facing[et[e * 2]] === facing[et[e * 2 + 1]]) continue;
      const p = ev[e * 2] * 3; const q = ev[e * 2 + 1] * 3;
      out[n++] = P[p]; out[n++] = P[p + 1]; out[n++] = P[p + 2];
      out[n++] = P[q]; out[n++] = P[q + 1]; out[n++] = P[q + 2];
    }
    b.outAttr.clearUpdateRanges();
    b.outAttr.addUpdateRange(0, Math.max(n, 1));
    b.outAttr.needsUpdate = true;
    b.outGeo.setDrawRange(0, n / 3);
  }

  /* ---------- Moving ---------- */
  // the first model to arrive: it swings round into view while the drawing is plotted
  begin() {
    if (this.started) return;
    this.started = true;
    if (reduceMotion) { this.edgeMat.uniforms.uReveal.value = 1; return; }
    const it = this.items[this.active];
    this.intro = { start: performance.now(), from: START_YAW - 2.3, to: it.yaw, i: this.active };
    it.yaw = this.intro.from;
    this.dist = this.fitDist * 1.35;
  }

  endIntro() {
    if (!this.intro) return;
    this.intro = null;
    this.edgeMat.uniforms.uReveal.value = 1;
  }

  grab() {
    this.held = true;
    this.endIntro();
    this.tween = null;
    this.lastHandled = performance.now();
    this.onInteract?.();
  }

  jump(i) { this.pos = this.goal = i; this.active = MOD(i, this.count); this.showBack(this.active); this.dirty = true; }

  step(d) {
    this.endIntro();
    this.goal = Math.round(this.goal) + d;
    if (reduceMotion) this.pos = this.goal;
    this.lastHandled = performance.now();
    this.dirty = true;
  }

  // back to the first view: the model in the middle turns the short way round to three-quarters on
  reset() {
    this.endIntro();
    const it = this.items[this.active];
    const turn = Math.PI * 2;
    const to = it.yaw + ((((START_YAW - it.yaw) % turn) + turn * 1.5) % turn) - turn / 2;
    it.vel = 0;
    this.tween = { i: this.active, y0: it.yaw, y1: to, p0: it.pitch, start: performance.now() };
    this.distGoal = this.fitDist;
    this.lastHandled = -Infinity;
    if (reduceMotion) { it.yaw = to; it.pitch = 0; this.dist = this.fitDist; this.tween = null; }
    this.dirty = true;
  }

  zoomTo(d) { this.distGoal = THREE.MathUtils.clamp(d, this.fitDist * 0.35, this.fitDist * 2.2); this.dirty = true; }

  // keyboard: the arrows turn and tip the model, + and - zoom
  nudge(dYaw, dPitch, zoom) {
    this.endIntro();
    const it = this.items[this.active];
    it.yaw += dYaw;
    it.pitch = THREE.MathUtils.clamp(it.pitch + dPitch, -1.25, 1.25);
    it.vel = 0;
    this.zoomTo(this.distGoal * zoom);
    this.lastHandled = performance.now();
    this.dirty = true;
  }

  // drag to turn the model in the middle (with a little run-on when flicked), scroll or pinch to zoom,
  // and a click on a model at the side brings it to the middle
  listen() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    const pts = new Map();
    let down = null;
    let lx = 0; let ly = 0; let lt = 0;
    let pinch0 = 0; let dist0 = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; lx = e.clientX; ly = e.clientY; lt = performance.now(); }
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
        dist0 = this.distGoal;
        down = null;
      }
      this.items[this.active].vel = 0;
      this.grab();
    });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0 > 0 && d > 0) this.zoomTo(dist0 * pinch0 / d);
        return;
      }
      const now = performance.now();
      const dx = e.clientX - lx; const dy = e.clientY - ly;
      const dt = Math.max(8, now - lt) / 1000;
      if (down) down.moved += Math.abs(dx) + Math.abs(dy);
      const it = this.items[this.active];
      const k = 0.0085; // radians a pixel
      it.yaw += dx * k;
      it.pitch = THREE.MathUtils.clamp(it.pitch + dy * k, -1.25, 1.25);
      it.vel = it.vel * 0.5 + (dx * k / dt) * 0.5;
      lx = e.clientX; ly = e.clientY; lt = now;
      this.dirty = true;
    });
    const end = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size === 1) { const [p] = [...pts.values()]; lx = p.x; ly = p.y; lt = performance.now(); pinch0 = 0; return; }
      if (pts.size) return;
      this.held = false;
      this.lastHandled = performance.now();
      if (performance.now() - lt > 90) this.items[this.active].vel = 0; // held still before letting go: no run-on
      if (down && down.moved < 6 && performance.now() - down.t < 450) this.pick(e.clientX, e.clientY);
      down = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.grab();
      this.held = false;
      this.zoomTo(this.distGoal * Math.exp(e.deltaY * 0.0012));
    }, { passive: false });
  }

  pick(x, y) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.camera);
    const centre = Math.round(this.pos);
    let best = null;
    for (const [j, slot] of this.slots) {
      if (j === centre) continue;
      const hit = this.raycaster.intersectObject(slot.group, true)[0];
      if (hit && (!best || hit.distance < best.d)) best = { j, d: hit.distance };
    }
    if (best) this.step(best.j - Math.round(this.goal));
  }

  // place the models: the one at each whole position near the carousel's, smaller and fainter away from the middle
  layout() {
    const N = this.count;
    const pos = this.pos;
    const want = [];
    if (N === 1) want.push(0);
    else if (N === 2) want.push(Math.floor(pos), Math.floor(pos) + 1); // two models: the other one waits on the right
    else for (let j = Math.floor(pos) - 1; j <= Math.ceil(pos) + 1; j++) if (Math.abs(j - pos) < 1.6) want.push(j);
    for (const [j, slot] of this.slots) {
      if (want.includes(j)) continue;
      this.scene.remove(slot.group);
      slot.group.remove(slot.clone);
      this.items[slot.item].pool.push(slot.clone);
      this.slots.delete(j);
    }
    for (const j of want) {
      const i = MOD(j, N);
      const it = this.items[i];
      this.ensure(i);
      if (!it.model) continue;
      let slot = this.slots.get(j);
      if (!slot) {
        const clone = this.acquire(it);
        const group = new THREE.Group();
        group.add(clone);
        this.scene.add(group);
        slot = { group, clone, item: i, fade: 1 };
        this.slots.set(j, slot);
      }
      const d = j - pos;
      const ad = Math.min(1, Math.abs(d));
      slot.group.position.set(d * this.spacing, 0, 0);
      slot.group.scale.setScalar(1 - SIDE.scale * ad);
      slot.group.rotation.set(it.pitch, it.yaw, 0);
      slot.fade = 1 - SIDE.fade * ad;
      slot.clone.userData.fade = slot.fade;
    }
  }

  frame() {
    const dt = Math.min(0.1, this.clock.getDelta());
    const now = performance.now();
    let moving = this.dirty;
    this.dirty = false;
    const N = this.count;

    if (this.intro) {
      const t = Math.min(1, (now - this.intro.start) / 2200);
      const k = easeOut(t);
      this.items[this.intro.i].yaw = this.intro.from + (this.intro.to - this.intro.from) * k;
      this.dist = this.fitDist * (1.35 - 0.35 * k);
      this.distGoal = this.fitDist;
      this.edgeMat.uniforms.uReveal.value = Math.min(1, t * 1.35);
      if (t >= 1) this.endIntro();
      moving = true;
    }
    if (this.tween) {
      const t = Math.min(1, (now - this.tween.start) / 1000);
      const k = easeOut(t);
      const it = this.items[this.tween.i];
      it.yaw = this.tween.y0 + (this.tween.y1 - this.tween.y0) * k;
      it.pitch = this.tween.p0 * (1 - k);
      if (t >= 1) this.tween = null;
      moving = true;
    }
    // the carousel slides towards its goal
    if (this.pos !== this.goal) {
      this.pos += (this.goal - this.pos) * (1 - Math.exp(-dt * 5.5));
      if (Math.abs(this.goal - this.pos) < 0.0005) this.pos = this.goal;
      moving = true;
    }
    // zoom eases too
    if (Math.abs(this.distGoal - this.dist) > 1e-4) { this.dist += (this.distGoal - this.dist) * (1 - Math.exp(-dt * 9)); moving = true; }
    // the models turn: the one in the middle runs on after a flick, then (left alone a while) turns by itself
    const idle = !this.held && now - this.lastHandled > 5000;
    this.items.forEach((it, i) => {
      if (!it.model) return;
      const middle = i === this.active;
      if (middle && (this.held || this.intro || this.tween)) return;
      if (middle && Math.abs(it.vel) > 0.01) { it.yaw += it.vel * dt; it.vel *= Math.exp(-dt * 3.5); moving = true; } else if (this.spinning && (!middle || idle)) { it.yaw += SPIN * dt; moving = true; }
    });
    const a = MOD(Math.round(this.pos), N);
    if (a !== this.active) {
      this.active = a;
      this.showBack(a);
      this.onActive?.(a);
    }
    // left alone, the carousel moves on
    if (N > 1 && this.spinning && !reduceMotion && this.started && !this.intro && !this.held && this.pos === this.goal
      && now - this.lastHandled > ADVANCE && now - this.lastAdvance > ADVANCE && document.visibilityState === 'visible') {
      this.goal += 1;
      this.lastAdvance = now;
    }
    if (!moving) return;
    this.layout();
    this.render();
  }

  render() {
    const { camera, renderer } = this;
    const d = this.dist;
    camera.position.set(0, d * Math.cos(CAM_PHI), d * Math.sin(CAM_PHI));
    camera.lookAt(0, 0, 0);
    // keep the near and far planes snug round the models in view, for clean depth
    const reach = this.count > 1 ? this.spacing + 1.2 : 1.3;
    camera.near = Math.max(d * 0.02, d - reach);
    camera.far = Math.hypot(d, reach) + reach;
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
    // then, faintly, the lines behind the faces of the model in the middle
    const slot = this.slots.get(Math.round(this.pos));
    const it = slot && this.items[slot.item];
    if (it && it.back && this.backGroup.children.length) {
      this.backGroup.matrix.copy(slot.group.matrixWorld);
      this.backGroup.matrixWorldNeedsUpdate = true;
      const cam = camera.position.clone().applyMatrix4(slot.group.matrixWorld.clone().invert());
      this.updateOutline(it.back, cam);
      const b = this.backMat.uniforms;
      b.uNear.value = camera.near;
      b.uFar.value = camera.far;
      b.uAlpha.value = 0.3 * slot.fade;
      renderer.autoClear = false;
      renderer.render(this.backScene, camera);
      renderer.autoClear = true;
    }
  }
}

let viewer = null;
function getViewer() {
  if (viewer !== null) return viewer;
  try {
    viewer = new HiddenLineCarousel(view, files.map((f) => (f.model ? assetUrl(f.model) : null)));
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
let hinted = false;

// the caption, the Download button and the address follow the model in the middle
function caption(i) {
  current = i;
  const f = files[i];
  const it = viewer && viewer.items[i];
  const three = !!f.model && !!viewer && !it.failed;
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
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', `3D drawing of ${f.title}${f.alt ? `: ${f.alt}` : ''}. Drag to turn it; scroll or pinch to zoom; or use the arrow keys.`);
    stage.tabIndex = 0;
    load.hidden = !!it.model;
    loadBar.style.transform = `scaleX(${it.progress || 0})`;
  } else {
    stage.removeAttribute('role');
    stage.removeAttribute('aria-label');
    stage.tabIndex = -1;
    load.hidden = true;
    const note = !f.model ? '' : viewer ? 'The 3D view didn’t load. You can still download the file.' : 'This device can’t show the 3D view. You can still download the file.';
    folderCard(f, note);
  }
}

function folderCard(f, note) {
  const card = document.createElement('a');
  card.className = 'vault__card';
  card.href = assetUrl(f.file);
  card.setAttribute('download', nameOf(f));
  card.innerHTML = `<span class="archives__icon">${FOLDER}<span class="archives__type" aria-hidden="true">${esc(f.type || 'FILE')}</span></span>
    ${note ? `<span class="vault__note">${esc(note)}</span>` : ''}<span class="sr-only">Download ${esc(f.title)}</span>`;
  stage.append(card);
}

function showHint() {
  if (reduceMotion || hinted) return;
  hinted = true;
  hint.textContent = coarse ? 'Drag to turn · Pinch to zoom' : files.length > 1 ? 'Drag to turn · Scroll to zoom · Click the next one to bring it round' : 'Drag to turn · Scroll to zoom';
  hint.hidden = false;
  setTimeout(() => hint.classList.add('is-gone'), 7000);
}

if (files.length) {
  const wanted = location.hash.slice(1).toLowerCase();
  const at = Math.max(0, files.findIndex((f) => slugOf(f) === wanted));
  const v = getViewer();
  if (v) {
    v.onActive = (i) => caption(i);
    v.onProgress = (i, p) => { if (i === current) loadBar.style.transform = `scaleX(${p})`; };
    v.onLoaded = (i) => { if (i === current) { load.hidden = true; showHint(); } };
    v.onFailed = (i) => { if (i === current) caption(i); };
    v.jump(at);
  } else view.hidden = true;
  caption(at);
  if (files.length > 1) {
    $('#pager').hidden = false;
    $('#prevBtn').hidden = false;
    $('#nextBtn').hidden = false;
    const go = (d) => { if (viewer) viewer.step(d); else caption(MOD(current + d, files.length)); };
    $('#prevBtn').addEventListener('click', () => go(-1));
    $('#nextBtn').addEventListener('click', () => go(1));
  }
} else {
  view.hidden = true;
  $('#title').textContent = 'Nothing here yet';
  $('#meta').textContent = 'Files will appear here as they’re added.';
}
syncTheme();

spinBtn.addEventListener('click', () => {
  if (!viewer) return;
  viewer.spinning = !viewer.spinning;
  viewer.lastHandled = -Infinity;
  viewer.lastAdvance = performance.now();
  spinBtn.setAttribute('aria-pressed', String(viewer.spinning));
  spinBtn.title = viewer.spinning ? 'Stop turning' : 'Turn by itself';
});
if (reduceMotion) { spinBtn.setAttribute('aria-pressed', 'false'); spinBtn.title = 'Turn by itself'; }
resetBtn.addEventListener('click', () => { if (viewer) viewer.reset(); });

stage.addEventListener('keydown', (e) => {
  if (!viewer || !stage.classList.contains('is-3d')) return;
  const step = THREE.MathUtils.degToRad(e.shiftKey ? 45 : 15);
  const moves = {
    ArrowLeft: [-step, 0, 1], ArrowRight: [step, 0, 1], ArrowUp: [0, -step, 1], ArrowDown: [0, step, 1],
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
