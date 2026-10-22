import React from 'react';
import { AbsoluteFill } from 'remotion';
import { slide } from '@remotion/transitions/slide';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import type { TipoTransicao } from '../tema';

type Vazio = Record<string, never>;

/** Fusão com um leve brilho na cena que entra. */
const Dissolve: React.FC<TransitionPresentationComponentProps<Vazio>> = ({ children, presentationDirection, presentationProgress: p }) =>
  presentationDirection === 'exiting' ? (
    <AbsoluteFill>{children}</AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ opacity: p, filter: `brightness(${1 + 0.18 * (1 - p)})` }}>{children}</AbsoluteFill>
  );

/** A cena sai desfocando; a próxima entra focando. */
const Desfoque: React.FC<TransitionPresentationComponentProps<Vazio>> = ({ children, presentationDirection, presentationProgress: p }) =>
  presentationDirection === 'exiting' ? (
    <AbsoluteFill style={{ filter: `blur(${p * 28}px)`, transform: `scale(${1 + 0.04 * p})` }}>{children}</AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ opacity: Math.min(1, p * 1.6), filter: `blur(${(1 - p) * 28}px)` }}>{children}</AbsoluteFill>
  );

/** Clarão branco de câmera: estoura no meio e revela a cena nova. */
const Clarao: React.FC<TransitionPresentationComponentProps<Vazio>> = ({ children, presentationDirection, presentationProgress: p }) =>
  presentationDirection === 'exiting' ? (
    <AbsoluteFill>{children}</AbsoluteFill>
  ) : (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p < 0.5 ? 0 : 1 }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: '#fff', opacity: Math.sin(Math.PI * p) * 0.92 }} />
    </AbsoluteFill>
  );

const fazer = (c: React.FC<TransitionPresentationComponentProps<Vazio>>): TransitionPresentation<Vazio> => ({ component: c, props: {} });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apresentacao = (t: TipoTransicao): TransitionPresentation<any> => {
  switch (t) {
    case 'dissolve': return fazer(Dissolve);
    case 'desfoque': return fazer(Desfoque);
    case 'clarao': return fazer(Clarao);
    case 'empurrar': return slide({ direction: 'from-bottom' });
    case 'corte': return fazer(Dissolve); // não usado: corte seco não cria transição
  }
};
