# O parquinho do condomínio

A Stella vai ao parquinho do condomínio e faz sempre a mesma volta: se balança sozinha no
balanço, contando até dez em voz alta, depois vai ao escorregador, depois à gangorra. O Theo
vai junto e não brinca no lugar dela: cuida, olha, e se orgulha da força, da coragem e da
esperteza dela. Este é o estudo de como levar isso para o jogo. As telas, com os três
brinquedos simulados para brincar no celular, estão em `docs/referencia/parquinho.html`.
Nada aqui é código do jogo.

## O que o parquinho de verdade já ensina

Corpo (equilíbrio, tronco, vestibular), causa e efeito (impulso forte, balanço alto; parou de
se mexer, o balanço morre), ritmo (o balanço tem o tempo dele, e esse tempo não muda com a
força), contar com o corpo (ela já conta até dez no balanço), coragem com cuidado (subir a
escada sozinha com o Theo embaixo), e a volta dela, sempre na mesma ordem, que o jogo repete
como um laço.

## As cinco telas

| Tela | O que ela faz | Aprende | Custa | O Theo |
|---|---|---|---|---|
| 1. Balanço | Arrasta para trás e solta. Cada toque nela é um impulso das pernas, a favor do movimento, que vale mais perto do chão. Uma nota da lira por passagem embaixo. | O impulso é dela; a hora certa de se impulsionar | Uma cena nova fora da porta, o pêndulo, o balanço e a Stella sentada | De pé ao lado, mãos prontas; palma quando sobe alto |
| 2. Contar até dez | Camada da tela 1, ligada no cantinho. Cada ida completa com balanço alto solta uma pedrinha para o pote, com tique e a voz contando até dez. No dez, centelhas, e o pote esvazia. | Um a um; a sequência até dez com a quantidade visível | Tela 1 mais o pote e as vozes dos números | Conta junto e bate palma no dez |
| 3. Escorregador | Cada toque sobe um degrau, com uma nota mais alta. No alto ela espera; um toque e desce, cabelo para trás, lira descendo. Na areia, centelhas; ela volta andando. | Uma coisa por vez; coragem com cuidado | A escada por toque, a descida como cena, cinco notas | Embaixo, na saída; "que coragem" |
| 4. Gangorra | Ela senta numa ponta; o Theo fica de pé na outra com as mãos na tábua. Toque com o pé no chão: ela empurra e sobe. Desce devagar, porque ele segura. No ar, sininho baixinho. | A hora de empurrar com o pé; cuidado é de quem está junto | A tábua, a subida por toque, a descida macia | Segura a tábua do outro lado; "que esperta" |
| 5. Lá fora | Na despedida, o convite: "Vamos ao parquinho de verdade?". Na roda seguinte, "Você brincou no parquinho?". A lembrança é um balancinho de madeira na mesa da estação. | O jogo olha para a vida dela | Só dado: frases, um objeto na roda, uma figura na mesa | Acena na porta |

## Decisões de desenho

- O balanço é um pêndulo de verdade, não animação: seno e amortecimento, período de 2,4 s,
  perde metade da altura em uns oito ciclos. O impulso é dela: nenhum toque empurra de fora,
  e não existe toque errado.
- O laço do parquinho segue a ordem dela: balanço, escorregador, gangorra. Quando ela sai de
  um brinquedo, o Theo aponta o próximo com a mãozinha. Nada é trancado.
- O Theo nunca faz por ela. Fica de pé ao lado do balanço, embaixo do escorregador e
  segurando a gangorra. As frases dele no balão são de admiração, uma por brinquedo, e vivem
  em `frases.json` para a família gravar: "Olha a Stella, que força!", "Que coragem,
  Stella!", "Que esperta, empurrou com o pé!".
- O parquinho fica fora da porta, como as aventuras, porque é do condomínio e não da casa.
- Nada pisca mais de uma vez por segundo. Na tela 2 não aparece número escrito: ela vê o pote
  encher. Os números são palavras inteiras, então a voz do aparelho pode dizê-los enquanto a
  família não grava.

## Ordem proposta

5, 1 e 2 na mesma rodada (a contagem é uma opção da tela 1). Escorregador e gangorra na
seguinte, juntos, porque a volta dela é inteira ou não é.

## O que a família respondeu

1. Ela se balança sozinha. Saiu o empurrão de fora; o toque é o impulso das pernas dela.
2. Conta até dez, com a voz e o celular. A contagem começa em dez, e a voz do aparelho conta
   com ela enquanto a família não grava.
3. Depois vai ao escorregador, depois à gangorra. A ordem dela virou o laço do parquinho.
4. O Theo demonstra cuidado, orgulho e admiração pela vitalidade, coragem, força e esperteza
   dela. Ele nunca faz por ela; as frases dele são de admiração.

## O que ainda falta

5. De que cor e de que material são o balanço, o escorregador e a gangorra de verdade? Aqui
   está tudo em madeira e corda, com o escorregador claro.
6. Ela conta em voz alta sozinha ou alguém puxa a contagem? Se ela puxa, a voz do jogo pode
   vir um pouquinho depois da dela, para ela liderar.
