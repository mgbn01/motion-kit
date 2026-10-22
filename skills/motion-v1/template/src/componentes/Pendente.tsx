import React from 'react';
import { ehPendente } from '../linhaDoTempo';

/**
 * Mostra o texto, mas se ele estiver [PENDENTE] desenha uma caixa tracejada
 * impossível de passar despercebida num still de verificação.
 */
/** Palavras com hífen ("pós-obra", "bem-vindo") ficam inteiras: nunca quebram no hífen. Funciona com qualquer fonte. */
const semQuebrarNoHifen = (valor: string): React.ReactNode =>
  valor.split(/(\s+)/).map((parte, i) =>
    parte.includes('-') ? (
      <span key={i} style={{ whiteSpace: 'nowrap' }}>
        {parte}
      </span>
    ) : (
      parte
    ),
  );

export const Texto: React.FC<{ valor: string; cor: string; style?: React.CSSProperties }> = ({ valor, cor, style }) => {
  if (!ehPendente(valor)) return <span style={{ color: cor, ...style }}>{semQuebrarNoHifen(valor)}</span>;
  return (
    <span
      style={{
        color: cor,
        // Sublinhado tracejado: impossível não ver num still e não é cortado pelas máscaras.
        textDecorationLine: 'underline',
        textDecorationStyle: 'dashed',
        textDecorationThickness: 3,
        textUnderlineOffset: '0.18em',
        ...style,
      }}
    >
      {valor}
    </span>
  );
};
