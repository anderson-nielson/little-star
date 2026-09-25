# Little Star: especificação (rascunho v1)

> Jogo para a Stella, 5 anos. Irmão pequeno do **Ponta** (`anderson-nielson/grande-ballet`):
> mesma família visual, mesmo piano, outro jogo. Este documento é o ponto de partida
> para conversar. Nada de código ainda. As perguntas abertas estão na seção 14.

Sumário
1. Para quem é
2. A ideia em uma frase
3. Os três pilares: amada, serena, reconhecida
4. A família no jogo
5. A casa e o quarto rosa
6. O dia da Stella (as tarefas de verdade)
7. Piano, ukulele e bonecas
8. As aventuras
9. Controles
10. Estética
11. Música
12. O que herdamos do Ponta
13. Stack e arquitetura
14. Perguntas abertas
15. Fora de escopo

---

## 1. Para quem é

A Stella tem 5 anos. É pequena e loirinha, ama rosa (ama, ama, ama), toca piano e ukulele
(rosa), e tem muitas bonecas. A mãe é a Andrea, o pai é o Anderson, o irmão é o Theo.

Isso decide quase tudo:

- **Ainda não lê** (ou lê pouco). Nada no jogo depende de texto. Tudo se entende por imagem,
  movimento, som e voz.
- **Dedo grande, mão pequena.** Alvos de toque de no mínimo 64 px. Nada de gesto fino.
- **Atenção curta.** Cada atividade fecha em 1 a 3 minutos.
- **Não existe perder.** Cair é engraçado e volta. Nunca bronca, nunca som de erro.
- **Joga no celular ou tablet da família**, muitas vezes no colo de alguém.

## 2. A ideia em uma frase

A Stella mora numa casinha rosa com a mãe, o pai e o Theo. Dali ela sai para pequenas
aventuras de bailarina que lembram os jogos do Atari, volta para casa, é recebida com carinho,
e cada coisa boa que ela faz no dia de verdade aparece no quarto dela no jogo.

## 3. Os três pilares: amada, serena, reconhecida

Toda decisão de design passa por estas três perguntas.

**1. Ela se sente amada?**
A família está em todo lugar: recebe na porta, assiste no palco, comemora cada tarefa, dá boa
noite. O carinho não é prêmio por desempenho. Ele está lá sempre, faça ela o que fizer no jogo.
O que ela faz ganha comemoração; o que ela não faz não tira nada.

**2. Ela fica serena?**
Nada corre atrás dela. Sem relógio, sem vida, sem pressa, sem susto, sem som alto. Cores
suaves, piano calmo, transições lentas. O jogo acalma em vez de agitar: termina cada sessão
mais tranquila do que começou, e à noite ajuda a ir dormir (seção 6.3).

**3. Ela se sente reconhecida pelas coisas simples?**
Arrumar a cama, escovar os dentes, ser gentil. Cada uma tem um momento no jogo em que alguém da
família nota, agradece e algo bonito aparece no quarto. O reconhecimento é pelo cuidado, não
pela perfeição: "escovou os dentes" basta, não existe "escovou mal".

Regras que decorrem disso:
- **Nunca castigo, nunca perda.** Não fez a tarefa hoje? Nada murcha, nada some, nenhum
  "sequência quebrada". Amanhã é outro dia, e o quarto continua lindo.
- **Nunca comparação.** Sem placar, sem "outras crianças fizeram".
- **Carinho não é moeda.** Abraço da mãe não se compra com estrelas. As coisas que se ganham
  (enfeites, bonecas) são enfeite; o afeto é de graça e constante.

## 4. A família no jogo

Quatro personagens, desenhados pela mesma marionete do Ponta (cabeça, membros afilados, cores
por dados), cada um com seu jeito.

| Quem | Papel no jogo | Momentos |
|---|---|---|
| **Stella** | A protagonista. Pequena, loirinha, tutu rosa. | Tudo. |
| **Mãe Andrea** | Aconchego. Recebe, abraça, põe para dormir. | Porta de casa, comidinha, hora de dormir, primeira fila do palco. |
| **Pai Anderson** | Parceria e brincadeira. Gira a Stella no ar, ri junto. | Volta das aventuras, arrumar os brinquedos, aplauso no palco. |
| **Theo** | Irmão, companheiro de aventura. | Aparece nas fases (ajuda a pescar do lago, segura a escada), brinca de boneca e de música junto. |

Como o amor aparece, sempre sem texto:
- **Abraço** é uma animação própria: a família se abaixa até a altura dela. Coraçõezinhos não;
  centelhas rosa e ouro subindo, que é o símbolo do jogo.
- **Plateia da família.** No palco final de cada aventura, a primeira fila é a mãe, o pai e o
  Theo, acenando. Eles aplaudem sempre, e o aplauso não depende de como ela foi.
