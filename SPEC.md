# Little Star: especificação (v2)

> Jogo de celular para a Stella, 5 anos. Irmão pequeno do **Ponta**
> (`anderson-nielson/grande-ballet`): mesma família visual, mesmo piano, outro jogo.
> Nada de código ainda. As decisões já tomadas estão marcadas como **Decidido**; o que
> depende da família está na seção 17.

Sumário
1. Para quem é
2. A ideia em uma frase
3. Os três pilares: amada, serena, reconhecida
4. Como uma criança de 5 anos usa um celular
5. A estrutura do jogo
6. A família
7. A casa e o quarto rosa
8. O dia da Stella (as tarefas de verdade)
9. Escrever: o dedo desenha a letra
10. Espanhol: cada coisa tem dois nomes
11. Piano, ukulele e bonecas
12. As aventuras
13. Estética
14. Música e som
15. Técnica
16. Escopo da v1 e marcos
17. Perguntas para a família
18. Fora de escopo

---

## 1. Para quem é

A Stella tem 5 anos. É pequena e loirinha, ama rosa (ama, ama, ama), toca piano e um ukulele
rosa, tem muitas bonecas, curte espanhol e quer aprender a escrever. Ainda não está
alfabetizada. A mãe é a Andrea, o pai é o Anderson, o irmão é o Theo.

O que 5 anos quer dizer na prática:

- **Não lê.** Nada depende de texto. Toda instrução é imagem, movimento, som e voz. O pouco
  texto que existe é para ela reconhecer (o nome dela, letras que ela já traçou) ou para os pais.
- **Motricidade em construção.** Toque ela domina. Arrastar curto, sim. Arrastar longo e
  preciso, ainda não. Dois dedos, segurar e arrastar, gesto rápido: não.
- **Atenção de 1 a 3 minutos por atividade**, e ela troca de atividade quando quiser.
- **Frustração custa caro e o erro não ensina** nessa idade do jeito que ensina aos 10.
  O jogo não tem erro: tem "de novo", e de novo é divertido.
- **Aprende pelo corpo, pela repetição e pelo afeto.** Repetir a mesma música, a mesma letra,
  a mesma cena, com a mesma voz carinhosa, é o que fixa.

## 2. A ideia em uma frase

A Stella mora numa casinha rosa com a mãe, o pai e o Theo. De lá ela sai em aventuras curtas
de bailarina que lembram os jogos do Atari. Aprende letras desenhando com o dedo, aprende
palavras em espanhol tocando nas coisas, e cada coisa boa que ela faz no dia de verdade
aparece no quarto dela.

## 3. Os três pilares: amada, serena, reconhecida

Toda decisão passa por estas três perguntas. Quando duas ideias brigam, ganha a que responde
melhor a elas.

**1. Ela se sente amada?**
A família está em todo lugar: recebe na porta, assiste no palco, comemora cada letra e cada
tarefa, dá boa noite. O carinho é constante e **incondicional**: não depende de ela acertar,
terminar ou cumprir nada. O que ela faz ganha comemoração; o que ela não faz não tira nada.

**2. Ela fica serena?**
Nada corre atrás dela. Sem relógio, sem vida, sem pontos na tela, sem susto, sem som alto,
sem piscar. Cores suaves, piano calmo, transições lentas. O jogo termina cada sessão com ela
mais calma do que começou, e à noite ajuda a ir dormir.

**3. Ela se sente reconhecida pelas coisas simples?**
Arrumar a cama, escovar os dentes, ser gentil, desenhar um S. Cada uma tem um momento em que
alguém da família nota e agradece. O reconhecimento é pelo **esforço e pelo cuidado**, não
pela perfeição: não existe "escovou mal" nem "letra feia".

