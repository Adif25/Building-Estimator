'use strict';

// ── Construction Animation Engine (Three.js) ────────────────────────────────
// Renders a real-time 3D build sequence scaled to the client's exact dimensions.
// No API calls — starts instantly in the browser.

let _renderer, _scene, _camera, _animId, _clock;
let _phases = [];
let _onPhaseChange = null;
let _totalDuration = 0;
let _playing = false;

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function makeBox(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function placeMesh(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  mesh.userData.baseY = y;
  return mesh;
}

// ── Deck ─────────────────────────────────────────────────────────────────────

function buildDeckScene(scene, length, width) {
  const L = Math.min(length, 30);
  const W = Math.min(width, 20);
  const POST_H = 2.8;

  const phases = [];

  // Phase 1 — Posts
  const postObjs = [];
  const colCount = Math.max(2, Math.ceil(L / 7) + 1);
  const rowCount = 2;
  for (let c = 0; c < colCount; c++) {
    for (let r = 0; r < rowCount; r++) {
      const x = -L / 2 + (L / (colCount - 1)) * c;
      const z = r === 0 ? -W / 2 : W / 2;
      const post = makeBox(0.3, POST_H, 0.3, 0x3e2723);
      scene.add(placeMesh(post, x, POST_H / 2, z));
      postObjs.push(post);
    }
  }
  phases.push({ label: 'Setting posts & footings', startTime: 0.5, duration: 2.5, objects: postObjs });

  // Phase 2 — Beams
  const beamObjs = [];
  for (const z of [-W / 2, W / 2]) {
    const beam = makeBox(L, 0.35, 0.35, 0x5d4037);
    scene.add(placeMesh(beam, 0, POST_H + 0.18, z));
    beamObjs.push(beam);
  }
  phases.push({ label: 'Installing beams & ledger', startTime: 3, duration: 1.5, objects: beamObjs });

  // Phase 3 — Joists
  const joistObjs = [];
  const joistCount = Math.floor(L / 1.33) + 1;
  for (let i = 0; i <= joistCount; i++) {
    const x = -L / 2 + (L / joistCount) * i;
    const joist = makeBox(0.18, 0.28, W, 0x6d4c41);
    scene.add(placeMesh(joist, x, POST_H + 0.5, 0));
    joistObjs.push(joist);
  }
  phases.push({ label: 'Hanging joists 16″ on center', startTime: 4.5, duration: 2, objects: joistObjs });

  // Phase 4 — Deck boards
  const boardObjs = [];
  const boardW = 0.48;
  const boardCount = Math.floor(W / boardW);
  for (let i = 0; i < boardCount; i++) {
    const z = -W / 2 + boardW * i + boardW / 2;
    const board = makeBox(L, 0.09, boardW - 0.04, i % 2 === 0 ? 0x8d6e63 : 0xa1887f);
    scene.add(placeMesh(board, 0, POST_H + 0.68, z));
    boardObjs.push(board);
  }
  phases.push({ label: 'Laying deck boards', startTime: 6.5, duration: 5, objects: boardObjs });

  const total = 13;
  const cx = 0, cy = Math.max(L, W) * 0.38, cz = Math.max(L, W) * 0.9;
  return { phases, total, camStart: [cx, cy, cz], camLookAt: [0, POST_H / 2, 0] };
}

// ── Fence ────────────────────────────────────────────────────────────────────

function buildFenceScene(scene, length, height) {
  const L = Math.min(length, 50);
  const H = Math.max(2, Math.min(height, 8));
  const phases = [];

  // Posts
  const postObjs = [];
  const spacing = 8;
  const postCount = Math.ceil(L / spacing) + 1;
  for (let i = 0; i < postCount; i++) {
    const x = -L / 2 + (L / (postCount - 1)) * i;
    const post = makeBox(0.35, H + 0.4, 0.35, 0x4e342e);
    scene.add(placeMesh(post, x, (H + 0.4) / 2, 0));
    postObjs.push(post);
  }
  phases.push({ label: 'Setting posts in concrete', startTime: 0.5, duration: 2.5, objects: postObjs });

  // Rails
  const railObjs = [];
  for (const rh of [H * 0.22, H * 0.78]) {
    const rail = makeBox(L, 0.18, 0.14, 0x6d4c41);
    scene.add(placeMesh(rail, 0, rh, 0));
    railObjs.push(rail);
  }
  phases.push({ label: 'Installing top & bottom rails', startTime: 3, duration: 1.5, objects: railObjs });

  // Pickets
  const picketObjs = [];
  const pSpacing = 0.55;
  const picketCount = Math.floor(L / pSpacing);
  for (let i = 0; i < picketCount; i++) {
    const x = -L / 2 + pSpacing * i + pSpacing / 2;
    const picket = makeBox(0.13, H - 0.15, 0.09, i % 2 === 0 ? 0x8d6e63 : 0xa1887f);
    scene.add(placeMesh(picket, x, (H - 0.15) / 2, 0));
    picketObjs.push(picket);
  }
  phases.push({ label: 'Nailing pickets to rails', startTime: 4.5, duration: 5, objects: picketObjs });

  const total = 11;
  return { phases, total, camStart: [0, H * 1.2, H * 3.5], camLookAt: [0, H / 2, 0] };
}

// ── Shed ─────────────────────────────────────────────────────────────────────

function buildShedScene(scene, length, width, height) {
  const L = Math.min(length, 20);
  const W = Math.min(width, 16);
  const H = Math.min(height, 12);
  const phases = [];

  // Floor frame
  const floor = makeBox(L, 0.2, W, 0x4a3728);
  scene.add(placeMesh(floor, 0, 0.1, 0));
  phases.push({ label: 'Building floor frame', startTime: 0.5, duration: 1.5, objects: [floor] });

  // Stud walls — show as wireframe frames
  const wallObjs = [];
  const studH = H;
  const studSpacing = 1.33;

  // Front & back walls (along X)
  for (const z of [-W / 2, W / 2]) {
    const studCount = Math.ceil(L / studSpacing) + 1;
    for (let i = 0; i < studCount; i++) {
      const x = -L / 2 + (L / (studCount - 1)) * i;
      const stud = makeBox(0.15, studH, 0.15, 0x6d4c41);
      scene.add(placeMesh(stud, x, studH / 2 + 0.2, z));
      wallObjs.push(stud);
    }
    // Top plate
    const plate = makeBox(L, 0.15, 0.15, 0x5d4037);
    scene.add(placeMesh(plate, 0, studH + 0.2, z));
    wallObjs.push(plate);
  }
  // Side walls (along Z)
  for (const x of [-L / 2, L / 2]) {
    const studCount = Math.ceil(W / studSpacing) + 1;
    for (let i = 0; i < studCount; i++) {
      const z = -W / 2 + (W / (studCount - 1)) * i;
      const stud = makeBox(0.15, studH, 0.15, 0x6d4c41);
      scene.add(placeMesh(stud, x, studH / 2 + 0.2, z));
      wallObjs.push(stud);
    }
    const plate = makeBox(0.15, 0.15, W, 0x5d4037);
    scene.add(placeMesh(plate, x, studH + 0.2, 0));
    wallObjs.push(plate);
  }
  phases.push({ label: 'Framing & raising walls', startTime: 2, duration: 3, objects: wallObjs });

  // Roof rafters
  const rafterObjs = [];
  const ridgeH = H + Math.min(L, W) * 0.25;
  const rafterCount = Math.ceil(L / 2) + 1;
  for (let i = 0; i < rafterCount; i++) {
    const x = -L / 2 + (L / (rafterCount - 1)) * i;
    // Two rafters per pair (left slope, right slope)
    for (const side of [-1, 1]) {
      const rafter = makeBox(0.12, 0.12, Math.sqrt(Math.pow(W / 2, 2) + Math.pow(ridgeH - H, 2)) + 0.3, 0x795548);
      const midZ = side * W / 4;
      const midY = H + (ridgeH - H) / 2 + 0.2;
      const angle = Math.atan2(ridgeH - H, W / 2) * side;
      rafter.rotation.x = -angle;
      scene.add(placeMesh(rafter, x, midY, midZ));
      rafterObjs.push(rafter);
    }
  }
  const ridge = makeBox(L, 0.12, 0.12, 0x5d4037);
  scene.add(placeMesh(ridge, 0, ridgeH + 0.2, 0));
  rafterObjs.push(ridge);
  phases.push({ label: 'Installing roof rafters & ridge', startTime: 5, duration: 2.5, objects: rafterObjs });

  const total = 9;
  const r = Math.max(L, W) * 0.9;
  return { phases, total, camStart: [r, H * 1.1, r], camLookAt: [0, H / 2, 0] };
}

// ── Main public API ───────────────────────────────────────────────────────────

function initConstruction(container, projectType, dims, callbacks) {
  stopConstruction();
  container.innerHTML = '';

  const W = container.clientWidth || 700;
  const H = Math.round(W * 0.52);
  container.style.height = H + 'px';

  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(0x141920);
  _scene.fog = new THREE.FogExp2(0x141920, 0.025);

  _camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 300);

  _renderer = new THREE.WebGLRenderer({ antialias: true });
  _renderer.setSize(W, H);
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _renderer.shadowMap.enabled = true;
  _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(_renderer.domElement);

  // Lights
  _scene.add(new THREE.AmbientLight(0xd0e8ff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff3d0, 1.4);
  sun.position.set(15, 25, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  _scene.add(sun);
  _scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3a5a3a, 0.4));

  // Ground
  const gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshLambertMaterial({ color: 0x2e4a2e })
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.receiveShadow = true;
  _scene.add(gnd);

  // Grid lines on ground
  const grid = new THREE.GridHelper(40, 40, 0x1a3a1a, 0x1a3a1a);
  grid.position.y = 0.01;
  _scene.add(grid);

  let result;
  const l = dims.length || 16;
  const w = dims.width || 12;
  const h = dims.height || 8;

  if (projectType === 'deck')         result = buildDeckScene(_scene, l, w);
  else if (projectType === 'fence')   result = buildFenceScene(_scene, l, h);
  else if (projectType === 'shedFraming') result = buildShedScene(_scene, l, w, h);
  else result = buildDeckScene(_scene, l, w);

  _phases = result.phases;
  _totalDuration = result.total;

  _camera.position.set(...result.camStart);
  _camera.lookAt(...result.camLookAt);
  const lookTarget = new THREE.Vector3(...result.camLookAt);

  // Hide everything initially
  _phases.forEach(p => p.objects.forEach(o => { o.visible = false; o.scale.y = 0.001; }));

  _onPhaseChange = callbacks && callbacks.onPhase;
  const onProgress = callbacks && callbacks.onProgress;

  _clock = new THREE.Clock();
  _clock.stop();
  _playing = false;

  let lastPhaseIdx = -1;

  function loop() {
    _animId = requestAnimationFrame(loop);
    if (!_playing) { _renderer.render(_scene, _camera); return; }

    const t = _clock.getElapsedTime();
    const progress = Math.min(t / _totalDuration, 1);
    if (onProgress) onProgress(progress);

    // Update each phase
    _phases.forEach((phase, pi) => {
      const phaseT = Math.max(0, Math.min(1, (t - phase.startTime) / phase.duration));
      if (phaseT > 0 && pi !== lastPhaseIdx) {
        lastPhaseIdx = pi;
        if (_onPhaseChange) _onPhaseChange(phase.label, pi, _phases.length);
      }
      phase.objects.forEach((obj, oi) => {
        const delay = (oi / Math.max(phase.objects.length, 1)) * 0.75;
        const op = Math.max(0, Math.min(1, (phaseT - delay) / Math.max(0.001, 1 - delay)));
        const s = easeOut(op);
        obj.visible = s > 0.01;
        obj.scale.y = Math.max(0.001, s);
        // Keep base fixed (grow upward from baseY - h/2)
        const bh = obj.geometry.parameters.height || 1;
        obj.position.y = obj.userData.baseY - bh / 2 * (1 - s);
      });
    });

    // Slow orbit after animation ends
    if (t > _totalDuration * 0.85) {
      const orbit = (t - _totalDuration * 0.85) * 0.15;
      const r = Math.sqrt(result.camStart[0] ** 2 + result.camStart[2] ** 2);
      _camera.position.x = Math.cos(orbit) * r;
      _camera.position.z = Math.sin(orbit) * r;
      _camera.lookAt(lookTarget);
    }

    _renderer.render(_scene, _camera);

    if (t >= _totalDuration && callbacks && callbacks.onComplete) {
      callbacks.onComplete();
    }
  }

  loop();
  return { totalDuration: _totalDuration, phases: _phases.map(p => p.label) };
}

function playConstruction() {
  if (!_clock) return;
  _clock.start();
  _playing = true;
}

function replayConstruction() {
  if (!_clock) return;
  // Reset all objects
  _phases.forEach(p => p.objects.forEach(o => {
    o.visible = false;
    o.scale.y = 0.001;
    o.position.y = o.userData.baseY - 0.5;
  }));
  _clock.start();
  _playing = true;
}

function stopConstruction() {
  _playing = false;
  if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
  if (_renderer) { _renderer.dispose(); _renderer = null; }
  _scene = null; _camera = null; _clock = null; _phases = [];
}
