# Guia rápido de inclusão de projeto

Use isto quando for adicionar um novo app ao rodízio. A regra principal é
simples: se não quer que nenhum projeto fique de fora no mesmo dia, o número de
horários precisa ser igual ao número de apps.

## Checklist curto

1. Copie um app existente e crie `apps/<id>.json`.
2. Garanta estes campos:
   - `id`, `nome`, `url`, `tagline`
   - `fonte`
   - `marca`
   - `recursos`
   - `chips`
   - `selos`
   - `hashtags`
   - `posts`
3. Mantenha `8 posts` por app.
4. Em cada post, use `card`, `ganchos`, `corpos`, `ctas` e `curtos`.
5. Adicione os assets:
   - `assets/logos/<id>.png`
   - `assets/capturas/<id>-0.png`
   - `assets/capturas/<id>-1.png`
   - `assets/capturas/<id>-2.png` *(opcional, se quiser manter três telas)*
6. Se houver telas internas novas, registre as rotas em
   [`scripts/capturar.mjs`](../scripts/capturar.mjs) e teste com:
   ```bash
   npm run capturar -- --app <id>
   ```
7. Se houver fonte própria, adicione o `.ttf` em `assets/fontes/` e registre a
   família em `scripts/lib/cards.js`.
8. Inclua o `id` novo em `scripts/lib/conteudo.js` (`ORDEM_APPS`).
9. Ajuste os horários em:
   - `.github/workflows/publicar.yml`
   - `scripts/publicar.mjs`
   - `scripts/agenda.mjs`
   - `scripts/calendario.mjs`
   - `.env.example`
10. Regra de ouro:
   - número de apps = número de horários por dia
   - se entrar um app novo, entre um horário novo junto
11. Valide antes de publicar:
    ```bash
    npm run cards -- --app <id> --todos
    npm run agenda -- --dias 7
    npm run calendario
    npm run verificar
    npm run dry
    ```
12. Mostre um exemplo visual do card para o usuário aprovar ou pedir ajustes
    antes de colocar em produção.

## Valores atuais

- Apps: 7
- Horários: `08h`, `11h`, `14h`, `17h`, `20h`, `21h`, `22h`
- Ordem atual: `Remedin`, `AI-Eat`, `Vai dar quanto?`, `GASONOL`,
  `Convertendo`, `O Palpiteiro`, `Papelzinho`

## Sequência mínima

JSON do app → logo e capturas → `ORDEM_APPS` → horários → calendário →
validação → commit só do projeto.

## Exemplo recente

`O Palpiteiro` foi adicionado assim:

- `apps/opalpiteiro.json`
- `assets/logos/opalpiteiro.png`
- `assets/capturas/opalpiteiro-0.png`
- `assets/capturas/opalpiteiro-1.png`
- `assets/capturas/opalpiteiro-2.png`
- `assets/capturas/opalpiteiro-3.png`
- atualização em `scripts/lib/conteudo.js`
- horários ajustados para `7 apps = 7 horários`

`Papelzinho` entrou logo depois:

- `apps/papelzinho.json`
- `assets/logos/papelzinho.png`
- `assets/capturas/papelzinho-0.png`
- `assets/capturas/papelzinho-1.png`
- captura automática registrada em `scripts/capturar.mjs`
- atualização em `scripts/lib/conteudo.js`
- horários ajustados para `7 apps = 7 horários`

Se só precisar do mínimo para agir, este arquivo é a referência rápida.
