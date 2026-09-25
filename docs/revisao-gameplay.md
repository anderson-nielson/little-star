# Revisão do gameplay antes de implementar

> Leitura completa da `SPEC.md` (v3) e do `GAMEPLAY.md`, com os tokens e a marionete do Ponta
> ao lado. Nada de código ainda. Este documento lista o que está sólido, o que briga entre os
> dois textos, o que eu mudaria e o que só a família responde. As cinco telas desenhadas para
> aprovação estão em `docs/referencia/little-star-telas.html`.

Sumário
1. O que está bom e eu não mexeria
2. Contradições entre SPEC e GAMEPLAY
3. Achados de jogabilidade
4. Achados de alfabetização (fônico em português do Brasil)
5. Achados técnicos
6. Perguntas para a família, por ordem de impacto
7. Ajustes que proponho aplicar nos dois documentos depois das respostas

---

## 1. O que está bom e eu não mexeria

- **Os três pilares** (amada, serena, reconhecida) funcionam como critério de desempate. Toda
  vez que eu hesitei numa decisão abaixo, um dos três resolveu.
- **O laço fixo de sessão** com a mesma forma todo dia. É a melhor decisão do GAMEPLAY: dá
  previsibilidade, limita o tempo por desenho e fecha fora da tela.
- **Três gestos só** (tocar, arrastar curto, traçar), com tolerâncias numéricas. Isso vira
  teste automatizado direto.
- **A ajuda invisível A0, A1, A2** que zera a cada atividade. Simples de implementar e
  impossível de a criança perceber como "nível".
- **As regras da comida** (vale provar, nada sobre corpo, comida nunca é prêmio). Firmes e
  certas. Não afrouxaria nenhuma.
- **Voz gravada pela família como o recurso mais forte**, e nunca voz sintética fingindo ser a
  mãe. Correto e vale o trabalho.
- **A honestidade sobre a tensão com Waldorf** e a resposta (jogo que aponta para fora da
  tela, jogado no colo). É o argumento que sustenta o projeto.

## 2. Contradições entre SPEC e GAMEPLAY

O GAMEPLAY declara que vale sobre a SPEC em jogabilidade, mas alguns pontos ficaram
ambíguos e vão gerar retrabalho se não forem fechados agora.

| # | Onde | SPEC diz | GAMEPLAY diz | Proposta |
|---|---|---|---|---|
| C1 | Janela do pulo | 12.5: toque até ~500 ms antes vale | 6.10: até 0,7 s | 700 ms. Para 5 anos, quanto maior melhor, e 0,7 s já é o que a música permite. |
| C2 | Arrumar a cama | 8.1: "estica o lençol com um arrasto curto" | 6.2: toca no objeto, a cena de 4 s acontece sozinha | Toque só. A roda é para contar, não para brincar; o arrasto fica para as brincadeiras. |
| C3 | Quem marca "dormiu sozinha" | 8.3: os pais marcam no cantinho | 6.2 passo 5: ela responde na roda de manhã | As duas coisas, mas com papel diferente: a resposta dela acende a estrela; a confirmação dos pais dá o brilho a mais, igual às outras tarefas. |
| C4 | Boneca nova | 11: por aventura terminada e por semana de tarefas | 4 e 6.10: só por aventura | Só por aventura (GAMEPLAY). Semana de tarefas como prêmio vira contador escondido. |
| C5 | Roda e som do dia seguidos | (não trata) | 2: "nunca duas coisas de atenção seguidas", mas o laço põe roda e som do dia em sequência | Ver achado J3. |
| C6 | Duração da chegada | 5: recepção sem tutorial | 6.1: 15 a 20 s, um toque adianta | OK, mas definir: o toque adianta a animação ou só a fala? Proposta: adianta a animação e a fala termina. |
| C7 | Estrela de cinco pontas | 13: "nunca ★" | A caixa de areia é uma estrela de cinco pontas e o nome do jogo é estrela | Regra: a única estrela de cinco pontas é a caixa de areia, porque ela existe de verdade. Todas as estrelas do céu, da janela e da recompensa são centelhas de quatro pontas. |
| C8 | Palavra em destaque ao tocar | 9.5: tocar no gato, na cama, na bola mostra a palavra | Tocar na cama abre a tarefa; tocar no gato faz ronronar | Ver achado J6. |
| C9 | Hora de dormir fecha o jogo | 8.3 e 6.12: "o jogo fecha sozinho" | idem | Um PWA não consegue se fechar. Ver achado T1. |

