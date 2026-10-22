import type React from 'react';
import { measureText } from '@remotion/layout-utils';
import { Easing, interpolate, spring, useVideoConfig } from 'remotion';
import { quadrosPorTempo } from './linhaDoTempo';
import { tema, type FormatoId, type NomeCor } from './tema';

export const cor = (nome: NomeCor): string => tema.cores[nome].hex;
export const corTexto = (fundo: NomeCor): string => cor(tema.textoSobre[fundo]);
export const corAcento = (fundo: NomeCor): string => cor(tema.acentoSobre[fundo]);

/** Cor do elemento recorrente que nunca some no fundo: se colidir, usa a cor do texto. */
export const corElemento = (fundo: NomeCor): string =>
  tema.elemento.cor === fundo ? corTexto(fundo) : cor(tema.elemento.cor);

export const QPT = quadrosPorTempo(tema);

export type Quadro = {
  largura: number;
  altura: number;
  formato: FormatoId;
  /** Multiplicador de tamanho: lado curto / 1080. */
  escala: number;
  vertical: boolean;
  /** Margens de segurança em px. */
  mx: number;
  my: number;
};

export const useQuadro = (): Quadro => {
  const { width, height } = useVideoConfig();
  const formato =
    (Object.entries(tema.formatos).find(([, f]) => f.largura === width && f.altura === height)?.[0] as FormatoId) ??
    (width > height ? '16x9' : width < height ? '9x16' : '1x1');
  const m = tema.formatos[formato].margem;
  return {
    largura: width,
    altura: height,
    formato,
    escala: Math.min(width, height) / 1080,
    vertical: height > width,
    mx: Math.round(width * m.x),
    my: Math.round(height * m.y),
  };
};

type NomeEstilo = keyof typeof tema.tipografia.estilos;

export const estiloTexto = (nome: NomeEstilo, escala: number, extra?: React.CSSProperties): React.CSSProperties => {
  const e = tema.tipografia.estilos[nome];
  return {
    fontFamily: tema.tipografia.pilha,
    fontSize: Math.round(e.tamanho * escala),
    fontWeight: e.peso as React.CSSProperties['fontWeight'],
    lineHeight: e.entrelinha,
    letterSpacing: `${e.tracking}em`,
    margin: 0,
    fontFeatureSettings: '"kern" 1',
    // Linhas equilibradas: evita palavra sozinha na última linha.
    textWrap: 'balance',
    ...extra,
  } as React.CSSProperties;
};

/** Curva padrão do filme: sai rápido, assenta devagar. */
export const curva = Easing.bezier(0.16, 1, 0.3, 1);
export const curvaTransicao = Easing.bezier(0.65, 0, 0.35, 1);

/** Progresso 0→1 entre dois quadros locais, com a curva do filme. */
export const prog = (f: number, de: number, ate: number, easing = curva): number =>
  interpolate(f, [de, ate], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

/** Mola amarrada a um tempo musical: começa exatamente no tempo n da cena. */
export const molaNoTempo = (f: number, fps: number, tempo: number, amortecimento = 14): number =>
  spring({ frame: f - tempo * QPT, fps, config: { damping: amortecimento, mass: 0.6, stiffness: 140 } });

/**
 * Tamanho que faz a palavra mais longa do texto caber na largura dada, MEDINDO com a fonte
 * real (não estimando): vale para qualquer fonte de marca. Palavra não quebra, então sem
 * isso uma palavra longa invade a coluna vizinha. Só funciona depois que as fontes
 * carregaram, e o Filme garante isso antes de desenhar as cenas.
 */
export const encaixar = (texto: string, largura: number, tamanhoBase: number, estilo: NomeEstilo, inteiro = false): number => {
  const e = tema.tipografia.estilos[estilo];
  // inteiro: mede a linha toda. Sem isso "25 anos" vira duas palavras na medida (o \s do JS
  // tambem casa com o espaco nao separavel) e o numero vaza da coluna.
  const pedacos = inteiro ? [texto] : texto.split(/\s+/).filter(Boolean);
  const maior = Math.max(
    ...pedacos.map(
      (palavra) =>
        measureText({ text: palavra, fontFamily: tema.tipografia.familia, fontSize: tamanhoBase, fontWeight: e.peso, letterSpacing: `${e.tracking}em` }).width,
    ),
    1,
  );
  // 3% de folga para o kerning e o arredondamento do navegador.
  return maior * 1.03 > largura ? (tamanhoBase * largura) / (maior * 1.03) : tamanhoBase;
};

/** Pequeno soco de escala no começo de cada tempo (para os flashes). */
export const pulso = (f: number, intensidade = 0.04): number => {
  const dentro = ((f % QPT) + QPT) % QPT;
  return 1 + intensidade * Math.exp(-dentro / 3);
};
