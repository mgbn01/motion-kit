import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

/** Círculo que cresce a partir de um ponto (o elemento recorrente) e revela a cena nova. */
type MascaraProps = { x: number; y: number; largura: number; altura: number };

const Mascara: React.FC<TransitionPresentationComponentProps<MascaraProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const { x, y, largura, altura } = passedProps;
  const cx = x * largura;
  const cy = y * altura;
  // Raio até o canto mais distante: no fim, cobre a tela inteira.
  const raioMax = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(largura - cx, cy),
    Math.hypot(cx, altura - cy),
    Math.hypot(largura - cx, altura - cy),
  );
  if (presentationDirection === 'exiting') {
    const escala = 1 + 0.04 * presentationProgress;
    return <AbsoluteFill style={{ transform: `scale(${escala})` }}>{children}</AbsoluteFill>;
  }
  const raio = raioMax * presentationProgress;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${raio.toFixed(1)}px at ${cx}px ${cy}px)` }}>{children}</AbsoluteFill>
  );
};

export const mascara = (props: MascaraProps): TransitionPresentation<MascaraProps> => ({ component: Mascara, props });
