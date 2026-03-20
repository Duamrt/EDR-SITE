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

CAPTURA DE CONTATO (MUITO IMPORTANTE):
- Após 2-3 trocas, quando o cliente demonstrar interesse real (perguntou sobre valor, renda, financiamento, modelo, terreno), peça o nome e WhatsApp de forma natural
- Exemplo: "Pra eu te ajudar melhor, me diz teu nome e teu WhatsApp? Assim a Elyda já entra em contato direto contigo 😊"
- Seja natural, não pareça formulário. Pergunte como se fosse conversa de WhatsApp
- Se o cliente der o nome, agradeça pelo nome e peça o WhatsApp
- Se o cliente der o WhatsApp, confirme e diga que a Elyda vai entrar em contato
- QUANDO O CLIENTE DER NOME E/OU TELEFONE: inclua a marcação LEAD QUALIFICADO no INÍCIO da sua resposta (o sistema usa isso pra salvar o contato)

QUANDO DIRECIONAR PRO WHATSAPP DA EDR (SÓ NESSES CASOS):
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
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Fale com a Duda`;
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
          <div class="edr-chat-header-name">Duda · EDR Engenharia</div>
          <div class="edr-chat-header-status">Online agora</div>
        </div>
      </div>
      <button class="edr-chat-close" onclick="toggleEdrChat()">&times;</button>
    </div>
    <div class="edr-chat-body" id="edr-chat-body">
      <div class="edr-msg bot">Oi! Sou a Duda da EDR Engenharia! 😊 Em que posso te ajudar?</div>
      <div class="edr-chat-typing" id="edr-chat-typing"><span></span><span></span><span></span></div>
    </div>
    <div style="padding:6px 14px 10px;font-size:10px;color:#7a7060;text-align:center;line-height:1.4;">A Duda vai te ajudar com todas as informações. Quando estiver pronto, a Elyda entra em contato direto com você! 😊</div>
    <div class="edr-chat-footer">
      <textarea class="edr-chat-input" id="edr-chat-input" placeholder="Digite sua dúvida..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();enviarMsgChat()}"></textarea>
      <button class="edr-chat-send" id="edr-chat-send" onclick="enviarMsgChat()">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  // Mensagem inicial no histórico
  _chatMessages.push({ role: 'assistant', content: 'Oi! Sou a Duda da EDR Engenharia! 😊 Em que posso te ajudar?' });
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
    // Detectar LEAD QUALIFICADO e salvar
    if (resposta.includes('LEAD QUALIFICADO')) {
      const respostaLimpa = resposta.replace('LEAD QUALIFICADO', '').trim();
      addMsgChat('bot', respostaLimpa);
      _chatMessages.push({ role: 'assistant', content: respostaLimpa });
      salvarLead();
      if (typeof gtag === 'function') gtag('event', 'lead_qualificado', { event_category: 'conversao' });
    } else {
      addMsgChat('bot', resposta);
      _chatMessages.push({ role: 'assistant', content: resposta });
      // Salvar conversa como lead após 3+ mensagens do usuario (mesmo sem dados de contato)
      const userMsgs = _chatMessages.filter(m => m.role === 'user').length;
      if (userMsgs >= 3 && !window._leadSalvoSessao) {
        window._leadSalvoSessao = true;
        salvarLead();
      }
    }

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
  try {
    const msgs = _chatMessages.filter(m => m.role !== 'system').slice(-EDR_CHAT_CONFIG.maxMessages);
    const r = await fetch(`${_SUPABASE_URL}/rest/v1/rpc/chat_edr`, {
      method: 'POST',
      headers: {
        'apikey': _SUPABASE_ANON,
        'Authorization': `Bearer ${_SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: msgs })
    });
    if (r.ok) {
      const data = await r.json();
      if (data?.response && !data.response.includes('problema')) return data.response;
    }
  } catch(e) { console.log('Chat IA indisponivel:', e.message); }
  return respostaOffline(mensagem);
}

const _SUPABASE_URL = 'https://mepzoxoahpwcvvlymlfh.supabase.co';
const _SUPABASE_ANON = 'sb_publishable_Z9E8KLU8ZIMcWjD-bMG5gg_eM585qWq';

