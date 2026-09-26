# Little Star

A casa verde da Stella: um jogo de celular para 5 anos, irmão pequeno do
[Ponta](https://github.com/anderson-nielson/grande-ballet). Sem texto para ler,
sem pontos, sem vida, sem relógio. A família recebe, a Stella conta o que fez de
verdade, aprende uma letra pelo som e pela imagem, brinca na areia, no piano e
no jardim, vai ao parquinho do condomínio, cuida do gatinho e do coelhinho, e a
família se despede com um convite para o mundo.

- `SPEC.md`: o que existe no jogo e por quê.
- `GAMEPLAY.md`: como se joga, toque a toque, e o laço de cada sessão.
- `docs/decisoes.md`: as decisões tomadas para a v1, com o que muda na SPEC e no GAMEPLAY.
- `docs/revisao-gameplay.md`: a revisão que antecedeu o código.
- `docs/referencia/little-star-telas.html`: as cinco telas desenhadas antes do código.
- `docs/parquinho.md` e `docs/referencia/parquinho.html`: o parquinho do condomínio (balanço, escorregador e gangorra), a volta dela em cinco telas com os brinquedos simulados.
- `docs/shots/`: capturas do passeio automático.

## Rodar

```
npm install
npm run dev          # http://localhost:5173/little-star/
npm test             # vitest: laço, relógio, fita, jardim, dados, estado
npm run build        # tsc + vite + PWA
npm run e2e          # passeio de fumaça no Chromium, capturas em docs/shots/
```

Atalhos de depuração: `?debug=1&zerar=1&sessoes=8&hora=15:00&tela=jardim` e
`?styleguide=1` (a marionete, os bichos, as figuras e as cores).

## Publicado

O jogo vive em https://anderson-nielson.github.io/little-star/ e toda rodada de
desenvolvimento chega lá sozinha. O ciclo é sempre o mesmo:

1. A rodada acontece num branch e vira uma pull request para `main`.
2. `.github/workflows/ci.yml` roda lint, teste e build na PR. Vermelho não entra.
3. A PR entra em `main` e `.github/workflows/pages.yml` confere tudo de novo,
   monta o jogo, publica no GitHub Pages e depois lê `versao.txt` no ar até
   encontrar o sha do commit que acabou de entrar. Se não encontrar em dois
   minutos, o workflow fica vermelho em vez de fingir que publicou.

O mesmo sha aparece no cantinho dos pais ("Little Star abc1234"), então dá para
conferir no celular qual rodada está instalada. Se algum dia o Pages precisar
ser publicado na mão, o `pages.yml` aceita `workflow_dispatch` na aba Actions.
O site do Pages precisa existir com a fonte "GitHub Actions" em Settings >
Pages; o token do workflow não consegue criá-lo sozinho.

## Regras da casa

As mesmas do Ponta, resumidas para este jogo:

1. Toda cor, tamanho, raio e duração vem de `src/ui/tokens.css`.
2. Sem engine, sem framework, sem lib. Vite + TypeScript strict, DOM e SVG para a casa, Canvas 2D para o caderno, a areia e o jardim, Web Audio para todo som. O único áudio gravado é o piano Salamander (CC BY 3.0) e as vozes que a família grava no próprio aparelho.
3. Conteúdo é dado: letras, palavras, sons, frases, comidas e músicas vivem em `src/data/`.
4. O relógio mestre é o áudio (`audio.agora()`); nunca `setTimeout` para tempo musical.
5. Nada é errado. Toque em algo que não faz nada ganha um sininho baixinho. Falhar não existe: tem "de novo", e de novo é divertido.
6. Alvos de 72 px, um dedo só, borda de 24 px morta, uma ação por vez, toque vale ao soltar.
7. Nada pisca mais de uma vez por segundo. Só `transform` e `opacity` em tempo real. Sem `blur`.
8. Sem texto para ela ler. O texto do jogo está no cantinho dos pais e no balão de narração do topo, que é para quem joga junto ler em voz alta para ela (e se desliga no cantinho).

Piano: Salamander Grand Piano V3, de Alexander Holm, CC BY 3.0 (`public/piano/CREDITOS.txt`).
