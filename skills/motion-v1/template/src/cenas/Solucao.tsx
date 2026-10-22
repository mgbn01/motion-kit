import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Revela } from '../componentes/Revela';
import { Texto } from '../componentes/Pendente';
import { Tela } from '../componentes/Tela';
import { cor, corAcento, corTexto, curva, encaixar, estiloTexto, QPT, useQuadro } from '../estilo';
import { tema } from '../tema';
import type { PropsCena } from './tipos';

/** Uma solução: título, a tela entrando em perspectiva e o resultado que ela entrega. */
export const Solucao: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame() - cena.entradaQuadros;
  const { fps } = useVideoConfig();
  const q = useQuadro();
  const servico = tema.servicos[cena.servico ?? 0];
  const texto = corTexto(cena.fundo);

  const larguraUtil = q.largura - 2 * q.mx;
  const alturaUtil = q.altura - 2 * q.my;
  // 16:9 e 1:1: texto à esquerda (5 de 12 colunas), tela à direita. 9:16: texto em cima, tela embaixo.
  // Desconta o bloco sólido deslocado atrás da tela, para ele também ficar dentro da margem.
  const telaLargura = (q.vertical ? larguraUtil : q.formato === '1x1' ? larguraUtil * 0.62 : (larguraUtil * 7) / 12) - 18 * q.escala;
  const telaAltura = q.vertical ? Math.min(alturaUtil * 0.48, telaLargura * 0.75) : Math.min(alturaUtil * 0.82, telaLargura * 0.66);

  const entradaTela = spring({ frame: f - QPT, fps, config: { damping: 16, mass: 0.8, stiffness: 90 } });
  const giro = interpolate(entradaTela, [0, 1], [24, 6]);
  const desliza = interpolate(entradaTela, [0, 1], [q.vertical ? 0 : 160 * q.escala, 0]);
  const sobe = interpolate(entradaTela, [0, 1], [q.vertical ? 140 * q.escala : 0, 0]);
  const respira = interpolate(f, [QPT * 8, QPT * 15], [1, 1.03], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: curva });

  const colunaTexto = q.vertical ? larguraUtil : (larguraUtil * 5) / 12 - 40 * q.escala;
  const tamTitulo = encaixar(servico.titulo, colunaTexto, tema.tipografia.estilos.titulo.tamanho * q.escala, 'titulo');
  const tamResultado = encaixar(servico.resultado, colunaTexto, tema.tipografia.estilos.subtitulo.tamanho * q.escala, 'subtitulo');
  const blocoTexto = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 * q.escala, width: colunaTexto, flexShrink: 0 }}>
      <Revela f={f} inicio={0} duracao={16}>
        <Texto valor={servico.titulo} cor={texto} style={estiloTexto('titulo', q.escala, { display: 'block', fontSize: Math.round(tamTitulo) })} />
      </Revela>
      <Revela f={f} inicio={QPT * 4} duracao={16}>
        <Texto valor={servico.resultado} cor={corAcento(cena.fundo)} style={estiloTexto('subtitulo', q.escala, { display: 'block', fontSize: Math.round(tamResultado) })} />
      </Revela>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: cor(cena.fundo) }}>
      <AbsoluteFill
        style={{
          padding: `${q.my}px ${q.mx}px`,
          flexDirection: q.vertical ? 'column' : 'row',
          justifyContent: q.vertical ? 'center' : 'space-between',
          alignItems: q.vertical ? 'flex-start' : 'center',
          gap: 64 * q.escala,
        }}
      >
        {blocoTexto}
        <div
          style={{
            perspective: 1800 * q.escala,
            transform: `translate(${desliza}px, ${sobe}px)`,
            opacity: interpolate(entradaTela, [0, 0.25], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <div style={{ transform: `rotateY(${q.vertical ? 0 : -giro}deg) rotateX(${q.vertical ? giro * 0.6 : 0}deg) scale(${respira})`, transformOrigin: 'center' }}>
            <Tela servico={servico} f={f - QPT} largura={telaLargura} altura={telaAltura} fundo={cena.fundo} escala={q.escala} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
