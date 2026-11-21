// Testes do motor do EDR Esquadro — rodar com: node testes/geometria.teste.js
const G = require('../geometria.js');
let falhas = 0, total = 0;
const ok = (cond, nome, extra = '') => { total++; if (!cond) { falhas++; console.log('  ✗ ' + nome + ' ' + extra); } else console.log('  ✓ ' + nome); };
const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const cm = (m) => (m * 100).toFixed(2) + ' cm';

// Casa do Arthur (prancha 03): eixos 2–9 x B–F, referência na linha F
const ARTHUR = { nomesV: '1 2 3 4 5 6 7 8 9 10', cotasV: '1,50 0,52 3,34 1,55 1,27 0,96 2,06 1,42 6,05',
  nomesH: 'A B C D E F', cotasH: '7,74 3,12 1,22 1,40 1,42', v0: '2', v1: '9', h0: 'B', h1: 'F', referencia: 'F' };
const r = G.montarRetangulo(ARTHUR);
const s = r.s, h = r.h;
const R1 = { x: 0, y: 0 }, R2 = { x: s, y: 0 };

function medir(M1, M2, ruido = 0, rnd = Math.random) {
  const n = () => (rnd() * 2 - 1) * ruido;
  return { ref: d(R1, R2) + n(), lado1: d(R1, M1) + n(), lado2: d(R2, M2) + n(), oposto: d(M1, M2) + n(), diag1: d(R1, M2) + n(), diag2: d(R2, M1) + n() };
}
// executa a correção pelos cruzamentos e devolve o erro que sobra
function aplicarPontos(M1, M2, res) {
  const n1 = { x: M1.x + res.c1.dx, y: M1.y + res.c1.dy }, n2 = { x: M2.x + res.c2.dx, y: M2.y + res.c2.dy };
  return Math.max(d(n1, { x: 0, y: h }), d(n2, { x: s, y: h }));
}
// executa a correção mexendo só nos PREGOS (linhas reais) e recalcula os cruzamentos
function interseccao(a1, a2, b1, b2) {
  const den = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x);
  const t = ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / den;
  return { x: a1.x + t * (a2.x - a1.x), y: a1.y + t * (a2.y - a1.y) };
}
function aplicarPregos(M1, M2, res, g) {
  // pregos atuais = onde as linhas atuais cortam os sarrafos
  const sar = { perto: [{ x: -50, y: -g }, { x: 50, y: -g }], longe: [{ x: -50, y: h + g }, { x: 50, y: h + g }], esq: [{ x: -g, y: -50 }, { x: -g, y: 50 }], dir: [{ x: s + g, y: -50 }, { x: s + g, y: 50 }] };
  const L = res.linhas;
  const l1p = interseccao(R1, M1, ...sar.perto), l1l = interseccao(R1, M1, ...sar.longe);
  const l2p = interseccao(R2, M2, ...sar.perto), l2l = interseccao(R2, M2, ...sar.longe);
  const ope = interseccao(M1, M2, ...sar.esq), opd = interseccao(M1, M2, ...sar.dir);
  const n1p = { x: l1p.x + L.lado1.pregoPerto, y: l1p.y }, n1l = { x: l1l.x + L.lado1.pregoLonge, y: l1l.y };
  const n2p = { x: l2p.x + L.lado2.pregoPerto, y: l2p.y }, n2l = { x: l2l.x + L.lado2.pregoLonge, y: l2l.y };
  const noe = { x: ope.x, y: ope.y + L.oposto.pregoLado1 }, nod = { x: opd.x, y: opd.y + L.oposto.pregoLado2 };
  const nR1 = interseccao(n1p, n1l, R1, R2), nR2 = interseccao(n2p, n2l, R1, R2);
  const nM1 = interseccao(n1p, n1l, noe, nod), nM2 = interseccao(n2p, n2l, noe, nod);
  return Math.max(d(nR1, R1), d(nR2, R2), d(nM1, { x: 0, y: h }), d(nM2, { x: s, y: h }));
}
const CFG = { tolerancia: 0.01 };

