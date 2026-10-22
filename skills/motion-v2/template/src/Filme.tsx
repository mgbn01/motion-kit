import React, { useEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender } from 'remotion';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { CenaPorTipo } from './cenas';
import { MarcaFixa } from './componentes/MarcaFixa';
import { cor, curvaSuave } from './estilo';
import { fontesCarregadas } from './fontes';
import { montarLinhaDoTempo } from './linhaDoTempo';
import { tema } from './tema';
import { apresentacao } from './transicoes';

/** Filme V2, mudo de propósito: o áudio fica com o agente de áudio (out/tempos.json). */
export const Filme: React.FC = () => {
  const linha = montarLinhaDoTempo(tema);
  const [espera] = useState(() => delayRender('Carregando fontes da marca'));
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    fontesCarregadas.then(() => {
      setPronto(true);
      continueRender(espera);
    });
  }, [espera]);
  if (!pronto || !linha.length) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: cor('tinta') }}>
      <TransitionSeries>
        {linha.map((c, i) => (
          <React.Fragment key={c.id}>
            {i > 0 && c.entradaQuadros > 0 ? (
              <TransitionSeries.Transition timing={linearTiming({ durationInFrames: c.entradaQuadros, easing: curvaSuave })} presentation={apresentacao(c.transicao)} />
            ) : null}
            <TransitionSeries.Sequence durationInFrames={c.sequenciaQuadros} name={c.id}>
              <CenaPorTipo cena={c} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      <MarcaFixa ultimoQuadro={linha[linha.length - 1].fimQuadro} />
    </AbsoluteFill>
  );
};
