import * as pdfjsLib from './vendor/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;

const APP_VERSION = document.querySelector('meta[name="application-version"]')?.content || 'não informada';
const BUILD_ID = document.querySelector('meta[name="build-id"]')?.content || 'não informado';
document.documentElement.dataset.appVersion = APP_VERSION;
document.documentElement.dataset.buildId = BUILD_ID;
console.info(
  '%c EDR ESQUADRO QR ',
  'background:#0b2b22;color:#f5c32f;font-weight:800;padding:4px 8px;border-radius:3px',
  `v${APP_VERSION} • build ${BUILD_ID}`,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=20260821-1516'));
}

const PAGE_NAMES = {
  '01': 'CAPA',
  '02': 'PLANTA BAIXA',
  '03': 'LOCAÇÃO',
  '04': 'COTAS',
};

const screens = [...document.querySelectorAll('[data-screen]')];
const steps = [...document.querySelectorAll('[data-step]')];
const planFile = document.querySelector('#plan-file');
const confirmSheet = document.querySelector('#confirm-sheet');
const identityCheckbox = document.querySelector('#identity-checkbox');
let scanTimer;
let selectedDocument;

const DEFAULT_DETECTED_POINTS = Object.freeze({
  A: Object.freeze({ x: 21.6, y: 37.2 }),
  B: Object.freeze({ x: 64.2, y: 37.2 }),
  C: Object.freeze({ x: 21.6, y: 82.9 }),
  D: Object.freeze({ x: 64.2, y: 82.9 }),
});
let detectedPoints = cloneDetectedPoints(DEFAULT_DETECTED_POINTS);
let pointsWereAdjusted = false;

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/gi, ' ')
    .trim()
    .toUpperCase();
}

function stepFor(screen) {
  if (['start', 'analyzing', 'sheet', 'detected'].includes(screen)) return 1;
  if (screen === 'qr') return 2;
  return 3;
}