// ── Salvar lead no Supabase ──
async function salvarLead() {
  try {
    // Extrair dados da conversa
    const conversa = _chatMessages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    const conversaCompleta = _chatMessages.map(m => `${m.role === 'user' ? 'Cliente' : 'Duda'}: ${m.content}`).join('\n');

    // Extrair nome — procura a resposta do usuario logo apos a Duda pedir o nome
    let nome = null;
    for (let i = 0; i < _chatMessages.length - 1; i++) {
      const msg = _chatMessages[i];
      if (msg.role === 'assistant' && /(?:teu nome|seu nome|como te chamo|me diz teu nome|qual.*nome)/i.test(msg.content)) {
        const proxima = _chatMessages[i + 1];
        if (proxima && proxima.role === 'user') {
          // Limpar prefixos comuns e pegar o nome
          const respLimpa = proxima.content.replace(/^(e |eh |sou |sou o |sou a |me chamo |meu nome e )/i, '').trim();
          // Validar que parece nome (só letras, 2-40 chars)
          if (/^[A-Za-zÀ-ÿ\s]{2,40}$/.test(respLimpa) && !/\d/.test(respLimpa)) {
            nome = respLimpa;
          }
        }
      }
    }
    // Fallback: regex tradicional
    if (!nome) {
      const nomeMatch = conversa.match(/(?:meu nome e|me chamo|sou o|sou a|nome e)\s+([A-Za-zÀ-ÿ\s]+)/i);
      nome = nomeMatch ? nomeMatch[1].trim() : null;
    }

    // Extrair telefone
    const telMatch = conversa.match(/(?:\(?\d{2}\)?\s*9?\s*\d{4}[\s-]?\d{4})/);
    const telefone = telMatch ? telMatch[0].replace(/\D/g, '') : null;

    // Extrair renda
    const rendaMatch = conversa.match(/(?:ganho|renda|salario|recebo)\s*(?:de\s*)?(?:r\$?\s*)?(\d[\d.,]*)/i)
      || conversa.match(/(\d[\d.,]*)\s*(?:reais|por mes|mensal)/i);
    const renda = rendaMatch ? parseFloat(rendaMatch[1].replace('.','').replace(',','.')) : null;

    // Classificar faixa
    let faixa = null;
    if (renda) {
      if (renda <= 2850) faixa = 'Faixa 1';
      else if (renda <= 4700) faixa = 'Faixa 2';
      else if (renda <= 8600) faixa = 'Faixa 3';
      else if (renda <= 12000) faixa = 'Faixa 4';
      else faixa = 'Acima MCMV';
    }

    // Extrair modelo
    const modeloMatch = conversa.match(/(?:edr\s*\d{2}|modelo\s+\w+|cecilia|afonso|thiago|livia|clara)/i);
    const modelo = modeloMatch ? modeloMatch[0].toUpperCase() : null;

    // Detectar terreno e FGTS
    const temTerreno = /(?:tenho|ja tenho)\s*(?:um\s*)?terreno/i.test(conversa) ? true
      : /(?:nao tenho|sem)\s*terreno/i.test(conversa) ? false : null;
    const temFgts = /(?:tenho|ja tenho)\s*fgts/i.test(conversa) ? true
      : /(?:nao tenho|sem)\s*fgts/i.test(conversa) ? false : null;

    // Salvar no Supabase
    const lead = {
      nome, telefone, renda, faixa,
      modelo_escolhido: modelo,
      tem_terreno: temTerreno,
      tem_fgts: temFgts,
      observacoes: conversaCompleta.substring(0, 2000),
      status: 'novo'
    };

    await fetch(`${_SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': _SUPABASE_ANON,
        'Authorization': `Bearer ${_SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(lead)
    });

    console.log('[Duda] Lead salvo:', { nome, telefone, faixa, modelo });
  } catch(e) {
    console.log('[Duda] Erro ao salvar lead:', e.message);
  }
}

