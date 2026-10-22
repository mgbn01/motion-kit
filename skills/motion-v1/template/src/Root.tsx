import React from 'react';
import { Composition } from 'remotion';
import { Filme } from './Filme';
import { duracaoTotalQuadros } from './linhaDoTempo';
import { tema, type FormatoId } from './tema';

/** Uma composição por formato: Filme-16x9, Filme-9x16, Filme-1x1. */
export const Root: React.FC = () => (
  <>
    {(Object.keys(tema.formatos) as FormatoId[]).map((id) => (
      <Composition
        key={id}
        id={`Filme-${id}`}
        component={Filme}
        durationInFrames={duracaoTotalQuadros(tema)}
        fps={tema.fps}
        width={tema.formatos[id].largura}
        height={tema.formatos[id].altura}
      />
    ))}
  </>
);