console.log('\n# Projeto (prancha 03 do Arthur)');
ok(Math.abs(s - 11.12) < 1e-9 && Math.abs(h - 7.16) < 1e-9, 'retângulo 2–9 x B–F = 11,12 x 7,16');
ok(Math.abs(r.diagonal - 13.2257) < 1e-3, 'diagonal 13,226 m');
ok(r.R1 === '2-F' && r.R2 === '9-F' && r.M1 === '2-B' && r.M2 === '9-B', 'cruzamentos com nome da prancha (2-F, 9-F, 2-B, 9-B)', JSON.stringify([r.R1, r.R2, r.M1, r.M2]));
const i3 = r.intermediarios.aoLongoDaRef.find((e) => e.nome === '3');
const i8 = r.intermediarios.aoLongoDaRef.find((e) => e.nome === '8');
const iE = r.intermediarios.aoLongoDosLados.find((e) => e.nome === 'E');
const iC = r.intermediarios.aoLongoDosLados.find((e) => e.nome === 'C');
const i1 = r.intermediarios.aoLongoDaRef.find((e) => e.nome === '1');
ok(Math.abs(i3.dist - 0.52) < 1e-6 && Math.abs(i8.dist - 9.70) < 1e-6 && Math.abs(i1.dist + 1.50) < 1e-6, 'acumulados ao longo de F a partir do 2: 3=0,52; 8=9,70; 1=-1,50');
ok(Math.abs(iE.dist - 1.42) < 1e-6 && Math.abs(iC.dist - 4.04) < 1e-6, 'acumulados a partir de F: E=1,42; C=4,04');
const rv = G.montarRetangulo({ ...ARTHUR, referencia: '2' });
ok(rv.s === 7.16 && Math.abs(rv.h - 11.12) < 1e-9 && rv.R1 === '2-B' && rv.M2 === '9-F', 'referência no eixo 2 (vertical) também funciona');
let erroProj = ''; try { G.montarRetangulo({ ...ARTHUR, cotasV: '1,50 0,52' }); } catch (e) { erroProj = e.message; }
ok(/precisam de 9 cotas/.test(erroProj), 'cotas faltando dão erro claro', erroProj);

const casos = [
  ['casa certa', { x: 0, y: h }, { x: s, y: h }, 'dentro'],
  ['só 2-B fora 6 cm ao longo de F (caso do Cerberus)', { x: 0.06, y: h }, { x: s, y: h }, 'corrigir'],
  ['só 9-B 4 cm para fora', { x: 0, y: h }, { x: s, y: h + 0.04 }, 'corrigir'],
  ['lado B inteiro deslizou 5 cm (casa torta)', { x: 0.05, y: h }, { x: s + 0.05, y: h }, 'corrigir'],
  ['lado B 3 cm longe demais (casa maior)', { x: 0, y: h + 0.03 }, { x: s, y: h + 0.03 }, 'corrigir'],
  ['trapézio (9-B 3 cm para fora do 9)', { x: 0, y: h }, { x: s + 0.03, y: h }, 'corrigir'],
  ['erro grande: torta 30 cm', { x: 0.30, y: h - 0.006 }, { x: s + 0.30, y: h - 0.006 }, 'corrigir'],
  ['erro grande: 2-B 45 cm fora e 9-B 20 cm dentro', { x: -0.45, y: h + 0.1 }, { x: s - 0.2, y: h - 0.15 }, 'corrigir'],
];
console.log('\n# Casos de obra (correção executada pelo cruzamento e pelos pregos, sarrafo a 1,20 m)');
for (const [nome, M1, M2, esperadoSit] of casos) {
  const res = G.conferir(r, medir(M1, M2), { ...CFG, gabarito: 1.2 });
  const sobraPontos = res.c1 ? aplicarPontos(M1, M2, res) : 0;
  const sobraPregos = res.linhas ? aplicarPregos(M1, M2, res, 1.2) : 0;
  ok(res.situacao === esperadoSit && sobraPontos < 1e-6 && sobraPregos < 1e-6, nome,
    `situação=${res.situacao} sobra(pontos)=${cm(sobraPontos)} sobra(pregos)=${cm(sobraPregos)}`);
}
// só o cruzamento errado deve ser mandado mexer
const so2B = G.conferir(r, medir({ x: 0.06, y: h }, { x: s, y: h }), CFG);
ok(so2B.c1.total > 0.059 && so2B.c2.total < 1e-6, 'erro só em 2-B: não manda mexer 9-B', `c1=${cm(so2B.c1.total)} c2=${cm(so2B.c2.total)}`);
ok(so2B.linhas === null, 'sem afastamento informado: não calcula prego (regra 2)');
ok(Math.abs(so2B.remarcar.M1.deR1 - 7.16) < 1e-9 && Math.abs(so2B.remarcar.M1.deR2 - 13.2257) < 1e-3, 'distâncias de remarcação de 2-B: 7,16 do 2-F e 13,226 do 9-F');

