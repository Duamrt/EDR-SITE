/* EDR Esquadro v1.1 — telas. O cálculo fica todo em geometria.js (testado em testes/).
   Estrutura recomendada na revisão IA-03 (Cerberus): desenho como guia, uma trena por vez,
   releitura obrigatória e digitada, uma ordem por canto, cadastro recolhido. */
{
  'use strict';
  const G = window.EDRGeometria;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const tela = $('#tela');

  const EXEMPLO = {
    nome: 'Arthur — Rua Projetada, 67 (prancha 03)',
    nomesV: '1 2 3 4 5 6 7 8 9 10', cotasV: '1,50 0,52 3,34 1,55 1,27 0,96 2,06 1,42 6,05',
    nomesH: 'A B C D E F', cotasH: '7,74 3,12 1,22 1,40 1,42',
    v0: '2', v1: '9', h0: 'B', h1: 'F', referencia: 'F', tolerancia: '1', gabarito: '',
  };
  const VAZIO = { nome: '', nomesV: '', cotasV: '', nomesH: '', cotasH: '', v0: '', v1: '', h0: '', h1: '', referencia: '', tolerancia: '1', gabarito: '' };
  const K_OBRAS = 'edr-esquadro-obras-v1', K_ULTIMA = 'edr-esquadro-ultima-v1', K_REG = 'edr-esquadro-registro-v1';
  const ORDEM = ['ref', 'lado1', 'lado2', 'diag1', 'diag2', 'oposto'];

  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sem armazenamento */ } };
  const ler = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch (_) { return padrao; } };

  const E = {
    proj: null, r: null, erroProj: '', configAberta: false,
    tela: 'obra', modo: 'medir', fila: ORDEM, idx: 0, voltarParaRevisao: false,
    med: {}, leituras: {}, rodada: 1, anterior: null, res: null, piorou: false, canto: 'M1', paradaLeitura: null,
  };

  /* ---------- formatação ---------- */
  const num = (v, c) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const m2 = (v) => num(v, 2), m3 = (v) => num(v, 3);
  const cm = (v) => num(Math.abs(v) * 100, 1);
  const cmSinal = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v) * 100, 1) + ' cm';
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function cfg() {
    const tol = Number(String(E.proj?.tolerancia ?? '1').replace(',', '.'));
    const gab = Number(String(E.proj?.gabarito ?? '').replace(',', '.'));
    return { tolerancia: Number.isFinite(tol) && tol > 0 ? tol / 100 : 0.01, gabarito: Number.isFinite(gab) && gab > 0 ? gab : undefined };
  }

  function montar(p) {
    E.proj = { ...VAZIO, ...p };
    try { E.r = G.montarRetangulo(E.proj); E.erroProj = ''; } catch (e) { E.r = null; E.erroProj = e.message; }
    $('#subtitulo').textContent = E.proj.nome || 'Locação por eixos';
  }

  function trenas() {
    const r = E.r, e = G.esperado(r);
    return {
      ref: { de: r.R1, ate: r.R2, tipo: `Linha fixa ${r.linhaRef}`, esp: e.ref },
      lado1: { de: r.R1, ate: r.M1, tipo: `Lado no eixo ${r.lado1}`, esp: e.lado1 },
      lado2: { de: r.R2, ate: r.M2, tipo: `Lado no eixo ${r.lado2}`, esp: e.lado2 },
      diag1: { de: r.R1, ate: r.M2, tipo: 'Diagonal', esp: e.diag1, diagonal: true },
      diag2: { de: r.R2, ate: r.M1, tipo: 'Diagonal', esp: e.diag2, diagonal: true },
      oposto: { de: r.M1, ate: r.M2, tipo: `Lado oposto ${r.linhaOposta} • conferência`, esp: e.oposto },
    };
  }

  /* ---------- desenho ---------- */
  const caixa = (el) => ({ W: el.clientWidth || 400, H: el.clientHeight || 320 });
  function escala(pts, W, H, mg) {
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const k = Math.min((W - mg.e - mg.d) / Math.max(maxX - minX, 0.01), (H - mg.t - mg.b) / Math.max(maxY - minY, 0.01));
    const ox = mg.e + ((W - mg.e - mg.d) - (maxX - minX) * k) / 2 - minX * k;
    const oy = mg.t + ((H - mg.t - mg.b) - (maxY - minY) * k) / 2 - minY * k;
    return (p) => ({ x: ox + p.x * k, y: oy + p.y * k });
  }
  function posicoes(r) {
    const xs = Object.fromEntries(r.V.map((e) => [e.nome, e.pos]));
    const ys = Object.fromEntries(r.H.map((e) => [e.nome, e.pos]));
    return (nome) => { const [v, h] = nome.split('-'); return { x: xs[v], y: ys[h] }; };
  }
  function rotulos(r, P, ponto, pos = {}, destaque = []) {
    const centro = P({ x: (r.va.pos + r.vb.pos) / 2, y: (r.ha.pos + r.hb.pos) / 2 });
    return [['R1', 1], ['R2', 1], ['M1', 0], ['M2', 0]].map(([k, fixo]) => {
      const nome = r[k], p = pos[k] || P(ponto(nome));
      const cls = destaque.includes(nome) ? 'ponta' : fixo ? 'fixo' : '';
      const dx = p.x < centro.x ? -1 : 1, dy = p.y < centro.y ? -1 : 1;
      return `<circle class="d-ponto ${cls}" cx="${p.x}" cy="${p.y}" r="${cls === 'ponta' ? 10 : 7}"/>` +
        `<text class="d-rot ${cls}" x="${p.x + dx * 12}" y="${p.y + dy * 18 + (dy < 0 ? 4 : 2)}" text-anchor="${dx < 0 ? 'end' : 'start'}">${esc(nome)}${fixo && cls !== 'ponta' ? ' • fixo' : ''}</text>`;
    }).join('');
  }
  function svg(el, conteudo) { const { W, H } = caixa(el); el.innerHTML = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}">${conteudo(W, H)}</svg>`; }

  function desenhoObra(el) {
    const r = E.r; if (!r || !el) return;
    svg(el, (W, H) => {
      const ponto = posicoes(r);
      const P = escala([...r.V.map((e) => ({ x: e.pos, y: r.ha.pos })), ...r.H.map((e) => ({ x: r.va.pos, y: e.pos }))], W, H, { e: 40, d: 24, t: 34, b: 24 });
      let s = '';
      r.V.forEach((e) => { const a = P({ x: e.pos, y: 0 }); s += `<line class="d-eixo" x1="${a.x}" y1="26" x2="${a.x}" y2="${H - 6}"/>`; });
      r.H.forEach((e) => { const a = P({ x: 0, y: e.pos }); s += `<line class="d-eixo" x1="30" y1="${a.y}" x2="${W - 6}" y2="${a.y}"/>`; });
      let ux = -99; r.V.forEach((e) => { const a = P({ x: e.pos, y: 0 }); if (a.x - ux >= 18) { s += `<text class="d-eixo-rot" x="${a.x}" y="18" text-anchor="middle">${esc(e.nome)}</text>`; ux = a.x; } });
      let uy = -99; r.H.forEach((e) => { const a = P({ x: 0, y: e.pos }); if (a.y - uy >= 18) { s += `<text class="d-eixo-rot" x="16" y="${a.y + 5}" text-anchor="middle">${esc(e.nome)}</text>`; uy = a.y; } });
      const c = [r.R1, r.R2, r.M2, r.M1].map((n) => P(ponto(n)));
      s += `<polygon class="d-casa" points="${c.map((p) => p.x + ',' + p.y).join(' ')}"/>`;
      s += `<line class="d-ref" x1="${c[0].x}" y1="${c[0].y}" x2="${c[1].x}" y2="${c[1].y}"/>`;
      return s + rotulos(r, P, ponto);
    });
  }

  function desenhoTrena(el, kAtual, feitas) {
    const r = E.r; if (!r || !el) return;
    const T = trenas();
    svg(el, (W, H) => {
      const ponto = posicoes(r);
      const P = escala([r.R1, r.R2, r.M1, r.M2].map(ponto), W, H, { e: 96, d: 96, t: 46, b: 46 });
      const c = [r.R1, r.R2, r.M2, r.M1].map((n) => P(ponto(n)));
      let s = `<polygon class="d-casa" points="${c.map((p) => p.x + ',' + p.y).join(' ')}"/>`;
      s += `<line class="d-ref" x1="${c[0].x}" y1="${c[0].y}" x2="${c[1].x}" y2="${c[1].y}" opacity=".35"/>`;
      ORDEM.forEach((k) => {
        if (k === kAtual) return;
        const a = P(ponto(T[k].de)), b = P(ponto(T[k].ate));
        s += `<line class="d-trena${feitas.includes(k) ? ' feita' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
      });
      const t = T[kAtual];
      const a = P(ponto(t.de)), b = P(ponto(t.ate));
      s += `<line class="d-trena atual" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
      return s + rotulos(r, P, ponto, {}, [t.de, t.ate]);
    });
  }

  function desenhoCorrecao(el, res, canto) {
    const r = E.r; if (!r || !el || !res.c1) return;
    svg(el, (W, H) => {
      const ponto = posicoes(r);
      const pR1 = ponto(r.R1), pR2 = ponto(r.R2), pM1 = ponto(r.M1);
      const L = Math.hypot(pR2.x - pR1.x, pR2.y - pR1.y);
      const u = { x: (pR2.x - pR1.x) / L, y: (pR2.y - pR1.y) / L }, v = { x: (pM1.x - pR1.x) / r.h, y: (pM1.y - pR1.y) / r.h };
      const loc = (q) => ({ x: pR1.x + q.x * u.x + q.y * v.x, y: pR1.y + q.x * u.y + q.y * v.y });
      const maxErr = Math.max(res.c1.total, res.c2.total, 1e-6);
      const k = Math.max(1, Math.min(60, (Math.min(r.s, r.h) * 0.1) / maxErr));
      const ex = (a, b) => ({ x: b.x + (a.x - b.x) * k, y: b.y + (a.y - b.y) * k });
      const pts = [loc({ x: 0, y: 0 }), loc({ x: res.base, y: 0 }), loc(res.alvo2), loc(res.alvo1), loc(ex(res.M1, res.alvo1)), loc(ex(res.M2, res.alvo2))];
      const P = escala(pts, W, H, { e: 96, d: 96, t: 46, b: 46 });
      const [r1, r2, t2, t1, a1, a2] = pts.map(P);
      let s = `<polygon class="d-casa" points="${[r1, r2, t2, t1].map((p) => p.x + ',' + p.y).join(' ')}"/>`;
      s += `<polyline class="d-atual" points="${[r1, a1, a2, r2].map((p) => p.x + ',' + p.y).join(' ')}"/>`;
      s += `<line class="d-ref" x1="${r1.x}" y1="${r1.y}" x2="${r2.x}" y2="${r2.y}"/>`;
      s += `<defs><marker id="ponta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path class="d-seta-ponta" d="M0 0L10 5L0 10z"/></marker></defs>`;
      const alvoAtual = canto === 'M1' ? [a1, t1, res.c1] : [a2, t2, res.c2];
      if (alvoAtual[2].total > res.tolerancia && Math.hypot(alvoAtual[1].x - alvoAtual[0].x, alvoAtual[1].y - alvoAtual[0].y) > 10) {
        s += `<line class="d-seta" x1="${alvoAtual[0].x}" y1="${alvoAtual[0].y}" x2="${alvoAtual[1].x}" y2="${alvoAtual[1].y}" marker-end="url(#ponta)"/>`;
      }
      s += `<circle class="d-ponto ponta" cx="${alvoAtual[0].x}" cy="${alvoAtual[0].y}" r="7" opacity=".9"/>`;
      return s + rotulos(r, P, ponto, { R1: r1, R2: r2, M1: t1, M2: t2 }, [r[canto]]);
    });
  }

  /* ---------- navegação ---------- */
  function ir(nova) {
    E.tela = nova;
    $('#voltar').hidden = nova === 'obra';
    render();
    window.scrollTo({ top: 0 });
  }
  $('#voltar').addEventListener('click', () => {
    if (E.tela === 'medir') {
      if (E.idx > 0) { E.idx -= 1; render(); }
      else if (E.modo === 'medir') ir('obra');
      else ir('revisar');
    } else if (E.tela === 'revisar') { E.modo = 'medir'; E.fila = ORDEM; E.idx = ORDEM.length - 1; ir('medir'); }
    else ir('obra');
  });

  function render() {
    ({ obra: telaObra, medir: telaMedir, revisar: telaRevisar, resultado: telaResultado }[E.tela])();
  }

  /* ---------- TELA: obra ---------- */
  function telaObra() {
    const r = E.r, p = E.proj;
    const aberta = E.configAberta || !r;
    const obras = ler(K_OBRAS, {});
    tela.innerHTML = `
      <div class="palco">
        <div class="quadro">${r ? `<div class="desenho" id="d-obra" role="img" aria-label="Prancha de locação com a casa"></div><p class="legenda">Linha verde grossa = linha fixa, já conferida no lote. Os eixos em vermelho são os da prancha.</p>` : `<div class="desenho"></div>`}</div>
        <div class="comando">
          ${r ? `<div><h1>${esc(p.nome || 'Obra sem nome')}</h1><p class="sub">Casa entre os eixos ${esc(r.lado1)}–${esc(r.lado2)} e ${esc(r.linhaRef)}–${esc(r.linhaOposta)}. Fixos: <b>${r.R1}</b> e <b>${r.R2}</b>.</p></div>
          <div class="numeros"><div><small>Casa</small><b>${m2(r.s)} × ${m2(r.h)}</b></div><div><small>Diagonal</small><b>${m3(r.diagonal)}</b></div><div><small>Tolerância</small><b>${cm(cfg().tolerancia)} cm</b></div></div>
          <button class="botao principal" id="comecar" type="button">Começar medição <span aria-hidden="true">→</span></button>`
          : `<div><h1>Cotas da prancha de locação</h1><p class="sub">Digite os eixos e as cotas como estão na prancha. Depois escolha os 4 eixos da casa e a linha que já está conferida no lote.</p></div>`}
          <details class="config" ${aberta ? 'open' : ''} id="config">
            <summary>${r ? 'Editar obra e cotas' : 'Obra e cotas'}</summary>
            <div class="dentro-det">
              <label class="campo"><span>Obra salva</span><select id="obra-salva"><option value="">— nova obra —</option><option value="__exemplo">Exemplo: Arthur (prancha 03)</option>${Object.keys(obras).sort().map((n) => `<option ${n === p.nome ? 'selected' : ''} value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label>
              <label class="campo"><span>Nome da obra</span><input id="nome" autocomplete="off" value="${esc(p.nome)}" placeholder="Ex.: Arthur — Rua Projetada, 67"></label>
              <h2>Eixos verticais <span class="nota">(números, da esquerda para a direita)</span></h2>
              <label class="campo"><span>Nomes</span><input id="nomesV" autocomplete="off" value="${esc(p.nomesV)}" placeholder="1 2 3 4"></label>
              <label class="campo"><span>Cotas entre eixos (m)</span><input id="cotasV" autocomplete="off" inputmode="decimal" value="${esc(p.cotasV)}" placeholder="1,50 0,52 3,34"></label>
              <h2>Eixos horizontais <span class="nota">(letras, de cima para baixo)</span></h2>
              <label class="campo"><span>Nomes</span><input id="nomesH" autocomplete="off" value="${esc(p.nomesH)}" placeholder="A B C"></label>
              <label class="campo"><span>Cotas entre eixos (m)</span><input id="cotasH" autocomplete="off" inputmode="decimal" value="${esc(p.cotasH)}" placeholder="7,74 3,12"></label>
              <h2>Retângulo da casa</h2>
              <div class="duas">
                <label class="campo"><span>Do eixo</span><select id="v0"></select></label><label class="campo"><span>até o eixo</span><select id="v1"></select></label>
                <label class="campo"><span>Do eixo</span><select id="h0"></select></label><label class="campo"><span>até o eixo</span><select id="h1"></select></label>
              </div>
              <label class="campo ref-campo"><span>Linha fixa (referência)</span><select id="referencia"></select><small>A linha já conferida no lote, normalmente a da rua. O app nunca manda mexer nos dois cruzamentos dela.</small></label>
              <div class="duas">
                <label class="campo"><span>Tolerância por canto</span><div class="unidade"><input id="tolerancia" inputmode="decimal" value="${esc(p.tolerancia)}"><b>cm</b></div></label>
                <label class="campo"><span>Sarrafos a <em>(opcional)</em></span><div class="unidade"><input id="gabarito" inputmode="decimal" value="${esc(p.gabarito)}" placeholder="—"><b>m</b></div></label>
              </div>
              <p class="nota">Só preencha a distância dos sarrafos se eles estiverem paralelos à casa e todos a essa distância das linhas. Sem ela, o app mostra o canto a remarcar e as distâncias de trena, que sempre valem.</p>
              ${E.erroProj ? `<p class="erro" role="alert">${esc(E.erroProj)}</p>` : ''}
              ${r ? '' : '<button class="botao principal" id="comecar" type="button" disabled>Começar medição →</button>'}
            </div>
          </details>
          ${r ? `<details class="extra"><summary>Marcação dos outros eixos</summary><div class="dentro-det intermed" id="intermed"></div></details>` : ''}
        </div>
      </div>`;
    preencherSelects(p);
    desenhoObra($('#d-obra'));
    if ($('#intermed')) $('#intermed').innerHTML = tabelaIntermed();
    $('#config').addEventListener('toggle', (e) => { E.configAberta = e.target.open; });
    $('#comecar')?.addEventListener('click', comecar);
    ['nome', 'nomesV', 'cotasV', 'nomesH', 'cotasH', 'tolerancia', 'gabarito'].forEach((id) => $('#' + id).addEventListener('change', atualizarDoForm));
    ['v0', 'v1', 'h0', 'h1', 'referencia'].forEach((id) => $('#' + id).addEventListener('change', atualizarDoForm));
    $('#obra-salva').addEventListener('change', (e) => {
      const v = e.target.value;
      montar(v === '__exemplo' ? EXEMPLO : v ? ler(K_OBRAS, {})[v] : VAZIO);
      E.configAberta = !E.r || !v;
      telaObra();
    });
  }

  function preencherSelects(p) {
    const V = G.lerNomes(p.nomesV), H = G.lerNomes(p.nomesH);
    const op = (sel, lista, val) => { sel.innerHTML = lista.map((n) => `<option ${n === val ? 'selected' : ''}>${esc(n)}</option>`).join(''); };
    op($('#v0'), V, p.v0 || V[0]); op($('#v1'), V, p.v1 || V[V.length - 1]);
    op($('#h0'), H, p.h0 || H[0]); op($('#h1'), H, p.h1 || H[H.length - 1]);
    const quatro = [...new Set([$('#h1').value, $('#h0').value, $('#v0').value, $('#v1').value].filter(Boolean))];
    $('#referencia').innerHTML = quatro.map((n) => `<option value="${esc(n)}" ${n === p.referencia ? 'selected' : ''}>Eixo ${esc(n)}</option>`).join('');
  }

  function atualizarDoForm() {
    const p = {};
    ['nome', 'nomesV', 'cotasV', 'nomesH', 'cotasH', 'v0', 'v1', 'h0', 'h1', 'referencia', 'tolerancia', 'gabarito'].forEach((k) => { p[k] = $('#' + k).value; });
    E.configAberta = true;
    montar(p);
    telaObra();
  }

  function comecar() {
    if (!E.r) return;
    const p = E.proj;
    if (p.nome.trim()) { const o = ler(K_OBRAS, {}); o[p.nome.trim()] = p; guardar(K_OBRAS, o); }
    guardar(K_ULTIMA, p);
    E.configAberta = false; E.rodada = 1; E.anterior = null; E.res = null;
    iniciarMedicao();
  }

  function iniciarMedicao() {
    E.modo = 'medir'; E.fila = ORDEM; E.idx = 0; E.med = {}; E.leituras = {}; E.voltarParaRevisao = false; E.paradaLeitura = null;
    ir('medir');
  }

  function tabelaIntermed() {
    const r = E.r, t = r.intermediarios;
    const linhas = (lista, lim) => lista.map((e) => {
      const fora = e.dist < -1e-6 || e.dist > lim + 1e-6, base = Math.abs(e.dist) < 1e-6;
      return `<tr class="${base ? 'base' : fora ? 'fora' : ''}"><td>Eixo ${esc(e.nome)}</td><td class="num">${base ? 'base' : (e.dist < 0 ? '−' : '') + m2(Math.abs(e.dist)) + ' m'}</td><td>${fora ? 'fora da casa' : ''}</td></tr>`;
    }).join('');
    return `<h3>Nas linhas ${esc(r.linhaRef)} e ${esc(r.linhaOposta)}, a partir do eixo ${esc(t.aPartirDe)}</h3>
      <table class="tabela"><tbody>${linhas(t.aoLongoDaRef, r.s)}</tbody></table>
      <h3>Nas linhas ${esc(r.lado1)} e ${esc(r.lado2)}, a partir da linha ${esc(t.aPartirDaRef)}</h3>
      <table class="tabela"><tbody>${linhas(t.aoLongoDosLados, r.h)}</tbody></table>
      <p class="nota">Marque os intermediários só depois de o retângulo fechar.</p>`;
  }

  /* ---------- TELA: medir (uma trena por vez) ---------- */
  function telaMedir() {
    const T = trenas(), k = E.fila[E.idx], t = T[k];
    const total = E.fila.length;
    const titulo = E.modo === 'medir' ? `Medida ${E.idx + 1} de ${total}` : E.modo === 'reler' ? `Releitura ${E.idx + 1} de ${total}` : `Terceira leitura ${E.idx + 1} de ${total}`;
    const feitas = Object.keys(E.med);
    const valorAtual = E.modo === 'medir' && E.med[k] ? m3(E.med[k]) : '';
    const aviso = E.modo === 'reler'
      ? `<p class="aviso-releitura">Meça <b>de novo</b>, sem olhar a primeira anotação. Uma trena lida 1 a 2 cm errada não aparece na conta; é a releitura que pega.</p>`
      : E.modo === 'terceira'
        ? `<p class="aviso-releitura">As duas leituras não bateram: <b>${m3(E.leituras[k][0])}</b> e <b>${m3(E.leituras[k][1])}</b>. Estique bem a trena e meça uma terceira vez.</p>` : '';
    tela.innerHTML = `
      <div class="palco">
        <div class="quadro"><div class="desenho" id="d-trena" role="img" aria-label="Trena de ${t.de} até ${t.ate}"></div></div>
        <form class="comando" id="f-trena" novalidate>
          <div class="progresso"><span>${titulo}</span><span class="barra"><i style="width:${((E.idx) / total) * 100}%"></i></span></div>
          <div><div class="pontas"><span>${t.de}</span><span class="seta" aria-hidden="true">→</span><span>${t.ate}</span></div>
          <p class="tipo">${esc(t.tipo)} • projeto ${m3(t.esp)} m</p></div>
          ${aviso}
          <label class="leitura"><input id="valor" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="0,000" value="${valorAtual}" aria-label="Leitura da trena em metros"><b>m</b></label>
          <p class="desvio" id="desvio"></p>
          ${t.diagonal ? `<label class="marcar"><input type="checkbox" id="pontas-ok"><span>Conferi as duas pontas: a trena sai do <b>${t.de}</b> e chega no <b>${t.ate}</b>.</span></label>` : ''}
          <p class="erro" id="erro" role="alert" hidden></p>
          <button class="botao principal" type="submit">${E.idx + 1 < total ? 'Confirmar e próxima' : 'Confirmar'} <span aria-hidden="true">→</span></button>
          <p class="nota">Pode digitar em metros (13,23) ou em centímetros (1323).</p>
        </form>
      </div>`;
    desenhoTrena($('#d-trena'), k, feitas);
    const inp = $('#valor');
    const mostrar = () => {
      const l = G.lerMedida(inp.value, t.esp), el = $('#desvio');
      if (!Number.isFinite(l.valor)) { el.textContent = ''; return; }
      const dif = l.valor - t.esp, tol = cfg().tolerancia;
      el.className = 'desvio ' + (Math.abs(dif) <= tol ? 'bom' : 'alto');
      el.textContent = `${l.convertido ? 'Entendi ' + m3(l.valor) + ' m • ' : ''}${Math.abs(dif) < 0.0005 ? 'igual ao projeto' : cmSinal(dif) + ' do projeto'}`;
    };
    inp.addEventListener('input', mostrar); mostrar();
    setTimeout(() => inp.focus({ preventScroll: true }), 50);
    $('#f-trena').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const l = G.lerMedida(inp.value, t.esp), erro = $('#erro');
      if (!Number.isFinite(l.valor) || l.valor <= 0) { erro.textContent = 'Digite a leitura da trena.'; erro.hidden = false; return; }
      if (t.diagonal && !$('#pontas-ok').checked) { erro.textContent = 'Confirme as duas pontas da diagonal. Diagonal trocada não aparece na conta.'; erro.hidden = false; return; }
      registrarLeitura(k, l.valor);
    });
  }

  function registrarLeitura(k, v) {
    const pos = { medir: 0, reler: 1, terceira: 2 }[E.modo];
    // Editar a 1ª leitura invalida as releituras antigas dessa trena (IA-06, item 4)
    if (E.modo === 'medir') { E.leituras[k] = [v]; E.med[k] = v; }
    else { E.leituras[k] = E.leituras[k] || []; E.leituras[k][pos] = v; }
    if (E.modo === 'medir' && E.voltarParaRevisao) { E.voltarParaRevisao = false; ir('revisar'); return; }
    if (E.idx + 1 < E.fila.length) { E.idx += 1; render(); window.scrollTo({ top: 0 }); return; }
    if (E.modo === 'medir') ir('revisar');
    else if (E.modo === 'reler') avaliarReleitura();
    else avaliarTerceira();
  }

  /* ---------- TELA: revisar as seis ---------- */
  function telaRevisar() {
    const T = trenas();
    tela.innerHTML = `
      <div class="palco">
        <div class="quadro"><div class="desenho" id="d-rev"></div></div>
        <div class="comando">
          <div class="progresso"><span>6 de 6</span><span class="barra"><i style="width:100%"></i></span></div>
          <h1>Confira as seis antes de calcular</h1>
          <ul class="revisao">${ORDEM.map((k, i) => {
            const t = T[k], dv = E.med[k] - t.esp;
            return `<li><div><b>${t.de} → ${t.ate}</b><small>${esc(t.tipo)}</small></div><div class="v">${m3(E.med[k])}<small>${Math.abs(dv) < 0.0005 ? 'igual' : cmSinal(dv)}</small></div><button type="button" data-editar="${i}">Corrigir</button></li>`;
          }).join('')}</ul>
          <button class="botao principal" id="conferir" type="button">Conferir o esquadro <span aria-hidden="true">→</span></button>
        </div>
      </div>`;
    desenhoObraTrenas($('#d-rev'));
    $$('[data-editar]').forEach((b) => b.addEventListener('click', () => { E.modo = 'medir'; E.fila = ORDEM; E.idx = Number(b.dataset.editar); E.voltarParaRevisao = true; ir('medir'); }));
    $('#conferir').addEventListener('click', conferirPrimeira);
  }
  function desenhoObraTrenas(el) { desenhoTrena(el, 'oposto', ORDEM); }

  /* ---------- fluxo de conferência ---------- */
  // Releitura obrigatória (IA-03 item 4 + IA-05 item 4): antes de mandar mexer, as 2 trenas de cada canto
  // que vai mexer; antes de aprovar, as 4 (lado1, diag2, lado2, diag1). Depois de CADA recálculo o app
  // confere de novo o que ainda falta reler — uma releitura pode mudar o resultado.
  function trenasExigidas(res) {
    if (res.situacao === 'dentro') return ['lado1', 'diag2', 'lado2', 'diag1'];
    if (res.situacao !== 'corrigir') return [];
    const k = [];
    if (res.c1.total > res.tolerancia) k.push(...G.TRENAS_DE.M1);
    if (res.c2.total > res.tolerancia) k.push(...G.TRENAS_DE.M2);
    return k;
  }
  // Confirmada = duas leituras que concordam E o valor em uso é exatamente o confirmado
  const confirmada = (k) => {
    if (!E.leituras[k]) return false;
    const c = G.compararLeituras(E.leituras[k].filter(Boolean));
    return c.ok && Math.abs(c.valor - E.med[k]) < 1e-9;
  };

  function seguir() {
    const res = G.conferir(E.r, E.med, cfg());
    const faltam = trenasExigidas(res).filter((k) => !confirmada(k));
    if (faltam.length) { E.modo = 'reler'; E.fila = faltam; E.idx = 0; ir('medir'); return; }
    finalizarCom(res);
  }

  function conferirPrimeira() { seguir(); }

  function avaliarReleitura() {
    const divergentes = [];
    E.fila.forEach((k) => {
      const c = G.compararLeituras([E.leituras[k][0], E.leituras[k][1]]);
      if (c.ok) E.med[k] = c.valor; else divergentes.push(k);
    });
    if (divergentes.length) { E.modo = 'terceira'; E.fila = divergentes; E.idx = 0; ir('medir'); return; }
    seguir();
  }

  function avaliarTerceira() {
    const falhou = [];
    E.fila.forEach((k) => {
      const c = G.compararLeituras(E.leituras[k]);
      if (c.ok) E.med[k] = c.valor; else falhou.push(k);
    });
    if (falhou.length) { E.paradaLeitura = falhou; finalizarCom({ situacao: 'leituras', tolerancia: cfg().tolerancia, desvios: {} }); return; }
    seguir();
  }

  function finalizarCom(res) {
    E.res = res;
    E.piorou = res.situacao === 'corrigir' || res.situacao === 'dentro' ? G.piorou(E.anterior, res, cfg().tolerancia) : false;
    E.canto = res.c1 && res.c1.total > res.tolerancia ? 'M1' : 'M2';
    registrar(res);
    ir('resultado');
  }

  /* ---------- TELA: resultado ---------- */
  function sentidos(c) {
    const r = E.r, out = [];
    if (Math.abs(c.dx) >= 0.002) out.push(`<span>${cm(c.dx)} cm no sentido do eixo ${esc(c.dx > 0 ? r.lado2 : r.lado1)}</span>`);
    if (Math.abs(c.dy) >= 0.002) out.push(`<span>${cm(c.dy)} cm ${c.dy > 0 ? 'afastando da' : 'em direção à'} linha ${esc(r.linhaRef)}</span>`);
    return out.join('');
  }

  function blocoPregos(res) {
    const r = E.r, L = res.linhas;
    if (!L) return `<p class="nota" style="padding:0 16px 14px">${res.motivoSemPregos ? esc(res.motivoSemPregos) : 'Para ver quanto mexer em cada prego, informe na obra a distância dos sarrafos. As distâncias de remarcação acima sempre valem.'}</p>`;
    const ao = (v) => `no sentido do eixo ${v > 0 ? r.lado2 : r.lado1}`, pp = (v) => (v > 0 ? 'afastando da' : 'em direção à') + ` linha ${r.linhaRef}`;
    const item = (linha, onde, v, sent) => `<div class="prego"><div><b>Linha ${esc(linha)}</b><br><span>prego ${esc(onde)}${Math.abs(v) >= 0.002 ? ' • ' + sent(v) : ''}</span></div><em>${Math.abs(v) < 0.002 ? 'fica' : cm(v) + ' cm'}</em></div>`;
    let s = `<div class="prego"><div><b>Linha ${esc(r.linhaRef)}</b><br><span>linha fixa</span></div><em>não mexe</em></div>`;
    if (L.lado1.mexe) s += item(r.lado1, `no sarrafo da linha ${r.linhaRef}`, L.lado1.pregoPerto, ao) + item(r.lado1, `no sarrafo depois da linha ${r.linhaOposta}`, L.lado1.pregoLonge, ao);
    if (L.lado2.mexe) s += item(r.lado2, `no sarrafo da linha ${r.linhaRef}`, L.lado2.pregoPerto, ao) + item(r.lado2, `no sarrafo depois da linha ${r.linhaOposta}`, L.lado2.pregoLonge, ao);
    if (L.oposto.mexe) s += item(r.linhaOposta, `no sarrafo depois do eixo ${r.lado1}`, L.oposto.pregoLado1, pp) + item(r.linhaOposta, `no sarrafo depois do eixo ${r.lado2}`, L.oposto.pregoLado2, pp);
    return `<div class="pregos">${s}<p class="nota">Calculado com sarrafos a ${m2(res.gabarito)} m das linhas.</p></div>`;
  }

  function telaResultado() {
    const res = E.res, r = E.r, T = trenas();
    const parar = (titulo, texto, extra = '') => `
      <div class="palco"><div class="quadro"><div class="desenho" id="d-res"></div></div>
      <div class="comando"><span class="selo-res parar">Pare • não mexa em nada</span><h1 class="parar-titulo">${titulo}</h1><p>${texto}</p>${extra}
      <button class="botao principal" data-acao="remedir" type="button">Medir as seis de novo <span aria-hidden="true">↻</span></button>
      <button class="botao" data-acao="obra" type="button">Conferir as cotas da obra</button></div></div>`;
    let html;
    const pior = E.piorou;
    if (res.situacao === 'leituras') {
      html = parar('As leituras não concordam', `Mesmo na terceira vez, ${E.paradaLeitura.map((k) => `<b>${T[k].de} → ${T[k].ate}</b>`).join(' e ')} deu valores diferentes demais entre si (mais de ${num(G.LIMITE_RELEITURA * 1000, 0)} mm). Confira se a trena está esticada, no mesmo ponto do cruzamento e sem encostar em nada.`);
    } else if (res.situacao === 'referencia') {
      html = parar('A linha fixa não bate com o projeto', `${r.R1} → ${r.R2} mediu ${m3(E.med.ref)} m e o projeto pede ${m3(r.s)} m (${cmSinal(res.diferencaRef)}). Esses dois pontos são a referência no lote, então o app não calcula correção em cima deles. Confira os pontos fixos com a prancha e com o lote.`);
    } else if (res.situacao === 'nao-fecha') {
      const susp = ['lado1', 'lado2', 'diag1', 'diag2', 'oposto'].sort((a, b) => Math.abs(res.desvios[b]) - Math.abs(res.desvios[a])).slice(0, 2);
      html = parar('As seis trenas não combinam entre si', `${esc(res.motivo || '')} Com medidas que não fecham, qualquer correção seria chute.`,
        `<div class="aviso-releitura"><b>Vale conferir primeiro</b> (as que mais se afastaram do projeto; não dá para afirmar qual está errada):<br>${susp.map((k) => `${T[k].de} → ${T[k].ate}: ${m3(E.med[k])} m (${cmSinal(res.desvios[k])})`).join('<br>')}</div>`);
    } else if (pior) {
      const quais = [pior.M1 && r.M1, pior.M2 && r.M2].filter(Boolean).join(' e ');
      html = parar(`O ${quais} piorou depois do ajuste`, `Antes: ${r.M1} a ${cm(E.anterior.c1.total)} cm e ${r.M2} a ${cm(E.anterior.c2.total)} cm. Agora: ${cm(res.c1.total)} cm e ${cm(res.c2.total)} cm. Pode ter mexido no sentido contrário, passado do ponto ou trocado as diagonais. Confira o sentido no desenho antes de medir de novo.`);
    } else if (res.situacao === 'dentro') {
      html = `<div class="palco"><div class="quadro"><div class="desenho" id="d-ok"></div></div>
        <div class="comando"><span class="selo-res ok">Rodada ${E.rodada} • releitura conferida</span>
        <div class="grande-ok">Esquadro dentro da tolerância</div>
        <p>Os dois cantos estão a no máximo <b>${cm(Math.max(res.c1.total, res.c2.total))} cm</b> do lugar (tolerância ${cm(res.tolerancia)} cm), as seis trenas fecham entre si e a releitura bateu.</p>
        <p class="nota">Isto confere a forma da casa. Posição e recuos no lote se conferem à parte.</p>
        <details class="extra" open><summary>Agora marque os outros eixos</summary><div class="dentro-det intermed">${tabelaIntermed()}</div></details>
        <button class="botao" data-acao="copiar" type="button">Copiar resumo para o WhatsApp</button>
        <button class="botao discreto" data-acao="remedir" type="button">Medir de novo</button></div></div>`;
    } else {
      const canto = E.canto, c = canto === 'M1' ? res.c1 : res.c2;
      const de = canto === 'M1' ? [res.remarcar.M1.deR1, r.R1, res.remarcar.M1.deR2, r.R2] : [res.remarcar.M2.deR2, r.R2, res.remarcar.M2.deR1, r.R1];
      const dois = res.c1.total > res.tolerancia && res.c2.total > res.tolerancia;
      const estado = (k, cc) => `<button type="button" data-canto="${k}" aria-pressed="${k === canto}" class="${cc.total <= res.tolerancia ? 'ok' : ''}">${esc(r[k])}${cc.total <= res.tolerancia ? ' ✓' : ''}</button>`;
      html = `<div class="palco"><div class="quadro"><div class="desenho" id="d-res"></div><p class="legenda">Tracejado laranja: onde as linhas estão (exagerado para dar para ver). Verde: onde devem ficar.</p></div>
        <div class="comando">
          <span class="selo-res mexer">Rodada ${E.rodada} • ${r.R1} e ${r.R2} ficam fixos</span>
          ${dois ? `<div class="cantos">${estado('M1', res.c1)}${estado('M2', res.c2)}</div>` : ''}
          ${c.total <= res.tolerancia
            ? `<div class="ordem">${esc(r[canto])} está no lugar</div><p>Não mexa nele.</p>`
            : `<div class="ordem">Remarque o ${esc(r[canto])}</div>
               <div class="quanto">${cm(c.total)}<small> cm</small></div>
               <div class="sentido">${sentidos(c)}</div>
               <p class="nota" style="margin:0">Remarcar com duas trenas a partir dos pontos fixos:</p>
               <div class="duas-trenas"><div><small>do <em>${de[1]}</em></small><b>${m3(de[0])} m</b></div><div><small>do <em>${de[3]}</em></small><b>${m3(de[2])} m</b></div></div>`}
          ${res.grande ? '<p class="aviso-releitura">Correção grande: remarque, meça as seis de novo e o app vai refinando.</p>' : ''}
          <details class="extra"><summary>Pregos nos sarrafos (opcional)</summary>${blocoPregos(res)}</details>
          ${dois && canto === 'M1' ? `<button class="botao laranja" data-canto="M2" type="button">Próximo canto: ${esc(r.M2)} <span aria-hidden="true">→</span></button>` : `<button class="botao principal" data-acao="remedir" type="button">Já remarquei — medir de novo <span aria-hidden="true">↻</span></button>`}
          <button class="botao discreto" data-acao="copiar" type="button">Copiar para o WhatsApp</button>
        </div></div>`;
    }
    tela.innerHTML = html;
    if ($('#d-res')) { if (res.c1 && !pior && res.situacao === 'corrigir') desenhoCorrecao($('#d-res'), res, E.canto); else desenhoObraTrenas($('#d-res')); }
    if ($('#d-ok')) desenhoObra($('#d-ok'));
    $$('[data-canto]').forEach((b) => b.addEventListener('click', () => { E.canto = b.dataset.canto; telaResultado(); window.scrollTo({ top: 0 }); }));
    $$('[data-acao]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.acao;
      if (a === 'remedir') {
        if (res.situacao === 'corrigir' && !pior) { E.anterior = res; E.rodada += 1; }
        iniciarMedicao();
      } else if (a === 'obra') { E.configAberta = true; ir('obra'); }
      else if (a === 'copiar') copiar(textoResumo(res), b);
    }));
  }

  /* ---------- registro ---------- */
  function textoResumo(res) {
    const r = E.r, T = trenas();
    const l = [`EDR Esquadro — ${E.proj.nome || 'obra'} — rodada ${E.rodada}`, `Fixos: ${r.R1} e ${r.R2} (linha ${r.linhaRef})`];
    ORDEM.forEach((k) => { if (E.med[k]) l.push(`${T[k].de}→${T[k].ate}: ${m3(E.med[k])} m (projeto ${m3(T[k].esp)})`); });
    if (E.piorou) {
      const quais = [E.piorou.M1 && r.M1, E.piorou.M2 && r.M2].filter(Boolean).join(' e ');
      l.push(`⛔ PARAR: o ${quais} piorou depois do ajuste. Não remarque nada; confira o sentido e meça as seis de novo.`);
      return l.join('\n');
    }
    if (res.situacao === 'dentro') l.push(`✅ Esquadro dentro da tolerância (${cm(res.tolerancia)} cm), releitura conferida`);
    else if (res.situacao === 'corrigir') {
      [['M1', res.c1, res.remarcar.M1.deR1, r.R1, res.remarcar.M1.deR2, r.R2], ['M2', res.c2, res.remarcar.M2.deR2, r.R2, res.remarcar.M2.deR1, r.R1]].forEach(([k, c, a, da, b, db]) => {
        l.push(c.total > res.tolerancia ? `➡️ ${r[k]}: remarcar ${cm(c.total)} cm — ${m3(a)} m do ${da} e ${m3(b)} m do ${db}` : `✔️ ${r[k]}: não mexer`);
      });
    } else if (res.situacao === 'referencia') l.push('⛔ PARAR: a linha fixa não bate com o projeto. Conferir os pontos fixos.');
    else if (res.situacao === 'leituras') l.push('⛔ PARAR: a releitura não bateu nem na terceira vez.');
    else l.push('⛔ PARAR: as seis trenas não combinam entre si. Medir de novo.');
    return l.join('\n');
  }
  const NOME_SIT = { dentro: 'Dentro da tolerância', corrigir: 'Correção indicada', referencia: 'Parou: linha fixa', 'nao-fecha': 'Parou: trenas não fecham', leituras: 'Parou: releitura não bateu', piorou: 'Parou: piorou' };
  function registrar(res) {
    const reg = ler(K_REG, []);
    reg.unshift({ quando: new Date().toISOString(), obra: E.proj.nome || 'obra sem nome', rodada: E.rodada, situacao: E.piorou ? 'piorou' : res.situacao, texto: textoResumo(res) });
    guardar(K_REG, reg.slice(0, 120));
  }
  $('#ver-registro').addEventListener('click', () => {
    const reg = ler(K_REG, []);
    $('#registro-lista').innerHTML = reg.length ? reg.map((x) => `<div class="reg"><b>${esc(x.obra)}</b> • rodada ${x.rodada} • ${NOME_SIT[x.situacao] || x.situacao}<br><small>${new Date(x.quando).toLocaleString('pt-BR')}</small></div>`).join('') : '<p class="nota">Nenhuma conferência registrada neste aparelho.</p>';
    $('#registro').showModal();
  });
  $('#registro').addEventListener('click', (ev) => { if (ev.target.matches('[data-fechar]') || ev.target === $('#registro')) $('#registro').close(); });
  $('#copiar-registro').addEventListener('click', (ev) => copiar(ler(K_REG, []).slice(0, 10).map((x) => x.texto).join('\n\n'), ev.currentTarget));
  $('#limpar-registro').addEventListener('click', () => { guardar(K_REG, []); $('#registro-lista').innerHTML = '<p class="nota">Registro limpo.</p>'; });
  function copiar(texto, botao) {
    const ok = () => { const t = botao.textContent; botao.textContent = 'Copiado ✓'; setTimeout(() => { botao.textContent = t; }, 1600); };
    const reserva = () => { const ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (_) { /* nada */ } ta.remove(); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(texto).then(ok, reserva); else reserva();
  }

  /* ---------- início ---------- */
  const redesenhar = () => {
    if (E.tela === 'obra') desenhoObra($('#d-obra'));
    else if (E.tela === 'medir') desenhoTrena($('#d-trena'), E.fila[E.idx], Object.keys(E.med));
    else if (E.tela === 'revisar') desenhoObraTrenas($('#d-rev'));
    else if (E.tela === 'resultado') { if ($('#d-ok')) desenhoObra($('#d-ok')); if ($('#d-res')) { if (E.res.c1 && !E.piorou && E.res.situacao === 'corrigir') desenhoCorrecao($('#d-res'), E.res, E.canto); else desenhoObraTrenas($('#d-res')); } }
  };
  let espera; window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(redesenhar, 120); });

  const ultima = ler(K_ULTIMA, null);
  montar(ultima || EXEMPLO);
  ir('obra');

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=1.1.0').catch(() => {}));
  }
}
