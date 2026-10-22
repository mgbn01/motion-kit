# Gerar mídia no Higgsfield pelo plano da pessoa

O conector do Higgsfield no Claude Code autentica na conta da pessoa: tudo o que for gerado sai dos
créditos do **plano** dela e fica no histórico dela. Não use API nem chave.

## 1. Saldo e custo antes de tudo
- Consulte o saldo e o plano.
- Faça a estimativa de custo (preflight, sem gerar) de uma imagem e de uma animação com os parâmetros
  que vai usar. Os preços mudam de modelo para modelo e com o tempo: confira sempre, nunca use um
  valor de memória.
- Diga o total estimado e quanto sobra do saldo (ex.: "6 imagens + 3 animações ≈ N créditos de M") e
  espere o ok.

## 2. Imagens (em lote)
Uma requisição por mídia, mesma proporção do filme. Prompts prontos por segmento em
`receitas-por-segmento.md`. Cada prompt:
- descreve a cena de forma física: material, luz, hora do dia, lente/ângulo, enquadramento vertical;
- termina com: `No people, no text, no signage, no logos, no watermarks.` e, para arquitetura,
  `Original design, not a copy of any existing building or landmark.`;
- planta: `straight overhead 3D cutaway floor plan … absolutely no text, labels, dimensions or numbers`.

Espere todos os jobs terminarem e **olhe as imagens** (baixe e monte uma folha). Descarte e refaça o
que tiver letra inventada, logo, rosto, deformação ou cara de "IA genérica".

## 3. Animação (imagem para vídeo) só onde o movimento conta
Use o job da imagem aprovada como imagem inicial. Prompt de movimento contido, por exemplo:
- fachada: `slow cinematic crane up … palm leaves swaying … keep the building geometry exactly the same, no warping`;
- interior: `very slow dolly forward … curtains move softly … furniture stays perfectly still`;
- água/vapor: `locked-off camera, barely perceptible push-in … thin mist drifts … architecture stays still`.
Sempre com som desligado (o áudio é do agente de áudio) e duração ≥ janela da cena + transição.

Se o Higgsfield responder recomendando um preset em vez de enviar o job, reenvie a mesma requisição
informando que o preset foi recusado (declined_preset_id). A recusa não cobra crédito.

## 4. Trazer para o projeto
Para cada resultado, use a URL devolvida pelo job:
```
npm run importar-midia -- --chave sala-video --origem gerada --arquivo https://…/resultado.mp4
```
O script baixa, normaliza (30 fps, 9:16, sem áudio; imagem com folga de 15% para a câmera) e imprime a
linha para `tema.midias`. Depois: stills e checklist, conferindo a animação quadro a quadro.

## 5. Registro
No kit da marca, anote modelo, parâmetros e prompts das mídias aprovadas, e os créditos gastos.