- **Voz da família** (fortemente recomendado, seção 14): frases curtas gravadas pela Andrea,
  pelo Anderson e pelo Theo. "Te amo, Stella." "Que cama arrumadinha." "Boa noite, estrelinha."
  Uma voz de verdade vale mais que qualquer animação.
- **O nome dela** aparece no título e no quarto, escrito à mão (SVG), para ela reconhecer.

## 5. A casa e o quarto rosa

A casa é o centro do jogo, no lugar do menu. Uma casinha em corte (como casa de bonecas), com
três cômodos que se tocam:

- **O quarto da Stella**, todo rosa: cama, estante de bonecas, piano, ukulele na parede, janela
  com o céu. É aqui que as tarefas do dia viram enfeite (seção 6).
- **A cozinha**, onde a mãe e a Stella fazem comidinha.
- **A porta**, de onde saem as aventuras (seção 8) e onde a família recebe na volta.

O céu da janela segue a hora do dia de verdade: manhã clara, tarde rosa, noite azul com
estrelas. À noite a casa inteira fica mais escura e mais quieta.

## 6. O dia da Stella (as tarefas de verdade)

### 6.1 As tarefas

Cada tarefa tem um ícone desenhado grande, sem texto, e uma pequena cena no jogo.

| Tarefa | Ícone | Cena no jogo | O que aparece no quarto |
|---|---|---|---|
| Arrumar a cama | cama com travesseiro | A Stella estica o lençol rosa com um toque, a mãe sorri | Uma colcha nova ou um travesseiro bordado |
| Fazer comidinha | panelinha | Na cozinha com a mãe, ela põe os ingredientes na tigela (arrastar grande) | Um prato de enfeite na mesinha das bonecas |
| Arrumar o quarto | vassourinha | Tocar nas coisas espalhadas, elas voam para o lugar | Um tapete ou uma luzinha |
| Guardar os brinquedos | caixa de brinquedos | Bonecas e blocos pulam para a caixa, o pai comemora | Uma prateleira nova para bonecas |
| Ser gentil | duas mãos | O Theo recebe um abraço ou um brinquedo emprestado | Um desenho do Theo na parede |
| Escovar os dentes | escova | Espuma rosa, ela escova no ritmo da música (2 minutos de escova, se quiserem usar como timer de verdade) | Um sorriso de centelha no espelho |
| Tomar banho | patinho | Banheira com bolhas que ela estoura | Um patinho na borda da janela |
| Dormir na hora e sozinha | lua | A cena de boa noite (6.3) | Uma estrela nova no céu do quarto |

### 6.2 Quem marca a tarefa

Proposta: **a Stella conta, a família confirma com carinho.**

1. De dia, ela toca no ícone da tarefa que fez. A cena curta acontece, a família nota.
2. Um adulto (Andrea ou Anderson) pode confirmar no "cantinho dos pais" (segurar 2 s no
   canto, fora do alcance fácil dela). A confirmação acende o enfeite com um brilho a mais e
   toca a voz gravada de quem confirmou.
3. Sem confirmação, a cena e o carinho acontecem igual. O objetivo é o hábito e a conversa
   ("olha, você arrumou a cama!"), não a fiscalização.

Nada disso tem prazo nem sequência. Cada tarefa pode ser marcada uma vez por dia; os enfeites
se acumulam devagar no quarto, e o quarto dela vira o registro de tudo o que ela cuidou.

### 6.3 A hora de dormir

O jogo ajuda a ir dormir em vez de atrapalhar.

- Os pais definem a hora de dormir no cantinho dos pais.
- Perto da hora, a casa escurece, a música vira canção de ninar e as aventuras dormem (a porta
  fecha com uma lua pendurada).
- A única coisa que dá para fazer é a **rotina da noite**: banho, dentes, pijama, apagar a luz.
  A mãe e o pai dão boa noite, o Theo acena, a Stella deita, uma estrela nova acende.
- O jogo fecha sozinho com a tela em azul escuro e a música diminuindo.
- Na manhã seguinte, se ela "dormiu sozinha" (marcado pelos pais), o céu do quarto amanhece
  com a estrela nova brilhando e a família dá bom dia.

## 7. Piano, ukulele e bonecas

**Piano.** No quarto, um piano de brinquedo rosa com teclas grandes (8 teclas, dó a dó, com
as cores ou só marfim e rosa). Dois modos:
- **Livre**: cada tecla toca a nota do piano Salamander. Ela brinca, a boneca na estante dança.
- **Seguir a estrelinha**: uma centelha pula de tecla em tecla e ela toca junto uma melodia
  simples (*Brilha, brilha estrelinha*, *Ciranda cirandinha*). Sem erro: tecla errada também
  soa bonita (a melodia espera por ela).

