# Decisões da v1

> As perguntas de `docs/revisao-gameplay.md` ficaram sem resposta antes de implementar, e a
> orientação foi decidir tudo. Aqui está o que decidi, por quê, e onde isso muda a SPEC e o
> GAMEPLAY. Tudo que é dado ou opção do cantinho dos pais pode ser trocado sem código.

| # | Pergunta | Decisão | Onde vive |
|---|---|---|---|
| P1 | Hora da tela | O jogo não assume hora. A roda e o prato perguntam sobre o que houve **desde a última sessão**, e as frases não dizem "hoje". De manhã, a primeira pergunta é sobre a noite. A partir de 30 min antes da hora de dormir só existe o laço da noite. | `src/core/laco.ts`, `src/data/frases.json` |
| P2 | Aparelho | PWA instalável nos dois; retrato pelo manifesto; instruções de Acesso Guiado e Fixação de tela no cantinho dos pais. O gesto de voltar do aparelho volta para a casa. | `vite.config.ts`, `src/core/roteador.ts`, `src/telas/pais.ts` |
| P3 | Letras e escola | Ordem do jogo: A, E, L, S, T (as do nome dela, que ela já reconhece), depois O, M, U, I; uma por semana, com as imagens do jogo. Os pais podem adiantar, segurar ou deixar livre. | `src/data/letras.json`, cantinho dos pais |
| P4 | Palavras | Trocadas por palavras de sílaba aberta em que cada letra soa como o som ensinado: LUA, ASA, ELA, OLÁ, MALA, SALA, LAMA, MOLA, TATU, TUTU, TELA, LATA, MATA, MESA, LIMA e STELLA. Um teste impede L no fim da sílaba, TI e vogal átona final. | `src/data/palavras.json`, `tests/dados.test.ts` |
| P5 | Casa | Numa tela só, sem rolagem. Tocar num objeto abre a atividade. | `src/telas/casa.ts` |
| P6 | Quem marca | O toque dela basta; o objeto da roda só aceita o toque depois que a pergunta acabou de ser falada. A confirmação dos pais é brilho a mais. | `src/telas/roda.ts`, `src/telas/pais.ts` |
| P7 | Vozes | Gravadas no app (MediaRecorder), guardadas só no aparelho, com exportar e importar. Cada frase tem um dono; 50 obrigatórias e o resto opcional. Sem gravação, a cena acontece sem voz. Palavras inteiras e nomes de figuras podem vir da voz do aparelho; o som isolado da letra e os nomes próprios, nunca. | `src/audio/vozes.ts`, `src/audio/fala.ts`, `src/data/frases.json` |
| P8 | Roupa | Vestido rosa em casa; tutu e coque só no palco. | `src/puppet/boneco.ts` |
| P9 | Proporções | Stella 1, Theo 1,5, pais 2 (o pai 2,1). | `src/puppet/boneco.ts` |
| P10 | Voltar | A casinha verde no canto de cima, 72 px. A porta fica só para a aventura. | `src/puppet/objetos.ts` |
| P11 | Jardim | Um obstáculo a cada 2 compassos a 100 bpm (uns 30 em dois minutos); nas duas primeiras aventuras, a cada 4. Janela do pulo 0,7 s. Em dados. | `src/telas/jardim.ts` (`JARDIM`) |
| P12 | Semana | Cores da tradição Waldorf (dom dourado, seg roxo, ter vermelho, qua amarelo, qui laranja, sex verde, sáb azul). Brincadeira do dia: dom família, seg palavras, ter caderno, qua pinhas, qui areia, sex piano, sáb jardim. | `src/ui/tokens.css`, `src/core/laco.ts` |
| P13 | O resto | Mãe de cabelo castanho escuro na altura do ombro e vestido rosa-velho; pai de testa alta, barba cheia e óculos finos sem hastes, castanho claro, camiseta verde-mata (opção C, escolhida entre três); gatinho cinza-areia, coelhinho branco; nomes candidatos Mimi, Luna, Bolota e Pipoca, Nino, Flor; nome do jogo Little Star; comidas iniciais tomate, cenoura, banana, brócolis, uva, pão (trocáveis); festas das estações ficam para a v2. | dados e cantinho dos pais |

## As respostas que chegaram depois

O Anderson respondeu P1 a P7 na página das telas enquanto a v1 era implementada. O que mudou:

