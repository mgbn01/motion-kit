import { clockWipe } from '@remotion/transitions/clock-wipe';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type { TransitionPresentation } from '@remotion/transitions';
import type { CenaNaLinha } from '../linhaDoTempo';
import { cor } from '../estilo';
import { tema, type NomeCor } from '../tema';
import { inundacao } from './inundacao';
import { mascara } from './mascara';
import { portal } from './portal';

/** Escolhe a apresentação da transição de entrada da cena. */
export const apresentacao = (
  cena: CenaNaLinha,
  anterior: CenaNaLinha,
  largura: number,
  altura: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TransitionPresentation<any> => {
  switch (cena.transicao) {
    case 'mascara':
      // Nasce de onde o elemento recorrente estava na cena anterior.
      return mascara({ x: anterior.ancora.x, y: anterior.ancora.y, largura, altura });
    case 'portal':
      return portal({ largura, altura });
    case 'inundacao': {
      // Duas cores da marca que não sejam o fundo de saída nem o de entrada.
      const usadas: NomeCor[] = [anterior.fundo, cena.fundo];
      const preferencia: NomeCor[] = ['destaque', 'secundaria', 'primaria', 'papel', 'tinta'];
      const candidatas = preferencia.filter((c) => !usadas.includes(c) && c in tema.cores);
      return inundacao({ cor1: cor(candidatas[0]), cor2: cor(candidatas[1] ?? candidatas[0]), altura });
    }
    case 'deslize':
      return slide({ direction: 'from-right' });
    case 'cortina':
      return wipe({ direction: 'from-left' });
    case 'relogio':
      return clockWipe({ width: largura, height: altura });
  }
};
