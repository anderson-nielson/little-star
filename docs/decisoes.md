# Decisões da v1

> As perguntas de `docs/revisao-gameplay.md` ficaram sem resposta antes de implementar, e a
> orientação foi decidir tudo. Aqui está o que decidi, por quê, e onde isso muda a SPEC e o
> GAMEPLAY. Tudo que é dado ou opção do cantinho dos pais pode ser trocado sem código.

| # | Pergunta | Decisão | Onde vive |
|---|---|---|---|
| P1 | Hora da tela | O jogo não assume hora. A roda e o prato perguntam sobre o que houve **desde a última sessão**, e as frases não dizem "hoje". De manhã, a primeira pergunta é sobre a noite. A partir de 30 min antes da hora de dormir só existe o laço da noite. | `src/core/laco.ts`, `src/data/frases.json` |
| P2 | Aparelho | PWA instalável nos dois; retrato pelo manifesto; instruções de Acesso Guiado e Fixação de tela no cantinho dos pais. O gesto de voltar do aparelho volta para a casa. | `vite.config.ts`, `src/core/roteador.ts`, `src/telas/pais.ts` |
| P3 | Letras e escola | Ordem do jogo: A, E, L, S, T (as do nome dela, que ela já reconhece), depois O, M, U, I, V; uma por semana, com as imagens do jogo. Os pais podem adiantar, segurar ou deixar livre. | `src/data/letras.json`, cantinho dos pais |
| P4 | Palavras | Trocadas por palavras de sílaba aberta em que cada letra soa como o som ensinado: LUA, AVÓ, ELA, OLÁ, UVA, MALA, SALA, LAMA, MOLA, TATU, TUTU, TELA, LATA, MATA, LIMA, VELA, LUVA e STELLA. Um teste impede L no fim da sílaba, S entre vogais, TI e vogal átona final. | `src/data/palavras.json`, `tests/dados.test.ts` |
| P5 | Casa | Numa tela só, sem rolagem. Tocar num objeto abre a atividade. | `src/telas/casa.ts` |
| P6 | Quem marca | O toque dela basta; o objeto da roda só aceita o toque depois que a pergunta acabou de ser falada. A confirmação dos pais é brilho a mais. | `src/telas/roda.ts`, `src/telas/pais.ts` |
| P7 | Vozes | Gravadas no app (MediaRecorder), guardadas só no aparelho, com exportar e importar. Cada frase tem um dono; 50 obrigatórias e o resto opcional. Sem gravação, a cena acontece sem voz. Palavras inteiras e nomes de figuras podem vir da voz do aparelho; o som isolado da letra e os nomes próprios, nunca. O som da letra sem gravação: vogal pela voz do aparelho (nome e som coincidem), consoante pelo sintetizador de fonemas (formantes e ruído filtrado no Web Audio), inclusive no meio das frases de ensinar ("sss... sssss... sapo", sem "de" no meio) e na leitura do bilhete, que lê som a som. A etapa de juntar da palavra usa os mesmos sons curtinhos (não mais piano). Enquanto uma voz ou som de letra fala, a música de fundo some. | `src/audio/vozes.ts`, `src/audio/fala.ts`, `src/audio/fonemas.ts`, `src/audio/sintese-fonemas.ts`, `src/data/frases.json` |
| P8 | Roupa | Vestido rosa em casa; tutu e coque só no palco. | `src/puppet/boneco.ts` |
| P9 | Proporções | Stella 1, Theo 1,5, pais 2 (o pai 2,1). | `src/puppet/boneco.ts` |
| P10 | Voltar | A casinha verde no canto de cima, 72 px. A porta fica só para a aventura. | `src/puppet/objetos.ts` |
| P11 | Jardim | Ida e volta: buscar o coelhinho e voltar para casa, 9 larguras de tela cada perna. Um obstáculo a cada 2 compassos de caminhada (uns 8 na ida); nas duas primeiras aventuras, a cada 4. Janela do pulo 0,7 s. Escorregão de 1,6 s. Em dados. | `src/telas/jardim.ts` (`JARDIM`) |
| P12 | Semana | Cores da tradição Waldorf (dom dourado, seg roxo, ter vermelho, qua amarelo, qui laranja, sex verde, sáb azul). Brincadeira do dia: dom família, seg palavras, ter caderno, qua pinhas, qui areia, sex piano, sáb jardim. | `src/ui/tokens.css`, `src/core/laco.ts` |
| P13 | O resto | Mãe de cabelo castanho escuro na altura do ombro e vestido rosa-velho; pai de testa alta, barba cheia e óculos finos sem hastes, castanho claro, camiseta verde-mata (opção C, escolhida entre três); gatinho cinza-areia, coelhinho branco; nomes candidatos Mimi, Luna, Bolota e Pipoca, Nino, Flor; nome do jogo Little Star; comidas iniciais tomate, cenoura, banana, brócolis, uva, pão (trocáveis); festas das estações ficam para a v2. | dados e cantinho dos pais |

## As respostas que chegaram depois

O Anderson respondeu P1 a P7 na página das telas enquanto a v1 era implementada. O que mudou:

