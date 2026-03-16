// ══════════════════════════════════════════
// EDR CHAT — Assistente IA do site
// ══════════════════════════════════════════

const EDR_CHAT_CONFIG = {
  // Supabase Edge Function URL (será configurada depois)
  apiUrl: null,
  maxMessages: 20,
};

const EDR_SYSTEM_PROMPT = `Você é a assistente virtual da EDR Engenharia, uma construtora de Jupi-PE. Seu nome é EDR Assistente. Você conversa como a Elyda (engenheira responsável) — acolhedora, profissional e direta.

PERSONALIDADE:
- Fale como se fosse uma conversa natural de WhatsApp — tom leve, acolhedor
- Use 😊🙏🏼 com moderação (não em toda mensagem)
- Seja profissional mas nunca robótica
- Adapte a formalidade: comece mais formal, se o cliente for informal, acompanhe
- NUNCA diga que é uma IA ou robô. Se perguntarem, diga "Sou da equipe EDR, posso te ajudar com informações sobre nossos projetos e o programa MCMV"
- Seja CONVERSACIONAL — faça perguntas de volta, mostre interesse genuíno
- Responda a dúvida COMPLETAMENTE antes de sugerir qualquer coisa
- NÃO seja apressada — o cliente precisa se sentir acolhido, não empurrado

REGRA ABSOLUTA — NUNCA FALE:
- O valor total de avaliação do imóvel. Sempre fale de PARCELA e ENTRADA
- Se o cliente perguntar "quanto custa a casa?", responda sobre parcela e entrada, não o montante total
- Motivo: o valor total assusta o cliente. Parcela + entrada é muito mais acessível na cabeça dele

FLUXO DE ATENDIMENTO — IMPORTANTE:
1. PRIMEIRO acolha e entenda a dúvida. Pergunte mais se precisar. NÃO mande pro WhatsApp logo de cara.
2. Responda a dúvida com clareza e detalhe. Tire TODAS as dúvidas do cliente aqui no chat.
3. Faça perguntas pra entender a situação: "Você já tem terreno?", "Qual sua renda aproximada?", "Mora de aluguel?"
4. Só sugira o WhatsApp quando:
   - O cliente PEDIR pra falar com alguém
   - O cliente quiser AGENDAR visita
   - O cliente quiser fazer a ANÁLISE DE CRÉDITO (precisa de documentos)
   - Você já respondeu 3+ mensagens e o cliente está claramente interessado
5. NUNCA mande o WhatsApp na primeira ou segunda resposta (exceto se o cliente pedir)
6. O objetivo é que o cliente saia do chat JÁ SABENDO quase tudo — quando ligar pra Elyda, é só pra fechar

SOBRE A EDR ENGENHARIA:
- Construtora em Jupi-PE, 5+ anos, 116 projetos entregues, 25 casas concluídas
- Fundadores: Elyda Rodrigues (Engenheira, CREA-PE 66902) e Duam Rodrigues (Gestão)
- Do projeto à entrega das chaves — sem terceirizar o cuidado
- Padrão construtivo: sem madeira na estrutura do telhado (alvenaria), 62 etapas controladas
- Entrega: manual do usuário + termo de garantia + suporte 5 anos estrutural
- Valores fechados não são alterados (sem surpresas), exceto aditivos autorizados pelo cliente

SKILL MCMV — CONSULTOR COMPLETO:

Faixas de renda e financiamento:
- Faixa 1: renda familiar até R$2.850/mês → banco financia até R$168.000 → juros a partir de 4% a.a. → TEM subsídio do governo federal → menor taxa da história do FGTS
- Faixa 2: renda R$2.850 a R$4.700/mês → até R$194.461 → juros 7,95% a.a. → SEM subsídio → MAIS PROCURADA
- Faixa 3: renda R$4.700 a R$8.600/mês → até R$280.000 → juros 7,66-8,16% a.a.
- Faixa 4 (nova): renda R$8.600 a R$12.000/mês → até R$400.000 → juros até 10,5% a.a.
- Todas: prazo até 35 anos, FGTS pode ser usado

Modalidade: AQUISIÇÃO E CONSTRUÇÃO
- Terreno + obra entram num ÚNICO financiamento pela Caixa
- Durante a obra, cliente paga APENAS taxa de evolução de obra + taxa de manutenção (valores bem menores que parcela)
- Parcela completa SÓ começa após entrega das chaves
- Isso é muito importante explicar — o cliente não paga parcela cheia durante a construção

Como funciona na prática (passo a passo):
1. EDR faz análise de crédito gratuita (sem compromisso) → descobre faixa, entrada e parcela estimada
2. Cliente escolhe modelo de projeto compatível com o orçamento
3. EDR elabora projeto nos padrões da Caixa
4. Documentação completa (ART, aprovações) — EDR cuida de tudo
5. Aprovação do financiamento pela Caixa (2-3 meses)
6. Início da obra (4-7 meses dependendo do porte)
7. Vistorias da Caixa durante a obra (medições)
8. Entrega das chaves com manual do usuário + termo de garantia

Para iniciar todo o processo: apenas R$5.000 (já faz parte da entrada)
Os 2-3 meses de burocracia são tempo A FAVOR do cliente — enquanto o banco analisa, ele se organiza financeiramente

FGTS:
- Pode ser usado pra REDUZIR a entrada
- Pode ser usado pra AMORTIZAR parcelas
- Disponível pra quem trabalha de carteira assinada
- Na simulação gratuita a EDR já calcula quanto pode ser utilizado

Subsídio (só Faixa 1):
- É um desconto do governo federal no valor do imóvel
- Reduz a entrada e/ou parcela
- Quanto menor a renda, maior o subsídio
- Pode chegar a valores significativos

Vantagem Nordeste:
- Famílias da região Norte/Nordeste pagam juros MENORES que Sul/Sudeste
- Faixa 1 no Nordeste: a partir de 4% a.a. (Sul/Sudeste mínimo 4,25%)
- Na prática: parcelas mais baixas e menos dinheiro jogado fora

Quando o cliente disser a renda, CLASSIFIQUE na faixa correta e diga:
- "Com sua renda, você se encaixa na Faixa X"
- "O banco pode financiar até R$Y"
- "Pra saber exatamente a entrada e a parcela, a Elyda faz a simulação completa pra você"

SOBRE TERRENO:
- Processo é de "aquisição de terreno e construção" — terreno entra no financiamento
- Cliente NÃO precisa ter terreno próprio
- A EDR cuida de TUDO: encontrar o terreno, documentação, construção
- Tudo dentro do mesmo processo de financiamento, sem dor de cabeça

SOBRE ENTRADA:
- Entrada é obrigatória (Caixa financia até 80%, os outros 20% são a entrada)
- MAS na prática pode ser bem menor do que parece: FGTS abate, subsídio reduz (Faixa 1)
- Pode negociar parcelamento da entrada com a EDR
- "Fechando agora, são ~9 meses até a entrega. Dá pra se organizar bem nesse período"

SOBRE MEDO DE FINANCIAR:
- Taxa de juros habitacional é a MAIS BAIXA do mercado brasileiro
- "Aluguel não tem fim nem dá segurança que a casa própria dá"
- Existe cláusula de PAUSA nas parcelas se apertar financeiramente
- Casa financiada pode ser vendida como qualquer outra
- "Você vai pagar uma coisa que um dia será sua"

DOCUMENTOS necessários (informar se perguntarem):
- RG e CPF
- Comprovante de renda (últimos 3 meses)
- Comprovante de residência
- Certidão de estado civil
- Extrato do FGTS (se for usar)
- Declaração de IR (se declarar)
A EDR orienta em todos os documentos

MODELOS DE PROJETO:
- EDR 65 (Cecília): 64,85m², 2 quartos, 2 banheiros — entregue
- EDR 60 (Afonso): 60,20m², 2 quartos — entregue
- EDR 70 (Thiago): 69,81m², 3 quartos — entregue
- EDR 68 (Lívia): 67,81m², 3 quartos — em execução
- EDR 61 (Clara): 60,97m², 2 quartos — entregue

CONTATO:
- WhatsApp: (87) 9 8171-3987
- Instagram: @elydaedr
- Endereço: Rua Gerson Ferreira de Almeida, 89, Centro, Jupi-PE

QUANDO DIRECIONAR PRO WHATSAPP (SÓ NESSES CASOS):
- Quando o cliente PEDIR explicitamente pra falar com alguém
- Quando quiser AGENDAR visita presencial a uma obra
- Quando quiser fazer a ANÁLISE DE CRÉDITO formal (precisa de documentos pessoais)
- Quando a conversa já tiver 3+ trocas e o cliente demonstrar interesse claro
- Diga de forma natural: "Se quiser, posso te conectar com a Elyda pra ela fazer a simulação completa pra você 😊"
- Link: https://wa.me/5587981713987
- NUNCA force o WhatsApp. O cliente tem que sentir que é escolha dele.

REGRAS DE CONVERSA:
- Respostas curtas — máximo 3 parágrafos. Como conversa de WhatsApp.
- Faça UMA pergunta por vez, não bombardeie
- Se o cliente só disse "oi" ou "tenho uma dúvida", responda com acolhimento e pergunte QUAL a dúvida. Não despeje informação.
- Se não souber algo específico, diga "Essa parte a Elyda pode te explicar melhor" — não invente
- Sempre termine com uma pergunta pra manter a conversa fluindo`;

