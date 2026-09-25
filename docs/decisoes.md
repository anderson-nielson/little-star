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