Cuidado com a recompensa. Prêmio demais por tarefa pode trocar o motivo dela: arrumar a cama
passa a ser "para ganhar enfeite" em vez de "porque é bom e a mamãe fica feliz". Por isso:
- O centro da recompensa é **social**: a família nota, agradece, abraça, a voz de verdade fala.
- O enfeite no quarto é **lembrança**, não pagamento: aparece devagar, sem contador, sem
  "faltam 3 para ganhar". Não existe moeda, loja ou troca.
- **Nunca castigo, nunca perda, nunca comparação.** Não fez hoje? Nada murcha, nada some,
  nenhuma sequência se quebra. Amanhã é outro dia.

## 4. Como uma criança de 5 anos usa um celular

Esta seção é a que mais distingue este jogo do Ponta. Tudo aqui vira requisito.

**Orientação: retrato. Decidido.**
Criança pequena segura o celular com as duas mãos, apoiado no colo ou na mesa, e em retrato
o aparelho fica mais firme e o polegar alcança o meio da tela. Casa, letras, piano e bonecas
são naturalmente verticais. As aventuras correm numa faixa horizontal no meio da tela, com
céu em cima e chão embaixo, o que funciona bem em retrato (a Stella corre, a fase rola).
Travar em retrato também evita a tela girar sozinha quando ela deita o celular.

**Toque**
- Alvos de no mínimo **72 px** e pelo menos 16 px entre eles. Os alvos importantes (a porta,
  a cama, o piano) são objetos grandes da cena, não botões.
- **Um toque só vale quando o dedo sobe**, e o dedo pode escorregar até 24 px sem cancelar.
  Criança encosta com a palma, com dois dedos, com a mão toda.
- **Multitoque ignorado**: vale o primeiro dedo; os outros não fazem nada.
- **Toque na borda da tela não faz nada** (faixa de 24 px): é onde a mão segura o aparelho.
- Nas aventuras, **toque em qualquer lugar** da faixa de jogo vale como pulo.
- Toque repetido rápido (a criança que "martela") não empilha ações: uma de cada vez.
- Toda coisa tocável responde ao toque na hora (encolhe, brilha, faz som), como no Ponta,
  regra 11. Toque em algo que não faz nada também ganha uma resposta pequena (um sininho
  baixinho): para 5 anos, nada pode parecer quebrado.

**Sair do jogo sem querer**
- O gesto de voltar do Android e o de deslizar da borda do iPhone tiram a criança do jogo.
  O jogo captura o "voltar" (histórico do navegador) e o transforma em "voltar para a casa".
  Sair do app só pelo cantinho dos pais.
- O PWA instalado roda em tela cheia, sem barra de endereço para ela tocar.
- As instruções de instalação para os pais recomendam o **Acesso Guiado** (iPhone) ou a
  **Fixação de tela** (Android), que prendem a criança no app.
- Nenhum link para fora, nenhuma loja, nenhum anúncio, nenhum pedido de permissão no meio do
  jogo. A única permissão (microfone, para gravar vozes) é pedida no cantinho dos pais.

**Instrução sem texto**
- Toda atividade nova começa com uma **demonstração**: uma mãozinha desenhada faz o gesto uma
  vez, devagar, e a voz diz o que fazer ("toca na cama").
- Se ela ficar 6 segundos sem tocar, a mãozinha aparece de novo. Nunca "você precisa...".
- Nada de ícone abstrato (engrenagem, xis, seta de menu). Voltar é a **porta de casa** no
  canto de cima, grande.

**Tempo de tela**
- Sessões curtas por desenho: cada atividade fecha em 1 a 3 minutos e devolve ela para a casa,
  onde parar é natural.
- **Limite diário opcional**, definido pelos pais (sugestão: 20 a 30 minutos). Quando acaba,
  a Stella do jogo boceja, a família diz "vamos brincar lá fora?", a porta fecha com um laço.
  É uma despedida, não um bloqueio seco.
- **Hora de dormir** (seção 8.3) fecha o jogo à noite.

**Aparelho**
- Deve rodar liso em celular antigo, de 4 ou 5 anos, que muitas vezes é o que fica com a
  criança. Meta: 60 fps num Android de entrada de 2021.