**Ukulele rosa.** Pendurado na parede. Tocar nas 4 cordas dá um acorde sintetizado (corda
dedilhada, algoritmo Karplus-Strong, sem amostra). Na aventura, ele vira o jeito de acordar
coisas: um acorde e as flores do jardim abrem. O Theo pode acompanhar batendo palma.

**Bonecas.** A estante do quarto é a coleção dela. Cada aventura terminada e cada tarefa
confirmada pode trazer uma boneca nova (bailarina, fada, princesa-cisne, boneca de pano).
- As bonecas **assistem** ao palco, sentadas ao lado da família.
- Ela pode **vestir** uma boneca com as cores do figurino (o mesmo sistema de figurino do
  Ponta: collant, tutu, enfeite).
- Ela escolhe **uma boneca companheira** que vai junto nas aventuras, no bolso do tutu, e
  acena quando ela acerta um pulo.

## 8. As aventuras

Três aventuras curtas saem da porta de casa. Cada uma rola devagar, dura 1 a 3 minutos, não
tem vida nem relógio, e acaba no palco com a família na plateia.

### 8.1 O Jardim (inspirado em Pitfall)
A Stella corre pelo jardim. **Toque = pular** (um *sauté*) poças e pedrinhas. Fitas de cetim
nas árvores são cipós: toque perto e ela balança sobre o laguinho (onde mora um sapo de coroa,
que só olha). Flores fechadas abrem com o ukulele. Tropeçou? Senta, ri, levanta.

### 8.2 A Escadaria do teatro (inspirado em Donkey Kong)
Andaimes dos bastidores. No alto, um ratinho do Quebra-Nozes rola novelos de lã. **Toque =
pular o novelo**; as escadas ela sobe sozinha. O Theo segura a escada lá embaixo. No topo, o
ratinho vira amigo e desce para dançar junto no palco. Novelo pegou? Ela vira bolinha de lã,
rola, desenrola e continua.

### 8.3 O Lago dos Cisnes (inspirado em Frostbite e Freeway)
Atravessar o lago pulando em vitórias-régias e cisnes que nadam em faixas. **Toque na metade
de cima = pular para a frente**, metade de baixo = voltar. Cada travessia acende uma parte do
coreto do outro lado. Caiu na água? O Theo pesca ela com uma rede de borboleta, sem perder nada.

### 8.4 O Palco
Cortina de veludo, luz de ribalta. A Stella dança sozinha com a música da aventura; tocar faz
ela girar ou pular (sempre dá certo). Plateia: mãe, pai, Theo e as bonecas. Reverência,
aplauso, abraço da família na coxia, e volta para casa.

## 9. Controles

- **Um toque, uma ação.** Toque em qualquer lugar. Nada de botão virtual pequeno.
- Nas aventuras a Stella anda sozinha; a criança só decide quando pular.
- Janela generosa: o pulo "procura" o obstáculo. A medida vem de testar com a Stella
  (Ponta, regra 18: medir antes de mexer).
- Nenhum botão de pausa na tela. Pausa automática ao sair do app.
- **Cantinho dos pais**: segurar 2 segundos no canto superior. Hora de dormir, confirmar
  tarefas, volume, gravações de voz.

## 10. Estética

Mesmas formas do Ponta, mais rosa e mais luz.

**Mantido do Ponta**
- Fio no lugar de caixa (1 a 2 px), nada de cartão com sombra.
- Arco do proscênio como ornamento (janela do quarto, porta, palco).
- Centelha de quatro pontas como estrela do jogo. Nunca ★, nunca emoji.
- Cormorant Garamond para o título e o nome dela; Jost para o pouco texto que houver.
- Zero imagem raster: tudo SVG e Canvas 2D gerado por código.

**Ajustado para a Stella**
- **Rosa é a cor dominante.** `--rosa`, `--rosa-clara` e `--rosa-doce` ocupam a maior parte da
  tela, com dia claro (`--dia-alto`) e marfim. Proporção sugerida: rosas 55%, dia e marfim 20%,
  mata (jardim) 8%, noite (palco e hora de dormir) 8%, veludo 5%, ouro 4%.
- **A Stella**: a mesma do Ponta (pele `#F2D5BC`, cabelo `#D9AE68`), mais loira e com
  proporção de 5 anos: cabeça maior, pernas curtas, coque ou marias-chiquinhas (seção 14).
  Collant e tutu rosa por padrão.
- **Formas maiores e mais redondas.** A Stella ocupa uns 20% da altura da tela.
- **O que se toca tem contorno de luz**, como a protagonista do Ponta no palco.
- **Noite serena**: a hora de dormir usa `--noite` e `--noite-alta` com estrelas em `--luz`.
- Tons novos (azul do lago, verde folha) entram como token, justificados no commit.

