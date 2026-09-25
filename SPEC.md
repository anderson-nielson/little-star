# Little Star: especificação (rascunho v0)

> Jogo para a Stella, 5 anos. Irmão pequeno do **Ponta** (`anderson-nielson/grande-ballet`):
> mesma família visual, mesmo piano, outro jogo. Este documento é o ponto de partida
> para conversar. Nada de código ainda. As perguntas abertas estão na seção 11.

Sumário
1. Para quem é
2. A ideia em uma frase
3. O que herdamos do Ponta
4. O que muda para 5 anos
5. Estética
6. Música
7. As fases
8. Controles
9. Progressão e recompensa
10. Stack e arquitetura
11. Perguntas abertas
12. Fora de escopo

---

## 1. Para quem é

A Stella tem 5 anos. Isso decide quase tudo:

- **Ainda não lê** (ou lê pouco). Nenhuma instrução pode depender de texto. Tudo se entende por
  imagem, movimento e som. Texto na tela só como enfeite ou para o adulto.
- **Dedo grande, mão pequena.** Alvos de toque de no mínimo 64 px (o Ponta usa 48). Nada de
  gesto fino, nada de dois dedos, nada de segurar e arrastar com precisão.
- **Atenção de 2 a 4 minutos por fase.** A fase termina antes de cansar.
- **Frustração custa caro.** Não existe perder. Cair no lago é mergulho engraçado e volta.
- **Joga no celular ou tablet da família**, provavelmente no colo de alguém, às vezes sem som.

## 2. A ideia em uma frase

Uma bailarina pequena atravessa um mundo de balé em fases curtas que lembram jogos do Atari
(Pitfall, Donkey Kong, Frostbite, Freeway), tudo no ritmo de música erudita tocada ao piano,
e cada fase acaba num pequeno palco onde ela faz uma reverência.

## 3. O que herdamos do Ponta

Reaproveitar tudo o que já foi medido e acertado lá. Copiar os módulos, não depender do repo.

| Do Ponta | Uso aqui |
|---|---|
| `src/ui/tokens.css` | Base das cores, tipos e durações. Mesma regra: nenhum hex fora dos tokens. |
| Marionete por dados (`src/puppet`, SPEC do Ponta seção 11) | A Stella é desenhada pelo mesmo sistema: membros afilados, tutu em prato com fio de ouro, coque. Ganha proporção de criança (cabeça maior, pernas mais curtas). |
| Stella em `characters.json` | Pele `#F2D5BC`, cabelo `#D9AE68`, collant `#F2A9C4`, tutu `#F7C3D8`, sapatilha `#EFB9CE`, coque liso. A mesma Stella, versão pequena. |
| Piano Salamander (`public/piano/`, `src/audio/piano.ts`) | As 21 amostras, CC BY 3.0, com o sintetizador de reserva enquanto carregam. |
| Sequenciador (`src/audio/sequencer.ts`) e formato de música em JSON | Mesmo formato `melodia` / `baixo` em notação `C5:1`. Relógio mestre é o áudio. |
| Respostas sonoras (`src/audio/respostas.ts`) | Sininho no tom da música para cada coisa boa. |
| Centelha de quatro pontas | É a estrela do título. A Stella coleta centelhas. |
| Arco do proscênio | Moldura de cada fase e do palco final. |
| Regras de performance | Só `transform` e `opacity`, sem `blur`, sem alocação por quadro, DPR até 2. |
| PWA offline, retrato | Igual: instala, abre em modo avião. |

## 4. O que muda para 5 anos

| No Ponta | No Little Star |
|---|---|
| Visual novel, texto, escolhas | Nenhuma leitura necessária. Personagens falam por gesto, som e, se quisermos, voz gravada do papai ou da mamãe (seção 11). |
| Nota Brava / Bom / Quase / Escapou | Sem nota. Só coisas boas acontecem mais ou menos. Centelhas coletadas. |
| Termos franceses em itálico | Alguns passos aparecem como animação (a Stella pula num *sauté*, gira num *piqué*), sem nome na tela. |
| Palco escuro como ambiente principal | Mais **dia** e **rosa** que noite. O palco escuro vira o final de cada fase, o momento especial. |
| Janela de ritmo de ±90 a ±300 ms | Ritmo é bônus, nunca exigência. Pular no tempo da música dá brilho extra; pular fora do tempo funciona igual. |
| Sessões de 3 a 5 minutos, rotina semanal | Fases de 1 a 3 minutos. Sem calendário, sem energia, sem gestão. |

## 5. Estética

Mesmas formas, mesma família de cores, um pouco mais de luz e de rosa.

