// ══════════════════════════════════════════
// EDR CHAT — Assistente IA do site
// ══════════════════════════════════════════

const EDR_CHAT_CONFIG = {
  // Supabase Edge Function URL (será configurada depois)
  apiUrl: null,
  maxMessages: 20,
};

const EDR_SYSTEM_PROMPT = `Você é a Duda, assistente virtual da EDR Engenharia, uma construtora de Jupi-PE. Fale de forma acolhedora, profissional e direta, sem fingir ser Elyda ou outra pessoa da equipe.

PERSONALIDADE:
- Fale como se fosse uma conversa natural de WhatsApp — tom leve, acolhedor
- Use 😊🙏🏼 com moderação (não em toda mensagem)
- Seja profissional mas nunca robótica
- Adapte a formalidade: comece mais formal, se o cliente for informal, acompanhe
- Seja transparente: você é a Duda, assistente virtual da EDR. Nunca se apresente como uma pessoa da equipe.
- Seja CONVERSACIONAL — faça perguntas de volta, mostre interesse genuíno
- Responda a dúvida COMPLETAMENTE antes de sugerir qualquer coisa
- NÃO seja apressada — o cliente precisa se sentir acolhido, não empurrado

TRANSPARÊNCIA COM VALORES:
- Nunca invente, esconda ou apresente como certo um valor ainda não confirmado.
- Se perguntarem o custo total, explique que ele depende do terreno, projeto e orçamento e ofereça uma simulação completa.
- Diferencie claramente estimativa, condição oficial do programa e proposta da EDR.

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

Faixas de renda vigentes, consultadas em agosto de 2026:
- Faixa 1: renda familiar até R$3.200/mês → taxas nominais a partir de 4% a.a. → pode haver subsídio, conforme análise
- Faixa 2: renda de R$3.200,01 a R$5.000/mês → taxa e descontos variam conforme renda, região e perfil
- Faixa 3: renda de R$5.000,01 a R$9.600/mês → taxas nominais entre 7,66% e 8,16% a.a.
- Faixa 4 / Classe Média: renda de R$9.600,01 a R$13.000/mês → taxa nominal de 10% a.a. e imóveis de até R$600 mil
- O prazo pode chegar a 35 anos. Uso do FGTS, subsídio, entrada, valor financiado e taxa final dependem das regras e da análise da Caixa.
- NUNCA prometa valor financiado, entrada, parcela, aprovação ou taxa final sem simulação oficial.

Modalidade: AQUISIÇÃO E CONSTRUÇÃO
- Terreno + obra podem entrar em um único financiamento pela Caixa
- Encargos durante a obra, liberações e início da amortização dependem da análise e do contrato
- Explique o fluxo sem prometer valores ou condições universais

Como funciona na prática (passo a passo):
1. EDR faz análise de crédito gratuita (sem compromisso) → descobre faixa, entrada e parcela estimada
2. Cliente escolhe modelo de projeto compatível com o orçamento
3. EDR elabora projeto nos padrões da Caixa
4. Documentação completa (ART, aprovações) — EDR cuida de tudo
5. Aprovação do financiamento pela Caixa, no prazo definido pela análise
6. Início da obra conforme cronograma aprovado
7. Vistorias da Caixa durante a obra (medições)
8. Entrega das chaves com manual do usuário + termo de garantia

Valor inicial e prazo variam conforme projeto, terreno, documentos e análise. Nunca prometa entrada fixa ou cronograma fechado antes da proposta.

FGTS:
- Pode ser usado pra REDUZIR a entrada
- Pode ser usado pra AMORTIZAR parcelas
- Disponível pra quem trabalha de carteira assinada
- Na simulação gratuita a EDR já calcula quanto pode ser utilizado

Benefícios e descontos:
- É um desconto do governo federal no valor do imóvel
- Reduz a entrada e/ou parcela
- Elegibilidade e valor dependem da renda, modalidade, localização e análise

Vantagem Nordeste:
- Famílias da região Norte/Nordeste pagam juros MENORES que Sul/Sudeste
- A menor taxa nominal parte de 4% a.a. em perfis elegíveis
- A taxa final depende de renda, região, vínculo com FGTS e análise da Caixa

Quando o cliente disser a renda, faça apenas uma orientação inicial:
- "Com sua renda, você se encaixa na Faixa X"
- "Pra confirmar entrada, taxa, valor aprovado e parcela, é necessária a simulação e a análise da Caixa"

SOBRE TERRENO:
- Processo é de "aquisição de terreno e construção" — terreno entra no financiamento
- Cliente NÃO precisa ter terreno próprio
- A EDR cuida de TUDO: encontrar o terreno, documentação, construção
- Tudo dentro do mesmo processo de financiamento, sem dor de cabeça

SOBRE ENTRADA:
- O valor depende da renda, do imóvel, do FGTS e da análise de crédito
- FGTS e benefícios do programa podem reduzir a entrada em perfis elegíveis
- Nunca afirme um percentual fixo ou parcelamento sem proposta formal

SOBRE MEDO DE FINANCIAR:
- Explique que o MCMV oferece condições próprias e que a comparação depende do perfil
- "Aluguel não tem fim nem dá segurança que a casa própria dá"
- Regras de pausa, venda ou renegociação devem ser confirmadas no contrato e com a Caixa
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
- EDR 65 (Cecília): 64,85m², 2 quartos, 1 banheiro — entregue
- EDR 60 (Afonso): 60,20m², 2 quartos — entregue
- EDR 70 (Thiago): 69,81m², 2 quartos + escritório/depósito — entregue
- EDR 68 (Lívia): 67,81m², 3 quartos — entregue
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
- QUANDO O CLIENTE DER NOME E/OU TELEFONE: inclua no FINAL da sua resposta uma linha oculta neste formato exato:
  <!--LEAD|nome:Nome do Cliente|tel:87999991234-->
  Use EXATAMENTE esse formato. Preencha só os campos que o cliente informou. Exemplos:
  <!--LEAD|nome:Maria Silva|tel:87988776655-->
  <!--LEAD|nome:João-->
  <!--LEAD|tel:81999998888-->
  Essa linha NÃO aparece pro cliente, é só pro sistema salvar o contato.

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
    .edr-chat-close { width:44px; height:44px; background:none; border:none; color:#c8c0b5; font-size:24px; cursor:pointer; padding:0; }
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
    .edr-chat-input:focus { border-color:#c9a84c; box-shadow:0 0 0 2px rgba(201,168,76,0.25); }
    .edr-chat-send {
      min-width:44px; min-height:44px; background:#0a3d18; border:none; border-radius:8px; padding:0 14px;
      color:#c9a84c; font-size:16px; cursor:pointer; transition:background 0.2s;
      display:flex; align-items:center;
    }
    .edr-chat-send:hover { background:#0f5222; }
    .edr-chat-send:disabled { opacity:0.4; cursor:not-allowed; }

    .edr-chat-wpp {
      display:flex; align-items:center; justify-content:center; gap:6px;
      min-height:44px; padding:8px; margin:0 14px 12px; background:#25D366; color:#062b12;
      border-radius:6px; font-size:11px; font-weight:600; text-decoration:none;
      letter-spacing:0.05em; transition:background 0.2s;
    }
    .edr-chat-wpp:hover { background:#1da851; }
    .edr-chat-privacy {
      padding:6px 14px 10px; color:#c8c0b5; font-size:11px;
      line-height:1.45; text-align:center;
    }

    @media (max-width:480px) {
      .edr-chat-window { right:0; bottom:0; width:100%; height:100%; max-height:100vh; border-radius:0; border:none; }
      .edr-chat-btn {
        right:calc(1rem + 60px); bottom:calc(1rem + env(safe-area-inset-bottom,0px));
        width:52px; height:52px; justify-content:center; padding:0; border-radius:50%;
        font-size:0; letter-spacing:0;
      }
      .edr-chat-btn svg { width:22px; height:22px; }
    }
  `;
  document.head.appendChild(style);

  // Botão flutuante
  const btn = document.createElement('button');
  btn.className = 'edr-chat-btn';
  btn.setAttribute('aria-label', 'Falar com a Duda, assistente virtual');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'edr-chat-window');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Fale com a Duda`;
  btn.onclick = toggleEdrChat;
  document.body.appendChild(btn);

  // Janela do chat
  const win = document.createElement('div');
  win.className = 'edr-chat-window';
  win.id = 'edr-chat-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-modal', 'true');
  win.setAttribute('aria-labelledby', 'edr-chat-title');
  win.setAttribute('aria-hidden', 'true');
  win.innerHTML = `
    <div class="edr-chat-header">
      <div class="edr-chat-header-left">
        <div class="edr-chat-avatar">EDR</div>
        <div>
          <div class="edr-chat-header-name" id="edr-chat-title">Duda · EDR Engenharia</div>
          <div class="edr-chat-header-status">Assistente virtual</div>
        </div>
      </div>
      <button class="edr-chat-close" onclick="toggleEdrChat()" aria-label="Fechar conversa">&times;</button>
    </div>
    <div class="edr-chat-body" id="edr-chat-body" aria-live="polite">
      <div class="edr-msg bot">Oi! Sou a Duda, assistente virtual da EDR Engenharia. 😊 Em que posso te ajudar?</div>
      <div class="edr-chat-typing" id="edr-chat-typing"><span></span><span></span><span></span></div>
    </div>
    <div class="edr-chat-privacy">Não envie documentos, senhas ou dados bancários. Suas mensagens são processadas para responder ao atendimento.</div>
    <div class="edr-chat-footer">
      <textarea class="edr-chat-input" id="edr-chat-input" aria-label="Digite sua dúvida" placeholder="Digite sua dúvida..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();enviarMsgChat()}"></textarea>
      <button class="edr-chat-send" id="edr-chat-send" onclick="enviarMsgChat()" aria-label="Enviar mensagem">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  // Mensagem inicial no histórico
  _chatMessages.push({ role: 'assistant', content: 'Oi! Sou a Duda, assistente virtual da EDR Engenharia. 😊 Em que posso te ajudar?' });
}

