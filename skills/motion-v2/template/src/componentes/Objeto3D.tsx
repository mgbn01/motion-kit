import React from 'react';
import { getStaticFiles, Img, interpolate, spring, staticFile } from 'remotion';
import { cor, curvaSuave } from '../estilo';
import { tema, type NomeCor } from '../tema';
import { Predio3D } from './Predio3D';

/**
 * Objeto 3D configurável, em transformações 3D do CSS (perspectiva real, sem WebGL):
 *  caixa     → embalagem girando, imagem na frente e no verso
 *  cilindro  → frasco/lata/pote, a imagem envolve o corpo como um rótulo
 *  logo      → o logo da marca extrudado, com espessura
 *  montagem  → peças que chegam separadas e se encaixam num bloco
 *  predio    → volumetria de um prédio subindo andar por andar
 * Sombreamento muda com o ângulo de cada face, então o objeto "pega luz" enquanto gira.
 */
export type Forma3D = 'caixa' | 'cilindro' | 'logo' | 'montagem' | 'predio';

type Props = {
  f: number;
  fps: number;
  dur: number;
  escala: number;
  forma: Forma3D;
  textura?: string;
  texturaVerso?: string;
  corCorpo?: NomeCor;
  corDetalhe?: NomeCor;
  tamanho?: { w: number; h: number; d: number };
  giro?: 'volta' | 'oscilar';
  pecas?: number;
};

const rad = (g: number) => (g * Math.PI) / 180;
/** 0 quando a face olha para a câmera, até 0,62 quando vira de costas. */
const sombra = (angulo: number) => 0.31 * (1 - Math.cos(rad(angulo)));

const urlMidia = (k?: string) => {
  if (!k || !tema.midias[k]) return undefined;
  const nome = `midias/${tema.midias[k].arquivo}`;
  return getStaticFiles().some((s) => s.name === nome) && !/\.(mp4|webm|mov)$/i.test(nome) ? staticFile(nome) : undefined;
};

const Face: React.FC<{ w: number; h: number; transform: string; fundo: string; img?: string; escuro: number }> = ({ w, h, transform, fundo, img, escuro }) => (
  <div style={{ position: 'absolute', left: -w / 2, top: -h / 2, width: w, height: h, transform, backfaceVisibility: 'hidden', backgroundColor: fundo, overflow: 'hidden' }}>
    {img ? <Img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
    <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${escuro})` }} />
  </div>
);

/** Caixa com seis faces; `giro` em graus para calcular a luz de cada face. */
const Caixa: React.FC<{ w: number; h: number; d: number; giro: number; corpo: string; topo: string; frente?: string; verso?: string; y?: number }> = ({ w, h, d, giro, corpo, topo, frente, verso, y = 0 }) => (
  <div style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translateY(${y}px)` }}>
    <Face w={w} h={h} fundo={corpo} img={frente} escuro={sombra(giro)} transform={`translateZ(${d / 2}px)`} />
    <Face w={w} h={h} fundo={corpo} img={verso ?? frente} escuro={sombra(giro + 180)} transform={`rotateY(180deg) translateZ(${d / 2}px)`} />
    <Face w={d} h={h} fundo={corpo} escuro={sombra(giro + 90) + 0.08} transform={`rotateY(90deg) translateZ(${w / 2}px)`} />
    <Face w={d} h={h} fundo={corpo} escuro={sombra(giro - 90) + 0.08} transform={`rotateY(-90deg) translateZ(${w / 2}px)`} />
    <Face w={w} h={d} fundo={topo} escuro={0.04} transform={`rotateX(90deg) translateZ(${h / 2}px)`} />
    <Face w={w} h={d} fundo={corpo} escuro={0.5} transform={`rotateX(-90deg) translateZ(${h / 2}px)`} />
  </div>
);