- Tudo offline depois da primeira abertura. Funciona sem internet, no carro, na viagem.
- Funciona inteiro **sem som** (celular no mudo), com a voz e a música como camada a mais.
- Nada acontece com notificação push. O jogo nunca chama a criança.

## 5. A estrutura do jogo

```
                 Título (Brilha, brilha estrelinha)
                               |
                       A CASA (centro de tudo)
      +------------+-----------+-----------+------------+
      |            |           |           |            |
   Quarto      Cozinha     Caderno      Porta      Hora de dormir
 (tarefas,   (comidinha,   (letras)   (aventuras)   (só à noite)
  bonecas,   palavras em
  piano,      espanhol)
  ukulele)
```

- Não existe menu. A casa é o menu, e tudo nela é um objeto que se toca.
- Toda atividade volta para a casa quando termina, e a família está lá.
- A primeira vez que ela abre o jogo, a mãe, o pai e o Theo estão na porta, acenam e dizem o
  nome dela. Não existe tutorial: existe essa recepção e a mãozinha que mostra onde tocar.

## 6. A família

Quatro personagens desenhados pela mesma marionete do Ponta (membros afilados, cores por
dados), com proporções próprias.

| Quem | Jeito | Onde aparece |
|---|---|---|
| **Stella** | Pequena, loirinha, tutu rosa. A protagonista. | Tudo. |
| **Mãe Andrea** | Aconchego. Recebe, abraça, cozinha junto, põe para dormir. | Porta, cozinha, hora de dormir, primeira fila do palco. |
| **Pai Anderson** | Parceria e brincadeira. Gira a Stella no ar, ri junto. | Volta das aventuras, brinquedos, caderno, aplauso. |
| **Theo** | Irmão e companheiro de aventura. | Nas aventuras (segura a escada, pesca do lago), brinca de boneca e de música. |

**Como o amor aparece**, sempre sem texto:
- **Abraço** tem animação própria: quem abraça se abaixa até a altura dela. Centelhas rosa e
  ouro sobem (a centelha de quatro pontas é o símbolo do jogo; sem coraçõezinhos de emoji).
- **Plateia da família.** No palco, a primeira fila é a mãe, o pai, o Theo e as bonecas.
  Aplaudem sempre.
- **A voz da família.** Frases curtas gravadas pela Andrea, pelo Anderson e pelo Theo:
  "Te amo, Stella." "Que cama arrumadinha." "Olha que S bonito." "Boa noite, estrelinha."
  É o recurso mais forte do jogo e vale o trabalho de gravar (seção 15.4).
- **O nome dela** aparece no título, na porta do quarto e no caderno, em letra de forma
  grande, para ela aprender a reconhecer.

## 7. A casa e o quarto rosa

A casa é vista em corte, como uma casa de bonecas, e rola na vertical: quarto em cima, sala e
cozinha no meio, porta embaixo. Ela desliza para cima e para baixo, ou toca num cômodo.

**O quarto da Stella**, todo rosa: cama, estante de bonecas, piano, ukulele na parede, mesinha
com o caderno, janela com o céu. É aqui que as tarefas viram lembrança.

**A cozinha**, onde a mãe e a Stella fazem comidinha e onde moram as palavras em espanhol.

**A porta**, de onde saem as aventuras e onde a família recebe na volta.

O céu das janelas segue a hora de verdade: manhã clara, tarde rosa, noite azul com estrelas.

## 8. O dia da Stella (as tarefas de verdade)

### 8.1 As tarefas

Cada tarefa tem um objeto grande na casa (não um botão) e uma cena curta.

