import React from 'react';
import { AbsoluteFill, getStaticFiles, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { cor, curvaSuave, estiloTexto, useQuadro } from '../estilo';
import { tema, type Movimento, type NomeCor } from '../tema';

/**
 * Imagem ou vídeo em tela cheia com movimento de câmera. A mídia vem de tema.midias
 * (arquivo em public/midias/). Vídeo entra mudo: o áudio é do agente de áudio.
 */
export const Midia: React.FC<{
  chave: string;
  duracao: number;
  movimento?: Movimento;
  ajuste?: 'cobrir' | 'conter';
  fundo?: NomeCor;
  desfoque?: number;
  escurecer?: number;
}> = ({ chave, duracao, movimento = 'empurrao', ajuste = 'cobrir', fundo = 'tinta', desfoque = 0, escurecer = 0 }) => {
  const f = useCurrentFrame();
  const q = useQuadro();
  const m = tema.midias[chave];
  const caminho = m ? `midias/${m.arquivo}` : '';
  const existe = m && getStaticFiles().some((s) => s.name === caminho);
  const p = interpolate(f, [0, Math.max(1, duracao)], [0, 1], { extrapolateRight: 'clamp', easing: curvaSuave });

  const t = (() => {
    switch (movimento) {
      case 'empurrao': return `scale(${1.02 + 0.1 * p})`;
      case 'recuo': return `scale(${1.12 - 0.1 * p})`;
      case 'deslize-esq': return `scale(1.1) translateX(${3 - 6 * p}%)`;
      case 'deslize-dir': return `scale(1.1) translateX(${-3 + 6 * p}%)`;
      case 'subida': return `scale(1.1) translateY(${3 - 6 * p}%)`;
      default: return 'scale(1)';
    }
  })();

  const estilo: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: ajuste === 'cobrir' ? 'cover' : 'contain',
    transform: t,
    filter: desfoque ? `blur(${desfoque * q.escala}px)` : undefined,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor(fundo), overflow: 'hidden' }}>
      {!existe ? (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ ...estiloTexto('texto', q.escala), color: cor('papel'), textDecoration: 'underline dashed' }}>
            [PENDENTE] mídia "{chave}"
          </span>
        </AbsoluteFill>
      ) : /\.(mp4|webm|mov)$/i.test(m.arquivo) ? (
        <OffthreadVideo src={staticFile(caminho)} muted style={estilo} />
      ) : (
        <Img src={staticFile(caminho)} style={estilo} />
      )}
      {escurecer ? <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${escurecer})` }} /> : null}
    </AbsoluteFill>
  );
};
