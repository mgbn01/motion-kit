import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { BlocoTexto, EntraFocando } from '../componentes/Textos';
import { Midia } from '../componentes/Midia';
import { Objeto3D } from '../componentes/Objeto3D';
import { Telefone3D } from '../componentes/Telefone3D';
import { Vidro } from '../componentes/Vidro';
import { cor, corTexto, curva, estiloTexto, prog, QPT, semTexto, useQuadro } from '../estilo';
import type { CenaNaLinha } from '../linhaDoTempo';

type P<T extends CenaNaLinha['tipo']> = { cena: Extract<CenaNaLinha, { tipo: T }> };

/** Quadro local: 0 = momento em que a cena aterrissa no tempo (fim da transição de entrada). */
const useLocal = (c: CenaNaLinha) => useCurrentFrame() - c.entradaQuadros;

const CenaMidia: React.FC<P<'midia'>> = ({ cena }) => {
  const f = useLocal(cena);
  const q = useQuadro();
  const conter = cena.ajuste === 'conter';
  return (
    <AbsoluteFill>
      {conter ? (
        <AbsoluteFill style={{ backgroundColor: cor(cena.fundo ?? 'claro') }}>
          <div style={{ position: 'absolute', left: q.mx, right: q.mx, top: q.my + q.altura * 0.16, bottom: q.my }}>
            <Midia chave={cena.midia} duracao={cena.sequenciaQuadros} movimento={cena.movimento} ajuste="conter" fundo={cena.fundo ?? 'claro'} />
          </div>
        </AbsoluteFill>
      ) : (
        <Midia chave={cena.midia} duracao={cena.sequenciaQuadros} movimento={cena.movimento} escurecer={cena.escurecer} />
      )}
      <BlocoTexto f={f} rotulo={cena.rotulo} titulo={cena.titulo} texto={cena.texto} posicao={conter ? 'topo' : cena.posicao} sobre={conter ? cena.fundo ?? 'claro' : 'midia'} />
    </AbsoluteFill>
  );
};

/** Mira de câmera: cantos que fecham sobre o alvo, o resto escurece, selo embaixo. */
const CenaMira: React.FC<P<'mira'>> = ({ cena }) => {
  const f = useLocal(cena);
  const q = useQuadro();
  const p = prog(f, QPT, QPT * 3);
  const a = cena.alvo;
  const folga = (1 - p) * 0.12;
  const x = (a.x - folga) * q.largura;
  const y = (a.y - folga) * q.altura;
  const w = (a.w + 2 * folga) * q.largura;
  const h = (a.h + 2 * folga) * q.altura;
  const canto = 54 * q.escala;
  const traco = Math.max(3, 4 * q.escala);
  const c = cor('papel');
  const cantos: React.CSSProperties[] = [
    { left: 0, top: 0, borderLeft: `${traco}px solid ${c}`, borderTop: `${traco}px solid ${c}` },
    { right: 0, top: 0, borderRight: `${traco}px solid ${c}`, borderTop: `${traco}px solid ${c}` },
    { left: 0, bottom: 0, borderLeft: `${traco}px solid ${c}`, borderBottom: `${traco}px solid ${c}` },
    { right: 0, bottom: 0, borderRight: `${traco}px solid ${c}`, borderBottom: `${traco}px solid ${c}` },
  ];
  return (
    <AbsoluteFill>
      <Midia chave={cena.midia} duracao={cena.sequenciaQuadros} movimento="empurrao" />
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxShadow: `0 0 0 ${q.altura * 2}px rgba(0,0,0,${0.5 * p})`, opacity: p > 0 ? 1 : 0 }}>
        {cantos.map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: canto, height: canto, ...s }} />
        ))}
        {semTexto() ? null : (
          <div style={{ position: 'absolute', left: '50%', bottom: -22 * q.escala, transform: `translateX(-50%) scale(${0.9 + 0.1 * p})`, opacity: prog(f, QPT * 2, QPT * 3) }}>
            <span style={{ ...estiloTexto('rotulo', q.escala), display: 'inline-block', padding: `${10 * q.escala}px ${18 * q.escala}px`, borderRadius: 99, backgroundColor: cor('tinta'), color: cor('papel') }}>{cena.selo}</span>
          </div>
        )}
      </div>
      <BlocoTexto f={f} rotulo={cena.rotulo} titulo={cena.titulo} texto={cena.texto} posicao={cena.posicao} inicio={QPT * 2} />
    </AbsoluteFill>
  );
};

