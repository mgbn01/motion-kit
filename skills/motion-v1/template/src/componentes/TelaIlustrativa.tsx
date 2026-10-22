import React from 'react';
import { cor, prog } from '../estilo';

/**
 * Tela recriada, sem nenhum texto ou número: só blocos. Usada quando não há print
 * real. Sempre acompanhada do selo "Tela ilustrativa".
 */
export const TelaIlustrativa: React.FC<{ f: number; largura: number; altura: number }> = ({ f, largura, altura }) => {
  const u = Math.min(largura, altura) / 40;
  const barra = (w: string, h = u * 0.9, c = '#D9DDEA') => (
    <div style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: c }} />
  );
  const colunas = [0.42, 0.66, 0.5, 0.82, 0.58, 0.93, 0.74, 1];
  return (
    <div style={{ width: largura, height: altura, backgroundColor: '#FFFFFF', display: 'flex', overflow: 'hidden', borderRadius: u * 1.2 }}>
      <div style={{ width: '20%', backgroundColor: '#EEF0F7', padding: u * 1.4, display: 'flex', flexDirection: 'column', gap: u * 1.2 }}>
        <div style={{ width: u * 2.4, height: u * 2.4, borderRadius: u * 0.6, backgroundColor: cor('primaria') }} />
        {[0.9, 0.7, 0.8, 0.6, 0.75].map((w, i) => (
          <React.Fragment key={i}>{barra(`${w * 100}%`)}</React.Fragment>
        ))}
      </div>
      <div style={{ flex: 1, padding: u * 1.6, display: 'flex', flexDirection: 'column', gap: u * 1.4 }}>
        {barra('38%', u * 1.4, '#C9CEDF')}
        <div style={{ display: 'flex', gap: u }}>
          {[cor('primaria'), cor('destaque'), cor('secundaria')].map((c, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: '#F6F7FB', borderRadius: u * 0.6, padding: u, display: 'flex', flexDirection: 'column', gap: u * 0.6 }}>
              {barra('50%', u * 0.7)}
              {barra(`${40 + i * 15}%`, u * 1.6, c)}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, backgroundColor: '#F6F7FB', borderRadius: u * 0.6, padding: u, display: 'flex', alignItems: 'flex-end', gap: u * 0.7 }}>
          {colunas.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h * 100 * prog(f, 10 + i * 2, 34 + i * 2)}%`,
                borderRadius: u * 0.3,
                backgroundColor: i === colunas.length - 1 ? cor('destaque') : cor('primaria'),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