## 3. Achados de jogabilidade

**J1. O laço da primeira semana não está definido.** O laço completo (chegada, roda, som,
brincadeira, livre, bichos, despedida) só existe a partir da sessão 6 ou 7, porque a roda
abre na sessão 2, o caderno na 2, os bichos precisam do gatinho (fim da sessão 1) e do
coelhinho (sessão 3). Falta uma tabela dizendo, sessão a sessão, qual laço ela vê.
Proposta: a forma é sempre a mesma e as partes que ainda não existem são puladas em silêncio,
assim a ordem que ela aprende na sessão 1 (chegada, livre, despedida) é a mesma que cresce
depois. A tabela vai na seção 8 do GAMEPLAY.

**J2. A casa que rola pede um gesto que a seção 1 proíbe.** A SPEC 7 diz que a casa rola na
vertical e ela "desliza para cima e para baixo". Deslizar a tela é arrastar longo ou gesto
rápido, os dois na lista do que ela não faz bem. Em retrato, a casa em corte com três andares
mais o quintal cabe numa tela só (proporção 9:19,5). Proposta: **casa inteira numa tela, sem
rolagem**. Tocar num cômodo aproxima com uma transição lenta; a casinha do canto volta. A
tela 1 foi desenhada assim.

**J3. Duas coisas de atenção seguidas.** O próprio GAMEPLAY diz que roda e som do dia pedem
atenção e que nunca vêm duas seguidas, e o laço as põe juntas. São só 2 ou 3 minutos, então
pode ser aceitável. Duas saídas: (a) aceitar e escrever a exceção; (b) trocar para chegada,
roda, brincadeira do dia, som do dia, livre, bichos, despedida. A opção (b) tem um custo: na
terça a brincadeira é o caderno, e o som do dia entra melhor antes do caderno. Minha proposta
é (a), com o som do dia contado pelo Theo como história curta, para mudar o tom.

**J4. O Jardim no tempo da Valsa das Flores tem obstáculo demais.** Um obstáculo por tempo
forte, num compasso de valsa a 60 ou 70 compassos por minuto, dá um pulo por segundo, 120
pulos em dois minutos. Para 5 anos é muito. Proposta: um obstáculo a cada 4 compassos (a
cada 3,5 a 4 s), o que dá uns 30 em dois minutos, e nas duas primeiras aventuras a cada 8
compassos. Os valores vão para `balance.json`, como no Ponta. O ritmo continua ensinando,
porque o obstáculo cai sempre no tempo forte.

**J5. A porta de casa com dois sentidos.** "Voltar" é a porta de casa no canto de cima, e a
porta de casa, embaixo, é de onde saem as aventuras. Mesma imagem, dois significados
opostos (sair e voltar). Proposta: voltar é a **casinha verde** (a silhueta da casa, com
telhado), não uma porta. A porta fica só para a aventura.

**J6. Tocar num objeto: palavra ou atividade?** Na casa, tocar na cama abre a tarefa, tocar no
piano abre o piano, tocar no gato faz carinho. A SPEC 9.5 diz que tocar no gato e na cama
mostra a palavra em destaque. Precisa de regra. Proposta: os objetos de palavra são um
conjunto próprio, que não faz outra coisa (sol na janela, lua, bola, mala, pinha na mesa).
GATO e CAMA aparecem como palavra só dentro do caderno. Objeto que é atividade abre a
atividade, sempre.

**J7. A roda registra tudo o que ela tocar.** A seção 10 do GAMEPLAY prevê que a primeira
coisa que ela faz é tocar em tudo. Na roda, tocar é dizer "fiz". Nas primeiras semanas isso
vai registrar todas as tarefas todo dia e a lembrança perde o sentido. A SPEC 8.2 aceita esse
custo em nome da conversa, e concordo com o espírito. Só proponho uma trava pequena: a
lembrança nasce na hora, mas o **objeto da roda só aceita o toque depois que a pergunta
terminou de ser falada** (uns 2 s). O toque antes disso só faz o objeto brilhar. Isso separa
"tocar em tudo" de "responder".

