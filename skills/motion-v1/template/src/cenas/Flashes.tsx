import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { cor, corTexto, encaixar, estiloTexto, pulso, QPT, useQuadro } from '../estilo';
import { tema } from '../tema';
import type { PropsCena } from './tipos';

/** Uma palavra por serviço, uma por segundo, cada uma com um fundo da marca. Cortes secos no tempo. */
export const Flashes: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame() - cena.entradaQuadros;
  const { fps } = useVideoConfig();
  const q = useQuadro();
  const porPalavra = tema.flashes.temposPorPalavra * QPT;
  const total = tema.servicos.length;
  const i = Math.min(total - 1, Math.max(0, Math.floor(f / porPalavra)));
  const local = f - i * porPalavra;
  const fundo = tema.flashes.fundos[i % tema.flashes.fundos.length];
  const palavra = tema.servicos[i].palavra;

  // Encaixa a palavra na largura útil, medida com a fonte real. Desconta o soco de escala (1,14).
  const larguraUtil = (q.largura - 2 * q.mx) / 1.14;
  const tamanho = encaixar(palavra, larguraUtil, tema.tipografia.estilos.display.tamanho * q.escala, 'display');

  const entrada = spring({ frame: Math.max(0, local), fps, config: { damping: 13, mass: 0.5, stiffness: 180 } });
  const escala = (1.14 - 0.14 * entrada) * pulso(local, 0.025);

  return (
    <AbsoluteFill style={{ backgroundColor: cor(fundo), justifyContent: 'center', alignItems: 'center' }}>
      <h1
        style={{
          ...estiloTexto('display', q.escala),
          fontSize: Math.round(tamanho),
          color: corTexto(fundo),
          transform: `scale(${escala})`,
          whiteSpace: 'nowrap',
        }}
      >
        {palavra}
      </h1>
    </AbsoluteFill>
  );
};
