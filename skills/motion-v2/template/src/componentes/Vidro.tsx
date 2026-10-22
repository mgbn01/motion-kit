import React from 'react';

/** Painel de vidro fosco: desfoca o que está atrás e escurece o bastante para o texto ler. */
export const Vidro: React.FC<{ escala: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ escala, style, children }) => (
  <div
    style={{
      backdropFilter: `blur(${28 * escala}px) saturate(1.15)`,
      WebkitBackdropFilter: `blur(${28 * escala}px) saturate(1.15)`,
      backgroundColor: 'rgba(14,14,12,0.6)',
      border: `${Math.max(1, 1.5 * escala)}px solid rgba(255,255,255,0.22)`,
      borderRadius: 30 * escala,
      padding: `${30 * escala}px ${34 * escala}px`,
      ...style,
    }}
  >
    {children}
  </div>
);
