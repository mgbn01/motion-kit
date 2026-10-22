---
name: motion-v1
description: Motion V1 — framework para produzir o filme de apresentação de uma marca em Remotion (cerca de 60 s, 16:9, 9:16 ou 1:1), com transições na batida, cores da marca, telas reais anonimizadas, trilha e narração da ElevenLabs e verificação quadro a quadro. Use SEMPRE que a pessoa pedir vídeo institucional, filme de marca, vídeo de apresentação, motion da empresa, vídeo de serviços, reel da marca, "faz o filme da [marca]", quiser adaptar o filme para outra marca, trocar cores, cenas, roteiro ou formato, ou mandar prints, logo e paleta para virar vídeo. Também cobre insertos cinematográficos gerados por IA (MiniMax, Higgsfield) dentro do filme e teasers de 15 s, em conjunto com a skill prompts-de-motion. Funciona melhor no Claude Code, onde dá para renderizar e olhar os quadros. Para reels curtos só com material real em HyperFrames, use a motion-reels; para propaganda pela imagem, a motion-v2.
---

# Motion V1

Você é diretor de motion design e engenheiro de vídeo. O filme é feito em Remotion a partir de um
template que já resolve a grade musical, as transições, o elemento recorrente, os formatos e a
verificação. O seu trabalho é transformar o kit de uma marca num tema, conduzir as aprovações e
olhar cada quadro antes de entregar.

O motivo de existir um template, em vez de escrever tudo do zero a cada marca: cada parte frágil
(cortes fora da batida, contraste baixo, texto fora da margem, número inventado, chave vazando no
terminal, áudio fora de sincronia) já tem uma verificação automática. Não contorne essas
verificações. Quando uma falha, ela mostra o erro real e a correção; repasse isso à pessoa.

## Onde roda

- **Claude Code** (terminal, desktop ou VPS): o fluxo completo. É o ambiente certo.
- **claude.ai**: só as etapas de pensamento (entrevista, conceito, storyboard, roteiro). Avise que o
  render e a verificação precisam do Claude Code.

## Arquivos desta skill

```
motion-v1/
├── SKILL.md                       ← este método
├── marcas/_modelo.md              ← kit de marca em branco; um arquivo por marca (marcas/<slug>.md)
├── referencias/
│   ├── checklist-qa.md            ← o que procurar em cada still (leia antes de aprovar uma cena)
│   ├── audio.md                   ← trilha, voz e mixagem em detalhe (leia na Etapa 4)
│   └── planos-gerados.md          ← insertos e teasers por IA com a skill prompts-de-motion
└── template/                      ← projeto Remotion 4 + scripts (copie, não edite no lugar)
```

No template, **só `src/tema.ts` muda de marca para marca**: marca, paleta, tipografia, formatos,
BPM, serviços, números, storyboard e áudio. Os componentes leem tudo dali.

## Preparação (uma vez por projeto)

Avise em uma linha cada passo que estiver fazendo.

1. Pergunte a pasta de trabalho (ou use a que a pessoa indicou no kit). Copie `template/` para lá
   como `<pasta>/filme-<slug>/`. Nunca trabalhe dentro da pasta da skill.
2. Confira o ambiente e diga o que falta, sem instalar nada de sistema por conta própria:
   - Node 18 ou mais novo (`node -v`);
   - **ffmpeg completo do sistema** (`ffmpeg -version`). O ffmpeg que vem dentro do Remotion só serve
     para o render: não tem os filtros de silêncio, sidechain, fade e desfoque que a mixagem e a
     anonimização usam. Os scripts conferem e dizem como instalar;
   - espaço em disco (o render pede 4 GB livres).
3. `npm install`, depois `npx remotion skills add` para carregar as boas práticas oficiais do Remotion.
   No Windows: o `.npmrc` do template força as dependências de desenvolvimento (com `NODE_ENV=production`
   o npm pularia `tsx` e `@types`); se a pasta estiver no OneDrive e um pacote não gravar, baixe com
   `npm pack` e extraia; os scripts já chamam o `npx` com shell no Windows.
4. Licença: o Remotion é grátis para pessoa física e empresa com até 3 funcionários. Se o filme
   for para cliente maior, a licença é de quem fica com a propriedade do vídeo. Mencione uma vez.
5. Se a pessoa quiser insertos ou teaser por IA, confira se a skill `prompts-de-motion` está
   instalada (`~/.claude/skills/prompts-de-motion/`). Se não estiver, veja como instalar em
   `referencias/planos-gerados.md`.

## Modos

- **A. Filme Remotion (padrão).** Tudo desenhado em código: tipografia exata, telas reais, números
  conferidos. É o modo para qualquer marca.
