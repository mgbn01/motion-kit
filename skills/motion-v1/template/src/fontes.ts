import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { tema } from './tema';

/** Fontes locais: o render não depende de internet. loadFont segura o render até carregar. */
export const fontesCarregadas = Promise.all(
  tema.tipografia.arquivos.map((a) =>
    loadFont({ family: tema.tipografia.familia, url: staticFile(a.arquivo), weight: a.peso, display: 'block' }),
  ),
);
