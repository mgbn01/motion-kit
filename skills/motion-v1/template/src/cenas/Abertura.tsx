import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { LetrasEmOnda, Revela } from '../componentes/Revela';
import { Texto } from '../componentes/Pendente';
import { cor, corElemento, corTexto, curva, encaixar, estiloTexto, QPT, useQuadro } from '../estilo';
import { tema } from '../tema';
import type { PropsCena } from './tipos';

/** Abertura: o elemento nasce, solta um anel, o nome sobe letra a letra e a promessa entra. */
export const Abertura: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame() - cena.entradaQuadros;
  const q = useQuadro();
  const texto = corTexto(cena.fundo);

  const anel = interpolate(f, [QPT, QPT * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: curva });
  const raioMax = Math.hypot(q.largura, q.altura) / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: cor(cena.fundo) }}>
      <div
        style={{
          position: 'absolute',
          left: q.largura / 2 - raioMax * anel,
          top: q.altura / 2 - raioMax * anel,
          width: raioMax * 2 * anel,
          height: raioMax * 2 * anel,
          borderRadius: '50%',
          border: `${Math.max(2, 3 * q.escala)}px solid ${corElemento(cena.fundo)}`,
          opacity: 1 - anel,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: `${q.my}px ${q.mx}px`,
          gap: 28 * q.escala,
          textAlign: 'center',
        }}
      >
        <LetrasEmOnda texto={tema.marca.nome} f={f} inicio={QPT * 2} style={{ ...estiloTexto('display', q.escala), fontSize: Math.round(encaixar(tema.marca.nome, q.largura - 2 * q.mx, tema.tipografia.estilos.display.tamanho * q.escala, 'display', true)), color: texto }} />
        <div style={{ maxWidth: q.vertical ? '100%' : '62%' }}>
          <Revela f={f} inicio={QPT * 5} duracao={18}>
            <Texto valor={tema.marca.promessa} cor={texto} style={estiloTexto('subtitulo', q.escala, { whiteSpace: 'pre-line' })} />
          </Revela>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