**J8. O prato pergunta "hoje", mas o dia depende da hora.** Se ela joga de manhã, "o que você
provou hoje" é o café; se joga no fim da tarde, o jantar ainda não aconteceu. Proposta: a
roda e o prato perguntam sobre **o que aconteceu desde a última sessão**, e a fala gravada
não diz "hoje" ("Você arrumou a cama?", "O que você provou?"). Isso também simplifica as
gravações. Depende da resposta à pergunta P1.

**J9. O arco-íris semanal é um contador disfarçado.** Cinco cores na semana geram um
arco-íris. Não aparece número, mas é uma meta que pode ser perdida, e a seção 3 evita
exatamente isso. Manteria só se ele for surpresa (a família nunca menciona, o jogo nunca
mostra "faltam"), e tiraria da v1 se der trabalho: o canteiro já recompensa.

**J10. Depois de quatro aventuras, a estante enche.** Quatro bonecas listadas, uma por
aventura. A partir da quinta aventura nada novo acontece, e ela vai jogar o Jardim mais de
quatro vezes. Está bem assim (o palco e a família são a recompensa), mas convém escrever.
Alternativa barata: a partir daí, cada aventura traz uma pinha diferente para a mesa da
estação.

**J11. O Theo com o dobro da altura.** Aos 10 anos ele tem uns 1,27 vezes a altura dela. O
dobro é estilização, cabe no espírito Charlie e Lola, mas deixa os pais com o triplo. Proposta
para o styleguide: Stella 1, Theo 1,5, pais 2. Se a família preferir o dobro, os pais ficam
em 2,3 e a diferença Theo-pais quase some, o que também é uma leitura possível de irmão
grande.

**J12. Tutu em casa.** A Stella está de collant e tutu em todas as cenas. Para uma menina de 5
anos em casa, faz mais sentido um vestido rosa (ou o que ela usa de verdade) e o tutu só no
palco, como já é com o coque. Pergunta P8.

**J13. Roupa e cenário no palco.** Cada toque faz um giro (metade de baixo) ou um salto (metade
de cima). Com a borda de 24 px sem toque e a casinha no canto, fica bom. Só anotar que a
divisão é invisível e que os dois gestos são "sempre certos", então a criança não precisa
saber que existem dois.

**J14. O gatinho no primeiro dia precisa de três nomes gravados.** A escolha do nome é por
voz, então os três nomes candidatos do gatinho e os três do coelhinho precisam estar
gravados antes da sessão 1. Entram na lista de gravação.

## 4. Achados de alfabetização (fônico em português do Brasil)

Aqui está o achado mais importante da revisão. A SPEC e o GAMEPLAY escolheram palavras
pensando na ortografia, e o fônico trabalha com o som falado. No português do Brasil
algumas letras não soam como o som isolado que a criança vai aprender:

- **L no fim da sílaba soa como U**: SOL se fala "sou", MEL "meu", SAL "sau". O escorregador
  de sons vai dizer "sss... ooo... lll" e ela vai ouvir uma palavra que não fala assim. SOL é
  o exemplo principal da SPEC 9.3 e 9.5.
- **T antes de I soa "tchi"** em quase todo o Brasil: SETE se fala "sétchi". E o E átono
  final soa I.
- **O átono final soa U**: MOTO "mótu", MIMO "mímu", AMO "âmu".
- **E e O átonos no começo mudam**: "escova" começa com som de I, "ovelha" com som de U. Para
  o achar o som da vogal E e da vogal O, as figuras precisam ter a vogal **tônica** no início:
  ELA, ESTRELA (é), ELEFANTE; OVO, OLHO, ONDA, ÓCULOS.

Proposta para as 16 palavras da v1, todas com sílaba aberta e som igual à letra, só com as
letras da v1 (A, E, O, S, L, M, U, I, T):

- Duas sílabas: LUA, ASA, ELA, OLÁ, MALA, SALA, LAMA, MOLA, TATU, TUTU, TELA, LATA, MATA, ILA
  (a ilha sem o LH, se não confundir; senão UVA quando o V entrar).
