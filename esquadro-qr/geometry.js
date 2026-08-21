(function exposeGeometry(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EDRGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function geometryFactory() {
  'use strict';

  const EPSILON = 1e-9;
  // Valores de proteção provisórios para o ensaio físico 8 x 4 m.
  // Eles precisam continuar configuráveis até a validação documentada no chão.
  const PROVISIONAL_LIMITS = Object.freeze({
    diagonalConsistency: 0.05,
    maxMovement: 0.10,
    maxAdjustments: 3,
    worseningMargin: 0.005
  });

  function requirePositive(name, value) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} precisa ser maior que zero.`);
    }
  }

  function locatePoint(baseline, distanceA, distanceC, pointName) {
    requirePositive('A medida A–C', baseline);
    requirePositive(`A primeira medida do ponto ${pointName}`, distanceA);
    requirePositive(`A segunda medida do ponto ${pointName}`, distanceC);

    if (distanceA + distanceC < baseline - EPSILON || Math.abs(distanceA - distanceC) > baseline + EPSILON) {
      throw new Error(`As medidas que chegam ao ponto ${pointName} não formam um triângulo. Confira essas duas linhas.`);
    }

    const y = ((distanceA * distanceA) - (distanceC * distanceC) + (baseline * baseline)) / (2 * baseline);
    const xSquared = (distanceA * distanceA) - (y * y);

    if (xSquared < -1e-7) {
      throw new Error(`As medidas do ponto ${pointName} não fecham. Meça novamente.`);
    }

    return { x: Math.sqrt(Math.max(0, xSquared)), y };
  }

  function pointCorrection(current, target, tolerance) {
    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const total = Math.hypot(dx, dy);
    return {
      dx,
      dy,
      total,
      inTolerance: total <= tolerance + EPSILON
    };
  }

  function sidesMatchProject(input) {
    const fieldTolerance = Math.max(input.tolerance, 0.01);
    return Math.abs(input.AC - input.targetLength) <= fieldTolerance + EPSILON
      && Math.abs(input.BD - input.targetLength) <= fieldTolerance + EPSILON
      && Math.abs(input.AB - input.targetWidth) <= fieldTolerance + EPSILON
      && Math.abs(input.CD - input.targetWidth) <= fieldTolerance + EPSILON;
  }

  function calculateSideShift(input, pointB, pointD) {
    const theoreticalDiagonal = Math.hypot(input.targetLength, input.targetWidth);
    const diagonalDifference = input.AD - input.CB;
    const diagonalGap = Math.abs(diagonalDifference);
    const currentShift = ((input.AD * input.AD) - (input.CB * input.CB)) / (4 * input.AC);
    const consistencyLimit = Number.isFinite(input.diagonalConsistencyLimit)
      ? input.diagonalConsistencyLimit
      : PROVISIONAL_LIMITS.diagonalConsistency;
    const movementLimit = Number.isFinite(input.maxMovement)
      ? input.maxMovement
      : PROVISIONAL_LIMITS.maxMovement;
    const alertTolerance = Number.isFinite(input.alertTolerance)
      ? Math.max(input.alertTolerance, input.tolerance)
      : input.tolerance;
    const diagonalErrors = {
      CB: input.CB - theoreticalDiagonal,
      AD: input.AD - theoreticalDiagonal
    };
    const maxDiagonalError = Math.max(Math.abs(diagonalErrors.CB), Math.abs(diagonalErrors.AD));
    const xInTolerance = diagonalGap <= input.tolerance + EPSILON;
    const correction = {
      dx: 0,
      dy: -currentShift,
      total: Math.abs(currentShift),
      inTolerance: xInTolerance
    };
    const averageDiagonalDifference = ((input.AD + input.CB) / 2) - theoreticalDiagonal;
    let stage = 'correction';

    if (maxDiagonalError > consistencyLimit + EPSILON) {
      stage = 'diagonal-inconsistent';
    } else if (xInTolerance) {
      stage = 'x-aligned';
    } else if (diagonalGap <= alertTolerance + EPSILON) {
      stage = 'fine-adjustment';
    } else if (correction.total > movementLimit + EPSILON) {
      stage = 'movement-limit';
    }

    return {
      stage,
      mode: 'side-shift',
      pointB,
      pointD,
      sideCorrection: correction,
      correctionB: correction,
      correctionD: correction,
      theoreticalDiagonal,
      diagonalDifference,
      diagonalGap,
      diagonalErrors,
      maxDiagonalError,
      consistencyLimit,
      movementLimit,
      alertTolerance,
      averageDiagonalDifference,
      measurementWarning: maxDiagonalError > consistencyLimit + EPSILON,
      tolerance: input.tolerance
    };
  }

  function didDiagonalGapWorsen(previousGap, nextGap, margin = PROVISIONAL_LIMITS.worseningMargin) {
    return Number.isFinite(previousGap)
      && Number.isFinite(nextGap)
      && nextGap > previousGap + margin + EPSILON;
  }

  function validateFinalSides(input, measuredSides) {
    const expected = {
      AC: input.targetLength,
      AB: input.targetWidth,
      CD: input.targetWidth,
      BD: input.targetLength
    };
    const deviations = {};
    const invalid = [];

    Object.keys(expected).forEach((key) => {
      requirePositive(key, measuredSides[key]);
      deviations[key] = measuredSides[key] - expected[key];
      if (Math.abs(deviations[key]) > input.tolerance + EPSILON) invalid.push(key);
    });

    return { valid: invalid.length === 0, expected, deviations, invalid };
  }

  function calculate(input) {
    const required = ['targetLength', 'targetWidth', 'tolerance', 'AC', 'AB', 'CB', 'CD', 'AD', 'BD'];
    required.forEach((key) => requirePositive(key, input[key]));

    const baselineDifference = input.AC - input.targetLength;
    if (Math.abs(baselineDifference) > input.tolerance + EPSILON) {
      return {
        stage: 'baseline',
        baselineDifference,
        moveCBy: Math.abs(baselineDifference),
        moveCToward: baselineDifference > 0 ? 'A' : 'oposto de A'
      };
    }

    const pointB = locatePoint(input.AC, input.AB, input.CB, 'B');
    const pointD = locatePoint(input.AC, input.AD, input.CD, 'D');

    // Fluxo normal de campo: os quatro lados foram conferidos e somente o X
    // precisa fechar. A diferença das diagonais define quanto o lado B-D
    // inteiro deve subir ou descer, sem depender da precisão absoluta delas.
    if (sidesMatchProject(input)) {
      return calculateSideShift(input, pointB, pointD);
    }
    const reconstructedBD = Math.hypot(pointD.x - pointB.x, pointD.y - pointB.y);
    const closureError = input.BD - reconstructedBD;
    const closureLimit = Math.max(input.tolerance * 2, 0.01);

    if (Math.abs(closureError) > closureLimit + EPSILON) {
      return {
        stage: 'inconsistent',
        closureError,
        reconstructedBD,
        closureLimit
      };
    }

    const targetB = { x: input.targetWidth, y: 0 };
    const targetD = { x: input.targetWidth, y: input.AC };
    const correctionB = pointCorrection(pointB, targetB, input.tolerance);
    const correctionD = pointCorrection(pointD, targetD, input.tolerance);
    const theoreticalDiagonal = Math.hypot(input.AC, input.targetWidth);

    return {
      stage: correctionB.inTolerance && correctionD.inTolerance ? 'ok' : 'correction',
      pointB,
      pointD,
      correctionB,
      correctionD,
      reconstructedBD,
      closureError,
      theoreticalDiagonal,
      diagonalDifference: input.AD - input.CB,
      tolerance: input.tolerance
    };
  }

  return {
    PROVISIONAL_LIMITS,
    calculate,
    locatePoint,
    pointCorrection,
    calculateSideShift,
    sidesMatchProject,
    didDiagonalGapWorsen,
    validateFinalSides
  };
});
