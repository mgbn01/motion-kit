# Insertos e teasers gerados por IA (modos B e C)

O Remotion cuida do que precisa ser exato: tipografia, telas reais, números, logo. Um gerador de
vídeo (MiniMax H3 e parecidos, direto no site ou pelo Higgsfield) cuida do que o código não faz
bem: luz, matéria, líquido, câmera atravessando um ambiente. Os dois se encontram no kit da marca.

Quem escreve o prompt do gerador é a skill **prompts-de-motion**, de Felipe Borges. Ela não vem
copiada aqui dentro: instale a partir do repositório do autor, que é de onde vêm as atualizações.

```bash
git clone https://github.com/Felpborges/prompts-de-motion.git /tmp/prompts-de-motion
mkdir -p ~/.claude/skills && cp -R /tmp/prompts-de-motion/skills/prompts-de-motion ~/.claude/skills/
```

Abra uma sessão nova do Claude Code depois de instalar.

Se `marca.permitePlanosGerados` for `false`, nada deste arquivo se aplica: a marca não aceita IA
visível no filme. Não ofereça.

## Modo B: inserto dentro do filme

Uma cena `tipo: 'plano'` em `tema.cenas`: vídeo em tela cheia, sem texto dentro dele, com legenda
opcional numa faixa sólida da marca (para o contraste continuar calculável).

### 1. Medir a janela
`npm run tempos` e `npm run validar`. O plano precisa cobrir a cena desde o começo da transição de
entrada até o corte seguinte: `(fimQuadro − inicioQuadro + entradaQuadros) ÷ fps` segundos.
Com 16 tempos e entrada de 1 tempo a 120 BPM: 8,5 s.

### 2. Pedir o prompt à prompts-de-motion com estes ajustes
Ela tem padrões próprios. Para um inserto que vai ser composto no Remotion, passe as instruções
abaixo junto com o pedido. Elas valem por cima dos padrões dela:

- **Duração e ritmo:** a duração medida no passo 1, 30 fps. Os momentos do roteiro dela caem em
  múltiplos de um tempo do filme (0,5 s a 120 BPM; 0,6 s a 100 BPM).
- **Proporção:** a do formato. Para 16:9 e 9:16, peça dois prompts recompostos (a skill dela sabe
  fazer o vertical); não recorte um no outro.
- **Paleta:** os hex de `tema.cores`, com as funções e proibições aprovadas. Não use o acento
  padrão da casa dela.
- **Nenhum texto no quadro.** A lista de textos dela fica vazia: nenhuma letra, número, logo,
  interface ou marca d'água aparece. Toda tipografia entra depois, no Remotion.
- **Respiro para a composição:** a área da âncora do elemento recorrente e da legenda
  (ex.: canto inferior esquerdo, ~25% da tela) fica sem ação importante.
- **Entradas e saídas calmas:** o primeiro e o último tempo do plano sem corte nem chicote, porque
  a transição do Remotion acontece por cima deles.
- **Âncora de identidade:** sempre que fizer sentido, use o próprio elemento recorrente (forma e
  cor da marca) como âncora visual. É o que costura o plano ao resto do filme.
- **Silencioso:** já é o padrão dela. O áudio vem da mixagem do filme.
- **Pessoas reais:** nenhum rosto de cliente, funcionário ou pessoa pública.

Mantenha da skill dela: o mecanismo central único, o Plano B para o elemento mais arriscado e a
disciplina de estilo por restrições.

### 3. Gerar
Duas rotas, sempre com o ok da pessoa antes (gera custo):
- a pessoa cola o prompt no site do gerador e baixa o MP4;
- pelo conector do Higgsfield no Claude Code, se estiver conectado. Antes de gerar, confira no
  catálogo de modelos qual está disponível, a duração máxima e o custo em créditos, e diga isso.
  Se o modelo gerar menos tempo que a janela, use o plano de segmentação da skill dela ou encurte
  a cena.

### 4. Importar e verificar
```bash
npm run importar-plano -- --arquivo ~/Downloads/plano.mp4 --cena <id> [--formato 9x16] [--inicio 1.2]
```
O script normaliza para 30 fps, recorta para preencher o formato, tira o áudio e corta na duração
exata. Recusa plano curto demais. Depois: `npm run stills -- --cena <id>` e o checklist, com
atenção a letras, logos e rostos que o gerador tenha inventado. Mostre os stills e espere o ok.

## Modo C: teaser de 15 s só gerado

Aqui a prompts-de-motion trabalha no formato dela (15 s, um prompt fechado). Do kit da marca,
passe a paleta em hex, o nome real da marca (é da própria pessoa, então não use a convenção de
nome inventado dela), os textos de tela no idioma do público e as restrições do kit.

O teaser sai mudo. Se a pessoa quiser trilha e voz, gere com a mesma receita de
`referencias/audio.md` e cole com `-c:v copy`; o `mixar.ts` foi feito para a linha do tempo do
filme, então para o teaser monte os comandos de ffmpeg à parte, mostrando cada um antes.

## O que não está verificado nesta integração

- A qualidade e a fidelidade de cor de cada gerador mudam com a versão do modelo. Confira sempre
  nos stills.
- Disponibilidade, duração máxima e preço do MiniMax H3 no Higgsfield não foram checados aqui;
  consulte o catálogo antes de gerar.
