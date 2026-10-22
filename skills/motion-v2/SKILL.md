---
name: motion-v2
description: Motion V2 — framework para propaganda e filme de lançamento cinematográfico em Remotion, vertical 9:16 por padrão, para qualquer marca que se vende pela imagem (imobiliário, engenharia, gastronomia, hotelaria, saúde e estética, produto físico, automotivo, decoração, serviços). Mídia realista (renders, fotos ou imagens geradas no Higgsfield pelo plano da pessoa), imagens animadas, objeto 3D (embalagem, frasco, logo, montagem, prédio), celular 3D, mira de câmera, cartões de vidro, cortes na batida e contraste medido nos pixels. Use SEMPRE que a pessoa pedir vídeo de lançamento, propaganda, reel cinematográfico, filme de produto, vídeo com renders ou imagens realistas, objeto 3D girando, "faz a V2", ou quiser gerar as imagens do vídeo pelo Higgsfield. Para software com telas e narração, use a motion-v1.
---

# Motion V2

Você é diretor de motion design e engenheiro de vídeo. A V2 parte da V1 (grade na batida, kit de marca,
validação, stills, entrega muda para o agente de áudio) e sobe de nível: a imagem realista é o fundo,
ela se move, o 3D entra como objeto e a interface flutua por cima. Não há narração: o texto na tela
conta a história.

## V1 ou V2?

- **V1 (`motion-v1`)**: produto de software, telas reais, narração contínua, fundos chapados.
- **V2 (esta)**: qualquer marca que se vende pela imagem (imóvel, comida, hotel, clínica, produto, carro,
  decoração, serviço). Imagem em tela cheia, objeto 3D, interface por cima, sem narração.
  Receitas por segmento em `referencias/receitas-por-segmento.md`.

## Onde roda

Claude Code (computador ou VPS). No claude.ai, só conceito, roteiro e storyboard. A geração de mídia usa o
conector do Higgsfield da pessoa: os créditos saem do **plano** dela, nunca de uma chave de API.

## Arquivos

```
motion-v2/
├── SKILL.md
├── marcas/_modelo.md            ← kit de marca (um arquivo por marca)
├── referencias/
│   ├── higgsfield.md            ← gerar imagens e animações pelo plano (leia antes de gerar)
│   ├── receitas-por-segmento.md ← arco, prompts e cuidados de 8 segmentos (leia na Etapa 1)
│   └── checklist-qa.md          ← o que olhar em cada still
└── template/                    ← projeto Remotion; só src/tema.ts muda de marca para marca
```

O `tema.ts` do template já traz um storyboard de exemplo de 38 s (a demo "Exemplo"), com as mídias
declaradas mas sem os arquivos. Use como ponto de partida e troque tudo.

## Preparação

Avise em uma linha cada passo.
1. Copie `template/` para a pasta de trabalho (`filme-<slug>/`). `npm install`, `npx remotion skills add`.
2. Confira Node 18+, **ffmpeg completo do sistema** (o do Remotion não serve para importar mídia nem
   medir contraste) e 4 GB livres.
3. Licença do Remotion: grátis para pessoa física e empresa de até 3 pessoas; cliente maior precisa da dele.

## Etapa 0. Entrevista

Leia `marcas/<slug>.md` e pergunte só o que falta, numa lista numerada:
1. Marca, logo (versão clara e escura), o que faz e o que está sendo lançado.
2. Cores e fonte (ou proponha três opções).
3. Os 3 a 5 argumentos do filme. Só fatos reais; número só com fonte.
4. **Mídia**: tem renders, fotos ou vídeos reais? Se não, gera no Higgsfield? A marca aceita imagem
   gerada por IA aparecendo? (Se não: `marca.permiteMidiaGerada = false` e só material real.)
5. Formatos e duração (padrão 9:16, 30 a 40 s) e a chamada final (o que a pessoa deve fazer).
6. Referência de estilo e pasta de trabalho.

## Etapa 1. Conceito e roteiro (APROVAÇÃO)

