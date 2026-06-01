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
  } else {
    calcBtn.disabled = true;
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
    const q = encodeURIComponent(`${item.name} ${item.unit}`);
    const hdUrl    = `https://www.homedepot.com/s/${q}`;
    const lowesUrl = `https://www.lowes.com/search?searchTerm=${q}`;
    const bingUrl  = `https://www.bing.com/shop/search?q=${encodeURIComponent(item.name + ' ' + item.unit + ' lumber')}`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(item.name)}</td>
      <td class="num">${item.quantity}</td>
      <td>${escHtml(item.unit)}</td>
      <td class="num">${item.unitPrice !== null ? fmt(item.unitPrice) : '—'}</td>
      <td class="num">${item.totalPrice !== null ? fmt(item.totalPrice) : '—'}</td>
      <td><span class="badge badge-${item.priceSource}">${item.priceSource}</span></td>
      <td class="buy-col">
        <div class="buy-btns">
          <a class="buy-btn buy-hd"    href="${hdUrl}"    target="_blank" rel="noopener" title="Search Home Depot">HD</a>
          <a class="buy-btn buy-lowes" href="${lowesUrl}" target="_blank" rel="noopener" title="Search Lowe's">LW</a>
          <a class="buy-btn buy-bing"  href="${bingUrl}"  target="_blank" rel="noopener" title="Compare prices on Bing Shopping">🛒</a>
        </div>
      </td>
    `;
    materialsBody.appendChild(tr);
  }

  // Build "Buy All" Bing Shopping list URL
  const allQuery = materials.map(m => `${m.quantity} ${m.unit} ${m.name}`).join(', ');
  const buyAllUrl = `https://www.bing.com/shop/search?q=${encodeURIComponent(materials[0]?.name + ' construction materials')}`;

  materialsFoot.innerHTML = `
    <tr class="subtotal-row">
      <td colspan="4">Subtotal</td>
      <td class="num">${fmt(subtotal)}</td>
      <td></td>
      <td></td>
    </tr>
    <tr class="contingency-row">
      <td colspan="4">Contingency (10%)</td>
      <td class="num">${fmt(contingency)}</td>
      <td></td>
      <td></td>
    </tr>
    <tr class="total-row">
      <td colspan="3">Estimated Total</td>
      <td class="num">${fmt(total)}</td>
      <td></td>
      <td class="buy-col">
        <a class="buy-all-btn" href="https://www.homedepot.com/s/${encodeURIComponent(allQuery.slice(0,80))}" target="_blank" rel="noopener">
          🛒 Buy All
        </a>
      </td>
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

