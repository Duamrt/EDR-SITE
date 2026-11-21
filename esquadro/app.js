/* EDR Esquadro v1.0 — tela. O cálculo fica todo em geometria.js (testado em testes/). */
{
  'use strict';
  const G = window.EDRGeometria;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';

  const EXEMPLO = {
    nome: 'Arthur — Rua Projetada, 67 (prancha 03)',
    nomesV: '1 2 3 4 5 6 7 8 9 10', cotasV: '1,50 0,52 3,34 1,55 1,27 0,96 2,06 1,42 6,05',
    nomesH: 'A B C D E F', cotasH: '7,74 3,12 1,22 1,40 1,42',
    v0: '2', v1: '9', h0: 'B', h1: 'F', referencia: 'F', tolerancia: '1', gabarito: '',
  };
  const CHAVE_OBRAS = 'edr-esquadro-obras-v1';
  const CHAVE_ULTIMA = 'edr-esquadro-ultima-v1';
  const CHAVE_REG = 'edr-esquadro-registro-v1';

  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sem armazenamento */ } };
  const ler = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch (_) { return padrao; } };

  const estado = { proj: null, r: null, erroProj: '', rodada: 1, med: {}, resultado: null, anterior: null, fase: 'mexer', trenaAtiva: null };

  /* ---------- formatação ---------- */
  const num = (v, c) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const m2 = (v) => num(v, 2);
  const m3 = (v) => num(v, 3);
  const cm = (v) => num(Math.abs(v) * 100, 1) + ' cm';
  const cmSinal = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v) * 100, 1) + ' cm';
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- navegação ---------- */
  function mostrar(tela) {
    $$('[data-tela]').forEach((s) => { s.hidden = s.dataset.tela !== tela; });
    $$('.etapa').forEach((b) => b.toggleAttribute('aria-current', false));
    const atual = $(`.etapa[data-ir="${tela}"]`);
    if (atual) atual.setAttribute('aria-current', 'step');
    $('.etapa[data-ir="medir"]').disabled = !estado.r;
    $('.etapa[data-ir="resultado"]').disabled = !estado.resultado;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (tela === 'medir') desenharMedir();
    if (tela === 'obra') desenharPlanta();
  }
  $$('.etapa').forEach((b) => b.addEventListener('click', () => { if (!b.disabled) mostrar(b.dataset.ir); }));

  /* ---------- ETAPA 1: obra ---------- */
  const camposProj = ['nome', 'nomesV', 'cotasV', 'nomesH', 'cotasH', 'v0', 'v1', 'h0', 'h1', 'referencia', 'tolerancia', 'gabarito'];

  function lerForm() {
    const p = {};
    camposProj.forEach((k) => { p[k] = $('#' + k).value; });
    return p;
  }
  function preencherForm(p) {
    ['nome', 'nomesV', 'cotasV', 'nomesH', 'cotasH', 'tolerancia', 'gabarito'].forEach((k) => { $('#' + k).value = p[k] ?? ''; });
    atualizarSelects(p);
  }
  function opcoes(sel, lista, valor) {
    sel.innerHTML = lista.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (lista.includes(valor)) sel.value = valor;
  }
  function atualizarSelects(p = lerForm()) {
    const V = G.lerNomes($('#nomesV').value), H = G.lerNomes($('#nomesH').value);
    opcoes($('#v0'), V, p.v0 || V[0]);
    opcoes($('#v1'), V, p.v1 || V[V.length - 1]);
    opcoes($('#h0'), H, p.h0 || H[0]);
    opcoes($('#h1'), H, p.h1 || H[H.length - 1]);
    const quatro = [$('#h1').value, $('#h0').value, $('#v0').value, $('#v1').value].filter(Boolean);
    const rot = { [$('#h1').value]: 'horizontal', [$('#h0').value]: 'horizontal', [$('#v0').value]: 'vertical', [$('#v1').value]: 'vertical' };
    $('#referencia').innerHTML = [...new Set(quatro)].map((n) => `<option value="${esc(n)}">Eixo ${esc(n)} (${rot[n]})</option>`).join('');
    if (quatro.includes(p.referencia)) $('#referencia').value = p.referencia;
  }

  function recalcularProjeto() {
    const p = lerForm();
    estado.proj = p;
    try {
      estado.r = G.montarRetangulo(p);
      estado.erroProj = '';
    } catch (e) {
      estado.r = null;
      estado.erroProj = e.message;
    }
    $('#erro-obra').hidden = !estado.erroProj;
    $('#erro-obra').textContent = estado.erroProj;
    $('#obra-atual').textContent = p.nome || 'Locação por eixos';
    desenharPlanta();
    desenharIntermediarios($('#tabela-intermed'));
    const r = estado.r;
    $('#resumo-obra').innerHTML = r
      ? `Casa <b>${m2(r.s)} × ${m2(r.h)} m</b> entre os eixos ${esc(r.lado1)}–${esc(r.lado2)} e ${esc(r.linhaRef)}–${esc(r.linhaOposta)} • diagonal <b>${m3(r.diagonal)} m</b>. Fixos: <b>${r.R1}</b> e <b>${r.R2}</b>.`
      : 'Complete as cotas para ver a casa.';
    $('.etapa[data-ir="medir"]').disabled = !r;
  }

  ['nomesV', 'nomesH'].forEach((id) => $('#' + id).addEventListener('input', () => { atualizarSelects(); recalcularProjeto(); }));
  ['nome', 'cotasV', 'cotasH', 'tolerancia', 'gabarito'].forEach((id) => $('#' + id).addEventListener('input', recalcularProjeto));
  ['v0', 'v1', 'h0', 'h1'].forEach((id) => $('#' + id).addEventListener('change', () => { atualizarSelects(); recalcularProjeto(); }));
  $('#referencia').addEventListener('change', recalcularProjeto);

  function listarObras(selecionar) {
    const obras = ler(CHAVE_OBRAS, {});
    const nomes = Object.keys(obras).sort();
    $('#obra-salva').innerHTML = `<option value="">— Nova obra —</option><option value="__exemplo">Exemplo: Arthur (prancha 03)</option>` +
      nomes.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    $('#obra-salva').value = selecionar || '';
  }
  $('#obra-salva').addEventListener('change', (e) => {
    const v = e.target.value;
    if (v === '__exemplo') preencherForm(EXEMPLO);
    else if (v) preencherForm(ler(CHAVE_OBRAS, {})[v]);
    else preencherForm({ nome: '', nomesV: '', cotasV: '', nomesH: '', cotasH: '', tolerancia: '1', gabarito: '' });
    recalcularProjeto();
  });

  function config() {
    const tol = Number(String(estado.proj.tolerancia).replace(',', '.'));
    const gab = Number(String(estado.proj.gabarito).replace(',', '.'));
    return { tolerancia: Number.isFinite(tol) && tol > 0 ? tol / 100 : 0.01, gabarito: Number.isFinite(gab) && gab > 0 ? gab : undefined };
  }

  $('#ir-medir').addEventListener('click', () => {
    recalcularProjeto();
    if (!estado.r) { $('#erro-obra').scrollIntoView({ block: 'center' }); return; }
    const p = estado.proj;
    if (p.nome.trim()) {
      const obras = ler(CHAVE_OBRAS, {});
      obras[p.nome.trim()] = p;
      guardar(CHAVE_OBRAS, obras);
      listarObras(p.nome.trim());
    }
    guardar(CHAVE_ULTIMA, p);
    estado.rodada = 1; estado.anterior = null; estado.resultado = null; estado.med = {};
    montarTrenas();
    mostrar('medir');
  });

  /* ---------- desenho (coordenadas da prancha) ---------- */
  function posEixos(r) {
    const xs = Object.fromEntries(r.V.map((e) => [e.nome, e.pos]));
    const ys = Object.fromEntries(r.H.map((e) => [e.nome, e.pos]));
    return { xs, ys, ponto: (nome) => { const [v, h] = nome.split('-'); return { x: xs[v], y: ys[h] }; } };
  }

  function caixa(el) {
    return { W: el.clientWidth || 400, H: el.clientHeight || 320 };
  }

  function escala(pts, W, H, margem) {
    const minX = Math.min(...pts.map((p) => p.x)), maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y)), maxY = Math.max(...pts.map((p) => p.y));
    const k = Math.min((W - margem.e - margem.d) / Math.max(maxX - minX, 0.01), (H - margem.t - margem.b) / Math.max(maxY - minY, 0.01));
    const ox = margem.e + ((W - margem.e - margem.d) - (maxX - minX) * k) / 2 - minX * k;
    const oy = margem.t + ((H - margem.t - margem.b) - (maxY - minY) * k) / 2 - minY * k;
    return (p) => ({ x: ox + p.x * k, y: oy + p.y * k });
  }

  function desenharPlanta() {
    const el = $('#planta');
    const r = estado.r;
    if (!r) { el.innerHTML = ''; return; }
    const { W, H } = caixa(el);
    const { xs, ys, ponto } = posEixos(r);
    const P = escala([...r.V.map((e) => ({ x: e.pos, y: ys[r.ha.nome] })), ...r.H.map((e) => ({ x: xs[r.va.nome], y: e.pos }))], W, H, { e: 34, d: 18, t: 30, b: 34 });
    const yTopo = 18, xEsq = 16;
    let s = '';
    r.V.forEach((e) => { const a = P({ x: e.pos, y: 0 }); s += `<line class="d-eixo" x1="${a.x}" y1="${yTopo + 8}" x2="${a.x}" y2="${H - 8}"/>`; });
    r.H.forEach((e) => { const a = P({ x: 0, y: e.pos }); s += `<line class="d-eixo" x1="${xEsq + 12}" y1="${a.y}" x2="${W - 6}" y2="${a.y}"/>`; });
    const alvo = [ponto(r.R1), ponto(r.R2), ponto(r.M2), ponto(r.M1)].map(P);
    s += `<polygon class="d-casa" points="${alvo.map((p) => p.x + ',' + p.y).join(' ')}"/>`;
    s += `<line class="d-ref" x1="${alvo[0].x}" y1="${alvo[0].y}" x2="${alvo[1].x}" y2="${alvo[1].y}"/>`;
    // rótulos de eixos sem colisão: pula os que ficam a menos de 16 px
    let ultimoX = -99;
    r.V.forEach((e) => { const a = P({ x: e.pos, y: 0 }); if (a.x - ultimoX >= 16) { s += `<text class="d-eixo-rot" x="${a.x}" y="${yTopo}" text-anchor="middle">${esc(e.nome)}</text>`; ultimoX = a.x; } });
    let ultimoY = -99;
    r.H.forEach((e) => { const a = P({ x: 0, y: e.pos }); if (a.y - ultimoY >= 16) { s += `<text class="d-eixo-rot" x="${xEsq}" y="${a.y + 4}" text-anchor="middle">${esc(e.nome)}</text>`; ultimoY = a.y; } });
    s += rotulosPontos(r, P, ponto);
    el.innerHTML = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }

  function rotulosPontos(r, P, ponto, extra = {}) {
    const centro = P({ x: (estado.r.va.pos + estado.r.vb.pos) / 2, y: (estado.r.ha.pos + estado.r.hb.pos) / 2 });
    let s = '';
    [['R1', true], ['R2', true], ['M1', false], ['M2', false]].forEach(([k, fixo]) => {
      const nome = r[k];
      const p = extra[k] || P(ponto(nome));
      const dx = p.x < centro.x ? -1 : 1, dy = p.y < centro.y ? -1 : 1;
      s += `<circle class="d-ponto${fixo ? ' fixo' : ''}" cx="${p.x}" cy="${p.y}" r="${fixo ? 7 : 6}"/>`;
      s += `<text class="d-rot${fixo ? ' fixo' : ''}" x="${p.x + dx * 10}" y="${p.y + dy * 16 + (dy < 0 ? 4 : 0)}" text-anchor="${dx < 0 ? 'end' : 'start'}">${esc(nome)}${fixo ? ' • fixo' : ''}</text>`;
    });
    return s;
  }

  /* ---------- tabela dos eixos intermediários ---------- */
  function desenharIntermediarios(alvo) {
    const r = estado.r;
    if (!r) { alvo.innerHTML = '<p class="nota">Complete as cotas para ver as distâncias.</p>'; return; }
    const t = r.intermediarios;
    const lim1 = [0, r.s], lim2 = [0, r.h];
    const linhas = (lista, lim) => lista.map((e) => {
      const fora = e.dist < lim[0] - 1e-6 || e.dist > lim[1] + 1e-6;
      const base = Math.abs(e.dist) < 1e-6;
      return `<tr class="${base ? 'base' : fora ? 'fora' : ''}"><td>Eixo ${esc(e.nome)}</td><td class="num">${base ? 'base' : (e.dist < 0 ? '−' : '') + m2(Math.abs(e.dist)) + ' m'}</td><td>${fora ? 'fora da casa' : ''}</td></tr>`;
    }).join('');
    alvo.innerHTML = `
      <h4>Nas linhas ${esc(r.linhaRef)} e ${esc(r.linhaOposta)}, medindo a partir do eixo ${esc(t.aPartirDe)} (sentido do ${esc(r.lado2)})</h4>
      <div class="scroll"><table class="tabela"><thead><tr><th>Eixo</th><th style="text-align:right">Acumulado</th><th></th></tr></thead><tbody>${linhas(t.aoLongoDaRef, lim1)}</tbody></table></div>
      <h4>Nas linhas ${esc(r.lado1)} e ${esc(r.lado2)}, medindo a partir da linha ${esc(t.aPartirDaRef)}</h4>
      <div class="scroll"><table class="tabela"><thead><tr><th>Eixo</th><th style="text-align:right">Acumulado</th><th></th></tr></thead><tbody>${linhas(t.aoLongoDosLados, lim2)}</tbody></table></div>
      <p class="nota">Marque os intermediários só depois de o retângulo fechar. Valores negativos ficam do outro lado do eixo base.</p>`;
  }

  /* ---------- ETAPA 2: medir ---------- */
  function trenas() {
    const r = estado.r;
    const e = G.esperado(r);
    return [
      { k: 'ref', de: r.R1, ate: r.R2, nome: `Linha fixa ${r.linhaRef}`, esp: e.ref },
      { k: 'lado1', de: r.R1, ate: r.M1, nome: `Lado no eixo ${r.lado1}`, esp: e.lado1 },
      { k: 'lado2', de: r.R2, ate: r.M2, nome: `Lado no eixo ${r.lado2}`, esp: e.lado2 },
      { k: 'diag1', de: r.R1, ate: r.M2, nome: 'Diagonal', esp: e.diag1 },
      { k: 'diag2', de: r.R2, ate: r.M1, nome: 'Diagonal', esp: e.diag2 },
      { k: 'oposto', de: r.M1, ate: r.M2, nome: `Lado oposto ${r.linhaOposta} (conferência)`, esp: e.oposto },
    ];
  }

  function montarTrenas() {
    $('#rodada-medir').textContent = estado.rodada === 1 ? 'Rodada 1' : `Rodada ${estado.rodada} • depois do ajuste`;
    $('#lista-trenas').innerHTML = trenas().map((t, i) => `
      <li class="trena" data-k="${t.k}">
        <span class="n">${i + 1}</span>
        <label for="t-${t.k}"><b>${t.de} → ${t.ate}</b><small>${esc(t.nome)} • projeto ${m3(t.esp)} m</small><small class="desvio" id="dv-${t.k}"></small></label>
        <div class="entrada com-unidade"><input id="t-${t.k}" inputmode="decimal" autocomplete="off" enterkeyhint="next" placeholder="${m2(t.esp)}" value="${estado.med[t.k] ? m3(estado.med[t.k]) : ''}"><b>m</b></div>
      </li>`).join('');
    $$('.trena input').forEach((inp, i, todos) => {
      const k = inp.id.slice(2);
      inp.addEventListener('focus', () => { estado.trenaAtiva = k; marcarAtiva(); });
      inp.addEventListener('input', () => mostrarDesvio(k));
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && i < todos.length - 1) { ev.preventDefault(); todos[i + 1].focus(); } });
      mostrarDesvio(k);
    });
    estado.trenaAtiva = 'ref';
    marcarAtiva();
  }

  function mostrarDesvio(k) {
    const t = trenas().find((x) => x.k === k);
    const lido = G.lerMedida($('#t-' + k).value, t.esp);
    const el = $('#dv-' + k);
    if (!Number.isFinite(lido.valor)) { el.textContent = ''; return; }
    const dif = lido.valor - t.esp;
    const tol = config().tolerancia;
    el.className = 'desvio ' + (Math.abs(dif) <= tol ? 'bom' : 'alto');
    el.textContent = `${lido.convertido ? 'entendi ' + m3(lido.valor) + ' m • ' : ''}${Math.abs(dif) < 0.0005 ? 'igual ao projeto' : cmSinal(dif) + ' do projeto'}`;
  }

  function marcarAtiva() {
    $$('.trena').forEach((li) => li.classList.toggle('ativa', li.dataset.k === estado.trenaAtiva));
    desenharMedir();
  }

  function desenharMedir() {
    const el = $('#desenho-medir');
    const r = estado.r;
    if (!r || $('[data-tela=medir]').hidden) return;
    const { W, H } = caixa(el);
    const { ponto } = posEixos(r);
    const pts = [r.R1, r.R2, r.M1, r.M2].map(ponto);
    const P = escala(pts, W, H, { e: 92, d: 92, t: 40, b: 40 });
    let s = '';
    trenas().forEach((t) => {
      const a = P(ponto(t.de)), b = P(ponto(t.ate));
      const feita = Number.isFinite(G.lerMedida($('#t-' + t.k)?.value, t.esp).valor);
      s += `<line class="d-trena${t.k === estado.trenaAtiva ? ' atual' : feita ? ' feita' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    });
    const a = P(ponto(r.R1)), b = P(ponto(r.R2));
    s = `<line class="d-ref" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" opacity=".35"/>` + s;
    const t = trenas().find((x) => x.k === estado.trenaAtiva);
    if (t) {
      const p1 = P(ponto(t.de)), p2 = P(ponto(t.ate));
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      s += `<text class="d-mexer-rot" x="${mx}" y="${my - 10}" text-anchor="middle">${m3(t.esp)} m</text>`;
    }
    s += rotulosPontos(r, P, ponto);
    el.innerHTML = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }

  $('#form-medidas').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const med = {};
    const faltando = [];
    trenas().forEach((t) => {
      const v = G.lerMedida($('#t-' + t.k).value, t.esp).valor;
      if (Number.isFinite(v) && v > 0) med[t.k] = v; else faltando.push(`${t.de} → ${t.ate}`);
    });
    const erro = $('#erro-medir');
    if (faltando.length) {
      erro.textContent = `Falta medir: ${faltando.join(', ')}. Com cinco trenas dá para estimar, mas só com as seis dá para conferir — o app não manda mexer sem a sexta.`;
      erro.hidden = false;
      return;
    }
    erro.hidden = true;
    estado.med = med;
    calcular();
  });

  /* ---------- ETAPA 3: resultado ---------- */
  function calcular() {
    const res = G.conferir(estado.r, estado.med, config());
    estado.piorou = estado.anterior && G.piorou(estado.anterior, res, config().tolerancia);
    estado.resultado = res;
    estado.fase = res.situacao === 'corrigir' ? 'reler' : 'mexer';
    registrar(res);
    desenharResultado();
    mostrar('resultado');
  }

  function sentidoAoLongo(v) { return v > 0 ? `no sentido do eixo ${estado.r.lado2}` : `no sentido do eixo ${estado.r.lado1}`; }
  function sentidoPerp(v) { return v > 0 ? `afastando da linha ${estado.r.linhaRef}` : `em direção à linha ${estado.r.linhaRef}`; }

  function cartaoPonto(nome, c, remarcar, deR1, deR2) {
    const tol = estado.resultado.tolerancia;
    if (c.total <= tol) {
      return `<article class="ponto"><h3>${nome}<span>dentro da tolerância</span></h3><p class="nota">Não mexer. Está a ${cm(c.total)} do lugar.</p></article>`;
    }
    const comp = [];
    if (Math.abs(c.dx) >= 0.002) comp.push(`<li><b>${cm(c.dx)}</b><span>${sentidoAoLongo(c.dx)}</span></li>`);
    if (Math.abs(c.dy) >= 0.002) comp.push(`<li><b>${cm(c.dy)}</b><span>${sentidoPerp(c.dy)}</span></li>`);
    return `<article class="ponto mexe"><h3>${nome}<span>remarcar</span></h3>
      <div class="total">${cm(c.total)}</div>
      <ul class="mov">${comp.join('')}</ul>
      <div class="remarcar">Para remarcar com duas trenas: <b>${m3(remarcar.a)} m</b> a partir de <b>${deR1}</b> e <b>${m3(remarcar.b)} m</b> a partir de <b>${deR2}</b>. Onde as duas se cruzam é o ${nome}.</div>
    </article>`;
  }

  function blocoPregos(res) {
    const r = estado.r, L = res.linhas;
    if (!L) {
      return `<p class="nota">Para o app dizer quanto mexer em cada prego, informe na etapa 1 o afastamento dos sarrafos. Sem isso, use as distâncias de remarcação acima — elas sempre valem.</p>`;
    }
    const item = (linha, onde, v, sentido) => Math.abs(v) < 0.002
      ? `<div class="linha-prego"><div><strong>Linha ${esc(linha)}</strong><br><span>prego ${onde}</span></div><em>fica</em></div>`
      : `<div class="linha-prego"><div><strong>Linha ${esc(linha)}</strong><br><span>prego ${onde} • ${sentido(v)}</span></div><em>${cm(v)}</em></div>`;
    const ao = (v) => sentidoAoLongo(v), pp = (v) => sentidoPerp(v);
    let s = `<div class="linha-prego"><div><strong>Linha ${esc(r.linhaRef)}</strong><br><span>linha fixa</span></div><em>não mexe</em></div>`;
    if (L.lado1.mexe) s += item(r.lado1, `no sarrafo da linha ${r.linhaRef}`, L.lado1.pregoPerto, ao) + item(r.lado1, `no sarrafo depois da linha ${r.linhaOposta}`, L.lado1.pregoLonge, ao);
    if (L.lado2.mexe) s += item(r.lado2, `no sarrafo da linha ${r.linhaRef}`, L.lado2.pregoPerto, ao) + item(r.lado2, `no sarrafo depois da linha ${r.linhaOposta}`, L.lado2.pregoLonge, ao);
    if (L.oposto.mexe) s += item(r.linhaOposta, `no sarrafo depois do eixo ${r.lado1}`, L.oposto.pregoLado1, pp) + item(r.linhaOposta, `no sarrafo depois do eixo ${r.lado2}`, L.oposto.pregoLado2, pp);
    return `<div class="linhas">${s}</div><p class="nota">Pregos calculados com sarrafos a ${m2(res.gabarito)} m das linhas. Se algum sarrafo estiver em outra distância, use as distâncias de remarcação.</p>`;
  }

  function resumoMedidas(res) {
    return `<div class="medidas-resumo">${trenas().map((t) => {
      const dv = res.desvios[t.k];
      return `<div class="${Math.abs(dv) > res.tolerancia ? 'fora' : ''}"><small>${t.de}→${t.ate}</small><b>${m3(estado.med[t.k])}</b> <small>${Math.abs(dv) < 0.0005 ? 'igual' : cmSinal(dv)}</small></div>`;
    }).join('')}</div>`;
  }

  function desenhoResultado(res) {
    return `<figure class="desenho-cartao"><div class="desenho" id="desenho-res"></div><figcaption>Tracejado laranja = onde a linha está hoje (desenho exagerado para dar para ver). Contorno preto = onde deve ficar.</figcaption></figure>`;
  }

  function pintarDesenhoResultado(res) {
    const el = $('#desenho-res');
    if (!el || !res.c1 || $('[data-tela=resultado]').hidden) return;
    const r = estado.r;
    const { W, H } = caixa(el);
    const { ponto } = posEixos(r);
    const pR1 = ponto(r.R1), pR2 = ponto(r.R2), pM1 = ponto(r.M1);
    const len = (v) => Math.hypot(v.x, v.y);
    const u = { x: (pR2.x - pR1.x) / len({ x: pR2.x - pR1.x, y: pR2.y - pR1.y }), y: (pR2.y - pR1.y) / len({ x: pR2.x - pR1.x, y: pR2.y - pR1.y }) };
    const vv = { x: (pM1.x - pR1.x) / r.h, y: (pM1.y - pR1.y) / r.h };
    const local = (q) => ({ x: pR1.x + q.x * u.x + q.y * vv.x, y: pR1.y + q.x * u.y + q.y * vv.y });
    const maxErr = Math.max(res.c1.total, res.c2.total, 1e-6);
    const k = Math.max(1, Math.min(60, (Math.min(r.s, r.h) * 0.09) / maxErr));
    const exag = (atual, alvo) => ({ x: alvo.x + (atual.x - alvo.x) * k, y: alvo.y + (atual.y - alvo.y) * k });
    const aM1 = local(exag(res.M1, res.alvo1)), aM2 = local(exag(res.M2, res.alvo2));
    const tM1 = local(res.alvo1), tM2 = local(res.alvo2), R1 = local({ x: 0, y: 0 }), R2 = local({ x: res.base, y: 0 });
    const P = escala([R1, R2, tM1, tM2, aM1, aM2], W, H, { e: 92, d: 92, t: 40, b: 40 });
    const [pr1, pr2, pt1, pt2, pa1, pa2] = [R1, R2, tM1, tM2, aM1, aM2].map(P);
    let s = `<polygon class="d-casa" points="${[pr1, pr2, pt2, pt1].map((p) => p.x + ',' + p.y).join(' ')}"/>`;
    s += `<polyline class="d-atual" points="${[pr1, pa1, pa2, pr2].map((p) => p.x + ',' + p.y).join(' ')}"/>`;
    s += `<line class="d-ref" x1="${pr1.x}" y1="${pr1.y}" x2="${pr2.x}" y2="${pr2.y}"/>`;
    s += `<defs><marker id="ponta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="d-seta-ponta" d="M0 0L10 5L0 10z"/></marker></defs>`;
    [[pa1, pt1, res.c1], [pa2, pt2, res.c2]].forEach(([a, b, c]) => {
      if (c.total > res.tolerancia && Math.hypot(b.x - a.x, b.y - a.y) > 8) s += `<line class="d-seta" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" marker-end="url(#ponta)"/>`;
      if (c.total > res.tolerancia) s += `<circle class="d-mexer" cx="${a.x}" cy="${a.y}" r="5"/>`;
    });
    s += rotulosPontos(r, P, ponto, { R1: pr1, R2: pr2, M1: pt1, M2: pt2 });
    el.innerHTML = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  }

  function faixa(tipo, icone, titulo, texto) {
    return `<div class="faixa ${tipo}"><span class="icone">${icone}</span><div><h1>${titulo}</h1><p>${texto}</p></div></div>`;
  }

  function desenharResultado() {
    const res = estado.resultado, r = estado.r, alvo = $('#resultado');
    const tolTxt = cm(res.tolerancia);
    const acoesMedir = `<div class="acoes"><button class="botao principal" type="button" data-acao="remedir">Medir de novo <span>↻</span></button><button class="botao" type="button" data-acao="obra">Conferir as cotas da obra</button></div>`;
    let html = `<p class="rodada">Rodada ${estado.rodada} • ${esc(estado.proj.nome || 'obra sem nome')}</p>`;

    if (estado.piorou && res.situacao === 'corrigir') {
      html += faixa('parar', '!', 'O erro aumentou depois do ajuste', `Antes estava ${cm(Math.max(estado.anterior.c1.total, estado.anterior.c2.total))} fora; agora ${cm(Math.max(res.c1.total, res.c2.total))}. Pode ter mexido no sentido contrário, passado do ponto ou trocado as diagonais. <b>Não mexa em nada.</b> Confira o sentido e meça as seis trenas de novo.`);
      html += resumoMedidas(res) + acoesMedir;
    } else if (res.situacao === 'referencia') {
      html += faixa('parar', '!', 'A linha fixa não bate com o projeto', `${r.R1} → ${r.R2} mediu ${m3(estado.med.ref)} m; o projeto pede ${m3(r.s)} m (${cmSinal(res.diferencaRef)}). Esses dois pontos são a referência no lote, então o app não calcula correção em cima deles. Confira os pontos fixos com a prancha e o lote e meça de novo.`);
      html += resumoMedidas(res) + acoesMedir;
    } else if (res.situacao === 'nao-fecha') {
      const suspeitas = trenas().filter((t) => t.k !== 'ref').sort((a, b) => Math.abs(res.desvios[b.k]) - Math.abs(res.desvios[a.k])).slice(0, 2);
      html += faixa('parar', '!', 'As seis trenas não combinam entre si', `${esc(res.motivo || '')} Com medidas que não fecham, qualquer correção seria chute. <b>Não mexa em nada.</b> Meça as seis de novo, nos mesmos cruzamentos e com a trena esticada.`);
      html += `<div class="cartao"><h2>Vale conferir primeiro</h2><p class="nota">As que mais se afastaram do projeto — não dá para afirmar qual está errada, só por onde começar:</p><ul>${suspeitas.map((t) => `<li><b>${t.de} → ${t.ate}</b>: ${m3(estado.med[t.k])} m (${cmSinal(res.desvios[t.k])})</li>`).join('')}</ul></div>`;
      html += resumoMedidas(res) + acoesMedir;
    } else if (res.situacao === 'dentro') {
      html += faixa('ok', '✓', 'Geometria dentro da tolerância', `Os dois cruzamentos que podiam andar estão a no máximo ${cm(Math.max(res.c1.total, res.c2.total))} do lugar (tolerância ${tolTxt}) e as seis trenas fecham entre si. Isto confere a forma da casa — posição e recuos no lote se conferem à parte.`);
      html += resumoMedidas(res);
      html += `<div class="cartao intermed"><h2>Agora marque os outros eixos</h2><div id="tabela-res"></div></div>`;
      html += `<div class="acoes"><button class="botao" type="button" data-acao="remedir">Medir de novo</button><button class="botao" type="button" data-acao="copiar">Copiar resumo</button></div>`;
    } else if (estado.fase === 'reler') {
      const mexe1 = res.c1.total > res.tolerancia, mexe2 = res.c2.total > res.tolerancia;
      const pedir = [];
      if (mexe1) pedir.push(['lado1', r.R1, r.M1], ['diag2', r.R2, r.M1]);
      if (mexe2) pedir.push(['lado2', r.R2, r.M2], ['diag1', r.R1, r.M2]);
      html += faixa('mexer', '↻', 'Antes de mexer, releia ' + (pedir.length === 2 ? 'duas trenas' : 'quatro trenas'), `São as trenas que definem ${[mexe1 && r.M1, mexe2 && r.M2].filter(Boolean).join(' e ')}. Uma leitura errada de 1 a 2 cm nelas não aparece na conferência e viraria uma correção errada — por isso o app pede a releitura.`);
      html += `<form class="reler" id="form-reler" novalidate><h2>Releitura</h2><div class="duas">${pedir.map(([k, de, ate]) => `<label class="campo"><span>${de} → ${ate} <em>(antes ${m3(estado.med[k])})</em></span><div class="com-unidade"><input id="rl-${k}" data-k="${k}" inputmode="decimal" autocomplete="off" placeholder="${m3(estado.med[k])}"><b>m</b></div></label>`).join('')}</div>
        <p class="nota">Deixe em branco se a leitura repetiu igual.</p><button class="botao principal mexer" type="submit">Confirmar e ver a correção <span>→</span></button></form>`;
      html += resumoMedidas(res);
    } else {
      const grande = res.grande ? ' É uma correção grande: faça, meça as seis de novo, e o app vai refinando.' : '';
      html += faixa('mexer', '→', 'Remarque o que está em laranja', `${r.R1} e ${r.R2} ficam fixos. ${estado.releituraMudou ? '<b>A releitura mudou as medidas e a conta foi refeita.</b> ' : ''}${grande}`);
      html += `<div class="grade"><div>${desenhoResultado(res)}</div><div>
        <div class="pontos">${cartaoPonto(r.M1, res.c1, { a: res.remarcar.M1.deR1, b: res.remarcar.M1.deR2 }, r.R1, r.R2)}${cartaoPonto(r.M2, res.c2, { a: res.remarcar.M2.deR2, b: res.remarcar.M2.deR1 }, r.R2, r.R1)}</div>
        <div class="cartao"><h2>Nas linhas e pregos</h2>${blocoPregos(res)}</div>
      </div></div>`;
      html += `<div class="acoes"><button class="botao principal" type="button" data-acao="remedir">Já remarquei — medir de novo <span>↻</span></button><button class="botao" type="button" data-acao="copiar">Copiar para o WhatsApp</button></div>`;
    }
    alvo.innerHTML = html;
    if ($('#tabela-res')) desenharIntermediarios($('#tabela-res'));
    if ($('#desenho-res')) observador.observe($('#desenho-res'));
    pintarDesenhoResultado(res);
    const fr = $('#form-reler');
    if (fr) fr.addEventListener('submit', (ev) => {
      ev.preventDefault();
      let mudou = false;
      $$('input', fr).forEach((inp) => {
        const k = inp.dataset.k;
        const v = G.lerMedida(inp.value, estado.med[k]).valor;
        if (Number.isFinite(v) && v > 0 && Math.abs(v - estado.med[k]) > 0.0005) { estado.med[k] = v; mudou = true; }
      });
      estado.releituraMudou = mudou;
      if (mudou) {
        const novo = G.conferir(estado.r, estado.med, config());
        estado.resultado = novo;
        estado.piorou = estado.anterior && G.piorou(estado.anterior, novo, config().tolerancia);
        registrar(novo, 'releitura');
      }
      estado.fase = 'mexer';
      desenharResultado();
      window.scrollTo({ top: 0 });
    });
  }

  $('#resultado').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    if (acao === 'remedir') {
      if (estado.resultado && estado.resultado.situacao === 'corrigir' && !estado.piorou) { estado.anterior = estado.resultado; estado.rodada += 1; }
      estado.med = {}; estado.releituraMudou = false;
      montarTrenas();
      mostrar('medir');
      setTimeout(() => $('#t-ref')?.focus({ preventScroll: true }), 60);
    } else if (acao === 'obra') {
      mostrar('obra');
    } else if (acao === 'copiar') {
      copiar(textoResumo(estado.resultado), b);
    }
  });

  /* ---------- registro ---------- */
  function textoResumo(res) {
    const r = estado.r;
    const linhas = [`EDR Esquadro — ${estado.proj.nome || 'obra'} — rodada ${estado.rodada}`, `Fixos: ${r.R1} e ${r.R2} (linha ${r.linhaRef})`];
    trenas().forEach((t) => linhas.push(`${t.de}→${t.ate}: ${m3(estado.med[t.k])} m (projeto ${m3(t.esp)})`));
    if (res.situacao === 'dentro') linhas.push(`✅ Dentro da tolerância (${cm(res.tolerancia)})`);
    else if (res.situacao === 'corrigir') {
      [[r.M1, res.c1, res.remarcar.M1.deR1, res.remarcar.M1.deR2, r.R1, r.R2], [r.M2, res.c2, res.remarcar.M2.deR2, res.remarcar.M2.deR1, r.R2, r.R1]].forEach(([n, c, a, b, da, db]) => {
        if (c.total > res.tolerancia) linhas.push(`➡️ ${n}: remarcar ${cm(c.total)} — ${m3(a)} m de ${da} e ${m3(b)} m de ${db}`);
        else linhas.push(`✔️ ${n}: não mexer`);
      });
    } else linhas.push('⛔ Parar e medir de novo: ' + (res.situacao === 'referencia' ? 'linha fixa não bate com o projeto' : 'trenas não combinam'));
    return linhas.join('\n');
  }

  function registrar(res, obs) {
    const reg = ler(CHAVE_REG, []);
    reg.unshift({ quando: new Date().toISOString(), obra: estado.proj.nome || 'obra sem nome', rodada: estado.rodada, situacao: res.situacao, obs: obs || '', texto: textoResumo(res) });
    guardar(CHAVE_REG, reg.slice(0, 120));
  }

  const NOME_SIT = { dentro: 'Dentro da tolerância', corrigir: 'Correção indicada', referencia: 'Parou: linha fixa', 'nao-fecha': 'Parou: trenas não fecham' };
  $('#ver-registro').addEventListener('click', () => {
    const reg = ler(CHAVE_REG, []);
    $('#registro-lista').innerHTML = reg.length
      ? reg.map((x) => `<div class="reg"><b>${esc(x.obra)}</b> • rodada ${x.rodada} • ${NOME_SIT[x.situacao] || x.situacao}${x.obs ? ' (' + esc(x.obs) + ')' : ''}<br><small>${new Date(x.quando).toLocaleString('pt-BR')}</small></div>`).join('')
      : '<p class="nota">Nenhuma conferência registrada neste aparelho.</p>';
    $('#registro').showModal();
  });
  $('#registro').addEventListener('click', (ev) => { if (ev.target.matches('[data-fechar]') || ev.target === $('#registro')) $('#registro').close(); });
  $('#copiar-registro').addEventListener('click', (ev) => copiar(ler(CHAVE_REG, []).slice(0, 10).map((x) => x.texto).join('\n\n'), ev.currentTarget));
  $('#limpar-registro').addEventListener('click', () => { guardar(CHAVE_REG, []); $('#registro-lista').innerHTML = '<p class="nota">Registro limpo.</p>'; });

  function copiar(texto, botao) {
    const ok = () => { const t = botao.textContent; botao.textContent = 'Copiado ✓'; setTimeout(() => { botao.textContent = t; }, 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(texto).then(ok, () => fallback());
    else fallback();
    function fallback() {
      const ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (_) { /* nada */ }
      ta.remove();
    }
  }

  /* ---------- início ---------- */
  const desenharTudo = () => { desenharPlanta(); desenharMedir(); if (estado.resultado) pintarDesenhoResultado(estado.resultado); };
  const observador = new ResizeObserver(() => desenharTudo());
  $$('.desenho').forEach((d) => observador.observe(d));
  window.addEventListener('resize', desenharTudo);

  const ultima = ler(CHAVE_ULTIMA, null);
  listarObras(ultima?.nome && ler(CHAVE_OBRAS, {})[ultima.nome] ? ultima.nome : '__exemplo');
  preencherForm(ultima || EXEMPLO);
  recalcularProjeto();
  mostrar('obra');

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=1.0.0').catch(() => {}));
  }
}
