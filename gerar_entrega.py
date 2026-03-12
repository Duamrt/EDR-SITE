#!/usr/bin/env python3
"""
EDR Engenharia — Gerador de Página de Entrega Digital
Gera páginas personalizadas em entrega/{slug}.html a partir de template.

Uso:
  python gerar_entrega.py gilmara "Gilmara" 9
  python gerar_entrega.py carlos-e-amanda "Carlos e Amanda" 12
  python gerar_entrega.py jonas "Jonas" 8 --sem-termo

Argumentos:
  slug        Slug da URL (ex: gilmara)
  nome        Nome do cliente (ex: Gilmara)
  pranchas    Número de pranchas do book
  --sem-termo Não mostra card do termo (opcional)
"""
import sys, os, re

# Caminho base
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENTREGA_DIR = os.path.join(SCRIPT_DIR, 'entrega')
EBOOKS_DIR = os.path.join(SCRIPT_DIR, 'ebooks')
EBOOKS_DIR_FALLBACK = os.path.normpath(os.path.join(SCRIPT_DIR, '..', 'EDR-ACERVO', 'ebooks'))

# URL base dos ebooks (GitHub Pages)
EBOOK_BASE_URL = 'https://duamrt.github.io/edr-ebooks'

# Logo SVG inline (EDR branco) — extraído do template
LOGO_SVG = '''<svg viewBox="0 0 12500 12500" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(17.2764,0,0,17.2764,-17.0066,-10.9962)"><g><path d="M265.547,223.821C163.627,223.821 163.642,223.819 163.546,223.84C161.626,224.261 161.66,224.664 161.642,226.641C161.408,252.651 161.618,336.502 161.642,346.056C161.652,350.39 163.509,349.419 167.84,349.419C351.09,349.419 351.088,349.424 351.324,349.381C353.361,349.005 353.035,348.124 353.035,334.116C353.035,211.907 353.012,211.892 353.229,211.316C353.727,209.993 354.212,210.205 368.683,210.205C448.09,210.205 448.092,210.169 453.357,210.495C464.991,211.216 467.108,210.898 473.898,212.864C474.234,212.962 492.592,216.398 509.427,233.531C524.399,248.768 527.637,263.351 529.42,268.956C530.989,273.89 532.859,293.349 529.02,305.783C527.503,310.696 527.827,310.79 525.827,315.544C524.445,318.831 521.607,326.603 511.524,338.021C509.77,340.007 502.857,345.976 501.856,346.655C494.169,351.87 489.741,354.815 472.8,359.815C468.43,361.105 466.313,360.879 465.868,362.115C465.447,363.286 466.714,365.152 467.068,365.812C467.227,366.106 488.138,406.141 490.919,411.416C492.423,414.269 504.615,437.396 509.567,447.153C510.677,449.34 510.852,449.221 511.831,451.44C512.354,452.624 527.853,481.864 530.897,488.053C531.205,488.68 533.212,492.76 535.044,495.738C537.927,500.423 533.576,499.485 530.444,499.482C526.01,499.478 523.771,499.842 522.719,498.132C521.766,496.58 519.354,491.596 518.166,489.552C517.771,488.873 513.791,481.133 512.549,478.769C502.631,459.899 483.525,423.074 472.702,402.623C467.586,392.956 467.794,392.877 462.661,383.235C452.148,363.491 452.366,363.101 451.054,362.679C450.19,362.401 450.169,362.444 370.855,362.443C367.705,362.443 366.633,362.271 366.613,365.6C366.548,376.124 366.754,497.065 366.496,498.043C366.148,499.366 364.589,499.467 364.385,499.48C362.111,499.627 356.338,499.5 355.639,499.485C352.359,499.413 353.039,498.076 353.035,494.791C353.031,491.626 353.046,364.664 353.027,364.546C352.588,361.832 350.094,362.441 348.056,362.441C159.713,362.409 159.693,362.549 158.08,362.263C156.571,361.995 152.393,361.539 149.753,356.714C148.497,354.418 148.658,354.274 148.658,324.345C148.658,84.392 148.641,84.41 148.794,83.408C149.445,79.137 153.384,75.059 156.893,74.317C159.408,73.785 159.425,73.845 228.636,73.845C295.709,73.845 295.714,73.839 295.884,73.895C297.644,74.475 297.529,75.202 297.472,83.341C297.452,86.239 296.677,86.315 293.773,86.316C232.571,86.329 163.892,86.276 163.455,86.357C161.303,86.76 161.642,87.658 161.642,101.788C161.642,209.078 161.637,209.08 161.677,209.215C162.228,211.103 162.621,211.016 164.59,211.03C178.518,211.129 268.8,210.805 269.987,211.222C271.501,211.754 271.181,214.427 271.178,219.038C271.178,219.369 271.176,222.581 270.707,223.152C269.966,224.054 266.667,223.818 265.547,223.821ZM519.102,287.442C518.817,283.253 518.638,260.148 500.893,242.07C481.704,222.521 460.209,223.473 453.364,223.473C367.326,223.473 367.29,223.443 366.7,223.743C365.491,224.356 365.744,226.369 365.744,233.151C365.744,348.06 365.741,348.061 365.774,348.18C366.155,349.586 366.212,349.757 367.642,349.983C369.352,350.253 453.498,350.022 460.963,350.001C462.31,349.997 469.156,349.979 477.408,346.429C488.368,341.715 493.664,337.219 497.016,334.394C498.63,333.034 507.352,325.685 513.185,313.548C519.232,300.967 519.094,287.577 519.102,287.442Z" style="fill:white;"/><path d="M318.744,72.968C321.166,73.052 321.166,73.044 427.308,73.044C557.274,73.044 557.31,73.002 558.722,73.383C568.326,75.976 569.278,83.629 569.647,86.576C569.806,87.838 569.789,87.846 569.789,505.647C569.789,508.099 571.501,523.031 559.794,524.411C558.151,524.604 159.871,524.517 159.125,524.456C151.655,523.849 149.175,516.992 148.828,515.314C148.667,514.537 148.685,514.536 148.685,425.31C148.685,402.139 148.595,401.977 149.259,401.304C149.828,400.727 150.001,400.648 160.237,400.694C160.708,400.696 163.037,400.345 163.358,402.533C163.442,403.104 163.356,506.896 163.405,507.826C163.492,509.521 164.25,510.001 165.654,510.136C166.073,510.176 519.239,510.152 549.986,510.149C551.972,510.149 554.567,510.807 554.937,507.792C554.982,507.429 554.879,126.278 554.87,93.103C554.869,89.529 555.729,88.007 552.15,87.932C552.032,87.93 331.828,87.931 331.776,87.932C329.813,87.954 329.399,87.941 329.044,89.887C329.018,90.033 329.046,221.817 329.029,222.317C328.931,225.102 328.049,224.934 325.257,224.933C314.068,224.931 312.979,225.052 312.308,224.386C311.64,223.723 311.746,220.467 311.757,220.123L311.757,110.473C311.757,74.27 311.689,74.122 312.246,73.577C313.08,72.761 316.2,72.97 318.744,72.968Z" style="fill:rgb(0,71,4);"/></g></g></svg>'''