| # | Resposta | O que mudou |
|---|---|---|
| P1 | "Raro. Quase nunca." | A casa se abre em quatro sessões, não em seis (`ABERTURAS`), para o Jardim não levar dois meses. O limite diário importa pouco; o convite da despedida importa muito. |
| P2 | "Samsung Galaxy" | Android: as instruções do cantinho dos pais falam primeiro de Chrome, Instalar aplicativo e Fixar janelas. A voz do aparelho em português vem do Google TTS. |
| P3 | "Não, mas ela conhece as letras do nome dela e do Theo" | A escola ainda não apresentou letras, então a ordem é do jogo, e começa pelas que ela já reconhece: A, E, L, S, T, e a porta ganha STELLA na quinta letra. Depois O, M, U, I. A palavra de cada letra usa só letras já vistas (no máximo uma nova). |
| P4 | "Pode" | As palavras de sílaba aberta ficam. |
| P5 | "Sim" | A casa numa tela só fica. |
| P6 | "Decide" | O toque dela basta, com a trava depois da pergunta. |
| P7 | "Não sei" | As vozes ficam como estão: gravadas no app, com dono por frase, 50 obrigatórias. Sem gravação, a cena acontece sem voz. Quando der, as primeiras a gravar são os nove sons das letras, os nomes dos bichos e o tchau. |

## O que mudou em relação à SPEC e ao GAMEPLAY

Aplicado nos dois documentos:

- **Janela do pulo**: 0,7 s (C1).
- **Roda por toque**, sem arrasto (C2). A cena do lençol acontece sozinha.
- **A noite**: ela responde na roda de manhã e a estrela acende; a confirmação dos pais é brilho a mais (C3).
- **Boneca só por aventura**, até cinco na estante (C4).
- **Estrela de cinco pontas** só na caixa de areia; todas as outras são centelhas (C7).
- **Objetos de palavra**: mala, lata e a lua da janela à noite; GATO e CAMA são palavras só no caderno (J6).
- **Laço da primeira semana**: a forma é a mesma e as partes que ainda não existem são puladas (J1). Tabela em `GAMEPLAY.md` seção 8.
- **Brincadeira do dia e livre são a casa**: depois do som do dia a casa abre com o objeto do dia pulsando; depois de 5 minutos de casa a família chama para os bichos (J3, aceito o custo de duas partes de atenção seguidas).
- **O jogo dorme, não fecha** (T1).
- **Instalação e Acesso Guiado** como passo 1, no cantinho dos pais (T2).
- **Exportar e importar gravações** (T3).
- **Primeiro dia**: a cestinha com o gatinho na despedida, com três nomes ditos em voz; sem toque em 20 s, fica o primeiro (J14).
- **Segunda sessão no mesmo dia**: um toque na porta fechada reabre, pulando roda, prato e som.

## O que ficou de fora da v1, de propósito

Horta, comidinha, banho e quarto na roda, Árvore Grande, Lago dos Cisnes, espanhol (a Estrellita
está na estante, muda), ukulele, lira tocável, bilhetinho, vestir bonecas, festas das estações,
arco-íris semanal (é um contador disfarçado; o canteiro já recompensa).

## O que precisa da família antes do primeiro uso

1. Instalar na tela inicial e ligar o Acesso Guiado ou a Fixação de tela.
2. No cantinho dos pais (segurar a lua por dois segundos, tocar no número), gravar as frases
   obrigatórias: os 9 sons das letras, as perguntas e comemorações da roda, os nomes dos bichos,
   os convites e o boa noite. Uns 45 minutos, de preferência sem a Stella por perto.
3. Escolher a hora de dormir, o limite diário e as comidas de cada cor.
4. Jogar junto, no colo, na primeira semana.

## O que mudou depois da primeira rodada no celular

- **O toque travava a tela inteira.** No celular cada dedo novo tem um `pointerId` novo. Se o dedo descia num alvo e soltava fora dele (comum no piano, escorregando entre teclas), o alvo nunca via o `pointerup` e o "primeiro dedo" ficava preso: nada mais respondia. Agora o alvo captura o ponteiro e a janela sempre libera o dedo ao soltar.
- **A cena não corta mais.** Em telas mais curtas que 1:2 (quase todo Android com a barra do navegador), o `slice` cortava o alto e o pé da cena e jogava a casinha e a lua para dentro da borda morta de 24 px: não dava para sair do piano. A cena agora usa `meet`; sobram faixas finas nos lados, na cor do fundo da própria tela.
- **A casa fechada confundiu os pais.** Nas primeiras quatro sessões só o que brilha responde (aberturas graduais). Isso segue igual para a Stella, mas o cantinho dos pais ganhou o botão "Abrir a casa inteira agora".
- **A família, versão escolhida.** Theo: cachinhos curtos só em cima, camiseta com mangas, mais encorpado. Pai: opção C, testa alta, barba cheia, óculos finos sem hastes (de frente, a haste parecia um brinco). As três opções ficam em `?styleguide=pai`.