// ── Estado do chat ──
let _chatMessages = [];
let _chatOpen = false;
let _chatLoading = false;

// ── Injetar HTML + CSS ──
function initEdrChat() {
  // CSS
  const style = document.createElement('style');
  style.textContent = `
    .edr-chat-btn {
      position:fixed; bottom:calc(1.8rem + env(safe-area-inset-bottom,0px)); right:calc(1.8rem + 180px); z-index:249;
      display:flex; align-items:center; gap:0.5rem;
      padding:0.85rem 1.2rem; background:#0a3d18; color:#f5f0e8;
      font-size:0.63rem; font-weight:500; letter-spacing:0.12em;
      text-transform:uppercase; border:none; border-radius:2px; cursor:pointer;
      box-shadow:0 6px 24px rgba(10,61,24,0.3);
      transition:transform 0.3s, box-shadow 0.3s;
      font-family:'DM Sans','Barlow Condensed',sans-serif;
    }
    .edr-chat-btn:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(10,61,24,0.4); }
    .edr-chat-btn svg { width:14px; height:14px; }

    .edr-chat-window {
      position:fixed; bottom:calc(5rem + env(safe-area-inset-bottom,0px)); right:1.8rem; z-index:300;
      width:380px; max-width:calc(100vw - 2rem); height:520px; max-height:calc(100vh - 8rem);
      background:#0c0c0a; border:1px solid rgba(201,168,76,0.15); border-radius:12px;
      display:flex; flex-direction:column; overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,0.5);
      opacity:0; visibility:hidden; transform:translateY(20px) scale(0.95);
      transition:opacity 0.3s, visibility 0.3s, transform 0.3s;
    }
    .edr-chat-window.open { opacity:1; visibility:visible; transform:translateY(0) scale(1); }

    .edr-chat-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:16px 18px; background:#0f1210;
      border-bottom:1px solid rgba(201,168,76,0.1);
    }
    .edr-chat-header-left { display:flex; align-items:center; gap:10px; }
    .edr-chat-avatar {
      width:36px; height:36px; border-radius:8px;
      background:linear-gradient(135deg,#0a3d18,#0f5222);
      display:flex; align-items:center; justify-content:center;
      font-size:11px; font-weight:900; color:#c9a84c; letter-spacing:-0.5px;
    }
    .edr-chat-header-name { font-size:13px; font-weight:700; color:#f5f0e8; }
    .edr-chat-header-status { font-size:10px; color:#5cb870; display:flex; align-items:center; gap:4px; }
    .edr-chat-header-status::before { content:''; width:6px; height:6px; border-radius:50%; background:#5cb870; }
    .edr-chat-close { background:none; border:none; color:#7a7060; font-size:18px; cursor:pointer; padding:4px; }
    .edr-chat-close:hover { color:#f5f0e8; }

    .edr-chat-body {
      flex:1; overflow-y:auto; padding:16px 14px; display:flex; flex-direction:column; gap:10px;
    }
    .edr-chat-body::-webkit-scrollbar { width:3px; }
    .edr-chat-body::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.2); border-radius:3px; }

    .edr-msg {
      max-width:85%; padding:10px 14px; border-radius:12px;
      font-size:13px; line-height:1.5; word-wrap:break-word;
      animation:edrMsgIn 0.3s ease;
    }
    @keyframes edrMsgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .edr-msg.bot {
      align-self:flex-start; background:#141210; color:#f5f0e8;
      border:1px solid rgba(201,168,76,0.08); border-bottom-left-radius:4px;
    }
    .edr-msg.user {
      align-self:flex-end; background:#0a3d18; color:#f5f0e8;
      border-bottom-right-radius:4px;
    }
    .edr-msg a { color:#c9a84c; text-decoration:underline; }
    .edr-msg a:hover { color:#dfc070; }

    .edr-chat-typing {
      align-self:flex-start; padding:10px 14px; background:#141210;
      border:1px solid rgba(201,168,76,0.08); border-radius:12px; border-bottom-left-radius:4px;
      display:none; gap:4px;
    }
    .edr-chat-typing.show { display:flex; }
    .edr-chat-typing span {
      width:6px; height:6px; border-radius:50%; background:#7a7060;
      animation:edrTyping 1.4s ease-in-out infinite;
    }
    .edr-chat-typing span:nth-child(2) { animation-delay:0.2s; }
    .edr-chat-typing span:nth-child(3) { animation-delay:0.4s; }
    @keyframes edrTyping { 0%,60%,100%{opacity:0.3;transform:translateY(0)} 30%{opacity:1;transform:translateY(-4px)} }

    .edr-chat-footer {
      padding:12px 14px; background:#0f1210;
      border-top:1px solid rgba(201,168,76,0.1);
      display:flex; gap:8px;
    }
    .edr-chat-input {
      flex:1; padding:10px 14px; background:#1a1814; border:1px solid rgba(201,168,76,0.12);
      border-radius:8px; color:#f5f0e8; font-size:13px; font-family:inherit;
      outline:none; resize:none; max-height:80px;
    }
    .edr-chat-input::placeholder { color:#7a7060; }
    .edr-chat-input:focus { border-color:rgba(201,168,76,0.3); }
    .edr-chat-send {
      background:#0a3d18; border:none; border-radius:8px; padding:0 14px;
      color:#c9a84c; font-size:16px; cursor:pointer; transition:background 0.2s;
      display:flex; align-items:center;
    }
    .edr-chat-send:hover { background:#0f5222; }
    .edr-chat-send:disabled { opacity:0.4; cursor:not-allowed; }

    .edr-chat-wpp {
      display:flex; align-items:center; justify-content:center; gap:6px;
      padding:8px; margin:0 14px 12px; background:#25D366; color:#fff;
      border-radius:6px; font-size:11px; font-weight:600; text-decoration:none;
      letter-spacing:0.05em; transition:background 0.2s;
    }
    .edr-chat-wpp:hover { background:#1da851; }

    @media (max-width:480px) {
      .edr-chat-window { right:0; bottom:0; width:100%; height:100%; max-height:100vh; border-radius:0; border:none; }
      .edr-chat-btn { right:calc(1.2rem + 160px); bottom:calc(1.2rem + env(safe-area-inset-bottom,0px)); padding:0.7rem 1rem; }
    }
  `;
  document.head.appendChild(style);

  // Botão flutuante
  const btn = document.createElement('button');
  btn.className = 'edr-chat-btn';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Tire suas dúvidas`;
  btn.onclick = toggleEdrChat;
  document.body.appendChild(btn);

  // Janela do chat
  const win = document.createElement('div');
  win.className = 'edr-chat-window';
  win.id = 'edr-chat-window';
  win.innerHTML = `
    <div class="edr-chat-header">
      <div class="edr-chat-header-left">
        <div class="edr-chat-avatar">EDR</div>
        <div>
          <div class="edr-chat-header-name">EDR Engenharia</div>
          <div class="edr-chat-header-status">Online agora</div>
        </div>
      </div>
      <button class="edr-chat-close" onclick="toggleEdrChat()">&times;</button>
    </div>
    <div class="edr-chat-body" id="edr-chat-body">
      <div class="edr-msg bot">Olá! 😊 Seja bem-vindo! Em que posso te ajudar?</div>
      <div class="edr-chat-typing" id="edr-chat-typing"><span></span><span></span><span></span></div>
    </div>
    <a href="https://wa.me/5587981713987?text=Ol%C3%A1!%20Vim%20pelo%20chat%20do%20site%20da%20EDR." class="edr-chat-wpp" target="_blank" rel="noopener">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Falar com a Elyda no WhatsApp
    </a>
    <div class="edr-chat-footer">
      <textarea class="edr-chat-input" id="edr-chat-input" placeholder="Digite sua dúvida..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();enviarMsgChat()}"></textarea>
      <button class="edr-chat-send" id="edr-chat-send" onclick="enviarMsgChat()">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  // Mensagem inicial no histórico
  _chatMessages.push({ role: 'assistant', content: 'Olá! 😊 Seja bem-vindo! Em que posso te ajudar?' });
}

