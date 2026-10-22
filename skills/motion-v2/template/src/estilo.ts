import type React from 'react';
import { measureText } from '@remotion/layout-utils';
import { Easing, getInputProps, interpolate, useVideoConfig } from 'remotion';
import { quadrosPorTempo } from './linhaDoTempo';
import { tema, type FormatoId, type NomeCor } from './tema';

export const cor = (n: NomeCor) => tema.cores[n].hex;
export const corTexto = (fundo: NomeCor) => cor(tema.textoSobre[fundo]);
export const QPT = quadrosPorTempo(tema);

/** `npm run contraste` renderiza com semTexto para medir os pixels por baixo do texto. */
export const semTexto = () => Boolean((getInputProps() as { semTexto?: boolean }).semTexto);

export type Quadro = { largura: number; altura: number; formato: FormatoId; escala: number; vertical: boolean; mx: number; my: number };

export const useQuadro = (): Quadro => {
  const { width, height } = useVideoConfig();
  const formato =
    (Object.entries(tema.formatos).find(([, f]) => f.largura === width && f.altura === height)?.[0] as FormatoId) ??
    (width > height ? '16x9' : width < height ? '9x16' : '1x1');
  const m = tema.formatos[formato].margem;
  return { largura: width, altura: height, formato, escala: Math.min(width, height) / 1080, vertical: height > width, mx: Math.round(width * m.x), my: Math.round(height * m.y) };
};

/**
 * Zona do texto sobre mídia, em px. O componente de texto se desenha aqui e o
 * script de contraste mede exatamente esta área.
 */
export const zonaTexto = (q: Quadro, posicao: 'baixo' | 'topo' = 'baixo') => {
  const altura = q.vertical ? q.altura * 0.3 : q.altura * 0.42;
  const largura = q.vertical ? q.largura - 2 * q.mx : (q.largura - 2 * q.mx) * 0.6;
  // No topo, desce abaixo da marca fixa do canto para os dois não se baterem.
  const topo = q.my + (tema.marca.marcaFixa ? 96 * q.escala : 0);
  return { x: q.mx, y: posicao === 'baixo' ? q.altura - q.my - altura : topo, w: largura, h: altura };
};

type NomeEstilo = keyof typeof tema.tipografia.estilos;

export const estiloTexto = (nome: NomeEstilo, escala: number, extra?: React.CSSProperties): React.CSSProperties =>
  ({
    fontFamily: tema.tipografia.pilha,
    fontSize: Math.round(tema.tipografia.estilos[nome].tamanho * escala),
    fontWeight: tema.tipografia.estilos[nome].peso as React.CSSProperties['fontWeight'],
    lineHeight: tema.tipografia.estilos[nome].entrelinha,
    letterSpacing: `${tema.tipografia.estilos[nome].tracking}em`,
    margin: 0,
    textWrap: 'balance',
    ...extra,
  }) as React.CSSProperties;

/** Tamanho que faz a palavra mais longa caber na largura, medido com a fonte real. */
export const encaixar = (texto: string, largura: number, base: number, estilo: NomeEstilo) => {
  const e = tema.tipografia.estilos[estilo];
  const maior = Math.max(
    ...texto.split(/\s+/).filter(Boolean).map((p) => measureText({ text: p, fontFamily: tema.tipografia.familia, fontSize: base, fontWeight: e.peso, letterSpacing: `${e.tracking}em` }).width),
    1,
  );
  return maior * 1.03 > largura ? (base * largura) / (maior * 1.03) : base;
};

export const curva = Easing.bezier(0.16, 1, 0.3, 1);
export const curvaSuave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (f: number, de: number, ate: number, easing = curva) =>
  interpolate(f, [de, ate], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