| Tarefa | Onde se toca | Cena no jogo | Lembrança no quarto |
|---|---|---|---|
| Arrumar a cama | a cama | Ela estica o lençol rosa com um arrasto curto, a mãe sorri | Colcha ou travesseiro novo |
| Fazer comidinha | o fogão | Na cozinha com a mãe, põe ingredientes na tigela | Pratinho na mesa das bonecas |
| Arrumar o quarto | o chão bagunçado | Toca nas coisas, elas voam para o lugar | Tapete ou luzinha |
| Guardar os brinquedos | a caixa | Bonecas e blocos pulam para a caixa, o pai comemora | Prateleira nova |
| Ser gentil | o Theo | Ela dá um abraço ou empresta um brinquedo | Desenho do Theo na parede |
| Escovar os dentes | a pia | Espuma rosa, escova no ritmo da música | Brilho no espelho |
| Tomar banho | a banheira | Bolhas que ela estoura | Patinho na janela |
| Dormir na hora e sozinha | a cama, à noite | A cena de boa noite (8.3) | Estrela nova no céu do quarto |

Detalhe que ajuda a rotina de verdade: a cena de **escovar os dentes** pode tocar uma música
de 2 minutos e servir de cronômetro para a escovação real, com o celular na pia.

### 8.2 Quem marca a tarefa

**Decidido (proposta, sujeita à família): a Stella conta, a família confirma com carinho.**

1. Ela toca no objeto da tarefa que fez. A cena acontece e a família nota.
2. Um adulto pode confirmar no **cantinho dos pais** (seção 15.3). A confirmação acende a
   lembrança com um brilho a mais e toca a voz de quem confirmou.
3. Sem confirmação, a cena e o carinho acontecem igual. O objetivo é o hábito e a conversa
   ("olha, você arrumou a cama"), não a fiscalização. Criança de 5 anos que "mente" que
   escovou está ensaiando a ideia de escovar; a conversa com os pais resolve o resto.

Cada tarefa vale uma vez por dia. Sem prazo, sem sequência, sem contador.

### 8.3 A hora de dormir

- Os pais definem a hora no cantinho dos pais.
- Meia hora antes, a casa escurece e a música vira canção de ninar. A porta das aventuras
  fecha com uma lua pendurada.
- Só resta a **rotina da noite**: banho, dentes, pijama, livro, apagar a luz. A mãe e o pai dão
  boa noite, o Theo acena, a Stella deita, uma estrela nova acende na janela.
- O jogo escurece até o azul da noite e fecha sozinho. Até a manhã, abrir o app mostra só a
  Stella dormindo e a canção de ninar baixinha.
- De manhã, a família dá bom dia e, se os pais marcaram "dormiu sozinha", a estrela nova brilha.

## 9. Escrever: o dedo desenha a letra

A melhor ideia do Ponta cabe aqui inteira: **o dedo percorre uma fita**. No Ponta a fita é o
caminho do gesto de dança; aqui a fita é o traço da letra. A estrela guia do Ponta mostra o
caminho antes, a Stella segue com o dedo, e a letra nasce onde o dedo passa.

### 9.1 Como funciona

1. A letra aparece grande (ocupa metade da tela), como uma fita de cetim rosa pontilhada.
2. A **estrela guia** percorre cada traço devagar, na ordem certa e no sentido certo, e a voz
   diz o **som** da letra, não só o nome ("S... sssss, de Stella").
3. A Stella passa o dedo pela fita. Onde o dedo passa, a fita se enche de rosa e brilha.
4. Traço terminado: um sininho. Letra terminada: a letra ganha vida (o S vira uma cobrinha que
   dança, o T vira uma árvore), a família comemora e a letra vai para a parede do quarto.

### 9.2 Regras de generosidade

- **Tolerância larga.** O dedo pode passar a até ~40 px da fita e ainda contar. A forma manda,
  a precisão não (Ponta, regra 5).
- **O sentido importa, mas é ensinado, não cobrado.** Se ela traçar ao contrário, a fita
  enche igual; a estrela guia só repete o sentido certo da próxima vez.