console.log('\n# Travas');
const incompat = G.conferir(r, { ref: s, lado1: h, lado2: h, oposto: s, diag1: 13.19, diag2: 13.19 }, CFG);
ok(incompat.situacao === 'nao-fecha', 'lados exatos + diagonais 13,19 (caso do Cerberus) => NÃO libera, pede nova leitura', incompat.situacao + ' ' + (incompat.fechamento != null ? cm(incompat.fechamento) : ''));
const refRuim = G.conferir(r, { ...medir({ x: 0, y: h }, { x: s, y: h }), ref: s + 0.02 }, CFG);
ok(refRuim.situacao === 'referencia', 'referência 2 cm fora => para e pede conferir os pontos fixos');
const impossivel = G.conferir(r, { ...medir({ x: 0, y: h }, { x: s, y: h }), diag2: 3 }, CFG);
ok(impossivel.situacao === 'nao-fecha', 'medida absurda (diagonal 3 m) => não fecha, sem quebrar');
const rod1 = G.conferir(r, medir({ x: 0.08, y: h }, { x: s, y: h }), CFG);
const rod2Errada = G.conferir(r, medir({ x: 0.16, y: h }, { x: s, y: h }), CFG); // mexeu no sentido contrário
const rod2Certa = G.conferir(r, medir({ x: 0.005, y: h }, { x: s, y: h }), CFG);
ok(!!G.piorou(rod1, rod2Errada, 0.01), 'mexeu no sentido errado (erro 8 → 16 cm) => trava e manda conferir');
ok(G.piorou(rod1, rod2Certa, 0.01) === false, 'mexeu certo (8 → 0,5 cm) => segue');