## A v2: o que ficou de fora entrou

Tudo o que a seção "O que ficou de fora da v1" listava, menos o arco-íris semanal (que
continua sendo um contador disfarçado; o canteiro já recompensa).

| O que | Como ficou | Onde |
|---|---|---|
| Horta | Quatro covas no quintal. Um toque faz a coisa certa: cova vazia planta, planta com sede rega, planta pronta colhe. Cresce com dias e regas (pronta com dois de cada) e nunca murcha. O que ela colhe vai para a comidinha. | `src/core/horta.ts`, `src/telas/horta.ts` |
| Comidinha | Segunda-feira, o dia do pão. Na cozinha com a mãe: toca em cada legume, que vai para a bacia, se lava e cai na tigela; mexe três vezes com a colher; o Theo come rindo e a mãe prova. Cada comida diz o nome, e a Estrellita o nome em espanhol. | `src/telas/cozinha.ts` |
| Mais tarefas na roda | Banho, quarto e ser gentil. Os pais ligam e desligam cada tarefa no cantinho; banho já vem ligado, quarto e gentil não, para a roda continuar curta. | `src/telas/roda.ts`, `src/telas/pais.ts` |
| Subir na árvore | Tocar num galho mais alto e ela sobe até ele, sem pressa. Do alto vê a casa verde de cima, o Theo acenando e, à noite, as estrelas das noites bem dormidas. O Theo sobe junto só nos galhos baixos. | `src/telas/arvore.ts` |
| A Árvore Grande | O gatinho subiu ao topo e não sabe descer. Ela sobe sozinha; o esquilo de gorrinho rola pinhas; toque = pular e girar para pegar a pinha. Sem pulo, a pinha quica com um "toc" e cai na cestinha do Theo. Toda pinha chega em casa. Abre depois da primeira aventura terminada. Música: a Marcha. | `src/telas/arvoregrande.ts` |
| O Lago dos Cisnes | Cinco faixas de vitórias-régias e cisnes que vão e voltam (nunca somem pela beirada). Toque = pular para a frente, e o pulo espera a plataforma chegar. Caiu na água? O Theo pesca com a rede, sem perder nada. Cada travessia acende uma luz do coreto. Abre depois da segunda aventura. Música: a Dança dos pequenos cisnes. | `src/telas/lago.ts` |
| A porta | Com mais de uma aventura aberta, três figuras (coelhinho, pinha com o gatinho, cisne) para escolher; a do dia brilha e vai sozinha depois de 14 s. | `src/telas/casa.ts` |
| Espanhol | A Estrellita (a primeira boneca da estante) diz o outro nome das coisas: nas palavras em destaque, na comidinha, na horta e no palco (às vezes conta a entrada em espanhol, e diz "¡Muy bien!"). Entra sozinho com três letras traçadas, ou como os pais mandarem. Gravação `es_<id>` se houver; senão, a voz do aparelho em espanhol; sem voz, silêncio. | `src/audio/espanhol.ts`, `src/data/espanhol.json` |
| Ukulele | Quatro cordas para dedilhar (Karplus-Strong), afinadas em sol, dó, mi, lá: soltas, dão a afinação; três botões de cor apertam dó, fá e sol7 nas posições de verdade. Corpo rosa em oito, com cintura, cravelhas e trastes. As bonecas balançam. | `src/telas/ukulele.ts` |
| Lira | Sete cordas na pentatônica, pendurada na parede do quarto. | `src/telas/lira.ts` |
| Vestir bonecas | Roupa, cabelo e gorro por cores; a Estrellita só troca o gorro. Tocar na Stella leva a boneca escolhida no bolso do tutu: ela assiste ao palco da coxia. | `src/telas/bonecas.ts` |
| Bilhetinho | As letras que ela sabe são carimbos; vão para o papel rosa; ela entrega para a mãe, o pai ou o Theo, que lê em voz alta (a voz do aparelho lê letra a letra e depois junto) e abraça. Os pais veem os bilhetes no cantinho. | `src/telas/bilhete.ts` |
| Festas das estações | Outono: folhas no quintal e a Festa da Lanterna (20 a 31 de maio). Inverno: fitinha no pinheiro e a festa junina com fogueira e bandeirinhas (12 a 30 de junho). Primavera: flores no pinheiro e guirlanda na porta (21 a 30 de setembro). Verão: conchinhas na areia. Advento: a espiral de velas, uma por domingo. Os pais podem desligar. | `src/core/festas.ts`, `src/data/festas.json` |
| Piano | O seguir a estrelinha alterna *Brilha, brilha* e *Ciranda, cirandinha*. | `src/telas/piano.ts` |

