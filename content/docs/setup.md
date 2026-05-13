---
title: Setup
---

# Guia de Setup

## Pré-requisitos

- Docker e Docker Compose
- Cloudflare Tunnel (cloudflared)
- Go 1.22+ (para desenvolvimento)
- Node.js 20+ (para desenvolvimento)

## Configuração do Cloudflare Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create projectz
cloudflared tunnel route dns projectz meusite.exemplo.com
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `CONTENT_PATH` | Caminho dos markdowns | `/app/content` |
| `PORT` | Porta do servidor | `8080` |
| `GOOGLE_SHEETS_KEY` | Chave da service account | - |
| `GOOGLE_SHEET_ID` | ID da planilha | - |
