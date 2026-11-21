# Testes de fluxo da tela (Playwright + Chrome). Rodar com o site servido em http://localhost:8765/
#   python3 -m http.server 8765  (na pasta do esquadro)  e depois  python3 testes/fluxo_tela.py
import math, asyncio, sys
from playwright.async_api import async_playwright
s, h = 11.12, 7.16
d = lambda p, q: math.hypot(p[0]-q[0], p[1]-q[1])
def med(M1, M2):
    R1, R2 = (0, 0), (s, 0)
    return {'ref': s, 'lado1': d(R1, M1), 'lado2': d(R2, M2), 'diag1': d(R1, M2), 'diag2': d(R2, M1), 'oposto': d(M1, M2)}
ORDEM = ['ref', 'lado1', 'lado2', 'diag1', 'diag2', 'oposto']
falhas = 0
def ok(c, nome, extra=''):
    global falhas
    print(('  ✓ ' if c else '  ✗ ') + nome + ('' if c else ' ' + extra))
    falhas += 0 if c else 1
async def digitar(pg, v):
    await pg.fill('#valor', f'{v:.4f}'.replace('.', ','))
    if await pg.locator('#pontas-ok').count(): await pg.check('#pontas-ok')
    await pg.click('#f-trena button[type=submit]'); await pg.wait_for_timeout(80)
async def chave_atual(pg):
    t = await pg.inner_text('.pontas'); return t.replace('\n', ' ')
async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        await pg.goto('http://localhost:8765/'); await pg.wait_for_timeout(300)
        await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)

        print('# IA-05 item 4: releitura de um canto vira "dentro" — tem que reler o outro canto antes de aprovar')
        verdade = med((0, h), (s, h + 0.013))          # 2-B certo, 9-B realmente 1,3 cm fora
        lido = dict(verdade); lido['lado1'] += 0.02     # 1ª leitura errada no lado do 2 (parece que 2-B saiu)
        lido['lado2'] -= 0.013                          # 1ª leitura errada no lado do 9 (esconde o erro do 9-B)
        await pg.click('#comecar'); await pg.wait_for_timeout(100)
        for k in ORDEM: await digitar(pg, lido[k])
        await pg.click('#conferir'); await pg.wait_for_timeout(100)
        mapa = {'2-F → 2-B': 'lado1', '9-F → 2-B': 'diag2', '9-F → 9-B': 'lado2', '2-F → 9-B': 'diag1'}
        visitadas = []
        for _ in range(12):  # responde releituras/terceiras com o valor verdadeiro
            if not await pg.locator('#valor').count(): break
            k = mapa[await chave_atual(pg)]; visitadas.append(k)
            await digitar(pg, verdade[k])
        await pg.wait_for_timeout(200)
        texto = await pg.inner_text('#tela')
        ok('lado2' in visitadas, 'pediu a releitura do lado do 9 mesmo depois de o 2-B "fechar"', str(visitadas))
        ok('Remarque o 9-B' in texto or '9-B' in texto and 'Remarque' in texto, 'achou o 9-B fora (1,3 cm) em vez de aprovar', texto[:160])
        ok('dentro da tolerância' not in texto, 'não aprovou com trena não relida')

        print('# IA-05 item 7: canto piorou — o resumo copiado manda PARAR, sem ordem de remarcar')
        await pg.goto('http://localhost:8765/'); await pg.wait_for_timeout(200)
        await pg.click('#comecar')
        r1 = med((0.10, h), (s + 0.01, h))
        for k in ORDEM: await digitar(pg, r1[k])
        await pg.click('#conferir')
        for _ in range(8):
            if not await pg.locator('#valor').count(): break
            k = mapa[await chave_atual(pg)]; await digitar(pg, r1[k])
        await pg.wait_for_timeout(150)
        await pg.click('[data-acao=remedir]'); await pg.wait_for_timeout(100)
        r2 = med((0.08, h), (s + 0.04, h))  # 9-B piorou 3 cm
        for k in ORDEM: await digitar(pg, r2[k])
        await pg.click('#conferir')
        for _ in range(8):
            if not await pg.locator('#valor').count(): break
            k = mapa[await chave_atual(pg)]; await digitar(pg, r2[k])
        await pg.wait_for_timeout(200)
        tela = await pg.inner_text('#tela')
        reg = await pg.evaluate("JSON.parse(localStorage.getItem('edr-esquadro-registro-v1'))[0].texto")
        ok('9-B piorou' in tela, 'tela de parada diz que o 9-B piorou', tela[:120])
        ok('PARAR' in reg and 'Remarque' not in reg and 'remarcar' not in reg.split('PARAR')[0], 'resumo exportado manda parar e não traz ordem de remarcar', reg)
        print('# IA-06 item 4: editar uma leitura já relida invalida a releitura antiga')
        await pg.goto('http://localhost:8765/'); await pg.wait_for_timeout(200)
        await pg.click('#comecar')
        v = med((0, h), (s, h))                  # casa certa (sugestão do Cerberus, IA-07)
        l = dict(v); l['lado1'] = 7.180          # 1ª leitura errada no lado do 2
        for k in ORDEM: await digitar(pg, l[k])
        await pg.click('#conferir')
        # releitura (diverge) + terceira do lado1 com 7,160; segue até o app pedir o OUTRO canto,
        # o que só acontece se lado1 já estiver confirmado em 7,160
        seq = []
        for _ in range(6):
            k = mapa[await chave_atual(pg)]
            if k in ('lado2', 'diag1'): break
            seq.append(k); await digitar(pg, 7.160 if k == 'lado1' else v[k])
        ok(seq.count('lado1') == 2 and mapa[await chave_atual(pg)] in ('lado2', 'diag1'), 'lado1 confirmado em 7,160 (releitura + terceira) antes de pedir o outro canto', str(seq))
        # agora está pedindo o outro canto: volta para a revisão e edita lado1 para 7,180 de novo
        while await pg.locator('#valor').count():
            await pg.click('#voltar'); await pg.wait_for_timeout(80)
            if await pg.locator('#conferir').count(): break
        await pg.click('[data-editar="1"]'); await digitar(pg, 7.180)
        await pg.click('#conferir'); await pg.wait_for_timeout(100)
        pediu = mapa.get(await chave_atual(pg)) if await pg.locator('#valor').count() else None
        ok(pediu == 'lado1', 'depois de editar o lado do 2, pede a releitura dele de novo (não usa a antiga)', str(pediu))
        await b.close()
    print('OK' if not falhas else f'{falhas} falha(s)'); sys.exit(1 if falhas else 0)
asyncio.run(run())
