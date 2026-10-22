import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { CenaPorTipo } from './cenas';
import { ElementoRecorrente } from './componentes/ElementoRecorrente';
import { cor, curvaTransicao, useQuadro } from './estilo';
import { montarLinhaDoTempo } from './linhaDoTempo';
import { tema } from './tema';
import { apresentacao } from './transicoes';
import { fontesCarregadas } from './fontes';

/**
 * Composição do filme. Sem áudio de propósito: o vídeo é renderizado mudo e o
 * áudio mixado entra depois com ffmpeg -c:v copy, sem renderizar de novo.
 */
export const Filme: React.FC = () => {
  const linha = montarLinhaDoTempo(tema);
  const q = useQuadro();
  // As cenas medem texto com a fonte real: só desenha depois que as fontes carregaram.
  const [espera] = useState(() => delayRender('Carregando fontes da marca'));
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    fontesCarregadas.then(() => {
      setPronto(true);
      continueRender(espera);
    });
  }, [espera]);
  if (!pronto) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: cor(linha[0].fundo) }}>
      <TransitionSeries>
        {linha.map((c, i) => (
          <React.Fragment key={c.id}>
            {i > 0 ? (
              <TransitionSeries.Transition
                timing={linearTiming({ durationInFrames: c.entradaQuadros, easing: curvaTransicao })}
                presentation={apresentacao(c, linha[i - 1], q.largura, q.altura)}
              />
            ) : null}
            <TransitionSeries.Sequence durationInFrames={c.sequenciaQuadros} name={c.id}>
              <CenaPorTipo cena={c} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <ElementoRecorrente linha={linha} />
    </AbsoluteFill>
  );
};
