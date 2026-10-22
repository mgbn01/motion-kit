import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

/** Uma janela arredondada abre no centro e a câmera atravessa por ela. */
type PortalProps = { largura: number; altura: number };

const Portal: React.FC<TransitionPresentationComponentProps<PortalProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const { largura, altura } = passedProps;
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{ transform: `scale(${1 + 0.18 * p})` }}>
        {children}
        <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${0.35 * p})` }} />
      </AbsoluteFill>
    );
  }
  const curto = Math.min(largura, altura);
  // Começa como uma janela de 22% do lado curto, termina em tela cheia.
  const meiaLarg = interpolate(p, [0, 1], [curto * 0.11, largura / 2]);
  const meiaAlt = interpolate(p, [0, 1], [curto * 0.11, altura / 2]);
  const topo = altura / 2 - meiaAlt;
  const lado = largura / 2 - meiaLarg;
  const raio = interpolate(p, [0, 0.85, 1], [curto * 0.11, curto * 0.05, 0]);
  return (
    <AbsoluteFill
      style={{
        clipPath: `inset(${topo.toFixed(1)}px ${lado.toFixed(1)}px round ${raio.toFixed(1)}px)`,
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${interpolate(p, [0, 1], [1.35, 1])})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const portal = (props: PortalProps): TransitionPresentation<PortalProps> => ({ component: Portal, props });