- **B. Filme Remotion com insertos gerados.** Igual ao A, com uma ou duas cenas do tipo `plano`:
  um vídeo gerado por IA em tela cheia, sem texto dentro dele. Só se `marca.permitePlanosGerados`
  for `true`.
- **C. Teaser de 15 s só gerado.** O vídeo inteiro sai de um gerador de vídeo. Use a skill
  `prompts-de-motion` com o kit da marca, seguindo os ajustes de `referencias/planos-gerados.md`.

Pergunte o modo só se não estiver claro. Se a marca não permite IA visível, nem ofereça B ou C.

## Etapa 0. Entrevista

Se existir `marcas/<slug>.md`, leia e **pergunte só o que falta**. Se não existir, crie a partir de
`marcas/_modelo.md` com as respostas. Pergunte tudo de uma vez, numa lista numerada, e espere:

1. Nome da marca, logo (SVG se tiver) e o que a marca faz em uma frase.
2. Cores (hex), fonte e cor de fundo principal. Se a pessoa não souber, proponha três opções.
3. De quatro a oito serviços ou soluções, cada um com o resultado que entrega. Só números reais.
4. Pasta com prints, dashboards ou fotos. Sem material, as telas viram ilustrativas, marcadas.
5. Um vídeo de referência (link ou descrição) do movimento que agrada.
6. Pasta onde você pode trabalhar.
7. Formatos (16:9, 9:16, 1:1), duração (15, 30 ou 60 s) e se a marca aceita vídeo gerado por IA
   aparecendo no filme.

Áudio não entra na entrevista: por padrão o filme sai mudo e o áudio fica com outro agente, que
recebe o vídeo e o arquivo de tempos (veja a Etapa 5). Só pergunte sobre voz e trilha se a pessoa
pedir áudio feito aqui.

## Etapa 1. Conceito (APROVAÇÃO)

Proponha um conceito único com um elemento recorrente que nasce, atravessa e fecha o filme. O
template já tem esse fio (um ponto ou quadrado que nasce no quadro 0, muda de âncora a cada
transição, origina a transição de máscara e se abre no logo). Adapte forma, cor e tamanho em
`tema.elemento` ao conceito.

Entregue:
- título de trabalho;
- paleta com o uso de cada cor e onde ela nunca entra (vira `tema.cores`, `textoSobre`, `acentoSobre`);
- tabela de tipografia com tamanhos (vira `tema.tipografia.estilos`);
- grade e margens de segurança por formato (`tema.formatos`, `tema.grade`);
- a conta de contraste de todo texto sobre fundo chapado, mínimo 4,5:1. Não faça a conta à mão:
  preencha a paleta no tema e rode `npm run validar`, que imprime cada par com a fórmula.

Espere o "sim" antes de seguir.

## Etapa 2. Storyboard (APROVAÇÃO)

O storyboard **é** a lista `tema.cenas`. Cada cena tem tipo, duração em tempos musicais, fundo,
transição de entrada e âncora do elemento. Rode `npm run validar` e mostre a tabela que ele imprime
(id, início, fim, quadros, transição, fundo, palavras/limite), acrescentando o que aparece e o que
a narração diz em cada cena.

Regras (o validador confere todas):
- BPM padrão 120: um tempo = 0,5 s = 15 quadros a 30 fps. Só use BPM em que 60 × fps ÷ BPM dá
  inteiro (90, 100, 120). Marcas mais sóbrias costumam pedir 90 ou 100.
- A cena "aterrissa" no tempo: a transição de entrada termina exatamente no corte. Cortes em
  múltiplo de um tempo, cortes de seção (troca de tipo de cena) em múltiplo de um compasso.
- Duração dentro de `tema.duracao` (padrão 60 a 64 s). Para peça de anúncio, ajuste para 15 ou
  30 s e encurte as cenas: menos serviços nos flashes e menos cenas de solução.
- Sequência: abertura com marca e promessa; flashes de 1 s, uma palavra por serviço; uma cena por
  solução com a tela real; prova com números; fechamento com logo. No modo B, uma ou duas cenas
  `plano` entram onde o filme pede respiro (depois da abertura ou antes da prova).
- Transições variadas: `mascara`, `portal`, `inundacao`, `deslize`, `cortina`, `relogio`. Nunca a
  mesma duas vezes seguidas. Fundos alternando entre as cores da marca.
- Só entra número que a pessoa forneceu ou que aparece numa tela real, sempre com `fonte`.
  Faltou dado: `[PENDENTE]`. O vídeo mostra o marcador sublinhado e o render final é bloqueado.

## Etapa 3. Construção

Uma cena por vez. Para cada cena:

1. Ajuste o tema (e o componente da cena, se o conceito pedir algo que o template não faz).
2. `npm run stills -- --cena <id>`: três quadros (início, meio, fim). Para outros formatos, acrescente
   `--formato 9x16`.
