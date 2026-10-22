import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Revela } from '../componentes/Revela';
import { Texto } from '../componentes/Pendente';
import { cor, corElemento, corTexto, curvaTransicao, estiloTexto, QPT, useQuadro } from '../estilo';
import { tema } from '../tema';
import type { PropsCena } from './tipos';

/** Fechamento: o elemento se abre num anel, o logo aparece de dentro dele e o filme termina no tempo forte. */
export const Fechamento: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame() - cena.entradaQuadros;
  const { fps } = useVideoConfig();
  const q = useQuadro();
  const texto = corTexto(cena.fundo);
  const lado = Math.min(q.largura, q.altura);

  const abre = interpolate(f, [0, QPT * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: curvaTransicao });
  // Logo horizontal (proporcao > 1,5): largura pelo lado curto, altura pela proporcao do arquivo.
  const proporcao = (tema.marca as { logoProporcao?: number }).logoProporcao ?? 1;
  const largo = proporcao > 1.5;
  const logoL = largo ? Math.min(q.largura - 2 * q.mx, lado * 0.9) : lado * 0.3;
  const logoA = largo ? logoL / proporcao : logoL;
  const raioLogo = largo ? (logoL / 2) * 1.08 * abre : logoL * 0.75 * abre;

  // Último tempo do filme: o ponto final bate junto com a batida final da trilha.
  const ultimoTempo = (cena.tempos - 1) * QPT;
  const batida = spring({ frame: f - ultimoTempo, fps, config: { damping: 9, mass: 0.4, stiffness: 220 } });
  const ponto = tema.elemento.tamanho * q.escala * interpolate(f, [QPT * 6, QPT * 7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * (1 + 0.5 * batida * (f >= ultimoTempo ? 1 : 0) * Math.exp(-(f - ultimoTempo) / 6));

  // O logo fica exatamente no centro, onde o elemento recorrente está: ele se abre ali.
  return (
    <AbsoluteFill style={{ backgroundColor: cor(cena.fundo) }}>
      <div style={{ position: 'absolute', left: q.largura / 2 - logoL / 2, top: q.altura / 2 - logoA / 2, width: logoL, height: logoA }}>
        <div
          style={{
            position: 'absolute',
            left: logoL / 2 - raioLogo,
            top: logoA / 2 - raioLogo,
            width: raioLogo * 2,
            height: raioLogo * 2,
            borderRadius: '50%',
            border: `${Math.max(2, 4 * q.escala)}px solid ${corElemento(cena.fundo)}`,
            opacity: interpolate(abre, [0.6, 1], [1, 0], { extrapolateLeft: 'clamp' }),
          }}
        />
        <Img
          src={staticFile(tema.marca.logo)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', clipPath: `circle(${(abre * 75).toFixed(2)}% at 50% 50%)` }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: q.mx,
          right: q.mx,
          top: q.altura / 2 + logoA / 2 + 40 * q.escala,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18 * q.escala,
          textAlign: 'center',
        }}
      >
        <Revela f={f} inicio={QPT * 3} duracao={16}>
          <span style={{ ...estiloTexto('subtitulo', q.escala), display: 'block', maxWidth: '100%' }}>
            <Texto valor={tema.marca.assinatura} cor={texto} />
            <span
              style={{
                display: 'inline-block',
                width: ponto,
                height: ponto,
                marginLeft: 12 * q.escala,
                borderRadius: tema.elemento.forma === 'circulo' ? '50%' : ponto * 0.18,
                backgroundColor: corElemento(cena.fundo),
                verticalAlign: 'baseline',
              }}
            />
          </span>
        </Revela>
        <Revela f={f} inicio={QPT * 5} duracao={16}>
          <Texto valor={tema.marca.site} cor={texto} style={estiloTexto('corpo', q.escala)} />
        </Revela>
      </div>
    </AbsoluteFill>
  );
};
