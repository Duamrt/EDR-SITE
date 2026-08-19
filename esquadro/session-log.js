(function exposeSessionLog(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EDRSessionLog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function sessionLogFactory() {
  'use strict';

  const MAX_EVENTS = 80;

  function isoTime(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  function createSession(project, initialMeasurements, now) {
    const startedAt = isoTime(now);
    return {
      version: 1,
      id: `edr-${startedAt.replace(/\D/g, '').slice(0, 14)}`,
      startedAt,
      updatedAt: startedAt,
      project: { ...project },
      initialMeasurements: { ...initialMeasurements },
      events: []
    };
  }

  function appendEvent(session, event, now) {
    if (!session || !Array.isArray(session.events)) throw new Error('Registro de conferência inválido.');
    const at = isoTime(now);
    session.updatedAt = at;
    session.events.push({
      at,
      kind: event.kind || 'note',
      title: event.title || 'Registro',
      detail: event.detail || '',
      round: Number.isFinite(event.round) ? event.round : null,
      data: event.data ? { ...event.data } : null
    });
    if (session.events.length > MAX_EVENTS) session.events.splice(0, session.events.length - MAX_EVENTS);
    return session;
  }

  function formatDateTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'horário não registrado';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function sessionToText(session) {
    if (!session) return 'Nenhuma conferência registrada.';
    const project = session.project || {};
    const lines = [
      'EDR ESQUADRO — REGISTRO EXPERIMENTAL',
      `Início: ${formatDateTime(session.startedAt)}`,
      `Projeto: ${project.targetLength ?? '—'} m × ${project.targetWidth ?? '—'} m`,
      `Tolerância do X: ${project.toleranceCm ?? '—'} cm`,
      ''
    ];
    (session.events || []).forEach((event, index) => {
      const round = event.round ? ` • rodada ${event.round}` : '';
      lines.push(`${index + 1}. ${formatDateTime(event.at)}${round} — ${event.title}`);
      if (event.detail) lines.push(`   ${event.detail}`);
    });
    lines.push('', 'Uso experimental: resultado ainda depende do ensaio físico controlado.');
    return lines.join('\n');
  }

  return { MAX_EVENTS, createSession, appendEvent, formatDateTime, sessionToText };
});