def gerar_entrega(slug, nome, num_pranchas, com_termo=True):
    """Gera a página de entrega digital para um cliente."""

    # Tentar encontrar o ebook correspondente
    nome_upper = nome.upper().replace(' ', '_')
    ebook_candidates = [
        f'EDR_Book_{nome_upper}.html',
        f'EDR_Book_{nome_upper}_-_PROJETO.html',
        f'EDR_Book_EDR_-_EXECUTIVO_-_{nome_upper}.html',
        f'EDR_Book_EDR_EXECUTIVO_{nome_upper}.html',
        f'EDR_Book_{nome_upper}_EXECUTIVO.html',
    ]

    # Buscar em ambos os diretórios (local e fallback)
    ebook_file = None
    for ebooks_dir in [EBOOKS_DIR, EBOOKS_DIR_FALLBACK]:
        if not os.path.exists(ebooks_dir):
            continue
        for candidate in ebook_candidates:
            if os.path.exists(os.path.join(ebooks_dir, candidate)):
                ebook_file = candidate
                break
        if not ebook_file:
            # Busca parcial pelo nome
            for f in os.listdir(ebooks_dir):
                if nome_upper.split('_')[0] in f.upper() and f.endswith('.html'):
                    ebook_file = f
                    break
        if ebook_file:
            break

    if not ebook_file:
        print(f'  AVISO: Nenhum ebook encontrado para "{nome}". Usando placeholder.')
        ebook_href = '#'
        ebook_onclick = f' onclick="alert(\'Book de {nome} ainda nao disponivel\');return false"'
    else:
        ebook_href = f'{EBOOK_BASE_URL}/{ebook_file}'
        ebook_onclick = ''
        print(f'  Book: {ebook_file}')

    # Card do termo
    termo_card = ''
    if com_termo:
        termo_card = f'''        <a class="doc-card" href="#" onclick="alert('O Termo de Garantia sera entregue em maos junto com a chave.');return false">
            <div class="doc-icon termo">&#9875;</div>
            <h3>Termo de Garantia</h3>
            <p>Documento com as garantias da sua obra conforme normas tecnicas</p>
            <span class="doc-badge pdf">PDF</span>
        </a>'''

    # Tratamento do nome para exibição
    primeiro_nome = nome.split()[0] if nome else slug.capitalize()

    html = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EDR Engenharia — Entrega Digital | {nome}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Barlow:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{{--verde:#0a3d18;--verde2:#062a10;--dourado:#c9a84c;--preto:#0a0a0a;--cinza:#f7f6f2;--borda:#e8e5dc}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{font-family:'Barlow',sans-serif;background:var(--cinza);color:var(--preto);overflow-x:hidden}}
.hero{{
    min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:linear-gradient(160deg,var(--verde) 0%,var(--verde2) 40%,#031a08 100%);
    text-align:center;color:white;padding:48px 24px;position:relative;
}}
.hero::before{{
    content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse at 25% 15%,rgba(201,168,76,.1) 0%,transparent 60%),
               radial-gradient(ellipse at 75% 85%,rgba(201,168,76,.06) 0%,transparent 50%);
}}
.hero>*{{position:relative;z-index:1}}
.hero svg{{width:100px;height:100px;margin-bottom:20px;opacity:.9;filter:drop-shadow(0 4px 24px rgba(0,0,0,.3))}}
.hero-pre{{font-size:.85rem;text-transform:uppercase;letter-spacing:3px;color:var(--dourado);opacity:.7;margin-bottom:8px}}
.hero h1{{
    font-family:'Cormorant Garamond',serif;font-weight:700;font-size:3.2rem;
    color:white;letter-spacing:1px;line-height:1.15;margin-bottom:6px;
}}
.hero h1 span{{color:var(--dourado)}}
.hero-sub{{
    font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.2rem;
    color:rgba(255,255,255,.6);margin-bottom:32px;
}}
.hero-line{{width:50px;height:2px;background:var(--dourado);margin:0 auto 32px;opacity:.5}}
.hero-msg{{
    max-width:520px;font-size:1rem;line-height:1.8;color:rgba(255,255,255,.75);
    margin-bottom:36px;
}}
.hero-msg strong{{color:var(--dourado);font-weight:600}}
.hero-scroll{{
    position:absolute;bottom:28px;left:50%;transform:translateX(-50%);
    color:var(--dourado);font-size:.75rem;letter-spacing:1px;opacity:.5;
    animation:float 2s ease-in-out infinite;
}}
@keyframes float{{0%,100%{{transform:translateX(-50%) translateY(0)}}50%{{transform:translateX(-50%) translateY(-6px)}}}}
.section{{padding:64px 24px;max-width:800px;margin:0 auto}}
.section-label{{
    font-size:.7rem;text-transform:uppercase;letter-spacing:3px;color:var(--dourado);
    font-weight:600;margin-bottom:6px;
}}
.section-title{{
    font-family:'Cormorant Garamond',serif;font-size:2rem;color:var(--verde);
    margin-bottom:24px;line-height:1.2;
}}
.section-title::after{{content:'';display:block;width:36px;height:2px;background:var(--dourado);margin-top:12px}}
.docs{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}}
.doc-card{{
    background:white;border-radius:14px;padding:28px 24px;text-align:center;
    border:1px solid var(--borda);transition:all .3s ease;cursor:pointer;
    text-decoration:none;color:var(--preto);display:flex;flex-direction:column;align-items:center;gap:12px;
}}
.doc-card:hover{{border-color:var(--dourado);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.08)}}
.doc-icon{{
    width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:1.5rem;
}}
.doc-icon.book{{background:rgba(10,61,24,.08);color:var(--verde)}}
.doc-icon.termo{{background:rgba(201,168,76,.12);color:var(--dourado)}}
.doc-card h3{{font-size:1rem;font-weight:600}}
.doc-card p{{font-size:.8rem;color:#888;line-height:1.5}}
.doc-badge{{
    font-size:.65rem;text-transform:uppercase;letter-spacing:1px;font-weight:600;
    padding:4px 12px;border-radius:12px;
}}
.doc-badge.pdf{{background:rgba(10,61,24,.08);color:var(--verde)}}
.doc-badge.html{{background:rgba(201,168,76,.1);color:var(--dourado)}}
.msg-box{{
    background:white;border-radius:14px;padding:32px;border:1px solid var(--borda);
    position:relative;margin-bottom:40px;
}}
.msg-box::before{{
    content:'\\201C';font-family:'Cormorant Garamond',serif;font-size:4rem;
    color:var(--dourado);opacity:.3;position:absolute;top:8px;left:20px;line-height:1;
}}
.msg-text{{
    font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-style:italic;
    line-height:1.8;color:#444;padding-left:16px;
}}
.msg-author{{
    display:flex;align-items:center;gap:12px;margin-top:20px;padding-left:16px;
}}
.msg-author-dot{{width:36px;height:36px;border-radius:50%;background:var(--verde);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:.85rem}}
.msg-author-info{{font-size:.85rem;color:#666}}
.msg-author-info strong{{color:var(--verde);display:block}}
.review{{text-align:center;padding:48px 24px}}
.review-title{{
    font-family:'Cormorant Garamond',serif;font-size:1.6rem;color:var(--verde);margin-bottom:8px;
}}
.review-sub{{font-size:.9rem;color:#888;margin-bottom:24px}}
.review-stars{{font-size:2rem;margin-bottom:24px;letter-spacing:4px}}
.review-btns{{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}}
.review-btn{{
    display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:10px;
    font-size:.9rem;font-weight:600;text-decoration:none;transition:all .2s;
    font-family:'Barlow',sans-serif;border:none;cursor:pointer;
}}
.review-btn.google{{background:#4285f4;color:white}}
.review-btn.google:hover{{background:#3275e4;transform:translateY(-2px)}}
.review-btn.insta{{background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:white}}
.review-btn.insta:hover{{transform:translateY(-2px);box-shadow:0 4px 16px rgba(220,39,67,.3)}}
.review-btn.whats{{background:#25d366;color:white}}
.review-btn.whats:hover{{background:#20c05c;transform:translateY(-2px)}}
.foot{{
    background:var(--verde);text-align:center;padding:36px 24px;
    color:rgba(255,255,255,.5);font-size:.78rem;line-height:2;
}}
.foot strong{{color:var(--dourado)}}
.foot-line{{width:36px;height:1px;background:var(--dourado);margin:12px auto;opacity:.3}}
.foot svg{{width:48px;height:48px;margin-bottom:12px;opacity:.6}}
.fade-in{{opacity:0;transform:translateY(20px);transition:all .6s ease}}
.fade-in.visible{{opacity:1;transform:translateY(0)}}
@media(max-width:600px){{
    .hero h1{{font-size:2.2rem}}
    .hero svg{{width:72px;height:72px}}
    .docs{{grid-template-columns:1fr}}
    .section{{padding:48px 20px}}
    .section-title{{font-size:1.6rem}}
    .review-btns{{flex-direction:column;align-items:center}}
}}
</style>
</head>
<body>

<div class="hero">
    {LOGO_SVG}
    <div class="hero-pre">Entrega Digital</div>
    <h1>Projeto <span>{nome}</span></h1>
    <div class="hero-sub">Seu projeto, sua historia</div>
    <div class="hero-line"></div>
    <div class="hero-msg">
        Prezado(a) <strong>{primeiro_nome}</strong>, e com grande satisfacao que a <strong>EDR Engenharia</strong>
        entrega o projeto executivo completo da sua residencia. Cada prancha foi pensada
        com cuidado para que sua casa saia exatamente como voce sonhou.
    </div>
    <div class="hero-scroll">Deslize para ver seus documentos</div>
</div>

<div class="section fade-in">
    <div class="section-label">Seus documentos</div>
    <div class="section-title">Kit de Entrega</div>
    <div class="docs">
        <a class="doc-card" href="{ebook_href}" target="_blank"{ebook_onclick}>
            <div class="doc-icon book">&#9638;</div>
            <h3>Projeto Executivo Digital</h3>
            <p>Book interativo com todas as pranchas do seu projeto em alta resolucao</p>
            <span class="doc-badge html">{num_pranchas} pranchas</span>
        </a>
{termo_card}
    </div>
</div>

<div class="section fade-in">
    <div class="section-label">Uma mensagem para voce</div>
    <div class="section-title">Da nossa equipe</div>
    <div class="msg-box">
        <div class="msg-text">
            Foi uma honra fazer parte dessa conquista. Construir uma casa e muito mais
            do que levantar paredes — e realizar um sonho. Obrigada por confiar na
            EDR Engenharia para transformar esse sonho em realidade. Estamos a disposicao
            para o que precisar, hoje e sempre.
        </div>
        <div class="msg-author">
            <div class="msg-author-dot">E</div>
            <div class="msg-author-info">
                <strong>Eng. Elyda Rodrigues</strong>
                CREA-PE 66902 &middot; EDR Engenharia
            </div>
        </div>
    </div>
</div>

<div class="review fade-in">
    <div class="review-title">Sua opiniao e muito importante</div>
    <div class="review-sub">Nos ajude a continuar realizando sonhos</div>
    <div class="review-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
    <div class="review-btns">
        <a class="review-btn google" href="https://g.page/r/edrengenharia/review" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Avaliar no Google
        </a>
        <a class="review-btn insta" href="https://instagram.com/elydaedr" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            Seguir no Instagram
        </a>
        <a class="review-btn whats" href="https://wa.me/5587981713987?text=Ola%20EDR!%20Gostaria%20de%20agradecer%20pelo%20projeto!" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            Enviar mensagem
        </a>
    </div>
</div>

<div class="foot">
    {LOGO_SVG.replace('width:100px;height:100px', 'width:48px;height:48px')}
    <div class="foot-line"></div>
    <strong>EDR Engenharia</strong><br>
    Rua Gerson Ferreira de Almeida, N&deg;89, Centro, Jupi-PE<br>
    (87) 9 8171-3987 &middot; CREA-PE 66902
</div>

<script>
const obs = new IntersectionObserver(entries => {{
    entries.forEach(e => {{ if (e.isIntersecting) {{ e.target.classList.add('visible'); obs.unobserve(e.target); }}}});
}}, {{ threshold: 0.15 }});
document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
</script>
</body>
</html>'''

    # Garantir diretório
    os.makedirs(ENTREGA_DIR, exist_ok=True)

    output_path = os.path.join(ENTREGA_DIR, f'{slug}.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'  Gerado: entrega/{slug}.html')
    return output_path


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        print('\nEbooks disponiveis:')
        if os.path.exists(EBOOKS_DIR):
            for f in sorted(os.listdir(EBOOKS_DIR)):
                if f.endswith('.html'):
                    # Extrair nome do arquivo
                    nome = f.replace('EDR_Book_', '').replace('.html', '').replace('_', ' ')
                    slug_sugerido = nome.lower().split(' - ')[0].split(' executivo')[0].strip().replace(' ', '-')
                    print(f'  {f}  ->  slug: {slug_sugerido}')
        sys.exit(1)

    slug = sys.argv[1]
    nome = sys.argv[2]
    num_pranchas = sys.argv[3]
    com_termo = '--sem-termo' not in sys.argv

    print(f'\nGerando entrega digital para: {nome} (slug: {slug})')
    gerar_entrega(slug, nome, num_pranchas, com_termo)
    print('Pronto!\n')


if __name__ == '__main__':
    main()
