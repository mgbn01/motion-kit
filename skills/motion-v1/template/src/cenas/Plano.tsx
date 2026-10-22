import React from 'react';
import { AbsoluteFill, getStaticFiles, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { Revela } from '../componentes/Revela';
import { Texto } from '../componentes/Pendente';
import { cor, corTexto, estiloTexto, QPT, useQuadro } from '../estilo';
import { tema } from '../tema';
import type { PropsCena } from './tipos';

/**
 * Inserto gerado por IA em tela cheia. O vídeo começa junto com a transição de entrada
 * (o importar-plano já corta na duração exata). Texto só numa faixa sólida da marca,
 * para o contraste continuar calculável.
 */
export const Plano: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame() - cena.entradaQuadros;
  const q = useQuadro();
  const arquivo = `planos/${cena.id}-${q.formato}.mp4`;
  const existe = getStaticFiles().some((s) => s.name === arquivo);

  return (
    <AbsoluteFill style={{ backgroundColor: cor(cena.fundo) }}>
      {existe ? (
        <OffthreadVideo src={staticFile(arquivo)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Texto valor={`[PENDENTE] public/${arquivo}`} cor={corTexto(cena.fundo)} style={estiloTexto('corpo', q.escala)} />
        </AbsoluteFill>
      )}
      {/* A legenda começa depois do elemento recorrente, que funciona como marcador dela. */}
      {cena.legenda ? (
        <div style={{ position: 'absolute', left: Math.max(q.mx, cena.ancora.x * q.largura + tema.elemento.tamanho * q.escala * 1.2), bottom: q.my }}>
          <Revela f={f} inicio={QPT} duracao={14}>
            <div style={{ backgroundColor: cor(cena.fundo), padding: `${12 * q.escala}px ${22 * q.escala}px`, borderRadius: 10 * q.escala }}>
              <Texto valor={cena.legenda} cor={corTexto(cena.fundo)} style={estiloTexto('subtitulo', q.escala)} />
            </div>
          </Revela>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
