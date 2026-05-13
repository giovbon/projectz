# ProjectZ — Agent Guide

## Visão Geral

Sistema de documentação que armazena páginas escritas em **Markdown** e as serve com um menu lateral gerado automaticamente pela estrutura de pastas. Suporta dois modos de deploy:

| Modo | Stack | Domínio |
|------|-------|---------|
| **Self-Hosted** | Go + Preact (Docker) | Qualquer (Cloudflare Tunnel) |
| **GitHub Pages** | Preact estático | `*.github.io/projectz` |

---

## Estrutura Final do Projeto (36 arquivos)

```
projectz/
├── content/                          # 📝 Markdown — monte como volume no Docker
│   ├── index.md                      # Página inicial
│   ├── docs/
│   │   ├── intro.md                  # → Seção "Docs" no menu
│   │   └── setup.md
│   ├── slides/
│   │   └── apresentacao.md           # → type: slides (reveal.js)
│   └── projetos/
│       └── meu-app.md                # → type: codetree (file explorer)
│
├── server/                           # 🔧 Backend Go (chi + goldmark)
│   ├── main.go                       # Entrypoint: rotas, CORS, embed do frontend
│   ├── go.mod                        # Dependências (chi, goldmark, yaml)
│   ├── handler/
│   │   ├── pages.go                  # GET /api/page/* → markdown → HTML
│   │   ├── menu.go                   # GET /api/menu → JSON da árvore de pastas
│   │   ├── slides.go                 # GET /api/slides/* → slides splitados
│   │   ├── sheets.go                 # POST /api/submit → Google Sheets
│   │   └── static.go                 # Serve frontend SPA com fallback
│   ├── parser/
│   │   ├── frontmatter.go            # Extrai YAML frontmatter dos .md
│   │   └── tree.go                   # Lê content/ e monta a árvore do menu
│   └── embed/.gitkeep                # Frontend buildado (Vite) vai aqui
│
├── web/                              # 🎨 Frontend Preact + Vite + TypeScript
│   ├── package.json                  # preact, preact-router, marked
│   ├── vite.config.ts                # Build → ../server/embed, proxy /api → :8080
│   ├── tsconfig.json                 # strict, jsxImportSource: preact
│   ├── index.html
│   └── src/
│       ├── main.tsx                  # Ponto de entrada: render(<App/>)
│       ├── app.tsx                   # Router: "/" → index, "/:slug*" → página
│       ├── components/
│       │   ├── Layout.tsx            # Shell com topbar + sidebar + conteúdo
│       │   ├── Sidebar.tsx           # Menu lateral com <details> colapsáveis
│       │   ├── MarkdownPage.tsx      # Renderiza HTML do markdown
│       │   ├── SlideDeck.tsx         # Player de slides com navegação por teclado
│       │   ├── CodeTree.tsx          # File explorer estilo VS Code
│       │   └── FormActivity.tsx      # Formulário → POST /api/submit
│       ├── hooks/
│       │   ├── useMenu.ts            # Fetch e cache do menu (/api/menu)
│       │   └── useMarkdown.ts        # Fetch da página + slides
│       ├── lib/
│       │   ├── api.ts                # Cliente HTTP (self-hosted / gh-pages)
│       │   └── markdown.ts           # Configuração do marked (GFM, breaks)
│       └── styles/
│           └── global.css            # CSS completo (~700 linhas, responsivo)
│
├── Dockerfile                        # Multi-stage: node → go → alpine (~15 MB)
├── docker-compose.yml                # Serviços: projectz + cloudflared
├── .dockerignore
├── .env.example                      # Variáveis de ambiente documentadas
├── .gitignore
├── scripts/
│   └── build-gh-pages.sh            # Pré-renderiza content/ → JSON estáticos
├── .github/workflows/
│   ├── docker-publish.yml            # Build + push imagem → ghcr.io
│   └── gh-pages-deploy.yml           # Deploy estático → GitHub Pages
└── AGENT.md                          # Este arquivo
```

