import React from 'react';
import { interpolate, spring } from 'remotion';
import { cor, curvaSuave } from '../estilo';

/** Caixa 3D em CSS: seis faces com sombreamento por lado. Origem no centro. */
const Caixa: React.FC<{ w: number; h: number; d: number; frente: string; lado: string; topo: string; style?: React.CSSProperties }> = ({ w, h, d, frente, lado, topo, style }) => {
  const face = (largura: number, altura: number, fundo: string, transform: string): React.CSSProperties => ({
    position: 'absolute', left: -largura / 2, top: -altura / 2, width: largura, height: altura, backgroundColor: fundo, transform, backfaceVisibility: 'hidden',
  });
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', ...style }}>
      <div style={face(w, h, frente, `translateZ(${d / 2}px)`)} />
      <div style={face(w, h, frente, `rotateY(180deg) translateZ(${d / 2}px)`)} />
      <div style={face(d, h, lado, `rotateY(90deg) translateZ(${w / 2}px)`)} />
      <div style={face(d, h, lado, `rotateY(-90deg) translateZ(${w / 2}px)`)} />
      <div style={face(w, d, topo, `rotateX(90deg) translateZ(${h / 2}px)`)} />
      <div style={face(w, d, topo, `rotateX(-90deg) translateZ(${h / 2}px)`)} />
    </div>
  );
};

/**
 * Volumetria de um prédio subindo andar por andar, com a câmera orbitando.
 * Laje (cor primária) + pano de vidro (acento translúcido). Tudo em 3D de CSS.
 */
export const Predio3D: React.FC<{ f: number; fps: number; dur: number; andares: number; escala: number }> = ({ f, fps, dur, andares, escala }) => {
  const W = 300 * escala;
  const D = 220 * escala;
  const hAndar = 46 * escala;
  const orbita = interpolate(f, [0, dur], [-38, 22], { easing: curvaSuave, extrapolateRight: 'clamp' });
  const passo = Math.max(2, Math.floor((dur * 0.55) / andares));
  return (
    <div style={{ perspective: 2600 * escala, width: W * 2.4, height: hAndar * andares * 1.25 + 260 * escala, position: 'relative' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: 140 * escala, transformStyle: 'preserve-3d', transform: `rotateX(-24deg) rotateY(${orbita}deg)` }}>
        {/* terreno */}
        <div style={{ position: 'absolute', left: -W * 1.1, top: -D * 1.1, width: W * 2.2, height: D * 2.2, transform: 'rotateX(90deg)', background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0 2px, transparent 2px ${40 * escala}px), repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 2px, transparent 2px ${40 * escala}px), ${cor('claro')}`, border: `2px solid rgba(0,0,0,0.12)` }} />
        {Array.from({ length: andares }).map((_, i) => {
          const s = spring({ frame: f - 6 - i * passo, fps, config: { damping: 15, mass: 0.6, stiffness: 120 } });
          if (s <= 0.001) return null;
          const y = -(i * hAndar + hAndar / 2) - (1 - s) * 120 * escala;
          const ultimo = i === andares - 1;
          return (
            <div key={i} style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translateY(${y}px)`, opacity: Math.min(1, s * 1.4) }}>
              <Caixa w={W} h={hAndar * 0.22} d={D} frente={cor('primaria')} lado="#163024" topo={ultimo ? cor('acento') : '#2b4d3d'} style={{ transform: `translateY(${hAndar * 0.39}px)` }} />
              <Caixa w={W * 0.94} h={hAndar * 0.78} d={D * 0.92} frente="rgba(232,201,160,0.55)" lado="rgba(190,160,120,0.6)" topo="rgba(232,201,160,0.4)" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
