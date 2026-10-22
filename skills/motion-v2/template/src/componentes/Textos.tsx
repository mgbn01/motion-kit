import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { cor, corTexto, curva, encaixar, estiloTexto, semTexto, useQuadro, zonaTexto } from '../estilo';
import { ehPendente } from '../linhaDoTempo';
import { tema, type NomeCor } from '../tema';

/** Linha que entra do desfocado para o nítido, subindo um pouco. */
export const EntraFocando: React.FC<{ f: number; inicio: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, inicio, children, style }) => {
  const p = interpolate(f, [inicio, inicio + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: curva });
  return (
    <div style={{ opacity: p, filter: `blur(${(1 - p) * 14}px)`, transform: `translateY(${(1 - p) * 26}px)`, ...style }}>{children}</div>
  );
};

const pend = (s?: string): React.CSSProperties => (s && ehPendente(s) ? { textDecoration: 'underline dashed' } : {});

/**
 * Rótulo + título + texto. `sobre="midia"`: texto papel com degradê escuro por baixo
 * (o degradê faz parte do fundo e é medido pelo `npm run contraste`). `sobre=<cor>`:
 * fundo chapado, cor do texto do tema.
 */
export const BlocoTexto: React.FC<{
  f: number;
  rotulo?: string;
  titulo?: string;
  texto?: string;
  posicao?: 'baixo' | 'topo';
  sobre?: 'midia' | NomeCor;
  inicio?: number;
}> = ({ f, rotulo, titulo, texto, posicao = 'baixo', sobre = 'midia', inicio = 0 }) => {
  const q = useQuadro();
  const z = zonaTexto(q, posicao);
  const corT = sobre === 'midia' ? cor('papel') : corTexto(sobre);
  const tamTitulo = titulo ? encaixar(titulo, z.w, tema.tipografia.estilos.titulo.tamanho * q.escala, 'titulo') : 0;
  const esconder = semTexto();
  return (
    <AbsoluteFill>
      {sobre === 'midia' ? (
        <AbsoluteFill
          style={{
            background:
              posicao === 'baixo'
                ? 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.62) 34%, rgba(0,0,0,0) 64%)'
                : 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0) 55%)',
          }}
        />
      ) : null}
      {esconder ? null : (
        <div
          style={{
            position: 'absolute',
            left: z.x,
            top: z.y,
            width: z.w,
            height: z.h,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: posicao === 'baixo' ? 'flex-end' : 'flex-start',
            gap: 18 * q.escala,
            color: corT,
          }}
        >
          {rotulo ? (
            <EntraFocando f={f} inicio={inicio}>
              <p style={{ ...estiloTexto('rotulo', q.escala), ...pend(rotulo) }}>{rotulo}</p>
            </EntraFocando>
          ) : null}
          {titulo ? (
            <EntraFocando f={f} inicio={inicio + 4}>
              <h1 style={{ ...estiloTexto('titulo', q.escala, { fontSize: Math.round(tamTitulo) }), ...pend(titulo) }}>{titulo}</h1>
            </EntraFocando>
          ) : null}
          {texto ? (
            <EntraFocando f={f} inicio={inicio + 10}>
              <p style={{ ...estiloTexto('texto', q.escala), ...pend(texto) }}>{texto}</p>
            </EntraFocando>
          ) : null}
        </div>
      )}
    </AbsoluteFill>
  );
};
