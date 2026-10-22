/**
 * TEMA — o único lugar para mudar o filme inteiro.
 *
 * Marca, paleta, tipografia, grade, formatos, música, cenas e áudio moram aqui.
 * Este arquivo NÃO importa nada do Remotion: os scripts em /scripts leem ele direto.
 *
 * Convenção de dados ausentes: qualquer texto com "[PENDENTE]" é tratado como
 * dado que falta. `npm run validar` lista todos; `npm run validar -- --final`
 * bloqueia o render enquanto houver algum.
 */

export type NomeCor = 'tinta' | 'papel' | 'primaria' | 'secundaria' | 'destaque';

export type TipoTransicao =
  | 'mascara' // círculo que cresce a partir do elemento recorrente
  | 'portal' // janela que abre no centro e atravessa
  | 'inundacao' // duas ondas de cor sobem e revelam a cena
  | 'deslize' // a cena empurra a anterior
  | 'cortina' // varredura lateral
  | 'relogio'; // varredura radial

/**
 * 'plano' = inserto cinematográfico gerado por IA (MiniMax H3, Higgsfield etc.), em tela cheia,
 * sem texto dentro do vídeo. O prompt sai da skill prompts-de-motion com os ajustes de
 * referencias/planos-gerados.md, e o arquivo entra com npm run importar-plano.
 */
export type TipoCena = 'abertura' | 'flashes' | 'solucao' | 'prova' | 'fechamento' | 'plano';

export type FormatoId = '16x9' | '9x16' | '1x1';

export type Servico = {
  /** Uma palavra só: é o que aparece no bloco de flashes. */
  palavra: string;
  /** Título da cena de solução. */
  titulo: string;
  /** Resultado entregue. Só número real, fornecido pelo responsável pela marca ou visível na tela. */
  resultado: string;
  /** Arquivo em public/telas/ (já anonimizado e aprovado). Sem arquivo, usa tela ilustrativa. */
  tela?: string;
  /** true quando a tela é recriada. Aparece o selo "Tela ilustrativa". */
  ilustrativa?: boolean;
};

export type Numero = {
  /** null enquanto o número real não foi fornecido. Aparece [PENDENTE] no vídeo. */
  valor: number | null;
  casasDecimais?: number;
  prefixo?: string;
  sufixo?: string;
  rotulo: string;
  /** De onde veio o número (planilha, dashboard, contrato). Obrigatório quando valor != null. */
  fonte: string;
};

export type Cena = {
  id: string;
  tipo: TipoCena;
  /** Duração em tempos (batidas). Um tempo = 60 / bpm segundos. */
  tempos: number;
  fundo: NomeCor;
  /** Transição de ENTRADA. A da primeira cena é ignorada. */
  transicao: TipoTransicao;
  /** Duração da transição de entrada, em tempos. */
  transicaoTempos?: 1 | 2;
  /** Índice em tema.servicos (só cenas de solução). */
  servico?: number;
  /** Bloco do roteiro desta cena. Fica '' até a copy ser aprovada. */
  narracao: string;
  /** Posição do elemento recorrente nesta cena, de 0 a 1. */
  ancora: { x: number; y: number };
  /** Só cenas 'plano': legenda curta opcional, sempre sobre faixa sólida (nunca direto sobre o vídeo). */
  legenda?: string;
};

