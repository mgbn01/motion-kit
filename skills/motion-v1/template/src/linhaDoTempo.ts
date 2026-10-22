/**
 * Converte as cenas do tema (em tempos musicais) em quadros.
 *
 * Convenção de corte: a cena "aterrissa" no tempo. A transição de entrada termina
 * exatamente em `inicioQuadro`, que é múltiplo de um tempo. Como a transição também
 * dura um número inteiro de tempos, ela começa num tempo e termina em outro.
 * A narração da cena começa em `inicioQuadro`.
 *
 * Sem dependência do Remotion: roda no navegador e no Node.
 */
import type { Cena, Tema } from './tema';

export type CenaNaLinha = Cena & {
  indice: number;
  /** Primeiro quadro com a cena inteira na tela (fim da transição de entrada). */
  inicioQuadro: number;
  /** Quadro em que a próxima cena aterrissa (exclusivo). */
  fimQuadro: number;
  /** Quadros da transição de entrada (0 na primeira cena). */
  entradaQuadros: number;
  /** Quadros da transição de saída (0 na última cena). */
  saidaQuadros: number;
  /** Para o TransitionSeries: duração total da sequência, contando a transição de entrada. */
  sequenciaQuadros: number;
  /** Janela da narração, em segundos. */
  janelaSegundos: number;
  inicioSegundos: number;
  fimSegundos: number;
  /** true quando esta cena abre uma seção nova (tipo diferente do anterior). */
  abreSecao: boolean;
};

export const quadrosPorTempo = (t: Pick<Tema, 'fps' | 'musica'>): number => (t.fps * 60) / t.musica.bpm;

export const montarLinhaDoTempo = (t: Tema): CenaNaLinha[] => {
  const qpt = quadrosPorTempo(t);
  const inicios: number[] = [];
  let acumulado = 0;
  for (const c of t.cenas) {
    inicios.push(acumulado);
    acumulado += c.tempos;
  }

  return t.cenas.map((c, i) => {
    const inicioQuadro = inicios[i] * qpt;
    const fimQuadro = (inicios[i] + c.tempos) * qpt;
    const entradaQuadros = i === 0 ? 0 : (c.transicaoTempos ?? 1) * qpt;
    const proxima = t.cenas[i + 1];
    const saidaQuadros = proxima ? (proxima.transicaoTempos ?? 1) * qpt : 0;
    return {
      ...c,
      indice: i,
      inicioQuadro,
      fimQuadro,
      entradaQuadros,
      saidaQuadros,
      sequenciaQuadros: fimQuadro - inicioQuadro + entradaQuadros,
      janelaSegundos: (fimQuadro - inicioQuadro) / t.fps,
      inicioSegundos: inicioQuadro / t.fps,
      fimSegundos: fimQuadro / t.fps,
      abreSecao: i === 0 || t.cenas[i - 1].tipo !== c.tipo,
    };
  });
};

export const duracaoTotalQuadros = (t: Tema): number => {
  const linha = montarLinhaDoTempo(t);
  return linha[linha.length - 1].fimQuadro;
};

export const ehPendente = (texto: string | null | undefined): boolean =>
  texto === null || texto === undefined || texto.includes('[PENDENTE]');
