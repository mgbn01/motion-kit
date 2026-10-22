import React from 'react';
import { Img, staticFile } from 'remotion';
import { corTexto, estiloTexto, cor } from '../estilo';
import type { NomeCor, Servico } from '../tema';
import { TelaIlustrativa } from './TelaIlustrativa';

/**
 * Moldura de tela de produto. Se o serviço tem print em public/telas/, mostra o print
 * (que já precisa estar anonimizado). Se não tem, mostra a tela ilustrativa.
 */
export const Tela: React.FC<{
  servico: Servico;
  f: number;
  largura: number;
  altura: number;
  fundo: NomeCor;
  escala: number;
}> = ({ servico, f, largura, altura, fundo, escala }) => {
  const ilustrativa = !servico.tela || servico.ilustrativa;
  const deslocamento = Math.round(18 * escala);
  // Bloco sólido atrás da tela no lugar da sombra genérica: dá peso sem borrar.
  const bloco = fundo === 'papel' ? cor('primaria') : fundo === 'tinta' ? cor('primaria') : cor('tinta');
  return (
    <div style={{ position: 'relative', width: largura, height: altura }}>
      <div
        style={{
          position: 'absolute',
          left: deslocamento,
          top: deslocamento,
          width: largura,
          height: altura,
          borderRadius: 22 * escala,
          backgroundColor: bloco,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 22 * escala, overflow: 'hidden' }}>
        {servico.tela ? (
          <Img src={staticFile(`telas/${servico.tela}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }} />
        ) : (
          <TelaIlustrativa f={f} largura={largura} altura={altura} />
        )}
      </div>
      {ilustrativa ? (
        <div
          style={{
            position: 'absolute',
            left: 16 * escala,
            bottom: 16 * escala,
            padding: `${6 * escala}px ${14 * escala}px`,
            borderRadius: 999,
            backgroundColor: cor('tinta'),
            ...estiloTexto('legenda', escala, { color: corTexto('tinta'), fontWeight: 700 }),
          }}
        >
          Tela ilustrativa
        </div>
      ) : null}
    </div>
  );
};