| # | Resposta | O que mudou |
|---|---|---|
| P1 | "Raro. Quase nunca." | A casa se abre em quatro sessões, não em seis (`ABERTURAS`), para o Jardim não levar dois meses. O limite diário importa pouco; o convite da despedida importa muito. |
| P2 | "Samsung Galaxy" | Android: as instruções do cantinho dos pais falam primeiro de Chrome, Instalar aplicativo e Fixar janelas. A voz do aparelho em português vem do Google TTS. |
| P3 | "Não, mas ela conhece as letras do nome dela e do Theo" | A escola ainda não apresentou letras, então a ordem é do jogo, e começa pelas que ela já reconhece: A, E, L, S, T, e a porta ganha STELLA na quinta letra. Depois O, M, U, I, V. A palavra de cada letra traz no máximo uma consoante que ela ainda não traçou (um teste guarda isso). |
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
- **Segunda sessão no mesmo dia**: um toque na porta fechada reabre, pulando roda, prato e som. Só enquanto há dia de tela: passado o limite, a porta fica fechada e responde (laço brilha, tchau), porque reabrir levaria da chegada direto para outra despedida. O descanso na porta fechada não conta como tempo de tela; a rotina da noite abre sempre.

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
| Subir na árvore | Tocar num galho mais alto e ela sobe até ele, sem pressa. Do alto vê a casa verde de cima, o Theo acenando e, à noite, as estrelas das noites bem dormidas. O Theo sobe junto só nos galhos baixos. Quando o gatinho está no topo, a cena vira só a abertura da Árvore Grande: ela vê o gatinho lá em cima e o toque leva direto para a subida de perto, sem subir duas vezes. | `src/telas/arvore.ts` |
| A Árvore Grande | O gatinho subiu ao topo e não sabe descer. Cada toque, ela pula para o galho de cima (sete galhos, como os degraus da escada do escorregador), sem nada caindo e sem pressa. No topo ela abraça o gatinho e vai para o palco. Abre depois da primeira aventura terminada. Música: a Marcha. | `src/telas/arvoregrande.ts` |
| O Lago dos Cisnes | Cinco faixas de vitórias-régias e cisnes que vão e voltam (nunca somem pela beirada). Toque = pular para a frente, e o pulo espera a plataforma chegar. Caiu na água? Splash onde caiu, ela nada de volta até onde estava e tenta de novo, sem perder nada. É ida e volta: ela vai até o coreto, uma luz acende, e volta pulando para a margem de casa, onde a aventura fecha. Abre depois da segunda aventura. Música: a Dança dos pequenos cisnes. | `src/telas/lago.ts` |
| A porta | Com mais de uma aventura aberta, três figuras (coelhinho, pinha com o gatinho, cisne) para escolher; a do dia brilha e vai sozinha depois de 14 s. | `src/telas/casa.ts` |
| Espanhol | A Estrellita (a primeira boneca da estante) diz o outro nome das coisas: nas palavras em destaque, na comidinha, na horta e no palco (às vezes conta a entrada em espanhol, e diz "¡Muy bien!"). Entra sozinho com três letras traçadas, ou como os pais mandarem. Gravação `es_<id>` se houver; senão, a voz do aparelho em espanhol; sem voz, silêncio. | `src/audio/espanhol.ts`, `src/data/espanhol.json` |
| Ukulele | Quatro cordas para dedilhar (Karplus-Strong), afinadas em sol, dó, mi, lá: soltas, dão a afinação; três botões de cor apertam dó, fá e sol7 nas posições de verdade. Corpo rosa em oito, com cintura, cravelhas e trastes. As bonecas balançam. | `src/telas/ukulele.ts` |
| Vestir bonecas | Roupa, cabelo e gorro por cores; a Estrellita só troca o gorro. Tocar na Stella leva a boneca escolhida no bolso do tutu: ela assiste ao palco da coxia. | `src/telas/bonecas.ts` |
| Bilhetinho | As vogais (que ela já sabe) e as letras que ela traçou são carimbos; vão para o papel rosa; ela entrega para a mãe, o pai ou o Theo, que lê em voz alta (a voz do aparelho lê letra a letra e depois junto) e abraça. Os pais veem os bilhetes no cantinho. | `src/telas/bilhete.ts` |
| Festas das estações | Outono: folhas no quintal e a Festa da Lanterna (20 a 31 de maio). Inverno: fitinha no pinheiro e a festa junina com fogueira e bandeirinhas (12 a 30 de junho). Primavera: flores no pinheiro e guirlanda na porta (21 a 30 de setembro). Verão: conchinhas na areia. Advento: a espiral de velas, uma por domingo. Os pais podem desligar. | `src/core/festas.ts`, `src/data/festas.json` |
| Piano | O seguir a estrelinha alterna *Brilha, brilha* e *Ciranda, cirandinha*. | `src/telas/piano.ts` |