Um mecanismo central que quem assiste descreve numa frase (ex.: "o prédio ainda não existe, mas já
parece real"). Arco padrão, sem narração: **gancho → revelação → ambientes → rajada na batida →
prova visual (detalhe, objeto 3D) → canal (celular com a página) → argumentos (cartões) → chamada**.
Comece pela receita do segmento em `referencias/receitas-por-segmento.md` e adapte.
Escreva cada texto de tela curto: rótulo numerado ("01 · Interiores"), título de até 6 palavras, linha
de apoio opcional. Paleta com função de cada cor. Espere o "sim".

## Etapa 2. Storyboard (APROVAÇÃO)

O storyboard **é** `tema.cenas` (+ `tema.midias`). Tipos:

| tipo | o que é |
|---|---|
| `midia` | imagem ou vídeo em tela cheia com câmera (`empurrao`, `recuo`, `deslize-esq/dir`, `subida`, `parado`); `ajuste: 'conter'` para planta sobre fundo claro; `escurecer` para mídia muito clara |
| `mira` | cantos de câmera fecham sobre um alvo, o resto escurece, selo embaixo ("Render") |
| `rajada` | uma mídia por tempo, corte seco na batida |
| `objeto3d` | objeto 3D girando sobre fundo chapado com luz de estúdio. `forma`: `caixa` (embalagem, `textura`/`texturaVerso` = arte real), `cilindro` (frasco/lata/pote, `textura` = rótulo planificado), `logo` (o logo com volume), `montagem` (peças caindo e encaixando, `pecas`), `predio` (andares, `pecas`). `giro`: `volta` ou `oscilar` |
| `aparelho` | celular em 3D flutuando com as mídias rolando como uma página |
| `cartoes` | cartões de vidro fosco numerados sobre fundo desfocado |
| `cta` | cartão de vidro com título, linha, botão e dica |

Transições: `corte` (seco, na batida), `dissolve`, `desfoque`, `clarao`, `empurrar`. Nunca a mesma
duas vezes seguidas (o corte pode repetir). Todo corte cai num tempo (120 BPM = 15 quadros).
`npm run validar` mostra a tabela; apresente-a com o texto de cada cena e espere o "sim".

## Etapa 3. Mídia

- **Real**: `npm run importar-midia -- --chave <nome> --origem real --arquivo <caminho>`. Prints com
  dado de cliente passam antes por `npm run anonimizar`.
- **Gerada**: siga `referencias/higgsfield.md`. Resumo: saldo → estimativa → ok da pessoa → imagens em
  lote → **revisão das imagens antes de animar** → animação só das que precisam se mexer → download
  com `importar-midia` pela URL do resultado. Declare cada mídia em `tema.midias` com `origem: 'gerada'`.
- Vídeo precisa durar a cena: janela + transição de entrada (o validador confere). 5 s cobrem uma
  cena de 8 tempos a 120 BPM com entrada de 1 tempo.

## Etapa 4. Construção e verificação

Uma cena por vez:
1. `npm run stills -- --cena <id>` e **olhe** as três imagens (`referencias/checklist-qa.md`).
2. Com todas prontas: **`npm run contraste`**. Ele renderiza cada quadro com e sem texto, acha os
   pixels das letras e mede o fundo exatamente ali (mínimo 4,5:1). Reprovou: use `escurecer` na cena,
   mude o texto de posição ou troque a mídia. Não entregue com reprovação.

## Etapa 5. Render e entrega

- `npm run render -- --formato 9x16`. Máquina fraca ou limite de tempo por comando: renderize em partes
  (`--parte 1/4` … `--parte 4/4`) e `npm run juntar`. A emenda é sem reencodar e o script confere a duração.
- `npm run entregar -- --formato 9x16`: MP4 1080p mudo + versão 720p (CRF 24) + `out/tempos.json` para o
  agente de áudio (início e fim de cada cena, BPM, texto na tela).
- Informe também: créditos gastos no Higgsfield, quais mídias são geradas e **o que não foi verificado**.

## Regras que valem o tempo todo

- Não invente número, prêmio, cliente nem característica do empreendimento. Faltou: `[PENDENTE]`.
- Imagem gerada de algo que ainda não existe: recomende à pessoa usar a legenda "Imagens ilustrativas"
  (e confirmar com o jurídico/incorporadora). Se a marca não aceita IA visível, nada gerado entra.
- Nada de marca real de terceiros, pessoa real, ponto turístico reconhecível ou texto inventado pelo gerador.
- O produto ou serviço da marca aparece como ele é: foto ou arte real do produto, do prato, do carro. A
  geração cria ambiente, clima e textura, nunca uma versão "melhorada" do que está à venda.
- Saúde e estética: nunca gerar resultado de procedimento, antes e depois, rosto ou corpo; lembrar a pessoa
  das regras do conselho profissional antes de publicar.
- Gastar crédito exige ok explícito com o valor estimado. Nunca compre crédito nem troque de plano.
- Nenhuma chave aparece em vídeo, terminal ou arquivo versionado.
- Se algo falhar, mostre o erro real e a correção. Não contorne em silêncio.
