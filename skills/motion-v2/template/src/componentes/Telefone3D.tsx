import React from 'react';
import { getStaticFiles, Img, interpolate, staticFile } from 'remotion';
import { cor, curvaSuave, estiloTexto } from '../estilo';
import { tema } from '../tema';

/**
 * Celular em 3D de verdade (transformações 3D do CSS, perspectiva real, sem WebGL):
 * corpo com espessura, tela rolando as mídias como uma landing page, reflexo que varre.
 */
export const Telefone3D: React.FC<{ f: number; dur: number; telas: string[]; largura: number; escala: number }> = ({ f, dur, telas, largura, escala }) => {
  const W = largura;
  const H = W * 2.05;
  const r = W * 0.14;
  const esp = W * 0.05;
  const giro = interpolate(f, [0, dur], [-22, -6], { extrapolateRight: 'clamp', easing: curvaSuave });
  const incl = interpolate(f, [0, dur], [10, 4], { extrapolateRight: 'clamp', easing: curvaSuave });
  const flutua = Math.sin(f / 18) * 10 * escala;
  const entra = interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp', easing: curvaSuave });
  const telaH = H - W * 0.08;
  const blocoH = telaH * 0.62;
  const rolagem = interpolate(f, [12, dur - 6], [0, (telas.length - 1) * (blocoH + 24 * escala)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: curvaSuave });
  const brilho = interpolate(f, [0, dur], [-60, 160], { extrapolateRight: 'clamp' });
  const existe = (k: string) => tema.midias[k] && getStaticFiles().some((s) => s.name === `midias/${tema.midias[k].arquivo}`);

  return (
    <div style={{ perspective: 2400 * escala, opacity: entra, transform: `translateY(${(1 - entra) * 80 * escala + flutua}px)` }}>
      <div style={{ position: 'relative', width: W, height: H, transformStyle: 'preserve-3d', transform: `rotateY(${giro}deg) rotateX(${incl}deg)` }}>
        {/* espessura: camadas atrás da frente */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: r, backgroundColor: i === 4 ? '#2a2b2e' : '#3a3c40', transform: `translateZ(${-(esp * i) / 4}px)` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, borderRadius: r, backgroundColor: '#0b0b0c', padding: W * 0.04, transform: 'translateZ(0.5px)', boxShadow: `0 ${40 * escala}px ${90 * escala}px rgba(0,0,0,0.5)` }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: r * 0.78, overflow: 'hidden', backgroundColor: cor('claro') }}>
            <div style={{ transform: `translateY(${-rolagem}px)`, padding: 16 * escala, display: 'flex', flexDirection: 'column', gap: 24 * escala }}>
              <div style={{ ...estiloTexto('cartaoTexto', escala * 0.7), color: cor('tinta'), fontWeight: 800 }}>{tema.marca.nome}</div>
              {telas.map((k) => (
                <div key={k} style={{ height: blocoH, borderRadius: 18 * escala, overflow: 'hidden', backgroundColor: cor('tinta') }}>
                  {existe(k) ? <Img src={staticFile(`midias/${tema.midias[k].arquivo}`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', left: '50%', top: 10 * escala, width: W * 0.28, height: W * 0.07, marginLeft: -W * 0.14, borderRadius: 99, backgroundColor: '#0b0b0c' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${brilho - 30}%, rgba(255,255,255,0.22) ${brilho}%, rgba(255,255,255,0) ${brilho + 18}%)` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
