# Automação de divulgação — Como configurar

Pipeline: **conteúdo → plano → enfileirar no Buffer → posta sozinho no horário.**

## O que está automatizado

| Etapa | O que faz | Comando |
|---|---|---|
| Gerar plano | Cria posts com UTM + horários (JSON + Markdown) | `npm run marketing:plan` |
| Gerar cards | Cria os PNGs dos posts de Instagram/TikTok | `npm run marketing:cards` |
| Subir mídia | Envia os cards ao Cloudinary (URL pública estável) | `npm run marketing:upload` |
| Ver canais | Testa o token e lista as redes conectadas | `npm run marketing:channels` |
| Enfileirar | Agenda os posts no Buffer no horário certo | `npm run marketing:enqueue` |

O **Buffer** é quem publica: depois de enfileirado, o post sai sozinho mesmo com seu
computador desligado. Nada de cron no seu lado.

## Cobertura por rede

| Rede | Status |
|------|--------|
| X (Twitter) | ✅ automático via Buffer |
| Facebook | ✅ automático via Buffer |
| Instagram | ✅ automático via Buffer + card gerado e hospedado no Cloudinary |
| TikTok | ❌ a API do Buffer **não suporta** TikTok. Opções: Postiz (self-hosted) ou postar manual |
| Product Hunt | Manual (lançamento pontual) — kit pronto em `marketing/producthunt.md` |

## Configuração única (≈15 min)

1. **Crie uma conta no Buffer** (plano gratuito cobre 3 canais: X, Instagram, Facebook):
   - Acesse https://publish.buffer.com
   - Conecte as contas **X**, **Instagram** e **Facebook** (OAuth, cada rede pede login uma vez).
2. **Gere a API key:** https://publish.buffer.com/settings/api → copie.
3. **Crie uma conta grátis no Cloudinary** (https://cloudinary.com): o Dashboard mostra
   `CLOUD_NAME`, `API_KEY` e `API_SECRET`. (Usamos para hospedar os cards — o Buffer exige
   URL pública e estável, e a do Cloudinary é permanente.)
4. **Guarde as chaves com segurança** (NÃO cole em conversas nem commite):
   ```
   echo 'BUFFER_ACCESS_TOKEN=SEU_TOKEN' >> .env.local
   echo 'CLOUDINARY_CLOUD_NAME=SEU_CLOUD' >> .env.local
   echo 'CLOUDINARY_API_KEY=SUA_KEY' >> .env.local
   echo 'CLOUDINARY_API_SECRET=SEU_SECRET' >> .env.local
   ```
   `.env.local` é gitignored. **Nunca** ponha segredo no `.env` (esse é versionado).
5. **Teste:** `npm run marketing:channels` → deve listar X, Instagram, Facebook com seus IDs.

## Uso semanal

```bash
# 1. Gera o plano dos próximos 7 dias (começa amanhã)
npm run marketing:plan

# 2. Gera os cards dos posts visuais (Instagram)
npm run marketing:cards

# 3. Sobe os cards ao Cloudinary (gera URLs públicas no próprio JSON)
npm run marketing:upload

# 4. Revise o resumo
open marketing/planner-$(date +%F).md

# 5. Veja o que seria enviado (sem postar nada)
npm run marketing:enqueue -- --dry-run

# 6. Enfileira de verdade (X, Facebook e Instagram com card)
npm run marketing:enqueue
```

Variantes:
- `npm run marketing:enqueue -- --only x,facebook`
- `npm run marketing:cards -- --size 1350` (formato retrato 1080×1350 p/ Instagram)
- `npm run marketing:plan -- --days 14 --campaign lancamento`

## Por que TikTok ainda não sai automático

O TikTok exige vídeo e a API do Buffer não aceita esse canal. Caminho para destravar:
instalar o **Postiz** (open source, Docker: `docker run -d -p 5000:5000 ghcr.io/gitroomhq/postiz-app:latest`),
conectar o TikTok lá e eu adiciono um adapter no enfileirador. Ou manter manual.

## Medindo o resultado

Cada post carrega UTM (`utm_source=<canal>`). No app: **Admin → Funil → Canais** mostra
qual rede traz visitantes e assinantes. Após ~7 dias, compare os canais e eu ajusto o
conteúdo/horários do plano para o que converte mais.

## Segurança

- Tokens/chaves **só** em `.env.local` (gitignored). Nunca no `.env` nem em commit.
- `marketing/.env.example` é o modelo — não contém segredo.
- Revogue as chaves no Buffer/Cloudinary se algum dia vazarem.