**Princípios mantidos**
- Fio no lugar de caixa. Filete de 1 a 2 px, nada de cartão com sombra.
- Arco do proscênio como único ornamento.
- Ouro só como linha e ponto de luz. Centelha de quatro pontas, nunca ★, nunca emoji.
- Cormorant Garamond para o título e os números; Jost para qualquer rótulo.
- Zero imagem raster. Tudo SVG e Canvas 2D gerados por código.

**Ajustes para a idade**
- **Ambiente principal: dia.** `--dia-alto` e `--rosa` como fundo das fases, com `--rosa-doce`
  (`#F2A9C4`, a cor da Stella) mais presente. Proporção sugerida: Rosa e dia 50%, Marfim 20%,
  Mata 10% (jardim e lago), Noite 10% (palco final), Veludo 6%, Ouro 4%.
- **Formas maiores e mais redondas.** A Stella ocupa uns 20% da altura da tela (no Ponta a
  figura é esguia e distante). Obstáculos com silhueta clara e reconhecível.
- **Contraste alto nos objetos que importam.** O que se pode tocar ou pegar tem contorno de
  `--luz` ou `--ouro`, como a protagonista do Ponta no palco escuro.
- **Novos tons, se precisar**, entram como token: um azul de lago (derivado do `--noite-alta`
  clareado) e um verde folha (derivado do `--mata-2`). Justificar no commit, como no Ponta.

**Personagens de apoio (ideias, todos desenhados pela mesma marionete ou por SVG simples)**
- Um cisne amigo que carrega a Stella no lago.
- Ratinhos do Quebra-Nozes, travessos e nunca malvados, no papel do "Donkey Kong".
- Uma fada (Açucarada) que acende as luzes do palco no fim de cada fase.

## 6. Música

Música erudita de balé, em domínio público, tocada "bem tocadinha" pelo piano Salamander:
melodia na mão direita, baixo simples na esquerda, andamento tranquilo. Mesmo formato JSON do
Ponta (`id`, `titulo`, `compositor`, `obra`, `tom`, `bpm`, `compasso`, `melodia`, `baixo`).

O Ponta já tem, prontos para reaproveitar: **Tema dos cisnes** (Tchaikovsky, 72 bpm),
**Marcha dos soldadinhos** (inspirada no Quebra-Nozes, 112 bpm), **Valsa das dríades**,
**Sonho do Cupido**, **Gymnopédie nº 1** (Satie), **Sonata fácil** e **Marcha turca** (Mozart).

Repertório proposto, uma música por fase:

| Fase | Música | Por quê |
|---|---|---|
| Jardim (Pitfall) | Tchaikovsky, *Valsa das Flores* (O Quebra-Nozes) | Valsa leve, dá vontade de pular |
| Escadaria (Donkey Kong) | Tchaikovsky, *Marcha* (O Quebra-Nozes) ou a Marcha dos soldadinhos do Ponta | Marcha para subir degrau por degrau |
| Lago (Frostbite / Freeway) | Tchaikovsky, *Dança dos pequenos cisnes* (O Lago dos Cisnes) | Quatro cisnes de braço dado, ritmo saltitante e reconhecível |
| Palco final | Tchaikovsky, *Dança da Fada Açucarada* (O Quebra-Nozes) | A música mais "caixinha de música" do repertório |
| Tela de título | Brahms, *Canção de ninar*, ou *Brilha, brilha estrelinha* (Mozart, variações K. 265) | O título é "Little Star": a estrelinha fecha a conta |

Regras de som:
- O piano toca sempre. Efeitos (pulo, centelha, splash) são sintetizados, no tom da música,
  como as respostas do Ponta.
- Nenhum som assustador, nenhum "game over" sonoro. Cair na água é um *plop* com risadinha de nota
  descendo e subindo.
- Pulo no tempo forte ganha um acorde a mais. É o único lugar em que o ritmo aparece.
- Volume baixo por padrão. O jogo funciona inteiro no mudo.

## 7. As fases

Quatro mundos na v1. Cada um é uma tela horizontal que rola devagar, 1 a 3 minutos, com o palco
no fim. Nenhuma fase tem vida, relógio ou "perdeu".

### 7.1 O Jardim (inspirado em Pitfall)
A Stella corre sozinha para a direita pelo jardim do teatro. Obstáculos: poças, pedrinhas, um
tronco. **Toque = pular** (um *sauté*). Fitas de cetim penduradas nas árvores servem de cipó:
tocar perto dela faz a Stella se pendurar e balançar sobre um laguinho (o crocodilo do Pitfall
vira um sapo de coroa que só olha). Centelhas no ar, no alto de cada pulo.
Tropeçou? Ela senta, ri, levanta. O jogo nunca volta para trás.

