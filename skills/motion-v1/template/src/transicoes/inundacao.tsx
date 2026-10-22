import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

/**
 * Duas ondas de cor sobem de baixo para cima. A segunda carrega a cena nova:
 * por baixo da borda dela, a cena seguinte já aparece.
 */
type InundacaoProps = { cor1: string; cor2: string; altura: number };

const Inundacao: React.FC<TransitionPresentationComponentProps<InundacaoProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { cor1, cor2, altura } = passedProps;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{ transform: `translateY(${(-0.06 * p * altura).toFixed(1)}px)` }}>{children}</AbsoluteFill>;
  }
  // Borda superior de cada onda, em px a partir do topo. Começa abaixo da tela, termina acima.
  const topo1 = interpolate(p, [0, 0.55], [altura, 0], { extrapolateRight: 'clamp' });
  const base1 = interpolate(p, [0.35, 0.9], [altura, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const topo2 = interpolate(p, [0.15, 0.7], [altura, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const base2 = interpolate(p, [0.5, 1], [altura, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      {/* A cena nova só aparece abaixo da base da segunda onda. */}
      <AbsoluteFill style={{ clipPath: `inset(${base2.toFixed(1)}px 0 0 0)` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${topo1.toFixed(1)}px 0 ${(altura - base1).toFixed(1)}px 0)`, backgroundColor: cor1 }} />
      <AbsoluteFill style={{ clipPath: `inset(${topo2.toFixed(1)}px 0 ${(altura - base2).toFixed(1)}px 0)`, backgroundColor: cor2 }} />
    </AbsoluteFill>
  );
};

export const inundacao = (props: InundacaoProps): TransitionPresentation<InundacaoProps> => ({
  component: Inundacao,
  props,
});
