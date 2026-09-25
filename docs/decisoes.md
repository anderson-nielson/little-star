# Decisões da v1

> As perguntas de `docs/revisao-gameplay.md` ficaram sem resposta antes de implementar, e a
> orientação foi decidir tudo. Aqui está o que decidi, por quê, e onde isso muda a SPEC e o
> GAMEPLAY. Tudo que é dado ou opção do cantinho dos pais pode ser trocado sem código.

| # | Pergunta | Decisão | Onde vive |
|---|---|---|---|
| P1 | Hora da tela | O jogo não assume hora. A roda e o prato perguntam sobre o que houve **desde a última sessão**, e as frases não dizem "hoje". De manhã, a primeira pergunta é sobre a noite. A partir de 30 min antes da hora de dormir só existe o laço da noite. | `src/core/laco.ts`, `src/data/frases.json` |
| P2 | Aparelho | PWA instalável nos dois; retrato pelo manifesto; instruções de Acesso Guiado e Fixação de tela no cantinho dos pais. O gesto de voltar do aparelho volta para a casa. | `vite.config.ts`, `src/core/roteador.ts`, `src/telas/pais.ts` |
| P3 | Letras e escola | Ordem do jogo: A, E, O, S, L, M, U, I, T, uma por semana, com as imagens do jogo. Os pais podem adiantar, segurar ou deixar livre. As imagens são dados e trocam pela da escola. | `src/data/letras.json`, cantinho dos pais |
| P4 | Palavras | Trocadas por palavras de sílaba aberta em que cada letra soa como o som ensinado: LUA, ASA, ELA, OLÁ, MALA, SALA, LAMA, MOLA, TATU, TUTU, TELA, LATA, MATA, MESA, LIMA e STELLA. Um teste impede L no fim da sílaba, TI e vogal átona final. | `src/data/palavras.json`, `tests/dados.test.ts` |
| P5 | Casa | Numa tela só, sem rolagem. Tocar num objeto abre a atividade. | `src/telas/casa.ts` |
| P6 | Quem marca | O toque dela basta; o objeto da roda só aceita o toque depois que a pergunta acabou de ser falada. A confirmação dos pais é brilho a mais. | `src/telas/roda.ts`, `src/telas/pais.ts` |
| P7 | Vozes | Gravadas no app (MediaRecorder), guardadas só no aparelho, com exportar e importar. Cada frase tem um dono; 50 obrigatórias e o resto opcional. Sem gravação, a cena acontece sem voz. Palavras inteiras e nomes de figuras podem vir da voz do aparelho; o som isolado da letra e os nomes próprios, nunca. | `src/audio/vozes.ts`, `src/audio/fala.ts`, `src/data/frases.json` |
| P8 | Roupa | Vestido rosa em casa; tutu e coque só no palco. | `src/puppet/boneco.ts` |
| P9 | Proporções | Stella 1, Theo 1,5, pais 2 (o pai 2,1). | `src/puppet/boneco.ts` |
| P10 | Voltar | A casinha verde no canto de cima, 72 px. A porta fica só para a aventura. | `src/puppet/objetos.ts` |
| P11 | Jardim | Um obstáculo a cada 2 compassos a 100 bpm (uns 30 em dois minutos); nas duas primeiras aventuras, a cada 4. Janela do pulo 0,7 s. Em dados. | `src/telas/jardim.ts` (`JARDIM`) |
| P12 | Semana | Cores da tradição Waldorf (dom dourado, seg roxo, ter vermelho, qua amarelo, qui laranja, sex verde, sáb azul). Brincadeira do dia: dom família, seg palavras, ter caderno, qua pinhas, qui areia, sex piano, sáb jardim. | `src/ui/tokens.css`, `src/core/laco.ts` |
| P13 | O resto | Mãe de rabo de cavalo e vestido rosa-velho, pai de camisa verde-mata; gatinho cinza-areia, coelhinho branco; nomes candidatos Mimi, Luna, Bolota e Pipoca, Nino, Flor; nome do jogo Little Star; comidas iniciais tomate, cenoura, banana, brócolis, uva, pão (trocáveis); festas das estações ficam para a v2. | dados e cantinho dos pais |

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
