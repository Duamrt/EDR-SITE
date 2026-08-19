(function initializeApp() {
  'use strict';

  const screens = [...document.querySelectorAll('[data-screen]')];
  const pills = [...document.querySelectorAll('[data-step-pill]')];
  const projectForm = document.querySelector('#project-form');
  const measureForm = document.querySelector('#measure-form');
  const projectError = document.querySelector('#project-error');
  const measureError = document.querySelector('#measure-error');
  const resultContent = document.querySelector('#result-content');
  const resultBanner = document.querySelector('#result-banner');
  const resultOverline = document.querySelector('#result-overline');
  const resultTitle = document.querySelector('#titulo-correcao');
  const resultContextLabel = document.querySelector('#result-context-label');
  const remeasureButton = document.querySelector('#remeasure');
  const resultActions = document.querySelector('.result-actions');
  const provisionalLimits = window.EDRGeometry.PROVISIONAL_LIMITS;
  const sessionLogApi = window.EDRSessionLog;
  const sessionStorageKey = 'edr-esquadro-active-session-v1';
  const sessionLogButton = document.querySelector('#open-session-log');
  const sessionLogDialog = document.querySelector('#session-log-dialog');
  const connectionStatus = document.querySelector('#connection-status');
  const installButton = document.querySelector('#install-app');
  let currentStep = 1;
  let fieldRound = 1;
  let activeSession = null;
  let deferredInstallPrompt = null;

  function parseNumber(raw) {
    if (typeof raw !== 'string') return Number.NaN;
    const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
    return normalized === '' ? Number.NaN : Number(normalized);
  }

  function formatMeters(value, digits = 3) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function formatCentimeters(value) {
    return Math.round(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }

  function formatCentimetersPrecise(value) {
    return (value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function formatInput(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  }

  function measurementsText(values, keys = ['AC', 'AB', 'CB', 'CD', 'AD', 'BD']) {
    const labels = { AC: 'A–C', AB: 'A–B', CB: 'C–B', CD: 'C–D', AD: 'A–D', BD: 'B–D' };
    return keys.map((key) => `${labels[key]} ${formatMeters(values[key], 2)} m`).join(' • ');
  }

  function persistActiveSession() {
    if (!activeSession) return;
    try {
      localStorage.setItem(sessionStorageKey, JSON.stringify(activeSession));
    } catch (_) {
      // O cálculo continua funcionando mesmo sem armazenamento local.
    }
    refreshSessionLogButton();
  }

  function startSession(values) {
    activeSession = sessionLogApi.createSession({
      targetLength: formatMeters(values.targetLength, 2),
      targetWidth: formatMeters(values.targetWidth, 2),
      toleranceCm: formatCentimetersPrecise(values.tolerance)
    }, {
      AC: values.AC,
      AB: values.AB,
      CB: values.CB,
      CD: values.CD,
      AD: values.AD,
      BD: values.BD
    });
    logSessionEvent({
      kind: 'measurement',
      title: 'Seis medidas iniciais informadas',
      detail: measurementsText(values),
      round: 1,
      data: { AC: values.AC, AB: values.AB, CB: values.CB, CD: values.CD, AD: values.AD, BD: values.BD }
    });
  }

  function logSessionEvent(event) {
    if (!activeSession) return;
    sessionLogApi.appendEvent(activeSession, event);
    persistActiveSession();
  }

  function resultLogEntry(result, values) {
    const round = fieldRound;
    if (result.stage === 'correction' && result.mode === 'side-shift') {
      const direction = result.sideCorrection.dy < 0 ? 'A' : 'C';
      return {
        kind: 'instruction',
        title: 'Movimento orientado pelo aplicativo',
        detail: `Mover B e D juntos ${formatCentimeters(result.sideCorrection.total)} cm no sentido do ponto ${direction}. Diferença do X: ${formatCentimetersPrecise(result.diagonalGap)} cm.`,
        round,
        data: { direction, movementCm: Math.round(result.sideCorrection.total * 100), diagonalGapCm: result.diagonalGap * 100 }
      };
    }
    if (result.stage === 'x-aligned') {
      return {
        kind: 'success',
        title: 'X dentro da tolerância',
        detail: `C–B ${formatMeters(result.lastCB || values.CB, 2)} m • A–D ${formatMeters(result.lastAD || values.AD, 2)} m • diferença ${formatCentimetersPrecise(result.diagonalGap)} cm.`,
        round
      };
    }
    const stops = {
      'diagonal-inconsistent': 'Diagonais incompatíveis com o projeto',
      'movement-limit': 'Movimento acima do limite provisório',
      worsened: 'O X piorou após o movimento',
      'round-limit': 'Limite provisório de ajustes atingido',
      inconsistent: 'As seis medidas não formam o mesmo gabarito',
      baseline: 'A linha de referência A–C precisa ser corrigida'
    };
    if (stops[result.stage]) {
      return {
        kind: 'stop',
        title: `Aplicativo mandou parar: ${stops[result.stage]}`,
        detail: Number.isFinite(result.diagonalGap) ? `Diferença do X: ${formatCentimetersPrecise(result.diagonalGap)} cm.` : 'Conferência completa exigida antes de qualquer movimento.',
        round
      };
    }
    return {
      kind: result.stage === 'ok' ? 'success' : 'instruction',
      title: result.stage === 'ok' ? 'Medidas dentro da tolerância' : 'Correção calculada',
      detail: `Resultado técnico: ${result.stage}.`,
      round
    };
  }

  function recordResult(result, values) {
    logSessionEvent(resultLogEntry(result, values));
  }

  function showStep(step) {
    currentStep = step;
    screens.forEach((screen) => screen.classList.toggle('is-active', Number(screen.dataset.screen) === step));
    pills.forEach((pill) => {
      const number = Number(pill.dataset.stepPill);
      pill.classList.toggle('is-active', number === step);
      pill.classList.toggle('is-complete', number < step);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function projectValues() {
    return {
      targetLength: parseNumber(document.querySelector('#target-length').value),
      targetWidth: parseNumber(document.querySelector('#target-width').value),
      tolerance: parseNumber(document.querySelector('#tolerance').value) / 100
    };
  }

  function validateProject(values) {
    if (!Number.isFinite(values.targetLength) || values.targetLength <= 0) return 'Informe o comprimento correto do gabarito.';
    if (!Number.isFinite(values.targetWidth) || values.targetWidth <= 0) return 'Informe a largura correta do gabarito.';
    if (!Number.isFinite(values.tolerance) || values.tolerance <= 0) return 'Informe uma tolerância maior que zero.';
    if (values.tolerance > 0.1) return 'Confira a tolerância: ela deve ser informada em centímetros.';
    return '';
  }

  function setProjectDimensionFocus(dimension) {
    const activeLines = dimension === 'length' ? ['AC', 'BD'] : dimension === 'width' ? ['AB', 'CD'] : [];
    document.querySelectorAll('.project-dimension-line').forEach((line) => {
      line.classList.toggle('is-active', activeLines.some((name) => line.id === `project-line-${name}`));
    });
    document.querySelectorAll('[data-project-dimension]').forEach((field) => field.classList.toggle('is-active', field.dataset.projectDimension === dimension));
    const label = document.querySelector('#project-diagram-label');
    const value = document.querySelector('#project-diagram-value');
    if (dimension === 'length') {
      label.textContent = 'COMPRIMENTO EM FOCO';
      value.textContent = 'A–C / B–D';
    } else if (dimension === 'width') {
      label.textContent = 'LARGURA EM FOCO';
      value.textContent = 'A–B / C–D';
    } else {
      label.textContent = 'TOLERÂNCIA DO PROJETO';
      value.textContent = 'margem aceita';
    }
  }

  document.querySelectorAll('[data-project-dimension] input').forEach((input) => {
    input.addEventListener('focus', () => setProjectDimensionFocus(input.closest('[data-project-dimension]').dataset.projectDimension));
  });

  function setSideSource(key, text, prefilled) {
    document.querySelector(`#source-${key}`).textContent = text;
    document.querySelector(`[data-measure="${key}"]`).classList.toggle('is-prefilled', prefilled);
  }

  function prefillProjectSides(values, clearDiagonals = true) {
    const sides = { AC: values.targetLength, AB: values.targetWidth, CD: values.targetWidth, BD: values.targetLength };
    Object.entries(sides).forEach(([key, value]) => {
      document.querySelector(`#measure-${key}`).value = formatInput(value);
      setSideSource(key, 'do projeto • confirme', true);
    });
    if (clearDiagonals) {
      document.querySelector('#measure-CB').value = '';
      document.querySelector('#measure-AD').value = '';
    }
    document.querySelector('#confirm-sides').checked = false;
    document.querySelector('#expected-diagonal').textContent = `${formatMeters(Math.hypot(values.targetLength, values.targetWidth))} m`;
    measureError.hidden = true;
  }

  function prepareMeasurement() {
    const values = projectValues();
    const error = validateProject(values);
    projectError.textContent = error;
    if (error) return false;

    document.querySelector('#project-summary').textContent = `${formatMeters(values.targetLength, 2)} × ${formatMeters(values.targetWidth, 2)} m`;
    prefillProjectSides(values);
    try {
      localStorage.setItem('edr-esquadro-project', JSON.stringify(values));
    } catch (_) {
      // O protótipo continua funcionando mesmo se o navegador bloquear armazenamento local.
    }
    showStep(2);
    window.setTimeout(() => document.querySelector('#measure-CB').focus(), 200);
    return true;
  }

  projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    prepareMeasurement();
  });

  document.querySelectorAll('.measure-field input').forEach((input) => {
    input.addEventListener('focus', () => {
      const measure = input.closest('.measure-field').dataset.measure;
      document.querySelectorAll('.measure-line').forEach((line) => line.classList.toggle('is-highlighted', line.id === `line-${measure}`));
    });
    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (!document.activeElement.closest?.('.measure-field')) {
          document.querySelectorAll('.measure-line').forEach((line) => line.classList.remove('is-highlighted'));
        }
      }, 0);
    });
  });

  ['AC', 'AB', 'CD', 'BD'].forEach((key) => {
    document.querySelector(`#measure-${key}`).addEventListener('input', () => {
      setSideSource(key, 'informado no campo', false);
      document.querySelector('#confirm-sides').checked = false;
    });
  });

  function measurementValues() {
    const project = projectValues();
    const measures = {};
    ['AC', 'AB', 'CB', 'CD', 'AD', 'BD'].forEach((key) => {
      measures[key] = parseNumber(document.querySelector(`#measure-${key}`).value);
    });
    return { ...project, ...measures };
  }

  function validateMeasurements(values) {
    const labels = { AC: 'A–C', AB: 'A–B', CB: 'C–B', CD: 'C–D', AD: 'A–D', BD: 'B–D' };
    for (const key of Object.keys(labels)) {
      if (!Number.isFinite(values[key]) || values[key] <= 0) return `Informe a medida ${labels[key]}.`;
    }
    if (!document.querySelector('#confirm-sides').checked) return 'Confirme que conferiu os quatro lados com a trena.';
    return '';
  }

  function movementLine(axis, value, tolerance) {
    if (Math.abs(value) <= tolerance) return null;
    if (axis === 'x') {
      return {
        arrow: value > 0 ? '→' : '←',
        text: `aprox. ${formatCentimeters(Math.abs(value))} cm para ${value > 0 ? 'afastar da linha A–C' : 'aproximar da linha A–C'}`
      };
    }
    return {
      arrow: value > 0 ? '↓' : '↑',
      text: `aprox. ${formatCentimeters(Math.abs(value))} cm em direção ao ponto ${value > 0 ? 'C' : 'A'}`
    };
  }

  function renderMoveCard(pointName, correction, tolerance) {
    const lines = [movementLine('x', correction.dx, tolerance), movementLine('y', correction.dy, tolerance)].filter(Boolean);
    if (correction.inTolerance) {
      return `<article class="move-card"><div class="point-badge">${pointName}</div><div><h3>Ponto ${pointName}</h3><p class="no-move">✓ Não precisa mexer. Está dentro da tolerância.</p></div></article>`;
    }
    return `<article class="move-card"><div class="point-badge">${pointName}</div><div><h3>Mover ponto ${pointName}</h3><p class="move-total">Deslocamento aproximado: <strong>${formatCentimeters(correction.total)} cm</strong></p><ul class="move-list">${lines.map((line) => `<li><b aria-hidden="true">${line.arrow}</b>${line.text}</li>`).join('')}</ul></div></article>`;
  }

  function shouldMoveSideTogether(correctionB, correctionD, tolerance) {
    if (correctionB.inTolerance || correctionD.inTolerance) return false;
    const difference = Math.hypot(correctionB.dx - correctionD.dx, correctionB.dy - correctionD.dy);
    const sameDirection = (correctionB.dx * correctionD.dx) + (correctionB.dy * correctionD.dy) > 0;
    return sameDirection && difference <= Math.max(tolerance, 0.01);
  }

  function renderSideMoveCard(correction, tolerance) {
    const lines = [movementLine('x', correction.dx, tolerance), movementLine('y', correction.dy, tolerance)].filter(Boolean);
    return `<article class="move-card side-move-card"><div class="point-badge side-badge">B+D</div><div><h3>Mover os pontos B e D juntos</h3><p class="move-total">Deslocamento aproximado: <strong>${formatCentimeters(correction.total)} cm</strong></p><ul class="move-list">${lines.map((line) => `<li><b aria-hidden="true">${line.arrow}</b>${line.text}</li>`).join('')}</ul><p class="side-command-note">Mantenha a distância B–D. Não mova apenas um ponto.</p></div></article>`;
  }

  function renderFieldDiagram(correction) {
    const towardA = correction.dy < 0;
    const currentTop = towardA ? 78 : 22;
    const currentBottom = towardA ? 238 : 182;
    const arrowStart = towardA ? 176 : 84;
    const arrowEnd = towardA ? 136 : 124;
    const direction = towardA ? 'A' : 'C';
    const arrow = towardA ? '↑' : '↓';
    const centimeters = formatCentimeters(correction.total);

    return `<article class="field-guide">
      <div class="field-guide-head"><span>AJUSTE ${fieldRound}</span><strong>MOVIMENTO AGORA</strong></div>
      <div class="field-diagram-wrap">
        <svg class="field-diagram" viewBox="0 0 320 270" role="img" aria-label="Mover os pontos B e D juntos ${centimeters} centímetros no sentido do ponto ${direction}">
          <defs><marker id="move-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>
          <line class="diagram-fixed" x1="62" y1="50" x2="62" y2="210"></line>
          <line class="diagram-edge" x1="62" y1="50" x2="236" y2="${currentTop}"></line>
          <line class="diagram-edge" x1="62" y1="210" x2="236" y2="${currentBottom}"></line>
          <line class="diagram-x diagram-x-red" x1="62" y1="210" x2="236" y2="${currentTop}"></line>
          <line class="diagram-x diagram-x-green" x1="62" y1="50" x2="236" y2="${currentBottom}"></line>
          <line class="diagram-current-side" x1="236" y1="${currentTop}" x2="236" y2="${currentBottom}"></line>
          <line class="diagram-target-side" x1="236" y1="50" x2="236" y2="210"></line>
          <line class="diagram-move-arrow" x1="278" y1="${arrowStart}" x2="278" y2="${arrowEnd}" marker-end="url(#move-arrow)"></line>
          <text class="diagram-arrow-value" x="278" y="${towardA ? 199 : 68}" text-anchor="middle">${arrow} ${centimeters} cm</text>
          <g class="diagram-point diagram-point-fixed"><circle cx="62" cy="50" r="20"></circle><text x="62" y="56">A</text></g>
          <g class="diagram-point diagram-point-fixed"><circle cx="62" cy="210" r="20"></circle><text x="62" y="216">C</text></g>
          <g class="diagram-point"><circle cx="236" cy="${currentTop}" r="20"></circle><text x="236" y="${currentTop + 6}">B</text></g>
          <g class="diagram-point"><circle cx="236" cy="${currentBottom}" r="20"></circle><text x="236" y="${currentBottom + 6}">D</text></g>
          <text class="diagram-target-label" x="226" y="${towardA ? 38 : 228}" text-anchor="end">posição correta</text>
        </svg>
      </div>
      <div class="field-command">
        <span>MOVA B E D JUNTOS</span>
        <strong>${centimeters} cm</strong>
        <b>NO SENTIDO DO PONTO ${direction}</b>
        <small>Mantenha B–D com ${formatMeters(projectValues().targetLength, 2)} m</small>
      </div>
      <button id="confirm-field-move" class="primary-button field-done-button" type="button">JÁ MOVI — MEDIR O X NOVAMENTE <span aria-hidden="true">→</span></button>
      <form id="inline-remeasure-form" class="inline-remeasure" hidden>
        <div class="inline-remeasure-head"><span>PRÓXIMA CONFERÊNCIA</span><h3>Meça somente o X</h3><p>Digite as duas novas leituras. Os quatro lados continuam guardados.</p></div>
        <div class="inline-diagonal-grid">
          <label class="inline-diagonal inline-diagonal-red"><span>DIAGONAL VERMELHA</span><strong>C–B</strong><div><input id="next-CB" inputmode="decimal" autocomplete="off" aria-label="Nova diagonal C até B"><em>m</em></div></label>
          <label class="inline-diagonal inline-diagonal-green"><span>DIAGONAL VERDE</span><strong>A–D</strong><div><input id="next-AD" inputmode="decimal" autocomplete="off" aria-label="Nova diagonal A até D"><em>m</em></div></label>
        </div>
        <p id="inline-remeasure-error" class="inline-error" role="alert" hidden></p>
        <button class="primary-button inline-calculate" type="submit">MOSTRAR PRÓXIMO PASSO <span aria-hidden="true">⌖</span></button>
      </form>
    </article>`;
  }

  function renderFinalSideFields(values) {
    const fields = [
      ['AC', 'A–C', values.targetLength],
      ['AB', 'A–B', values.targetWidth],
      ['CD', 'C–D', values.targetWidth],
      ['BD', 'B–D', values.targetLength]
    ];
    return fields.map(([key, label, expected]) => `<label class="final-side-field">
      <span><b>${label}</b><small>deve dar ${formatMeters(expected, 2)} m</small></span>
      <span class="final-side-input"><input id="final-${key}" inputmode="decimal" autocomplete="off" aria-label="Conferência final da linha ${label}"><em>m</em></span>
    </label>`).join('');
  }

  function renderXAligned(result, values) {
    return `<article class="field-success field-x-aligned">
      <div class="field-success-mark">X</div>
      <p>CONFERÊNCIA ${fieldRound}</p>
      <h3>O X ALINHOU</h3>
      <strong>Diferença de ${formatCentimetersPrecise(result.diagonalGap)} cm — dentro da tolerância de ${formatCentimetersPrecise(values.tolerance)} cm.</strong>
      <div class="field-success-diagonals"><span>C–B <b>${formatMeters(result.lastCB || values.CB, 2)} m</b></span><span>A–D <b>${formatMeters(result.lastAD || values.AD, 2)} m</b></span></div>
    </article>
    <article class="final-check-card">
      <div class="final-check-head"><span>ÚLTIMA CONFERÊNCIA</span><h3>Confirme os quatro lados</h3><p>O X alinhou. Agora meça os lados novamente antes de liberar o gabarito.</p></div>
      <form id="final-sides-form" novalidate>
        <div class="final-side-grid">${renderFinalSideFields(values)}</div>
        <p id="final-sides-error" class="inline-error" role="alert" hidden></p>
        <button class="primary-button final-check-button" type="submit">VALIDAR GABARITO <span aria-hidden="true">✓</span></button>
      </form>
    </article>`;
  }

  function renderGabaritoConfirmed(result, values, finalSides) {
    resultBanner.className = 'result-banner is-ok';
    resultBanner.querySelector('.result-icon').textContent = '✓';
    resultOverline.textContent = 'CONFERÊNCIA COMPLETA';
    resultTitle.textContent = 'Gabarito conferido';
    resultContent.innerHTML = `<article class="field-success field-confirmed">
      <div class="field-success-mark">✓</div>
      <p>X + QUATRO LADOS</p>
      <h3>PODE LIBERAR</h3>
      <strong>As diagonais e os quatro lados ficaram dentro da tolerância informada.</strong>
      <div class="confirmed-side-grid">
        <span>A–C <b>${formatMeters(finalSides.AC, 2)} m</b></span>
        <span>A–B <b>${formatMeters(finalSides.AB, 2)} m</b></span>
        <span>C–D <b>${formatMeters(finalSides.CD, 2)} m</b></span>
        <span>B–D <b>${formatMeters(finalSides.BD, 2)} m</b></span>
      </div>
    </article><article class="metrics-card"><div class="metric"><span>Diferença final do X</span><strong>${formatCentimetersPrecise(result.diagonalGap)} cm</strong></div><div class="metric"><span>Tolerância usada</span><strong>${formatCentimetersPrecise(values.tolerance)} cm</strong></div></article>`;
    remeasureButton.hidden = true;
    resultActions.classList.add('is-field-flow');
  }

  function bindFinalSideCheck(result, values) {
    const form = document.querySelector('#final-sides-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const finalSides = {};
      ['AC', 'AB', 'CD', 'BD'].forEach((key) => { finalSides[key] = parseNumber(document.querySelector(`#final-${key}`).value); });
      const errorElement = document.querySelector('#final-sides-error');
      try {
        const validation = window.EDRGeometry.validateFinalSides(values, finalSides);
        logSessionEvent({
          kind: 'measurement',
          title: 'Quatro lados medidos na conferência final',
          detail: measurementsText(finalSides, ['AC', 'AB', 'CD', 'BD']),
          round: fieldRound,
          data: finalSides
        });
        if (!validation.valid) {
          const names = { AC: 'A–C', AB: 'A–B', CD: 'C–D', BD: 'B–D' };
          const lines = validation.invalid.map((key) => `${names[key]} está ${formatCentimetersPrecise(Math.abs(validation.deviations[key]))} cm ${validation.deviations[key] > 0 ? 'maior' : 'menor'}`).join('; ');
          errorElement.innerHTML = `<strong>Ainda não libere o gabarito.</strong> ${lines} que o projeto. Corrija o lado e meça o X novamente.`;
          errorElement.hidden = false;
          logSessionEvent({
            kind: 'stop',
            title: 'Liberação bloqueada pelos lados finais',
            detail: lines,
            round: fieldRound
          });
          const submitButton = form.querySelector('button[type="submit"]');
          submitButton.type = 'button';
          submitButton.classList.add('restart-measure-button');
          submitButton.innerHTML = 'CORRIGIR E MEDIR TUDO NOVAMENTE <span aria-hidden="true">↻</span>';
          submitButton.addEventListener('click', () => {
            prefillProjectSides(projectValues());
            showStep(2);
            window.setTimeout(() => document.querySelector('#measure-CB').focus(), 200);
          }, { once: true });
          return;
        }
        errorElement.hidden = true;
        logSessionEvent({
          kind: 'success',
          title: 'Gabarito liberado pelo aplicativo',
          detail: 'O X e os quatro lados ficaram dentro da tolerância informada.',
          round: fieldRound
        });
        renderGabaritoConfirmed(result, values, finalSides);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (_) {
        errorElement.textContent = 'Informe as quatro medidas finais dos lados.';
        errorElement.hidden = false;
      }
    });
  }

  function renderFieldStop(result, title, message) {
    const expected = result.theoreticalDiagonal ? `${formatMeters(result.theoreticalDiagonal, 2)} m` : '—';
    return `<article class="field-stop-card">
      <div class="field-stop-symbol">!</div>
      <div><span>PARE • NÃO MOVA B NEM D</span><h3>${title}</h3><p>${message}</p></div>
      <div class="provisional-tag">LIMITE PROVISÓRIO PARA TESTE</div>
    </article><article class="metrics-card"><div class="metric"><span>Diagonal esperada</span><strong>${expected}</strong></div><div class="metric"><span>Diferença atual do X</span><strong>${formatCentimetersPrecise(result.diagonalGap || 0)} cm</strong></div></article>`;
  }

  function bindFieldExecution(values, result) {
    const confirmMoveButton = document.querySelector('#confirm-field-move');
    const inlineForm = document.querySelector('#inline-remeasure-form');
    if (!confirmMoveButton || !inlineForm) return;

    confirmMoveButton.addEventListener('click', () => {
      const direction = result.sideCorrection.dy < 0 ? 'A' : 'C';
      logSessionEvent({
        kind: 'action',
        title: 'Operador marcou o movimento como executado',
        detail: `Orientação exibida: B e D juntos ${formatCentimeters(result.sideCorrection.total)} cm no sentido do ponto ${direction}.`,
        round: fieldRound
      });
      confirmMoveButton.hidden = true;
      inlineForm.hidden = false;
      inlineForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => document.querySelector('#next-CB')?.focus(), 250);
    });

    inlineForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const nextCB = parseNumber(document.querySelector('#next-CB').value);
      const nextAD = parseNumber(document.querySelector('#next-AD').value);
      const inlineError = document.querySelector('#inline-remeasure-error');
      if (!Number.isFinite(nextCB) || nextCB <= 0 || !Number.isFinite(nextAD) || nextAD <= 0) {
        inlineError.textContent = 'Informe as duas novas medidas do X.';
        inlineError.hidden = false;
        return;
      }

      try {
        const nextValues = { ...values, CB: nextCB, AD: nextAD };
        logSessionEvent({
          kind: 'measurement',
          title: 'X medido novamente',
          detail: measurementsText(nextValues, ['CB', 'AD']),
          round: fieldRound + 1,
          data: { CB: nextCB, AD: nextAD }
        });
        const nextResult = window.EDRGeometry.calculate(nextValues);
        nextResult.lastCB = nextCB;
        nextResult.lastAD = nextAD;
        const previousGap = Math.abs(values.AD - values.CB);
        if (nextResult.stage === 'correction'
          && window.EDRGeometry.didDiagonalGapWorsen(previousGap, nextResult.diagonalGap)) {
          nextResult.stage = 'worsened';
        }
        fieldRound += 1;
        if (nextResult.stage === 'correction' && fieldRound > provisionalLimits.maxAdjustments) {
          nextResult.stage = 'round-limit';
        }
        recordResult(nextResult, nextValues);
        renderResult(nextResult, nextValues);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (calculationError) {
        inlineError.textContent = calculationError.message || 'Não foi possível calcular. Confira as duas medidas.';
        inlineError.hidden = false;
      }
    });
  }

  function renderResult(result, values) {
    resultBanner.className = 'result-banner';
    resultContextLabel.textContent = 'RESULTADO DA CONFERÊNCIA';
    remeasureButton.innerHTML = 'MEDIR NOVAMENTE <span aria-hidden="true">↻</span>';
    remeasureButton.hidden = false;
    resultActions.classList.remove('is-field-flow');

    if (result.stage === 'baseline') {
      resultBanner.classList.add('is-base');
      resultBanner.querySelector('.result-icon').textContent = '!';
      resultOverline.textContent = 'CORRIJA A REFERÊNCIA PRIMEIRO';
      resultTitle.textContent = 'A linha A–C está diferente';
      const direction = result.baselineDifference > 0 ? 'em direção a A' : 'no sentido oposto a A';
      resultContent.innerHTML = `<article class="base-card"><h3>Não mexa em B ou D ainda</h3><p class="base-command">Mova somente o ponto <strong>C aproximadamente ${formatCentimeters(result.moveCBy)} cm ${direction}</strong>.</p><p>Depois confira A–C novamente. Só então o sistema calcula B e D.</p></article><article class="metrics-card"><div class="metric"><span>Projeto A–C</span><strong>${formatMeters(values.targetLength)} m</strong></div><div class="metric"><span>Medido A–C</span><strong>${formatMeters(values.AC)} m</strong></div></article>`;
      return;
    }

    const fieldSideShift = result.mode === 'side-shift';
    const moveSideTogether = result.stage === 'correction'
      && (fieldSideShift || shouldMoveSideTogether(result.correctionB, result.correctionD, values.tolerance));
    const isApproved = result.stage === 'ok';
    const isXAligned = result.stage === 'x-aligned';
    const isStopped = ['diagonal-inconsistent', 'movement-limit', 'worsened', 'round-limit'].includes(result.stage);
    resultBanner.querySelector('.result-icon').textContent = isApproved || isXAligned ? '✓' : isStopped ? '!' : '↗';
    if (isApproved) {
      resultBanner.classList.add('is-ok');
      resultOverline.textContent = 'GABARITO CONFERIDO';
      resultTitle.textContent = 'Está dentro da tolerância';
    } else if (isXAligned) {
      resultBanner.classList.add('is-x-aligned');
      resultOverline.textContent = 'X DENTRO DA TOLERÂNCIA';
      resultTitle.textContent = 'Agora confira os lados';
    } else if (isStopped) {
      resultBanner.classList.add('is-stop');
      resultOverline.textContent = 'CONFERÊNCIA OBRIGATÓRIA';
      resultTitle.textContent = 'Pare antes de mover';
    } else {
      resultOverline.textContent = 'CORREÇÃO NECESSÁRIA';
      resultTitle.textContent = moveSideTogether ? 'Mova B e D juntos' : 'Mova os pontos indicados';
    }

    if (fieldSideShift) {
      remeasureButton.hidden = true;
      resultActions.classList.add('is-field-flow');
      if (isXAligned) {
        resultContent.innerHTML = `${renderXAligned(result, values)}<article class="metrics-card"><div class="metric"><span>Diagonal ideal</span><strong>${formatMeters(result.theoreticalDiagonal, 2)} m</strong></div><div class="metric"><span>Diferença do X</span><strong>${formatCentimetersPrecise(result.diagonalGap)} cm</strong></div></article>`;
        bindFinalSideCheck(result, values);
      } else if (result.stage === 'diagonal-inconsistent') {
        const cbError = formatCentimetersPrecise(Math.abs(result.diagonalErrors.CB));
        const adError = formatCentimetersPrecise(Math.abs(result.diagonalErrors.AD));
        resultContent.innerHTML = renderFieldStop(result, 'As diagonais não combinam com o projeto', `C–B está ${cbError} cm e A–D está ${adError} cm afastada do valor esperado. Meça novamente nos mesmos pregos. Se repetir, confira os quatro lados.`);
        remeasureButton.hidden = false;
        remeasureButton.innerHTML = 'CONFERIR OS 4 LADOS <span aria-hidden="true">↻</span>';
      } else if (result.stage === 'movement-limit') {
        resultContent.innerHTML = renderFieldStop(result, 'O movimento calculado ficou grande demais', `O sistema encontrou ${formatCentimetersPrecise(result.sideCorrection.total)} cm. O teto provisório é ${formatCentimetersPrecise(result.movementLimit)} cm. Confira os quatro lados e as duas diagonais antes de mover.`);
        remeasureButton.hidden = false;
        remeasureButton.innerHTML = 'CONFERIR OS 4 LADOS <span aria-hidden="true">↻</span>';
      } else if (result.stage === 'worsened') {
        resultContent.innerHTML = renderFieldStop(result, 'A diferença do X aumentou', 'Pode ter ocorrido troca das diagonais, movimento no sentido contrário ou ultrapassagem do ponto. Confira as letras A, B, C e D e meça os quatro lados antes de continuar.');
        remeasureButton.hidden = false;
        remeasureButton.innerHTML = 'CONFERIR OS 4 LADOS <span aria-hidden="true">↻</span>';
      } else if (result.stage === 'round-limit') {
        resultContent.innerHTML = renderFieldStop(result, 'Três ajustes não fecharam o X', 'Pare a sequência. Confira os quatro lados, os mesmos pontos de leitura e o alinhamento A–C antes de tentar novamente.');
        remeasureButton.hidden = false;
        remeasureButton.innerHTML = 'CONFERIR OS 4 LADOS <span aria-hidden="true">↻</span>';
      } else {
        resultContent.innerHTML = `${renderFieldDiagram(result.sideCorrection)}<article class="metrics-card field-metrics"><div class="metric"><span>Diferença atual do X</span><strong>${formatCentimeters(Math.abs(result.diagonalDifference))} cm</strong></div><div class="metric"><span>Movimento indicado</span><strong>${formatCentimeters(result.sideCorrection.total)} cm</strong></div></article>`;
        bindFieldExecution(values, result);
      }
      return;
    }

    remeasureButton.hidden = false;
    resultActions.classList.remove('is-field-flow');

    let nextHeading = 'Depois de mover';
    let nextText = fieldSideShift
      ? 'Depois do movimento, meça somente as duas diagonais novamente. Quando elas ficarem iguais, o X fechou.'
      : 'Meça as seis linhas novamente e toque em “Medir novamente”. O resultado só é aprovado quando os pontos ficam dentro da tolerância.';
    if (result.stage === 'ok') {
      nextHeading = 'Conferência concluída';
      nextText = 'Com as medidas informadas, os pontos estão dentro da tolerância definida. Se qualquer estaca for movida, faça uma nova conferência.';
    }
    const groupedCorrection = fieldSideShift
      ? result.sideCorrection
      : moveSideTogether
        ? {
            dx: (result.correctionB.dx + result.correctionD.dx) / 2,
            dy: (result.correctionB.dy + result.correctionD.dy) / 2,
            total: (result.correctionB.total + result.correctionD.total) / 2
          }
        : null;
    const correctionCards = moveSideTogether
      ? renderSideMoveCard(groupedCorrection, values.tolerance)
      : `${renderMoveCard('B', result.correctionB, values.tolerance)}${renderMoveCard('D', result.correctionD, values.tolerance)}`;
    const fieldNote = fieldSideShift && result.measurementWarning
      ? '<article class="check-card measurement-note"><h3>Conferência depois do movimento</h3><p>As diagonais também ficaram diferentes do valor esperado. Faça primeiro o movimento indicado acima. Se o X ainda não fechar, confira novamente os quatro lados.</p></article>'
      : '';
    resultContent.innerHTML = `${correctionCards}<article class="metrics-card"><div class="metric"><span>Diagonal ideal</span><strong>${formatMeters(result.theoreticalDiagonal, 2)} m</strong></div><div class="metric"><span>Diferença do X</span><strong>${formatCentimeters(Math.abs(result.diagonalDifference))} cm</strong></div></article>${fieldNote}<article class="check-card"><h3>${nextHeading}</h3><p>${nextText}</p></article>`;
  }

  measureForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = measurementValues();
    const error = validateMeasurements(values);
    if (error) {
      measureError.textContent = error;
      measureError.hidden = false;
      return;
    }

    try {
      const result = window.EDRGeometry.calculate(values);
      fieldRound = 1;
      startSession(values);
      if (result.stage === 'inconsistent') {
        recordResult(result, values);
        const expectedDiagonal = Math.hypot(values.targetLength, values.targetWidth);
        measureError.innerHTML = `<strong>Esses seis números não conseguem formar o mesmo gabarito.</strong> A linha B–D ficou incompatível em ${formatCentimeters(Math.abs(result.closureError))} cm. Para comparação, a diagonal no esquadro seria perto de ${formatMeters(expectedDiagonal)} m. Confira B–D e as duas diagonais antes de mover qualquer ponto.`;
        measureError.hidden = false;
        return;
      }
      if (result.stage === 'diagonal-inconsistent') {
        recordResult(result, values);
        measureError.innerHTML = `<strong>PARE — não mova B nem D.</strong> Para este projeto, cada diagonal deve ficar perto de ${formatMeters(result.theoreticalDiagonal, 2)} m. C–B ficou ${formatCentimetersPrecise(Math.abs(result.diagonalErrors.CB))} cm afastada e A–D ficou ${formatCentimetersPrecise(Math.abs(result.diagonalErrors.AD))} cm afastada. Meça novamente nos mesmos pregos. Se repetir, confira os quatro lados.<small class="alert-limit">Limite provisório do teste: ${formatCentimetersPrecise(result.consistencyLimit)} cm por diagonal.</small>`;
        measureError.hidden = false;
        return;
      }
      if (result.stage === 'movement-limit') {
        recordResult(result, values);
        measureError.innerHTML = `<strong>PARE — o movimento calculado ficou grande demais.</strong> O sistema encontrou ${formatCentimetersPrecise(result.sideCorrection.total)} cm. Confira os quatro lados e as diagonais antes de mover.<small class="alert-limit">Teto provisório do teste: ${formatCentimetersPrecise(result.movementLimit)} cm.</small>`;
        measureError.hidden = false;
        return;
      }
      measureError.hidden = true;
      result.lastCB = values.CB;
      result.lastAD = values.AD;
      recordResult(result, values);
      renderResult(result, values);
      showStep(3);
    } catch (calculationError) {
      measureError.textContent = calculationError.message || 'Não foi possível calcular. Confira as medidas.';
      measureError.hidden = false;
    }
  });

  function clearAllMeasurements() {
    document.querySelectorAll('.measure-field input').forEach((input) => { input.value = ''; });
    ['AC', 'AB', 'CD', 'BD'].forEach((key) => setSideSource(key, 'do projeto • confirme', true));
    document.querySelector('#confirm-sides').checked = false;
    measureError.hidden = true;
  }

  document.querySelector('#back-project').addEventListener('click', () => showStep(1));
  document.querySelector('#back-measures').addEventListener('click', () => showStep(2));
  remeasureButton.addEventListener('click', () => {
    prefillProjectSides(projectValues());
    showStep(2);
    window.setTimeout(() => document.querySelector('#measure-CB').focus(), 200);
  });
  document.querySelector('#new-project').addEventListener('click', () => {
    clearAllMeasurements();
    document.querySelector('#target-length').value = '';
    document.querySelector('#target-width').value = '';
    showStep(1);
  });

  function refreshSessionLogButton() {
    const eventCount = activeSession?.events?.length || 0;
    sessionLogButton.hidden = !activeSession;
    document.querySelector('#session-event-count').textContent = String(eventCount);
  }

  function renderSessionLog() {
    if (!activeSession) return;
    const summary = document.querySelector('#session-log-summary');
    const events = document.querySelector('#session-log-events');
    summary.textContent = `${activeSession.project.targetLength} × ${activeSession.project.targetWidth} m • tolerância ${activeSession.project.toleranceCm} cm • início ${sessionLogApi.formatDateTime(activeSession.startedAt)}`;
    events.replaceChildren();
    activeSession.events.forEach((event) => {
      const item = document.createElement('li');
      item.className = `is-${event.kind}`;
      const marker = document.createElement('span');
      marker.textContent = event.round ? String(event.round) : '•';
      const content = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = event.title;
      const detail = document.createElement('p');
      detail.textContent = event.detail;
      const time = document.createElement('small');
      time.textContent = sessionLogApi.formatDateTime(event.at);
      content.append(title, detail, time);
      item.append(marker, content);
      events.append(item);
    });
  }

  function openSessionLog() {
    if (!activeSession) return;
    document.querySelector('#session-log-feedback').textContent = '';
    renderSessionLog();
    if (typeof sessionLogDialog.showModal === 'function') sessionLogDialog.showModal();
    else sessionLogDialog.setAttribute('open', '');
  }

  function closeSessionLog() {
    if (typeof sessionLogDialog.close === 'function') sessionLogDialog.close();
    else sessionLogDialog.removeAttribute('open');
  }

  async function copySessionLog() {
    const text = sessionLogApi.sessionToText(activeSession);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.append(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    document.querySelector('#session-log-feedback').textContent = 'Registro copiado.';
  }

  sessionLogButton.addEventListener('click', openSessionLog);
  document.querySelector('#close-session-log').addEventListener('click', closeSessionLog);
  document.querySelector('#copy-session-log').addEventListener('click', () => copySessionLog().catch(() => {
    document.querySelector('#session-log-feedback').textContent = 'Não foi possível copiar automaticamente.';
  }));
  document.querySelector('#share-session-log').addEventListener('click', async () => {
    const text = sessionLogApi.sessionToText(activeSession);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'EDR Esquadro — registro experimental', text });
      } else {
        await copySessionLog();
      }
    } catch (error) {
      if (error?.name !== 'AbortError') document.querySelector('#session-log-feedback').textContent = 'Compartilhamento cancelado ou indisponível.';
    }
  });
  sessionLogDialog.addEventListener('click', (event) => {
    if (event.target === sessionLogDialog) closeSessionLog();
  });

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function updateConnectionStatus() {
    const label = connectionStatus.querySelector('b');
    connectionStatus.classList.toggle('is-disconnected', !navigator.onLine);
    if (isStandalone()) {
      label.textContent = 'APP INSTALADO';
    } else if (!navigator.onLine) {
      label.textContent = 'SEM INTERNET';
    } else if (navigator.serviceWorker?.controller) {
      label.textContent = 'OFFLINE PRONTO';
    } else {
      label.textContent = 'LOCAL';
    }
  }

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
    installButton.textContent = 'INSTALAR';
    document.querySelector('#install-message').textContent = 'Instale para abrir em tela cheia e usar depois sem internet.';
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    document.querySelector('#install-panel').hidden = true;
    updateConnectionStatus();
  });
  installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      document.querySelector('#install-message').textContent = 'No Chrome, abra o menu ⋮ e toque em “Instalar aplicativo” ou “Adicionar à tela inicial”.';
      installButton.textContent = 'USE O MENU ⋮';
      return;
    }
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') installButton.hidden = true;
    deferredInstallPrompt = null;
  });

  try {
    const stored = JSON.parse(localStorage.getItem('edr-esquadro-project'));
    if (stored?.targetLength) document.querySelector('#target-length').value = String(stored.targetLength).replace('.', ',');
    if (stored?.targetWidth) document.querySelector('#target-width').value = String(stored.targetWidth).replace('.', ',');
    if (stored?.tolerance) document.querySelector('#tolerance').value = String(stored.tolerance * 100).replace('.', ',');
  } catch (_) {
    // Sem estado anterior; os campos permanecem vazios.
  }

  try {
    const storedSession = JSON.parse(localStorage.getItem(sessionStorageKey));
    if (storedSession?.id && Array.isArray(storedSession.events)) activeSession = storedSession;
  } catch (_) {
    // Sem registro anterior; ele será criado na primeira conferência.
  }

  setProjectDimensionFocus('length');
  refreshSessionLogButton();
  updateConnectionStatus();
  if (isStandalone()) document.querySelector('#install-panel').hidden = true;

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then(updateConnectionStatus)
        .catch(() => {
          document.querySelector('#install-message').textContent = 'O cálculo local funciona, mas o modo offline não pôde ser preparado neste navegador.';
          updateConnectionStatus();
        });
    });
    navigator.serviceWorker.addEventListener('controllerchange', updateConnectionStatus);
  }
})();
