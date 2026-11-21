/* EDR Esquadro — motor de cálculo (v1.0)
 *
 * Regra do método (combinada nas auditorias Claude + Cerberus, 21/11/2026):
 * - A linha de referência (ex.: eixo F, alinhada à rua) e seus dois cruzamentos
 *   são FIXOS e já conferidos no lote. O app nunca manda mexer neles.
 * - Os outros dois cruzamentos são reconstruídos pelas trenas:
 *     M1 (lado do ponto fixo R1) = lado R1–M1 + diagonal R2–M1
 *     M2 (lado do ponto fixo R2) = lado R2–M2 + diagonal R1–M2
 * - O lado oposto M1–M2 é medido só para conferência. Se não bater com o que
 *   as outras cinco trenas dizem, o app pede nova leitura e não manda mexer.
 * - Correção sai por cruzamento, por linha e por prego (com o afastamento do
 *   gabarito), e sempre com as duas distâncias para remarcar à trena.
 *
 * Sistema local: x ao longo da referência (R1 -> R2), y para dentro da casa.
 * Unidades: metros.
 */
(function expor(raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (raiz) raiz.EDRGeometria = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function fabrica() {
  'use strict';

  const EPS = 1e-9;

  /* ---------- projeto: eixos e retângulo ---------- */

  function lerNumeros(texto) {
    return String(texto || '')
      .trim()
      .split(/[\s;|/]+/)
      .filter(Boolean)
      .map((v) => Number(v.replace(',', '.')));
  }

  function lerNomes(texto) {
    return String(texto || '').trim().split(/[\s,;|/]+/).filter(Boolean).map((n) => n.toUpperCase());
  }

  // nomes: ['1','2',...]; espacos: [1.5, 0.52, ...] (um a menos que os nomes)
  function montarEixos(nomes, espacos, rotulo) {
    if (nomes.length < 2) throw new Error(`Informe pelo menos dois eixos ${rotulo}.`);
    if (new Set(nomes).size !== nomes.length) throw new Error(`Há eixo ${rotulo} com nome repetido.`);
    if (espacos.length !== nomes.length - 1) {
      throw new Error(`Eixos ${rotulo}: são ${nomes.length} eixos, então precisam de ${nomes.length - 1} cotas entre eles (foram ${espacos.length}).`);
    }
    espacos.forEach((e) => {
      if (!Number.isFinite(e) || e <= 0) throw new Error(`Eixos ${rotulo}: toda cota entre eixos precisa ser maior que zero.`);
    });
    let pos = 0;
    return nomes.map((nome, i) => {
      if (i > 0) pos += espacos[i - 1];
      return { nome, pos: Math.round(pos * 10000) / 10000 };
    });
  }

  function acharEixo(lista, nome, rotulo) {
    const e = lista.find((x) => x.nome === String(nome).toUpperCase());
    if (!e) throw new Error(`O eixo ${nome} não está na lista de eixos ${rotulo}.`);
    return e;
  }

  // proj: { nomesV, cotasV, nomesH, cotasH, v0, v1, h0, h1, referencia }
  // V = eixos verticais (números, cotas da esquerda p/ direita)
  // H = eixos horizontais (letras, cotas de cima p/ baixo, como na prancha)
  function montarRetangulo(proj) {
    const V = montarEixos(lerNomes(proj.nomesV), lerNumeros(proj.cotasV), 'verticais');
    const H = montarEixos(lerNomes(proj.nomesH), lerNumeros(proj.cotasH), 'horizontais');
    let va = acharEixo(V, proj.v0, 'verticais');
    let vb = acharEixo(V, proj.v1, 'verticais');
    let ha = acharEixo(H, proj.h0, 'horizontais');
    let hb = acharEixo(H, proj.h1, 'horizontais');
    if (va === vb) throw new Error('Escolha dois eixos verticais diferentes para a casa.');
    if (ha === hb) throw new Error('Escolha dois eixos horizontais diferentes para a casa.');
    if (va.pos > vb.pos) [va, vb] = [vb, va];
    if (ha.pos > hb.pos) [ha, hb] = [hb, ha];
    const ref = String(proj.referencia || '').toUpperCase();
    const largura = vb.pos - va.pos; // ao longo dos horizontais
    const altura = hb.pos - ha.pos; // ao longo dos verticais
    const ponto = (v, h) => `${v.nome}-${h.nome}`;

    let r;
    if (ref === ha.nome || ref === hb.nome) {
      // referência horizontal: R1 = ref x va, R2 = ref x vb
      const refE = ref === ha.nome ? ha : hb;
      const opE = ref === ha.nome ? hb : ha;
      r = {
        orientacao: 'horizontal',
        s: largura, h: altura,
        linhaRef: refE.nome, linhaOposta: opE.nome, lado1: va.nome, lado2: vb.nome,
        R1: ponto(va, refE), R2: ponto(vb, refE), M1: ponto(va, opE), M2: ponto(vb, opE),
      };
    } else if (ref === va.nome || ref === vb.nome) {
      const refE = ref === va.nome ? va : vb;
      const opE = ref === va.nome ? vb : va;
      r = {
        orientacao: 'vertical',
        s: altura, h: largura,
        linhaRef: refE.nome, linhaOposta: opE.nome, lado1: ha.nome, lado2: hb.nome,
        R1: ponto(refE, ha), R2: ponto(refE, hb), M1: ponto(opE, ha), M2: ponto(opE, hb),
      };
    } else {
      throw new Error(`A linha de referência precisa ser um dos 4 eixos da casa (${va.nome}, ${vb.nome}, ${ha.nome} ou ${hb.nome}).`);
    }
    r.diagonal = Math.hypot(r.s, r.h);
    r.V = V; r.H = H; r.va = va; r.vb = vb; r.ha = ha; r.hb = hb;
    r.intermediarios = intermediarios(r);
    return r;
  }

  // Distâncias para marcar os outros eixos, medidas a partir das linhas fixas.
  function intermediarios(r) {
    const ladoV = r.orientacao === 'horizontal';
    // eixos paralelos aos lados: marcados AO LONGO da referência, a partir do lado1
    const paralelosLados = (ladoV ? r.V : r.H).map((e) => ({
      nome: e.nome,
      dist: e.pos - (ladoV ? r.va.pos : r.ha.pos),
    }));
    // eixos paralelos à referência: marcados AO LONGO dos lados, a partir da referência
    const refE = ladoV ? (r.linhaRef === r.ha.nome ? r.ha : r.hb) : (r.linhaRef === r.va.nome ? r.va : r.vb);
    const sentido = ladoV ? (refE === r.ha ? 1 : -1) : (refE === r.va ? 1 : -1);
    const paralelosRef = (ladoV ? r.H : r.V).map((e) => ({
      nome: e.nome,
      dist: (e.pos - refE.pos) * sentido,
    }));
    return { aPartirDe: r.lado1, aoLongoDaRef: paralelosLados, aPartirDaRef: r.linhaRef, aoLongoDosLados: paralelosRef };
  }

  /* ---------- conferência no campo ---------- */

  function trilaterar(base, dR1, dR2, nome) {
    if (dR1 + dR2 < base - EPS || Math.abs(dR1 - dR2) > base + EPS) {
      throw new ErroMedida(`As trenas que chegam em ${nome} não formam triângulo com a referência. Confira se não trocou alguma medida.`);
    }
    const x = (dR1 * dR1 - dR2 * dR2 + base * base) / (2 * base);
    const y2 = dR1 * dR1 - x * x;
    return { x, y: Math.sqrt(Math.max(0, y2)) };
  }

  function ErroMedida(msg) { this.message = msg; this.name = 'ErroMedida'; }
  ErroMedida.prototype = Object.create(Error.prototype);

  const CAMPOS = ['ref', 'lado1', 'lado2', 'oposto', 'diag1', 'diag2'];

  function esperado(r) {
    return { ref: r.s, lado1: r.h, lado2: r.h, oposto: r.s, diag1: r.diagonal, diag2: r.diagonal };
  }

  /*
   * r   = retângulo de montarRetangulo (ou {s,h,diagonal,...})
   * med = { ref, lado1, lado2, oposto, diag1, diag2 } em metros
   *       lado1 = R1–M1, lado2 = R2–M2, oposto = M1–M2, diag1 = R1–M2, diag2 = R2–M1
   * cfg = { tolerancia (m, por cruzamento), gabarito (m, afastamento do prego), fechamento (m) }
   */
  function conferir(r, med, cfg = {}) {
    const tol = Number.isFinite(cfg.tolerancia) && cfg.tolerancia > 0 ? cfg.tolerancia : 0.01;
    // Prego só é calculado se a equipe informar o afastamento real dos sarrafos (regra 2 do Cerberus).
    const gab = Number.isFinite(cfg.gabarito) && cfg.gabarito > 0 ? cfg.gabarito : null;
    const limFech = Number.isFinite(cfg.fechamento) && cfg.fechamento > 0 ? cfg.fechamento : Math.max(0.01, 1.5 * tol);
    const esp = esperado(r);

    CAMPOS.forEach((k) => {
      if (!Number.isFinite(med[k]) || med[k] <= 0) throw new ErroMedida('Preencha as seis trenas antes de calcular.');
    });

    const desvios = {};
    CAMPOS.forEach((k) => { desvios[k] = med[k] - esp[k]; });
    const base = { esperado: esp, desvios, tolerancia: tol, limiteFechamento: limFech };

    // 1) referência: é fixa. Se não bate, o problema não é de esquadro.
    if (Math.abs(desvios.ref) > tol + EPS) {
      return { ...base, situacao: 'referencia', diferencaRef: desvios.ref };
    }

    // 2) reconstrução dos dois cruzamentos que podem andar
    const s = med.ref;
    let M1, M2;
    try {
      M1 = trilaterar(s, med.lado1, med.diag2, r.M1 || 'M1');
      M2 = trilaterar(s, med.diag1, med.lado2, r.M2 || 'M2');
    } catch (e) {
      return { ...base, situacao: 'nao-fecha', motivo: e.message };
    }

    // 3) conferência independente: o lado oposto medido x o calculado
    const opostoCalculado = Math.hypot(M2.x - M1.x, M2.y - M1.y);
    const fechamento = med.oposto - opostoCalculado;
    if (Math.abs(fechamento) > limFech + EPS) {
      return { ...base, situacao: 'nao-fecha', opostoCalculado, fechamento, M1, M2,
        motivo: `O lado ${r.M1 || 'M1'}–${r.M2 || 'M2'} medido (${fmt(med.oposto)} m) não combina com as outras cinco trenas (dariam ${fmt(opostoCalculado)} m).` };
    }

    // 4) correção de cada cruzamento
    const alvo1 = { x: 0, y: r.h };
    const alvo2 = { x: s, y: r.h };
    const c1 = { dx: alvo1.x - M1.x, dy: alvo1.y - M1.y };
    const c2 = { dx: alvo2.x - M2.x, dy: alvo2.y - M2.y };
    c1.total = Math.hypot(c1.dx, c1.dy);
    c2.total = Math.hypot(c2.dx, c2.dy);

    const dentro = c1.total <= tol + EPS && c2.total <= tol + EPS;

    // 5) pregos (opcional): cada linha é definida por dois pregos a "gab" metros além dos cruzamentos.
    //    Vale só se os sarrafos estiverem paralelos às linhas da casa e a essa distância.
    const h = r.h;
    const g = gab || 0;
    // lado 1: passa por R1 (0,0) e M1. pregos em y=-gab (perto, gabarito da referência) e y=h+gab (longe)
    const xLado1 = (y) => (M1.y > EPS ? M1.x * y / M1.y : 0);
    const xLado2 = (y) => (M2.y > EPS ? s + (M2.x - s) * y / M2.y : s);
    const yOposto = (x) => {
      const dx = M2.x - M1.x;
      return Math.abs(dx) > EPS ? M1.y + (M2.y - M1.y) * (x - M1.x) / dx : (M1.y + M2.y) / 2;
    };
    const linhas = {
      referencia: { linha: r.linhaRef, mexe: false },
      lado1: {
        linha: r.lado1,
        // + = para dentro da casa (sentido do lado 2)
        pregoPerto: 0 - xLado1(-g),
        pregoLonge: 0 - xLado1(h + g),
        sinalDentro: 1,
      },
      lado2: {
        linha: r.lado2,
        pregoPerto: s - xLado2(-g),
        pregoLonge: s - xLado2(h + g),
        sinalDentro: -1,
      },
      oposto: {
        linha: r.linhaOposta,
        pregoLado1: h - yOposto(-g),
        pregoLado2: h - yOposto(s + g),
        sinalDentro: -1,
      },
    };
    linhas.lado1.mexe = Math.max(Math.abs(linhas.lado1.pregoPerto), Math.abs(linhas.lado1.pregoLonge)) > tol / 2;
    linhas.lado2.mexe = Math.max(Math.abs(linhas.lado2.pregoPerto), Math.abs(linhas.lado2.pregoLonge)) > tol / 2;
    linhas.oposto.mexe = Math.max(Math.abs(linhas.oposto.pregoLado1), Math.abs(linhas.oposto.pregoLado2)) > tol / 2;

    return {
      ...base,
      situacao: dentro ? 'dentro' : 'corrigir',
      base: s,
      M1, M2, alvo1, alvo2, c1, c2,
      opostoCalculado, fechamento,
      gabarito: gab,
      linhas: gab ? linhas : null,
      // retas que não mexem mesmo sem pregos: referência sempre fixa
      linhaFixa: r.linhaRef,
      remarcar: {
        M1: { deR1: r.h, deR2: Math.hypot(s, r.h) },
        M2: { deR2: r.h, deR1: Math.hypot(s, r.h) },
      },
      grande: Math.max(c1.total, c2.total) > 0.30,
    };
  }

  // Entre rodadas: se o erro aumentou, alguém mexeu no sentido errado, passou do ponto
  // ou trocou as trenas. O app para e manda conferir (regra 3: na dúvida, não chuta).
  function piorou(anterior, atual, tol) {
    if (!anterior || !atual || !anterior.c1 || !atual.c1) return false;
    const a = Math.max(anterior.c1.total, anterior.c2.total);
    const b = Math.max(atual.c1.total, atual.c2.total);
    return b > a + Math.max(0.005, tol / 2);
  }

  function fmt(v, casas = 3) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  // Aceita "13,23", "13.23", "13,23 m" e também centímetros ("1323" ou "1323 cm") quando o valor esperado é < 100 m.
  function lerMedida(texto, esperadoM) {
    const t = String(texto || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!t) return { valor: NaN };
    const emCm = /cm$/.test(t);
    const num = Number(t.replace(/(cm|m)$/, '').replace(',', '.'));
    if (!Number.isFinite(num)) return { valor: NaN };
    if (emCm) return { valor: num / 100, convertido: true };
    if (Number.isFinite(esperadoM) && esperadoM < 100 && num > 100 && Math.abs(num / 100 - esperadoM) < esperadoM * 0.5) {
      return { valor: num / 100, convertido: true };
    }
    return { valor: num };
  }

  return { piorou, lerNumeros, lerNomes, montarEixos, montarRetangulo, conferir, esperado, trilaterar, lerMedida, CAMPOS };
});
