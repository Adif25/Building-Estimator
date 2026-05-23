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
