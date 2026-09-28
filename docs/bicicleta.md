# A bicicletinha da menina

Um passeio de bicicleta que sai da porta da casa verde e cresce devagar: cinco rotas do
condomínio, cada uma com seu chão, seus bichos e alguém da família esperando no fim. É quase
outro jogo dentro do jogo, para ela entrar de vez em quando e encontrar um caminho novo. Este é
o estudo; as telas, com o passeio simulado (toque no céu para pular, na frente dela para
acelerar, atrás dela para frear, nela para abaixar) e o kit de obstáculos desenhado no traço
Aquarela e Lápis, estão em `docs/referencia/bicicleta.html`. Nada aqui é código do jogo.

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

## Os gestos

Quatro, cada um num lugar da tela, e cada um chega com a coisa do chão que dá motivo para ele.
Quem só sabe pular passa por tudo mesmo assim.

| Gesto | Onde se toca | Quando entra | O motivo |
|---|---|---|---|
| Pular | No céu (no primeiro passeio, a tela inteira) | Desde o começo | Lombadinha, tronco, gambá. O pulo procura o obstáculo até 0,7 s antes, como no Jardim. Longe de tudo: pulinho e campainha. |
| Acelerar | Na frente dela, toque repetido | 3º passeio bom da rua | A rampinha: acelera antes e voa alto, com giro e centelhas. Na subida, é a pedalada com força, como o impulso do balanço. |
| Frear | Atrás dela | Bosque, com o gambá | Frear é escolher esperar: o gambá atravessa com os filhotes, ela segue. Marca no chão e "shhh". |
| Abaixar | Nela mesma | Bosque, com o galho baixo | O galho. Sem abaixar, "toc" no capacete e duas folhas no cabelo. |

A velocidade tem inércia: o chão puxa para um ritmo de base (areia e pedregulho puxam para
baixo, a descida empurra para cima), a pedalada soma de uma vez e a freada tira. Sem toque ela
nunca para (mínimo de 30%) e nunca dispara (máximo de duas vezes). Um toque no ar, num voo
alto, é um giro.

## As telas

| Tela | O que ela faz | Aprende | Custa | A família |
|---|---|---|---|---|
| 1. A saída | Toca no capacete (põe), toca na bicicleta (sobe). O coelhinho pula na cestinha. O mapinha mostra a rota de hoje e as abertas. | A ordem de sair de casa; escolher o caminho num mapa | Uma cena nova fora da porta | A mãe na porta: "Boa viagem!" |
| 2. O passeio | Ela pedala sozinha na faixa do meio. Os quatro gestos acima. Cada obstáculo responde do seu jeito se o gesto não vier, e nada dói: a poça desliza e dá uma aceleradinha, a lombadinha dá um "tum", o tronco faz ela parar e passar a bicicleta por cima, o gambá atravessa e ela espera. | A hora certa; esforço na subida e descanso na descida; esperar (o gambá) e insistir (o tronco); gestos que moram em lugares diferentes | O motor: chão como função de altura, velocidade com inércia, o pulo do Jardim, as reações, a ajuda | Ninguém empurra |
| 3. O kit do caminho | Lombadinha, poça, rampinha, tronco caído, gambá com filhotes, galho baixo, morrinhos em cadeia, pedregulhos, areia funda (em trechos, intercalada), ponte de tábuas. | Cada coisa do chão pede um gesto | Dez desenhos e dez reações | |
| 4. As rotas | A rua (padaria, a mãe), o bosque (lago, o pai), os morrinhos (a avó, se houver; até lá a mãe), o atalho do parquinho (tudo misturado em trechos curtos, o irmão), a volta grande (a família na porta). Uma abre a cada três passeios na anterior. | Lugares do condomínio dela | Dado: `rotas.json` | Quem espera no fim, de corpo inteiro, acenando |
| 5. A progressão | Ritmo +4% por passeio bom (teto 30%); um obstáculo a cada 4, 3, 2 compassos nos degraus 0, 3, 6; um tipo novo e um gesto novo a cada dois passeios bons, sempre sozinhos e com a mãozinha; volta um degrau com duas A2. A janela do pulo não muda. | Fica mais difícil devagar, sem nível na tela | Dado: `BICICLETA` | Os pais veem no cantinho |
| 6. A chegada | Freia (ela ou a criança), desce e abraça quem esperava. A lira sobe, centelhas, palmas, e a frase na voz gravada de quem espera; sem gravação, só a festa. Volta pelo mesmo caminho, a família na porta, a casinha acende. A rota se desenha a lápis no mapa da parede do quarto; na primeira chegada de cada rota, um enfeite para a bicicleta (cestinha, bandeirinha, fitas, campainha, buzina). | Ir até alguém é o motivo de sair; o jogo olha para a vida dela | Mapa na parede, cinco enfeites, a roda e o convite | "Você veio de bicicleta até aqui!"; na roda, "Você andou de bicicleta?"; na despedida, "Vamos andar de bicicleta de verdade?" |