/** Cilindro em 48 fatias; a textura é recortada fatia a fatia para envolver o corpo. */
const Cilindro: React.FC<{ r: number; h: number; giro: number; corpo: string; tampa: string; rotulo?: string }> = ({ r, h, giro, corpo, tampa, rotulo }) => {
  const N = 48;
  const larg = 2 * r * Math.tan(Math.PI / N) + 1;
  const total = larg * N;
  return (
    <div style={{ position: 'absolute', transformStyle: 'preserve-3d' }}>
      {Array.from({ length: N }).map((_, i) => {
        const a = (i * 360) / N;
        return (
          <div key={i} style={{ position: 'absolute', left: -larg / 2, top: -h / 2, width: larg, height: h, transform: `rotateY(${a}deg) translateZ(${r}px)`, backfaceVisibility: 'hidden', overflow: 'hidden', backgroundColor: corpo }}>
            {rotulo ? <Img src={rotulo} style={{ position: 'absolute', left: -i * larg, top: 0, width: total, height: h, objectFit: 'cover', maxWidth: 'none' }} /> : null}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${sombra(a + giro)})` }} />
          </div>
        );
      })}
      {[1, -1].map((s) => (
        <div key={s} style={{ position: 'absolute', left: -r, top: -r, width: 2 * r, height: 2 * r, borderRadius: '50%', backgroundColor: s > 0 ? tampa : corpo, transform: `rotateX(${s * 90}deg) translateZ(${h / 2}px)` }} />
      ))}
    </div>
  );
};

/** Logo extrudado: cópias empilhadas em profundidade, as de trás escurecidas. */
const LogoVolume: React.FC<{ tam: number; prof: number }> = ({ tam, prof }) => {
  const L = 22;
  return (
    <div style={{ position: 'absolute', transformStyle: 'preserve-3d' }}>
      {Array.from({ length: L }).map((_, k) => (
        <Img key={k} src={staticFile(tema.marca.logo)} style={{ position: 'absolute', left: -tam / 2, top: -tam / 2, width: tam, height: tam, objectFit: 'contain', transform: `translateZ(${-(k * prof) / L}px)`, filter: k === 0 ? undefined : `brightness(${0.55 - 0.25 * (k / L)})` }} />
      ))}
    </div>
  );
};

export const Objeto3D: React.FC<Props> = ({ f, fps, dur, escala, forma, textura, texturaVerso, corCorpo = 'primaria', corDetalhe = 'acento', tamanho, giro = 'oscilar', pecas = 5 }) => {
  if (forma === 'predio') return <Predio3D f={f} fps={fps} dur={dur} andares={pecas} escala={escala} />;
  const ang = giro === 'volta' ? interpolate(f, [0, dur], [-30, 330], { extrapolateRight: 'clamp' }) : interpolate(f, [0, dur], [-38, 26], { easing: curvaSuave, extrapolateRight: 'clamp' });
  const entra = spring({ frame: f, fps, config: { damping: 14, mass: 0.7, stiffness: 110 } });
  const flutua = Math.sin(f / 20) * 12 * escala;
  const t = tamanho ?? (forma === 'cilindro' ? { w: 300, h: 520, d: 300 } : forma === 'logo' ? { w: 420, h: 420, d: 70 } : forma === 'montagem' ? { w: 380, h: 300, d: 280 } : { w: 360, h: 480, d: 150 });
  const [w, h, d] = [t.w * escala, t.h * escala, t.d * escala];
  const corpo = cor(corCorpo);
  const det = cor(corDetalhe);

  let objeto: React.ReactNode = null;
  if (forma === 'caixa') objeto = <Caixa w={w} h={h} d={d} giro={ang} corpo={corpo} topo={det} frente={urlMidia(textura)} verso={urlMidia(texturaVerso)} />;
  if (forma === 'cilindro') objeto = <Cilindro r={w / 2} h={h} giro={ang} corpo={corpo} tampa={det} rotulo={urlMidia(textura)} />;
  if (forma === 'logo') objeto = <LogoVolume tam={w} prof={d} />;
  if (forma === 'montagem') {
    const n = Math.max(2, pecas);
    const hp = h / n;
    objeto = (
      <div style={{ position: 'absolute', transformStyle: 'preserve-3d' }}>
        {Array.from({ length: n }).map((_, i) => {
          // a peça de baixo chega primeiro; cada uma cai de cima, girada, e assenta sobre a anterior
          const ordem = n - 1 - i;
          const s = spring({ frame: f - 4 - ordem * Math.max(3, Math.floor((dur * 0.45) / n)), fps, config: { damping: 15, mass: 0.6, stiffness: 120 } });
          const y = -h / 2 + hp * (i + 0.5);
          const separa = -(1 - s) * (260 + ordem * 30) * escala;
          return (
            <div key={i} style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translateY(${y + separa}px) rotateY(${(1 - s) * (i % 2 ? 40 : -40)}deg)`, opacity: Math.min(1, s * 1.5) }}>
              <Caixa w={w * (i === 0 ? 0.86 : 1)} h={hp * 0.94} d={d * (i === 0 ? 0.86 : 1)} giro={ang} corpo={i % 2 ? det : corpo} topo={i === 0 ? det : corpo} frente={i === n - 1 ? urlMidia(textura) : undefined} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: Math.max(w, h) * 1.8, height: h * 1.7, perspective: 2400 * escala, opacity: Math.min(1, entra * 1.3) }}>
      {/* sombra de contato no chão */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: w * 1.4, height: w * 0.32, marginLeft: -w * 0.7, marginTop: h * 0.62, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.32), rgba(0,0,0,0))', transform: `scale(${1 - flutua / (220 * escala)})` }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d', transform: `translateY(${flutua}px) scale(${0.85 + 0.15 * entra}) rotateX(-12deg) rotateY(${ang}deg)` }}>{objeto}</div>
    </div>
  );
};
