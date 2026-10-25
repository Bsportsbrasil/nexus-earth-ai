# NEXUS — Superintelligence Platform

Interface interativa de superinteligência com visualização de rede neural em tempo real, raciocínio multi-agente, grafo de conhecimento e chat com IA (integrado ao Google Gemini via `@google/genai`).

## Módulos

1. **Live Neural Network (`neural.js`)** — Visualização de rede neural com camadas configuráveis, taxa de disparo e temas visuais.
2. **Multi-Agent Reasoning (`agents.js`)** — 4 agentes especializados (`PLANNER`, `CRITIC`, `EXECUTOR`, `VERIFIER`) que analisam problemas em sequência e geram consenso.
3. **Knowledge Graph (`graph.js`)** — Grafo de conceitos interativo com simulação física, busca, filtro e zoom.
4. **AI Chat + Thought Chain (`chat.js`)** — Chat integrado ao Gemini (`gemini-3-flash-preview`) com cadeia de pensamento visível.
5. **Live Intelligence Metrics (`metrics.js`)** — Painel de telemetria com sparklines e medidores em tempo real.

## Como rodar localmente

```bash
npm start
```
Acesse `http://localhost:5173` no navegador e clique em **🔑 API Key** no topo para inserir sua chave do [Google AI Studio](https://aistudio.google.com/apikey).

## Como publicar e conectar seu domínio próprio

### Opção 1: Vercel (Mais rápido e gratuito)
1. Crie uma conta em [vercel.com](https://vercel.com).
2. No terminal, dentro desta pasta, rode:
   ```bash
   npx vercel --prod
   ```
   *(Ou suba esta pasta para um repositório no GitHub e importe na Vercel).*
3. No painel do projeto na Vercel, vá em **Settings → Domains**.
4. Digite seu domínio (ex: `seudominio.com`) e clique em **Add**.
5. No painel onde você comprou o domínio (Registro.br, GoDaddy, Hostinger, Cloudflare, etc.), adicione os registros DNS indicados pela Vercel:
   - **Tipo `A`** para `@` apontando para `76.76.21.21`
   - **Tipo `CNAME`** para `www` apontando para `cname.vercel-dns.com`

### Opção 2: Netlify (Arrastar e soltar)
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arraste a pasta `nexus` inteira para a página.
3. Vá em **Domain management → Add a domain** e siga as instruções de DNS para apontar seu domínio.

### Opção 3: Cloudflare Pages
1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Envie a pasta `nexus` e conecte seu domínio na aba **Custom domains**.
