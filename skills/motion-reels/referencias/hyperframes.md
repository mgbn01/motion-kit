# HyperFrames: o essencial para o Motion

Versão fixa: `hyperframes@0.8.143` (no `package.json`). Para o resto, a documentação oficial do HyperFrames e as skills `hyperframes-*`.

## Contrato da composição
- A raiz fica direto no `<body>`, sem `<template>`: `<div id="root" data-composition-id="main" data-width="1080" data-height="1920" data-duration="<s>" data-fps="30">`.
- Todo elemento com tempo leva `data-start` e `data-duration` (em s). `class="clip"` é a convenção. A ordem de pintura vem do `z-index`.
- `data-start` aceita referência: `"gancho"`, `"gancho + 0.5"`.
- A timeline GSAP é **uma só**, pausada: `const tl = gsap.timeline({ paused: true })`. Ela é registrada **depois** de montada em `window.__timelines.main` (a chave é igual ao `data-composition-id`).
- A duração do vídeo é o `data-duration` da raiz, que precisa ser igual à soma das cenas do `cenas.json` (o `verificar` confere).
- Imagens: `<img src="./assets/foto.jpg">`, com caminho relativo e no máximo cerca de 2160 px no lado maior.
- Fontes: só pelo `@font-face` local que o `novo` grava em `tema.css` (Inter 400/600/800, Archivo 400/600/800, IBM Plex Mono 500/600, cada uma com o arquivo de licença OFL ao lado em `modelo/assets/fonts/`). Para pôr outra fonte, acrescente os `.woff2` e a licença dela ali e registre os pesos em `fontes.json`. Família sem `@font-face` gera aviso no lint e busca na internet.
- `<html lang="pt-BR">`. Sem `<br>` em texto corrido: quebre com `max-width`.

## Determinismo (proibido)
- `Date.now()`, `performance.now()`, `requestAnimationFrame`, `setTimeout` e `setInterval`.
- `Math.random()` sem semente.
- `fetch` ou carregamento de arquivo durante o render.
- `tl.play()`, `repeat: -1`.
- Tween de `display`, `visibility` ou `autoAlpha` em `.clip`.
- `transform` inicial no CSS na mesma propriedade que o GSAP anima: use `fromTo`.
- `crossorigin` em mídia, estados de hover, scroll ou input.

## Comandos (já embrulhados pelos scripts do repositório)
| uso | comando cru |
|---|---|
| lint + navegador: contraste, vazamento, zona do Reels | `hyperframes check . --json --at <fim de cada cena> --caption-zone "x0=0;y0=0.80;x1=1;y1=1;severity=error;seek=<frações>"` |
| quadros para olhar | `hyperframes snapshot . --at 0.5,3.2 --describe false -o quadros` (gera `contact-sheet.jpg`) |
| recorte ampliado | `hyperframes snapshot . --at 3.2 --zoom ".titulo" --describe false` |
| render | `hyperframes render . -q delivery --fps 30 -o renders/reel-1080.mp4` |
| saúde do ambiente | `hyperframes doctor --json` (olhar `.ok`) |
| navegador de render | `hyperframes browser ensure` (baixa o chrome-headless-shell em `~/.cache/hyperframes/chrome`) |

Todo comando roda com `HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`, `HYPERFRAMES_NO_UPDATE_CHECK=1` e `HYPERFRAMES_SKIP_SKILLS=1`, sem `GEMINI_API_KEY` no ambiente. Os scripts do repositório já fazem isso.

## Armadilhas
- Lint com erro **zera** as amostras do `check` ("0 sample(s)"): parece limpo, mas não é. Corrija o lint primeiro.
- O hyperframes rebaixa a aviso a falha vista numa amostra só, pensando em texto entrando ou saindo. O `verificar` mede só no fim assentado de cada cena e trata qualquer falha de contraste, vazamento ou faixa do Reels como reprovação. O contraste é medido em no máximo 5 momentos por `check`, por isso o `verificar` roda em lotes.
- Blur, `backdrop-filter` e muitas sombras animadas deixam o render bem mais lento: prefira faixas sólidas.
- Português é 20 a 30% mais longo que o inglês: confira o vazamento com o `check` e o recorte ampliado.
- Máquina com 8 GB ou menos entra sozinha no modo de pouca memória (1 navegador): o render fica mais lento, mas sai igual.