## 11. Música

Música erudita de balé, em domínio público, tocada "bem tocadinha" pelo piano Salamander:
melodia na direita, baixo simples na esquerda, andamento calmo.

| Momento | Música |
|---|---|
| Título | Mozart, *Brilha, brilha estrelinha* (variações K. 265, tema) |
| Casa de dia | Satie, *Gymnopédie nº 1* (já no Ponta) ou Schumann, *Träumerei* |
| Jardim | Tchaikovsky, *Valsa das Flores* (O Quebra-Nozes) |
| Escadaria | Tchaikovsky, *Marcha* (O Quebra-Nozes), ou a Marcha dos soldadinhos do Ponta |
| Lago | Tchaikovsky, *Dança dos pequenos cisnes* (O Lago dos Cisnes) |
| Palco | Tchaikovsky, *Dança da Fada Açucarada* (O Quebra-Nozes) |
| Hora de dormir | Brahms, *Canção de ninar* |
| Piano do quarto | *Brilha, brilha estrelinha*, *Ciranda cirandinha* (melodias para seguir) |

Regras de som:
- Piano sempre; efeitos sintetizados no tom da música, como no Ponta. Ukulele por
  Karplus-Strong. Vozes da família como único outro áudio gravado (seção 14).
- Nada de som assustador ou de erro. Volume baixo por padrão, e tudo funciona no mudo.
- À noite, o andamento cai e o volume diminui aos poucos.

## 12. O que herdamos do Ponta

Copiar os módulos, não depender do repositório.

| Do Ponta | Uso aqui |
|---|---|
| `src/ui/tokens.css` | Base de cores, tipos e durações. Nenhum hex fora dos tokens. |
| Marionete por dados (`src/puppet`) | Stella, família e bonecas, com proporções próprias. |
| Figurino por variáveis de cor | Tutus da Stella e roupas das bonecas. |
| Piano Salamander (`public/piano/`, `src/audio/piano.ts`) | As 21 amostras, CC BY 3.0, com sintetizador de reserva. |
| Sequenciador e músicas em JSON | Mesmo formato `melodia` / `baixo`. Relógio mestre é o áudio. |
| Respostas sonoras (`src/audio/respostas.ts`) | Sininho no tom da música para cada coisa boa. |
| Regras de performance | Só `transform` e `opacity`, sem `blur`, sem alocação por quadro. |
| PWA offline | Instala e abre sem internet. |

## 13. Stack e arquitetura

- Vite + TypeScript strict, Canvas 2D nas aventuras, DOM e SVG na casa. Sem engine, sem lib.
- Web Audio, relógio mestre no `AudioContext`.
- Conteúdo em `src/data/`: aventuras, tarefas, enfeites, bonecas, músicas, falas gravadas.
  Tarefa nova ou boneca nova não exige código.
- Save em `localStorage`: tarefas do dia, enfeites, bonecas, hora de dormir, gravações.
- As vozes da família podem ser gravadas no próprio app (cantinho dos pais, `MediaRecorder`)
  e ficam só no aparelho, nunca vão para servidor.
- Testes: Vitest para a lógica do dia (tarefa marcada uma vez, nada se perde de um dia para o
  outro, hora de dormir fecha as aventuras) e um robô que termina cada aventura sem tocar.
- Publicado no GitHub Pages, como o Ponta.

## 14. Perguntas abertas

1. **Vozes gravadas.** Gravamos a Andrea, o Anderson e o Theo? Recomendo muito. Gravação dentro
   do app (fica no aparelho) ou arquivos que vocês me mandam?
2. **Como a família se parece.** Cabelo, cor de cabelo, altura, óculos, roupa preferida de cada
   um. E quantos anos tem o Theo?
3. **O cabelo da Stella.** Coque de bailarina, marias-chiquinhas ou solto?
4. **Tarefas.** A lista da seção 6.1 está certa? Falta alguma (vestir sozinha, guardar o
   sapato, comer fruta)?
5. **Confirmação dos pais.** Obrigatória, opcional (como proposto) ou nenhuma?
6. **Hora de dormir.** O jogo deve realmente fechar à noite?
7. **Bonecas.** Tem alguma boneca preferida dela que vale ter no jogo (nome, cor, jeito)?
8. **Nome.** "Little Star" ou "Estrelinha"? O nome dela no título?
9. **Orientação.** Retrato como o Ponta, ou paisagem, melhor para aventura e tablet?

## 15. Fora de escopo (v1)

Texto necessário para jogar, nota, vidas, tempo-limite, placar, sequência de dias que se
quebra, castigo por tarefa não feita, compras, anúncios, login, dados fora do aparelho,
qualquer mecânica sobre corpo, peso ou comida como prêmio.