- **Pular ou tirar o dedo não apaga nada.** Ela pode parar no meio e continuar.
- Nada de "tente de novo" ou letra riscada. Toda letra terminada é comemorada.

### 9.3 O caminho das letras

A ordem segue o que faz sentido para ela, não o alfabeto:

1. **Traços antes das letras**: linha em pé, linha deitada, linha inclinada, bolinha, curva,
   ponte. Cada traço é uma coisa do mundo dela (a chuva cai: linha em pé; a onda do lago:
   curva; a ponte do jardim).
2. **As letras do nome dela**: S, T, E, L, A. Em **letra de forma maiúscula (bastão)**, que é
   a letra com que a alfabetização começa no Brasil. Ao terminar as cinco, ela monta o nome
   STELLA inteiro, e ele aparece na porta do quarto.
3. **As letras da família**: A de Andrea e de Anderson, T de Theo (que ela já sabe), M de mãe,
   P de pai. Cada letra terminada ganha a voz da pessoa.
4. **Palavras curtas de carinho**, montadas com letras que ela já conhece: MAMÃE, PAPAI, THEO,
   AMO. Depois, as outras letras do alfabeto, uma de cada vez.

### 9.4 O bilhetinho

Toda letra aprendida vira um **carimbo** no caderno. Ela pode "escrever" um bilhete para a
mãe, o pai ou o Theo: toca nas letras que já sabe, elas vão para um papel rosa, e o bilhete é
entregue. Quem recebe lê em voz alta (com a voz gravada) o que ela "escreveu", mesmo que seja
"SSTAEL". Escrever vira um jeito de dar carinho, que é o motivo mais forte para aprender.

Os bilhetes ficam guardados, e os pais podem vê-los no cantinho dos pais.

## 10. Espanhol: cada coisa tem dois nomes

A Stella curte espanhol. O jogo trata o espanhol como **brincadeira de dois nomes**, não como
aula.

- **Tocar numa coisa diz o nome dela em português e depois em espanhol**: "cama... cama",
  "estrela... estrella", "gato... gato", "boneca... muñeca". Muitas palavras são quase iguais,
  e ela descobre isso sozinha.
- **Rosa é "rosa" nas duas línguas.** Um bom começo.
- **Uma boneca que fala espanhol**: a **Estrellita**, boneca bailarina que mora na estante.
  Quando ela vai junto numa aventura, comemora em espanhol ("¡Muy bien, Stella!"). Ela é a
  "dona" do espanhol no jogo, o que dá lugar e rosto à língua.
- **Contar em espanhol**: no palco, a contagem da professora do Ponta ("5, 6, 7, 8") vira, às
  vezes, "cinco, seis, siete, ocho" na voz da Estrellita.
- **Cores e números** na cozinha: "três morangos... tres fresas". Pouca coisa por vez, sempre
  com o objeto na tela.
- **Música**: *Estrellita, ¿dónde estás?*, a versão em espanhol de *Brilha, brilha
  estrelinha*, no piano do quarto.

Voz do espanhol: frases gravadas pela família, se alguém fala espanhol, ou a voz do próprio
aparelho (`speechSynthesis`, como os termos franceses no `src/audio/voz.ts` do Ponta). Risco:
nem todo celular tem a voz em espanhol instalada offline. Solução: testar no aparelho dela e,
se faltar, gravar as ~40 palavras da v1 como áudio (seção 15.4).

A escrita fica em português. Espanhol é para ouvir e falar, não para traçar.

## 11. Piano, ukulele e bonecas

**Piano rosa** no quarto, com 8 teclas grandes (dó a dó).
- **Livre**: cada tecla toca a nota do piano Salamander. As bonecas da estante dançam.
- **Seguir a estrelinha**: uma centelha pula de tecla em tecla e ela toca junto uma melodia
  simples (*Brilha, brilha estrelinha*, *Estrellita*, *Ciranda cirandinha*). A melodia espera
  por ela; tecla "errada" também soa bonita.

