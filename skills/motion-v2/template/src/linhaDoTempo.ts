/**
 * Converte cenas (em tempos musicais) em quadros. A cena "aterrissa" no tempo:
 * a transição de entrada termina em inicioQuadro. Corte seco = entrada de 0 quadros.
 * Sem dependência do Remotion.
 */
import type { Cena, Tema } from './tema';

export type CenaNaLinha = Cena & {
  indice: number;
  inicioQuadro: number;
  fimQuadro: number;
  entradaQuadros: number;
  saidaQuadros: number;
  sequenciaQuadros: number;
  janelaSegundos: number;
  inicioSegundos: number;
  fimSegundos: number;
};

export const quadrosPorTempo = (t: Pick<Tema, 'fps' | 'musica'>) => (t.fps * 60) / t.musica.bpm;

const entradaDe = (c: Cena, qpt: number) => (c.transicao === 'corte' ? 0 : (c.transicaoTempos ?? 1) * qpt);

export const montarLinhaDoTempo = (t: Tema): CenaNaLinha[] => {
  const qpt = quadrosPorTempo(t);
  let acc = 0;
  const inicios = t.cenas.map((c) => {
    const i = acc;
    acc += c.tempos;
    return i;
  });
  return t.cenas.map((c, i) => {
    const inicioQuadro = inicios[i] * qpt;
    const fimQuadro = (inicios[i] + c.tempos) * qpt;
    const entradaQuadros = i === 0 ? 0 : entradaDe(c, qpt);
    const prox = t.cenas[i + 1];
    return {
      ...c,
      indice: i,
      inicioQuadro,
      fimQuadro,
      entradaQuadros,
      saidaQuadros: prox ? entradaDe(prox, qpt) : 0,
      sequenciaQuadros: fimQuadro - inicioQuadro + entradaQuadros,
      janelaSegundos: (fimQuadro - inicioQuadro) / t.fps,
      inicioSegundos: inicioQuadro / t.fps,
      fimSegundos: fimQuadro / t.fps,
    } as CenaNaLinha;
  });
};

export const duracaoTotalQuadros = (t: Tema) => {
  const l = montarLinhaDoTempo(t);
  return l.length ? l[l.length - 1].fimQuadro : 1;
};

export const ehPendente = (s: string | null | undefined) => s === null || s === undefined || s.includes('[PENDENTE]');

/** Segundos de vídeo que a cena consome (da entrada até o corte seguinte). */
export const segundosNecessarios = (c: CenaNaLinha, fps: number) => (c.fimQuadro - c.inicioQuadro + c.entradaQuadros) / fps;