function toggleEdrChat() {
  _chatOpen = !_chatOpen;
  document.getElementById('edr-chat-window').classList.toggle('open', _chatOpen);
  if (_chatOpen) {
    setTimeout(() => document.getElementById('edr-chat-input').focus(), 300);
    // Rastrear abertura no Analytics
    if (typeof gtag === 'function') gtag('event', 'chat_aberto', { event_category: 'engajamento' });
  }
}

function addMsgChat(role, text) {
  const body = document.getElementById('edr-chat-body');
  const typing = document.getElementById('edr-chat-typing');
  const div = document.createElement('div');
  div.className = `edr-msg ${role === 'user' ? 'user' : 'bot'}`;
  // Converter links do WhatsApp em clicáveis
  let html = text.replace(/\n/g, '<br>');
  html = html.replace(/(https?:\/\/wa\.me\/\S+)/g, '<a href="$1" target="_blank" rel="noopener">Clique aqui pra falar no WhatsApp</a>');
  html = html.replace(/\(87\)\s*9\s*8171[\-\s]*3987/g, '<a href="https://wa.me/5587981713987" target="_blank" rel="noopener">(87) 9 8171-3987</a>');
  div.innerHTML = html;
  body.insertBefore(div, typing);
  body.scrollTop = body.scrollHeight;
}

