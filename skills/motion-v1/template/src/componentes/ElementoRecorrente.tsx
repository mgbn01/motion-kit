import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CenaNaLinha } from '../linhaDoTempo';
import { corElemento, curvaTransicao, QPT, useQuadro } from '../estilo';
import { tema, type NomeCor } from '../tema';

/**
 * O fio condutor do filme. Nasce no quadro 0, atravessa todas as cenas mudando de
 * âncora durante cada transição e, no fechamento, abre para revelar o logo.
 */
export const ElementoRecorrente: React.FC<{ linha: CenaNaLinha[] }> = ({ linha }) => {
  const g = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = useQuadro();

  const atual = linha.find((c) => g >= c.inicioQuadro && g < c.fimQuadro) ?? linha[linha.length - 1];
  const proxima = linha[atual.indice + 1];

  let { x, y } = atual.ancora;
  let fundo: NomeCor = atual.fundo;
  // Nos flashes o fundo muda a cada palavra: o elemento acompanha para nunca sumir.
  if (atual.tipo === 'flashes') {
    const porPalavra = tema.flashes.temposPorPalavra * QPT;
    const i = Math.min(tema.servicos.length - 1, Math.max(0, Math.floor((g - atual.inicioQuadro) / porPalavra)));
    fundo = tema.flashes.fundos[i % tema.flashes.fundos.length];
  }
  // Na primeira cena o elemento nasce no centro e só depois vai para a âncora.
  if (atual.indice === 0) {
    const p = interpolate(g, [QPT, QPT * 3], [0, 1], { easing: curvaTransicao, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    x = interpolate(p, [0, 1], [0.5, atual.ancora.x]);
    y = interpolate(p, [0, 1], [0.5, atual.ancora.y]);
  }
  if (proxima && g >= atual.fimQuadro - proxima.entradaQuadros) {
    const p = interpolate(g, [atual.fimQuadro - proxima.entradaQuadros, atual.fimQuadro], [0, 1], {
      easing: curvaTransicao,
      extrapolateRight: 'clamp',
    });
    x = interpolate(p, [0, 1], [atual.ancora.x, proxima.ancora.x]);
    y = interpolate(p, [0, 1], [atual.ancora.y, proxima.ancora.y]);
    if (p > 0.5) fundo = proxima.fundo;
  }

  const nascimento = spring({ frame: g, fps, config: { damping: 11, mass: 0.5, stiffness: 160 } });
  const ultima = linha[linha.length - 1];
  // No fechamento o ponto se abre e dá lugar ao logo (a cena desenha o anel).
  const abertura =
    atual.indice === ultima.indice ? interpolate(g - ultima.inicioQuadro, [0, 2 * QPT], [1, 0], { extrapolateRight: 'clamp', easing: curvaTransicao }) : 1;
  const respiro = 1 + 0.12 * Math.exp(-(((g % (QPT * tema.musica.temposPorCompasso)) + 0) / 4));

  const d = tema.elemento.tamanho * q.escala * nascimento * abertura * respiro;
  if (d < 0.5) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x * q.largura - d / 2,
        top: y * q.altura - d / 2,
        width: d,
        height: d,
        borderRadius: tema.elemento.forma === 'circulo' ? '50%' : d * 0.18,
        backgroundColor: corElemento(fundo),
      }}
    />
  );
};