function show(screen) {
  clearTimeout(scanTimer);
  screens.forEach((item) => item.classList.toggle('is-active', item.dataset.screen === screen));
  const current = stepFor(screen);
  steps.forEach((item) => {
    const number = Number(item.dataset.step);
    item.classList.toggle('is-active', number === current);
    item.classList.toggle('is-done', number < current);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function textItems(content) {
  return content.items
    .filter((item) => typeof item.str === 'string' && item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      normalized: normalize(item.str),
      x: item.transform[4],
      y: item.transform[5],
    }));
}

function findLabel(items, label) {
  const needle = normalize(label);
  return items.find((item) => item.normalized === needle || item.normalized.startsWith(`${needle} `));
}

function nearestValueBelow(items, label, pattern, maxDistance = 42) {
  if (!label) return '';
  return items
    .filter((item) => {
      const vertical = label.y - item.y;
      return vertical > 1 && vertical < maxDistance && Math.abs(item.x - label.x) < 28 && pattern.test(item.text);
    })
    .sort((a, b) => {
      const distanceA = Math.abs(label.y - a.y) + Math.abs(label.x - a.x);
      const distanceB = Math.abs(label.y - b.y) + Math.abs(label.x - b.x);
      return distanceA - distanceB;
    })[0]?.text.trim() || '';
}

function extractClient(items) {
  const label = findLabel(items, 'CLIENTE');
  if (!label) return '';
  const pieces = items
    .filter((item) => {
      const vertical = label.y - item.y;
      return vertical > 2 && vertical < 24 && item.x >= label.x - 4 && item.x < label.x + 108;
    })
    .sort((a, b) => a.x - b.x)
    .map((item) => item.text)
    .filter((item, index, all) => normalize(item) !== normalize(all[index - 1] || ''))
    .join(' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return pieces;
}

function extractDate(items) {
  return items.find((item) => /\b\d{2}\/\d{2}\/\d{4}\b/.test(item.text))?.text.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || '';
}

function projectFromFileName(fileName) {
  const withoutExtension = fileName.replace(/\.pdf$/i, '');
  const cleaned = withoutExtension
    .replace(/^EDR\s*[-–—]\s*/i, '')
    .replace(/\b(PROJETO|EXECUTIVO|ARQUITETONICO|ARQUITETÔNICO|LOCACAO|LOCAÇÃO)\b/gi, '')
    .replace(/[-–—_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'PROJETO SEM NOME';
}

function pageScore(pageInfo) {
  let score = 0;
  if (pageInfo.fullText.includes('LOCACAO')) score += 250;
  if (pageInfo.printedPage === '03') score += 140;
  if (pageInfo.pageIndex === 3) score += 20;
  return score;
}

async function inspectPage(pdf, pageIndex, onProgress) {
  const page = await pdf.getPage(pageIndex);
  const content = await page.getTextContent();
  const items = textItems(content);
  const rawPrintedPage = nearestValueBelow(items, findLabel(items, 'PÁGINA'), /^\d{1,3}$/);
  const rawRevision = nearestValueBelow(items, findLabel(items, 'REVISÃO'), /^\d{1,3}$/);
  const rawDeclaredSheets = nearestValueBelow(items, findLabel(items, 'FOLHAS'), /^\d{1,3}$/);
  const info = {
    page,
    pageIndex,
    printedPage: rawPrintedPage ? rawPrintedPage.padStart(2, '0') : '',
    revision: rawRevision ? rawRevision.padStart(2, '0') : '',
    declaredSheets: rawDeclaredSheets ? Number(rawDeclaredSheets) : null,
    client: extractClient(items),
    date: extractDate(items),
    fullText: normalize(items.map((item) => item.text).join(' ')),
  };
  onProgress?.(pageIndex);
  return info;
}

async function renderPageIntoCanvas(page, canvas) {
  const context = canvas.getContext('2d', { alpha: false });
  const viewport = page.getViewport({ scale: 1.55 });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
}

async function renderPage(page) {
  await renderPageIntoCanvas(page, document.querySelector('#sheet-canvas'));
}

function cloneDetectedPoints(points) {
  return Object.fromEntries(Object.entries(points).map(([name, point]) => [name, { ...point }]));
}

function updateDetectedOverlay() {
  const pointOrder = ['A', 'B', 'D', 'C'];
  document.querySelector('#detected-polygon').setAttribute('points', pointOrder.map((name) => `${detectedPoints[name].x},${detectedPoints[name].y}`).join(' '));

  const diagonals = [
    ['#detected-diagonal-red', detectedPoints.C, detectedPoints.B],
    ['#detected-diagonal-green', detectedPoints.A, detectedPoints.D],
  ];
  diagonals.forEach(([selector, start, end]) => {
    const line = document.querySelector(selector);
    line.setAttribute('x1', start.x);
    line.setAttribute('y1', start.y);
    line.setAttribute('x2', end.x);
    line.setAttribute('y2', end.y);
  });

  Object.entries(detectedPoints).forEach(([name, point]) => {
    const control = document.querySelector(`[data-point-control="${name}"]`);
    control.style.left = `${point.x}%`;
    control.style.top = `${point.y}%`;
  });
}

function updatePointMagnifier(pointName) {
  const magnifier = document.querySelector('#point-magnifier');
  const source = document.querySelector('#detected-canvas');
  const target = magnifier.querySelector('canvas');
  const stage = document.querySelector('.plan-stage');
  const point = detectedPoints[pointName];
  if (!source.width || !source.height || !point) return;

  const stageRect = stage.getBoundingClientRect();
  const displayScale = Math.min(stageRect.width / source.width, stageRect.height / source.height);
  const displayWidth = source.width * displayScale;
  const displayHeight = source.height * displayScale;
  const imageOffsetX = (stageRect.width - displayWidth) / 2;
  const imageOffsetY = (stageRect.height - displayHeight) / 2;
  const sourceX = (((stageRect.width * point.x) / 100) - imageOffsetX) / displayScale;
  const sourceY = (((stageRect.height * point.y) / 100) - imageOffsetY) / displayScale;
  const targetCssSize = Number.parseFloat(getComputedStyle(target).width) || 144;
  const cropSize = Math.min(source.width, source.height, targetCssSize / (displayScale * 4));
  const cropX = Math.min(Math.max(0, sourceX - (cropSize / 2)), source.width - cropSize);
  const cropY = Math.min(Math.max(0, sourceY - (cropSize / 2)), source.height - cropSize);
  const density = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  target.width = Math.round(targetCssSize * density);
  target.height = Math.round(targetCssSize * density);
  const context = target.getContext('2d', { alpha: false });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, cropX, cropY, cropSize, cropSize, 0, 0, target.width, target.height);
  magnifier.classList.toggle('is-left', point.x > 55);
}

function showPointMagnifier(pointName) {
  const magnifier = document.querySelector('#point-magnifier');
  magnifier.hidden = false;
  updatePointMagnifier(pointName);
}

function hidePointMagnifier() {
  document.querySelector('#point-magnifier').hidden = true;
}

function resetDetectedPoints() {
  detectedPoints = cloneDetectedPoints(DEFAULT_DETECTED_POINTS);
  pointsWereAdjusted = false;
  updateDetectedOverlay();
}

function setPointAdjustmentMode(active) {
  const stage = document.querySelector('.plan-stage');
  const note = document.querySelector('#adjust-note');
  const adjustButton = document.querySelector('#adjust-points');
  const resetButton = document.querySelector('#reset-points');
  const confirmButton = document.querySelector('#confirm-rectangle');
  const status = document.querySelector('#point-status');

  stage.classList.toggle('is-adjusting', active);
  confirmButton.disabled = active;
  resetButton.hidden = !active;
  note.hidden = false;

  if (active) {
    adjustButton.textContent = 'SALVAR ESTES 4 PONTOS';
    note.textContent = 'Arraste A, B, C e D até os quatro extremos da casa. No celular, segure o ponto e mova com o dedo.';
    status.innerHTML = '<span>●</span> Ajuste em andamento • mova os quatro pontos amarelos';
  } else {
    pointsWereAdjusted = true;
    adjustButton.textContent = 'AJUSTAR NOVAMENTE';
    note.textContent = 'Pontos salvos. Confira o contorno amarelo e as medidas antes de continuar.';
    status.innerHTML = '<span>✓</span> Quatro pontos ajustados e salvos';
  }
}

function constrainDetectedPoint(name, next) {
  const minimumGap = 4;
  const constrained = {
    x: Math.min(97, Math.max(3, next.x)),
    y: Math.min(97, Math.max(3, next.y)),
  };
  if (name === 'A' || name === 'C') constrained.x = Math.min(constrained.x, Math.min(detectedPoints.B.x, detectedPoints.D.x) - minimumGap);
  if (name === 'B' || name === 'D') constrained.x = Math.max(constrained.x, Math.max(detectedPoints.A.x, detectedPoints.C.x) + minimumGap);
  if (name === 'A' || name === 'B') constrained.y = Math.min(constrained.y, Math.min(detectedPoints.C.y, detectedPoints.D.y) - minimumGap);
  if (name === 'C' || name === 'D') constrained.y = Math.max(constrained.y, Math.max(detectedPoints.A.y, detectedPoints.B.y) + minimumGap);
  return constrained;
}

function moveDetectedPoint(name, next) {
  detectedPoints[name] = constrainDetectedPoint(name, next);
  updateDetectedOverlay();
}

async function prepareDetectedScreen() {
  resetDetectedPoints();
  setPointAdjustmentMode(false);
  pointsWereAdjusted = false;
  document.querySelector('#adjust-points').textContent = 'NÃO • AJUSTAR OS 4 PONTOS';
  document.querySelector('#adjust-note').hidden = true;
  document.querySelector('#point-status').innerHTML = '<span>▣</span> Retângulo externo da casa • eixos 2–9 / B–F';
  await renderPageIntoCanvas(selectedDocument.selected.page, document.querySelector('#detected-canvas'));
}

function renderPageList(selected, totalPages) {
  const list = document.querySelector('#page-list');
  const indexes = new Set([1, 2, selected.pageIndex, Math.min(totalPages, selected.pageIndex + 1)]);
  list.replaceChildren();
  [...indexes]
    .filter((index) => index >= 1 && index <= totalPages)
    .sort((a, b) => a - b)
    .forEach((index) => {
      const printed = index === selected.pageIndex ? (selected.printedPage || String(index).padStart(2, '0')) : String(index).padStart(2, '0');
      const item = document.createElement('li');
      if (index === selected.pageIndex) item.className = 'is-selected';
      item.innerHTML = `<b>${printed}</b><span>${index === selected.pageIndex ? 'LOCAÇÃO' : (PAGE_NAMES[printed] || 'OUTRA PRANCHA')}</span><em>${index === selected.pageIndex ? 'ESCOLHIDA' : 'IGNORADA'}</em>`;
      list.append(item);
    });
}

function identityConflicts(documentInfo) {
  const conflicts = [];
  const project = normalize(documentInfo.project);
  const client = normalize(documentInfo.selected.client);
  const projectWords = project.split(' ').filter((word) => word.length > 3);
  if (client && projectWords.length && !projectWords.some((word) => client.includes(word))) {
    conflicts.push(`O arquivo indica “${documentInfo.project}”, mas o campo CLIENTE da prancha diz “${documentInfo.selected.client}”.`);
  }
  if (documentInfo.selected.declaredSheets && documentInfo.selected.declaredSheets !== documentInfo.totalPages) {
    conflicts.push(`O PDF possui ${documentInfo.totalPages} páginas, mas o carimbo da prancha informa ${documentInfo.selected.declaredSheets} folhas.`);
  }
  return conflicts;
}

function updateDownstreamLabels(documentInfo) {
  const project = documentInfo.project.toUpperCase();
  const displayProject = project.charAt(0) + project.slice(1).toLowerCase();
  const page = documentInfo.selected.printedPage || String(documentInfo.selected.pageIndex).padStart(2, '0');
  const revision = documentInfo.selected.revision || 'NÃO LIDA';
  document.querySelector('#detected-project').textContent = project;
  document.querySelector('#detected-house').textContent = `CASA DO ${project}`;
  document.querySelector('#ticket-project').textContent = project;
  document.querySelector('#ticket-revision').textContent = `PRANCHA ${page} • REVISÃO ${revision}`;
  document.querySelector('#field-qr-meta').textContent = `QR LIDO • PRANCHA ${page} • REVISÃO ${revision}`;
  document.querySelector('#field-project').textContent = displayProject;
}

async function populateSheetScreen(documentInfo) {
  const selected = documentInfo.selected;
  const pageNumber = selected.printedPage || String(selected.pageIndex).padStart(2, '0');
  const foundByTitle = selected.fullText.includes('LOCACAO');
  const conflicts = identityConflicts(documentInfo);

  document.querySelector('.screen[data-screen="sheet"] .kicker').textContent = `PDF ANALISADO • ${documentInfo.totalPages} PÁGINAS`;
  document.querySelector('#pdf-file-name').textContent = documentInfo.fileName;
  document.querySelector('#pdf-page-counter').textContent = `${String(selected.pageIndex).padStart(2, '0')} / ${documentInfo.totalPages}`;
  document.querySelector('#selection-source').textContent = foundByTitle ? 'TÍTULO LOCAÇÃO ENCONTRADO' : 'PÁGINA 03 DO PADRÃO EDR';
  document.querySelector('#search-result').textContent = foundByTitle ? 'TÍTULO “LOCAÇÃO” ENCONTRADO' : 'PÁGINA 03 DO PADRÃO EDR';
  document.querySelector('#identity-project').textContent = documentInfo.project.toUpperCase();
  document.querySelector('#identity-client').textContent = selected.client || 'NÃO FOI POSSÍVEL LER';
  document.querySelector('#identity-page').textContent = `${pageNumber} — LOCAÇÃO`;
  document.querySelector('#identity-revision').textContent = `${selected.revision || 'NÃO LIDA'}${selected.date ? ` • ${selected.date}` : ''}`;
  confirmSheet.innerHTML = `SIM, USAR A PRANCHA ${pageNumber} <span>→</span>`;

  const warning = document.querySelector('#revision-warning');
  const warningText = document.querySelector('#revision-warning-text');
  const identityConfirm = document.querySelector('#identity-confirm');
  identityCheckbox.checked = false;
  warning.classList.toggle('is-danger', conflicts.length > 0);
  identityConfirm.hidden = conflicts.length === 0;
  if (conflicts.length) {
    warningText.innerHTML = `<strong>DADOS DIVERGENTES — CONFIRA ANTES DE CONTINUAR.</strong><br>${conflicts.join('<br>')}`;
    confirmSheet.disabled = true;
  } else {
    warningText.textContent = 'Página, cliente, revisão e quantidade de folhas estão coerentes. Esses dados seguirão para o QR.';
    confirmSheet.disabled = false;
  }

  renderPageList(selected, documentInfo.totalPages);
  updateDownstreamLabels(documentInfo);
  await renderPage(selected.page);
}

async function processPdf(bytes, fileName) {
  const uploadError = document.querySelector('#upload-error');
  const analysisStatus = document.querySelector('#analysis-status');
  uploadError.textContent = '';
  document.querySelector('#analysis-file').textContent = fileName;
  analysisStatus.textContent = 'Abrindo o PDF no próprio aparelho…';
  show('analyzing');

  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
    const pdf = await loadingTask.promise;
    const pages = [];
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      analysisStatus.textContent = `${pageIndex} de ${pdf.numPages} páginas verificadas…`;
      pages.push(await inspectPage(pdf, pageIndex));
    }
    const selected = [...pages].sort((a, b) => pageScore(b) - pageScore(a))[0];
    if (!selected || pageScore(selected) < 100) {
      throw new Error('Não encontrei a página 03 nem um título “LOCAÇÃO” legível neste PDF.');
    }
    selectedDocument = {
      fileName,
      project: projectFromFileName(fileName),
      totalPages: pdf.numPages,
      selected,
    };
    analysisStatus.textContent = 'Prancha encontrada. Preparando a conferência…';
    await populateSheetScreen(selectedDocument);
    show('sheet');
  } catch (error) {
    console.error(error);
    show('start');
    uploadError.textContent = error?.message || 'Não foi possível ler este PDF.';
  }
}

const FIELD_PROJECT = Object.freeze({
  targetLength: 7.16,
  targetWidth: 11.12,
  // Limites provisórios até a validação física com a equipe e as trenas da obra.
  tolerance: 0.005,
  alertTolerance: 0.01,
  sideTolerance: 0.01,
  AC: 7.16,
  AB: 11.12,
  CD: 11.12,
  BD: 7.16,
});
const fieldWorkspace = document.querySelector('#field-workspace');
const fieldBackButton = document.querySelector('#field-back-button');
let fieldRound = 1;
let previousDiagonalGap = null;
let fieldView = 'entry';
let lastSubmittedDiagonals = {};

function parseMeasure(value) {
  return Number(String(value || '').trim().replace(',', '.'));
}

function meters(value, digits = 2) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function centimeters(value) {
  return Math.round(value * 100).toLocaleString('pt-BR');
}

function movementCentimeters(value) {
  const valueInCentimeters = value * 100;
  return valueInCentimeters.toLocaleString('pt-BR', {
    minimumFractionDigits: valueInCentimeters < 1 ? 1 : 0,
    maximumFractionDigits: valueInCentimeters < 1 ? 1 : 0,
  });
}

function centimetersPrecise(value) {
  return (value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function measureInputValue(value) {
  return Number.isFinite(value)
    ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : '';
}

function setFieldView(view) {
  fieldView = view;
  fieldBackButton.querySelector('b').textContent = view === 'entry' ? 'VOLTAR PARA O QR' : 'VOLTAR ÀS MEDIDAS';
}

function referenceDiagram() {
  return `<article class="field-reference-card">
    <div class="field-card-head"><span>PONTOS DO GABARITO</span><strong>X DA CASA</strong></div>
    <svg class="field-reference-svg" viewBox="0 0 360 310" role="img" aria-label="A e C fixos à esquerda, B e D à direita, diagonal vermelha C até B e diagonal verde A até D">
      <line class="reference-fixed" x1="78" y1="50" x2="78" y2="250"></line>
      <line class="reference-edge" x1="78" y1="50" x2="282" y2="50"></line>
      <line class="reference-edge" x1="78" y1="250" x2="282" y2="250"></line>
      <line class="reference-move" x1="282" y1="50" x2="282" y2="250"></line>
      <line class="reference-red" x1="78" y1="250" x2="282" y2="50"></line>
      <line class="reference-green" x1="78" y1="50" x2="282" y2="250"></line>
      <g class="reference-point fixed"><circle cx="78" cy="50" r="22"></circle><text x="78" y="57">A</text></g>
      <g class="reference-point"><circle cx="282" cy="50" r="22"></circle><text x="282" y="57">B</text></g>
      <g class="reference-point fixed"><circle cx="78" cy="250" r="22"></circle><text x="78" y="257">C</text></g>
      <g class="reference-point"><circle cx="282" cy="250" r="22"></circle><text x="282" y="257">D</text></g>
      <text class="reference-horizontal" x="180" y="292">11,12 m</text>
      <text class="reference-vertical" transform="translate(36 150) rotate(-90)">7,16 m</text>
    </svg>
    <div class="reference-legend"><span><i class="red"></i>C–B • VERMELHA</span><span><i class="green"></i>A–D • VERDE</span></div>
  </article>`;
}

function diagonalFields(prefix = 'field', values = {}) {
  return `<div class="diagonal-entry-grid">
    <label class="diagonal-entry is-red">
      <span>DIAGONAL VERMELHA</span><strong>C–B</strong>
      <div><input id="${prefix}-CB" inputmode="decimal" autocomplete="off" placeholder="Ex.: 13,20" value="${measureInputValue(values.CB)}" aria-label="Diagonal vermelha de C até B"><b>m</b></div>
    </label>
    <label class="diagonal-entry is-green">
      <span>DIAGONAL VERDE</span><strong>A–D</strong>
      <div><input id="${prefix}-AD" inputmode="decimal" autocomplete="off" placeholder="Ex.: 13,25" value="${measureInputValue(values.AD)}" aria-label="Diagonal verde de A até D"><b>m</b></div>
    </label>
  </div>`;
}

function renderInitialField(message = '', initialValues = {}) {
  setFieldView('entry');
  previousDiagonalGap = null;
  fieldRound = 1;
  fieldWorkspace.innerHTML = `<div class="field-measure-grid">
    ${referenceDiagram()}
    <article class="field-entry-card">
      <p class="kicker">${message ? 'LADOS CONFERIDOS' : 'PRIMEIRA CONFERÊNCIA'}</p>
      <h2>${message || 'Meça somente o X'}</h2>
      <p>A prancha já trouxe todas as outras medidas. Digite exatamente o que apareceu nas duas trenas.</p>
      <form id="first-x-form" novalidate>
        ${diagonalFields('first', initialValues)}
        <p id="first-x-error" class="field-inline-error" role="alert" hidden></p>
        <button class="primary-button field-calculate-button" type="submit">DIZER O QUE DEVO MOVER <span>→</span></button>
        <button id="load-field-example" class="field-example-button" type="button">CARREGAR EXEMPLO COM ERRO DE ESQUADRO</button>
      </form>
      <div class="field-helper"><span>1</span><p>Vermelha primeiro.</p><span>2</span><p>Verde depois.</p><span>3</span><p>O desenho mostra o movimento.</p></div>
    </article>
  </div>`;

  const form = document.querySelector('#first-x-form');
  const example = document.querySelector('#load-field-example');
  example.addEventListener('click', () => {
    document.querySelector('#first-CB').value = '13,20';
    document.querySelector('#first-AD').value = '13,25';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleDiagonalSubmission('first', false);
  });
  document.querySelector('#first-CB').focus({ preventScroll: true });
}

function diagonalValues(prefix) {
  return {
    CB: parseMeasure(document.querySelector(`#${prefix}-CB`)?.value),
    AD: parseMeasure(document.querySelector(`#${prefix}-AD`)?.value),
  };
}

function movementDiagram(result) {
  const correction = result.sideCorrection;
  const towardA = correction.dy < 0;
  const currentTop = towardA ? 82 : 18;
  const currentBottom = towardA ? 242 : 178;
  const arrowStart = towardA ? 182 : 82;
  const arrowEnd = towardA ? 132 : 132;
  const direction = towardA ? 'A' : 'C';
  const arrowGlyph = towardA ? '↑' : '↓';
  const moveCm = movementCentimeters(correction.total);
  return `<article class="movement-guide">
    <div class="movement-head"><span>AJUSTE ${fieldRound}</span><strong>MOVIMENTO AGORA</strong></div>
    <div class="movement-diagram-wrap">
      <svg class="movement-diagram" viewBox="0 0 340 285" role="img" aria-label="Mover B e D juntos ${moveCm} centímetros no sentido do ponto ${direction}">
        <defs><marker id="field-move-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>
        <line class="movement-fixed" x1="62" y1="52" x2="62" y2="212"></line>
        <line class="movement-edge" x1="62" y1="52" x2="242" y2="${currentTop}"></line>
        <line class="movement-edge" x1="62" y1="212" x2="242" y2="${currentBottom}"></line>
        <line class="movement-red" x1="62" y1="212" x2="242" y2="${currentTop}"></line>
        <line class="movement-green" x1="62" y1="52" x2="242" y2="${currentBottom}"></line>
        <line class="movement-current" x1="242" y1="${currentTop}" x2="242" y2="${currentBottom}"></line>
        <line class="movement-target" x1="242" y1="52" x2="242" y2="212"></line>
        <line class="movement-arrow" x1="294" y1="${arrowStart}" x2="294" y2="${arrowEnd}" marker-end="url(#field-move-arrow)"></line>
        <text class="movement-value" x="294" y="${towardA ? 210 : 68}" text-anchor="middle">${arrowGlyph} ${moveCm} cm</text>
        <g class="movement-point fixed"><circle cx="62" cy="52" r="21"></circle><text x="62" y="59">A</text></g>
        <g class="movement-point"><circle cx="242" cy="${currentTop}" r="21"></circle><text x="242" y="${currentTop + 7}">B</text></g>
        <g class="movement-point fixed"><circle cx="62" cy="212" r="21"></circle><text x="62" y="219">C</text></g>
        <g class="movement-point"><circle cx="242" cy="${currentBottom}" r="21"></circle><text x="242" y="${currentBottom + 7}">D</text></g>
        <text class="movement-target-label" x="232" y="${towardA ? 40 : 232}" text-anchor="end">POSIÇÃO CORRETA</text>
      </svg>
    </div>
    <div class="movement-command">
      <span>MOVA B E D JUNTOS</span><strong>${moveCm} cm</strong>
      <b>NO SENTIDO DO PONTO ${direction}</b><small>Mantenha B–D com 7,16 m. Não mova apenas um ponto.</small>
    </div>
    <button id="movement-done" class="primary-button movement-done" type="button">JÁ MOVI — DIGITAR O NOVO X <span>→</span></button>
    <form id="repeat-x-form" class="repeat-x-form" hidden novalidate>
      <div class="repeat-head"><span>CONFERÊNCIA ${fieldRound + 1}</span><h3>Meça somente o X novamente</h3><p>Não volte ao começo. Digite as duas novas leituras aqui.</p></div>
      ${diagonalFields('repeat')}
      <p id="repeat-x-error" class="field-inline-error" role="alert" hidden></p>
      <button class="primary-button" type="submit">MOSTRAR O PRÓXIMO PASSO <span>⌖</span></button>
    </form>
  </article>`;
}

function renderMovement(result, fineAdjustment = false) {
  setFieldView('result');
  fieldWorkspace.innerHTML = `<div class="field-result-banner"><span>↗</span><div><small>${fineAdjustment ? 'AJUSTE FINO • AINDA NÃO LIBERE' : 'CORREÇÃO NECESSÁRIA'}</small><h2>${fineAdjustment ? 'Falta pouco: ajuste mais uma vez' : 'Mova B e D juntos'}</h2></div></div>
    ${movementDiagram(result)}
    <div class="field-result-metrics"><div><small>DIFERENÇA ATUAL DO X</small><strong>${centimetersPrecise(result.diagonalGap)} cm</strong></div><div><small>MOVIMENTO INDICADO</small><strong>${movementCentimeters(result.sideCorrection.total)} cm</strong></div></div>`;
  document.querySelector('#movement-done').addEventListener('click', (event) => {
    event.currentTarget.hidden = true;
    const form = document.querySelector('#repeat-x-form');
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => document.querySelector('#repeat-CB')?.focus(), 250);
  });
  document.querySelector('#repeat-x-form').addEventListener('submit', (event) => {
    event.preventDefault();
    handleDiagonalSubmission('repeat', true);
  });
  document.querySelector('#movement-done').focus({ preventScroll: true });
}

function renderStop(result, title, message) {
  setFieldView('result');
  const expected = result.theoreticalDiagonal || Math.hypot(FIELD_PROJECT.targetLength, FIELD_PROJECT.targetWidth);
  fieldWorkspace.innerHTML = `<div class="field-result-banner is-stop"><span>!</span><div><small>PARE • NÃO MOVA NENHUM PONTO</small><h2>${title}</h2></div></div>
    <article class="field-stop-card"><div class="field-stop-symbol">!</div><div><strong>CONFIRA ANTES DE CONTINUAR</strong><p>${message}</p></div><small>LIMITE PROVISÓRIO DO TESTE DE CAMPO</small></article>
    <div class="field-result-metrics"><div><small>DIAGONAL ESPERADA</small><strong>${meters(expected, 3)} m</strong></div><div><small>DIFERENÇA ATUAL DO X</small><strong>${centimetersPrecise(result.diagonalGap || 0)} cm</strong></div></div>
    <button id="stop-side-check" class="primary-button" type="button">CONFERIR OS QUATRO LADOS <span>→</span></button>`;
  document.querySelector('#stop-side-check').addEventListener('click', () => renderSideCheck('recovery', result));
  document.querySelector('#stop-side-check').focus({ preventScroll: true });
}

function sideFields(prefix) {
  const fields = [
    ['AC', 'A–C', FIELD_PROJECT.targetLength],
    ['AB', 'A–B', FIELD_PROJECT.targetWidth],
    ['CD', 'C–D', FIELD_PROJECT.targetWidth],
    ['BD', 'B–D', FIELD_PROJECT.targetLength],
  ];
  return fields.map(([key, label, expected]) => `<label class="side-check-field"><span><b>${label}</b><small>deve dar ${meters(expected)} m</small></span><div><input id="${prefix}-${key}" inputmode="decimal" autocomplete="off" aria-label="Lado ${label}"><em>m</em></div></label>`).join('');
}

function renderSideCheck(mode, result) {
  setFieldView('result');
  const finalCheck = mode === 'final';
  fieldWorkspace.innerHTML = `<div class="field-result-banner is-aligned"><span>✓</span><div><small>${finalCheck ? 'X DENTRO DO LIMITE PARA LIBERAR' : 'CONFERÊNCIA DE SEGURANÇA'}</small><h2>${finalCheck ? 'Agora confirme os lados' : 'Confira os quatro lados'}</h2></div></div>
    ${finalCheck ? `<article class="x-aligned-card"><div>X</div><span>O X ALINHOU</span><strong>Diferença de ${centimetersPrecise(result.diagonalGap)} cm — dentro do limite de 0,5 cm.</strong><p>C–B ${meters(result.lastCB)} m • A–D ${meters(result.lastAD)} m</p></article>` : ''}
    <article class="side-check-card"><div class="side-check-head"><span>ÚLTIMA CONFERÊNCIA</span><h3>Meça os quatro lados</h3><p>${finalCheck ? 'O X fechou. Os lados precisam continuar corretos antes de liberar.' : 'Esta trava evita continuar após uma leitura ou movimento duvidoso.'}</p></div>
      <form id="side-check-form" novalidate><div class="side-check-grid">${sideFields('check')}</div><p id="side-check-error" class="field-inline-error" role="alert" hidden></p><button class="primary-button" type="submit">${finalCheck ? 'VALIDAR E LIBERAR GABARITO' : 'CONFIRMAR E VOLTAR AO X'} <span>✓</span></button></form>
    </article>`;
  document.querySelector('#side-check-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const measured = {};
    ['AC', 'AB', 'CD', 'BD'].forEach((key) => { measured[key] = parseMeasure(document.querySelector(`#check-${key}`).value); });
    const error = document.querySelector('#side-check-error');
    try {
      const validation = window.EDRGeometry.validateFinalSides(
        { ...FIELD_PROJECT, tolerance: FIELD_PROJECT.sideTolerance },
        measured,
      );
      if (!validation.valid) {
        const labels = { AC: 'A–C', AB: 'A–B', CD: 'C–D', BD: 'B–D' };
        error.innerHTML = `<strong>Ainda não libere.</strong> ${validation.invalid.map((key) => `${labels[key]} está ${centimetersPrecise(Math.abs(validation.deviations[key]))} cm ${validation.deviations[key] > 0 ? 'maior' : 'menor'}`).join('; ')} que o projeto.`;
        error.hidden = false;
        return;
      }
      if (finalCheck) renderConfirmed(result, measured);
      else renderInitialField('Lados corretos. Meça o X novamente');
    } catch (_) {
      error.textContent = 'Informe as quatro medidas dos lados.';
      error.hidden = false;
    }
  });
  document.querySelector('#check-AC').focus({ preventScroll: true });
}

function renderConfirmed(result, measured) {
  setFieldView('result');
  fieldWorkspace.innerHTML = `<div class="field-result-banner is-confirmed"><span>✓</span><div><small>CONFERÊNCIA COMPLETA</small><h2>Gabarito conferido</h2></div></div>
    <article class="confirmed-card"><div>✓</div><small>X + QUATRO LADOS</small><h3>PODE LIBERAR</h3><p>O X ficou dentro de 0,5 cm e os quatro lados passaram na conferência.</p><section>${[['AC','A–C'],['AB','A–B'],['CD','C–D'],['BD','B–D']].map(([key,label]) => `<span>${label}<b>${meters(measured[key])} m</b></span>`).join('')}</section></article>
    <div class="field-result-metrics"><div><small>DIFERENÇA FINAL DO X</small><strong>${centimetersPrecise(result.diagonalGap)} cm</strong></div><div><small>LIMITE PARA LIBERAR O X</small><strong>0,5 cm</strong></div></div>`;
}

function handleDiagonalSubmission(prefix, isRepeat) {
  const values = diagonalValues(prefix);
  const error = document.querySelector(`#${prefix}-x-error`);
  if (!Number.isFinite(values.CB) || values.CB <= 0 || !Number.isFinite(values.AD) || values.AD <= 0) {
    error.textContent = 'Informe as duas medidas do X.';
    error.hidden = false;
    return;
  }
  try {
    lastSubmittedDiagonals = { ...values };
    if (isRepeat) fieldRound += 1;
    const input = { ...FIELD_PROJECT, ...values };
    const result = window.EDRGeometry.calculate(input);
    result.lastCB = values.CB;
    result.lastAD = values.AD;
    if (isRepeat && ['correction', 'fine-adjustment'].includes(result.stage) && window.EDRGeometry.didDiagonalGapWorsen(previousDiagonalGap, result.diagonalGap)) result.stage = 'worsened';
    if (['correction', 'fine-adjustment'].includes(result.stage) && fieldRound > window.EDRGeometry.PROVISIONAL_LIMITS.maxAdjustments) result.stage = 'round-limit';
    previousDiagonalGap = result.diagonalGap;

    if (result.stage === 'correction') renderMovement(result);
    else if (result.stage === 'fine-adjustment') renderMovement(result, true);
    else if (result.stage === 'x-aligned') renderSideCheck('final', result);
    else if (result.stage === 'diagonal-inconsistent') renderStop(result, 'As diagonais não combinam com o projeto', 'Meça novamente nos mesmos pregos. Se repetir, confira os quatro lados.');
    else if (result.stage === 'movement-limit') renderStop(result, 'O movimento calculado ficou grande demais', `O cálculo indicou ${centimetersPrecise(result.sideCorrection.total)} cm, acima do teto provisório de ${centimetersPrecise(result.movementLimit)} cm.`);
    else if (result.stage === 'worsened') renderStop(result, 'A diferença do X aumentou', 'Pode ter ocorrido troca das diagonais, movimento no sentido contrário ou ultrapassagem do ponto.');
    else if (result.stage === 'round-limit') renderStop(result, 'Três ajustes não fecharam o X', 'Pare a sequência e confira os pontos de leitura e os quatro lados.');
  } catch (calculationError) {
    error.textContent = calculationError.message || 'Não foi possível calcular. Confira as duas medidas.';
    error.hidden = false;
  }
}

planFile.addEventListener('change', async () => {
  const file = planFile.files?.[0];
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    document.querySelector('#upload-error').textContent = 'Nesta versão, envie o PDF. A leitura por fotografia será a próxima etapa.';
    planFile.value = '';
    return;
  }
  await processPdf(await file.arrayBuffer(), file.name);
});