async function enviarMsgChat() {
  const input = document.getElementById('edr-chat-input');
  const msg = input.value.trim();
  if (!msg || _chatLoading) return;

  input.value = '';
  addMsgChat('user', msg);
  _chatMessages.push({ role: 'user', content: msg });

  // Rastrear no Analytics
  if (typeof gtag === 'function') gtag('event', 'chat_mensagem', { event_category: 'engajamento' });

  _chatLoading = true;
  document.getElementById('edr-chat-send').disabled = true;
  document.getElementById('edr-chat-typing').classList.add('show');

  try {
    const resposta = await chamarIA(msg);
    addMsgChat('bot', resposta);
    _chatMessages.push({ role: 'assistant', content: resposta });

    // Se mencionou WhatsApp, rastrear como conversão
    if (resposta.includes('wa.me') || resposta.includes('WhatsApp')) {
      if (typeof gtag === 'function') gtag('event', 'chat_lead_whatsapp', { event_category: 'conversao' });
    }
  } catch(e) {
    addMsgChat('bot', 'Desculpe, tive um problema técnico. Mas posso te atender pelo WhatsApp: (87) 9 8171-3987 😊');
  }

  _chatLoading = false;
  document.getElementById('edr-chat-send').disabled = false;
  document.getElementById('edr-chat-typing').classList.remove('show');
}