## Os morrinhos

Morrinho após morrinho, cada um mais alto (três numa cadeia), e a rota acaba numa descida
grande e comprida. Na subida ela vai perdendo velocidade e cada toque na frente é uma pedalada
com força. Se chega rápido na crista, decola e voa; quanto mais força embaixo, mais alto em
cima. Sem toque ela sobe devagarinho igual e não voa. A descida grande vai sozinha, com o
cabelo para trás e o "uuuh" da lira. Em dados: `gravidade`, `decolagem`.

## Decisões de desenho

- Fora da porta, pela bicicletinha encostada no muro do quintal, ao lado do balancinho. Abre na
  etapa 3, com a árvore e a horta.
- Quem faz é ela. Ninguém segura, ninguém empurra. A família espera no fim e recebe na porta.
  O irmão aparece uma vez, acenando da gangorra.
- Um gesto, depois quatro, um por vez e cada um com motivo. Se o teste com ela mostrar que
  quatro é demais, frear e abaixar esperam: com pular e acelerar a fase inteira funciona.
- Rampinha voa com a velocidade; poça desliza e acelera; pedregulho não pede nada, só treme;
  ponte é música. Areia é trecho curto no meio das rotas, nunca rota própria.
- Rota é dado. O motor é um só, parente do Jardim; uma rota nova custa uma lista.
- A voz do fim é gravada ou não é. A voz do aparelho numa festa soa robótica e triste; sem
  gravação, a chegada tem lira, centelhas e palmas, e o balão traz a frase para quem lê.
- Enfeite não é pagamento: um por rota, na primeira chegada, no máximo cinco. Sem boneca: a
  boneca é das aventuras de bailarina.
- Música por rota no piano Salamander: Grieg, *Manhã* (a rua); Beethoven, *Pastoral* (o
  bosque e os morrinhos); Schubert, *A Truta* (o atalho); a *Manhã* mais devagar na volta grande.

## Ordem proposta

1. A saída, a rua com lombadinha, poça, rampinha e o acelerar, a chegada na padaria com a
   mãe, a volta, o mapa na parede, a pergunta na roda e o convite. Já é jogável e já cresce.
2. O bosque (tronco, gambá e o frear, galho e o abaixar, a areia intercalada) e a progressão
   completa.
3. Os morrinhos em cadeia com a decolagem e a descida grande, a ponte, o atalho do parquinho,
   a volta grande com o céu que muda.

Onde viveria: `src/core/bicicleta.ts` (chão, velocidade, pulo e progressão, puro e testado),
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
6. Quatro gestos cabem nela, um de cada vez? Se confundir a frente com o atrás, frear e
   abaixar esperam.

## O que mudou depois da primeira leitura

O pai jogou o simulador e pediu: acelerar e frear além de pular; a rampinha da rua estava
sem graça; passar direto na poça devia deslizar e dar uma aceleradinha; areia intercalada nas
rotas, não uma rota só de areia; o gambá às vezes não reagia (o pulinho da campainha e o "tum"
da lombadinha contavam como pular por cima; agora só um pulo de verdade conta); a voz
sintética do fim soava robótica e triste (saiu; ficou a festa e a voz gravada); é bom ver a
mãe ou o pai no fim (agora sempre alguém de corpo inteiro); os morrinhos em cadeia, pedalando
mais forte para subir mais alto, com descidas grandes. Tudo isso entrou acima.

## O que entrou no jogo

Tudo o que está acima, numa rodada só, menos o mapa da parede do quarto (fica para a próxima):
`src/core/bicicleta.ts` (o chão, a velocidade com inércia, o pulo, as rotas e a progressão, puro
e testado em `tests/bicicleta.test.ts`), `src/data/rotas.json` (as cinco rotas em dados),
`src/puppet/bicicleta.ts` (a bicicleta com a menina sentada na marionete, o capacete, os
enfeites, o gambá), `src/telas/bicicleta.ts` (a saída em SVG e o passeio em Canvas 2D, com os
quatro gestos por lugar da tela, a ida, a chegada com quem espera, a volta e a família na porta),
a bicicletinha no quintal (`casa.ts`), a pergunta da roda (`roda.ts`), o convite da despedida
(`despedida.ts`), as frases, a narração, a ajuda das telas e a *Manhã* do Grieg. As decisões
estão em `docs/decisoes.md`, seção "A bicicletinha".