- Uma vogal: EU? (ditongo, melhor não). Deixar as de uma sílaba para depois.
- O nome: STELLA continua, é o nome dela e a exceção é afetiva.

Isso também muda a imagem da letra L (SPEC 9.3): "lll" tem de ser demonstrado no começo da
sílaba (LUA, LATA), nunca no fim.

Duas perguntas ligadas a isso estão na seção 6 (P3 e P4), porque o que a escola faz manda.

**A4.1 Waldorf apresenta letras aos 7.** A pedagogia Waldorf introduz as letras no 1º ano,
com a criança de 7. Uma escola Waldorf com fônico aos 5 é incomum. Se a escola dela ainda
não apresentou letra nenhuma, o jogo vai na frente da escola, o que contraria a intenção de
"falar a mesma língua da sala". Não é impeditivo (ela quer aprender a escrever), mas muda a
ordem e a imagem das letras: elas passam a ser as do jogo, e a escola depois sobrepõe as
dela. Pergunta P3.

**A4.2 Cores da semana.** A sequência tradicional dos jardins Waldorf é: domingo branco ou
dourado, segunda roxo, terça vermelho, quarta amarelo, quinta laranja, sexta verde, sábado
azul. O GAMEPLAY 7 tem quinta verde, sexta azul e sábado laranja. Como está em dados, é
troca fácil; a cor da escola dela vence as duas. Pergunta P12.

## 5. Achados técnicos

**T1. Um PWA não se fecha sozinho.** `window.close()` só funciona em janela aberta por script.
A hora de dormir e o "abre e fecha de novo em 20 s" precisam ser reescritos como: a tela
escurece até o azul da noite, **para de responder a toque** e mostra só a Stella dormindo. O
efeito para a criança é o mesmo; a diferença é que o adulto fecha o app.

**T2. O gesto de voltar do Android.** Empurrar um estado no histórico a cada tela captura o
"voltar" na maioria dos casos, mas no primeiro estado do histórico o gesto sai do app, e no
iPhone o deslizar da borda em app instalado não passa pelo histórico. A recomendação de
Acesso Guiado e Fixação de tela deixa de ser sugestão e vira **passo 1 da instalação**, com
tela própria no cantinho dos pais.

**T3. Gravações no aparelho podem sumir.** No iPhone, o Safari apaga IndexedDB de sites
não usados por 7 dias, salvo app instalado na tela inicial. Duas defesas: instalar sempre
(T2 já pede) e um botão **exportar gravações** no cantinho dos pais, que gera um arquivo para
guardar. A alternativa da SPEC 15.4 (vocês gravam, eu empacoto) continua a mais segura e eu
faria as duas.

**T4. Quantidade de frases para gravar.** Contando o que a v1 pede (nome dela por três
pessoas, 3 perguntas da roda, comemorações, pergunta da noite, 6 cores, 25 sons de letras, 9
letras comemoradas, 6 nomes de bichos, 8 convites de despedida, bom dia e boa noite), dá
entre 80 e 110 gravações curtas. Os "15 minutos" da seção 10 são otimistas: é mais perto de
45 minutos por pessoa. Proposta: cada frase tem **um dono** (uma pessoa grava), e a v1 sai
com umas 45 frases obrigatórias e o resto opcional. A lista vai pronta com quem grava o quê.

**T5. Voz sintética para nomes próprios.** Os nomes dos bichos e o nome dela nunca passam
pela voz do aparelho; só gravação. Já está implícito, mas vale escrever.

**T6. Aquarela sem raster.** Véus de opacidade 0,3 a 0,6 pintados uma vez num canvas de
fundo funcionam bem em Android de 2021 desde que o canvas de fundo não se redesenhe. O céu
que muda com a hora precisa ser um segundo canvas, só do céu, redesenhado a cada minuto,
não a cada quadro.

**T7. Retrato travado.** `screen.orientation.lock('portrait')` só funciona em tela cheia no
Android e não existe no Safari. No manifesto do PWA (`"orientation": "portrait"`) funciona
em app instalado nas duas plataformas. Mais um motivo para instalar sempre.

