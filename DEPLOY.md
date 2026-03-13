# Deploy — EDR Site (edreng.com.br)

## Hospedagem

- **Provedor:** Hostinger
- **Repositório:** `github.com/Duamrt/EDR-SITE`
- **Branch:** `main`
- **Diretório destino:** `public_html`

---

## Passo a passo: Auto-deploy via Git no hPanel

### 1. Acessar o hPanel

1. Entre em [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Selecione o domínio **edreng.com.br**

### 2. Conectar repositório GitHub

1. No menu lateral, vá em **Avançado → Git**
2. Clique em **Criar** ou **Adicionar repositório**
3. Preencha:
   - **Repositório:** `https://github.com/Duamrt/EDR-SITE.git`
   - **Branch:** `main`
   - **Diretório:** `public_html`
4. Clique em **Criar**

### 3. Autenticar com GitHub

- O hPanel vai pedir autorização OAuth com o GitHub
- Autorize o acesso ao repositório `Duamrt/EDR-SITE`
- Se usar repositório público, pode não precisar de token

### 4. Configurar Webhook (auto-deploy automático)

Após conectar o repositório, a Hostinger gera uma **URL de webhook**.

1. Copie a URL do webhook exibida no hPanel
2. No GitHub, vá em **Settings → Webhooks → Add webhook**
3. Preencha:
   - **Payload URL:** cole a URL copiada do hPanel
   - **Content type:** `application/json`
   - **Eventos:** selecione **Just the push event**
4. Clique em **Add webhook**

A partir de agora, todo `git push` na branch `main` vai disparar o deploy automaticamente.

### 5. Primeiro deploy (pull manual)

1. Volte ao hPanel → Git
2. Clique em **Pull** para fazer o deploy inicial
3. Verifique se o site está acessível em `edreng.com.br`

---

## Fluxo após configuração

```
git push origin main  →  webhook dispara  →  Hostinger faz pull  →  site atualizado
```

## Notas

- O diretório `public_html` é a raiz do site — todos os arquivos do repo vão direto pra lá
- O arquivo `CNAME` do GitHub Pages pode ser removido após migração completa pra Hostinger
- Se o webhook parar de funcionar, faça pull manual pelo hPanel enquanto investiga
- DNS do domínio `edreng.com.br` precisa estar apontando para os nameservers da Hostinger