/** Rajada: uma mídia por tempo, corte seco na batida. */
const CenaRajada: React.FC<P<'rajada'>> = ({ cena }) => {
  const f = Math.max(0, useLocal(cena));
  const i = Math.min(cena.midias.length - 1, Math.floor(f / QPT));
  return (
    <AbsoluteFill>
      <Midia key={i} chave={cena.midias[i]} duracao={QPT} movimento={i % 2 ? 'recuo' : 'empurrao'} />
    </AbsoluteFill>
  );
};

/** Objeto 3D (caixa, cilindro, logo, montagem ou prédio) sobre fundo chapado, com luz de estúdio. */
const CenaObjeto3D: React.FC<{ cena: Extract<CenaNaLinha, { tipo: 'objeto3d' | 'volume' }> }> = ({ cena }) => {
  const f = useLocal(cena);
  const { fps } = useVideoConfig();
  const q = useQuadro();
  const c = cena.tipo === 'volume' ? { forma: 'predio' as const, pecas: cena.andares } : cena;
  return (
    <AbsoluteFill style={{ backgroundColor: cor(cena.fundo) }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 58%, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: q.altura * (q.vertical ? 0.14 : 0.04) }}>
        <Objeto3D
          f={f + cena.entradaQuadros}
          fps={fps}
          dur={cena.sequenciaQuadros}
          escala={q.escala * (q.vertical ? 1.35 : 0.9)}
          forma={c.forma}
          pecas={c.pecas}
          textura={'textura' in c ? c.textura : undefined}
          texturaVerso={'texturaVerso' in c ? c.texturaVerso : undefined}
          corCorpo={'corCorpo' in c ? c.corCorpo : undefined}
          corDetalhe={'corDetalhe' in c ? c.corDetalhe : undefined}
          tamanho={'tamanho' in c ? c.tamanho : undefined}
          giro={'giro' in c ? c.giro : undefined}
        />
      </AbsoluteFill>
      <BlocoTexto f={f} rotulo={cena.rotulo} titulo={cena.titulo} texto={cena.texto} posicao="topo" sobre={cena.fundo} />
    </AbsoluteFill>
  );
};

/** Celular 3D sobre o fundo desfocado. */
const CenaAparelho: React.FC<P<'aparelho'>> = ({ cena }) => {
  const f = useLocal(cena);
  const q = useQuadro();
  return (
    <AbsoluteFill>
      <Midia chave={cena.midiaFundo} duracao={cena.sequenciaQuadros} movimento="parado" desfoque={36} escurecer={0.35} />
      <AbsoluteFill style={{ justifyContent: q.vertical ? 'flex-start' : 'center', alignItems: q.vertical ? 'center' : 'flex-end', paddingTop: q.vertical ? q.my + q.altura * 0.06 : 0, paddingRight: q.vertical ? 0 : q.mx * 2 }}>
        <Telefone3D f={f + cena.entradaQuadros} dur={cena.sequenciaQuadros} telas={cena.telas} largura={(q.vertical ? 400 : 340) * q.escala} escala={q.escala} />
      </AbsoluteFill>
      <BlocoTexto f={f} rotulo={cena.rotulo} titulo={cena.titulo} texto={cena.texto} posicao="baixo" inicio={QPT} />
    </AbsoluteFill>
  );
};