**Ukulele rosa** na parede. Passar o dedo nas 4 cordas dá um acorde (corda dedilhada
sintetizada, algoritmo Karplus-Strong, sem arquivo de áudio). Três acordes, três cores de
botão grande para ela acompanhar o piano ou a canção. Nas aventuras, um acorde abre as flores
do jardim.

**Bonecas** na estante do quarto, que é a coleção dela.
- Cada aventura terminada e cada semana de tarefas traz uma boneca nova, devagar (bailarina,
  fada, princesa-cisne, boneca de pano, e a Estrellita desde o começo).
- Ela pode **vestir** uma boneca com as cores do figurino (o sistema de figurino do Ponta:
  collant, tutu, enfeite).
- Ela escolhe **uma boneca companheira** que vai junto nas aventuras, no bolso do tutu.
- As bonecas **assistem** ao palco ao lado da família.

## 12. As aventuras

Três aventuras curtas saem da porta de casa. A Stella corre sozinha, a criança só decide
quando pular. Nenhuma tem vida, relógio ou pontos. Cada uma termina no palco.

### 12.1 O Jardim (inspirado em Pitfall)
A Stella corre pelo jardim. **Toque = pular** (um *sauté*) poças e pedrinhas. Fitas de cetim
nas árvores são cipós: ela balança sozinha quando chega nelas. Um sapo de coroa olha do
laguinho, e só olha. Flores fechadas abrem com o ukulele. Tropeçou? Senta, ri, levanta.

### 12.2 A Escadaria do teatro (inspirado em Donkey Kong)
Andaimes dos bastidores, subindo na vertical, o que em retrato fica ótimo. No alto, um ratinho
do Quebra-Nozes rola novelos de lã. **Toque = pular o novelo**; as escadas ela sobe sozinha.
O Theo segura a escada lá embaixo. No topo o ratinho vira amigo e vai dançar no palco.
Novelo pegou? Ela vira bolinha de lã, rola, desenrola e continua no mesmo andar.

### 12.3 O Lago dos Cisnes (inspirado em Frostbite e Freeway)
Atravessar o lago de baixo para cima pulando em vitórias-régias e cisnes que nadam em faixas.
**Toque = pular para a frente.** As faixas andam devagar e o pulo espera o cisne chegar.
Cada travessia acende uma parte do coreto do outro lado. Caiu na água? O Theo a pesca com
uma rede de borboleta, sem perder nada.

### 12.4 O Palco
Cortina de veludo, luz de ribalta. A Stella dança com a música da aventura; tocar faz ela
girar ou pular (sempre dá certo). Plateia: mãe, pai, Theo e as bonecas. Reverência, aplauso,
abraço na coxia, volta para casa.

### 12.5 Generosidade das aventuras
- O pulo **procura** o obstáculo: um toque até ~500 ms antes ainda vira o pulo certo.
- Se ela não toca, a Stella não fica presa: depois de duas tentativas no mesmo obstáculo, a
  mãozinha mostra o toque; depois de três, ela passa sozinha com uma ajudinha (o Theo empurra
  a vitória-régia, o ratinho para de rolar novelo).
- Toda aventura termina, mesmo sem nenhum toque. O palco sempre chega.

## 13. Estética

Mesmas formas do Ponta, com mais rosa, mais luz e mais tamanho.

**Mantido do Ponta**
- Fio no lugar de caixa (1 a 2 px). Nenhum cartão com sombra, nenhum gradiente decorativo.
- Arco do proscênio como ornamento: janela do quarto, porta, palco, moldura do caderno.
- Centelha de quatro pontas como a estrela do jogo. Nunca ★, nunca emoji.
- Cormorant Garamond no título. Para as letras que ela traça, uma **letra bastão** de traço
  simples e redondo (desenhada em SVG como fita, não uma fonte), para ela aprender a forma
  certa.
- Zero imagem raster. Tudo SVG e Canvas 2D gerado por código.

