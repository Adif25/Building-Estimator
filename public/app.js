'use strict';

const form = document.getElementById('estimateForm');
const projectTypeEl = document.getElementById('projectType');
const calcBtn = document.getElementById('calcBtn');
const recalcBtn = document.getElementById('recalcBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultsEl = document.getElementById('results');
const placeholderEl = document.getElementById('placeholder');
const errorEl = document.getElementById('error-msg');
const materialsBody = document.getElementById('materialsBody');
const materialsFoot = document.getElementById('materialsFoot');

const PROJECT_LABELS = {
  deck: 'Wood Deck',
  fence: 'Wood Fence',
  shedFraming: 'Shed Framing',
};

projectTypeEl.addEventListener('change', () => {
  document.querySelectorAll('.dynamic-fields').forEach((el) => el.classList.add('hidden'));
  const type = projectTypeEl.value;
  if (type) {
    document.getElementById(`fields-${type}`)?.classList.remove('hidden');
    calcBtn.disabled = false;
    updateVisuals(type);
  } else {
    calcBtn.disabled = true;
    visualSection.classList.add('hidden');
    clearInterval(slideInterval);
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await runEstimate();
});

recalcBtn.addEventListener('click', async () => {
  await runEstimate();
});

async function runEstimate() {
  const payload = buildPayload();
  if (!payload) return;

  showLoading(true);
  hideError();

  try {
    const res = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Something went wrong.');
      return;
    }
    renderResults(data);
  } catch (err) {
    showError('Could not reach the server. Make sure it is running.');
  } finally {
    showLoading(false);
  }
}

function buildPayload() {
  const type = projectTypeEl.value;
  if (!type) return null;

  const payload = { projectType: type, dimensions: {}, options: {} };

  if (type === 'deck') {
    const length = parseFloat(document.getElementById('deck-length').value);
    const width = parseFloat(document.getElementById('deck-width').value);
    if (!length || !width) { showError('Please enter both length and width.'); return null; }
    payload.dimensions = { length, width };
    payload.options.deckingMaterial = document.getElementById('deck-material').value;
  } else if (type === 'fence') {
    const length = parseFloat(document.getElementById('fence-length').value);
    const height = parseFloat(document.getElementById('fence-height').value);
    if (!length || !height) { showError('Please enter both length and height.'); return null; }
    payload.dimensions = { length, height };
    payload.options.fenceStyle = document.getElementById('fence-style').value;
  } else if (type === 'shedFraming') {
    const length = parseFloat(document.getElementById('shed-length').value);
    const width = parseFloat(document.getElementById('shed-width').value);
    const height = parseFloat(document.getElementById('shed-height').value);
    if (!length || !width || !height) { showError('Please enter length, width, and wall height.'); return null; }
    payload.dimensions = { length, width, height };
    payload.options.roofPitch = document.getElementById('shed-pitch').value;
  }

  return payload;
}

function renderResults(data) {
  const { projectType, dimensions, materials, subtotal, contingency, total } = data;

  const dimParts = [];
  if (dimensions.length) dimParts.push(`${dimensions.length}ft length`);
  if (dimensions.width) dimParts.push(`${dimensions.width}ft width`);
  if (dimensions.height) dimParts.push(`${dimensions.height}ft height`);

  document.getElementById('results-title').textContent = PROJECT_LABELS[projectType] || projectType;
  document.getElementById('results-subtitle').textContent = dimParts.join(' × ');

  materialsBody.innerHTML = '';
  for (const item of materials) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(item.name)}</td>
      <td class="num">${item.quantity}</td>
      <td>${escHtml(item.unit)}</td>
      <td class="num">${item.unitPrice !== null ? fmt(item.unitPrice) : '—'}</td>
      <td class="num">${item.totalPrice !== null ? fmt(item.totalPrice) : '—'}</td>
      <td><span class="badge badge-${item.priceSource}">${item.priceSource}</span></td>
    `;
    materialsBody.appendChild(tr);
  }

  materialsFoot.innerHTML = `
    <tr class="subtotal-row">
      <td colspan="4">Subtotal</td>
      <td class="num">${fmt(subtotal)}</td>
      <td></td>
    </tr>
    <tr class="contingency-row">
      <td colspan="4">Contingency (10%)</td>
      <td class="num">${fmt(contingency)}</td>
      <td></td>
    </tr>
    <tr class="total-row">
      <td colspan="4">Estimated Total</td>
      <td class="num">${fmt(total)}</td>
      <td></td>
    </tr>
  `;

  placeholderEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');
  resultsEl.style.justifyContent = '';

  // Show 3D animation section
  setupAnimationSection(projectType, dimensions);
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showLoading(on) {
  loadingOverlay.classList.toggle('hidden', !on);
  const btnText = calcBtn.querySelector('.btn-text');
  const btnSpinner = calcBtn.querySelector('.btn-spinner');
  calcBtn.disabled = on;
  btnText.textContent = on ? 'Calculating…' : 'Calculate Estimate';
  btnSpinner.classList.toggle('hidden', !on);
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
  resultsEl.classList.add('hidden');
  placeholderEl.classList.add('hidden');
}

function hideError() {
  errorEl.classList.add('hidden');
}

// ── 3D Animation Section ──────────────────────────────────────────────────

const animSection   = document.getElementById('animSection');
const animCanvas    = document.getElementById('animCanvas');
const animPlayBtn   = document.getElementById('animPlayBtn');
const animReplayBtn = document.getElementById('animReplayBtn');
const animDuration  = document.getElementById('animDuration');
const animPhaseTrack = document.getElementById('animPhaseTrack');
const animPhaseLabel = document.getElementById('animPhaseLabel');

let _animReady = false;

function setupAnimationSection(projectType, dimensions) {
  animSection.classList.remove('hidden');
  _animReady = false;
  animPlayBtn.disabled = false;
  animPlayBtn.textContent = '▶ Play Animation';
  animPhaseLabel.textContent = 'Ready to play';
  animPhaseTrack.style.width = '0%';

  const info = initConstruction(animCanvas, projectType, dimensions, {
    onPhase(label, idx, total) {
      animPhaseLabel.textContent = label;
      animPhaseTrack.style.width = ((idx + 1) / total * 100) + '%';
    },
    onProgress(p) {
      animPhaseTrack.style.width = (p * 100) + '%';
    },
    onComplete() {
      animPlayBtn.textContent = '✓ Done';
      animPlayBtn.disabled = true;
      animPhaseLabel.textContent = 'Build complete — camera orbiting';
    },
  });

  const secs = info.totalDuration;
  animDuration.textContent = `· ${secs}s animation · starts instantly`;
  _animReady = true;
}

animPlayBtn.addEventListener('click', () => {
  if (!_animReady) return;
  playConstruction();
  animPlayBtn.disabled = true;
  animPlayBtn.textContent = '▶ Playing…';
});

animReplayBtn.addEventListener('click', () => {
  if (!_animReady) return;
  replayConstruction();
  animPlayBtn.disabled = true;
  animPlayBtn.textContent = '▶ Playing…';
  animPhaseLabel.textContent = 'Replaying…';
  animPhaseTrack.style.width = '0%';
});

// ── Visual Build Stages ────────────────────────────────────────────────────

const UNS = (id) => `https://images.unsplash.com/photo-${id}?w=900&h=480&fit=crop&auto=format`;

const PROJECT_VISUALS = {
  deck: {
    title: 'Wood Deck — Build Stages',
    stages: [
      {
        label: '① Site Prep & Post Holes',
        img: UNS('1562957982-b1f25317aebd'),
        desc: 'Mark the deck layout with stakes and string. Dig post holes at least 12″ below the frost line, then set concrete footings and let cure 24–48 hrs.'
      },
      {
        label: '② Beam & Joist Framing',
        img: UNS('1682148144991-8f7b79406400'),
        desc: 'Attach the ledger board to the house, set posts, run the main beam, then hang joists 16″ on center using metal joist hangers.'
      },
      {
        label: '③ Laying Deck Boards',
        img: UNS('po87W-TLLfc'),
        desc: 'Fasten deck boards perpendicular to the joists with 1/8″ spacing for drainage. Work outward from the house, maintain consistent gaps.'
      },
      {
        label: '④ Finished Deck',
        img: UNS('o8C5SxNCGaw'),
        desc: 'Sand cut edges, apply sealant or stain, then install railing if the deck is over 30″ above grade (required by most building codes).'
      }
    ]
  },
  fence: {
    title: 'Wood Fence — Build Stages',
    stages: [
      {
        label: '① Layout & Post Hole Spacing',
        img: UNS('1593285247650-cd7bb44adcfd'),
        desc: 'Mark post spacing (6–8 ft typical) along a string line for alignment. Dig holes 1/3 the post length deep for solid footing.'
      },
      {
        label: '② Setting Posts in Concrete',
        img: UNS('1601042860368-debed90085e0'),
        desc: 'Place posts plumb, pack with fast-setting concrete, brace each post and let cure at least 24 hrs before hanging rails or boards.'
      },
      {
        label: '③ Attaching Rails',
        img: UNS('1604015641586-6fa03629f976'),
        desc: 'Attach top and bottom 2×4 rails to posts. Add a middle rail for fences over 5 ft. Rails can be notched into posts or face-mounted with hardware.'
      },
      {
        label: '④ Finished Fence',
        img: UNS('1537407034356-b8f5f1ac2aa8'),
        desc: 'Fasten pickets or boards evenly to the rails. Cut tops to a consistent height. Apply exterior stain or paint for weather protection and longevity.'
      }
    ]
  },
  shedFraming: {
    title: 'Shed Framing — Build Stages',
    stages: [
      {
        label: '① Floor Frame & Skids',
        img: UNS('1634255970497-78ffb2b08ae8'),
        desc: 'Set pressure-treated 4×6 skids on a level gravel base. Build a floor frame with 2×6 joists 16″ on center, then sheathe with ¾″ plywood.'
      },
      {
        label: '② Wall Framing',
        img: UNS('1563874093519-ca5eda5cd776'),
        desc: 'Frame each wall flat on the floor — top plate, bottom plate, studs 16″ OC. Tilt up and temporarily brace each wall section before moving to the next.'
      },
      {
        label: '③ Roof Framing',
        img: UNS('1661944781655-10bafd0bda0b'),
        desc: 'Cut common rafters to match your pitch, install the ridge board at the peak, then add collar ties for lateral strength against wind and snow loads.'
      },
      {
        label: '④ Finished Shed',
        img: UNS('1704742950992-9815a104820c'),
        desc: 'Sheathe walls and roof with OSB or plywood, add house wrap, install doors and windows, then finish with siding and roofing material of your choice.'
      }
    ]
  }
};

const visualSection = document.getElementById('visualSection');
const visualTitleEl = document.getElementById('visualTitle');
const stageImgEl = document.getElementById('stageImg');
const stageLabelEl = document.getElementById('stageLabel');
const stageDescEl = document.getElementById('stageDesc');
const stageDotsEl = document.getElementById('stageDots');
const slidePrevBtn = document.getElementById('slidePrev');
const slideNextBtn = document.getElementById('slideNext');
const aiPromptBtn = document.getElementById('aiPromptBtn');

let currentStage = 0;
let slideInterval = null;
let currentVisualType = null;

function showStage(index) {
  const visuals = PROJECT_VISUALS[currentVisualType];
  if (!visuals) return;
  currentStage = (index + visuals.stages.length) % visuals.stages.length;
  const stage = visuals.stages[currentStage];

  stageImgEl.style.opacity = '0';
  setTimeout(() => {
    stageImgEl.src = stage.img;
    stageImgEl.alt = stage.label;
    stageImgEl.style.opacity = '1';
  }, 180);

  stageLabelEl.textContent = stage.label;
  stageDescEl.textContent = stage.desc;

  stageDotsEl.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentStage);
  });
}

