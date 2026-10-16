/*
 * Cellular Tracking Field: a generative WebGL 2 background of metaball cells, voxel aggregates and vesicles,
 * a screen-blended sketch layer, and a glitchy computer-vision tracking HUD.
 *
 *   const field = initCellField(container, options);
 *   field.setOptions({glitch: .5, speed: .6, maxTrackers: 3, edgeBoxes: true});
 *   const subject = field.pinNear(x, y, 'PRT-2201 · SUBJECT');  // subject.move(x, y), subject.release()
 *   field.destroy();
 *
 * A collapsed Tune box sits in the bottom-right corner (T hides it, ?tune opens it).
 * The canvases never take pointer events; the field listens on window and ignores anything that lands on
 * page content (links, buttons, [data-content]).
 */

// Pointer events on these never lock, pin, seed or drag a cell.
const CONTENT = 'a, button, input, select, textarea, label, summary, dialog, [data-content]';

const TUNE_HTML = `
<details class="cf-tune-box">
  <summary>Tune</summary>
  <div class="cf-panel">
    <div class="cf-rows">
      <label>Voxel</label><input data-k="cell" type="range" min="6" max="28" step="1"><output data-o="cell"></output>
      <label>Speed</label><input data-k="speed" type="range" min="0" max="2" step="0.05"><output data-o="speed"></output>
      <label>Glow</label><input data-k="glow" type="range" min="0" max="2" step="0.05"><output data-o="glow"></output>
      <label>Glitch</label><input data-k="glitch" type="range" min="0" max="2" step="0.05"><output data-o="glitch"></output>
      <label>Box max</label><input data-k="boxMax" type="range" min="30" max="320" step="10"><output data-o="boxMax"></output>
    </div>
    <div class="cf-toggles">
      <label><input data-t="track" type="checkbox"> Tracking</label>
      <label><input data-t="hover" type="checkbox"> Hover glitch</label>
      <label><input data-t="ascii" type="checkbox"> ASCII</label>
      <label><input data-t="plexus" type="checkbox"> Plexus</label>
      <label><input data-t="burst" type="checkbox"> Bursts</label>
      <label><input data-t="coral" type="checkbox"> Corals</label>
      <label><input data-t="protein" type="checkbox"> Proteins</label>
      <label><input data-t="half" type="checkbox"> Halftone</label>
    </div>
    <div class="cf-btns"><button data-b="reseed" type="button">Reseed</button><button data-b="pause" type="button">Pause</button></div>
    <p class="cf-hint"><kbd>Hover</kbd> a structure to lock on. <kbd>Click</kbd> it to pin a tracker, or click empty space to seed a cell. <kbd>Drag</kbd> to pull a cell. <kbd>T</kbd> hides or shows this box.</p>
  </div>
</details>`;

/**
 * @param {HTMLElement} container element the three canvases are mounted in (style it position: fixed; inset: 0)
 * @param {object} [options] any field setting (cell, speed, glow, glitch, boxMax, track, hover, ascii, plexus, burst,
 *   coral, protein, half, maxTrackers, edgeBoxes), plus exclusionRects, readout (element), readoutLabel, fontFamily and tune
 */