identityCheckbox.addEventListener('change', () => {
  confirmSheet.disabled = !identityCheckbox.checked;
});

fieldBackButton.addEventListener('click', () => {
  if (fieldView === 'entry') {
    show('qr');
    return;
  }
  renderInitialField('Revise as duas diagonais', lastSubmittedDiagonals);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelector('#confirm-rectangle').addEventListener('click', () => show('qr'));
confirmSheet.addEventListener('click', async () => {
  if (!confirmSheet.disabled && selectedDocument) {
    confirmSheet.disabled = true;
    await prepareDetectedScreen();
    show('detected');
    confirmSheet.disabled = false;
  }
});
document.querySelector('#simulate-scan').addEventListener('click', () => {
  show('scanning');
  scanTimer = setTimeout(() => {
    lastSubmittedDiagonals = {};
    renderInitialField();
    show('field');
    window.setTimeout(() => document.querySelector('#first-CB')?.focus({ preventScroll: true }), 50);
  }, 1850);
});

document.querySelector('#edit-qr-points').addEventListener('click', () => {
  show('detected');
  setPointAdjustmentMode(true);
  window.setTimeout(() => document.querySelector('[data-point="A"]')?.focus({ preventScroll: true }), 50);
});

document.querySelector('#adjust-points').addEventListener('click', () => {
  const stage = document.querySelector('.plan-stage');
  setPointAdjustmentMode(!stage.classList.contains('is-adjusting'));
});

document.querySelector('#reset-points').addEventListener('click', () => {
  resetDetectedPoints();
  document.querySelector('#point-status').innerHTML = '<span>●</span> Marcação reiniciada • mova os quatro pontos amarelos';
});

document.querySelectorAll('[data-point]').forEach((handle) => {
  const pointName = handle.dataset.point;
  let pointerOffset = { x: 0, y: 0 };
  const moveFromPointer = (event) => {
    const stage = document.querySelector('.plan-stage');
    if (!stage.classList.contains('is-adjusting')) return;
    const rect = stage.getBoundingClientRect();
    moveDetectedPoint(pointName, {
      x: ((event.clientX + pointerOffset.x - rect.left) / rect.width) * 100,
      y: ((event.clientY + pointerOffset.y - rect.top) / rect.height) * 100,
    });
    if (!document.querySelector('#point-magnifier').hidden) updatePointMagnifier(pointName);
  };

  handle.addEventListener('pointerdown', (event) => {
    if (!document.querySelector('.plan-stage').classList.contains('is-adjusting')) return;
    event.preventDefault();
    handle.focus({ preventScroll: true });
    const anchor = handle.closest('[data-point-control]').getBoundingClientRect();
    pointerOffset = { x: anchor.left - event.clientX, y: anchor.top - event.clientY };
    handle.setPointerCapture(event.pointerId);
    moveFromPointer(event);
    showPointMagnifier(pointName);
  });
  handle.addEventListener('pointermove', (event) => {
    if (handle.hasPointerCapture(event.pointerId)) moveFromPointer(event);
  });
  handle.addEventListener('pointerup', (event) => {
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    pointerOffset = { x: 0, y: 0 };
    hidePointMagnifier();
  });
  handle.addEventListener('pointercancel', hidePointMagnifier);
  handle.addEventListener('keydown', (event) => {
    if (!document.querySelector('.plan-stage').classList.contains('is-adjusting')) return;
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.2 : 0.7;
    const [dx, dy] = directions[event.key];
    moveDetectedPoint(pointName, {
      x: detectedPoints[pointName].x + (dx * step),
      y: detectedPoints[pointName].y + (dy * step),
    });
  });
});

document.querySelector('#print-ticket').addEventListener('click', () => window.print());
document.querySelectorAll('[data-go]').forEach((button) => {
  button.addEventListener('click', () => show(button.dataset.go));
});
