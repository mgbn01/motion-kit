import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { cor, corTexto, estiloTexto, semTexto, useQuadro } from '../estilo';
import { montarLinhaDoTempo } from '../linhaDoTempo';
import { tema } from '../tema';

/** Assinatura fixa no canto (logo + nome), como nos filmes de estúdio. Respeita a margem de segurança. */
export const MarcaFixa: React.FC<{ ultimoQuadro: number }> = ({ ultimoQuadro }) => {
  const g = useCurrentFrame();
  const q = useQuadro();
  if (!tema.marca.marcaFixa) return null;
  const op = interpolate(g, [6, 20, ultimoQuadro - 20, ultimoQuadro - 6], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lado = 40 * q.escala;
  // Sobre fundo chapado claro (planta, volume) a marca troca para a versão escura.
  const atual = montarLinhaDoTempo(tema).find((c) => g >= c.inicioQuadro - c.entradaQuadros / 2 && g < c.fimQuadro);
  const fundoChapado = atual && (atual.tipo === 'volume' || atual.tipo === 'objeto3d' ? atual.fundo : atual.tipo === 'midia' && atual.ajuste === 'conter' ? atual.fundo ?? 'claro' : undefined);
  const escuro = fundoChapado ? corTexto(fundoChapado) !== cor('papel') : false;
  const logo = escuro && tema.marca.logoEscuro ? tema.marca.logoEscuro : tema.marca.logo;
  // Degradê no topo (faz parte do fundo e continua na medição sem texto): garante leitura sobre céu claro.
  const degrade = escuro ? null : (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: q.my + 160 * q.escala, opacity: op, background: 'linear-gradient(to bottom, rgba(0,0,0,0.62), rgba(0,0,0,0.38) 55%, rgba(0,0,0,0))' }} />
  );
  if (semTexto()) return degrade;
  return (
    <>
    {degrade}
    <div style={{ position: 'absolute', left: q.mx, top: q.my, display: 'flex', alignItems: 'center', gap: 12 * q.escala, opacity: op, filter: escuro ? undefined : 'drop-shadow(0 1px 6px rgba(0,0,0,0.45))' }}>
      <Img src={staticFile(logo)} style={{ width: lado, height: lado, objectFit: 'contain', filter: escuro && !tema.marca.logoEscuro ? 'brightness(0)' : undefined }} />
      <span style={{ ...estiloTexto('marca', q.escala), color: escuro ? corTexto(fundoChapado!) : cor('papel') }}>{tema.marca.nome}</span>
    </div>
    </>
  );
};