// ── Respostas offline (funciona sem API) ──
let _msgCount = 0;
function respostaOffline(msg) {
  _msgCount++;
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const podeWhatsApp = _msgCount >= 4; // só depois de 3+ trocas

  if (m.match(/^(ola|oi|opa|eai|e ai|hey|boa tarde|bom dia|boa noite|salve)[\s!?.]*$/))
    return 'Olá! 😊 Tudo bem? Me conta, qual sua dúvida?';

  if (m.match(/duvida|saber|informac|pergunt|ajud/))
    return 'Claro, com prazer! 😊 Pode perguntar à vontade. É sobre financiamento, modelos de casa, terreno...?';

  if (m.match(/mcmv|minha casa|financ|faixa|caixa|programa/))
    return 'O MCMV é um programa federal que facilita muito a construção da casa própria! 😊\n\nFunciona assim: a Caixa financia a construção com juros bem baixos (a partir de 4% ao ano) e prazo de até 35 anos. E o melhor — durante a obra você não paga a parcela cheia, só uma taxa pequena.\n\nPosso te explicar as faixas de renda se quiser. Qual a renda aproximada da sua família?';

  if (m.match(/renda|ganho|salario|quanto.*ganho|faixa/)) {
    const nums = m.match(/\d[\d.,]*/);
    if (nums) {
      const renda = parseFloat(nums[0].replace('.','').replace(',','.'));
      if (renda <= 2850) return 'Com essa renda, você se encaixa na Faixa 1 — a melhor do programa! 😊\n\nO banco pode financiar até R$168.000, com juros a partir de 4% ao ano. E ainda pode ter subsídio do governo federal, que reduz o valor.\n\nVocê já tem terreno ou precisaria de um?';
      if (renda <= 4700) return 'Você se encaixa na Faixa 2, que é a mais procurada! 😊\n\nO banco pode financiar até R$194.461, com juros de 7,95% ao ano. O prazo pode ser de até 35 anos.\n\nVocê já tem terreno ou precisaria incluir no financiamento?';
      if (renda <= 8600) return 'Sua renda se encaixa na Faixa 3! O banco pode financiar até R$280.000, com juros entre 7,66% e 8,16% ao ano. 😊\n\nIsso dá pra fazer um projeto bem legal. Você tem ideia do tamanho de casa que gostaria?';
      return 'Com essa renda, você entra na Faixa 4 — financiamento de até R$400.000! Dá pra fazer um projeto mais amplo e confortável. 😊\n\nVocê já tem alguma ideia de terreno ou tamanho de casa?';
    }
    return 'Pra te dizer a faixa certinha, preciso saber a renda aproximada da família (somando todos que vão compor renda). Pode me dizer um valor aproximado? 😊';
  }

  if (m.match(/terreno|lote|nao tenho terreno|sem terreno/))
    return 'Não precisa ter terreno! 😊 O processo que a gente faz inclui a compra do terreno junto com a construção — tudo no mesmo financiamento. A EDR cuida dessa parte toda.\n\nVocê já tem ideia de qual bairro ou região gostaria?';

  if (m.match(/entrada|fgts|quanto preciso/))
    return 'A entrada depende da análise de crédito, mas posso te adiantar: se você tem FGTS, ele abate direto no valor da entrada! 😊\n\nE a gente pode negociar o parcelamento do restante. Muitos dos nossos clientes se surpreendem com o valor — costuma ser menor do que imaginam.\n\nVocê trabalha de carteira assinada?';

  if (m.match(/quanto custa|valor|preco|caro|barato/))
    return 'O valor da parcela depende da sua renda e da faixa do programa. Mas pra te dar uma ideia: muitos dos nossos clientes pagam parcelas menores do que o aluguel que pagavam antes! 😊\n\nA gente faz uma simulação gratuita e sem compromisso. Qual a renda aproximada da sua família?';

  if (m.match(/modelo|projeto|planta|quartos|metros|tamanho/))
    return 'Temos modelos de 60m² a 70m², com 2 ou 3 quartos! 😊\n\n• 2 quartos: a partir de 60m² — ideal pra casais ou famílias pequenas\n• 3 quartos: até 70m² — mais espaço, suíte incluída\n\nTodos com sala, cozinha, área de serviço e garagem. A gente adapta o modelo ao seu orçamento. Quantas pessoas vão morar na casa?';

  if (m.match(/prazo|demora|tempo|quanto tempo|quando fica pronto/))
    return 'O processo todo leva de 6 a 10 meses — 2 a 3 meses de burocracia (projeto + aprovação do banco) e 4 a 7 meses de obra. 😊\n\nE o melhor: pra começar, você precisa de apenas R$5.000, que já fazem parte da sua entrada. O resto se resolve durante o processo.\n\nTem mais alguma dúvida sobre o prazo?';

  if (m.match(/garantia|seguranca|confi|qualidade|medo/))
    return 'Na EDR, a gente se responsabiliza por tudo. No ato da entrega você recebe um manual do usuário e um termo de garantia. Nosso suporte é de até 5 anos em questões estruturais. 😊\n\nE os valores que fechamos não são alterados — zero surpresas. Se quiser, posso marcar uma visita pra você conhecer uma obra de perto. O que acha?';

  if (m.match(/parcela|juros|taxa|pagar|prestacao/))
    return 'As taxas do MCMV são as mais baixas do mercado! Aqui no Nordeste, a Faixa 1 começa em 4% ao ano. 😊\n\nE tem uma coisa que pouca gente sabe: se apertar financeiramente, existe uma cláusula no contrato que permite pausar as parcelas por um período.\n\nQual a renda da sua família? Assim consigo te dar uma estimativa melhor.';

  if (m.match(/aluguel|alugar|alugado/))
    return 'Muitos dos nossos clientes estavam na mesma situação — pagando aluguel sem fim. 😊 O financiamento habitacional tem a taxa de juros mais baixa do mercado. Na prática, muita gente paga parcela menor que o aluguel.\n\nE a diferença é que cada parcela te aproxima de algo que vai ser SEU. Já pensou em quanto paga de aluguel hoje?';

  if (m.match(/whatsapp|contato|falar|ligar|telefone|atendimento/))
    return 'Claro! 😊 Pode falar direto com a Elyda, nossa engenheira responsável, pelo WhatsApp: (87) 9 8171-3987\n\nEla vai te atender pessoalmente! 🙏🏼';

  if (m.match(/visitar|visita|conhecer|obra|ver/))
    return 'Ótima ideia! A gente marca um dia e te mostra de perto o nosso padrão. 😊 Temos obras em fases diferentes — dá pra ver desde a fundação até casas prontas.\n\nQual dia seria melhor pra você?';

  if (m.match(/quem|voces|empresa|sobre|edr/))
    return 'A EDR é uma construtora aqui de Jupi-PE, com mais de 5 anos de atuação. Já entregamos 116 projetos e 25 casas concluídas! 😊\n\nSomos a Elyda (engenheira responsável) e o Duam (gestão). A gente cuida de tudo — do projeto à entrega das chaves. Nosso diferencial é o acompanhamento de perto em cada etapa.\n\nTem alguma dúvida específica sobre nosso trabalho?';

  if (m.match(/carteira|clt|autonomo|informal|renda informal/))
    return 'Boa pergunta! Pra carteira assinada fica mais fácil — a renda já é comprovada e o FGTS pode ser usado. 😊\n\nPra autônomos também é possível, mas a comprovação de renda é diferente (extrato bancário, declaração de IR). A gente te orienta em tudo isso.\n\nQual sua situação?';

  if (m.match(/documento|documentacao|preciso levar|o que preciso/))
    return 'Os documentos básicos são: RG, CPF, comprovante de renda (últimos 3 meses), comprovante de residência e certidão de estado civil. 😊\n\nSe for usar FGTS, precisa do extrato também. Mas não se preocupa — a gente te orienta passo a passo em tudo!\n\nTem mais alguma dúvida?';

  if (m.match(/obrigad|valeu|brigad|agradec/))
    return podeWhatsApp
      ? 'Imagina! 😊 Se quiser dar o próximo passo, a Elyda pode fazer uma simulação completa e sem compromisso pelo WhatsApp: (87) 9 8171-3987 🙏🏼\n\nFoi um prazer conversar com você!'
      : 'Imagina, foi um prazer! 😊 Se surgir mais alguma dúvida, pode perguntar à vontade! 🙏🏼';

  if (m.match(/sim|quero|vamos|bora|pode|fechado|interessado|interesse/))
    return podeWhatsApp
      ? 'Que bom! 😊 Pra gente avançar, a Elyda pode fazer uma simulação personalizada pra você. É só chamar no WhatsApp: (87) 9 8171-3987\n\nEla te atende pessoalmente!'
      : 'Ótimo! 😊 Me conta mais sobre sua situação — já tem terreno? Qual a renda aproximada da família? Assim consigo te ajudar melhor!';

  // Resposta genérica — SEM WhatsApp nas primeiras trocas
  return podeWhatsApp
    ? 'Boa pergunta! 😊 Pra te dar uma resposta mais completa, a Elyda pode te ajudar pessoalmente pelo WhatsApp: (87) 9 8171-3987\n\nEla é especialista nisso! 🙏🏼'
    : 'Boa pergunta! 😊 Pode me contar um pouco mais sobre o que precisa? Assim consigo te ajudar melhor!';
}

// ── Inicializar quando o DOM carregar ──
document.addEventListener('DOMContentLoaded', initEdrChat);
