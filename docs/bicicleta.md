# A bicicletinha da Stella

Um passeio de bicicleta que sai da porta da casa verde e cresce devagar: cinco rotas do
condomínio, cada uma com seu chão, seus bichos e alguém da família esperando no fim. É quase
outro jogo dentro do jogo, para ela entrar de vez em quando e encontrar um caminho novo. Este é
o estudo; as telas, com o passeio simulado (toque para pular, toque embaixo para abaixar,
toques seguidos na subida para pedalar) e o kit de obstáculos desenhado no traço Aquarela e
Lápis, estão em `docs/referencia/bicicleta.html`. Nada aqui é código do jogo.

## De onde vem

Dos jogos de moto e bicicleta do Atari, do Master System e do Nintendo, passados pelas regras
da casa. O que fica de cada um:

| Jogo | O que fica | O que sai |
|---|---|---|
| Excitebike (Nintendo, 1984) | A rampa que joga para o ar, o corpo que inclina no voo. E o editor de pista: cada rota aqui é dado. | O motor que esquenta, a corrida, o tempo. |
| Enduro (Activision, 1983) | O céu que muda enquanto se anda: na rota longa, da manhã ao fim da tarde. | A cota de carros por dia. |
| Kikstart 2 (Mastertronic, 1987) | O vocabulário do chão: lombadinha, poça, rampinha, tronco, areia, pedregulho, morrinho. Cada um pede um gesto diferente. | O relógio e a queda. |
| Paperboy (Atari Games, 1985) | A bicicleta no lugar onde ela mora, com os bichos de todo dia. As três ruas viram o mapa do condomínio. | Pontos, batidas, vizinhos bravos. |
| Alto's Adventure (2015) | Um toque só, curvas suaves, calma. A dificuldade pode vir do ambiente sem mudar o gesto. | O sem fim: todo passeio chega em algum lugar. |

Da pesquisa de progressão: uma coisa nova de cada vez, apresentada sozinha, com uma folga antes
de subir de novo; acertar quase sempre (os jogos de aprendizagem com crianças ficam perto de
80% de acerto); ajustar para os dois lados em silêncio.

## As telas

| Tela | O que ela faz | Aprende | Custa | A família |
|---|---|---|---|---|
| 1. A saída | Toca no capacete (põe), toca na bicicleta (sobe). O coelhinho pula na cestinha. O mapinha mostra a rota de hoje e as abertas. | A ordem de sair de casa; escolher o caminho num mapa | Uma cena nova fora da porta | A mãe na porta: "Boa viagem, Stella!" |
| 2. O passeio | Ela pedala sozinha na faixa do meio. Toque = pulo (procura o obstáculo até 0,7 s). Toque embaixo = abaixar (só no bosque). Toques seguidos na subida e na areia = pedalar com força. Cada obstáculo responde do seu jeito se o gesto não vier, e nada dói. | A hora certa; esforço na subida; esperar (o gambá) e insistir (o tronco); dois gestos que não se confundem | O motor: chão como função de altura, o pulo do Jardim, as reações, a ajuda | Ninguém empurra |
| 3. O kit do caminho | Lombadinha, poça, rampinha, tronco caído, gambá com filhotes, galho baixo, morrinho, pedregulhos, areia funda, ponte de tábuas. | Cada coisa do chão pede um gesto | Dez desenhos e dez reações | |
| 4. As rotas | A rua (padaria), o bosque (lago), os morrinhos (avó), o caminho de areia (parquinho), a volta grande (casa). Uma abre a cada três passeios na anterior. | Lugares do condomínio dela | Dado: `rotas.json` | Quem espera no fim |
| 5. A progressão | Ritmo +4% por passeio bom (teto 30%); um obstáculo a cada 4, 3, 2 compassos nos degraus 0, 3, 6; um tipo novo a cada dois passeios bons, sempre sozinho e com a mãozinha; volta um degrau com duas A2. A janela do pulo não muda. | Fica mais difícil devagar, sem nível na tela | Dado: `BICICLETA` | Os pais veem no cantinho |
| 6. A chegada | Freia sozinha, abraça quem esperava, volta pelo mesmo caminho, a família na porta, a casinha acende. A rota se desenha a lápis no mapa da parede do quarto; na primeira chegada de cada rota, quem esperava dá um enfeite para a bicicleta (cestinha, bandeirinha, fitas, campainha, buzina). | Ir até alguém é o motivo de sair; o jogo olha para a vida dela | Mapa na parede, cinco enfeites, a roda e o convite | "Você veio de bicicleta até aqui!"; na roda, "Você andou de bicicleta?"; na despedida, "Vamos andar de bicicleta de verdade?" |

## Decisões de desenho

- Fora da porta, pela bicicletinha encostada no muro do quintal, ao lado do balancinho. Abre na
  etapa 3, com a árvore e a horta.
- Quem faz é ela. Ninguém segura, ninguém empurra. A família espera no fim e recebe na porta.
  O Theo aparece uma vez, acenando da gangorra.
- A velocidade é constante e ela não freia. Frear e acelerar seriam mais dois gestos.
- Um toque, depois dois. Pular desde o começo; abaixar só no bosque, depois de ela pular bem,
  com a divisão de tela do palco (em cima, embaixo). Pedalar é toque repetido, como no balanço.
- Rampinha lança sozinha; pedregulho não pede nada, só treme; ponte é música.
- Rota é dado. O motor é um só, parente do Jardim; uma rota nova custa uma lista.
- Enfeite não é pagamento: um por rota, na primeira chegada, no máximo cinco. Sem boneca: a
  boneca é das aventuras de bailarina.
- Música por rota no piano Salamander: Grieg, *Manhã* (a rua); Beethoven, *Pastoral* (o
  bosque e os morrinhos); Schubert, *A Truta* (a areia); a *Manhã* mais devagar na volta grande.

## Ordem proposta

1. A saída, a rua com lombadinha, poça e rampinha, a chegada na padaria, a volta, o mapa na
   parede, a pergunta na roda e o convite. Já é jogável e já cresce.
2. O bosque (tronco, gambá, galho e o gesto de abaixar) e a progressão completa.
3. Os morrinhos com o pedalar e a ponte, o caminho de areia, a volta grande com o céu que muda.

Onde viveria: `src/core/bicicleta.ts` (chão, pulo e progressão, puro e testado),
`src/telas/bicicleta.ts` (a cena, em Canvas 2D como o Jardim), `src/data/rotas.json`, o
objeto no quintal em `casa.ts`, a roda, a despedida, `frases.json` e `narracao.json`.

## Perguntas para a família

1. A bicicletinha de verdade: cor, com ou sem rodinhas, cor do capacete. Aqui está rosa com
   rodinhas e capacete rosa-claro.
2. Tem uma avó por perto para esperar no fim dos morrinhos? A palavra AVÓ já está no caderno.
3. O que o condomínio tem de verdade: padaria, lago, bosque, morro, areia? As rotas seguem o
   passeio de verdade, para o convite da despedida funcionar.
4. O gambá pode ser gambá (o marsupial, com os filhotes nas costas)? Se ela conhece outro bicho
   do condomínio, o bicho que atravessa pode ser esse. TATU já é palavra do jogo.
5. Ela já pedala na subida ou desce e empurra? Se empurra, a subida do jogo pode ser isso.