async function chamarIA(mensagem) {
  // Tentar API do Claude via Supabase (pega key segura do banco)
  try {
    const keyResp = await fetch(`${_SUPABASE_URL}/rest/v1/rpc/get_chat_key`, {
      method: 'POST',
      headers: { 'apikey': _SUPABASE_ANON, 'Authorization': `Bearer ${_SUPABASE_ANON}`, 'Content-Type': 'application/json' },
      body: '{}'
    });
    const keyData = await keyResp.json();
    if (keyData && keyData.length > 10) {
      const msgs = _chatMessages.filter(m => m.role !== 'system').slice(-EDR_CHAT_CONFIG.maxMessages);
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': keyData,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: EDR_SYSTEM_PROMPT,
          messages: msgs
        })
      });
      if (r.ok) {
        const data = await r.json();
        const txt = data?.content?.[0]?.text;
        if (txt) return txt;
      }
    }
  } catch(e) { console.log('Chat IA indisponível, usando offline'); }
  // Fallback offline
  return respostaOffline(mensagem);
}

const _SUPABASE_URL = 'https://mepzoxoahpwcvvlymlfh.supabase.co';
const _SUPABASE_ANON = 'sb_publishable_Z9E8KLU8ZIMcWjD-bMG5gg_eM585qWq';