### 7.2 A Escadaria (inspirado em Donkey Kong)
Andaimes e escadas dos bastidores. No alto, um ratinho do Quebra-Nozes rola novelos de lã
(no lugar dos barris). A Stella sobe andares; **toque = pular o novelo**, as escadas ela sobe
sozinha quando chega nelas. No alto, em vez de resgatar alguém, ela ganha a coroa do ratinho,
que vira amigo e dança junto no palco.
Novelo pegou? Ela vira uma bolinha de lã, rola, desenrola e continua no mesmo andar.

### 7.3 O Lago dos Cisnes (inspirado em Frostbite e Freeway)
Atravessar o lago de baixo para cima pulando em vitórias-régias e cisnes que nadam em faixas,
cada faixa num sentido e numa velocidade. **Toque na metade de cima = pular para a frente**,
metade de baixo = voltar. Cada travessia acende uma parte de um coreto do outro lado (o iglu do
Frostbite vira o coreto). Três travessias e o coreto fica pronto.
Caiu na água? O cisne amigo a pesca no bico e devolve na margem, sem perder o que já acendeu.

### 7.4 O Palco (recompensa, não desafio)
Fim de cada fase. Cortina de veludo abre, luz de ribalta, fundo `--noite`. A Stella faz uma
pequena coreografia automática com a música da fase; a criança pode tocar para ela girar ou
pular a qualquer momento (e sempre dá certo). Termina em reverência, aplauso sintetizado e as
centelhas coletadas subindo para o céu do palco.

## 8. Controles

- **Um toque, uma ação.** Toque em qualquer lugar da tela. Nada de botão virtual pequeno.
- A Stella anda sozinha. A criança só decide quando pular (e, no lago, para onde).
- Toque durante o pulo é ignorado com carinho (sem pulo duplo acidental).
- Janela generosa: o pulo "procura" o obstáculo. Se o toque vier até ~400 ms antes, conta como
  pulo certo. A medida real vem do teste com a Stella (Ponta, regra 18: medir antes de mexer).
- Sem botão de pausa visível durante a fase. Pausa automática ao sair do app. Um botão de adulto
  (segurar 2 segundos no canto) abre as opções.

## 9. Progressão e recompensa

- As quatro fases aparecem num mapa-programa, como a lista de um programa de teatro, mas com
  desenhos em vez de texto. Todas liberadas desde o início, ou uma libera a outra (seção 11).
- **Centelhas** são a única moeda. Juntadas, acendem estrelas no céu da tela de título: o céu
  da Stella vai ficando cheio com o tempo.
- **Figurinos**: a cada tantas centelhas, um tutu novo (cor do collant, do tutu e um enfeite de
  cabeça, igual ao sistema de figurino do Ponta). A Stella escolhe antes de cada fase.
- Nenhuma loja, nenhum anúncio, nenhuma compra, nenhum placar.

## 10. Stack e arquitetura

Igual ao Ponta, para dividir código e cuidado:
- Vite + TypeScript strict, Canvas 2D para as fases, DOM e SVG para menus. Sem engine, sem lib.
- Web Audio, relógio mestre no `AudioContext`. Piano Salamander em `public/piano/`.
- Conteúdo em `src/data/`: fases (obstáculos, faixas, velocidades), músicas, figurinos.
  Criar fase nova não pode exigir código.
- PWA offline, retrato, `100dvh`, `--fundo-seguro`.
- Save em `localStorage` (centelhas, figurinos, fases vistas). Um só perfil.
- Testes: Vitest para a física das fases e o sequenciador; um robô que joga cada fase até o fim
  sem tocar (a fase precisa terminar mesmo assim) e tocando (precisa coletar mais).
- Publicado no GitHub Pages, como o Ponta.

## 11. Perguntas abertas

1. **Nome.** "Little Star" em inglês na tela, ou "Estrelinha" / "Pequena Estrela"?
2. **Voz.** Gravar a voz de alguém da família para os poucos momentos falados ("Pula!", "Brava!")?
   Seria o segundo arquivo de áudio além do piano; no Ponta isso exigiria rever a regra 2.
3. **Orientação.** Retrato como o Ponta, ou paisagem, que é mais natural para jogo de plataforma
   e para tablet?
4. **Liberação.** Todas as fases abertas desde o começo, ou uma de cada vez?
5. **Leitura.** A Stella já reconhece letras? Vale colocar o nome dela na tela de título.
6. **Quarta fase de desafio.** Freeway puro (atravessar a rua de carrinhos até o teatro) ou
   fundimos com o lago como está acima?
7. **Música do título.** *Brilha, brilha estrelinha* (Mozart) ou algo do repertório de balé?

## 12. Fora de escopo (v1)

Texto necessário para jogar, visual novel, nota, vidas, tempo-limite, placar, multijogador,
compras, anúncios, conta ou login, qualquer mecânica sobre corpo ou peso.
