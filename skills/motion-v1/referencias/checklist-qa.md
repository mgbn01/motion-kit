# Checklist de verificação dos stills

Rode `npm run stills -- --cena <id>` e abra as três imagens (início, meio, fim) com a ferramenta
de visualização. Para o 9:16 e o 1:1, repita com `--formato`. Uma cena só passa quando os três
quadros passam em tudo abaixo.

## Texto
- Nada cortado: acentos, cedilha e descendentes (g, j, p, q, ç) inteiros, inclusive dentro das
  máscaras de revelação.
  Confira com a letra ampliada (recorte + aumento com ffmpeg ou PIL): na miniatura um g cortado
  parece inteiro. Folga de máscara sempre em px; em `em` ela é relativa à caixa, não ao texto.
- Letras não colam: se parecer apertado, aumente o tracking do estilo (o validador barra abaixo de -0,03em).
- Nenhuma linha passa da margem de segurança do formato (`tema.formatos[x].margem`).
- Palavras dos flashes cabem inteiras no 9:16 (o tamanho se ajusta, mas palavras longas ficam pequenas).
- Nenhum `[PENDENTE]` sublinhado num filme que vai ser entregue.

## Cor e contraste
- Todo texto sobre fundo chapado segue o par aprovado no validador (≥ 4,5:1).
- Texto nunca direto sobre foto, print ou vídeo: só sobre faixa sólida da marca.
- O elemento recorrente aparece em todos os fundos (se ele sumir, a cor dele coincide com o fundo).

## Composição
- O elemento recorrente não cobre texto, logo nem a parte importante da tela.
- No fim de cada cena (still 3) as animações já assentaram: nada pela metade antes da transição de saída.
- Transições: no meio delas a cena nova revela a partir do lugar certo (máscara nasce do elemento).
  Para conferir uma transição, renderize um trecho (`npm run render -- --quadros A-B`) e extraia quadros.

## Dados
- Cada número na tela bate com a fonte declarada em `tema.numeros[].fonte` ou com o print.
- Prints: nenhum nome, telefone, e-mail, CPF/CNPJ, endereço ou valor de terceiro legível, nem em
  abas, notificações, avatares ou barra de endereço. Na dúvida, tarja.
- Planos gerados: nenhuma letra, número, logo, interface ou rosto que pareça de pessoa real.
- Tela ilustrativa sempre com o selo "Tela ilustrativa".