**Ajustado para ela**
- **Rosa domina.** `--rosa`, `--rosa-clara` e `--rosa-doce` na maior parte da tela, com dia
  claro e marfim. Proporção: rosas 55%, dia e marfim 20%, mata (jardim) 8%, noite (palco e
  noite) 8%, veludo 5%, ouro 4%.
- **A Stella** é a do Ponta (pele `#F2D5BC`), mais loira e com proporção de 5 anos: cabeça
  maior, pernas curtas, bochecha. Collant e tutu rosa.
- **Tamanho**: a Stella ocupa uns 20% da altura da tela; objetos tocáveis têm pelo menos 72 px.
- **Contraste**: tudo o que se toca tem contorno em `--luz` ou `--ouro` e um leve pulsar de
  opacidade quando a mãozinha aponta.
- **Calma visual**: nada pisca mais de uma vez por segundo, nada treme, nenhum flash.
  Movimento sempre com easing suave.
- Tons novos (azul do lago, verde folha) entram como token e são justificados no commit.

## 14. Música e som

Música erudita de balé, em domínio público, "bem tocadinha" no piano Salamander: melodia na
direita, baixo simples na esquerda, andamento calmo.

| Momento | Música |
|---|---|
| Título | Mozart, *Brilha, brilha estrelinha* (variações K. 265, tema) |
| Casa de dia | Satie, *Gymnopédie nº 1* (já pronta no Ponta) ou Schumann, *Träumerei* |
| Caderno (letras) | Bach, *Prelúdio em dó maior* (BWV 846), calmo e contínuo |
| Jardim | Tchaikovsky, *Valsa das Flores* (O Quebra-Nozes) |
| Escadaria | Tchaikovsky, *Marcha* (O Quebra-Nozes), ou a Marcha dos soldadinhos do Ponta |
| Lago | Tchaikovsky, *Dança dos pequenos cisnes* (O Lago dos Cisnes) |
| Palco | Tchaikovsky, *Dança da Fada Açucarada* (O Quebra-Nozes) |
| Hora de dormir | Brahms, *Canção de ninar* |
| Piano do quarto | *Brilha, brilha estrelinha*, *Estrellita*, *Ciranda cirandinha* |

Regras:
- Piano sempre; efeitos sintetizados no tom da música, como as respostas do Ponta.
- Nada assusta. Nenhum som de erro. Volume baixo por padrão.
- A voz vence a música: quando alguém fala, a música abaixa pela metade e volta devagar.
- À noite o andamento cai e o volume diminui.

## 15. Técnica

### 15.1 Stack
Igual ao Ponta, para dividir código e cuidado: Vite + TypeScript strict, Canvas 2D nas
aventuras e no caderno, DOM e SVG na casa, Web Audio com relógio mestre no `AudioContext`,
PWA offline, sem engine e sem lib. Publicado no GitHub Pages.

### 15.2 O que vem do Ponta (copiado, não dependente)

| Do Ponta | Uso aqui |
|---|---|
| `src/ui/tokens.css` | Base de cores, tipos e durações. Nenhum hex fora dos tokens. |
| Marionete por dados (`src/puppet`) | Stella, família e bonecas. |
| Figurino por variáveis de cor | Tutus e roupas das bonecas. |
| Fita, estrela guia e projeção do dedo (`src/dance/fita.ts`, `dedo.ts`) | O traçado das letras (seção 9). |
| Piano Salamander e sequenciador | Toda a música. |
| Respostas sonoras (`src/audio/respostas.ts`) | O sininho no tom da música. |
| Voz do navegador (`src/audio/voz.ts`) | Palavras em espanhol, quando não houver gravação. |
| Regras de performance | Só `transform` e `opacity`, sem `blur`, sem alocação por quadro, DPR até 2. |

