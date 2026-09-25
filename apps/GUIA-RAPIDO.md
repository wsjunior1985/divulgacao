# Guia rápido de inclusão de projeto

Use isto quando for adicionar um novo app ao rodízio. São 7 horários fixos por
dia e os apps se revezam neles — pode haver mais apps que horários. Um app só
entra no rodízio depois que o card 1 no padrão premium for aprovado pelo dono.

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
9. Não mexa nos horários: continuam 7 por dia. Se um dia for preciso mudar,
   eles vivem em `.github/workflows/publicar.yml`, `scripts/publicar.mjs`,
   `scripts/agenda.mjs`, `scripts/calendario.mjs` e `.env.example`.
10. Escreva o bloco `visual` do app e o bloco `premium` de cada post (ver "O card"
    no README) e aprove o card 1 com o dono antes do passo 8.
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

- Apps: 8 (7 horários, em rodízio)
- Horários: `08h`, `11h`, `14h`, `17h`, `20h`, `21h`, `22h`
- Ordem atual: `Remedin`, `AI-Eat`, `Vai dar quanto?`, `GASONOL`,
  `Convertendo`, `O Palpiteiro`, `Papelzinho`, `O Meu Álbum`

## Sequência mínima

JSON do app → logo e telas → card 1 aprovado → `ORDEM_APPS` → agenda →
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
- (na época, com um horário novo; hoje os horários ficam fixos em 7)

`Papelzinho` entrou logo depois:

- `apps/papelzinho.json`
- `assets/logos/papelzinho.png`
- `assets/capturas/papelzinho-0.png`
- `assets/capturas/papelzinho-1.png`
- captura automática registrada em `scripts/capturar.mjs`
- atualização em `scripts/lib/conteudo.js`
- (na época, com um horário novo; hoje os horários ficam fixos em 7)

Se só precisar do mínimo para agir, este arquivo é a referência rápida.