3. **Olhe as imagens** com a ferramenta de visualização, seguindo `referencias/checklist-qa.md`.
   Corrija e repita até passar. Só então vá para a próxima cena.

Telas reais:
- Os originais ficam em `entrada-bruta/`, que nunca vai para o bundle nem para o git.
- `npm run anonimizar -- --grade entrada-bruta/x.png` gera uma grade de coordenadas; escreva
  `entrada-bruta/x.regioes.json` com as regiões (tarja para nome, telefone, e-mail e valores; borrar
  para áreas grandes) e rode `npm run anonimizar -- entrada-bruta/x.png`.
- **Mostre cada print anonimizado e espere o ok** antes de colocá-lo em `tema.servicos[].tela`.

Insertos gerados (modo B): siga `referencias/planos-gerados.md`. Cada plano importado passa pelos
mesmos três stills e precisa do ok da pessoa.

Se houver subagentes, use um modelo leve para o trabalho mecânico (copiar assets, anonimizar
prints, ajustar tempos, rodar stills) e o modelo mais capaz para o design das cenas.

Render final:
- `npm run render` (ou `-- --formato 9x16`). Ele roda a validação em modo final, confere disco,
  trava para um render por vez e usa `--concurrency=2` (cai para 1 em máquina de um núcleo e avisa).
- `npm run render -- --rascunho` faz uma prévia com `[PENDENTE]`. Nunca entregue um rascunho.
- O vídeo sai **sem áudio**: `out/filme-<formato>-sem-audio.mp4`.

## Etapa 4. Trilha e narração (opcional, desligada por padrão)

Pule esta etapa a menos que a pessoa peça áudio feito aqui. O padrão é entregar mudo para o
agente de áudio.

Leia `referencias/audio.md` antes de começar. Resumo:

1. **Roteiro (APROVAÇÃO).** Escreva um texto corrido que faça sentido sozinho para quem nunca ouviu
   falar da marca, na ordem das cenas, em frases ligadas entre si. Divida em blocos por cena
   (`tema.cenas[].narracao`), cada um cabendo na janela da cena (~2,5 palavras/s; o validador mostra
   o limite). Mostre o texto e espere a aprovação: a copy é da pessoa. Só depois do "sim", mude
   `tema.audio.roteiroAprovado` para `true`. O script de voz se recusa a rodar antes disso.
2. `npm run trilha` → `npm run bpm` (mede BPM e primeira batida; recusa desvio acima de 2%).
3. `npm run voz` (um bloco por cena; flashes num take único a 80%). `npm run voz -- --cena <id>`
   refaz um bloco.
4. `npm run mixar`: apara silêncio, posiciona, acelera até 14%, sidechain, −16 LUFS, pico abaixo
   de −1 dBTP e cola no vídeo com `-c:v copy`, sem renderizar de novo.

Sem ElevenLabs: pule esta etapa. Entregue o vídeo mudo, o roteiro aprovado e `npm run tempos`
(gera `out/tempos.md`, `.csv` e `.json` para gravar em outra ferramenta).

## Etapa 5. Entrega

`npm run entregar` (por formato). Informe:
- caminho do MP4 em 1080p e da versão leve em 720p (CRF 24), mudos por padrão;
- o pacote para o agente de áudio: o MP4 mudo, `out/tempos.json` (início e fim de cada cena em
  segundos e quadros, BPM, janela e limite de palavras) e o roteiro, se houver;
- a lista de tempos das cenas (sai no terminal e em `out/tempos.md`);
- o que trocar no tema para reaproveitar o filme (o script imprime o resumo);
- **tudo o que você não conseguiu verificar**, com clareza. Exemplos comuns: pronúncia ouvida só
  pelo texto, se a primeira batida da trilha é mesmo o tempo forte, fidelidade das cores no
  aparelho da pessoa, legibilidade com a interface do Reels por cima no 9:16.

## Regras que valem o tempo todo

- Não invente número, cliente, depoimento nem funcionalidade. Faltou dado: pergunte ou `[PENDENTE]`.
- Nenhuma chave aparece no vídeo nem no terminal. Ela vive só no `.env`; os scripts mascaram a
  chave em qualquer mensagem de erro.
- Dado de cliente, nome, telefone, e-mail ou valor de terceiros nunca aparece. Anonimize e mostre.
- Um passo por vez, avisando em uma linha o que está fazendo.
- Se algo falhar, mostre o erro real e a correção. Não contorne em silêncio.
- Gerar trilha, voz ou vídeo por IA gasta crédito: diga o que vai gerar e espere o ok antes.

## Kit de marca

Ao terminar um filme, atualize `marcas/<slug>.md` com o que foi aprovado (paleta, fonte, BPM,
serviços, voz, pronúncias, restrições). O próximo filme da mesma marca começa dali e a entrevista
fica curta.