/** Cartões de vidro numerados sobre o fundo desfocado. */
const CenaCartoes: React.FC<P<'cartoes'>> = ({ cena }) => {
  const f = useLocal(cena);
  const q = useQuadro();
  const esconder = semTexto();
  return (
    <AbsoluteFill>
      <Midia chave={cena.midiaFundo} duracao={cena.sequenciaQuadros} movimento="empurrao" desfoque={10} escurecer={0.25} />
      <AbsoluteFill style={{ padding: `${q.my}px ${q.mx}px`, justifyContent: 'center', gap: 22 * q.escala }}>
        {cena.rotulo || cena.titulo ? (
          <div style={{ color: cor('papel'), display: 'flex', flexDirection: 'column', gap: 14 * q.escala, marginBottom: 14 * q.escala, visibility: esconder ? 'hidden' : 'visible' }}>
            {cena.rotulo ? <EntraFocando f={f} inicio={0}><p style={estiloTexto('rotulo', q.escala)}>{cena.rotulo}</p></EntraFocando> : null}
            {cena.titulo ? <EntraFocando f={f} inicio={4}><h1 style={estiloTexto('titulo', q.escala, { fontSize: Math.round(64 * q.escala) })}>{cena.titulo}</h1></EntraFocando> : null}
          </div>
        ) : null}
        {cena.cartoes.map((c, i) => {
          const ini = QPT * (1 + i * 1.5);
          const p = prog(f, ini, ini + 18);
          return (
            <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 40 * q.escala}px) scale(${0.96 + 0.04 * p})` }}>
              <Vidro escala={q.escala}>
                <div style={{ display: 'flex', gap: 22 * q.escala, alignItems: 'baseline', color: cor('papel'), visibility: esconder ? 'hidden' : 'visible' }}>
                  <span style={{ ...estiloTexto('rotulo', q.escala), color: cor('acento') }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 * q.escala }}>
                    <span style={estiloTexto('cartaoTitulo', q.escala)}>{c.titulo}</span>
                    <span style={estiloTexto('cartaoTexto', q.escala)}>{c.texto}</span>
                  </div>
                </div>
              </Vidro>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Chamada final: cartão de vidro com botão sobre a mídia. */
const CenaCta: React.FC<P<'cta'>> = ({ cena }) => {
  const f = useLocal(cena);
  const q = useQuadro();
  const p = prog(f, 0, 20);
  const pulso = 1 + 0.03 * Math.max(0, Math.sin(((f - QPT * 4) / QPT) * Math.PI)) * (f > QPT * 4 ? 1 : 0);
  const esconder = semTexto();
  return (
    <AbsoluteFill>
      <Midia chave={cena.midiaFundo} duracao={cena.sequenciaQuadros} movimento="recuo" />
      <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 60%)' }} />
      <div style={{ position: 'absolute', left: q.mx, right: q.mx, bottom: q.my, opacity: p, transform: `translateY(${(1 - p) * 60 * q.escala}px)` }}>
        <Vidro escala={q.escala} style={{ padding: `${40 * q.escala}px` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 * q.escala, color: cor('papel'), visibility: esconder ? 'hidden' : 'visible' }}>
            {cena.rotulo ? <EntraFocando f={f} inicio={6}><p style={estiloTexto('rotulo', q.escala)}>{cena.rotulo}</p></EntraFocando> : null}
            <EntraFocando f={f} inicio={10}><h1 style={estiloTexto('titulo', q.escala, { fontSize: Math.round(62 * q.escala) })}>{cena.titulo}</h1></EntraFocando>
            <EntraFocando f={f} inicio={16}><p style={estiloTexto('texto', q.escala)}>{cena.texto}</p></EntraFocando>
            <EntraFocando f={f} inicio={QPT * 2}>
              <div style={{ ...estiloTexto('botao', q.escala), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 * q.escala, padding: `${24 * q.escala}px`, borderRadius: 18 * q.escala, backgroundColor: cor('papel'), color: corTexto('papel'), transform: `scale(${pulso})` }}>
                {cena.botao} <span aria-hidden>↗</span>
              </div>
            </EntraFocando>
            {cena.dica ? <EntraFocando f={f} inicio={QPT * 3}><p style={{ ...estiloTexto('cartaoTexto', q.escala), textAlign: 'center' }}>{cena.dica}</p></EntraFocando> : null}
          </div>
        </Vidro>
      </div>
    </AbsoluteFill>
  );
};

export const CenaPorTipo: React.FC<{ cena: CenaNaLinha }> = ({ cena }) => {
  switch (cena.tipo) {
    case 'midia': return <CenaMidia cena={cena} />;
    case 'mira': return <CenaMira cena={cena} />;
    case 'rajada': return <CenaRajada cena={cena} />;
    case 'volume':
    case 'objeto3d': return <CenaObjeto3D cena={cena} />;
    case 'aparelho': return <CenaAparelho cena={cena} />;
    case 'cartoes': return <CenaCartoes cena={cena} />;
    case 'cta': return <CenaCta cena={cena} />;
  }
};
void interpolate; void curva;
