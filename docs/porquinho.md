# O porquinho de mola

A Stella adora se balançar no porquinho de mola do condomínio. Este é o estudo de como
levar isso para o jogo. As telas, com a mola simulada para brincar no celular, estão em
`docs/referencia/porquinho.html`. Nada aqui é código do jogo.

## O que o brinquedo de verdade já ensina

Corpo (equilíbrio, tronco, vestibular), causa e efeito (empurrão forte, balanço grande;
parou de se mexer, o balanço morre), ritmo (a mola tem o tempo dela) e contar com o corpo.
PORQUINHO ainda não cabe nas letras dela, mas MOLA cabe e já está em `palavras.json`.

## As quatro alternativas

| Tela | O que ela faz | Aprende | Custa | Quando |
|---|---|---|---|---|
| 1. Balançar | Arrasta e solta, ou toca de um lado para empurrar. Uma nota da lira por passagem pelo meio. Morre sozinho. | Causa e efeito, a hora de empurrar | Uma tela nova, a mola, o porquinho e a Stella montada | Livre no quintal; quinta junto com a areia |
| 2. No ritmo | O coelhinho pula a cada dois tempos a 100 bpm, no período da mola. Empurrar junto com o pulo dobra o empurrão e sobem centelhas. | Pulsação, antecipar | Tela 1 mais a lira no relógio do áudio e a janela do toque (0,36 s) | Sexta, o dia da música |
| 3. Contar | Cada volta completa com balanço grande solta uma pedrinha para um pote, com tique e a voz contando até cinco. No cinco, centelhas, e o pote esvazia. | Um a um, a sequência até cinco | Tela 1 mais o pote e as vozes dos números | Livre |
| 4. Lá fora | Na despedida, o convite: "Vamos balançar no porquinho de verdade?". Na roda seguinte, "Você balançou no porquinho?". A lembrança é um porquinho de madeira na mesa da estação. | O jogo olha para a vida dela | Só dado: frases, um objeto na roda, uma figura na mesa | Despedida e roda |

## Decisões de desenho

- A mola é um oscilador amortecido, não animação: período de 1,2 s, perde metade do balanço
  em uns sete ciclos. Tocar de um lado empurra para o outro; empurrar contra freia, e isso é
  física, não erro.
- Nada pisca mais de uma vez por segundo: o pulo do coelhinho é a cada 1,2 s. O relógio da
  tela 2 é o áudio, como no Jardim.
- Na tela 3 não aparece número escrito: ela vê o pote encher. Os números são palavras
  inteiras, então a voz do aparelho pode dizê-los enquanto a família não grava.
- O porquinho é rosa por enquanto; segue a cor do de verdade.

## Ordem proposta

4 e 1 na mesma rodada; 3 na seguinte, porque contar é o que a escola vai pedir; 2 por
último, e só se o balanço virar coisa que ela procura no jogo.

## Perguntas para a família

1. De que cor é o porquinho de verdade, e tem alça na cabeça?
2. Ela se balança sozinha ou alguém empurra? Se sozinha, a tela 1 pode ficar só com arrastar e soltar.
3. O Theo balança junto ou fica perto?
4. Contar até cinco ou até dez?
5. Onde o porquinho mora no jogo: no quintal da casa ou fora da porta, no condomínio?
