import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Revela } from '../componentes/Revela';
import { Texto } from '../componentes/Pendente';
import { cor, corAcento, corTexto, curva, encaixar, estiloTexto, QPT, useQuadro } from '../estilo';
import { tema, type Numero } from '../tema';
import type { PropsCena } from './tipos';

const formatar = (n: Numero, valor: number): string => {
  const casas = n.casasDecimais ?? 0;
  const s = valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  return `${n.prefixo ?? ''}${s}${n.sufixo ?? ''}`;
};

/** Prova: cada número conta de zero até o valor real. Sem valor, aparece [PENDENTE]. */
export const Prova: React.FC<PropsCena> = ({ cena }) => {
  const f = useCurrentFrame() - cena.entradaQuadros;
  const q = useQuadro();
  const texto = corTexto(cena.fundo);
  const acento = corAcento(cena.fundo);
  const n = tema.numeros.length;
  const gap = (q.vertical ? 56 : 80) * q.escala;
  const larguraColuna = q.vertical ? q.largura - 2 * q.mx : (q.largura - 2 * q.mx - gap * (n - 1)) / n;
  const baseNumero = tema.tipografia.estilos.numero.tamanho * q.escala;
  // Encaixa o número na coluna, medido com a fonte real: nada passa da margem de segurança.
  const tamanhoNumero = (s: string) => encaixar(s, larguraColuna, baseNumero, 'numero', true);

  return (
    <AbsoluteFill style={{ backgroundColor: cor(cena.fundo) }}>
      <AbsoluteFill
        style={{
          padding: `${q.my}px ${q.mx}px`,
          flexDirection: q.vertical ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: q.vertical ? 'flex-start' : 'center',
          gap,
        }}
      >
        {tema.numeros.map((num, i) => {
          const inicio = QPT * (1 + i * 3);
          const conta = interpolate(f, [inicio, inicio + QPT * 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: curva });
          const exibido = num.valor === null ? '[PENDENTE]' : formatar(num, num.valor * conta);
          // O tamanho é calculado pelo valor final, para o número não "crescer" enquanto conta.
          const final = num.valor === null ? '[PENDENTE]' : formatar(num, num.valor);
          return (
            <div key={i} style={{ width: larguraColuna, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 * q.escala }}>
              <Revela f={f} inicio={inicio} duracao={14}>
                <Texto valor={exibido} cor={acento} style={estiloTexto('numero', q.escala, { display: 'block', fontVariantNumeric: 'tabular-nums', fontSize: Math.round(tamanhoNumero(final)), whiteSpace: 'nowrap' })} />
              </Revela>
              <Revela f={f} inicio={inicio + 6} duracao={14}>
                <Texto valor={num.rotulo} cor={texto} style={estiloTexto('corpo', q.escala, { display: 'block' })} />
              </Revela>
              <Revela f={f} inicio={inicio + 10} duracao={14}>
                <Texto valor={`Fonte: ${num.fonte}`} cor={texto} style={estiloTexto('legenda', q.escala, { display: 'block' })} />
              </Revela>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