function buildDots(count) {
  stageDotsEl.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Stage ${i + 1}`);
    dot.addEventListener('click', () => { showStage(i); resetAutoplay(); });
    stageDotsEl.appendChild(dot);
  }
}

function resetAutoplay() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => showStage(currentStage + 1), 4000);
}

function updateVisuals(type) {
  const visuals = PROJECT_VISUALS[type];
  if (!visuals) return;
  currentVisualType = type;
  currentStage = 0;
  visualTitleEl.textContent = visuals.title;
  buildDots(visuals.stages.length);
  showStage(0);
  visualSection.classList.remove('hidden');
  resetAutoplay();
}

slidePrevBtn.addEventListener('click', () => { showStage(currentStage - 1); resetAutoplay(); });
slideNextBtn.addEventListener('click', () => { showStage(currentStage + 1); resetAutoplay(); });

function buildAiPrompt() {
  const type = currentVisualType;
  const visuals = PROJECT_VISUALS[type];
  if (!visuals) return '';
  const label = PROJECT_LABELS[type] || type;
  const stages = visuals.stages.map((s) => s.label.replace(/^[①-④]\s*/, '')).join(', ');
  let dimStr = '';
  if (type === 'deck') {
    const l = document.getElementById('deck-length').value;
    const w = document.getElementById('deck-width').value;
    if (l && w) dimStr = `${l}ft by ${w}ft `;
  } else if (type === 'fence') {
    const l = document.getElementById('fence-length').value;
    const h = document.getElementById('fence-height').value;
    if (l && h) dimStr = `${l}ft long ${h}ft tall `;
  } else if (type === 'shedFraming') {
    const l = document.getElementById('shed-length').value;
    const w = document.getElementById('shed-width').value;
    if (l && w) dimStr = `${l}ft by ${w}ft `;
  }
  return `Construction timelapse of a ${dimStr}${label} being built from empty land to finished structure. Stages: ${stages}. Photorealistic, wide-angle locked camera, construction workers and materials visible, fast-paced timelapse style, daylight, modern backyard setting.`;
}

// ── AI Video Generation ────────────────────────────────────────────────────

const aiVideoPanel  = document.getElementById('aiVideoPanel');
const aiGenerating  = document.getElementById('aiGenerating');
const aiStatusText  = document.getElementById('aiStatusText');
const aiErrorEl     = document.getElementById('aiError');
const aiVideoEl     = document.getElementById('aiVideo');

let pollTimer = null;

function setAiState(state, msg = '') {
  aiGenerating.classList.add('hidden');
  aiErrorEl.classList.add('hidden');
  aiVideoEl.classList.add('hidden');

  if (state === 'generating') {
    aiGenerating.classList.remove('hidden');
    aiStatusText.textContent = msg || 'Generating…';
    aiVideoPanel.classList.remove('hidden');
  } else if (state === 'error') {
    aiErrorEl.textContent = msg;
    aiErrorEl.classList.remove('hidden');
    aiVideoPanel.classList.remove('hidden');
    aiPromptBtn.disabled = false;
    aiPromptBtn.textContent = '✦ Generate AI Animation';
  } else if (state === 'done') {
    aiVideoEl.classList.remove('hidden');
    aiVideoPanel.classList.remove('hidden');
    aiPromptBtn.disabled = false;
    aiPromptBtn.textContent = '↺ Regenerate';
  }
}

async function pollStatus(id) {
  try {
    const res = await fetch(`/api/animation/status/${id}`);
    const data = await res.json();

    if (data.status === 'succeeded' && data.videoUrl) {
      clearInterval(pollTimer);
      aiVideoEl.src = data.videoUrl;
      aiVideoEl.load();
      setAiState('done');
    } else if (data.status === 'failed' || data.error) {
      clearInterval(pollTimer);
      setAiState('error', data.error || 'Generation failed. Try again.');
    } else {
      const msgs = { starting: 'Starting up model…', processing: 'Rendering your video…' };
      aiStatusText.textContent = msgs[data.status] || 'Working…';
    }
  } catch (_) {}
}

aiPromptBtn.addEventListener('click', async () => {
  const prompt = buildAiPrompt();
  aiPromptBtn.disabled = true;
  aiPromptBtn.textContent = 'Generating…';
  setAiState('generating', 'Starting up model…');

  try {
    const res = await fetch('/api/animation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      setAiState('error', data.error || 'Could not start generation.');
      return;
    }

    clearInterval(pollTimer);
    pollTimer = setInterval(() => pollStatus(data.id), 5000);
  } catch (_) {
    setAiState('error', 'Could not reach the server.');
  }
});