A primeira semana continua abrindo a casa em quatro sessões; o que é novo entra junto com o
que já estava: ukulele, bonecas e bilhete na sessão 2; árvore e horta na 3; cozinha na 4.
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
- **Revisão das frases (segunda rodada).** As 90 frases passaram por uma leitura crítica:
  29 ficaram, 42 foram ajustadas, 15 reescritas e 4 cortadas (substituídas). O que saiu:
  frases na voz de um adulto falando da Stella em terceira pessoa ("a mamãe pensou: como
  ela está crescida" não funciona quando a mãe lê); linguagem abstrata para 5 anos
  ("cuidar do seu corpo é um jeito de cuidar de você"); comparação disfarçada ("o Theo
  também fez com a sua idade"); frases que nomeiam a corrida ("não é corrida", "ninguém
  tira o lugar de ninguém"); um fato arriscado ("você tinha medo do chuveiro"); e as
  quatro de "aventura", que falavam de galho, pescar e girar no ar mas só disparam no
  palco de dança. O Theo passou a "mano", que é como ela o chama. O teste agora exige
  "mano" e proíbe "corrida", "compet" e "com a sua idade".
- **Terceira passada, mais dura.** Sem apelido: "estrelinha" e "a Stella da casa verde"
  viraram só Stella, no balão e nas falas gravadas. Sem exagero ("de boca aberta", "coragem
  de gente grande" por uma cama arrumada), sem palha ("guarda cada uma no coração", "um
  pedacinho do mundo que fica seu"), sem lição de moral ("esperteza é isso: olhar, tentar e
  conseguir"), sem a segunda oração que explica a primeira. "Força" e "coragem" ficaram só
  onde cabem. As 19 frases do parquinho e do quarto dormindo passaram pelo mesmo pente, e
  saiu um erro de fato ("dez balanços, dez pedrinhas": o balanço vale uma).
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

## Revisão do fônico por fonemas (setembro de 2026)

O teste no celular mostrou dois problemas na tela da palavra.

- **ASA ensinava errado.** S entre vogais soa Z no português do Brasil ("aza"), e o mesmo
  vale para MESA ("meza"). As duas saíram e o teste dos dados passou a proibir S entre vogais.
  No lugar entrou o V, a consoante que se estica ("vvv") que a spec já previa: AVÓ é a palavra
  do A (a-vvv-ó, cada letra com o som ensinado, e uma pessoa que ela ama), UVA a do U, VELA a
  do V, e LUVA completa. O V é a décima letra do caderno (o vale entre as duas montanhas do M).
  AVÓ traz duas letras antes da hora (V e Ó); aceito porque o Ó é o mesmo som de OLÁ e não
  havia palavra com A inicial e só uma consoante nova que soasse certo.
  A figura ASA ainda ficou como exemplo do som no traçado do A ("aaa... asa"); trocada por
  AVÓ, a mesma palavra da fase, e o teste dos dados agora vigia a figura falada no caderno.
- **Não se sabia o que fazer nem se estava avançando.** A tela tinha a fita e a estrela, mas
  nenhum convite e nenhum sinal de etapa. Agora as quatro etapas do fônico são sempre as
  mesmas e cada uma é mostrada com a língua sem palavras do jogo: a estrela guia soa letra
  por letra (ouvir), a mãozinha faz o gesto de traçar (os sons), a estrela corre rápido e a
  voz diz a palavra (juntar), a próxima palavra acende num círculo de luz (pronta). Três
  estrelinhas embaixo da fita acendem uma por etapa; um colar no alto mostra as palavras da
  fase, com as lidas cheias de ouro. As palavras lidas inteiras ficam no save
  (`palavras`) e no cantinho dos pais. Arquivos: `src/telas/palavra.ts`,
  `src/core/palavras.ts`, `tests/palavras.test.ts`.

## A luz da casa passa adiante

O pedido: a Stella, a mãe e o pai deviam saber, na casa, o que já foi explorado e o que ainda
pode ser. Antes, a luz ficava na brincadeira do dia mesmo depois de ela brincar, e coisa nova
aparecia sem aviso.

- **A luz anda.** `luzDaCasa()` em `src/core/laco.ts`: a brincadeira do dia, enquanto não foi;
  depois a coisa aberta que ela nunca tocou; depois o que está aberto e ainda não foi hoje; por
  fim a família na sala, que chama para o fim. Tudo feito, apaga. A mãozinha segue a luz.
- **O que já foi hoje** guarda em `hoje.brincadas` (zera no dia seguinte) e ganha uma centelha
  de ouro parada na casa. O que ela já tocou alguma vez fica em `visitadas`, para sempre.
- **Coisa nova balança devagar** (`respira`, como o coelhinho novo) até o primeiro toque.
- **Cantinho dos pais**, em "A casa hoje": onde a luz está, o que ela brincou, o que está aberto
  esperando por ela (com "nova" no que nunca tocou) e o que ainda está fechado, com a etapa em
  que abre.
- Sem número, sem barra, sem "faltam 3": continua a língua de sinais da seção 5 do GAMEPLAY.

## O varal de bandeirinhas

O pedido: um placar no alto da casa mostrando o que já foi explorado e o que não. Para não
contrariar a língua de sinais (sem número, sem barra), virou um varal no céu, acima do telhado.
Aprovado pela família depois de ver os prints em oito cenários (dia, tarde, noite, festa, celular pequeno).

- Cada coisa **aberta** pendura uma bandeirinha redonda com o desenho dela. Dourada com
  centelha: brincou hoje. Clarinha: aberta, ainda não hoje. Fio rosa balançando: nunca tocou.
  Um anel dourado marca onde a luz está.
- O que ainda está fechado **não** pendura bandeirinha: o varal cresce com a casa.
- Tocar numa bandeirinha: a mãozinha mostra onde aquilo mora na casa.
- Com a casa toda aberta são 15 bandeirinhas pequenas: servem para ver, não para mirar.
  Arquivo: `src/telas/casa.ts` (`varal`, `MINI`).

## O jogo parecia travado: trilha do avanço e um fim que se vê

O teste no celular: "na maioria das telas o jogo é meio travado; na caixa de areia não fica
claro o que fazer nem se estou avançando". Medimos antes de mexer: com a CPU seis vezes mais
lenta, todas as telas seguem a 60 quadros por segundo. Não era lentidão. Eram três coisas.

- **Nenhuma tela, fora a da palavra, mostrava avanço, e nove nunca acabavam** (areia, horta,
  relógio, piano, ukulele, bonecas, a mesa das pinhas, lira, árvore). Agora existe uma
  **trilha** no alto de toda brincadeira com rodadas (`trilha()` em `src/telas/comum.ts`): uma
  conta por rodada entre a casinha e a lua, cheia de ouro quando feita, a estrelinha na de
  agora. É o mesmo colar da tela da palavra, virado sinal comum (GAMEPLAY, seção 5). Entrou
  na areia, no som (3 rodadas), na roda (um objeto por conta), na noite (5 passos), nos bichos
  (um cuidado por conta), no caderno (as duas vezes da letra) e no relógio (3 pedidos).
  **`convidarParaCasa()`**: quando a volta de uma tela sem fim termina, a casinha acende e a
  mãozinha aponta para ela. Ela pode continuar; mas sabe que acabou e para onde ir.
- **A caixa de areia não tinha meta em nenhum dos três jeitos.** No dedo, a trilha tem uma
  conta por letra que ela sabe e a mãozinha deixa um rastro de luz. Na pá, três montinhos com
  brilho mostram onde cavar (cavar fora faz um buraquinho vazio, sem erro). No balde, três
  baldes fazem um castelo com bandeirinha, e aí o gatinho acende. O rastelo ficou menor e
  tracejado: é um gesto, não um jeito de brincar.
- **Toque ignorado em silêncio.** Enquanto uma cena termina (`travar`), o toque num alvo não
  fazia nada, nem som. Parecia que o jogo tinha travado. Agora ganha o sininho baixinho, como
  o toque em algo que não faz nada.
- **O balão de narração cobria a casinha e a trilha** até alguém tocar no "x". Ele continua
  sem sumir sozinho, mas quando ela volta a tocar na cena ele se recolhe numa bolinha no alto;
  quem lê toca na bolinha e a frase volta. Muda a decisão do balão (PR #15) só nisso.

## O parquinho do condomínio

A Stella vai ao parquinho do condomínio e faz sempre a mesma volta: se balança sozinha no
balanço, contando até dez em voz alta, depois vai ao escorregador, depois à gangorra. O Theo
vai junto e não brinca no lugar dela: cuida, olha, e se orgulha da força, da coragem e da
esperteza dela. O estudo está em `docs/parquinho.md` e nas telas de
`docs/referencia/parquinho.html`. O que entrou no jogo:

- **Fora da porta, pelo balancinho.** Um balanço pequeno na beirada do quintal (etapa 3, com a
  árvore e a horta) leva ao parquinho. Três telas, uma por brinquedo; os outros dois aparecem
  pequenos na cena e se tocam para ir. Nada é trancado; a mãozinha aponta o próximo da volta
  dela quando ela para.
- **O balanço é um pêndulo** (`src/core/parquinho.ts`, puro e testado): seno e amortecimento,
  período de 2,4 s, perde metade da altura em uns oito ciclos. Arrastar e soltar dá o primeiro
  balanço. **O impulso é dela**: cada toque estica as pernas a favor do movimento, vale mais
  perto do ponto mais baixo, e a energia tem teto em qualquer ângulo. Ninguém empurra; não
  existe toque errado. Uma nota da lira por passagem embaixo; balanço alto, o Theo bate palma.
- **Contar até dez** é uma camada do balanço, ligada no cantinho (`contarNoBalanco`, vem
  ligada): cada ida completa com balanço alto solta uma pedrinha para um pote na cena, com
  tique e a voz contando. Nenhum número escrito. Os números são palavras inteiras, então a voz
  do aparelho diz enquanto a família não grava `num_1` a `num_10`. No dez, uma pedrinha de
  verdade (`PEDRINHAS.balanco`) e o Theo admira ("Olha a Stella, que força!").
- **O escorregador**: cada toque sobe um degrau, com uma nota mais alta; no alto ela espera; um
  toque e desce como cena, cabelo para trás, lira descendo. O Theo fica embaixo, na saída
  ("Que coragem, Stella!"). Ela volta andando sozinha.
- **A gangorra**: ela numa ponta, o Theo de pé na outra segurando a tábua. Só o pé no chão faz
  subir; no ar, sininho baixinho. A descida é macia porque ele segura (amortecimento quase
  crítico), e nunca bate. Cinco subidas, centelhas e "Que esperta, empurrou com o pé!".
- **A roda pergunta** "Você brincou no parquinho?" (o balancinho, dono Theo; tarefa
  `parquinho`, ligada por padrão). Não ir não tira pedrinha: parquinho não é combinado. A
  lembrança é um balancinho de madeira na mesa da estação.
- **A despedida convida** para o parquinho de verdade quando ela foi ao do jogo no dia
  (`hoje.parquinho`): "Vamos ao parquinho de verdade?", com o balancinho no balão. É o jeito
  Waldorf de fazer tela: apontar para fora.
- **A narração** ganhou `balanco`, `parquinho`, `escorregador` e `gangorra`, com o Theo como
  quem torce por ela em todas.
- **Um detalhe de implementação**: a classe `.alvo` do CSS muda a origem da transformação
  (`transform-box: fill-box`), então os grupos que giram (o balanço, a tábua) nunca a levam; os
  alvos do toque são retângulos parados por cima.

## O botão das opções, em todas as telas

O cantinho dos pais é completo, mas fica atrás da lua e da continha: para desligar o som ou
lembrar o que fazer numa tela, era preciso sair do jogo dela. Agora toda tela do jogo tem um
botão pequeno no canto de cima, à direita, que abre um painel correndo da direita para a
esquerda (`src/ui/opcoes.ts`).

- **É para o adulto.** O botão tem 40 px, fica na borda morta onde a mão segura o aparelho e
  usa a estrelinha de quatro pontas do jogo, não uma engrenagem (SPEC: nada de ícone
  abstrato para ela). Nada no painel muda o jogo dela; o toque ali nunca chega na cena.
- **Ajuda desta tela**: o que é e o que fazer, em duas frases, para quem joga junto. Os textos
  são dado (`src/data/ajuda-telas.json`); um teste garante que toda tela registrada tem o seu.
  A mesa da estação tem ajuda própria, separada das pinhas.
- **Som**: desliga tudo de uma vez (música, efeitos, vozes gravadas e a voz do aparelho) pelo
  ganho mestre, sem suspender o áudio, para o relógio mestre seguir. Fica guardado
  (`pais.mudo`). Com o som desligado, um selinho veludo aparece no botão, para ninguém achar
  que o jogo quebrou; o teste de som do cantinho também avisa.
- **Balão de leitura** liga e desliga daqui também.
- **Tela cheia**, só quando o navegador deixa e o jogo não está instalado.
- **Atualização**: mostra a versão ("Little Star abc1234"), se está instalado ou no navegador,
  e procura uma versão nova pelo mesmo caminho do cantinho (`buscarNovaVersao`). Com versão
  nova, o jogo baixa e reabre sozinho. **Instalar na tela inicial** aparece quando o Android
  oferece.
- **Cantinho dos pais**: um atalho que continua pedindo a continha.
- **A lua desceu** de y 40 para y 104 na cena, logo abaixo do botão, para os dois não se
  cobrirem. O balão de narração deixa 48 px livres à direita pelo mesmo motivo.
- O "voltar" do aparelho fecha o painel se ele estiver aberto.

## Sai a lira do quarto

A lira tocável parecia uma harpa pendurada ao lado do ukulele, e dois instrumentos de corda na
mesma parede confundiam. O quarto fica só com o ukulele: sai a tela da lira, o desenho na parede,
a entrada na etapa 2, a ajuda e a foto do e2e. O som de corda dedilhada que marca as passagens
do jogo (a escala subindo e descendo, as notinhas das brincadeiras) continua; é o mesmo timbre
do ukulele, não um objeto na casa.

## O Theo sai do centro

A mãe jogou e disse que o jogo estava exagerando no Theo: ele ensinava, segurava, resgatava e
aparecia em quase toda frase do balão, levando crédito pelo que era da Stella. O jogo é dela e
da autonomia dela. O Theo continua na família, mas deixa de ser professor, salva-vidas e
plateia principal.

- **Sai o professor.** No som do dia, no caderno e na palavra, quem aparece na página é a
  Stella; a estrela guia e a mãozinha mostram o caminho. As histórias das letras, "Foi você
  que fez essa letra!" e "Toca aqui." passam a ser de qualquer um.
- **Sai o resgate.** No lago, cair na água é splash: ela senta, sacode e sobe de novo sozinha
  ("Splash! Sobe de novo, Stella.", `lago_splash`). Na ajuda A2 é a vitória-régia que chega
  perto. Na Árvore Grande, a pinha cai na cestinha, não na cestinha do Theo. Na árvore do
  quintal ele não sobe mais junto: acena do chão, com a mãe.
- **O parquinho é dela.** Balanço e escorregador sem o Theo em cena; as palmas vêm de fora,
  com "Que força, Stella!" (`viva_forca`) e "Que coragem, Stella!" (`viva_coragem`), que
  qualquer um grava. Na gangorra, que é para dois, ele fica na outra ponta, e a descida macia
  é da própria tábua, não porque ele segura.
- **A roda.** O Theo pergunta só da gentileza; brinquedos passam para a mãe e parquinho para o
  pai. O desenho da gentileza é a Stella com o gatinho.
- **As horas** do relógio passam a ser de qualquer um; o Theo continua pedindo a hora, que é
  uma brincadeira entre os dois.
- **O balão.** O "mano" saiu de quase todo avanço: sobrou em quatro frases, como família por
  perto (a chegada, o palco, a despedida, a outra ponta da gangorra). O teste agora exige o
  contrário do anterior: no máximo quatro frases com o mano, nenhuma nas letras, sons, relógio,
  balanço e escorregador, e nada de "porque o mano", "o mano mostra/segura/pesca/empurra",
  "como o mano" ou "irmã dele".
- **Gravações.** As frases que mudaram de texto ou de id (`letra_pronta`, `cozinha_pronto`,
  `comemora_brinquedos` com texto novo; `lago_splash`, `viva_forca`, `viva_coragem` com id
  novo) precisam ser gravadas de novo no cantinho dos pais.

## Ler e escrever mais perto

A Stella tem adorado escrever e ouvir os sons das letras, então o caminho até isso encurta.

- **A mala das palavras abre na sessão 2**, junto com o caderno, em vez da 3. A fila de
  palavras já nasce da letra da vez, então não precisa esperar letra traçada.
- **O caderno sai de trás da Stella.** Ela ficava de pé bem na frente dele e o toque caía nela.
  Agora ela fica ao pé da cama, não recebe toque (é enfeite) e o caderno cresceu, com a letra
  da vez maior e uma área de toque folgada em volta.
- **Da palavra pronta, direto para o caderno.** Ao lado da próxima palavra aparece o caderno com
  a letra da vez. Sem próxima, a mãozinha aponta para ele em vez da casinha. Caderno leva à
  palavra da letra, palavra leva de volta ao caderno: dá para ficar no ciclo de escrever e ler.
- **Conserto:** o toque no círculo da próxima palavra não funcionava. A fita soltava qualquer
  dedo que tocasse longe dela, inclusive o que tinha acabado de apertar o círculo. Agora a fita
  só pega o dedo que chega perto dela.

## O som do dia, repensado

O pedido: a fase de ouvir o som e achar a figura era das preferidas, mas sumia. Ela vinha uma
vez por dia, no laço, e depois não havia como voltar; as quatro figuras só apareciam na
terceira rodada, e só se ela acertasse as duas primeiras. Revendo com o que mudou desde a v1
(o sintetizador de fonemas, a luz da casa, o varal, a trilha), ficou assim:

- **Mora na casa.** O mural das figuras, um quadrinho de cortiça com quatro cartinhas na parede
  da cozinha, abre o som do dia a qualquer hora, com figuras novas a cada vez (`som` em
  `COISAS`, com bandeirinha no varal e luz da casa). Abre na etapa 2, junto com o caderno. Pelo
  mural, o fim acende a casinha; na volta do dia, a sessão segue como antes.
- **Quatro figuras sem condição.** A primeira rodada aquece com três; as outras duas têm quatro.
  A regra antiga (quatro só com duas certas) punia em silêncio quem errava.
- **Cresce com o caderno.** A rodada do meio é de uma letra que ela já traçou; a primeira e a
  terceira são da letra da semana, com figuras diferentes.
- **O som dito é o da figura.** O O falava "ó" e mostrava ovo, que começa com "ô". Agora o som
  de cada rodada é o som inicial da figura certa (`somInicialDaFigura`), como no caderno e na
  areia.
- **Cada figura soa diferente.** Antes as outras figuras vinham de qualquer letra e podiam ser
  duas do mesmo E (égua e elefante). Agora cada figura na tela é de uma letra diferente e
  começa com um som diferente. Arquivos: `src/core/somdodia.ts`, `tests/somdodia.test.ts`,
  `src/telas/som.ts`, `src/telas/casa.ts`.

## A rotina ilustrada do dia

O teste com adulto: "não sei em que etapa estou, o que falta, o que está fechado, o que ainda
não explorei". Três causas. O laço do dia e a casa livre eram dois jogos sobrepostos sem
fronteira visível. O que estava fechado era invisível, e o que abria (terminar uma sessão, ou
outro dia) era segredo. E eram seis sinais sutis para dizer quatro coisas: contorno de luz,
centelha parada, bandeirinha dourada, bandeirinha clarinha, fio rosa balançando, anel dourado.

- **A rotina ilustrada** no lugar do varal: os passos de hoje em fila, no alto da casa, como o
  quadro da parede do jardim Waldorf. Cheia com selinho, já foi; anel de luz, agora; vazia,
  ainda vem. Uma tábua clara atrás da fila, para ler como uma coisa só. `rotinaDoDia()` e
  `passoDeAgora()` em `src/core/laco.ts`; `rotina()` em `src/telas/casa.ts`.
- **O fechado aparece**: silhueta cinza no lugar da coisa (classe `.fechado`). Tocar mostra o
  lacinho e a mãozinha, como antes.
- **Três sinais**: contorno de luz (pode tocar), cartinha cheia (já foi), silhueta (ainda não).
  Saem a centelha parada do "feito hoje" e o balanço do "nunca tocou". Continua sem número e
  sem barra; ganha ordem e lugar.
- **"Onde a Stella está"** nas Opções, sem a continha: etapa, o que já foi, o que falta, o
  que abre na próxima etapa e como se abre. `NOME_COISA` foi para `laco.ts`.
- `hoje.bichosFeitos` marca os bichos cuidados, no laço (`sessao.avancar()`), para a rotina.
- Medidas: cartinhas de raio 20, desenhos a 1,45 do tamanho base, selinho do visto sempre na
  borda de baixo à direita, fio dourado que para na última cartinha feita.

## Os cuidados: cama, dentes e brinquedos viram brincadeira

O pedido: arrumar os brinquedos, escovar os dentes e arrumar a cama podiam ser uma atividade
cada, com uma tela para cada, porque cada uma tem o que ensinar: a ordem, o jeito de fazer e a
paciência de ir até o fim para ver o resultado bonito. A roda continua igual (pergunta se ela
fez de verdade e dá a pedrinha); as telas novas são o treino, e a despedida convida para fazer
de verdade.

- **Três telas, um quadro de passos.** `cama`, `dentes` e `brinquedos`. No alto de cama e
  dentes, no lugar das contas, fica um quadro de rotina com um desenho por passo
  (`quadroDePassos` em `comum.ts`): o feito fica dourado, o de agora tem a estrelinha. Só o
  passo da vez responde; o resto balança ou faz o sininho baixinho. Em brinquedos a ordem não
  importa, então a trilha é a de sempre, uma conta por brinquedo.
- **A cama**, na ordem de verdade: tirar travesseiro e bichinhos (vão para a cadeira), esticar
  o lençol (o dedo passa e as rugas somem), puxar a coberta do pé até a cabeceira, afofar o
  travesseiro (três toques) e pôr os bichinhos de volta. A coberta é o momento de persistir:
  soltou antes de 40% do caminho, ela escorrega de volta devagar e dá para puxar de novo. No
  fim o gatinho sobe e deita.
- **Os dentes**: molhar a escova, um pouquinho de pasta (a ervilha aparece do lado para mostrar
  o tamanho), os de cima, a língua, os de baixo, enxaguar, guardar. Escovar é esfregar o dedo
  devagar na parte que brilha. Cada escovada toca a próxima nota do *Brilha, brilha*, e as três
  partes juntas tocam a música inteira: a canção é o tempo de escovar. Esfregar com pressa não
  acaba antes (`VELOCIDADE_MAXIMA`), e as sujeirinhas somem aos poucos.
- **Os brinquedos**: cada coisa tem a sua casa, com o desenho do morador na frente (livros na
  estante, blocos na caixa, ursinho e bola no cesto). Um de cada vez, arrastando. Na casa de
  outro, o brinquedo pula sozinho para a dele e a casa certa acende; no chão, volta para onde
  estava. Com o tapete limpo, a família senta junto: arrumado, cabe todo mundo.
- **Na casa**: a cama do quarto abre a cama; no térreo, a pia com o espelho abre os dentes e a
  caixa de brinquedos abre os brinquedos. No varal é uma bandeirinha só (`cuidados` em
  `COISAS`), para o varal não passar de duas cordas; a luz e a centelha do feito hoje vão em
  cada um dos três lugares. Abre na etapa 4, junto com a cozinha.
- **Sem pedrinha.** A pedrinha é do que ela faz de verdade, e isso a roda já conta. O treino
  ganha a comemoração, o balão (`arrumou_a_cama`, `escovou_os_dentes`, `guardou_os_brinquedos`)
  e o convite da despedida (`convite_cama`, `convite_dentes`, `convite_brinquedos`), que vale
  mais que o da brincadeira do dia e menos que o do parquinho.
- **A ajuda de sempre.** A1 mostra o gesto com a mãozinha (esticar, puxar, esfregar, levar até
  a casa). A2 faz junto, devagar: uma ruga por vez, a coberta sobe, uma escovada por segundo, um
  brinquedo vai sozinho. Nenhuma tela trava.

Arquivos: `src/core/cuidados.ts`, `tests/cuidados.test.ts`, `src/telas/cama.ts`,
`src/telas/dentes.ts`, `src/telas/brinquedos.ts`, `src/telas/cuidados.ts`, `src/telas/casa.ts`,
`src/telas/despedida.ts`, `src/data/frases.json` (grupo `cuidados`), `src/data/narracao.json`.

### Depois de ver com a família

- **A cama é a da manhã.** Ela amanhece como amanhece de verdade: lençol embolado num canto,
  travesseiro torto, o coelhinho com quem ela dormiu deitado de lado, a coberta torta com a
  ponta caindo, o ursinho e a bola no chão, o sol nascendo na janela. O lençol agora se puxa
  do canto antes de alisar, e o último passo arruma o que caiu no chão (bichinhos na cama, bola
  no cesto). Os ids dos passos não mudaram.
- **Dentes mais de verdade.** Uma sujeirinha em cada dente, cada uma num lugar, e umas lasquinhas
  fininhas entre um dente e outro, discretas; somem fora de ordem. A pasta é a de abacaxi,
  amarelinha clarinha, com o abacaxi no tubo. Cada escovada faz o chiadinho da escova
  (`escovada` em `synth.ts`, ruído filtrado que sobe na ida e desce na volta) além da nota.
- **Música alegre nas fases de fazer.** A cama toca *A Primavera*, de Vivaldi, e os brinquedos a
  *Pequena Serenata Noturna*, de Mozart (`src/data/musicas/primavera.json` e `serenata.json`,
  arranjos livres de oito compassos, com a ficha em `musicas-sobre.json`). Os dentes continuam
  com o *Brilha, brilha* tocado pela escova.

## A roda que ficou para trás

O teste com adulto: a roda aparecia como "agora" nas Opções e no quadro da casa, mas nada
levava até ela. Quem saía da roda pela casinha só a via de novo reabrindo o jogo. E nas
Opções ela aparecia duas vezes, em "Agora" e em "Ainda falta".

- **A cartinha da roda se toca** enquanto a roda não foi feita hoje (`data-rodinha` em
  `rotina()`, `src/telas/casa.ts`). Leva ao tapete e, no fim, de volta para a casa, sem
  refazer o resto do laço: `sessao.desviar()` guarda para onde voltar (`src/core/sessao.ts`).
- **A mãozinha da casa aponta a roda** quando ela está pendente; senão, a brincadeira do dia.
- **"Ainda falta"** nas Opções não repete o passo de agora (`src/ui/opcoes.ts`).
- **Prato e som também.** Depois da roda, o teste mostrou a mesma lacuna no prato. A cartinha de
  roda, prato e som pendentes se toca (`data-pendente`), e a mãozinha aponta a primeira delas.

## O lago, depois de ver com a família

- **O ícone da porta é água.** O cisne era branco num círculo branco e sumia. Agora o círculo
  tem o azul do lago, uma vitória-régia e o cisne em cima.
- **Ela começa na grama.** A margem de baixo sobe até os pés dela; antes ela aparecia de pé
  na água.
- **Ida e volta, como o Jardim.** Ela atravessa até o coreto, uma luz acende, ela para um
  pouquinho olhando e volta pulando para baixo até a margem de casa, onde a aventura fecha.
  Duas contas na margem de baixo (`LAGO.travessias`) mostram a ida e a volta, a de agora com a
  centelha; na beirada direita, uma pedrinha por faixa acende do ponto de partida até onde ela
  chegou. A rede de segurança subiu para três minutos (`LAGO.duracao`), porque sem nenhum toque
  a A2 leva uns 12 s por faixa e a ida e volta tem doze pulos.
- **Buscar alguma coisa do outro lado.** A volta ganha propósito: no coreto espera uma flor
  rosa de vitória-régia, com um brilho pulsando. Ela pega, a flor voa até a mão, e ela traz na
  volta; se cair, nada com a flor bem no alto, e a flor não se perde. Chegando em casa, a flor
  vira lembrança (`lago:<dia>` em `lembrancas`, uma por dia) e aparece num copinho d'água em
  cima do piano rosa do quarto.
- **Cresce com ela.** Cada ida e volta completa (`idasEVoltasNoLago`, no estado e no cantinho
  dos pais) deixa as faixas 8% mais rápidas da próxima vez, até 50% a mais (`LAGO.acelera`,
  `LAGO.aceleraTeto`, `ritmoDoLago`). Quando o tempo acaba antes de ela voltar, não conta: o
  ritmo só sobe depois de ela ter conseguido. A janela generosa do pulo não muda.
- **A queda aparece.** O splash acontece onde ela caiu, com ondinhas e gotas; ela afunda até a
  cintura, nada de volta até a plataforma de onde pulou (`LAGO.splash`, `LAGO.nado`), sobe e
  sacode (`LAGO.sacode`). Antes ela voltava de estalo para onde estava, e não dava para
  entender o que tinha acontecido.
- **A2 espera a vitória-régia.** Na ajuda A2 o pulo esperava zero segundo e podia cair na água
  de novo; agora espera a plataforma passar embaixo dela, quanto for preciso.

Arquivos: `src/telas/lago.ts`, `src/telas/casa.ts`, `src/telas/pais.ts`, `src/core/estado.ts`,
`src/data/ajuda-telas.json`, `tests/aventuras.test.ts`, `SPEC.md`.

## O cabeçalho segue um padrão só

Os controles do alto tinham quatro tamanhos, três estilos e nenhuma margem em comum: a
casinha num disco cinza translúcido, o balão recolhido em três pontinhos (que todo mundo lê
como "mais opções"), a lua quase invisível e o menu com a estrelinha do jogo. O balão aberto
cobria a casinha e o "x" ficava pendurado embaixo dele, no meio da tela.

Antes de decidir, quatro alternativas foram prototipadas e testadas lado a lado (alvo, alvos
sobrepostos, balão sobre a casinha, alinhamento, margens e contraste com o céu da noite, do
dia e o rosa): ícones padrão, palavras para o adulto, balão no rodapé e porteira no menu.
Ficou a das palavras.

- **Uma linha, uma margem, um contorno.** A casinha e as duas pílulas da direita têm o centro
  na mesma linha (y 44 do cabeçalho), a mesma margem de 16 até a borda, fundo de papel opaco e
  contorno de 1,5 px no ouro escuro. O fio de 1 px no ouro claro sumia no céu de dia
  (contraste 1,2:1); o ouro escuro passa de 3:1 nos três céus. A casinha é a maior (56
  desenhada, 72 de alvo), porque é dela; as pílulas têm 44 px de altura e encolhem com a casinha
  em tela pequena, nunca abaixo de 36 (`--topo-*` em `tokens.css`).
- **O adulto lê, ela não.** "Opções" e "Ler frase" são palavras, sem ícone. Para quem joga junto
  não há o que adivinhar; para a Stella, que não lê, são formas sem desenho, que chamam menos o
  dedo do que um ícone bonito. A estrelinha saiu do botão: ela é a estrela guia e a conta de
  agora, e ali não dizia "opções".
- **A lua saiu.** Ela era um segundo caminho escondido para o cantinho dos pais, que as opções
  já levam, com a mesma continha na porta. Um glifo apagado que só respondia a 2 s de dedo
  parecia enfeite ou defeito.
- **As duas pílulas moram numa linha só** (`.opcoes-linha`), dentro das opções e antes do véu:
  "Ler frase" à esquerda de "Opções", e o painel aberto fica por cima das duas.
- **O balão aberto fica abaixo do cabeçalho**, na largura da coluna, e o "x" mora no canto de
  cima à direita dele, como em todo cartão que se fecha.
- **O quadro da rotina é opaco.** Meio transparente no céu da noite ele virava um cinza sujo.
- **Guardado para depois:** se a Stella começar a abrir as opções sozinha, "Opções" pode pedir
  o dedo parado por menos de um segundo, com um anel mostrando o tempo.

Arquivos: `src/puppet/objetos.ts`, `src/telas/comum.ts`, `src/ui/opcoes.ts`, `src/ui/balao.ts`,
`src/ui/base.css`, `src/ui/tokens.css`, `src/telas/casa.ts`, `src/main.ts`, `SPEC.md`, `GAMEPLAY.md`.

## Um ícone para cada ação, sem palavras

As pílulas "Ler frase" e "Opções" não ficaram boas no jogo: texto no alto de uma tela toda
desenhada pesava mais do que a ação pedia. Voltam os ícones, um para cada ação, no mesmo
disco de 44 px da casinha: o balão de fala para ler a frase e as três linhas para as opções.
Fica o que as pílulas trouxeram de bom: a linha só, as margens iguais e o contorno de 1,5 px
no ouro escuro, que segura o contraste nos céus claros.

Arquivos: `src/ui/opcoes.ts`, `src/ui/balao.ts`, `src/ui/base.css`, `src/ui/tokens.css`,
`SPEC.md`, `GAMEPLAY.md`.

## Palavras e figuras com desenho direto (setembro de 2026)

O teste no celular: as figuras de gente (avó, ela) e a égua não se reconheciam; elefante,
árvore e ovo sim. A regra que ficou: **toda palavra e toda figura do som tem um desenho que
se reconhece de um olhar, em poucas formas**. O que mudou:

- **Palavra de cada letra.** A: LUA (era AVÓ). E: MEIA (era ELA; o E é fechado, e a lista
  de sons diz isso). L: LATA (era LUA). T: TATU (era LATA). O: MOLA (era OLÁ; ÔNIBUS seria
  melhor, mas N e B não estão nas dez letras). I: IOIÔ (era LIMA, palavra rara). A regra de
  no máximo uma consoante nova por palavra continua valendo, e o teste vigia.
- **A mala só com palavra comum.** TUTU, TELA, LAMA e MATA saíram: com as dez letras e as
  regras de som, sobram poucas palavras, e melhor doze boas que dezoito com enchimento.
  Ficam LUA, MEIA, LATA, SALA, TATU, MOLA, MALA, UVA, IOIÔ, VELA, LUVA e STELLA.
- **Figuras do som do dia.** A: árvore, abelha, avião. E: elefante, estrela, escada (as três
  começam com ê; o caderno do E diz só o som, como o do O fazia). L: lua, leão, luva.
  T: tatu, tomate, tartaruga. O: óculos, ovo, ônibus (os óculos começam com o ó aberto: o
  caderno do O ganhou figura). M: mala, mão, macaco. U: uva, urso, unicórnio. I: ilha,
  igreja, ioiô. S e V ficam como estavam.
- Desenhos novos: avião, estrela, escada, óculos, unicórnio, meia, ônibus, igreja; o tatu
  foi redesenhado (casco em arco com faixas, focinho). Saíram avó, ela e égua.
  Arquivos: `src/data/letras.json`, `src/data/palavras.json`, `src/puppet/figuras.ts`,
  `src/audio/fonemas.ts`, `tests/palavras.test.ts`, `tests/fonemas.test.ts`.
