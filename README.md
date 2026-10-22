# motion-kit

Skills e ferramentas para fazer vídeo de motion com o Claude Code. São duas gerações de skill: a V1/V2, um método com grade na batida, aprovação de roteiro e verificação quadro a quadro, e a V3, que usa o método da [motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing) com uma camada de regras por cima. Cada uma resolve um tipo de peça; a mais nova não aposenta a outra.

Licença MIT, gratuito. Em português do Brasil. Feito pela [Singular TEC](https://singularhub.com.br) ([@singular_tec](https://www.instagram.com/singular_tec/)).

| | V1 · `motion-v1` | V2 · `motion-v2` | V1/V2 em HyperFrames · `motion-reels` | V3 · `motion-v3` |
|---|---|---|---|---|
| Para quê | Filme de apresentação de uma marca, sobretudo software | Propaganda e lançamento de quem vende pela imagem | Reels do dia a dia (venda, comercial, viral) só com material real | Reels com ideia própria, 3D e séries de episódios |
| Motor | Remotion 4 (template) | Remotion 4 (template) | HyperFrames (HTML + GSAP → MP4) | Motor próprio da motionmaxxing (HTML + runtime) |
| Formato | 16:9, 9:16 ou 1:1 | 9:16 por padrão | 9:16 | 1080×1920, 30 fps |
| Duração | ~60 s (60 a 64 s); 15 ou 30 s para anúncio | 30 a 40 s | 15 a 30 s | 15 a 30 s |
| Imagem | Fundos chapados, telas reais anonimizadas | Mídia realista em tela cheia (render, foto ou gerada no Higgsfield) | Só material real (fotos, renders, prints, carrosséis aprovados) | Ideia própria da marca, 3D (`hero3d`), fundo por IA opcional |
| Texto e voz | Narração contínua (opcional) | Sem narração: o texto na tela conta | Texto na tela; mudo ou com locução | Sem áudio, só música e efeitos, ou locução e música |
| Áudio | Mudo por padrão; ElevenLabs se pedido | Sempre mudo; o áudio fica com outro agente | Mudo; no viral, também a versão sem locução | ElevenLabs (voz escolhida com a pessoa) ou música posta na rede |
| Aprovações | Conceito, storyboard e roteiro de voz | Conceito/roteiro e storyboard | Uma só: o roteiro | Uma só: o roteiro |
| Verificação | `npm run validar` e stills por cena | `validar`, stills e `npm run contraste` nos pixels | `npm run verificar` (grade, `[PENDENTE]`, termos, `check` do HyperFrames) | Gates G0–G5 (`look.py`, `lint.mjs`) e `npm run verificar` |
| Onde está | [`skills/motion-v1/`](skills/motion-v1/SKILL.md) | [`skills/motion-v2/`](skills/motion-v2/SKILL.md) | [`skills/motion-reels/`](skills/motion-reels/SKILL.md) | [`skills/motion-v3/`](skills/motion-v3/SKILL.md), [`v3-camada/`](v3-camada/) e o clone em `v3/` |

**Qual usar:** filme de marca de software, com telas e narração → V1 em Remotion. Propaganda de marca que se vende pela imagem (imóvel, comida, hotel, clínica, produto, carro) → V2 em Remotion. Reel do dia a dia só com material real → V1/V2 em HyperFrames (`motion-reels`). Reel com ideia própria e 3D, ou episódio de uma série → V3.

## Regras comuns a todas

- Nada inventado: número, cliente, depoimento, prêmio ou funcionalidade só com fonte. Faltou dado, entra `[PENDENTE]`, e o render final ou a entrega recusa.
- Nenhuma chave aparece no vídeo, no terminal ou em arquivo versionado. Ela fica no `.env`.
- Dado de cliente (nome, telefone, e-mail, valor) é anonimizado e mostrado antes de entrar.
- Gastar crédito (ElevenLabs, Higgsfield, gerador de vídeo) pede OK com o valor estimado.
- Erro aparece como é, com a correção. Nada de contornar em silêncio.
- Rodam no Claude Code, onde dá para renderizar e olhar os quadros. No claude.ai, só as etapas de pensamento.
- Use o modelo mais capaz disponível: o design das cenas e a leitura dos quadros dependem disso.

## V1/V2: o método

A V1/V2 é um método só, que mudou de motor. Começou em Remotion, com duas skills (filme de marca e propaganda), e depois foi levado ao HyperFrames para fazer reels. As regras viajaram juntas: kit de marca, grade na batida, nada inventado, aprovação do roteiro antes do vídeo, verificação quadro a quadro e entrega muda pronta para o áudio. No HyperFrames entraram os tipos de peça (venda, comercial, viral) e as regras de marca conferidas pelo `verificar`.

### V1 · motion-v1 (Remotion)

Filme de apresentação de marca em Remotion, com transições na batida, cores da marca, telas reais anonimizadas, trilha e narração opcionais e verificação quadro a quadro.

**Modos**

- **A. Filme Remotion (padrão):** tudo desenhado em código.
- **B. Com insertos gerados:** uma ou duas cenas `plano` (vídeo de IA em tela cheia, sem texto), só se a marca permitir.
- **C. Teaser de 15 s só gerado:** pela skill [`prompts-de-motion`](https://github.com/Felpborges/prompts-de-motion), de Felipe Borges (não vem neste repositório; veja [`planos-gerados.md`](skills/motion-v1/referencias/planos-gerados.md)).

**Especificações**

- Só `src/tema.ts` muda de marca para marca: marca, paleta, tipografia, formatos, BPM, serviços, números, storyboard e áudio.
- Grade musical: 120 BPM por padrão (1 tempo = 0,5 s = 15 quadros a 30 fps). Só BPM em que 60 × fps ÷ BPM dá inteiro (90, 100, 120).
- Cortes em múltiplos de um tempo; troca de tipo de cena em múltiplos de um compasso. A transição termina exatamente no corte.
- Transições: `mascara`, `portal`, `inundacao`, `deslize`, `cortina`, `relogio`. Nunca a mesma duas vezes seguidas.
- Elemento recorrente (ponto ou quadrado) que nasce no quadro 0, muda de âncora a cada transição e se abre no logo.
- Sequência: abertura com marca e promessa → flashes de 1 s, uma palavra por serviço → uma cena por solução com tela real → prova com números → logo.
- Contraste mínimo de 4,5:1 em todo texto sobre fundo chapado, conferido pelo `npm run validar`.
- Narração: ~2,5 palavras por segundo; o script de voz só roda com `roteiroAprovado: true`.
- Mixagem: −16 LUFS, pico abaixo de −1 dBTP, sidechain, colada com `-c:v copy`.

**Fluxo:** entrevista → conceito (aprovação) → storyboard (aprovação) → construção cena a cena com `npm run stills` → render mudo → trilha e voz (opcional) → `npm run entregar`.

**Entrega:** MP4 1080p e 720p (CRF 24), mudos por padrão, mais `out/tempos.json`, `.md` e `.csv` para o agente de áudio, e a lista do que não foi verificado.

**Ambiente:** Node 18+, ffmpeg completo do sistema, 4 GB livres.

### V2 · motion-v2 (Remotion)

Parte da V1 e sobe de nível: imagem realista ao fundo e em movimento, objeto 3D, interface flutuando por cima, sem narração.

**Arco padrão:** gancho → revelação → ambientes → rajada na batida → prova visual (detalhe, objeto 3D) → canal (celular com a página) → argumentos (cartões) → chamada. Receitas por segmento em [`receitas-por-segmento.md`](skills/motion-v2/referencias/receitas-por-segmento.md) (8 segmentos).

**Tipos de cena**

| tipo | o que é |
|---|---|
| `midia` | imagem ou vídeo em tela cheia com câmera (`empurrao`, `recuo`, `deslize-esq/dir`, `subida`, `parado`) |
| `mira` | cantos de câmera fecham sobre um alvo, o resto escurece |
| `rajada` | uma mídia por tempo, corte seco na batida |
| `objeto3d` | `caixa`, `cilindro`, `logo`, `montagem` ou `predio`, girando (`volta` ou `oscilar`) |
| `aparelho` | celular 3D com as mídias rolando como página |
| `cartoes` | cartões de vidro fosco numerados sobre fundo desfocado |
| `cta` | cartão de vidro com título, linha, botão e dica |

**Especificações**

- Transições: `corte`, `dissolve`, `desfoque`, `clarao`, `empurrar`. Nunca a mesma duas vezes seguidas (o corte pode repetir). Todo corte cai num tempo (120 BPM = 15 quadros).
- Texto de tela curto: rótulo numerado ("01 · Interiores"), título de até 6 palavras, linha de apoio opcional.
- Mídia gerada pelo Higgsfield sai do plano da pessoa, nunca de chave de API: saldo → estimativa → OK → imagens em lote → revisão antes de animar → animação só do que precisa se mexer.
- Vídeo precisa durar a janela da cena mais a transição de entrada (5 s cobrem 8 tempos a 120 BPM).
- `npm run contraste` mede o fundo nos pixels das letras de cada quadro: mínimo 4,5:1. Reprovado não é entregue.
- Máquina fraca: render em partes (`--parte 1/4`…) e `npm run juntar`, sem reencodar.

**Regras próprias:** imagem gerada de algo que ainda não existe leva a sugestão de legenda "Imagens ilustrativas"; nada de marca de terceiros, pessoa real ou ponto turístico reconhecível; o produto aparece como é (a IA cria só ambiente e clima); em saúde e estética, nunca resultado de procedimento, antes e depois, rosto ou corpo.

**Entrega:** MP4 1080p mudo, versão 720p (CRF 24), `out/tempos.json` com o texto de cada cena, créditos gastos e o que não foi verificado.

### V1/V2 em HyperFrames · motion-reels

O método da V1 e da V2 levado ao HyperFrames para reels. Junta a grade, a aprovação e a verificação da linha Remotion com os tipos de peça e as regras de marca. Usa as skills oficiais `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative` e `hyperframes-registry` para o movimento, se estiverem instaladas; em conflito, valem esta skill e o kit da marca. Depende dos scripts deste repositório.

**Tipos:** `venda` (anúncio de produto ou imóvel; se a sua área exige registro profissional no anúncio, como o corretor de imóveis, ele entra na tela, como o conselho exige), `comercial` (só a marca do cliente) e `viral` (gancho em 1–2 s, um corte a cada 1–2 s, final que faz rever ou comentar).

**Especificações**

- 9:16, 15 a 30 s; margem segura de 8% nas laterais e 12% em cima e embaixo; nada nos 20% de baixo; título com no máximo 3 linhas, sem `<br>`; texto sempre sobre faixa ou cartão sólido.
- 120 BPM por padrão (90 ou 100 para marca sóbria); cortes em múltiplos de um tempo; a última cena fica pelo menos 2 tempos parada.
- Transições de base: `corte`, `dissolve`, `deslize`, `mascara`, `zoom`, `clarao`, mais as do catálogo oficial do HyperFrames, no máximo 2 "de efeito" por reel. A mesma não se repete em cenas seguidas, exceto o corte.
- Contraste WCAG AA medido pelo `check` do HyperFrames: 4,5:1 para texto normal, 3:1 para texto grande.
- Render determinístico: timeline única do GSAP, sem relógio, sem `Math.random()` sem semente e sem buscar arquivo durante o render.
- Só material real; imagem por IA fica para a V2 ou a V3.

**Fluxo:** `npm run novo -- --marca <marca> --tipo <tipo> --slug <slug>` → roteiro à pessoa (`cenas.json` e `BRIEF.md`; a única aprovação) → construção cena a cena com `npm run verificar -- <pasta> --cena <id>` → `npm run verificar -- <pasta>` até APROVADO → `npm run entregar -- <pasta>`.

**Entrega:** `reel-1080.mp4`, `reel-720.mp4`, `tempos.json` e a folha de quadros na pasta de entrega, mais o relato do que não deu para verificar.

## V3 · motion-v3

O método da **motionmaxxing**, de Tejas Makwana ([github.com/Tejashmakwana/motionmaxxing](https://github.com/Tejashmakwana/motionmaxxing), licença Apache-2.0), com uma camada por cima. Este repositório **não copia** o código da motionmaxxing: você clona o projeto original em `./v3`, no commit em que a camada foi testada, e a skill `motion-v3` e os scripts daqui usam o que está lá. Em conflito, valem a skill e o kit da marca; no resto, vale a motionmaxxing.

```bash
git clone https://github.com/Tejashmakwana/motionmaxxing v3
git -C v3 checkout 8c8ec0f
```

A pasta `v3/` fica fora do Git deste repositório. Leia `v3/LICENSE` e `v3/NOTICE`: o runtime traz componentes com licença própria (GSAP, three.js, opentype.js, a fonte Inter). Não é preciso rodar o `install.sh` dela.

O que a camada acrescenta fica em [`v3-camada/`](v3-camada/):

| arquivo | o que faz |
|---|---|
| `v3-camada/modelo/` | modelo do reel em pé (1080×1920, 30 fps) com o tema da marca, a margem segura e o `cenas.json` com a compra de cada cena. O `npm run novo -- --motor v3` copia este modelo e o `v3/runtime/`. |
| `v3-camada/look.py` | roda o `look.py` original; se o ffmpeg não tiver o filtro drawtext, a folha de quadros sai sem a hora (os números dos gates não mudam). |
| `lib/v3.mjs`, `scripts/verificar.mjs`, `scripts/entregar.mjs` | verificação e entrega da V3: cenas com compra, lint G5 (o registro profissional da venda não conta como etiqueta), look G0/G2/G3 no rascunho e no final, regras da marca, `NOTE.md` e `legenda.txt` obrigatórios. |

**Tipos**

| tipo | para quê | quem aparece | final |
|---|---|---|---|
| `venda` | anúncio de produto ou imóvel | só a marca de quem vende; registro profissional na tela, se a área exige no anúncio | chamada para o canal de contato |
| `comercial` | peça de marca para um cliente ou para a própria marca | só a marca do cliente | contato do cliente |
| `viral` | crescer nas redes | a marca, discreta, no fim | algo que faça comentar, marcar ou salvar |

**Especificações**

- 1080×1920, 30 fps; margem segura de 8% e 12%, nada nos 20% de baixo; total de 15 a 30 s.
- A ideia sai do símbolo, da ferramenta ou do jeito da marca, com teste de cobrir a logo.
- Texto sobre cartão ou faixa sólida, nunca direto sobre foto ou vídeo; título com no máximo 3 linhas.
- Nunca na tela: etiqueta ou contador no canto, cara de slide, cartão genérico de site, frase de efeito, cartão final parado mais de 1,4 s.
- 3D (`M.hero3d`) só no momento principal. Fundo por IA só para fundo ou superfície, nunca o produto à venda, pessoa, texto, logo ou tela.

**Gates de revisão**

| gate | o que confere | como |
|---|---|---|
| G0 | o render existe, se move, tem a duração e o áudio planejados | `look.py` |
| G1 | a prova é legível (texto de interface ≥ 0,04 da altura) | a olho, na folha de quadros |
| G2 | nenhum trecho de mais de 3 quadros parados | `look.py` |
| G3 | cartão final de 0,6 a 1,4 s; último plano ≤ 25% do filme | `look.py` |
| G4 | uma coisa principal por quadro | a olho, na folha de quadros |
| G5 | nada de cara de página (rótulos de canto, contadores, barras, cartões de UI genéricos) | `lint.mjs` |

**Fluxo:** `npm run novo -- --motor v3 --marca <marca> --tipo <tipo> --audio <sem|musica|locucao> --slug <slug>` → ideia → roteiro à pessoa (a única aprovação, com áudio e legenda do post) → construir pela cena mais difícil → áudio, se escolhido → `npm run verificar -- <pasta>` até APROVADO → `NOTE.md` → `npm run entregar -- <pasta>`.

**Entrega:** MP4 em 1080 e 720, a versão sem áudio no viral com áudio, `NOTE.md` (ideia, o que cada cena compra, o que é real ou gerado, números dos gates, o que não deu para verificar) e `legenda.txt`. A entrega recusa sem esses arquivos ou se o reel mudou depois da verificação.

## Instalação

Precisa de Node 22 ou mais novo (o `.nvmrc` fixa o 24), ffmpeg e ffprobe completos do sistema e, para a V3, Python 3 e git.

```bash
git clone <este repositório> motion-kit
cd motion-kit
npm install
cp .env.example .env          # preencha só o que for usar
npm run instalar-skill        # liga as 4 skills em ~/.claude/skills/ por link
npx hyperframes browser ensure  # baixa o navegador que o HyperFrames usa para renderizar
```

O `instalar-skill` cria links simbólicos (no Windows, junções) de `~/.claude/skills/<nome>` para `skills/<nome>`, então o que mudar aqui vale na hora. Ele não sobrescreve uma pasta que já exista com o mesmo nome.

As skills `motion-v1` e `motion-v2` trazem um `template/` Remotion completo: copie-o para a pasta de trabalho e rode `npm install` lá, como a skill explica. A `motion-reels` e a `motion-v3` usam os scripts deste repositório. Para a V3, clone a motionmaxxing em `./v3` (veja acima).

### Licenças de terceiros

- **Remotion** (V1 e V2): grátis para pessoa física e empresa de até 3 pessoas. Se o filme for para empresa maior, a licença é de quem fica com a propriedade do vídeo. Veja os termos em [remotion.dev/license](https://www.remotion.dev/license).
- **HyperFrames** e **GSAP** (motion-reels): instalados pelo `npm install`; o `novo` copia o `gsap.min.js` para dentro da pasta do reel. Confira as licenças deles antes de redistribuir.
- **motionmaxxing** (V3): Apache-2.0, com os componentes listados em `v3/NOTICE`.
- **Fontes** em `modelo/assets/fonts/` (Inter, Archivo, IBM Plex Mono) e nos templates Remotion: SIL Open Font License 1.1, com o arquivo da licença ao lado de cada uma. Fonte nova só entra com a licença junto.

## Comandos

| comando | o que faz |
|---|---|
| `npm run novo -- --marca exemplo --tipo comercial --slug meu-reel` | cria `reels/<aaaa-mm-dd>-<slug>/` a partir do modelo, com o kit da marca; `--tipo` é `venda`, `comercial` ou `viral`; `--motor v3 --audio <sem\|musica\|locucao>` cria um reel da V3 |
| `npm run verificar -- <pasta> [--cena <id>]` | roteiro na batida, `[PENDENTE]`, termos proibidos, contraste, faixa do Reels e quadros (na V3: lint G5, rascunho e look G0/G2/G3) |
| `npm run entregar -- <pasta>` | MP4 1080p e 720p, tempos e cópia para a pasta de entrega (`PASTA_ENTREGA` no `.env`; sem ela, `entregas/`) |
| `npm run instalar-skill` | liga as skills `motion-v1`, `motion-v2`, `motion-reels` e `motion-v3` em `~/.claude/skills/` |
| `npm test` | testes |

## Kits de marca

Cada marca tem `marcas/<id>.md` (o kit em texto: tom, paleta, regras, material aprovado) e `marcas/<id>/marca.json` com as duas logos. Comece por [`marcas/_modelo.md`](marcas/_modelo.md); [`marcas/exemplo.md`](marcas/exemplo.md) é uma marca fictícia, pronta para testar o fluxo. As skills Remotion têm o próprio modelo de kit em `skills/motion-v1/marcas/_modelo.md` e `skills/motion-v2/marcas/_modelo.md`.

Regras sensíveis de uma marca (um nome que nunca aparece, um número de registro) ficam no `.env`, fora do Git: `<ID>_PROIBIDOS` e `<ID>_PERMITIDOS_VENDA`. O `.env.example` mostra o formato.

## Pastas

```
skills/        as quatro skills (SKILL.md, referências e, na V1/V2, o template Remotion)
scripts/       novo, verificar, entregar, instalar-skill
lib/           regras compartilhadas (cenas, marca, relatório, V3)
modelo/        modelo do reel em HyperFrames e as fontes OFL
v3-camada/     o que este repositório acrescenta à motionmaxxing
marcas/        kits de marca (modelo em branco e exemplo fictício)
test/          testes (node --test)
v3/            clone da motionmaxxing (fora do Git)
reels/         reels em produção (fora do Git)
entregas/      vídeos prontos, se PASTA_ENTREGA estiver vazia (fora do Git)
```

## Licença

MIT. Veja [`LICENSE`](LICENSE). O código da motionmaxxing não faz parte deste repositório e segue a licença dele.
