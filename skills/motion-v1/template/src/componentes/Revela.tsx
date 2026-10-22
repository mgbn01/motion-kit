import React from 'react';
import { interpolate } from 'remotion';
import { curva } from '../estilo';

/**
 * Revela um bloco de texto subindo por trás de uma máscara.
 * `f` é o quadro local da cena; `inicio` é o quadro em que a revelação começa.
 */
export const Revela: React.FC<{
  f: number;
  inicio: number;
  duracao?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ f, inicio, duracao = 14, style, children }) => {
  const p = interpolate(f, [inicio, inicio + duracao], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: curva,
  });
  return (
    // padding/margin negativos dão folga para acentos e descendentes não serem cortados pela máscara.
    // A folga é em px, não em em: esta caixa não tem o tamanho da letra do texto, então 0,12em virava
    // ~2 px e cortava a perna do g/p/q/ç dos títulos. 40 px cobre o descendente do maior título; o
    // texto parte 48 px abaixo da própria base para continuar escondido dentro da folga.
    <div style={{ overflow: 'hidden', paddingBottom: 40, marginBottom: -40, paddingTop: 22, marginTop: -22 }}>
      <div style={{ transform: `translateY(calc(${(1 - p) * 100}% + ${(1 - p) * 48}px))`, opacity: p > 0 ? 1 : 0, ...style }}>{children}</div>
    </div>
  );
};

/** Letras que sobem uma a uma, para o nome da marca. */
export const LetrasEmOnda: React.FC<{
  texto: string;
  f: number;
  inicio: number;
  intervalo?: number;
  style?: React.CSSProperties;
}> = ({ texto, f, inicio, intervalo = 2, style }) => (
  <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', paddingBottom: '0.14em', paddingTop: '0.14em', ...style }}>
    {Array.from(texto).map((letra, i) => {
      const p = interpolate(f, [inicio + i * intervalo, inicio + i * intervalo + 16], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: curva,
      });
      return (
        <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${(1 - p) * 105}%)` }}>
          {letra}
        </span>
      );
    })}
  </div>
);