## 6. Perguntas para a família, por ordem de impacto

As que mudam desenho antes de qualquer código vêm primeiro. As da SPEC 17 que continuam
abertas estão incluídas.

1. **P1. Em que hora do dia ela costuma ter tela?** Manhã, tarde ou depois do jantar? Se for
   sempre à noite, ela nunca veria o laço do dia, só o da noite, e a roda teria de perguntar
   sobre o dia inteiro que passou. Isso muda a roda, o prato e a hora de dormir.
2. **P2. Qual é o aparelho?** Modelo, iPhone ou Android, é dela ou emprestado dos pais? Decide
   voz, instalação, Acesso Guiado e desempenho.
3. **P3. A escola já apresentou alguma letra?** Se sim, quais, em que ordem, com que imagem e
   com que gesto? Se não, o jogo vai na frente e a ordem é a do jogo. Vale perguntar à
   professora antes de eu desenhar as nove imagens.
4. **P4. Como a escola trata o L no fim da sílaba e as vogais átonas?** Ou, mais simples:
   posso trocar SOL, MEL, SAL e SETE pelas palavras da seção 4?
5. **P5. Casa numa tela só, sem rolagem** (tela 1), ou casa que rola como a SPEC 7 descreve?
6. **P6. Quem marca a tarefa quando ela joga sozinha?** O toque dela basta para a lembrança
   nascer (SPEC 8.2) ou a lembrança espera a confirmação dos pais? Minha proposta é a da
   SPEC, com a trava do achado J7.
7. **P7. Vozes.** Quem grava, onde (no app ou arquivo), e quantas frases vocês toleram?
   Proponho 45 obrigatórias na v1, com dono por frase.
8. **P8. Roupa da Stella em casa.** Tutu sempre, ou vestido rosa em casa e tutu só no palco?
   O que ela usa de verdade no dia a dia?
9. **P9. Proporções.** Theo 1,5 vezes a Stella e pais 2 vezes, ou Theo o dobro como a SPEC?
10. **P10. Voltar é a casinha verde** (proposta J5) ou continua a porta?
11. **P11. Jardim com um obstáculo a cada 4 compassos** (uns 30 pulos em 2 minutos)? Ou menos?
12. **P12. Cores da semana.** A escola dela tem cor por dia? Qual sequência? Senão, uso a
    tradicional (seção 4, A4.2).
13. **P13. Da SPEC 17, ainda abertas**: cabelo, altura e roupa dos pais; foto da fachada para o
    verde; foto da caixa de areia e da árvore (que árvore é?); boneca preferida; cor sonhada
    do gatinho e do coelhinho; nome do jogo (Little Star, Estrelinha, Estrellita); lista de
    comidas aceitas e a provar; festas que a casa celebra.

## 7. Ajustes que proponho aplicar nos dois documentos depois das respostas

Sem mexer no que depende das perguntas:

- SPEC 12.5 e GAMEPLAY 6.10: janela do pulo 700 ms (C1).
- SPEC 8.1: cama por toque na roda; o arrasto do lençol vira brincadeira opcional no quarto (C2).
- SPEC 8.3 e GAMEPLAY 6.2: quem marca a noite (C3).
- SPEC 11: boneca só por aventura (C4).
- SPEC 13: regra da estrela de cinco pontas (C7).
- SPEC 9.5 e GAMEPLAY 6.6: conjunto de objetos de palavra (J6).
- GAMEPLAY 8: tabela do laço por sessão na primeira semana (J1).
- GAMEPLAY 6.2: objeto da roda aceita toque só depois da pergunta (J7).
- GAMEPLAY 6.10: densidade de obstáculos em dados (J4).
- SPEC 8.3, GAMEPLAY 6.12: "o jogo dorme" no lugar de "o jogo fecha" (T1).
- SPEC 4 e 15.3: instalação com Acesso Guiado como passo 1; exportar gravações (T2, T3).
- SPEC 15.4: lista de gravação com dono por frase e as 45 obrigatórias (T4).
- SPEC 9.3, 9.5 e GAMEPLAY 6.6: palavras da v1 e exemplos do L (seção 4), se P4 confirmar.