### 15.3 Cantinho dos pais
Segurar 2 segundos na lua do canto de cima, depois uma conta simples (por exemplo "toque no
número 7" escrito por extenso), que uma criança de 5 anos não resolve. Ali: hora de dormir,
limite diário, confirmar tarefas, gravar vozes, ver os bilhetes, volume, apagar tudo.

### 15.4 Vozes gravadas
- Gravadas no próprio app (`MediaRecorder`) pelo cantinho dos pais: uma lista de frases, cada
  pessoa grava as suas. Ficam **só no aparelho** (IndexedDB), nunca vão para servidor.
- Alternativa: vocês gravam no celular e eu empacoto como arquivos do jogo. Mais trabalho,
  mas sobrevive a trocar de aparelho.
- Enquanto não houver gravação, a cena acontece sem voz (nunca uma voz sintética fingindo ser
  a mãe).

### 15.5 Dados e testes
- Conteúdo em `src/data/`: tarefas, lembranças, letras (traços em pontos), palavras em
  espanhol, bonecas, aventuras, músicas, frases. Letra nova, palavra nova ou boneca nova não
  exige código.
- Save em `localStorage` e IndexedDB, versionado.
- Testes: a lógica do dia (tarefa vale uma vez por dia, nada se perde de um dia para o outro,
  hora de dormir fecha as aventuras); o traçado (um dedo que segue a fita com 40 px de erro
  completa a letra; um dedo parado não completa); as aventuras terminam sem nenhum toque.

## 16. Escopo da v1 e marcos

A v1 é pequena de propósito. Melhor pouco e muito bem-feito, testado com ela, do que tudo pela
metade.

**v1: a casa, o nome e uma aventura**
1. **Styleguide vivo** com a Stella pequena, a família e duas bonecas nas poses básicas.
2. **A casa** com quarto, cozinha e porta, céu pela hora, recepção da família.
3. **Três tarefas**: cama, dentes, brinquedos. E a hora de dormir.
4. **Caderno**: os traços básicos e as letras S, T, E, L, A, montando STELLA na porta.
5. **Piano** livre e *Brilha, brilha estrelinha*.
6. **Uma aventura**: o Jardim, com o palco no fim.
7. **Espanhol**: 20 palavras da casa e a Estrellita na estante.
8. **Cantinho dos pais** com gravação de voz.

Depois de cada marco: testar com a Stella, olhar onde ela trava, onde ri, onde desiste, e
medir antes de mexer (quanto tempo até o primeiro toque certo, quantos toques perdidos na
borda, em que letra ela para).

**v2**: as outras tarefas, a Escadaria e o Lago, o ukulele, vestir as bonecas, bilhetinho,
letras da família, mais espanhol.

## 17. Perguntas para a família

1. **Vozes.** Andrea, Anderson e Theo topam gravar? No app ou arquivos enviados? Alguém fala
   espanhol para gravar as palavras?
2. **Como vocês são.** Cabelo, cor, altura relativa, óculos, roupa preferida de cada um.
   Quantos anos tem o Theo?
3. **O cabelo da Stella.** Coque de bailarina, marias-chiquinhas ou solto?
4. **Tarefas.** A lista da seção 8.1 está certa? Falta alguma (vestir sozinha, comer fruta,
   guardar o sapato)?
5. **Letras.** Na escola ela já está vendo letra bastão? Já reconhece o S do nome?
6. **Bonecas.** Tem alguma boneca preferida dela que vale entrar no jogo (nome, cor, jeito)?
7. **O celular.** Qual aparelho ela usa (modelo, iPhone ou Android)? Vale testar nele a voz
   em espanhol e o desempenho.
8. **Nome do jogo.** "Little Star", "Estrelinha" ou "Estrellita"?

## 18. Fora de escopo

Texto necessário para jogar, nota, pontos na tela, vidas, tempo-limite, placar, sequência de
dias que se quebra, castigo por tarefa não feita, moeda ou loja, compras, anúncios, login,
notificações, dados fora do aparelho, links para fora, e qualquer mecânica sobre corpo, peso
ou comida como prêmio.