A primeira semana continua abrindo a casa em quatro sessões; o que é novo entra junto com o
que já estava: ukulele, lira, bonecas e bilhete na sessão 2; árvore e horta na 3; cozinha na 4.
As aventuras novas abrem uma por vez, depois de terminar a anterior.

## Pedrinhas, medalhas e o relógio

Pedido da família depois da v2: a Stella está aprendendo a ver as horas e precisa aprender a
dormir sozinha no quarto dela; e o jogo precisa somar pontos que se ganham e se perdem com as
tarefas, com as atitudes mais autônomas e com o aprendizado, mas leve.

Isso mexe numa decisão da v1 ("nada diminui, nenhum número aparece"). O jeito de fazer leve:

- **Pedrinhas num pote de vidro**, no chão do quarto. Nada de número na tela: ela vê o pote
  encher. Tocar no pote faz as pedrinhas tilintarem, uma nota por pedrinha.
- **Ganha** pelo que faz de verdade e pelo que aprende: 1 por tarefa contada na roda (mais 1
  quando os pais confirmam), 2 por dormir sozinha no quarto dela e mais 2 pela noite toda, 3
  por letra traçada, 1 por som do dia, palavra inteira, hora no relógio, colheita, comidinha
  ou aventura. As pedrinhas sobem da cena com um tique cada.
- **Perde** 1 quando um combinado não acontece: tarefa não contada na roda, não dormiu
  sozinha. A pedrinha rola para fora devagar, com um toque surdo, e ninguém diz nada. Nunca
  fica abaixo de zero. Aprender nunca tira pedrinha (o jogo não tem erro). Dormir a noite toda
  é bônus: não dormir não tira.
- **Medalhas**: com 12 pedrinhas o pote enche e vira uma medalha de feltro na parede da sala.
  Medalha não se perde. É a lembrança que fica.
- **Os pais** dão ou tiram uma pedrinha no cantinho, com motivo, para as atitudes de fora do
  jogo (se vestiu sozinha, esperou a vez, um combinado que não aconteceu). A orientação está lá
  escrita: dizer para ela na hora; o jogo só guarda. Dá para desligar o pote inteiro, ou só o
  "rolar" (fica só ganhando) se virar tensão.
- **Dormir sozinha**: a pergunta da manhã virou duas, "dormiu no seu quarto, sozinha?" (mãe)
  e "e dormiu a noite toda?" (pai). Antes de apagar a luz, a mãe faz o combinado em voz alta
  (frase opcional para gravar).
- **O relógio** da sala: um mostrador grande com os números, o ponteiro das horas que ela gira
  com o dedo e encaixa na hora cheia, e o relógio diz a hora ("são três horas", gravação ou
  a voz do aparelho). O céu da janelinha muda com a hora; a hora de dormir tem uma lua, as
  sete da manhã um sol. Tocar no Theo: ele pede uma hora; ela gira até lá e ganha uma
  pedrinha. Ajuda: o número pedido acende; depois o ponteiro anda sozinho. Só horas cheias
  por enquanto; meia hora e minutos ficam para quando as cheias estiverem firmes.

## A narração para quem joga junto

O pedido: a cada avanço, um balão suave no topo da tela, como em história em quadrinhos,
para a mãe, o pai ou o Theo (quem estiver jogando junto no celular) lerem para a Stella.
Coisas boas que estão acontecendo, as forças dela, e o carinho, o amor e a segurança que a
família tem por ela. O pano de fundo: ela tem ciúmes do Theo e compete com ele, e o jogo em
parte existe para mostrar que não precisa ser assim.

- **Um balão, um avanço.** Tudo o que o jogo já conta como avanço passa por `ganhar()` em
  `src/core/pedrinhas.ts`; a narração escuta ali, com o pote ligado ou desligado. Fora das
  pedrinhas, quatro momentos também narram: a chegada, o bilhete entregue, os bichos
  cuidados, a despedida e a boa-noite. A pedrinha que rola não narra: continua em silêncio,
  como decidido antes.