export function initCellField(container, options = {}){
  const doc = container.ownerDocument, win = doc.defaultView;
  const mkLayer = name => { const c = doc.createElement('canvas'); c.className = 'cf-' + name; c.setAttribute('aria-hidden', 'true'); container.appendChild(c); return c; };
  const glc = mkLayer('gl'), orc = mkLayer('org'), hdc = mkLayer('hud');
  const co = orc.getContext('2d'), ch = hdc.getContext('2d');
  const S = {cell:6, speed:1, glow:1, glitch:1, boxMax:110, track:true, hover:true, ascii:true, plexus:false, burst:true, coral:true, protein:true, half:true, paused:false,
    maxTrackers:7, edgeBoxes:false, scale:1, density:1};
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // reduced motion: slow speed, low glitch, no line boil, whatever setOptions asks for
  const capMotion = () => { if (reduced){ S.speed = Math.min(S.speed, .3); S.glitch = Math.min(S.glitch, .35); } };
  let exclusion = [], readout = null, readoutLabel = '', destroyed = false, raf = 0;
  const asciiOn = () => S.ascii && W >= 600;
  const offs = [];
  const on = (el, type, fn, opt) => { el.addEventListener(type, fn, opt); offs.push(() => el.removeEventListener(type, fn, opt)); };

  const rnd = (a, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];
  const TAU = Math.PI * 2;
  let W = 0, H = 0, K = 1, gs = 1, ds = 1;

  /* ================= WebGL field ================= */
  const VS = `#version 300 es
  void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position=vec4(p*2.-1.,0.,1.); }`;

  const FS = `#version 300 es
  precision highp float;
  out vec4 o;
  uniform vec2 uRes; uniform float uScale, uTime, uReal, uCell, uGlow;
  uniform vec4 uHov;
  uniform vec4 uS[24]; uniform int uSN;
  uniform vec4 uV[24]; uniform int uVN;
  uniform vec4 uB[24]; uniform int uBN;
  uniform vec4 uC[20]; uniform int uCN;
  uniform vec4 uX[4]; uniform int uXN;

  float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n2(p); p=p*2.03+vec2(17.1,9.3); a*=.5; } return s; }
  float fS(vec2 p){ float s=0.; for(int i=0;i<24;i++){ if(i>=uSN) break; vec2 d=p-uS[i].xy; s+=uS[i].z*uS[i].z/(dot(d,d)+1.); } return s; }
  float fV(vec2 p){ float s=0.; for(int i=0;i<24;i++){ if(i>=uVN) break; vec2 d=p-uV[i].xy; s+=uV[i].z*uV[i].z/(dot(d,d)+1.); } return s; }
  float fB(vec2 p){ float s=0.; for(int i=0;i<24;i++){ if(i>=uBN) break; vec2 d=p-uB[i].xy; s+=uB[i].z*uB[i].z/(dot(d,d)+1.); } return s; }

  // 1 inside the reading-area rects (fading out over 40px), so the background texture stays quiet behind text
  float calm(vec2 p){ float m=0.; for(int i=0;i<4;i++){ if(i>=uXN) break; vec4 r=uX[i]; vec2 d=max(r.xy-p, p-r.zw); m=max(m, smoothstep(40.,0.,max(d.x,d.y))); } return m; }

  void main(){
    vec2 p0 = vec2(gl_FragCoord.x, uRes.y*uScale - gl_FragCoord.y)/uScale;
    float t = uTime, rt = uReal;
    vec2 p = p0;

    // hover glitch: light pixelation + rare slice shift inside the locked structure
    float hd = length(p0 - uHov.xy)/max(uHov.z, 1.);
    float hm = uHov.w*smoothstep(1.2, .75, hd);
    if (hm > .01) {
      float bs = 1. + floor(2.*hm*h(vec2(floor(p0.y/12.), floor(rt*6.))));
      p = floor(p/bs)*bs + bs*.5;
      float hb = floor(p0.y/6.);
      p.x += (h(vec2(hb, floor(rt*10.))) - .5)*10.*hm*step(.86, h(vec2(hb*.7, floor(rt*5.))));
    }

    vec3 col = vec3(0.);

    // deep haze
    float hz = fbm(p*.0035 + vec2(t*.012, -t*.008));
    float cm = calm(p0);
    col += vec3(.0,.04,.11)*smoothstep(.5,.9,hz)*1.6*(1. - .6*cm);

    // ghost voxel constellations
    float gc = uCell*.85;
    vec2 gi = floor(p/gc), gf = fract(p/gc);
    float gOn = step(.7, fbm(gi*.07 + vec2(t*.02, 3.)));
    float gw = 1./gc;
    float ge = max(max(step(gf.x,gw), step(1.-gw,gf.x)), max(step(gf.y,gw), step(1.-gw,gf.y)));
    col += gOn*(vec3(.1,.34,.62)*ge*.2 + vec3(.004,.015,.035))*(1. - .9*cm);

    // smooth membranes: see-through, mostly dark bodies with a thin cyan rim, a faint inner contour,
    // and a grainy, edge-detected speckle that gathers toward the rim (like a filtered micrograph)
    float fs = fS(p);
    float fwc = max(fwidth(fs)*uScale, 1e-5);
    float d1 = abs(fs-1.)/fwc, d2 = abs(fs-1.6)/fwc;
    float inside = smoothstep(.9,1.1,fs);
    vec2 q = p*.018;
    float a = fbm(q + vec2(t*.05,0.)), b = fbm(q*2.6 + vec2(5.,-t*.04));
    vec3 fill = mix(vec3(.005,.03,.05), vec3(.02,.12,.15), smoothstep(.35,.75,a));
    fill += vec3(.05,.12,.35)*smoothstep(.55,.8,b)*.5;
    float rimZone = smoothstep(2.6,1.05,fs);
    float gr = h(floor(p0*.7) + floor(t*6.)*1.31);
    float speck = step(.8, gr)*(.35 + .65*rimZone);
    float fil = fbm(p*.07 + vec2(t*.08,1.));
    float fd = abs(fil-.5)/max(fwidth(fil)*uScale, 1e-5);
    fill += vec3(.35,.95,.9)*(speck*.22 + smoothstep(1.2,0.,fd)*.18*rimZone);
    col = mix(col, fill, inside*.72);
    float wob = .7 + .3*h(floor(p0*.5) + floor(t*4.));
    col += vec3(.45,1.,.95)*(smoothstep(1.3,.1,d1)*.85*wob + exp(-d1*.55)*.16*uGlow);
    col += vec3(.45,1.,.95)*smoothstep(1.,0.,d2)*.16*inside*step(.45, gr);

    // voxel aggregates
    float c = uCell;
    vec2 ci = floor(p/c), cf = fract(p/c);
    float fvC = fV((ci+.5)*c);
    float iC = step(1., fvC);
    col += (1.-iC)*smoothstep(.45,1.,fvC)*vec3(.05,.25,.3)*.5*uGlow;
    if (iC > .5) {
      float iL = step(1., fV((ci+vec2(-1,0)+.5)*c));
      float iR = step(1., fV((ci+vec2( 1,0)+.5)*c));
      float iT = step(1., fV((ci+vec2(0,-1)+.5)*c));
      float iB = step(1., fV((ci+vec2(0, 1)+.5)*c));
      float w = 1.25/c;
      float bL=1.-iL, bR=1.-iR, bT=1.-iT, bB=1.-iB;
      float edge = max(max(bL*step(cf.x,w), bR*step(1.-w,cf.x)), max(bT*step(cf.y,w), bB*step(1.-w,cf.y)));
      float o1 = 3.*w, o2 = 4.25*w;
      float inset = max(
        max(bL*step(o1,cf.x)*step(cf.x,o2), bR*step(1.-o2,cf.x)*step(cf.x,1.-o1)),
        max(bT*step(o1,cf.y)*step(cf.y,o2), bB*step(1.-o2,cf.y)*step(cf.y,1.-o1)));
      float grid = max(step(cf.x,.7*w), step(cf.y,.7*w));
      float hv = h(ci + floor(t*1.5)*.37);
      vec3 vf = mix(vec3(.0,.32,.24), vec3(.04,.12,.48), fbm(p*.025 + vec2(0.,t*.03)));
      vf = mix(vf, vec3(.55,.2,.1), step(.93,hv)*.6);
      col = mix(col, vf*(.45+.5*smoothstep(1.,3.5,fvC)), .9);
      float lh = h(ci*1.7);
      vec3 lc = lh > .7 ? vec3(1.,.55,.3) : lh > .5 ? vec3(1.,.45,.85) : lh > .3 ? vec3(1.,.85,.5) : vec3(.55,1.,.95);
      // thin neon outline with a soft inner line and almost no interior grid, so voxels read sketched rather than solid
      col += lc*edge*1.15 + lc*inset*.45 + vec3(.2,.75,.8)*grid*.1;
    }

    // hollow bead chains
    float fb = fB(p);
    float db = abs(fb-1.)/max(fwidth(fb)*uScale, 1e-5);
    float inB = smoothstep(.9,1.1,fb);
    col = mix(col, vec3(.0,.02,.05) + vec3(.0,.10,.14)*exp(-(fb-1.)*1.5), inB*.88);
    col += vec3(.45,.95,1.)*(smoothstep(1.4,.2,db)*.85 + exp(-db*.3)*.25*uGlow);

    // vesicles with nuclei, rims and buds
    for (int i=0;i<20;i++){
      if (i>=uCN) break;
      vec4 v = uC[i];
      vec2 d = p - v.xy; float L = length(d), r = v.z;
      if (L > r + 16.) continue;
      float small = step(r, 18.);
      col += vec3(.35,.9,1.)*exp(-max(L-r,0.)*.25)*.14*uGlow*step(r,L);
      if (L < r) {
        vec2 u = d/r; float l = L/r;
        vec3 inner = mix(vec3(.02,.05,.22), vec3(.05,.2,.55), fbm(u*3. + v.w));
        vec2 nc = vec2(cos(v.w), sin(v.w))*.18;
        float nl = length(u-nc)/.55;
        float nn = fbm(u*5. + v.w*2. + t*.05);
        vec3 nuc = mix(vec3(.1,.22,.75), vec3(.95,.3,.35), smoothstep(.45,.7,nn));
        nuc = mix(nuc, vec3(1.,.7,.3), smoothstep(.7,.85,fbm(u*9. + v.w))*.6);
        inner = mix(inner, nuc, smoothstep(1.,.9,nl)*(1.-small));
        float rimW = mix(.22,.5,small);
        float rim = smoothstep(1.-rimW, 1., l);
        vec3 rc = mix(vec3(1.,.35,.45), vec3(1.,.6,.25), fbm(u*6. + v.w + t*.1));
        rc = mix(rc, vec3(.3,.9,.9), step(.68, fbm(u*11. + v.w)));
        inner = mix(inner, rc*.9, rim*.85);
        inner = mix(inner, vec3(.02,.01,.04), small*smoothstep(.55,.4,l));
        col = mix(col, inner, .93);
      }
      col += vec3(.55,1.,.95)*smoothstep(1.4,.2,abs(L-r))*.95;
      col += vec3(.8,.95,1.)*smoothstep(1.,0.,abs(L-r*.93))*.35*(1.-small);
    }

    if (hm > .01) {
      col *= 1. - .12*hm*step(.5, fract(p0.y/3.));
      vec3 cq = floor(col*6.)/6.;
      col = mix(col, cq*vec3(1.1,.95,1.15), hm*.25);
    }
    col += (h(p0 + fract(rt*7.)*91.) - .5)*.045;
    vec2 uv = p0/uRes - .5; col *= 1. - .35*dot(uv,uv);
    col = 1. - exp(-col*1.5);
    o = vec4(col, 1.);
  }`;

  const gl = glc.getContext('webgl2', {antialias:false, alpha:false, preserveDrawingBuffer:true, powerPreference:'high-performance'});
  let prog = null; const U = {};
  const sArr = new Float32Array(96), vArr = new Float32Array(96), bArr = new Float32Array(96), cArr = new Float32Array(80), xArr = new Float32Array(16);
  function mk(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; }
  if (gl) {
    const v = mk(gl.VERTEX_SHADER, VS), f = mk(gl.FRAGMENT_SHADER, FS);
    if (v && f) {
      prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); prog = null; }
    }
    if (prog) {
      gl.useProgram(prog); gl.bindVertexArray(gl.createVertexArray());
      for (const n of ['uRes','uScale','uTime','uReal','uCell','uGlow','uHov','uSN','uVN','uBN','uCN','uXN']) U[n] = gl.getUniformLocation(prog, n);
      for (const n of ['uS','uV','uB','uC','uX']) U[n] = gl.getUniformLocation(prog, n + '[0]');
    }
  }

  // No WebGL 2: drop the canvases and leave a static dark background so the page still works.
  if (!prog){
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    for (const c of [glc, orc, hdc]) c.remove();
    container.classList.add('cf-static');
    const ro = options.readout;
    if (ro) ro.textContent = ['CELL-TRACK', options.readoutLabel, 'STATIC', 'WEBGL 2 UNAVAILABLE'].filter(Boolean).join(' · ');
    const noop = () => {};
    return {destroy(){ container.classList.remove('cf-static'); }, setOptions: noop, pinNear: () => ({move: noop, release: noop})};
  }

  const coarse = win.matchMedia('(pointer: coarse)');
  const fitK = () => { K = Math.max(.55, Math.min(1.25, Math.min(W, H)/850))*S.scale; };
  function resize(){
    W = win.innerWidth; H = win.innerHeight;
    const dpr = win.devicePixelRatio || 1, mobile = W < 768 || coarse.matches;
    // phones get a much smaller GL buffer: the field is soft enough that 1x reads fine
    ds = Math.min(dpr, mobile ? 1.5 : 2);
    gs = Math.min(dpr, mobile ? 1 : 1.25);
    if (W*H*gs*gs > 2.4e6) gs = Math.sqrt(2.4e6/(W*H));
    glc.width = Math.round(W*gs); glc.height = Math.round(H*gs);
    for (const c of [orc, hdc]){ c.width = Math.round(W*ds); c.height = Math.round(H*ds); }
    fitK();
    if (prog) gl.viewport(0, 0, glc.width, glc.height);
  }
  on(win, 'resize', resize); resize();

  /* ================= structures ================= */
  let uid = 2200; const nid = () => (uid += 1 + (Math.random()*6|0));
  let clusters = [], vesicles = [], donuts = [], fans = [], proteins = [], stars = [], rods = [], bursts = [], dots = [], clumps = [], parts = [], foams = [], dust = [], bubbles = [], rboxes = [];
  let nextRBox = 0;
  const RAMP = ' .:-=+*#%@';
  const dustRow = n => Array.from({length:n}, () => Math.random() < .3 ? ' ' : RAMP[1 + (Math.random()*9|0)]).join('');
  const hexRow = n => Array.from({length: Math.ceil(n/5)}, () => '0x' + (Math.random()*65536|0).toString(16).toUpperCase().padStart(4,'0')).join(' ');
  let HT_PAL;
  let trackers = [], structs = [];
  const anchors = [];
  let t = 0, nextAcq = 0, spawnI = 0;
  const cur = {x:-999, y:-999, r:0};
  const KIND = [['AMOEBOID CELL','PSEUDOPODIUM','PLASMA MEMBRANE'], ['EPITHELIAL CLUSTER','CELL COLONY'], ['LIPID DROPLETS','VACUOLE']];

  /* calm reading area: spawn points and wander targets inside an exclusion rect get pushed out into the free gutter */
  const PAD = 70; // roughly a structure's radius, so edges don't graze the text
  function setExclusion(rects){
    exclusion = (rects || []).map(r => {
      const l = r.left ?? r.x, t = r.top ?? r.y;
      return {l, t, r: r.right ?? l + r.width, b: r.bottom ?? t + r.height};
    });
  }
  // f picks how far into the free space a point lands; pass a fixed one to get the same answer every frame
  function push(p, f){
    let [x, y] = p;
    for (const r of exclusion){
      if (x < r.l - PAD || x > r.r + PAD || y < r.t - PAD || y > r.b + PAD) continue;
      const room = [r.l - PAD, W - r.r - PAD, r.t - PAD, H - r.b - PAD]; // free space left, right, above, below
      const dist = [x - r.l + PAD, r.r + PAD - x, y - r.t + PAD, r.b + PAD - y];
      let best = -1;
      // a side with no real room (e.g. text spanning a phone screen) is no escape; leave those cells be
      for (let i = 0; i < 4; i++) if (room[i] > 80 && (best < 0 || dist[i] < dist[best])) best = i;
      if (best < 0) continue;
      const j = (f ?? rnd(.15, .85))*room[best];
      if (best === 0) x = r.l - PAD - j; else if (best === 1) x = r.r + PAD + j; else if (best === 2) y = r.t - PAD - j; else y = r.b + PAD + j;
    }
    return [x, y];
  }
  /* Layout: big structures hug the left and right sides; small ones trickle along the top and bottom edges.
     Both bands are measured from the main reading area (the widest exclusion rect), or from screen fractions without one. */
  function area(){
    let best = null;
    for (const r of exclusion) if (!best || (r.r - r.l)*(r.b - r.t) > (best.r - best.l)*(best.b - best.t)) best = r;
    return best;
  }
  // glitch and tracking boxes never draw over the reading area
  const hitsText = (x, y, w, h, m = 12) => exclusion.some(r => x < r.r + m && x + w > r.l - m && y < r.b + m && y + h > r.t - m);

  /* while seeding, each position is the best of several candidates (farthest from everything placed so far),
     which spaces structures out evenly instead of letting random draws clump */
  let placed = null;
  function spread(gen){
    if (!placed) return gen();
    let best = null, bd = -1;
    for (let i = 0; i < 12; i++){
      const p = gen(); let d = 1e9;
      for (const q of placed) d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1]));
      if (d > bd){ bd = d; best = p; }
    }
    placed.push(best);
    return best;
  }
  function sidePos(side){
    return spread(() => {
      const sd = side ?? (Math.random() < .5 ? 0 : 1);
      const a = area(), gl = a ? a.l - PAD : W*.25, gr = a ? W - a.r - PAD : W*.25;
      // a side too thin to hold anything (a phone) falls back to the outer fifth of the screen
      const band = Math.max(sd ? gr : gl, W*.2);
      const d = band*(.08 + .84*Math.random());
      return push([sd ? W - d : d, rnd(.08, .92)*H]);
    });
  }
  // a spot in the top or bottom band; pass false for the bottom only
  function edgePos(onTop){
    return spread(() => {
      const a = area(), top = onTop ?? Math.random() < .5;
      const room = a ? (top ? a.t - PAD : H - a.b - PAD) : H*.18, band = Math.max(room, H*.12);
      return push([rnd(.04, .96)*W, top ? rnd(.15, .85)*band : H - rnd(.15, .85)*band]);
    });
  }

  function makeCluster(type, x, y){
    let n, mkB;
    if (type === 0){ n = 2 + (Math.random()*2|0); mkB = () => ({r: rnd(16,30), orbit: rnd(12,38)}); }
    else if (type === 1){ n = 2 + (Math.random()*2|0); mkB = () => ({r: rnd(18,30), orbit: rnd(16,40)}); }
    else { const big = Math.random() < .35; n = big ? 2 + (Math.random()*3|0) : 3 + (Math.random()*4|0);
      mkB = big ? () => ({r: rnd(22,36), orbit: rnd(14,34)}) : () => ({r: rnd(8,15), orbit: rnd(6,22)}); }
    const blobs = Array.from({length:n}, () => Object.assign(mkB(), {fx: rnd(.12,.42), fy: rnd(.12,.42), ph: rnd(TAU), ph2: rnd(TAU), x, y, rr:0}));
    return {kind: pick(KIND[type]), id: nid(), type, x, y, tx:x, ty:y, next: t + rnd(4,12), blobs, grow:1, dying:false, cx:x, cy:y, cr:40};
  }
  function makeVesicle(x, y, r){
    const spindle = Math.random() < .75;
    return {kind: spindle ? 'MITOTIC CELL · METAPHASE' : 'EUKARYOTIC CELL', id: nid(), x, y, tx:x, ty:y, next: t + rnd(5,12), r, rr:r, seed: rnd(100), spindle,
      sa: rnd(TAU), grow:1, dying:false, cx:x, cy:y, cr:r,
      daughters: Array.from({length: 2 + (Math.random()*3|0)}, () => ({ang: rnd(TAU), sp: rnd(-.25,.25), r: rnd(7,15), d: rnd(.95,1.15), seed: rnd(100), x, y, rr:0})),
      rays: Array.from({length:22}, () => [rnd(TAU), rnd(.4,1)])};
  }
  /* polyp colonies: columns built from stacked ring plates on a curving spine */
  const RING_PAL = {
    rose: ['#ffd27a','#f4b3dc','#c9a6ff','#fff0cc','#ff9fc4','#e9c8ff','#ffd27a'],
    barrel: ['#ffd76a','#ffeaa6','#e6b04a','#b8f0c8','#ffcf7a']
  };
  const BODY = {rose: ['rgba(48,20,56,.9)','rgba(38,16,50,.9)','rgba(58,26,44,.9)'], barrel: ['rgba(44,36,14,.9)','rgba(30,40,22,.9)']};
  function makeColony(x, y, ang, n, hgt, palKey, opt = {}){
    const pal = RING_PAL[palKey], cols = [];
    for (let i = 0; i < n; i++){
      const rings = 7 + (Math.random()*(opt.rings || 14)|0);
      cols.push({
        ox: rnd(-.4,.4)*hgt, lean: rnd(-1.1,1.1)*Math.pow(Math.random(), .6), len: hgt*rnd(.3,1), rings,
        r0: rnd(...(opt.r || [5,11]))*rnd(.6,1.4), bulge: rnd(.1,.9), bend: rnd(-.9,.9), ph: rnd(TAU),
        mouth: Math.random() < (opt.mouth ?? .2), tilt: rnd(.26,.42), body: pick(BODY[palKey]),
        cols: Array.from({length:rings}, () => pick(pal)),
        speck: Array.from({length:rings}, () => [rnd(-.8,.8), rnd(-.6,.6), rnd(-.8,.8), rnd(-.6,.6)]),
        petals: Array.from({length: 3 + (Math.random()*5|0)}, () => ({dx: rnd(-1.6,1.6), dy: rnd(-2.6,-.4), a: rnd(TAU), c: pick(pal), s: rnd(.6,1.2), ph: rnd(TAU)}))
      });
    }
    cols.sort(() => Math.random() - .5);
    return {kind: palKey === 'barrel' ? 'CENTRIOLE' : 'MICROVILLI', id: nid(), bx:x, by:y, x, y, ang, hgt, cols, ph: rnd(TAU), cx:x, cy:y, cr:0};
  }
  function makeFoam(x, y){
    const g = () => (Math.random() + Math.random() + Math.random() - 1.5)/1.5;
    const pal = pick([['#9ff0b8','#6fe0c8','#d4f59a'], ['#8fd0ff','#5aa8ff','#a8e8ff'], ['#9ff7ef','#7fe0d0','#c8f5a0']]);
    return {kind: pick(['POLYRIBOSOMES','ENDOSOME CLUSTER']), id: nid(), bx:x, by:y, x, y, R: rnd(45,80), pal, ph: rnd(TAU),
      bubbles: Array.from({length: 55 + (Math.random()*35|0)}, () => ({dx: g(), dy: g()*.85, r: rnd(1.8,6.5), ph: rnd(TAU), c: Math.random()*3|0})), cx:x, cy:y, cr:60};
  }
  function makeProtein(x, y, size){
    const segs = new Path2D(), nodes = [], lines = [];
    const grow = (x0, y0, a, L, d) => {
      const x1 = x0 + Math.cos(a)*L, y1 = y0 + Math.sin(a)*L;
      segs.moveTo(x0, y0); segs.lineTo(x1, y1); lines.push([x0, y0, x1, y1]);
      const r = Math.random();
      nodes.push([x1, y1, rnd(1.5,3.8)*(1 + (3-d)*.25), r < .15 ? 'rgba(150,170,40,.85)' : r < .25 ? 'rgba(255,200,90,.85)' : 'rgba(10,60,65,.9)']);
      if (d <= 0) return;
      const k = 1 + (Math.random()*2.4|0);
      for (let i = 0; i < k; i++) grow(x1, y1, a + rnd(-1.5,1.5), L*rnd(.35,.85), d - 1);
    };
    const arms = 4 + (Math.random()*6|0), depth = 1 + (Math.random()*2|0);
    for (let i = 0; i < arms; i++) grow(0, 0, rnd(TAU), size*rnd(.12,.42), depth);
    // globules: an uneven clump of round subunits packed around the core
    const gj = () => (Math.random() + Math.random() + Math.random() - 1.5)/1.5;
    const ex = rnd(.6,1.3), ey = rnd(.6,1.3);
    for (let i = 0, n = 10 + (Math.random()*28|0); i < n; i++){
      const r = Math.random();
      nodes.push([gj()*size*.55*ex, gj()*size*.55*ey, rnd(1.5,7)*(.6 + Math.random()*.8),
        r < .15 ? 'rgba(150,170,40,.85)' : r < .28 ? 'rgba(255,200,90,.85)' : 'rgba(10,60,65,.9)']);
    }
    nodes.sort(() => Math.random() - .5);
    return {kind: pick(['PROTEIN COMPLEX','ACTIN FILAMENT NETWORK']), id: nid(), bx:x, by:y, x, y, segs, nodes, lines, rot: rnd(TAU), rs: rnd(-.05,.05), ph: rnd(TAU), size,
      fuzz: Array.from({length:50}, () => [rnd(-1,1)*size*.8, rnd(-1,1)*size*.8, rnd(.5,1.5)]), cx:x, cy:y, cr:size};
  }
  function makeStar(x, y){
    const n = 6 + (Math.random()*5|0), R = rnd(9,20), path = new Path2D(), tips = [];
    for (let i = 0; i < n*2; i++){
      const a = i/(n*2)*TAU, r = i % 2 ? R*rnd(.3,.42) : R*rnd(.75,1.05);
      const px = Math.cos(a)*r, py = Math.sin(a)*r;
      if (i) path.lineTo(px, py); else path.moveTo(px, py);
      if (!(i % 2)) tips.push([px, py]);
    }
    path.closePath();
    return {kind:'VIRION · CAPSID', id: nid(), bx:x, by:y, x, y, R, path, tips, rot: rnd(TAU), rs: rnd(-.25,.25), ph: rnd(TAU), cx:x, cy:y, cr:R};
  }
  function makeRod(x, y){
    return {kind:'BACILLUS', id: nid(), bx:x, by:y, x, y, len: rnd(50,90), w: rnd(14,20), ang: rnd(TAU), as: rnd(-.08,.08), ph: rnd(TAU),
      bumps: Array.from({length:18}, () => [rnd(-1,1), Math.random() < .5 ? -1 : 1, rnd(1.2,2.6)]),
      specks: Array.from({length:16}, () => [rnd(-.42,.42), rnd(-.32,.32)]), cx:x, cy:y, cr:40};
  }
  /* seed bursts: loose clouds of oval seeds drifting around a small core cell */
  function makeBurst(x, y){
    const R = 20 + Math.pow(Math.random(), 1.3)*85, n = Math.round(22 + R*1.1);
    const l1 = rnd(TAU), l2 = rnd(TAU), a1 = rnd(.15,.4), a2 = rnd(.05,.25), f1 = 2 + (Math.random()*3|0), f2 = 3 + (Math.random()*4|0);
    const twin = Math.random() < .35, tx = rnd(-.7,.7), ty = rnd(-.7,.7);
    const petals = Array.from({length:n}, () => {
      const a = rnd(TAU), rr = Math.pow(Math.random(), .55), env = 1 + a1*Math.sin(f1*a + l1) + a2*Math.sin(f2*a + l2);
      const sub = twin && Math.random() < .35;
      return {a, r: (.1 + rr*.9)*env*(sub ? .55 : 1), ox: sub ? tx : 0, oy: sub ? ty : 0, len: rnd(2.5,8)*(.55 + rr*.7), w: rnd(1.2,2.7),
        c: Math.random() < .62 ? pick(['#fff4c2','#ffe58a','#f4fff8']) : pick(['#9ffcff','#ff9ad8','#ffd17a']),
        ph: rnd(TAU), sp: rnd(.5,1.4), wob: rnd(.02,.09), line: Math.random() < .2};
    });
    return {kind: pick(['SECRETORY GRANULES','EXOCYTOTIC VESICLES']), id: nid(), bx:x, by:y, x, y, R, petals, rot: rnd(TAU), rs: rnd(-.05,.05), ph: rnd(TAU),
      sx: rnd(.7,1.25), sy: rnd(.7,1.25),
      core: Array.from({length: 3 + (Math.random()*7|0)}, () => [rnd(-.7,.7), rnd(-.7,.7), rnd(.8,1.8)]), cx:x, cy:y, cr:60};
  }

  function seed(){
    clusters = []; trackers = [];
    // small screens get roughly half of every structure
    const m = (W < 600 ? .5 : 1)*S.density, n = k => Math.max(1, Math.round(k*m));
    placed = [];
    // mostly soft membranes and bead chains; only a couple of blocky voxel aggregates
    const types = [0,2,1,0,2,0,2,1,0,2,0,2,0].slice(0, n(13));
    types.forEach((ty, i) => { const [x, y] = sidePos(i % 2); clusters.push(makeCluster(ty, x, y)); });
    vesicles = Array.from({length:n(3)}, (_, i) => { const [x, y] = sidePos(i % 2); return makeVesicle(x, y, rnd(42,68)); });
    donuts = Array.from({length:n(6)}, () => { const [x, y] = edgePos(); return {kind:'LYSOSOME', id: nid(), bx:x, by:y, x, y, r: rnd(6,13), seed: rnd(100), ph: rnd(TAU), cx:x, cy:y, cr:10}; });
    fans = Array.from({length: n(9 + (Math.random()*4|0))}, () => {
      // about a third of the corals grow along the bottom of the page, shorter so they fit the band
      const low = Math.random() < .35, [x, y] = low ? edgePos(false) : sidePos(), barrel = Math.random() < .3;
      const ang = Math.atan2(y - H/2, x - W/2) + Math.PI/2 + rnd(-.9,.9);
      return makeColony(x, y, ang, 1 + (Math.random()*6|0), low ? rnd(40,90) : rnd(60,170), barrel ? 'barrel' : 'rose',
        barrel ? {r:[8,15], mouth:.55, rings:10} : {r:[4,10]});
    });
    foams = Array.from({length:n(6)}, () => { const [x, y] = sidePos(); return makeFoam(x, y); });
    dust = Array.from({length:n(7)}, () => { const [x, y] = edgePos();
      const cols = 5 + (Math.random()*10|0), rows = 1 + (Math.random()*4|0);
      return {bx:x, by:y, x, y, ph: rnd(TAU), cols, rows, next:0, grid: Array.from({length:rows}, () => dustRow(cols)), hex: Math.random() < .35}; });
    proteins = Array.from({length:n(8)}, () => { const [x, y] = Math.random() < .35 ? edgePos(false) : sidePos(); return makeProtein(x, y, 20 + Math.pow(Math.random(), 1.2)*75); });
    stars = Array.from({length:n(7)}, () => { const [x, y] = edgePos(); return makeStar(x, y); });
    rods = Array.from({length:n(3)}, () => { const [x, y] = sidePos(); return makeRod(x, y); });
    bursts = Array.from({length:n(10)}, () => { const [x, y] = Math.random() < .35 ? edgePos(false) : sidePos(); return makeBurst(x, y); });
    dots = Array.from({length:n(7)}, () => { const [x, y] = edgePos();
      return {kind:'NUCLEOLUS', id: nid(), bx:x, by:y, x, y, r: rnd(9,22), ph: rnd(TAU), pal: pick(HT_PAL),
        lobes: Array.from({length: 1 + (Math.random()*3|0)}, (_, i) => ({dx: i ? rnd(-1,1) : 0, dy: i ? rnd(-1,1) : 0, r: i ? rnd(.5,.9) : 1, ph: rnd(TAU)})), cx:x, cy:y, cr:15}; });
    clumps = Array.from({length:n(7)}, () => { const [x, y] = edgePos(); return {x, y, pts: Array.from({length: 10 + (Math.random()*16|0)}, () => [rnd(-22,22), rnd(-16,16), rnd(1,3.2), pick(['#3d8bff','#7ff3ea','#2a5bd8'])])}; });
    parts = Array.from({length:n(160)}, () => ({x: rnd(W), y: rnd(H), vx: rnd(-6,6), vy: rnd(-6,6), s: rnd(.6,2.2),
      c: Math.random() < .8 ? '#7ff3ea' : (Math.random() < .5 ? '#ff7fd1' : '#ffd36b'), a: rnd(.25,.8)}));
    // small blue bubbles: some loose, some in little clusters, all slowly rising
    bubbles = [];
    for (let i = 0, nb = n(14); i < nb; i++){
      const [cx, cy] = edgePos(), n = Math.random() < .5 ? 1 : 3 + (Math.random()*7|0);
      for (let j = 0; j < n; j++) bubbles.push({x: cx + (n > 1 ? rnd(-18,18) : 0), y: cy + (n > 1 ? rnd(-14,14) : 0), r: rnd(1.5,6)*(n > 1 ? .8 : 1),
        vy: -rnd(2,7), ph: rnd(TAU), c: pick(['#5aa8ff','#8fd0ff','#3d7bff','#7fc8ff'])});
    }
    rboxes = [];
    nextAcq = t;
    for (const a of anchors) vesicles.push(a.s);
    placed = null;
  }

  function spawn(x, y){
    const ty = spawnI++ % 4;
    if (ty === 3){
      const v = makeVesicle(x, y, rnd(40,62)); v.grow = 0; vesicles.push(v);
      const alive = vesicles.filter(k => !k.dying && !k.anchor); if (alive.length > 4) alive[0].dying = true;
      return;
    }
    const c = makeCluster(ty, x, y); c.grow = 0;
    const cap = [22,18,20][ty];
    let used = c.blobs.length + clusters.filter(k => k.type === ty && !k.dying).reduce((s, k) => s + k.blobs.length, 0);
    for (const k of clusters){ if (used <= cap) break; if (k.type === ty && !k.dying){ k.dying = true; used -= k.blobs.length; } }
    clusters.push(c);
  }

  /* ================= pointer ================= */
  const ptr = {x:-999, y:-999, down:false, sx:0, sy:0, moved:0, last:-1e9, drag:null, inside:false};
  function nearestDraggable(x, y){ let best = null, bd = 1e9;
    for (const c of [...clusters, ...vesicles]){ if (c.dying || c.anchor) continue; const d = Math.hypot(c.x - x, c.y - y); if (d < bd){ bd = d; best = c; } }
    return bd < 220*K ? best : null; }
  // The canvases are pointer-events: none; listen on window and leave anything over page content alone.
  const onContent = e => e.target instanceof Element && !!e.target.closest(CONTENT);
  on(win, 'pointerdown', e => {
    if (e.button > 0 || onContent(e)) return;
    ptr.down = true; ptr.inside = true; ptr.sx = ptr.x = e.clientX; ptr.sy = ptr.y = e.clientY; ptr.moved = 0; ptr.last = performance.now();
  });
  on(win, 'pointermove', e => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    if (!ptr.down && onContent(e)){ ptr.inside = false; ptr.last = -1e9; return; }
    ptr.last = performance.now(); ptr.inside = true;
    if (ptr.down){ ptr.moved = Math.max(ptr.moved, Math.hypot(ptr.x - ptr.sx, ptr.y - ptr.sy)); if (!ptr.drag && ptr.moved > 6) ptr.drag = nearestDraggable(ptr.sx, ptr.sy); }
  });
  on(win, 'pointerup', e => {
    if (ptr.down && ptr.moved < 6 && !onContent(e)){ if (hov.cur && hov.str > .3) pin(hov.cur); else spawn(e.clientX, e.clientY); }
    ptr.down = false; ptr.drag = null;
    if (e.pointerType === 'touch') ptr.inside = false;
  });
  on(win, 'pointercancel', () => { ptr.down = false; ptr.drag = null; });
  on(doc.documentElement, 'pointerleave', () => { if (!ptr.down){ ptr.inside = false; ptr.last = -1e9; } });

  /* ================= trackers + hover ================= */
  const mkCan = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const hov = {cur:null, s:null, str:0, since:0, can: mkCan(80,60), nextMosh:0, subs:[], nextSub:0, grid:null};

  function makeTracker(s, type, pinned){
    const id = pinned ? s.id : s.id + (Math.random()*40|0);
    const sub = () => id + (Math.random()*120|0) - 60;
    return {type, s, id, pinned, born: performance.now(), b:null,
      ax: rnd(.45,.95), ay: rnd(.35,.8), ox: rnd(-.12,.12), oy: rnd(-.12,.12), cur:null, nextStep:0, style: pinned ? 2 : (Math.random()*3|0),
      can: mkCan(56,40), nextMosh:0, grid:null, tex: Math.random()*4|0,
      mode: pinned ? 'mosh' : (r => r < .28 ? 'ascii' : r < .75 ? 'mosh' : 'tex')(Math.random()),
      frags: Array.from({length: Math.random()*3|0}, () => ({dx: rnd(-1.4,1.4), dy: rnd(-1.2,1.2), s: rnd(8,22), id: sub()})),
      items: type === 'swarm' ? Array.from({length: 6 + (Math.random()*10|0)}, () => ({dx: rnd(-1,1), dy: rnd(-1,1), w: rnd(10,28), h: rnd(8,18), id: sub(), fill: Math.random() < .45, tex: Math.random()*4|0})) : null,
      boxes: type === 'group' ? makeGroupBoxes(s, id) : null,
      until: pinned ? 0 : performance.now() + rnd(3500, 8500),
      nextJump:0};
  }
  /* a set of fixed-size boxes pinned to points on the structure; they ride along as it morphs */
  function makeGroupBoxes(s, id){
    const n = 2 + (Math.random()*4|0), mx = Math.max(20, Math.min(S.boxMax, 70));
    return Array.from({length:n}, (_, i) => {
      const w = rnd(16, mx);
      return {bi: s.blobs ? (Math.random()*s.blobs.length|0) : -1, dx: rnd(-.7,.7), dy: rnd(-.7,.7), w, h: w*rnd(.55,.95),
        id: id + i*(1 + (Math.random()*9|0)), delay: i*rnd(140,340), can: mkCan(16,12), next:0, grid:null, tex: Math.random()*4|0,
        mode: asciiOn() && Math.random() < .18 ? 'ascii' : Math.random() < .78 ? 'mosh' : 'tex', x:null, y:null};
    });
  }
  function acquire(){
    const taken = new Set(trackers.map(tk => tk.s));
    const cands = structs.filter(s => !taken.has(s) && !hitsText(s.cx - s.cr, s.cy - s.cr, s.cr*2, s.cr*2));
    if (!cands.length) return;
    trackers.push(makeTracker(pick(cands), 'step', false));
  }
  function pin(s){
    if (s.anchor) return;
    const i = trackers.findIndex(tk => tk.pinned && tk.s === s);
    if (i >= 0){ trackers.splice(i, 1); return; }
    trackers.push(makeTracker(s, 'step', true));
    const pins = trackers.filter(tk => tk.pinned && !tk.label);
    if (pins.length > 4) trackers.splice(trackers.indexOf(pins[0]), 1);
  }
  /* anchored subjects: a cell held near a page point, carrying a permanent labeled pin */
  function pinNear(x, y, label){
    const v = makeVesicle(x, y, rnd(46,58)); v.grow = 0; v.anchor = {x, y};
    const a = {s: v, label: String(label ?? 'PIN ' + v.id)};
    anchors.push(a); vesicles.push(v);
    return {
      move(nx, ny){ v.anchor.x = nx; v.anchor.y = ny; },
      release(){
        const i = anchors.indexOf(a); if (i < 0) return;
        anchors.splice(i, 1); v.anchor = null; v.dying = true;
        trackers = trackers.filter(tk => tk.s !== v);
      }
    };
  }
  function findHover(){
    if (!S.hover || !ptr.inside || ptr.drag) return null;
    let best = null, br = 1e9;
    for (const s of structs){ const d = Math.hypot(s.cx - ptr.x, s.cy - ptr.y); if (d < s.cr*.85 && s.cr < br){ best = s; br = s.cr; } }
    return best;
  }

  /* ================= update ================= */
  function wander(o, ease, rdt){
    if (o.anchor){
      // anchored subjects idle around their page point and follow it quickly while the page scrolls
      if (t > o.next){ o.jx = rnd(-14,14); o.jy = rnd(-10,10); o.next = t + rnd(3,7); }
      const k = Math.min(1, rdt*6);
      o.x += (o.anchor.x + (o.jx || 0) - o.x)*k; o.y += (o.anchor.y + (o.jy || 0) - o.y)*k;
    }
    else if (t > o.next){
      // wander along its own side, occasionally crossing to the other
      const side = (o.x > W/2) !== (Math.random() < .12) ? 1 : 0;
      [o.tx, o.ty] = sidePos(side); o.next = t + rnd(6,14);
    }
    if (o.anchor){ /* position handled above */ }
    else if (ptr.drag === o){ const k = Math.min(1, rdt*8); o.x += (ptr.x - o.x)*k; o.y += (ptr.y - o.y)*k; o.tx = o.x; o.ty = o.y; o.next = t + 4; }
    else {
      // keep targets out of the reading area as it moves (scroll, resize); a cell dragged under text drifts back out
      [o.tx, o.ty] = push([o.tx, o.ty], o.pf ??= rnd(.15,.85));
      o.x += (o.tx - o.x)*ease; o.y += (o.ty - o.y)*ease;
    }
    o.grow = o.dying ? o.grow - rdt*1.4 : Math.min(1, o.grow + rdt*.9);
    return 1 - Math.pow(1 - Math.max(0, o.grow), 3);
  }

  function update(dt, rdt, now){
    const ease = 1 - Math.pow(1 - .006, dt*60);
    for (const c of clusters){
      const ge = wander(c, ease, rdt);
      let sx = 0, sy = 0;
      for (const b of c.blobs){
        const sw = 1 + .35*Math.sin(t*.21 + b.ph2);
        b.x = c.x + Math.cos(t*b.fx + b.ph)*b.orbit*K*sw;
        b.y = c.y + Math.sin(t*b.fy + b.ph2)*b.orbit*K*sw;
        b.rr = b.r*K*(1 + .12*Math.sin(t*.7 + b.ph))*ge;
        sx += b.x; sy += b.y;
      }
      c.cx = sx/c.blobs.length; c.cy = sy/c.blobs.length;
      c.cr = Math.max(12, ...c.blobs.map(b => Math.hypot(b.x - c.cx, b.y - c.cy) + b.rr*.9));
    }
    clusters = clusters.filter(c => !(c.dying && c.grow <= 0));

    for (const v of vesicles){
      const ge = wander(v, ease, rdt);
      v.rr = v.r*K*ge; v.sa += .12*dt;
      v.cx = v.x; v.cy = v.y; v.cr = v.rr*1.25;
      for (const d of v.daughters){ d.ang += d.sp*dt; d.rr = d.r*K*ge; const dist = v.rr*d.d + d.rr*.25;
        d.x = v.x + Math.cos(d.ang)*dist; d.y = v.y + Math.sin(d.ang)*dist; }
    }
    vesicles = vesicles.filter(v => !(v.dying && v.grow <= 0));

    // drifting decorations ease their base out of the reading area, and back home once it moves away
    const sk = Math.min(1, rdt*2);
    for (const arr of [donuts, fans, foams, dust, proteins, stars, rods, bursts, dots]) for (const o of arr){
      o.hx ??= o.bx; o.hy ??= o.by;
      const [gx, gy] = push([o.hx, o.hy], o.pf ??= rnd(.15,.85));
      o.bx += (gx - o.bx)*sk; o.by += (gy - o.by)*sk;
    }
    for (const d of donuts){ d.x = d.bx + Math.sin(t*.08 + d.ph)*40; d.y = d.by + Math.cos(t*.06 + d.ph)*30; d.cx = d.x; d.cy = d.y; d.cr = Math.max(12, d.r*K*1.6); }
    for (const f of fans){ f.x = f.bx + Math.sin(t*.04 + f.ph)*22; f.y = f.by + Math.cos(t*.035 + f.ph)*18; const L = f.hgt*K;
      f.cx = f.x + Math.sin(f.ang)*L*.4; f.cy = f.y - Math.cos(f.ang)*L*.4; f.cr = Math.max(20, L*.5); }
    for (const f of foams){ f.x = f.bx + Math.sin(t*.06 + f.ph)*30; f.y = f.by + Math.cos(t*.05 + f.ph)*24; f.cx = f.x; f.cy = f.y; f.cr = f.R*K*.9; }
    for (const d of dust){ d.x = d.bx + Math.sin(t*.04 + d.ph)*20; d.y = d.by + Math.cos(t*.03 + d.ph)*16;
      if (now > d.next){ d.grid = d.grid.map(r => Math.random() < .4 ? (d.hex ? hexRow(d.cols) : dustRow(d.cols)) : r); d.next = now + rnd(180,520); } }
    for (const p of proteins){ p.rot += p.rs*dt; p.x = p.bx + Math.sin(t*.05 + p.ph)*35; p.y = p.by + Math.cos(t*.045 + p.ph)*28; p.cx = p.x; p.cy = p.y; p.cr = p.size*K*.9; }
    for (const s of stars){ s.rot += s.rs*dt; s.x = s.bx + Math.sin(t*.1 + s.ph)*45; s.y = s.by + Math.cos(t*.08 + s.ph)*35; s.cx = s.x; s.cy = s.y; s.cr = Math.max(14, s.R*K*1.4); }
    for (const r of rods){ r.ang += r.as*dt; r.x = r.bx + Math.sin(t*.07 + r.ph)*50; r.y = r.by + Math.cos(t*.05 + r.ph)*40; r.cx = r.x; r.cy = r.y; r.cr = r.len*K*.55; }
    for (const b of bursts){ b.rot += b.rs*dt; b.x = b.bx + Math.sin(t*.05 + b.ph)*30; b.y = b.by + Math.cos(t*.04 + b.ph)*24; b.cx = b.x; b.cy = b.y; b.cr = b.R*K; }
    for (const d of dots){ d.x = d.bx + Math.sin(t*.09 + d.ph)*40; d.y = d.by + Math.cos(t*.07 + d.ph)*30; d.cx = d.x; d.cy = d.y; d.cr = Math.max(12, d.r*K*1.4); }
    for (const b of bubbles){ b.y += b.vy*dt; b.x += Math.sin(t*.8 + b.ph)*.15*dt*60*.1; if (b.y < -10){ b.y = H + 10; b.x = rnd(W); } }
    for (const p of parts){ p.x += p.vx*dt; p.y += p.vy*dt; if (p.x < 0) p.x += W; if (p.x > W) p.x -= W; if (p.y < 0) p.y += H; if (p.y > H) p.y -= H; }

    structs = [
      ...clusters.filter(c => !c.dying && c.grow > .5), ...vesicles.filter(v => !v.dying && v.grow > .5), ...donuts, ...rods,
      ...(S.coral ? fans : []), ...(S.protein ? [...proteins, ...stars, ...foams] : []), ...(S.burst ? bursts : []), ...(S.half ? dots : [])
    ];
    const alive = new Set(structs);
    trackers = trackers.filter(tk => alive.has(tk.s) && (!tk.until || now < tk.until));
    for (const a of anchors) if (alive.has(a.s) && !trackers.some(tk => tk.s === a.s)){
      const tk = makeTracker(a.s, 'step', true); tk.label = a.label; trackers.push(tk);
    }

    if (t >= nextAcq){
      const auto = trackers.filter(tk => !tk.pinned), maxT = Math.min(S.maxTrackers, W < 600 ? 3 : 7);
      if (auto.length >= maxT || (auto.length && Math.random() < .3)) trackers.splice(trackers.indexOf(pick(auto)), 1);
      acquire(); nextAcq = t + rnd(.6, 1.6);
    }
    for (const tk of trackers){
      if (tk.type === 'step'){
        // stop-motion tracking: a fresh static box every few hundred ms, re-fitted to the cell's current shape
        if (!tk.cur || now > tk.nextStep){
          const s = tk.s, mx = Math.max(30, S.boxMax);
          const w = Math.min(mx, Math.max(26, s.cr*2*tk.ax)), h = Math.min(mx*.8, Math.max(20, s.cr*2*tk.ay));
          const jx = rnd(-.06,.06)*w, jy = rnd(-.06,.06)*h;
          tk.cur = {x: s.cx + tk.ox*s.cr - w/2 + jx, y: s.cy + tk.oy*s.cr - h/2 + jy, w, h, born: now,
            id: tk.cur ? tk.cur.id + 1 + (Math.random()*4|0) : tk.id};
          tk.nextMosh = 0; tk.nextStep = now + rnd(280,650)/Math.max(.4, S.speed);
        }
        tk.b = tk.cur;
        continue;
      }
      if (tk.type === 'group'){
        const s = tk.s, k = Math.min(1, rdt*10);
        for (const bx of tk.boxes){
          const bl = bx.bi >= 0 && s.blobs ? s.blobs[bx.bi % s.blobs.length] : null;
          const tx = bl ? bl.x + bx.dx*bl.rr*.6 : s.cx + bx.dx*s.cr, ty = bl ? bl.y + bx.dy*bl.rr*.6 : s.cy + bx.dy*s.cr;
          if (bx.x === null){ bx.x = tx; bx.y = ty; } else { bx.x += (tx - bx.x)*k; bx.y += (ty - bx.y)*k; }
        }
        tk.b = {x: s.cx - 1, y: s.cy - 1, w: 2, h: 2};
        continue;
      }
      const s = tk.s, mx = Math.max(30, S.boxMax);
      const w = Math.min(mx, Math.max(30, s.cr*2*tk.ax)), h = Math.min(mx*.8, Math.max(24, s.cr*2*tk.ay));
      const tgt = {x: s.cx + tk.ox*s.cr - w/2, y: s.cy + tk.oy*s.cr - h/2, w, h};
      if (!tk.b) tk.b = tgt;
      else { const k = Math.min(1, rdt*7); for (const key in tgt) tk.b[key] += (tgt[key] - tk.b[key])*k; }
    }

    if (S.track && now > nextRBox){
      const n = Math.random() < .3 ? 2 + (Math.random()*3|0) : 1, cy = rnd(50, H - 20);
      // edgeBoxes keeps random boxes in the outer bands of the page
      const band = Math.max(40, Math.min(W*.16, ...exclusion.map(r => Math.min(r.l, W - r.r)))), side = Math.random() < .5;
      const cx = S.edgeBoxes ? (side ? rnd(16, band) : rnd(W - band, W - 16)) : rnd(20, W - 20);
      for (let i = 0; i < n; i++){
        const w = n > 1 ? rnd(10,26) : rnd(16, Math.max(20, Math.min(S.boxMax, 90)));
        const [bx, by] = push([cx + (n > 1 ? rnd(-30,30) : 0), cy + (n > 1 ? rnd(-24,24) : 0)]);
        rboxes.push({x: bx, y: by, w, h: w*rnd(.5,.95),
          born: now + i*rnd(60,200), until: now + rnd(900,3200), id: nid(), tex: Math.random()*4|0, can: mkCan(16,12), next:0, grid:null,
          mode: asciiOn() && Math.random() < .2 ? 'ascii' : Math.random() < .75 ? 'mosh' : 'tex'});
      }
      while (rboxes.length > 16) rboxes.shift();
      nextRBox = now + rnd(250,700)/Math.max(.3, S.glitch);
    }
    rboxes = rboxes.filter(b => now < b.until);
    const hit = findHover();
    if (hit && hit !== hov.s){ hov.s = hit; hov.since = now; }
    hov.cur = hit;
    hov.str += ((hit ? 1 : 0) - hov.str)*Math.min(1, rdt*(hit ? 9 : 5));
    if (!hit && hov.str < .02) hov.s = null;

    const active = ptr.inside && performance.now() - ptr.last < 2500 && !ptr.drag && !hit;
    cur.r += ((active ? 22*K : 0) - cur.r)*Math.min(1, rdt*5);
    if (cur.x < -500){ cur.x = ptr.x; cur.y = ptr.y; }
    cur.x += (ptr.x - cur.x)*Math.min(1, rdt*9); cur.y += (ptr.y - cur.y)*Math.min(1, rdt*9);
  }

  /* ================= glitch engine ================= */
  const MP = [[255,79,216],[127,243,234],[255,224,102],[255,255,255],[61,107,255],[176,107,255],[255,122,61]];
  function mosh(can, sx, sy, sw, sh, G){
    // keep glitch pixels around 3px no matter how big the box is, so large boxes don't turn into giant blocks
    const tw = Math.max(12, Math.min(120, Math.round(sw/3))), th = Math.max(8, Math.min(90, Math.round(sh/3)));
    if (can.width !== tw || can.height !== th){ can.width = tw; can.height = th; }
    const g = can._g || (can._g = can.getContext('2d', {willReadFrequently:true}));
    const dw = can.width, dh = can.height, gr = glc.width/W;
    let X = Math.max(0, Math.min(glc.width - 2, sx*gr)), Y = Math.max(0, Math.min(glc.height - 2, sy*gr));
    const Wd = Math.max(2, Math.min(glc.width - X, sw*gr)), Hd = Math.max(2, Math.min(glc.height - Y, sh*gr));
    g.globalCompositeOperation = 'copy'; g.drawImage(glc, X, Y, Wd, Hd, 0, 0, dw, dh); g.globalCompositeOperation = 'source-over';
    const im = g.getImageData(0, 0, dw, dh), d = im.data, src = new Uint8ClampedArray(d);
    const shift = Math.random()*7|0;
    for (let i = 0; i < d.length; i += 4){
      const l = (src[i] + src[i+1] + src[i+2])/3;
      if (l < 22){
        if (Math.random() < .35){ const c = pick(MP); d[i] = c[0]*.35; d[i+1] = c[1]*.35; d[i+2] = c[2]*.35; } else { d[i] = d[i+1] = d[i+2] = 0; }
      } else {
        const c = MP[(Math.floor(l/255*MP.length*1.6) + shift) % MP.length];
        d[i] = c[0]*.75 + src[i]*.25; d[i+1] = c[1]*.75 + src[i+1]*.25; d[i+2] = c[2]*.75 + src[i+2]*.25;
      }
      d[i+3] = 255;
    }
    const cp = new Uint8ClampedArray(d);
    for (let y = 0; y < dh;){
      const bh = 1 + (Math.random()*5|0);
      const off = Math.random() < .45 ? Math.round((Math.random() - .5)*dw*.5*G) : 0;
      if (off) for (let yy = y; yy < Math.min(dh, y + bh); yy++) for (let x = 0; x < dw; x++){
        const s = (yy*dw + ((x - off) % dw + dw) % dw)*4, o = (yy*dw + x)*4;
        d[o] = cp[s]; d[o+1] = cp[s+1]; d[o+2] = cp[s+2];
      }
      y += bh;
    }
    for (let y = 0; y < dh; y++){
      if (Math.random() > .45*G) continue;
      const st = Math.random()*dw|0, len = Math.min(dw - st, 8 + (Math.random()*dw*.6|0));
      const run = [];
      for (let x = st; x < st + len; x++){ const o = (y*dw + x)*4; run.push([d[o] + d[o+1] + d[o+2], d[o], d[o+1], d[o+2]]); }
      run.sort((a, b) => a[0] - b[0]);
      run.forEach((px, k) => { const o = (y*dw + st + k)*4; d[o] = px[1]; d[o+1] = px[2]; d[o+2] = px[3]; });
    }
    const k = 1 + (Math.random()*3*G|0);
    const cp2 = new Uint8ClampedArray(d);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++){
      const o = (y*dw + x)*4;
      d[o] = cp2[(y*dw + Math.min(dw - 1, x + k))*4];
      d[o+2] = cp2[(y*dw + Math.max(0, x - k))*4 + 2];
    }
    g.putImageData(im, 0, 0);
  }

  const GT = Array.from({length:4}, () => mkCan(48,36));
  const GP = ['#ff4fd8','#7ff3ea','#ffe066','#ffffff','#3d6bff','#b06bff','#ff7a3d'];
  function glitchTex(c){
    const g = c.getContext('2d'); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, 48, 36);
    for (let y = 0; y < 36;){
      const bh = 1 + (Math.random()*5|0), wide = Math.random() < .3;
      for (let x = 0; x < 48;){ const w = 1 + (Math.random()*(wide ? 20 : 7)|0);
        if (Math.random() < .78){ g.fillStyle = pick(GP); g.globalAlpha = .3 + Math.random()*.7; g.fillRect(x, y, w, bh); }
        x += w; }
      y += bh;
    }
    g.globalAlpha = 1; g.fillStyle = '#000';
    for (let i = 0; i < 4; i++) g.fillRect(0, Math.random()*36|0, 48, 1);
  }
  GT.forEach(glitchTex);
  let gIdx = 0, gNext = 0;

  const dotPattern = (col, size, r) => { const c = mkCan(size, size), g = c.getContext('2d');
    g.fillStyle = col; g.beginPath(); g.arc(size/2, size/2, r, 0, TAU); g.fill(); return co.createPattern(c, 'repeat'); };
  HT_PAL = [
    {base:'rgba(70,30,110,.95)', dots: dotPattern('#ffd36b', 6, 1.8), rim:'rgba(255,238,220,.95)'},
    {base:'rgba(92,28,72,.95)', dots: dotPattern('#ff9fcf', 6, 1.7), rim:'rgba(255,225,240,.95)'},
    {base:'rgba(60,30,100,.95)', dots: dotPattern('#ffb06b', 5, 1.5), rim:'rgba(255,200,150,.95)'}
  ];

  /* ASCII sampler: turns a patch of the live field into character rows */
  const AS = mkCan(72,36), asg = AS.getContext('2d', {willReadFrequently:true});
  // next/font renames families, so the page can hand over the real font-family list
  const MONO = (options.fontFamily ? options.fontFamily + ', ' : '"IBM Plex Mono", ') + 'ui-monospace, Menlo, monospace';
  const ASCII_FONT = `500 8px ${MONO}`;
  let CW = 4.8;
  const measureCW = () => { ch.font = ASCII_FONT; CW = ch.measureText('0').width || 4.8; };
  doc.fonts?.ready.then(() => { if (!destroyed) measureCW(); });
  function asciiGrid(x, y, w, h){
    const cols = Math.max(2, Math.min(72, Math.floor((w - 4)/CW))), rows = Math.max(1, Math.min(36, Math.floor((h - 2)/8)));
    const gr = glc.width/W;
    const X = Math.max(0, Math.min(glc.width - 2, x*gr)), Y = Math.max(0, Math.min(glc.height - 2, y*gr));
    const Wd = Math.max(2, Math.min(glc.width - X, w*gr)), Hd = Math.max(2, Math.min(glc.height - Y, h*gr));
    asg.globalCompositeOperation = 'copy'; asg.drawImage(glc, X, Y, Wd, Hd, 0, 0, cols, rows);
    const d = asg.getImageData(0, 0, cols, rows).data, out = [];
    for (let r = 0; r < rows; r++){
      let s = '';
      for (let c = 0; c < cols; c++){ const o = (r*cols + c)*4; const l = (d[o]*.3 + d[o+1]*.55 + d[o+2]*.15)/255;
        s += RAMP[Math.min(9, Math.floor(Math.pow(l, .7)*12))]; }
      out.push(s);
    }
    return out;
  }
  function drawAscii(grid, x, y, color, alpha, upto){
    if (!grid) return;
    ch.font = ASCII_FONT; ch.fillStyle = color; ch.globalAlpha = alpha;
    const n = upto === undefined ? grid.length : Math.min(grid.length, upto);
    for (let r = 0; r < n; r++) ch.fillText(grid[r], x + 2, y + 8 + r*8);
    ch.globalAlpha = 1;
  }
  const FONT = `500 10px ${MONO}`;
  const FONT_S = `500 9px ${MONO}`;

  const scramble = n => String(n).split('').map(c => Math.random() < .5 ? (Math.random()*10|0) : c).join('');
  function idText(id, born, now){
    if (now - born < 380) return String(1000 + (Math.random()*9000|0));
    if (Math.random() < .02*S.glitch) return scramble(id);
    return String(id);
  }

  /* ================= organic layer ================= */
  function capsule(g, x, y, L, w){ const r = w/2;
    g.moveTo(x + r, y); g.lineTo(x + L - r, y); g.arc(x + L - r, y + r, r, -Math.PI/2, Math.PI/2);
    g.lineTo(x + r, y + w); g.arc(x + r, y + r, r, Math.PI/2, Math.PI*1.5); g.closePath(); }

  /* ---- hand-sketch helpers: wobbly, overshooting, re-drawn a few times a second like pencil "line boil" ---- */
  const rh = (a, b) => { const s = Math.sin(a*127.1 + b*311.7)*43758.5453; return s - Math.floor(s); };
  let BF = 0;
  function roughEllipse(g, x, y, rx, ry, rot, seed, k){
    const s0 = seed*13.1 + k*7.7 + BF*3.3, n = rx > 14 ? 16 : 10;
    const start = rh(s0, 1)*TAU, sweep = TAU + .12 + rh(s0, 2)*.4, amp = .08 + .04*k;
    const ox = (rh(s0, 40) - .5)*rx*.08, oy = (rh(s0, 41) - .5)*ry*.08;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    let px = 0, py = 0;
    for (let i = 0; i <= n; i++){
      const a = start + sweep*i/n, j = 1 + (rh(s0, i + 3) - .5)*2*amp;
      const lx = Math.cos(a)*rx*j + ox, ly = Math.sin(a)*ry*j + oy;
      const X = x + lx*cr - ly*sr, Y = y + lx*sr + ly*cr;
      if (i === 0) g.moveTo(X, Y); else g.quadraticCurveTo(px, py, (px + X)/2, (py + Y)/2);
      px = X; py = Y;
    }
    g.lineTo(px, py);
  }
  function roughLine(g, x1, y1, x2, y2, seed, k){
    const s0 = seed*9.7 + k*5.1 + BF*2.9, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy/L, ny = dx/L;
    const e1 = (rh(s0, 1) - .5)*.12, e2 = 1 + (rh(s0, 2) - .35)*.14, bow = (rh(s0, 3) - .5)*L*.16;
    const ax = x1 + dx*e1 + nx*(rh(s0, 4) - .5)*1.6, ay = y1 + dy*e1 + ny*(rh(s0, 4) - .5)*2.6;
    const bx = x1 + dx*e2, by = y1 + dy*e2;
    g.moveTo(ax, ay); g.quadraticCurveTo((ax + bx)/2 + nx*bow, (ay + by)/2 + ny*bow, bx, by);
  }
  function strokeBatches(map, width, alpha){
    co.lineWidth = width; co.globalAlpha = alpha;
    for (const [col, path] of map){ co.strokeStyle = col; co.stroke(path); }
    co.globalAlpha = 1;
  }
  const batch = (map, col) => { let p = map.get(col); if (!p){ p = new Path2D(); map.set(col, p); } return p; };

  function drawColony(f){
    const inks = new Map(), fine = new Map();
    for (const c of f.cols){
      const L = c.len*K, N = c.rings, step = L/N, sway = Math.sin(t*.32 + c.ph)*.07;
      let x = f.x + Math.cos(f.ang)*c.ox*K, y = f.y + Math.sin(f.ang)*c.ox*K;
      const pts = [];
      for (let i = 0; i < N; i++){
        const s = i/(N - 1), a = f.ang + c.lean + (c.bend + sway)*s;
        let r = c.r0*K*(.75 + c.bulge*Math.sin(Math.PI*Math.min(1, s*1.1)))*(1 - .3*s)*(1 + .04*Math.sin(t*1.1 + c.ph + i*.55));
        if (c.mouth && i === N - 1) r *= 1.45;
        pts.push([x, y, a, r]);
        x += Math.sin(a)*step; y -= Math.cos(a)*step;
      }
      // faint wash for the body, like a light watercolor under the pencil
      co.fillStyle = c.body; co.globalAlpha = .45;
      for (const [px, py, a, r] of pts){ co.beginPath(); co.ellipse(px, py, r, r*c.tilt*1.5, a, 0, TAU); co.fill(); }
      co.globalAlpha = 1;
      const sd = c.ph*100;
      for (let i = 0; i < N; i++){
        const [px, py, a, r] = pts[i], col = c.cols[i];
        const p = batch(inks, col);
        roughEllipse(p, px, py, r, r*c.tilt, a, sd + i, 0);
        if (rh(sd, i) < .55) roughEllipse(p, px, py, r*1.03, r*c.tilt*1.08, a, sd + i, 1);
        // shading hatch on one flank
        const q = batch(fine, col), ca = Math.cos(a), sa = Math.sin(a), side = rh(sd, 99) < .5 ? -1 : 1;
        for (let h = 0; h < 2; h++){
          const u = side*(.55 + h*.22), hx = px + ca*u*r, hy = py + sa*u*r;
          roughLine(q, hx, hy, hx - Math.sin(a)*step*.9 + ca*side*1.5, hy + Math.cos(a)*step*.9 + sa*side*1.5, sd + i*3 + h, 0);
        }
      }
      const [tx, ty, ta, tr] = pts[N - 1];
      if (c.mouth){ co.fillStyle = 'rgba(8,4,10,.85)'; co.beginPath(); co.ellipse(tx, ty, tr*.7, tr*c.tilt*.6, ta, 0, TAU); co.fill();
        roughEllipse(batch(inks, c.cols[N - 1]), tx, ty, tr*.7, tr*c.tilt*.6, ta, sd + 777, 0); }
      for (const p of c.petals){
        const fw = -p.dy*tr, sdv = p.dx*tr;
        const px = tx + Math.sin(ta)*fw + Math.cos(ta)*sdv + Math.sin(t*.6 + p.ph)*3, py = ty - Math.cos(ta)*fw + Math.sin(ta)*sdv + Math.cos(t*.5 + p.ph)*3;
        roughEllipse(batch(inks, p.c), px, py, 4.5*p.s*K, 1.8*p.s*K, p.a + t*.1, p.ph*50, 0);
      }
    }
    strokeBatches(inks, 1.15, .85);
    strokeBatches(fine, .6, .4);
  }
  function drawFoam(f){
    const R = f.R*K;
    const g = co.createRadialGradient(f.x, f.y, 0, f.x, f.y, R*1.1);
    g.addColorStop(0, 'rgba(40,120,110,.16)'); g.addColorStop(1, 'rgba(40,120,110,0)');
    co.fillStyle = g; co.beginPath(); co.arc(f.x, f.y, R*1.1, 0, TAU); co.fill();
    for (let k = 0; k < 3; k++){
      co.beginPath();
      for (const b of f.bubbles){ if (b.c !== k) continue;
        const bx = f.x + b.dx*R + Math.sin(t*.7 + b.ph)*1.6, by = f.y + b.dy*R + Math.cos(t*.6 + b.ph)*1.6, r = b.r*K*(1 + .1*Math.sin(t*1.3 + b.ph));
        co.moveTo(bx + r, by); co.arc(bx, by, r, 0, TAU); }
      co.strokeStyle = f.pal[k]; co.globalAlpha = .18; co.lineWidth = 3.5; co.stroke();
      co.globalAlpha = .85; co.lineWidth = 1.1; co.stroke();
    }
    co.globalAlpha = 1;
  }
  function drawRod(r){
    const L = r.len*K, w = r.w*K;
    co.save(); co.translate(r.x, r.y); co.rotate(r.ang);
    co.beginPath(); capsule(co, -L/2, -w/2, L, w);
    co.fillStyle = 'rgba(20,95,60,.55)'; co.fill();
    co.strokeStyle = 'rgba(140,255,200,.16)'; co.lineWidth = 5; co.stroke();
    co.strokeStyle = '#8ff5c8'; co.lineWidth = 1.2; co.stroke();
    co.lineWidth = .9; co.strokeStyle = 'rgba(160,255,210,.75)';
    for (const b of r.bumps){ co.beginPath(); co.arc(b[0]*L*.42, b[1]*w*.5, b[2]*K, 0, TAU); co.stroke(); }
    co.fillStyle = 'rgba(200,255,220,.7)';
    for (const s of r.specks) co.fillRect(s[0]*L, s[1]*w, 1.6, 1.6);
    co.restore();
  }
  function drawProtein(p){
    const sc = K*(1 + .04*Math.sin(t*1.3 + p.ph)), sd = p.ph*100;
    co.save(); co.translate(p.x, p.y); co.rotate(p.rot); co.scale(sc, sc); co.lineCap = 'round';
    const arms = new Path2D(), arms2 = new Path2D();
    p.lines.forEach((l, i) => { roughLine(arms, l[0], l[1], l[2], l[3], sd + i, 0); if (rh(sd, i) < .6) roughLine(arms2, l[0], l[1], l[2], l[3], sd + i, 1); });
    co.strokeStyle = '#bffff6'; co.globalAlpha = .8; co.lineWidth = 1/sc; co.stroke(arms);
    co.globalAlpha = .4; co.lineWidth = .7/sc; co.stroke(arms2);
    // globules: light fills, sketched outlines, a little scribble shading on bigger ones
    const ring = new Path2D(), scrib = new Path2D();
    p.nodes.forEach((n, i) => {
      co.globalAlpha = .5; co.fillStyle = n[3]; co.beginPath(); co.arc(n[0], n[1], n[2]*.9, 0, TAU); co.fill();
      roughEllipse(ring, n[0], n[1], n[2], n[2], 0, sd + i*2, 0);
      if (n[2] > 3.5){
        roughEllipse(ring, n[0], n[1], n[2]*1.06, n[2]*1.06, 0, sd + i*2, 1);
        for (let h = -1; h <= 1; h++) roughLine(scrib, n[0] - n[2]*.5, n[1] + h*n[2]*.35 - n[2]*.3, n[0] + n[2]*.3, n[1] + h*n[2]*.35 + n[2]*.3, sd + i*5 + h, 0);
      }
    });
    co.globalAlpha = .85; co.strokeStyle = '#d6fff9'; co.lineWidth = .9/sc; co.stroke(ring);
    co.globalAlpha = .35; co.lineWidth = .6/sc; co.stroke(scrib);
    co.globalAlpha = .6; co.strokeStyle = 'rgba(200,240,150,.9)'; co.lineWidth = .7/sc;
    const fz = new Path2D();
    p.fuzz.forEach((f, i) => { const a = rh(sd + i, BF)*TAU; fz.moveTo(f[0], f[1]); fz.lineTo(f[0] + Math.cos(a)*f[2]*1.6, f[1] + Math.sin(a)*f[2]*1.6); });
    co.stroke(fz);
    co.globalAlpha = 1; co.restore(); co.lineCap = 'butt';
  }
  function drawStar(s){
    const sc = K*(1 + .08*Math.sin(t*1.7 + s.ph));
    co.save(); co.translate(s.x, s.y); co.rotate(s.rot); co.scale(sc, sc);
    co.fillStyle = 'rgba(10,50,60,.8)'; co.fill(s.path);
    co.strokeStyle = 'rgba(127,243,234,.2)'; co.lineWidth = 4; co.stroke(s.path);
    co.strokeStyle = '#9ff7ef'; co.lineWidth = 1; co.stroke(s.path);
    co.fillStyle = '#e8fffb';
    for (const tp of s.tips){ co.beginPath(); co.arc(tp[0], tp[1], 1.4, 0, TAU); co.fill(); }
    co.restore();
  }
  function roughQuad(g, x1, y1, cx, cy, x2, y2, seed, k){
    const s0 = seed*11.3 + k*6.1 + BF*2.3, L = Math.hypot(x2 - x1, y2 - y1) || 1, j = L*.05;
    g.moveTo(x1 + (rh(s0,1) - .5)*j, y1 + (rh(s0,2) - .5)*j);
    g.quadraticCurveTo(cx + (rh(s0,3) - .5)*j*2, cy + (rh(s0,4) - .5)*j*2, x2 + (rh(s0,5) - .5)*j, y2 + (rh(s0,6) - .5)*j);
  }
  function drawSpindle(v){
    if (!v.spindle || v.rr < 22) return;
    const r = v.rr, s = r*.42, ax = Math.cos(v.sa), ay = Math.sin(v.sa), nx = -ay, ny = ax, sd = v.seed*100;
    const P = [[v.x + ax*s, v.y + ay*s], [v.x - ax*s, v.y - ay*s]];
    const fib = new Path2D(), fib2 = new Path2D(), rays = new Path2D(), poles = new Path2D(), chrom = new Path2D();
    // spindle fibers: loose pencil arcs pole to pole, a few drawn twice
    for (let k = -4; k <= 4; k++){
      const bend = k*r*.09*(1 + .15*Math.sin(t*1.2 + k)) + (rh(sd, k)-.5)*r*.05;
      roughQuad(fib, P[0][0], P[0][1], v.x + nx*bend, v.y + ny*bend, P[1][0], P[1][1], sd + k, 0);
      if (rh(sd, k + 20) < .45) roughQuad(fib2, P[0][0], P[0][1], v.x + nx*bend*1.05, v.y + ny*bend*1.05, P[1][0], P[1][1], sd + k, 1);
    }
    // asters: quick flicks radiating from each pole
    v.rays.forEach((ry, i) => { const pole = P[i % 2], L = ry[1]*r*.24*(1 + .1*Math.sin(t*2 + i));
      roughLine(rays, pole[0], pole[1], pole[0] + Math.cos(ry[0])*L, pole[1] + Math.sin(ry[0])*L, sd + i*3, 0); });
    P.forEach((pole, i) => { roughEllipse(poles, pole[0], pole[1], 3, 3, 0, sd + 50 + i, 0); roughEllipse(poles, pole[0], pole[1], 1.6, 1.6, 0, sd + 60 + i, 1); });
    // chromosomes lined up on the equator: short doubled ticks
    for (let k = -3; k <= 3; k++){
      const ex = v.x + nx*k*r*.075, ey = v.y + ny*k*r*.075, l = r*.07*(.7 + rh(sd, k + 40)*.6);
      roughLine(chrom, ex - ax*l, ey - ay*l, ex + ax*l, ey + ay*l, sd + k*7, 0);
      roughLine(chrom, ex - ax*l + nx*1.4, ey - ay*l + ny*1.4, ex + ax*l + nx*1.4, ey + ay*l + ny*1.4, sd + k*7, 1);
    }
    co.lineCap = 'round';
    co.strokeStyle = '#ffd65a'; co.globalAlpha = .7; co.lineWidth = .9; co.stroke(fib);
    co.globalAlpha = .35; co.lineWidth = .6; co.stroke(fib2);
    co.strokeStyle = '#ffeb8a'; co.globalAlpha = .8; co.lineWidth = .8; co.stroke(rays);
    co.strokeStyle = '#fff3b0'; co.globalAlpha = .9; co.lineWidth = 1; co.stroke(poles);
    co.strokeStyle = '#ff9fc4'; co.globalAlpha = .85; co.lineWidth = 1.3; co.stroke(chrom);
    co.globalAlpha = 1; co.lineCap = 'butt';
  }
  function drawBubbles(){
    const byCol = new Map(), hi = new Path2D();
    for (const b of bubbles){
      const r = b.r*K;
      co.globalAlpha = .18; co.fillStyle = b.c; co.beginPath(); co.arc(b.x, b.y, r, 0, TAU); co.fill();
      roughEllipse(batch(byCol, b.c), b.x, b.y, r, r*(.92 + .08*Math.sin(t + b.ph)), 0, b.ph*80, 0);
      if (r > 3){ hi.moveTo(b.x - r*.35 + .8, b.y - r*.35); hi.arc(b.x - r*.35, b.y - r*.35, .8, 0, TAU); }
    }
    co.globalAlpha = 1;
    strokeBatches(byCol, 1, .9);
    co.fillStyle = '#e8f6ff'; co.globalAlpha = .8; co.fill(hi); co.globalAlpha = 1;
  }
  function drawBurst(b){
    const R = b.R*K, breathe = 1 + .05*Math.sin(t*.9 + b.ph), sd = b.ph*100;
    const g = co.createRadialGradient(b.x, b.y, 0, b.x, b.y, R*.9);
    g.addColorStop(0, 'rgba(120,255,235,.1)'); g.addColorStop(1, 'rgba(120,255,235,0)');
    co.fillStyle = g; co.beginPath(); co.arc(b.x, b.y, R*.9, 0, TAU); co.fill();
    const cr = Math.cos(b.rot), sr = Math.sin(b.rot);
    const place = (p, scale) => {
      const a = p.a + Math.sin(t*p.sp*.5 + p.ph)*p.wob, rr = p.r*R*breathe*scale;
      const lx = (p.ox*R + Math.cos(a)*rr)*b.sx, ly = (p.oy*R + Math.sin(a)*rr)*b.sy;
      return [b.x + lx*cr - ly*sr, b.y + lx*sr + ly*cr, Math.atan2(ly, lx) + b.rot];
    };
    const fil = new Path2D();
    b.petals.forEach((p, i) => { if (!p.line) return; const [px, py] = place(p, .85); roughLine(fil, b.x, b.y, px, py, sd + i, 0); });
    co.strokeStyle = '#d8fff7'; co.globalAlpha = .28; co.lineWidth = .6; co.stroke(fil);
    // seeds: mix of quick pencil flicks and little looped ovals
    const flicks = new Map(), loops = new Map();
    b.petals.forEach((p, i) => {
      const [px, py, a] = place(p, 1 + .06*Math.sin(t*p.sp + p.ph)), lx = p.len*K*.5, ly = p.w*K*.5;
      if (rh(sd, i) < .5){
        const ca = Math.cos(a), sa = Math.sin(a), q = batch(flicks, p.c);
        roughLine(q, px - ca*lx, py - sa*lx, px + ca*lx, py + sa*lx, sd + i, 0);
        if (rh(sd, i + .5) < .4) roughLine(q, px - ca*lx*.8 + sa, py - sa*lx*.8 - ca, px + ca*lx*.9 + sa, py + sa*lx*.9 - ca, sd + i, 1);
      } else roughEllipse(batch(loops, p.c), px, py, lx, ly, a, sd + i, 0);
    });
    co.lineCap = 'round';
    strokeBatches(flicks, 1.4, .9);
    strokeBatches(loops, 1, .85);
    co.lineCap = 'butt';
    const r0 = R*.13, core = new Path2D();
    roughEllipse(core, b.x, b.y, r0, r0, 0, sd, 0); roughEllipse(core, b.x, b.y, r0*1.05, r0*.98, 0, sd, 1);
    roughEllipse(core, b.x, b.y, r0*.6, r0*.6, 0, sd + 3, 0);
    co.strokeStyle = '#c8fff6'; co.globalAlpha = .85; co.lineWidth = .9; co.stroke(core);
    co.fillStyle = '#f2fffc';
    for (const c of b.core){ co.beginPath(); co.arc(b.x + c[0]*r0, b.y + c[1]*r0, c[2]*.8, 0, TAU); co.fill(); }
    co.globalAlpha = 1;
  }
  function drawOrg(){
    co.setTransform(ds, 0, 0, ds, 0, 0); co.globalCompositeOperation = 'source-over'; co.globalAlpha = 1;
    co.clearRect(0, 0, W, H);
    co.globalCompositeOperation = 'lighter';
    for (const p of parts){ co.globalAlpha = p.a; co.fillStyle = p.c; co.beginPath(); co.arc(p.x, p.y, p.s, 0, TAU); co.fill(); }
    co.globalAlpha = .8;
    for (const c of clumps) for (const q of c.pts){ co.fillStyle = q[3]; co.fillRect(c.x + q[0]*K, c.y + q[1]*K, q[2], q[2]); }
    co.globalAlpha = 1; co.globalCompositeOperation = 'source-over';

    if (S.protein) foams.forEach(drawFoam);
    if (S.coral) fans.forEach(drawColony);
    rods.forEach(drawRod);
    if (S.protein){ proteins.forEach(drawProtein); stars.forEach(drawStar); }
    vesicles.forEach(drawSpindle);
    drawBubbles();
    if (S.half){
      // halftone blobs: thick rim stroked first, fills on top hide the inner seams so only the outer outline shows
      for (const d of dots){
        const r = d.r*K*(1 + .06*Math.sin(t*.9 + d.ph));
        co.beginPath();
        for (const l of d.lobes){
          const lx = d.x + l.dx*r*.95 + Math.sin(t*.5 + l.ph)*r*.12, ly = d.y + l.dy*r*.95 + Math.cos(t*.45 + l.ph)*r*.12, lr = r*l.r;
          co.moveTo(lx + lr, ly); co.arc(lx, ly, lr, 0, TAU);
        }
        co.strokeStyle = d.pal.rim; co.globalAlpha = .14; co.lineWidth = 11; co.stroke();
        co.globalAlpha = 1; co.lineWidth = 4.5; co.stroke();
        co.fillStyle = d.pal.base; co.fill();
        co.fillStyle = d.pal.dots; co.fill();
      }
    }
    if (S.burst) bursts.forEach(drawBurst);

    if (S.plexus){
      const pts = trackers.filter(tk => tk.b && (S.track || tk.pinned)).map(tk => [tk.b.x + tk.b.w/2, tk.b.y + tk.b.h/2])
        .concat(S.protein ? proteins.map(p => [p.x, p.y]).concat(stars.map(s => [s.x, s.y])) : [])
        .concat(S.burst ? bursts.map(b => [b.x, b.y]) : []);
      const maxD = Math.hypot(W, H)*.38, seen = new Set();
      co.strokeStyle = 'rgba(140,255,235,.36)'; co.lineWidth = .9; co.beginPath();
      pts.forEach((p, i) => {
        const near = pts.map((q, j) => [Math.hypot(q[0] - p[0], q[1] - p[1]), j]).filter(d => d[1] !== i && d[0] < maxD).sort((a, b) => a[0] - b[0]).slice(0, 2);
        for (const [, j] of near){ const key = i < j ? i + ':' + j : j + ':' + i; if (seen.has(key)) continue; seen.add(key);
          co.moveTo(p[0], p[1]); co.lineTo(pts[j][0], pts[j][1]); }
      });
      co.stroke();
      co.strokeStyle = 'rgba(180,255,245,.7)'; co.lineWidth = 1;
      for (const p of pts){ co.beginPath(); co.arc(p[0], p[1], 2.6, 0, TAU); co.stroke(); }
    }
  }

  /* ================= HUD layer ================= */
  function brackets(x, y, w, h, k){
    ch.beginPath();
    ch.moveTo(x, y + k); ch.lineTo(x, y); ch.lineTo(x + k, y);
    ch.moveTo(x + w - k, y); ch.lineTo(x + w, y); ch.lineTo(x + w, y + k);
    ch.moveTo(x + w, y + h - k); ch.lineTo(x + w, y + h); ch.lineTo(x + w - k, y + h);
    ch.moveTo(x + k, y + h); ch.lineTo(x, y + h); ch.lineTo(x, y + h - k);
    ch.stroke();
  }
  function slicedDraw(src, x, y, w, h, n, amp){
    for (let i = 0; i < n; i++){
      const sy = i/n;
      ch.drawImage(src, 0, sy*src.height, src.width, src.height/n, x + rnd(-amp, amp), y + sy*h, w, h/n + 1);
    }
  }

  function drawBox(tk, now){
    const b = tk.b, G = S.glitch, age = (now - tk.born)/1000;
    if (age < .4 && ((age*20)|0) % 2) return;
    if (tk.cur && now - tk.cur.born < 40) return;
    const mode = (tk.mode === 'ascii' && !asciiOn()) || (tk.mode === 'tex' && b.w > 64) ? 'mosh' : tk.mode;
    if (now > tk.nextMosh){
      if (mode === 'mosh') mosh(tk.can, b.x, b.y, b.w, b.h, Math.max(.3, G));
      else if (mode === 'ascii') tk.grid = asciiGrid(b.x, b.y, b.w, b.h);
      tk.nextMosh = now + rnd(60,140);
    }
    const src = mode === 'mosh' ? tk.can : GT[tk.tex];
    let x = Math.round(b.x) + .5; const y = Math.round(b.y) + .5, w = Math.round(b.w), h = Math.round(b.h);
    const jit = Math.random() < .07*G;
    if (jit) x += Math.round(rnd(-7,7)*G);
    if (mode === 'ascii'){
      ch.globalAlpha = .6; ch.fillStyle = '#010305'; ch.fillRect(x, y, w, h);
      ch.save(); ch.beginPath(); ch.rect(x, y, w, h); ch.clip();
      const off = Math.random() < .06*G ? Math.round(rnd(-3,3))*CW : 0;
      drawAscii(tk.grid, x + off, y, '#a8fff4', .92);
      ch.restore();
    } else {
      ch.globalAlpha = .86;
      if (Math.random() < .14*G) slicedDraw(src, x, y, w, h, 3 + (Math.random()*4|0), 12*G);
      else ch.drawImage(src, x, y, w, h);
    }
    if (Math.random() < .02*G){ ch.globalAlpha = .7; ch.fillStyle = '#fff'; ch.fillRect(x, y, w, h); }
    ch.globalAlpha = 1; ch.lineWidth = 1;
    if (jit || tk.style === 2){
      ch.strokeStyle = 'rgba(255,79,216,.85)'; ch.strokeRect(x + 2, y + 1, w, h);
      ch.strokeStyle = 'rgba(127,243,234,.85)'; ch.strokeRect(x - 2, y - 1, w, h);
    }
    ch.strokeStyle = 'rgba(255,255,255,.95)';
    if (tk.style === 1){ brackets(x - 3, y - 3, w + 6, h + 6, Math.min(10, w*.3)); ch.globalAlpha = .45; ch.strokeRect(x, y, w, h); ch.globalAlpha = 1; }
    else ch.strokeRect(x, y, w, h);
    ch.font = FONT; ch.fillStyle = tk.pinned ? '#ffb07a' : '#fff';
    const txt = tk.label ? (now - tk.born < 420 ? 'ACQUIRING ' + scramble(tk.s.id) : tk.label)
      : (tk.pinned ? 'PIN ' : '') + idText(tk.cur ? tk.cur.id : tk.id, tk.born, now);
    // keep long labels on screen
    const tw = tk.label ? ch.measureText(txt).width : 0;
    ch.fillText(txt, Math.max(6, Math.min(x + 2, W - 6 - tw)), y - 4);
    ch.font = FONT_S; const cx = x + w/2, cy = y + h/2;
    for (const f of tk.frags){
      const fx = Math.round(cx + f.dx*w) + .5, fy = Math.round(cy + f.dy*h) + .5, s = f.s*K;
      ch.globalAlpha = .7; ch.drawImage(src, 0, 0, src.width*.4, src.height*.4, fx, fy, s, s*.75);
      ch.globalAlpha = .85; ch.strokeStyle = 'rgba(255,255,255,.75)'; ch.strokeRect(fx, fy, Math.round(s), Math.round(s*.75));
      ch.fillStyle = '#fff'; ch.fillText(idText(f.id, tk.born, now), fx + s + 2, fy + 8);
    }
    ch.globalAlpha = 1;
  }

  function drawRBoxes(now){
    const vis = rboxes.filter(b => { const a = now - b.born, l = b.until - now;
      if (a < 0 || hitsText(b.x - b.w/2, b.y - b.h/2, b.w + 40, b.h)) return false; if (a < 300 && ((a/45)|0) % 2) return false; if (l < 300 && ((l/45)|0) % 2) return false; return true; });
    // plexus between neighbouring random boxes
    if (S.plexus){
    ch.strokeStyle = 'rgba(150,255,238,.32)'; ch.lineWidth = .8; ch.beginPath();
    for (const a of vis){
      let best = null, bd = 280;
      for (const b of vis){ if (b === a) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bd){ bd = d; best = b; } }
      if (best){ ch.moveTo(a.x, a.y); ch.lineTo(best.x, best.y); }
    }
    ch.stroke();
    }
    const G = S.glitch;
    for (const bx of vis){
      const w = Math.round(Math.min(bx.w, S.boxMax)), h = Math.round(Math.min(bx.h, S.boxMax*.8));
      let x = Math.round(bx.x - w/2) + .5; const y = Math.round(bx.y - h/2) + .5;
      const mode = bx.mode === 'ascii' && !asciiOn() ? 'mosh' : bx.mode;
      if (now > bx.next){
        if (mode === 'mosh') mosh(bx.can, bx.x - w/2, bx.y - h/2, w, h, Math.max(.3, G));
        else if (mode === 'ascii') bx.grid = asciiGrid(bx.x - w/2, bx.y - h/2, w, h);
        bx.next = now + rnd(70,160);
      }
      if (Math.random() < .05*G) x += Math.round(rnd(-5,5)*G);
      if (mode === 'ascii'){
        ch.globalAlpha = .6; ch.fillStyle = '#010305'; ch.fillRect(x, y, w, h);
        ch.save(); ch.beginPath(); ch.rect(x, y, w, h); ch.clip(); drawAscii(bx.grid, x, y, '#a8fff4', .92); ch.restore();
      } else {
        const src = mode === 'mosh' ? bx.can : GT[bx.tex];
        ch.globalAlpha = .86;
        if (Math.random() < .1*G) slicedDraw(src, x, y, w, h, 2 + (Math.random()*3|0), 6*G); else ch.drawImage(src, x, y, w, h);
      }
      ch.globalAlpha = 1; ch.lineWidth = 1; ch.strokeStyle = 'rgba(255,255,255,.92)'; ch.strokeRect(x, y, w, h);
      ch.font = w < 28 ? FONT_S : FONT; ch.fillStyle = '#fff'; ch.fillText(idText(bx.id, bx.born, now), x + w + 3, y + 9);
    }
    ch.globalAlpha = 1;
  }
  function drawGroup(tk, now){
    const s = tk.s, G = S.glitch, left = tk.until - now;
    const vis = tk.boxes.filter((bx, i) => {
      const age = now - tk.born - bx.delay;
      if (age < 0) return false;
      if (age < 380 && ((age/45)|0) % 2) return false;
      const out = left - (tk.boxes.length - 1 - i)*110;
      if (out < 380 && ((out/45)|0) % 2) return false;
      return out > 0;
    });
    if (!vis.length) return;
    // plexus inside the group: a loop around the structure plus spokes to a hub node
    const hub = [s.cx, s.cy];
    if (S.plexus){
    const pts = vis.map(bx => [bx.x, bx.y, Math.atan2(bx.y - hub[1], bx.x - hub[0])]).sort((a, b) => a[2] - b[2]);
    ch.strokeStyle = 'rgba(150,255,238,.5)'; ch.lineWidth = .9; ch.beginPath();
    pts.forEach((p, i) => {
      ch.moveTo(hub[0], hub[1]); ch.lineTo(p[0], p[1]);
      if (pts.length > 1 && (i < pts.length - 1 || pts.length > 2)){ const q = pts[(i + 1) % pts.length]; ch.moveTo(p[0], p[1]); ch.lineTo(q[0], q[1]); }
    });
    ch.stroke();
    ch.fillStyle = '#c8fff6'; ch.beginPath(); ch.arc(hub[0], hub[1], 2.4, 0, TAU); ch.fill();
    ch.strokeStyle = 'rgba(200,255,248,.8)'; ch.beginPath(); ch.arc(hub[0], hub[1], 5, 0, TAU); ch.stroke();
    }
    ch.font = FONT_S;
    for (const bx of vis){
      const w = Math.round(Math.min(bx.w, S.boxMax)), h = Math.round(Math.min(bx.h, S.boxMax*.8));
      let x = Math.round(bx.x - w/2) + .5; const y = Math.round(bx.y - h/2) + .5;
      const mode = bx.mode === 'ascii' && !asciiOn() ? 'mosh' : bx.mode;
      if (now > bx.next){
        if (mode === 'mosh') mosh(bx.can, bx.x - w/2, bx.y - h/2, w, h, Math.max(.3, G));
        else if (mode === 'ascii') bx.grid = asciiGrid(bx.x - w/2, bx.y - h/2, w, h);
        bx.next = now + rnd(70,160);
      }
      const jit = Math.random() < .05*G; if (jit) x += Math.round(rnd(-5,5)*G);
      if (mode === 'ascii'){
        ch.globalAlpha = .6; ch.fillStyle = '#010305'; ch.fillRect(x, y, w, h);
        ch.save(); ch.beginPath(); ch.rect(x, y, w, h); ch.clip(); drawAscii(bx.grid, x, y, '#a8fff4', .92); ch.restore();
      } else {
        const src = mode === 'mosh' ? bx.can : GT[bx.tex];
        ch.globalAlpha = .86;
        if (Math.random() < .1*G) slicedDraw(src, x, y, w, h, 2 + (Math.random()*3|0), 6*G); else ch.drawImage(src, x, y, w, h);
      }
      ch.globalAlpha = 1; ch.lineWidth = 1;
      if (jit){ ch.strokeStyle = 'rgba(255,79,216,.8)'; ch.strokeRect(x + 2, y + 1, w, h); }
      ch.strokeStyle = 'rgba(255,255,255,.95)'; ch.strokeRect(x, y, w, h);
      ch.font = FONT; ch.fillStyle = '#fff'; ch.fillText(idText(bx.id, tk.born + bx.delay, now), x + w + 3, y + 9);
    }
    ch.globalAlpha = 1;
  }
  function drawSwarm(tk, now){
    const s = tk.s, G = Math.max(.3, S.glitch), age = (now - tk.born)/1000;
    if (age < .35 && ((age*24)|0) % 2) return;
    if (now > tk.nextJump){
      for (const it of tk.items) if (Math.random() < .35){
        it.dx = Math.max(-1.2, Math.min(1.2, it.dx + rnd(-.3,.3))); it.dy = Math.max(-1.2, Math.min(1.2, it.dy + rnd(-.3,.3)));
        if (Math.random() < .2) it.fill = !it.fill;
      }
      tk.nextJump = now + rnd(90,240)/G;
    }
    const R = s.cr*1.05; ch.font = FONT_S; ch.lineWidth = 1;
    for (const it of tk.items){
      const x = Math.round(s.cx + it.dx*R) + .5, y = Math.round(s.cy + it.dy*R) + .5, w = Math.round(it.w*K), h = Math.round(it.h*K);
      if (it.fill){ ch.globalAlpha = .78; ch.drawImage(GT[it.tex], x, y, w, h); }
      ch.globalAlpha = .9; ch.strokeStyle = 'rgba(255,255,255,.85)'; ch.strokeRect(x, y, w, h);
      ch.fillStyle = '#fff'; ch.fillText(idText(it.id, tk.born, now), x + w + 2, y + 8);
    }
    ch.globalAlpha = 1;
  }

  function drawHover(now){
    const s = hov.s; if (!s || hov.str < .02) return;
    const a = hov.str, R = s.cr*1.05;
    const x = Math.round(s.cx - R) + .5, y = Math.round(s.cy - R*.85) + .5, w = Math.round(R*2), h = Math.round(R*1.7);
    ch.globalAlpha = .2*a; ch.strokeStyle = '#7ff3ea'; ch.lineWidth = 1; ch.setLineDash([2,5]); ch.beginPath();
    ch.moveTo(0, s.cy); ch.lineTo(x, s.cy); ch.moveTo(x + w, s.cy); ch.lineTo(W, s.cy);
    ch.moveTo(s.cx, 0); ch.lineTo(s.cx, y); ch.moveTo(s.cx, y + h); ch.lineTo(s.cx, H); ch.stroke(); ch.setLineDash([]);
    // lock box: a clean rectangle over the structure, labels below
    ch.globalAlpha = a;
    ch.strokeStyle = 'rgba(255,79,216,.45)'; ch.strokeRect(x + 1, y, w, h);
    ch.strokeStyle = '#fff'; ch.strokeRect(x, y, w, h); brackets(x - 6, y - 6, w + 12, h + 12, 12);
    const locking = now - hov.since < 420;
    const l1 = `${locking ? 'ACQUIRING' : 'LOCK'} PRT-${locking ? scramble(s.id) : s.id}`;
    const l2 = `${s.kind} · Ø${(s.cr*.2).toFixed(1)}µm · CONF ${(.82 + (s.id % 17)/100).toFixed(2)}`;
    ch.font = FONT; const tw = Math.max(ch.measureText(l1).width, ch.measureText(l2).width) + 10;
    const ly = y - 34 < 4 ? y + h + 6 : y - 34;
    ch.fillStyle = 'rgba(255,255,255,.94)'; ch.fillRect(x - .5, ly, tw, 15);
    ch.fillStyle = '#010305'; ch.fillText(l1, x + 4, ly + 11);
    ch.fillStyle = '#fff'; ch.fillText(l2, x + 2, ly + 28);
    if (now > hov.nextSub){
      hov.subs = Array.from({length: 2 + (Math.random()*3|0)}, () => ({dx: rnd(-.5,1.5), dy: rnd(-.4,1.4), w: rnd(8,20), h: rnd(6,12), id: s.id + (Math.random()*90|0), tex: Math.random()*4|0}));
      hov.nextSub = now + rnd(380,700);
    }
    ch.font = FONT_S;
    for (const sb of hov.subs){
      const sx = Math.round(x + sb.dx*w*.65) + .5, sy = Math.round(y + sb.dy*h*.7) + .5;
      ch.globalAlpha = .8*a; ch.drawImage(GT[sb.tex], sx, sy, sb.w, sb.h);
      ch.globalAlpha = a; ch.strokeStyle = 'rgba(255,255,255,.85)'; ch.strokeRect(sx, sy, Math.round(sb.w), Math.round(sb.h));
      ch.fillStyle = '#fff'; ch.fillText(String(sb.id), sx + sb.w + 2, sy + 8);
    }
    ch.globalAlpha = 1;
  }

  function drawDust(){
    if (!S.ascii) return;
    ch.font = ASCII_FONT;
    for (const d of dust){
      ch.fillStyle = d.hex ? '#ffb07a' : '#9ff7ef'; ch.globalAlpha = d.hex ? .45 : .38;
      d.grid.forEach((row, r) => ch.fillText(row, d.x, d.y + r*8));
    }
    ch.globalAlpha = 1;
  }

  function drawHud(now){
    if (now > gNext){ glitchTex(GT[gIdx]); gIdx = (gIdx + 1) % GT.length; gNext = now + 80; }
    ch.setTransform(ds, 0, 0, ds, 0, 0); ch.globalAlpha = 1; ch.clearRect(0, 0, W, H);
    ch.imageSmoothingEnabled = false; ch.textBaseline = 'alphabetic';
    drawDust();
    if (S.track) drawRBoxes(now);
    for (const tk of trackers){
      if (!tk.b || (!S.track && !tk.pinned)) continue;
      if (tk.type === 'step' && hitsText(tk.b.x - 40, tk.b.y - 20, tk.b.w + 80, tk.b.h + 40)) continue; // label and fragments included
      if (tk.type === 'swarm') drawSwarm(tk, now); else if (tk.type === 'group') drawGroup(tk, now); else drawBox(tk, now);
    }
    drawHover(now);
  }

  /* ================= GL render ================= */
  function renderGL(now){
    if (!prog) return 0;
    let sn = 0, vn = 0, bn = 0, cn = 0;
    if (cur.r > .5){ sArr[0] = cur.x; sArr[1] = cur.y; sArr[2] = cur.r; sArr[3] = 0; sn = 1; }
    const order = clusters.filter(c => !c.dying).concat(clusters.filter(c => c.dying));
    for (const c of order) for (const b of c.blobs){
      if (b.rr < .5) continue;
      if (c.type === 0){ if (sn < 24){ const o = sn*4; sArr[o] = b.x; sArr[o+1] = b.y; sArr[o+2] = b.rr; sn++; } }
      else if (c.type === 1){ if (vn < 24){ const o = vn*4; vArr[o] = b.x; vArr[o+1] = b.y; vArr[o+2] = b.rr; vn++; } }
      else if (bn < 24){ const o = bn*4; bArr[o] = b.x; bArr[o+1] = b.y; bArr[o+2] = b.rr; bn++; }
    }
    const putC = (x, y, r, s) => { if (cn >= 20 || r < .5) return; const o = cn*4; cArr[o] = x; cArr[o+1] = y; cArr[o+2] = r; cArr[o+3] = s; cn++; };
    for (const v of vesicles) putC(v.x, v.y, v.rr, v.seed);
    for (const v of vesicles) for (const d of v.daughters) putC(d.x, d.y, d.rr, d.seed);
    for (const d of donuts) putC(d.x, d.y, d.r*K, d.seed);

    const hs = hov.s && hov.str > .02 ? hov.s : null;
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uScale, glc.width/W); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uReal, now/1000 % 1000);
    gl.uniform1f(U.uCell, S.cell); gl.uniform1f(U.uGlow, S.glow);
    gl.uniform4f(U.uHov, hs ? hs.cx : -1e4, hs ? hs.cy : -1e4, hs ? hs.cr*1.05 : 1, hs ? hov.str*Math.min(1, .35 + S.glitch*.4) : 0);
    gl.uniform4fv(U.uS, sArr); gl.uniform4fv(U.uV, vArr); gl.uniform4fv(U.uB, bArr); gl.uniform4fv(U.uC, cArr);
    const xn = Math.min(4, exclusion.length);
    exclusion.slice(0, 4).forEach((r, i) => xArr.set([r.l, r.t, r.r, r.b], i*4));
    gl.uniform4fv(U.uX, xArr); gl.uniform1i(U.uXN, xn);
    gl.uniform1i(U.uSN, sn); gl.uniform1i(U.uVN, vn); gl.uniform1i(U.uBN, bn); gl.uniform1i(U.uCN, cn);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return sn + vn + bn + cn;
  }

  /* ================= loop + controls ================= */
  const fmt = s => { const m = Math.floor(s/60), r = s - m*60; return String(m).padStart(2,'0') + ':' + r.toFixed(1).padStart(4,'0'); };
  let lastT = performance.now(), hudNext = 0, fpsS = 60;

  function frame(now){
    if (destroyed) return;
    // rAF stamps the frame start, which can precede the performance.now() taken in start()
    const rdt = Math.max(0, Math.min(.05, (now - lastT)/1000)); lastT = now;
    const dt = S.paused ? 0 : rdt*S.speed; t += dt;
    BF = reduced ? 0 : Math.floor(now/1000*(S.speed < .5 ? 4 : 9));
    update(dt, rdt, now);
    renderGL(now);
    drawOrg();
    drawHud(now);
    fpsS += ((rdt > 0 ? 1/rdt : 60) - fpsS)*.05;
    if (readout && now > hudNext){
      hudNext = now + 250;
      readout.textContent = ['CELL-TRACK', readoutLabel, `T+${fmt(t)}`, `${Math.round(fpsS)} FPS`, S.paused && 'PAUSED'].filter(Boolean).join(' · ');
    }
    raf = win.requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && !destroyed){ lastT = performance.now(); raf = win.requestAnimationFrame(frame); } };
  const stop = () => { win.cancelAnimationFrame(raf); raf = 0; };
  // nothing to draw in a background tab
  on(doc, 'visibilitychange', () => doc.hidden ? stop() : start());

  /* Tune panel: hidden unless the URL has ?tune or T is pressed */
  const tune = doc.createElement('aside');
  tune.className = 'cf-tune'; tune.dataset.content = ''; tune.innerHTML = TUNE_HTML;
  // a small collapsed "Tune" toggle is always there; ?tune opens it, T hides or shows it
  tune.querySelector('details').open = new URLSearchParams(win.location.search).has('tune');
  doc.body.appendChild(tune);
  const fmtV = {cell: v => v + 'px', speed: v => v.toFixed(2), glow: v => v.toFixed(2), glitch: v => v.toFixed(2), boxMax: v => v + 'px'};
  const pb = tune.querySelector('[data-b="pause"]');
  function syncTune(){
    for (const el of tune.querySelectorAll('[data-k]')){ const k = el.dataset.k; el.value = S[k]; tune.querySelector(`[data-o="${k}"]`).textContent = fmtV[k](S[k]); }
    for (const el of tune.querySelectorAll('[data-t]')) el.checked = S[el.dataset.t];
    pb.textContent = S.paused ? 'Play' : 'Pause';
  }
  on(tune, 'input', e => {
    const k = e.target.dataset.k, tg = e.target.dataset.t;
    if (k){ S[k] = parseFloat(e.target.value); tune.querySelector(`[data-o="${k}"]`).textContent = fmtV[k](S[k]); }
    if (tg) S[tg] = e.target.checked;
  });
  on(tune.querySelector('[data-b="reseed"]'), 'click', seed);
  on(pb, 'click', () => { S.paused = !S.paused; syncTune(); });
  on(win, 'keydown', e => {
    if (e.key !== 't' && e.key !== 'T') return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const el = e.target;
    if (el instanceof Element && (el.closest('input, textarea, select, [contenteditable]'))) return;
    tune.hidden = !tune.hidden;
  });

  function setOptions(o = {}){
    for (const k in o) if (k in S) S[k] = o[k];
    if ('exclusionRects' in o) setExclusion(o.exclusionRects);
    if ('readout' in o) readout = o.readout || null;
    if ('readoutLabel' in o) readoutLabel = o.readoutLabel || '';
    if ('tune' in o) tune.hidden = o.tune === false;
    if ('scale' in o) fitK();
    capMotion();
    syncTune();
  }

  function destroy(){
    if (destroyed) return;
    destroyed = true; stop();
    for (const off of offs) off();
    gl.deleteProgram(prog);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    for (const c of [glc, orc, hdc]) c.remove();
    tune.remove();
    if (readout) readout.textContent = '';
  }

  setOptions(options);
  seed();
  start();
  return {destroy, setOptions, pinNear};
}