---

## Como Rodar

### Desenvolvimento (2 terminais)

```bash
# Terminal 1 — Backend Go
cd server
go run . --content-path ../content
# Servidor em http://localhost:8080

# Terminal 2 — Frontend Preact (hot reload + proxy /api → :8080)
cd web
npm install
npm run dev
# Dev server em http://localhost:3000
```

### Docker Self-Hosted

```bash
docker compose up -d
# http://localhost:8080
```

Com Cloudflare Tunnel:

```bash
# 1. Crie o tunnel no Zero Trust Dashboard
# 2. Copie o token
export CF_TUNNEL_TOKEN="seu-token"
# 3. Descomente o serviço cloudflared no docker-compose.yml
docker compose up -d
```

### GitHub Pages

Push na branch `main` → GitHub Actions publica automaticamente.

Build manual para testar:

```bash
cd web
npm run build:ghpages          # Gera output em ../gh-pages
bash ../scripts/build-gh-pages.sh  # Pré-renderiza JSONs
```

---

## Como Funciona o Menu Automático

A API `GET /api/menu` lê o diretório `content/` recursivamente e retorna JSON:

```
content/                    → Resposta de /api/menu:
├── index.md                → { "label": "Bem-vindo ao ProjectZ", "slug": "index", "pages": [...] }
├── docs/                   → { "label": "Docs", "slug": "docs", "pages": [
│   ├── intro.md            →     { "title": "Introdução", "slug": "intro", "path": "docs/intro.md" },
│   └── setup.md            →     { "title": "Setup", "slug": "setup", "path": "docs/setup.md" }
│                           → ] }
├── slides/                 → { "label": "Slides", "slug": "slides", "type": "slides", "pages": [...] }
└── projetos/               → { "label": "Projetos", "slug": "projetos", "pages": [...] }
```

**Regras:**

| Elemento no disco | Como aparece no menu |
|---|---|
| **Pasta** (`docs/`) | Seção colapsável com `<details>` |
| **Arquivo `.md`** | Item clicável no menu |
| **`_index.md`** dentro da pasta | Metadados da seção (título customizado, tipo) |
| **Frontmatter `type: slides`** | Ícone 🎥 + abre o `SlideDeck` |
| **Frontmatter `type: codetree`** | Ícone 🌳 + abre o `CodeTree` |
| **Frontmatter `type: form`** | Abre o `FormActivity` |
| **Pasta `slides/`** | Detectada automaticamente como tipo `slides` |
| **Ordenação** | Alfabética; use prefixos como `01-`, `02-` para controlar |

### Frontmatter Suportado

```yaml
---
title: Meu Título        # Título da página (opcional — usa o primeiro # heading)
type: slides             # slides | codetree | form | (vazio = página normal)
theme: black             # Tema do reveal.js (black, white, league, etc.)
---
```

---

## APIs do Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/menu` | Estrutura de pastas em JSON |
| `GET` | `/api/page/{path}` | Markdown → HTML renderizado + metadados |
| `GET` | `/api/slides/{path}` | Slides separados por `---` |
| `POST` | `/api/submit` | Envia formulário → Google Sheets |
| `GET` | `/health` | Health check (`{"status":"ok"}`) |
| `GET` | `/*` | Frontend SPA (fallback para index.html) |

---

## Funcionalidades Futuras

### 1. Reveal.js Completo (slides)
**Status:** Esqueleto pronto — `SlideDeck.tsx` já funciona com navegação por teclado, dots, fullscreen.
**O que falta:**
- Carregar o CSS e JS oficiais do reveal.js via CDN
- Integrar com o parser de slides para fragmentos, notas, transições
- Suporte a temas customizados via frontmatter `theme: league`