export const tema = {
  marca: {
    nome: '[MARCA]',
    /** Como o nome se FALA. Só vai para a voz, nunca para a tela. Ex.: "Ei Ai" para AI. */
    nomeFalado: '[PENDENTE]',
    promessa: '[PENDENTE] a promessa da marca em uma frase',
    /** Fechamento: assinatura curta e site. */
    assinatura: '[PENDENTE] assinatura',
    site: '[PENDENTE] site.com.br',
    /** Arquivo em public/. SVG de preferência. */
    logo: 'logo.svg',
    /** Largura ÷ altura do arquivo do logo. 1 = quadrado; acima de 1,5 o fechamento trata como logo horizontal. */
    logoProporcao: 1,
    /**
     * Libera cenas 'plano' (vídeo gerado por IA). Deixe false para marcas em que
     * a IA precisa ficar invisível: o validador barra qualquer plano gerado.
     */
    permitePlanosGerados: true,
  },

  /**
   * Paleta. Cada cor diz onde entra e onde nunca entra.
   * O validador calcula o contraste de todo par texto/fundo usado (mínimo 4,5:1).
   */
  cores: {
    tinta: {
      hex: '#101A3D',
      uso: 'Fundo escuro da abertura e da prova; texto sobre papel, secundária e destaque.',
      nunca: 'Nunca como texto sobre primária.',
    },
    papel: {
      hex: '#F3F5FF',
      uso: 'Fundo claro das soluções; texto sobre tinta e primária.',
      nunca: 'Nunca como texto sobre secundária ou destaque.',
    },
    primaria: {
      hex: '#2F4BFF',
      uso: 'Fundo de seção e acento de números sobre papel.',
      nunca: 'Nunca como texto sobre tinta.',
    },
    secundaria: {
      hex: '#FFC233',
      uso: 'Flashes e acento de números sobre tinta.',
      nunca: 'Nunca como texto sobre papel ou primária.',
    },
    destaque: {
      hex: '#FF4F7B',
      uso: 'Só flashes e o elemento recorrente.',
      nunca: 'Nunca em texto corrido; nunca como fundo de tela de produto.',
    },
  } satisfies Record<NomeCor, { hex: string; uso: string; nunca: string }>,

  /** Cor do texto principal sobre cada fundo. */
  textoSobre: {
    tinta: 'papel',
    papel: 'tinta',
    primaria: 'papel',
    secundaria: 'tinta',
    destaque: 'tinta',
  } satisfies Record<NomeCor, NomeCor>,

  /** Cor de acento (números, resultado) sobre cada fundo. */
  acentoSobre: {
    tinta: 'secundaria',
    papel: 'primaria',
    primaria: 'papel',
    secundaria: 'tinta',
    destaque: 'tinta',
  } satisfies Record<NomeCor, NomeCor>,

  tipografia: {
    familia: 'Bricolage Grotesque',
    /** Fallback só para o Studio; o render usa os arquivos locais abaixo. */
    pilha: '"Bricolage Grotesque", system-ui, sans-serif',
    arquivos: [
      { peso: '400', arquivo: 'fontes/bricolage-grotesque-latin-400-normal.woff2' },
      { peso: '700', arquivo: 'fontes/bricolage-grotesque-latin-700-normal.woff2' },
      { peso: '800', arquivo: 'fontes/bricolage-grotesque-latin-800-normal.woff2' },
    ],
    /**
     * Tamanhos em px para o lado curto de 1080 px. Escalam sozinhos em outros formatos.
     * tracking em em. Abaixo de -0.03em as letras começam a colar: o validador barra.
     */
    estilos: {
      display: { tamanho: 196, peso: '800', entrelinha: 0.95, tracking: -0.02 },
      titulo: { tamanho: 96, peso: '800', entrelinha: 1.0, tracking: -0.015 },
      numero: { tamanho: 150, peso: '800', entrelinha: 1.0, tracking: -0.02 },
      subtitulo: { tamanho: 54, peso: '700', entrelinha: 1.15, tracking: -0.005 },
      corpo: { tamanho: 40, peso: '400', entrelinha: 1.3, tracking: 0 },
      legenda: { tamanho: 28, peso: '400', entrelinha: 1.3, tracking: 0.005 },
    },
  },

  /**
   * Formatos. A margem de segurança é a fração da largura (x) e da altura (y)
   * que nenhum texto ou elemento importante pode invadir.
   * 9:16 tem margem vertical maior por causa da interface do Reels/Stories.
   */
  formatos: {
    '16x9': { largura: 1920, altura: 1080, margem: { x: 0.07, y: 0.09 } },
    '9x16': { largura: 1080, altura: 1920, margem: { x: 0.08, y: 0.13 } },
    '1x1': { largura: 1080, altura: 1080, margem: { x: 0.08, y: 0.08 } },
  } satisfies Record<FormatoId, { largura: number; altura: number; margem: { x: number; y: number } }>,

  /** Grade de 12 colunas dentro da margem de segurança. */
  grade: { colunas: 12, calha: 24 },

  fps: 30,

  musica: {
    /** Escolha um BPM em que 60 * fps / bpm dê inteiro: 90 (20 quadros), 100 (18), 120 (15). */
    bpm: 120,
    temposPorCompasso: 4,
  },

  /** Duração aceita do filme, em segundos. */
  duracao: { min: 60, max: 64 },

  elemento: {
    forma: 'circulo' as 'circulo' | 'quadrado',
    cor: 'destaque' as NomeCor,
    /** Diâmetro em px no lado curto de 1080. */
    tamanho: 34,
  },

  flashes: {
    /** Cada palavra ocupa este número de tempos. 2 tempos a 120 BPM = 1 s. */
    temposPorPalavra: 2,
    /** Os fundos giram nesta ordem, uma cor por palavra. */
    fundos: ['primaria', 'destaque', 'secundaria', 'papel'] as NomeCor[],
  },

  servicos: [
    { palavra: 'Diagnóstico', titulo: '[PENDENTE] solução 1', resultado: '[PENDENTE]', ilustrativa: true },
    { palavra: 'Projeto', titulo: '[PENDENTE] solução 2', resultado: '[PENDENTE]', ilustrativa: true },
    { palavra: 'Execução', titulo: '[PENDENTE] solução 3', resultado: '[PENDENTE]', ilustrativa: true },
    { palavra: 'Resultado', titulo: '[PENDENTE] solução 4', resultado: '[PENDENTE]', ilustrativa: true },
  ] as Servico[],

  numeros: [
    { valor: null, rotulo: '[PENDENTE] número 1', fonte: '[PENDENTE]' },
    { valor: null, rotulo: '[PENDENTE] número 2', fonte: '[PENDENTE]' },
    { valor: null, rotulo: '[PENDENTE] número 3', fonte: '[PENDENTE]' },
  ] as Numero[],

  /**
   * Storyboard. A ordem aqui é a ordem do filme.
   * Duração total = soma dos tempos. 120 tempos a 120 BPM = 60 s.
   * Cortes de seção (troca de tipo de cena) precisam cair em múltiplo de compasso.
   */
  cenas: [
    { id: 'abertura', tipo: 'abertura', tempos: 12, fundo: 'tinta', transicao: 'mascara', narracao: '', ancora: { x: 0.5, y: 0.78 } },
    { id: 'flashes', tipo: 'flashes', tempos: 8, fundo: 'primaria', transicao: 'inundacao', transicaoTempos: 2, narracao: '', ancora: { x: 0.5, y: 0.84 } },
    { id: 'solucao-1', tipo: 'solucao', servico: 0, tempos: 16, fundo: 'tinta', transicao: 'mascara', narracao: '', ancora: { x: 0.08, y: 0.86 } },
    { id: 'solucao-2', tipo: 'solucao', servico: 1, tempos: 16, fundo: 'papel', transicao: 'portal', transicaoTempos: 2, narracao: '', ancora: { x: 0.08, y: 0.86 } },
    { id: 'solucao-3', tipo: 'solucao', servico: 2, tempos: 16, fundo: 'primaria', transicao: 'cortina', narracao: '', ancora: { x: 0.08, y: 0.86 } },
    { id: 'solucao-4', tipo: 'solucao', servico: 3, tempos: 16, fundo: 'papel', transicao: 'deslize', narracao: '', ancora: { x: 0.08, y: 0.86 } },
    { id: 'prova', tipo: 'prova', tempos: 20, fundo: 'tinta', transicao: 'inundacao', transicaoTempos: 2, narracao: '', ancora: { x: 0.5, y: 0.86 } },
    { id: 'fechamento', tipo: 'fechamento', tempos: 16, fundo: 'primaria', transicao: 'mascara', narracao: '', ancora: { x: 0.5, y: 0.5 } },
  ] as Cena[],

  /**
   * Áudio. A chave da ElevenLabs fica no .env (ELEVENLABS_API_KEY), nunca aqui.
   * O voiceId não é segredo.
   */
  audio: {
    /**
     * Trava da copy: a voz só é gerada depois que o responsável pela marca aprovar o roteiro.
     * Só mude para true depois de um "sim" explícito.
     */
    roteiroAprovado: false,
    voiceId: '[PENDENTE]',
    modelo: 'eleven_multilingual_v2',
    idioma: 'pt',
    voz: { stability: 0.5, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
    velocidadeFlashes: 0.8,
    palavrasPorSegundo: 2.5,
    /** Quanto um bloco pode ser acelerado para caber na janela. 1.14 = 14%. */
    aceleracaoMaxima: 1.14,
    /** Siglas e estrangeirismos escritos como se falam. Só afeta a voz. */
    pronuncias: {} as Record<string, string>,
    trilha: {
      prompt:
        'Instrumental corporate motion design track, exactly {BPM} BPM, 4/4, steady constant tempo, ' +
        'builds every 8 bars, punchy modern drums, bright synths, ends with a final hit on the downbeat, no vocals.',
      /** Quanto a trilha fica abaixo da voz, em LU. */
      abaixoDaVozLU: 6,
      entradaSegundos: 0.15,
      saidaSegundos: 1.5,
    },
    silencio: { inicioDb: -55, fimDb: -60, folgaFimSegundos: 0.25 },
    alvoLufs: -16,
    picoMaximoDbtp: -1.5,
  },
};

export type Tema = typeof tema;
