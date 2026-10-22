/**
 * TEMA V2 — o único lugar para mudar o filme inteiro.
 * V2 = mídia realista (render, foto ou imagem gerada) + imagem animada + 3D + interface sobre a imagem.
 * Sem importação do Remotion: os scripts leem este arquivo direto.
 * Texto com "[PENDENTE]" é dado que falta; `npm run validar -- --final` bloqueia o render.
 */

export type NomeCor = 'tinta' | 'papel' | 'primaria' | 'acento' | 'claro';
export type FormatoId = '9x16' | '16x9' | '1x1';

export type TipoTransicao =
  | 'corte' // corte seco no tempo (sem duração)
  | 'dissolve' // fusão com leve brilho
  | 'desfoque' // a cena sai desfocando e a próxima entra focando
  | 'clarao' // clarão branco de câmera
  | 'empurrar'; // a cena nova empurra a anterior

export type Movimento = 'empurrao' | 'recuo' | 'deslize-esq' | 'deslize-dir' | 'subida' | 'parado';

/** Toda imagem ou vídeo usado no filme, com a origem declarada. */
export type Midia = {
  arquivo: string; // em public/midias/ (.jpg/.png/.webp ou .mp4)
  origem: 'real' | 'gerada';
  descricao: string;
};

type Base = {
  id: string;
  tempos: number;
  transicao: TipoTransicao;
  transicaoTempos?: 1 | 2;
};

export type Texto = { rotulo?: string; titulo: string; texto?: string; posicao?: 'baixo' | 'topo' };

export type Cena = Base &
  (
    | ({ tipo: 'midia'; midia: string; movimento: Movimento; ajuste?: 'cobrir' | 'conter'; fundo?: NomeCor; /** 0–0,5: escurece mídias muito claras para o texto ler (use quando `npm run contraste` reprovar). */ escurecer?: number } & Texto)
    | ({ tipo: 'mira'; midia: string; alvo: { x: number; y: number; w: number; h: number }; selo: string } & Texto)
    | { tipo: 'rajada'; midias: string[] }
    | ({
        tipo: 'objeto3d';
        /** caixa (embalagem), cilindro (frasco/lata/pote), logo (com volume), montagem (peça por peça), predio. */
        forma: 'caixa' | 'cilindro' | 'logo' | 'montagem' | 'predio';
        fundo: NomeCor;
        /** Chave de tema.midias: frente da caixa, rótulo do cilindro, topo da montagem. */
        textura?: string;
        texturaVerso?: string;
        corCorpo?: NomeCor;
        corDetalhe?: NomeCor;
        /** px no lado curto de 1080. */
        tamanho?: { w: number; h: number; d: number };
        giro?: 'volta' | 'oscilar';
        /** Peças da montagem ou andares do prédio. */
        pecas?: number;
      } & Texto)
    /** Atalho antigo: o mesmo que objeto3d com forma 'predio'. */
    | ({ tipo: 'volume'; andares: number; fundo: NomeCor } & Texto)
    | ({ tipo: 'aparelho'; midiaFundo: string; telas: string[] } & Texto)
    | ({ tipo: 'cartoes'; midiaFundo: string; cartoes: { titulo: string; texto: string }[] } & Omit<Texto, 'titulo'> & { titulo?: string })
    | { tipo: 'cta'; midiaFundo: string; rotulo?: string; titulo: string; texto: string; botao: string; dica?: string }
  );