```tsx
// web/src/components/SlideDeck.tsx — ponto de extensão
// Adicionar no useEffect:
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = `https://cdn.jsdelivr.net/npm/reveal.js/dist/theme/${slidesData.theme}.css`;
document.head.appendChild(link);
```

### 2. Asciinema Player
**Status:** Placeholder.
**Como implementar:**
- Detectar URLs `https://asciinema.org/a/*` no markdown renderizado
- Substituir por `<asciinema-player src="..."></asciinema-player>`
- Carregar o player JS/CSS via CDN

```tsx
// No MarkdownPage.tsx, após renderizar o HTML:
useEffect(() => {
  const links = container.querySelectorAll('a[href*="asciinema.org/a/"]');
  links.forEach(link => {
    const id = link.href.split('/a/')[1];
    const player = document.createElement('asciinema-player');
    player.setAttribute('src', `https://asciinema.org/a/${id}.cast`);
    link.replaceWith(player);
  });
  // Carregar script do player
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/asciinema-player@latest/dist/bundle/asciinema-player.min.js';
  document.head.appendChild(script);
}, [html]);
```

### 3. Google Sheets — Integração Real
**Status:** Handler Go com validação e estrutura prontos; modo no-op quando não configurado.
**O que falta:**
- Adicionar `google.golang.org/api/sheets/v4` ao `go.mod`
- Implementar auth via Service Account (JSON key em env var)
- Append row na planilha configurada em `GOOGLE_SHEET_ID`

```go
// server/handler/sheets.go — esqueleto existente, adicionar:
import "google.golang.org/api/sheets/v4"

func appendToSheet(sub ActivitySubmission) error {
    ctx := context.Background()
    // ... autenticar com service account
    // ... sheetsService.Spreadsheets.Values.Append(...)
}
```

### 4. GitHub Pages com Markdown Renderizado
**Status:** Build script `build-gh-pages.sh` gera JSONs estáticos, mas o HTML vai como raw.
**O que falta:**
- Adicionar um step no workflow que rode `marked` via Node.js para pré-renderizar o markdown → HTML nos JSONs
- Ou integrar `showdown` / `marked` no script de build

### 5. Busca Full-Text
**Status:** Não implementado.
**Como implementar:**
- No backend Go: índice em memória com `bleve` ou busca simples com `strings.Contains`
- No frontend: search box na sidebar → filtra `menu.sections`
- No GitHub Pages: busca client-side com índice pré-gerado (lunr.js ou FlexSearch)

### 6. Temas de Cor (Dark Mode)
**Status:** CSS usa variáveis (`:root`), fácil de extender.
**Como implementar:**
- Adicionar toggle no `Layout.tsx`
- Alternar classe `[data-theme="dark"]` no `<html>`
- Definir variáveis escuras no CSS

---

## Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `CONTENT_PATH` | Não | `content` | Caminho para a pasta de markdown |
| `PORT` | Não | `8080` | Porta do servidor HTTP |
| `GOOGLE_SHEETS_KEY` | Não | — | JSON da service account do Google |
| `GOOGLE_SHEET_ID` | Não | — | ID da planilha Google |
| `CF_TUNNEL_TOKEN` | Não | — | Token do Cloudflare Tunnel |

---

## Decisões Técnicas

| Decisão | Motivo |
|---------|--------|
| **Preact em vez de React** | Bundle ~3KB vs ~40KB |
| **Go `embed` para o frontend** | Um binário único, sem necessidade de servir estáticos separados |
| **Chi router** | Mais leve e idiomático que Gin; compatível com `net/http` |
| **`goldmark` para markdown** | Renderização server-side, extensível (GFM, tables, tasklists) |
| **`marked` no client** | Fallback para GitHub Pages + slides client-side |
| **CSS puro (sem Tailwind)** | Zero dependências de build para estilos; variáveis CSS nativas |
| **Multi-stage Docker** | Imagem final Alpine ~15 MB |
| **`<details>` nativo no menu** | Sem JS para colapsar seções; acessível por padrão |
| **GitHub Actions duplo** | Docker image → ghcr.io + Static site → GitHub Pages |