function toggleEdrChat() {
  _chatOpen = !_chatOpen;
  const win = document.getElementById('edr-chat-window');
  const btn = document.querySelector('.edr-chat-btn');
  win.classList.toggle('open', _chatOpen);
  win.setAttribute('aria-hidden', String(!_chatOpen));
  btn.setAttribute('aria-expanded', String(_chatOpen));
  if (_chatOpen) {
    setTimeout(() => document.getElementById('edr-chat-input').focus(), 300);
    // Rastrear abertura no Analytics
    if (typeof gtag === 'function') gtag('event', 'chat_aberto', { event_category: 'engajamento' });
  } else btn.focus();
}

function addMsgChat(role, text) {
  const body = document.getElementById('edr-chat-body');
  const typing = document.getElementById('edr-chat-typing');
  const div = document.createElement('div');
  div.className = `edr-msg ${role === 'user' ? 'user' : 'bot'}`;

  // Montar a mensagem com nós seguros e tornar apenas contatos conhecidos clicáveis.
  const mensagem = String(text);
  const contatoRegex = /(https?:\/\/wa\.me\/[^\s]+|\(87\)\s*9\s*8171[\-\s]*3987)/g;
  let inicio = 0;

  const adicionarTexto = trecho => {
    trecho.split('\n').forEach((linha, indice) => {
      if (indice) div.appendChild(document.createElement('br'));
      div.appendChild(document.createTextNode(linha));
    });
  };

  for (const match of mensagem.matchAll(contatoRegex)) {
    adicionarTexto(mensagem.slice(inicio, match.index));
    const link = document.createElement('a');
    const ehTelefone = match[0].startsWith('(87)');
    link.href = ehTelefone ? 'https://wa.me/5587981713987' : match[0];
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = ehTelefone ? '(87) 9 8171-3987' : 'Clique aqui pra falar no WhatsApp';
    div.appendChild(link);
    inicio = match.index + match[0].length;
  }

  adicionarTexto(mensagem.slice(inicio));
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
    let resposta = await chamarIA(msg);

    // Extrair dados estruturados do lead: <!--LEAD|nome:Fulano|tel:87999-->
    const leadMatch = resposta.match(/<!--LEAD\|([^>]+)-->/);
    if (leadMatch) {
      const campos = leadMatch[1].split('|');
      campos.forEach(c => {
        const [k, v] = c.split(':');
        if (k === 'nome' && v) window._leadNome = v.trim();
        if (k === 'tel' && v) window._leadTel = v.trim().replace(/\D/g, '');
      });
      // Remover a marcação da resposta visível
      resposta = resposta.replace(/<!--LEAD\|[^>]+-->/, '').trim();
      // Salvar lead qualificado
      salvarLead('qualificado');
      if (typeof gtag === 'function') gtag('event', 'lead_qualificado', { event_category: 'conversao' });
    }

    // Compatibilidade: detectar LEAD QUALIFICADO antigo
    if (resposta.includes('LEAD QUALIFICADO')) {
      resposta = resposta.replace('LEAD QUALIFICADO', '').trim();
      salvarLead('qualificado');
      if (typeof gtag === 'function') gtag('event', 'lead_qualificado', { event_category: 'conversao' });
    }

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
async function salvarLead(tipo) {
  try {
    // Extrair dados da conversa
    const conversa = _chatMessages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    const conversaCompleta = _chatMessages.map(m => `${m.role === 'user' ? 'Cliente' : 'Duda'}: ${m.content}`).join('\n');

    // Nome e telefone: priorizar dados extraídos pela IA
    let nome = window._leadNome || null;
    let telefone = window._leadTel || null;

    // Fallback: regex na conversa
    if (!nome) {
      const nomeMatch = conversa.match(/(?:meu nome e|me chamo|sou o|sou a|nome e)\s+([A-Za-zÀ-ÿ\s]+)/i);
      nome = nomeMatch ? nomeMatch[1].trim() : null;
    }
    if (!telefone) {
      const telMatch = conversa.match(/(?:\(?\d{2}\)?\s*9?\s*\d{4}[\s-]?\d{4})/);
      telefone = telMatch ? telMatch[0].replace(/\D/g, '') : null;
    }

    // Extrair renda
    const rendaMatch = conversa.match(/(?:ganho|renda|salario|recebo)\s*(?:de\s*)?(?:r\$?\s*)?(\d[\d.,]*)/i)
      || conversa.match(/(\d[\d.,]*)\s*(?:reais|por mes|mensal)/i);
    const renda = rendaMatch ? parseFloat(rendaMatch[1].replace('.','').replace(',','.')) : null;

    // Classificar faixa
    let faixa = null;
    if (renda) {
      if (renda <= 3200) faixa = 'Faixa 1';
      else if (renda <= 5000) faixa = 'Faixa 2';
      else if (renda <= 9600) faixa = 'Faixa 3';
      else if (renda <= 13000) faixa = 'Faixa 4';
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
      status: tipo === 'qualificado' ? 'novo' : 'conversa'
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
    return 'O MCMV é um programa federal com condições que variam conforme renda, região, imóvel e análise da Caixa. As taxas nominais partem de 4% ao ano em alguns perfis, e o prazo pode chegar a 35 anos. 😊\n\nPosso te orientar sobre as faixas atuais. Qual é a renda bruta aproximada da sua família?';

  if (m.match(/renda|ganho|salario|quanto.*ganho|faixa/)) {
    const nums = m.match(/\d[\d.,]*/);
    if (nums) {
      const renda = parseFloat(nums[0].replace('.','').replace(',','.'));
      if (renda <= 3200) return 'Pela renda informada, você está na Faixa 1. 😊 Pode haver subsídio e as taxas nominais partem de 4% ao ano em perfis elegíveis. A entrada, a taxa final e o valor aprovado só aparecem na simulação e na análise da Caixa.\n\nVocê já tem terreno ou precisaria incluir um?';
      if (renda <= 5000) return 'Pela renda informada, você está na Faixa 2. 😊 A taxa e os possíveis descontos variam conforme renda, região, imóvel e análise da Caixa.\n\nVocê já tem terreno ou precisaria incluir um?';
      if (renda <= 9600) return 'Pela renda informada, você está na Faixa 3. As taxas nominais divulgadas ficam entre 7,66% e 8,16% ao ano, mas a condição final depende da análise da Caixa. 😊\n\nVocê tem ideia do tamanho de casa que gostaria?';
      if (renda <= 13000) return 'Pela renda informada, você está na Faixa 4, também chamada Classe Média. A linha tem taxa nominal de 10% ao ano e atende imóveis de até R$600 mil, sujeita à análise da Caixa. 😊\n\nVocê já tem alguma ideia de terreno ou tamanho de casa?';
      return 'Essa renda fica acima do limite urbano atual do MCMV. A EDR ainda pode orientar outras possibilidades de projeto e financiamento. Você já tem terreno?';
    }
    return 'Pra te dizer a faixa certinha, preciso saber a renda aproximada da família (somando todos que vão compor renda). Pode me dizer um valor aproximado? 😊';
  }

  if (m.match(/terreno|lote|nao tenho terreno|sem terreno/))
    return 'Você pode começar sem terreno. 😊 Na modalidade de aquisição de terreno e construção, os dois podem fazer parte da mesma operação, sujeita à análise da Caixa e à aprovação do imóvel e do projeto.\n\nVocê já tem ideia de qual bairro ou região gostaria?';

  if (m.match(/entrada|fgts|quanto preciso/))
    return 'A entrada depende da renda, do imóvel, do FGTS disponível e da análise de crédito. Em perfis elegíveis, FGTS e benefícios do programa podem reduzir esse valor. 😊\n\nVocê trabalha de carteira assinada e já consultou seu saldo do FGTS?';

  if (m.match(/quanto custa|valor|preco|caro|barato/))
    return 'O custo total depende do terreno, do projeto, do padrão de acabamento e do orçamento da obra. Entrada e parcela também dependem da análise da Caixa. 😊\n\nA EDR pode montar uma simulação com custo, entrada e parcela estimada. Qual é a renda aproximada da sua família?';

  if (m.match(/modelo|projeto|planta|quartos|metros|tamanho/))
    return 'Temos modelos de 60m² a 70m², com 2 ou 3 quartos! 😊\n\n• 2 quartos: a partir de 60m² — ideal pra casais ou famílias pequenas\n• 3 quartos: até 70m² — mais espaço, suíte incluída\n\nTodos com sala, cozinha, área de serviço e garagem. A gente adapta o modelo ao seu orçamento. Quantas pessoas vão morar na casa?';

  if (m.match(/prazo|demora|tempo|quanto tempo|quando fica pronto/))
    return 'O prazo depende do terreno, do projeto, das aprovações, da análise bancária e do porte da obra. 😊 Antes de começar, a EDR organiza as etapas e apresenta um cronograma compatível com o seu caso.\n\nVocê já tem terreno e documentação do imóvel?';

  if (m.match(/garantia|seguranca|confi|qualidade|medo/))
    return 'Na EDR, a gente se responsabiliza por tudo. No ato da entrega você recebe um manual do usuário e um termo de garantia. Nosso suporte é de até 5 anos em questões estruturais. 😊\n\nE os valores que fechamos não são alterados — zero surpresas. Se quiser, posso marcar uma visita pra você conhecer uma obra de perto. O que acha?';

  if (m.match(/parcela|juros|taxa|pagar|prestacao/))
    return 'As condições do MCMV variam por renda, região e perfil. No Norte e Nordeste, a menor taxa nominal parte de 4% ao ano em perfis elegíveis. 😊 A taxa final, a entrada e a parcela precisam ser confirmadas na simulação e no contrato com a Caixa.\n\nQual é a renda bruta aproximada da sua família?';

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
