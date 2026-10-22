# Checklist de quadros (cada cena e o reel inteiro)

Rode `npm run verificar -- reels/<pasta> --cena <id>` e abra os três PNGs (início, meio e fim da cena). Uma cena só passa quando os três quadros passam em tudo abaixo. No fim, o reel inteiro passa no `verificar` e na folha de quadros.

## Texto
- Nada cortado: acentos, cedilha e descendentes (g, j, p, q, ç) inteiros, inclusive dentro de máscaras de revelação. Em título grande, confira o recorte ampliado (`snapshot --zoom ".titulo"`): na miniatura um Ã cortado parece inteiro.
- Título com no máximo 3 linhas no 9:16. Se não couber, condense a frase (melhor que diminuir a fonte).
- Texto dentro da margem segura: 8% nas laterais (86 px), 12% em cima e embaixo (230 px).
- Nada nos 20% de baixo (faixa da interface do Reels: legenda, botões). A assinatura fica acima dessa faixa.
- Rótulo do topo não bate na marca fixa do canto.
- Nenhum `[PENDENTE]` num reel que vai ser entregue.

## Cor e contraste
- Todo texto passa no contraste WCAG AA (4,5:1 para texto normal, 3:1 para texto grande). O `check` mede nos momentos assentados de cada cena e qualquer falha reprova.
- Texto nunca direto sobre foto ou print: só sobre faixa, cartão ou fundo sólido.
- Cores só do kit da marca, ou do produto de terceiros quando o tema for esse produto.

## Composição
- No quadro de fim da cena, as animações já assentaram: nada pela metade antes da transição de saída.
- No meio de uma transição, a cena nova entra do lugar certo e não pisca a cena anterior.
- A logo da marca fixa aparece inteira e legível em todos os fundos (logo clara em fundo escuro, escura em fundo claro).
- Foto ou print com movimento de câmera (empurrão, deslize) não mostra borda da imagem: deixe folga de pelo menos 12%.

## Dados
- Cada número na tela bate com a fonte (texto do site, carrossel aprovado, norma, notícia citada).
- Prints e telas: nenhum nome, telefone, e-mail, CPF/CNPJ, endereço ou valor de terceiro legível, nem em abas, notificações, avatares ou barra de endereço. Na dúvida, tarja.
- Nenhum termo proibido pelo kit da marca (nomes, números de registro), nem em foto de documento, crachá ou placa. O registro profissional exigido no anúncio de venda só aparece no `tipo: venda`.

## Ritmo
- Cortes exatamente nos tempos do `cenas.json`.
- A mesma transição nunca aparece duas vezes seguidas, exceto o corte seco.
- A última cena segura parada pelo menos 2 tempos.

## Vídeo final (depois do `entregar`)
- Duração de 15 a 30 s (o `entregar` confere).
- 2 ou 3 quadros extraídos do MP4 com a fonte certa do kit da marca, sem fonte substituta.