- **O que a frase faz.** Três coisas, sempre: nomeia o que ela fez de verdade ("você
  traçou uma letra inteira, do começo ao fim"), diz o carinho e a segurança da família, e
  coloca o Theo como quem torce por ela e faz junto ("ele mostra, você descobre"). Nada de
  comparação, nada de "melhor que", nada de "tem que". Um teste garante que todo avanço tem
  pelo menos três frases, que o Theo e a família aparecem em cada um, que nenhuma frase
  passa de 160 caracteres e que as palavras proibidas não entram.
- **Para o adulto, não para ela.** É a exceção à regra "sem texto para ela ler": o texto é
  de quem lê, com rótulo "para ler para a Stella". Frases curtas para caber na voz de quem
  está ao lado. Elas se revezam pelo histórico das pedrinhas, para não repetir a mesma na
  sequência.
- **Suave, e fica.** Só `opacity` e `transform`; entra depois das centelhas e fica na tela
  até um toque no "x" (alvo de 72 px, no canto de cima). Não some sozinho: quem lê marca o
  próprio tempo. Um de cada vez; se outra frase chegar, ela toma o lugar. Não aparece no
  cantinho dos pais, no styleguide nem com ela dormindo, e sai sozinho ao entrar neles.
  (Antes sumia num tempo de leitura calculado por letra, e a forma de aparecer e sumir
  confundia; foi trocado por ficar até o "x".)
- **Desliga no cantinho.** `pais.narracao`, ligado por padrão. Se ela estiver jogando
  sozinha, o texto não serve e vira ruído.
- Onde vive: `src/data/narracao.json` (as frases), `src/core/narracao.ts` (o canal e a
  escolha, puro), `src/ui/balao.ts` (o balão), `tests/narracao.test.ts`.

## Opções, no cantinho dos pais

O Anderson sentiu falta de um botão de opções com o que é do aparelho: buscar versão nova,
reiniciar e afins. Fica dentro do cantinho dos pais (a regra 8 continua: o único texto do jogo
mora ali), num botão **Opções** no alto, ao lado de "Voltar para a casa". O que decidi:

- **Versão nova** pergunta ao service worker (`registration.update()`). Cada build muda o
  arquivo do service worker, então "arquivo diferente" é "versão nova". O registro continua em
  `autoUpdate`: a versão nova instala, assume e o jogo reabre sozinho; o texto avisa e oferece
  Reiniciar se não reabrir. Sem internet, o botão diz isso e não tenta.
- **Reiniciar o jogo** é um `location.reload()`. **Recomeçar o dia** zera só o `hoje` (a família
  recebe de novo, a roda pergunta de novo) e pede dois toques, porque a roda pode dar pedrinha
  de novo. **Limpar e reabrir** tira o service worker e os caches e recarrega: para o jogo preso
  numa versão antiga. Save e gravações moram no localStorage e no IndexedDB, não no cache, e
  ficam.
- **Instalar** usa o `beforeinstallprompt` do Chrome quando ele existe; senão aponta para as
  instruções manuais. **Tela cheia** para quem joga no navegador sem instalar.
- **Proteger as gravações** pede `navigator.storage.persist()` e mostra se o celular prometeu,
  mais o espaço que o jogo ocupa. Exportar continua sendo a garantia.
- **Testar** toca o sininho (e destrava o áudio) e faz a voz do aparelho dizer "olá, estrela",
  com o caminho para instalar uma voz em português quando não há.

Onde vive: `src/core/aparelho.ts` (sem DOM, com teste em `tests/aparelho.test.ts`),
`src/telas/pais.ts` (`abrirOpcoes`), `src/main.ts` (o registro do service worker saiu daqui).
## A casa abre por sessão terminada, não só por dia

Quem testava ficava preso no piano: na sessão 1 só ele existe, e a sessão 2 só vinha em outro
dia. Agora a etapa da casa é o maior entre os dias de jogo e as sessões terminadas (uma
despedida, ou dormir, conta uma). Uma volta inteira no mesmo dia (piano, casinha verde,
bichos, despedida) abre a etapa seguinte na hora. Duas saídas visíveis: quando a música do
piano acaba, a mãozinha aponta a casinha; e tocar na família na sala faz eles chamarem para
os bichos e para a despedida. A segunda abertura no mesmo dia pula só o que já aconteceu hoje
(roda, prato, som), não mais tudo.