console.log('\n# Regressões da revisão do Cerberus (IA-03)');
{ // item 3: cantos 10/1 cm -> 8/4 cm. O maior erro caiu, mas 9-B piorou 3 cm.
  const a = G.conferir(r, medir({ x: 0.10, y: h }, { x: s + 0.01, y: h }), CFG);
  const b = G.conferir(r, medir({ x: 0.08, y: h }, { x: s + 0.04, y: h }), CFG);
  const p = G.piorou(a, b, 0.01);
  ok(!!p && p.M2 === true && p.M1 === false, 'item 3: um canto piorou 3 cm enquanto o outro melhorou => trava e aponta 9-B', JSON.stringify(p));
}
{ // item 6: base 10, profundidade 8, M1=(2;0), M2=(10;8) — seis medidas fecham mas M1 está na linha fixa
  const r2 = { s: 10, h: 8, diagonal: Math.hypot(10, 8), M1: 'M1', M2: 'M2', linhaRef: 'R' };
  const A = { x: 0, y: 0 }, B = { x: 10, y: 0 }, M1 = { x: 2, y: 0 }, M2 = { x: 10, y: 8 };
  const res = G.conferir(r2, { ref: 10, lado1: d(A, M1), lado2: d(B, M2), oposto: d(M1, M2), diag1: d(A, M2), diag2: d(B, M1) }, { tolerancia: 0.01, gabarito: 1 });
  ok(res.situacao === 'nao-fecha' && res.degenerada === true, 'item 6: canto em cima da linha fixa => para (não manda mexer 8 m nem diz que o prego fica)', res.situacao);
}
{ // item 4: leitura errada de 1,3 cm num lado; a releitura obrigatória tem que pegar
  const c1 = G.compararLeituras([7.147, 7.160]);
  ok(c1.ok === false && c1.motivo === 'divergiu', 'item 4: 1ª leitura 7,147 e releitura 7,160 => divergem, pede 3ª leitura');
  const c2 = G.compararLeituras([7.147, 7.160, 7.161]);
  ok(c2.ok === true && Math.abs(c2.valor - 7.1605) < 1e-9 && c2.descartou, 'item 4: 3ª leitura 7,161 => usa as duas que concordam (7,1605)');
  ok(G.compararLeituras([7.160, 7.163]).ok === true, 'leituras a 3 mm => aceitas (média)');
  ok(G.compararLeituras([7.160, 7.180, 7.200]).ok === false, 'três leituras todas diferentes => não aceita, medir de novo');
  ok(G.compararLeituras([7.160]).ok === false, 'releitura em branco não vale');
}
{ // item 4 (8 x 4 m): erro de +2,5 cm num lado passa pelo fechamento — por isso a releitura é obrigatória
  const r84 = G.montarRetangulo({ nomesV: '1 2', cotasV: '8', nomesH: 'A B', cotasH: '4', v0: '1', v1: '2', h0: 'A', h1: 'B', referencia: 'B' });
  const e = G.esperado(r84);
  const res = G.conferir(r84, { ...e, lado1: e.lado1 + 0.025 }, CFG);
  ok(res.situacao === 'corrigir', 'confirma o limite real: 8 x 4 m com +2,5 cm num lado não é pego pela conferência (só pela releitura)', res.situacao);
}

console.log('\n# Leitura de trena');
ok(G.lerMedida('13,23', 13.2).valor === 13.23, '"13,23" => 13,23 m');
ok(G.lerMedida('1323', 13.2).valor === 13.23 && G.lerMedida('1323', 13.2).convertido, '"1323" com esperado 13,2 m => entende como cm');
ok(G.lerMedida('716 cm', 7.16).valor === 7.16, '"716 cm" => 7,16 m');
ok(Number.isNaN(G.lerMedida('abc', 7).valor), 'texto inválido => vazio');

console.log('\n# Monte Carlo: 2000 gabaritos com erro até 20 cm e trena com ±3 mm');
let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
let sobraMax = 0, falsoNaoFecha = 0, depoisDentro = 0;
for (let k = 0; k < 2000; k++) {
  const M1 = { x: (rnd() - 0.5) * 0.4, y: h + (rnd() - 0.5) * 0.4 }, M2 = { x: s + (rnd() - 0.5) * 0.4, y: h + (rnd() - 0.5) * 0.4 };
  const res = G.conferir(r, medir(M1, M2, 0.003, rnd), CFG);
  if (res.situacao === 'nao-fecha' || res.situacao === 'referencia') { falsoNaoFecha++; continue; }
  const sobra = aplicarPontos(M1, M2, res); sobraMax = Math.max(sobraMax, sobra);
  if (sobra <= 0.01) depoisDentro++;
}
console.log(`  rodadas sem travar: ${2000 - falsoNaoFecha}/2000 | alarme falso de "não fecha": ${falsoNaoFecha} | após 1 correção ficou dentro de 1 cm: ${depoisDentro} | maior sobra: ${cm(sobraMax)}`);
ok(falsoNaoFecha / 2000 < 0.02, 'alarme falso de "não fecha" abaixo de 2% com trena ±3 mm');
ok(depoisDentro / (2000 - falsoNaoFecha) > 0.97, 'mais de 97% fica dentro de 1 cm já na primeira correção');

console.log(`\n${total - falhas}/${total} testes passaram`);
process.exit(falhas ? 1 : 0);