export const tema = {
  marca: {
    nome: '[MARCA]',
    nomeFalado: '[PENDENTE]',
    /** Logo claro, para usar sobre imagem. SVG de preferência. */
    logo: 'logo.svg',
    /** Versão do logo para fundo claro. Sem ela, o logo vira silhueta escura sobre fundo claro. */
    logoEscuro: '',
    /** Libera mídia gerada por IA (origem: 'gerada'). false = só renders e fotos reais. */
    permiteMidiaGerada: true,
    /** Marca fixa no canto durante o filme (como uma assinatura de estúdio). */
    marcaFixa: true,
  },

  cores: {
    tinta: { hex: '#0E0F0C', uso: 'Fundos escuros, faixa sob texto.', nunca: 'Nunca texto sobre tinta sem ser papel.' },
    papel: { hex: '#FFFFFF', uso: 'Todo texto sobre imagem.', nunca: 'Nunca sobre fundo claro.' },
    primaria: { hex: '#1F3A2E', uso: 'Volume 3D, botão.', nunca: 'Nunca como texto sobre imagem.' },
    acento: { hex: '#E8C9A0', uso: 'Detalhes, selo, andar em destaque.', nunca: 'Nunca em texto longo.' },
    claro: { hex: '#ECEBE7', uso: 'Fundo da planta e cenas claras.', nunca: 'Nunca com texto papel.' },
  } satisfies Record<NomeCor, { hex: string; uso: string; nunca: string }>,

  textoSobre: { tinta: 'papel', papel: 'tinta', primaria: 'papel', acento: 'tinta', claro: 'tinta' } satisfies Record<NomeCor, NomeCor>,

  tipografia: {
    familia: 'Manrope',
    pilha: 'Manrope, system-ui, sans-serif',
    arquivos: [
      { peso: '400', arquivo: 'fontes/manrope-latin-400-normal.woff2' },
      { peso: '600', arquivo: 'fontes/manrope-latin-600-normal.woff2' },
      { peso: '800', arquivo: 'fontes/manrope-latin-800-normal.woff2' },
    ],
    /** px para lado curto de 1080; tracking em em (mínimo -0,03). */
    estilos: {
      titulo: { tamanho: 82, peso: '600', entrelinha: 1.05, tracking: -0.025 },
      texto: { tamanho: 34, peso: '400', entrelinha: 1.35, tracking: 0 },
      rotulo: { tamanho: 24, peso: '600', entrelinha: 1.2, tracking: 0.08 },
      cartaoTitulo: { tamanho: 38, peso: '600', entrelinha: 1.15, tracking: -0.01 },
      cartaoTexto: { tamanho: 28, peso: '400', entrelinha: 1.3, tracking: 0 },
      botao: { tamanho: 30, peso: '600', entrelinha: 1, tracking: 0 },
      marca: { tamanho: 34, peso: '800', entrelinha: 1, tracking: -0.01 },
    },
  },

  formatos: {
    '9x16': { largura: 1080, altura: 1920, margem: { x: 0.08, y: 0.12 } },
    '16x9': { largura: 1920, altura: 1080, margem: { x: 0.07, y: 0.09 } },
    '1x1': { largura: 1080, altura: 1080, margem: { x: 0.08, y: 0.08 } },
  } satisfies Record<FormatoId, { largura: number; altura: number; margem: { x: number; y: number } }>,

  fps: 30,
  musica: { bpm: 120, temposPorCompasso: 4 },
  duracao: { min: 30, max: 40 },

  /** Contraste mínimo do texto MEDIDO nos pixels do quadro (npm run contraste). */
  contrasteMinimo: 4.5,

  midias: {
    'heroi-video': { arquivo: 'heroi-video.mp4', origem: 'gerada', descricao: 'Torre ao entardecer, câmera subindo (imagem para vídeo)' },
    heroi: { arquivo: 'heroi.jpg', origem: 'gerada', descricao: 'Torre residencial ao entardecer' },
    'sala-video': { arquivo: 'sala-video.mp4', origem: 'gerada', descricao: 'Sala com vista para o mar, cortinas ao vento' },
    sala: { arquivo: 'sala.jpg', origem: 'gerada', descricao: 'Sala com vista para o mar' },
    'piscina-video': { arquivo: 'piscina-video.mp4', origem: 'gerada', descricao: 'Piscina no rooftop com névoa' },
    piscina: { arquivo: 'piscina.jpg', origem: 'gerada', descricao: 'Piscina no rooftop à noite' },
    varanda: { arquivo: 'varanda.jpg', origem: 'gerada', descricao: 'Varanda gourmet ao pôr do sol' },
    lobby: { arquivo: 'lobby.jpg', origem: 'gerada', descricao: 'Lobby de pé-direito duplo' },
    planta: { arquivo: 'planta.jpg', origem: 'gerada', descricao: 'Planta 3D vista de cima, sem textos' },
  } as Record<string, Midia>,

  /** Storyboard de EXEMPLO (demo da marca fictícia "Exemplo", imobiliário): 76 tempos a 120 BPM = 38 s. Troque tudo; veja referencias/receitas-por-segmento.md. */
  cenas: [
    { id: 'abertura', tipo: 'midia', midia: 'heroi-video', movimento: 'parado', tempos: 8, transicao: 'corte', rotulo: 'Novo lançamento', titulo: 'Ainda não saiu do papel.', texto: 'Mas já dá para sentir como vai ser.' },
    { id: 'revelacao', tipo: 'mira', midia: 'heroi', alvo: { x: 0.22, y: 0.07, w: 0.42, h: 0.42 }, selo: 'Render', tempos: 8, transicao: 'clarao', titulo: 'E já parece real.' },
    { id: 'interiores', tipo: 'midia', midia: 'sala-video', movimento: 'parado', escurecer: 0.28, tempos: 8, transicao: 'dissolve', rotulo: '01 · Interiores', titulo: 'Cada ambiente antes da obra.' },
    { id: 'lazer', tipo: 'midia', midia: 'piscina-video', movimento: 'parado', tempos: 8, transicao: 'desfoque', rotulo: '02 · Áreas comuns', titulo: 'Atmosfera que se sente na tela.' },
    { id: 'rajada', tipo: 'rajada', midias: ['varanda', 'lobby', 'sala', 'piscina'], tempos: 4, transicao: 'corte' },
    { id: 'planta', tipo: 'midia', midia: 'planta', movimento: 'empurrao', ajuste: 'conter', fundo: 'claro', tempos: 8, transicao: 'clarao', rotulo: '03 · Planta', titulo: 'A planta, em volume.' },
    { id: 'volume', tipo: 'objeto3d', forma: 'predio', pecas: 14, fundo: 'claro', tempos: 8, transicao: 'dissolve', rotulo: '04 · Volumetria 3D', titulo: 'Do terreno ao último andar.' },
    { id: 'pagina', tipo: 'aparelho', midiaFundo: 'heroi', telas: ['heroi', 'sala', 'piscina'], tempos: 8, transicao: 'desfoque', rotulo: '05 · Página do lançamento', titulo: 'Do anúncio à conversa.' },
    { id: 'porque', tipo: 'cartoes', midiaFundo: 'lobby', tempos: 8, transicao: 'dissolve', rotulo: 'Por que funciona', cartoes: [
      { titulo: 'Imagem antes do tijolo', texto: 'O comprador vê o que vai ter.' },
      { titulo: 'Campanha pronta mais cedo', texto: 'Material para anúncio e corretor desde o início.' },
      { titulo: 'Uma identidade só', texto: 'Filme, imagens e página no mesmo tom.' },
    ] },
    { id: 'chamada', tipo: 'cta', midiaFundo: 'heroi', tempos: 8, transicao: 'desfoque', rotulo: 'Seu próximo lançamento', titulo: 'Comece pela imagem.', texto: 'Receba uma proposta sob medida.', botao: 'Quero minha proposta', dica: 'Demonstração · marca fictícia' },
  ] as Cena[],
};

export type Tema = typeof tema;