// ── Respostas offline (funciona sem API) ──
function respostaOffline(msg) {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (m.match(/ola|oi|bom dia|boa tarde|boa noite|opa/))
    return 'Olá! 😊 Bem-vindo à EDR Engenharia! Como posso te ajudar? Se quiser saber sobre o programa Minha Casa Minha Vida, nossos modelos de casa, ou como funciona o processo de construção, é só perguntar!';

  if (m.match(/mcmv|minha casa|financ|faixa|caixa/))
    return 'O primeiro passo é a gente fazer uma análise de crédito, sem compromisso, pra saber o quanto você consegue financiar. O resultado nos diz quanto fica a entrada e a parcela. 😊\n\nTemos faixas de renda que vão de R$2.850 até R$12.000/mês, com juros a partir de 4% ao ano e prazo de até 35 anos.\n\nQuer que a Elyda faça essa análise pra você? É só chamar no WhatsApp: (87) 9 8171-3987';

  if (m.match(/terreno|lote|nao tenho terreno/))
    return 'Quanto ao terreno, não se preocupe! 😊 O processo que a gente faz é de aquisição de terreno e construção. A compra do terreno é feita junto com o financiamento da construção. A EDR cuida de tudo isso pra você.';

  if (m.match(/entrada|fgts|quanto preciso|quanto custa/))
    return 'A entrada depende da sua análise de crédito. Mas posso te adiantar: o FGTS pode ser usado pra reduzir a entrada, e a gente pode negociar o parcelamento do restante. 😊\n\nFechando agora, são cerca de 9 meses até a entrega das chaves. Dá pra se organizar bem nesse período.\n\nQuer fazer a análise sem compromisso? Fale com a Elyda: (87) 9 8171-3987';

  if (m.match(/modelo|projeto|planta|casa|quartos|metros/))
    return 'Temos modelos a partir de 60m² com 2 quartos até 70m² com 3 quartos! 😊\n\n• EDR 60 (Afonso): 60,20m², 2 quartos\n• EDR 61 (Clara): 60,97m², 2 quartos\n• EDR 65 (Cecília): 64,85m², 2 quartos, 2 banheiros\n• EDR 68 (Lívia): 67,81m², 3 quartos\n• EDR 70 (Thiago): 69,81m², 3 quartos\n\nA gente apresenta as opções compatíveis com o seu orçamento após a análise de crédito. Quer agendar?';

  if (m.match(/prazo|demora|tempo|quanto tempo/))
    return 'A parte burocrática (projeto, aprovação e análise do banco) leva de 2 a 3 meses. A obra em si leva de 4 a 7 meses, dependendo do porte. 😊\n\nE o melhor: pra iniciar todo o processo, você precisa de apenas R$5.000 — que já fazem parte da sua entrada!';

  if (m.match(/garantia|seguranca|confi|qualidade/))
    return 'Na EDR, o que fechamos não é alterado — sem surpresa de valores. 😊 No ato da entrega, você recebe:\n\n• Manual do usuário da sua casa\n• Termo de garantia\n• Suporte de até 5 anos em questões estruturais\n\nJá visitou alguma obra nossa? A gente marca um dia e te mostra de perto o nosso padrão de construção! 🙏🏼';

  if (m.match(/parcela|juros|taxa|pagar/))
    return 'As taxas do MCMV são as mais baixas do mercado! Aqui no Nordeste, a Faixa 1 começa em 4% ao ano. 😊\n\nE caso as coisas apertem, existe uma cláusula no contrato que permite pausar as parcelas por um período. Casa financiada também pode ser vendida como qualquer outra. Sem preocupação!\n\nQuer saber sua parcela? Fale com a Elyda: (87) 9 8171-3987';

  if (m.match(/aluguel|alugar|alugado/))
    return 'O financiamento habitacional é a melhor forma de investimento que você pode fazer hoje! A taxa de juros é baixíssima. 😊\n\nVocê vai pagar uma coisa que um dia será sua. Aluguel não tem fim nem te dá a segurança que a casa própria dá.\n\nVamos conversar sobre como sair do aluguel? (87) 9 8171-3987';

  if (m.match(/whatsapp|contato|falar|ligar|telefone/))
    return 'Claro! Pode falar direto com a Elyda pelo WhatsApp: (87) 9 8171-3987 😊🙏🏼\n\nEla vai te atender pessoalmente e pode fazer sua análise de crédito sem compromisso!';

  if (m.match(/visitar|visita|conhecer|obra/))
    return 'Claro! A gente marca um dia e te mostra de perto o nosso padrão de construção. 😊 Temos obras em fases diferentes, dá pra ver bem o produto.\n\nPra agendar, fale com a Elyda: (87) 9 8171-3987';

  if (m.match(/quem|voces|empresa|sobre|edr/))
    return 'A EDR Engenharia é uma construtora de Jupi-PE com mais de 5 anos no mercado. 😊 Já entregamos 116 projetos e 25 casas concluídas!\n\nSomos a Elyda (Engenheira Responsável, CREA-PE 66902) e o Duam (Gestão). A gente cuida de tudo — do projeto à entrega das chaves, sem terceirizar o cuidado.\n\nNosso diferencial: sem madeira na estrutura do telhado, controle de custos rigoroso, e presença técnica em cada etapa. 🙏🏼';

  // Resposta genérica
  return 'Boa pergunta! 😊 Pra te dar a melhor resposta, sugiro conversar diretamente com a Elyda. Ela pode te explicar tudo em detalhes e fazer uma análise personalizada pra você.\n\nWhatsApp: (87) 9 8171-3987 🙏🏼';
}

// ── Inicializar quando o DOM carregar ──
document.addEventListener('DOMContentLoaded', initEdrChat);
