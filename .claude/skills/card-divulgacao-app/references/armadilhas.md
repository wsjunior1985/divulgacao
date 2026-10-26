# Armadilhas dos cards

- **Logo desalinhada**: brasão centrado sobre a palavra deixava a borda esquerda em x≈40/80 enquanto o título está em x≈58. Corrigido com lockup horizontal recortado e `left:58px` no layout do app.
- **Título órfão**: "Sua chave / fica / no aparelho" (uma palavra sozinha). Reescrever o título ou usar espaço sem quebra (`&nbsp;`) entre as duas últimas palavras.
- **Descendentes cortadas** ("Em poucos toques", "Abriu, gerou"): dar `padding-bottom` à linha de destaque no CSS do layout.
- **Aparelho escuro sobre fundo escuro**: some. Moldura metálica clara + halo na cor de acento (`.aro` em `fazopix.js`).
- **Tela cortada** (QR pela metade, botão cortado): recapturar com outro enquadramento ou escolher outra tela; não aceitar "como se tivesse rolado".
- **Tela inexistente**: se o app não tem tela de instalação/offline, não invente; use a tela principal e o texto, citando o que vem do manifest/PWA.
- **Promessa a mais**: "Leitura garantida" → "Leitura protegida". Conferir toda afirmação contra o código/PRODUCT.md. Nada de preço, prova social ou número que o app não mostra.
- **Dados pessoais**: Patrono Barber Club (cliente real) virou "Barbearia Navalha"; profissionais fictícios (Rafael, Diego Martins); Maria Exemplo, SAO PAULO, exemplo@exemplo.com, R$ 35,00. Nunca chave Pix/CPF/telefone reais.
- **Domínio**: o JSON precisa apontar para o domínio que responde (ex.: fazopix.waldeapps.systems; fazopix.app.br não resolve e fazopix.com.br é página de domínio à venda).
- **Fonte**: se a fonte do app não existe em `assets/fontes/`, use a mais próxima (Figtree → Plus Jakarta Sans) ou adicione o `.ttf` com licença.
- **Dry-run deixa cards**: apague os `NNN-<id>-*.jpg` gerados em `assets/cards/`.
- **Calendário**: `npm run calendario` regenera `CALENDARIO-1ANO.md` inteiro com início em hoje (tira os meses passados); o dono pediu para deixá-lo fora dos commits. Faça backup antes de rodar e restaure sem `git checkout`.
- **Rodízio**: acrescentar app no fim muda o módulo da agenda (todos os slots futuros mudam). Só com card 1 aprovado.
- **Rebase no push**: o robô do rodízio commita "registro de publicação" no `main`; use `git pull --rebase --autostash origin main` antes do push.
- **Cota do Actions** (até 01/11/2026): commits com `[skip ci]`; os workflows só disparam por agendamento/`workflow_dispatch`.
