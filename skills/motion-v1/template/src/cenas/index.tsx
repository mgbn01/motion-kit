import React from 'react';
import type { PropsCena } from './tipos';
import { Abertura } from './Abertura';
import { Fechamento } from './Fechamento';
import { Flashes } from './Flashes';
import { Plano } from './Plano';
import { Prova } from './Prova';
import { Solucao } from './Solucao';

export const CenaPorTipo: React.FC<PropsCena> = ({ cena }) => {
  switch (cena.tipo) {
    case 'abertura':
      return <Abertura cena={cena} />;
    case 'flashes':
      return <Flashes cena={cena} />;
    case 'solucao':
      return <Solucao cena={cena} />;
    case 'prova':
      return <Prova cena={cena} />;
    case 'fechamento':
      return <Fechamento cena={cena} />;
    case 'plano':
      return <Plano cena={cena} />;
  }
};
