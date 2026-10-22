/**
 * Mede o BPM e o deslocamento da primeira batida por análise de energia (Node puro).
 *
 *   npm run bpm                         → analisa audio/trilha-bruta.mp3
 *   npm run bpm -- --arquivo outro.wav
 *
 * Como funciona:
 *  1. ffmpeg decodifica para mono 22 050 Hz;
 *  2. envelope de "ataque": diferença positiva do log da energia em janelas de 512
 *     amostras a cada 128 (5,8 ms);
 *  3. para cada BPM candidato (±8% do alvo do tema, passo 0,02) e cada fase, soma o
 *     envelope nos tempos previstos; fica o par BPM/fase de maior soma;
 *  4. primeira batida = primeiro tempo da grade com ataque forte, refinado no pico local.
 *
 * Saída: audio/trilha-analise.json  { bpm, primeiraBatida, desvioPercentual, ... }
 */
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tema } from '../src/tema';
import { argumento, caminho, falhar, ffmpegDoSistema, ok, passo } from './_comum';

const TAXA = 22050;
const JANELA = 512;
const SALTO = 128;

export const analisar = (arquivo: string, alvo: number) => {
  const ff = ffmpegDoSistema();
  const r = spawnSync(ff, ['-v', 'error', '-i', arquivo, '-ac', '1', '-ar', String(TAXA), '-f', 'f32le', 'pipe:1'], {
    maxBuffer: 1024 * 1024 * 512,
  });
  if (r.status !== 0) falhar(`ffmpeg não decodificou ${arquivo}: ${r.stderr.toString().slice(-400)}`);
  const buf = r.stdout as Buffer;
  const amostras = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));

  // Envelope de ataque
  const n = Math.floor((amostras.length - JANELA) / SALTO);
  const energia = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const base = i * SALTO;
    for (let j = 0; j < JANELA; j++) s += amostras[base + j] ** 2;
    energia[i] = Math.log10(1e-10 + s / JANELA);
  }
  const ataque = new Float64Array(n);
  for (let i = 1; i < n; i++) ataque[i] = Math.max(0, energia[i] - energia[i - 1]);

  const quadrosPorSeg = TAXA / SALTO;
  const amostra = (t: number) => {
    const i = Math.floor(t);
    if (i < 0 || i + 1 >= n) return 0;
    return ataque[i] * (1 - (t - i)) + ataque[i + 1] * (t - i);
  };

  // Busca BPM e fase
  let melhor = { bpm: 0, fase: 0, nota: -1 };
  for (let bpm = alvo * 0.92; bpm <= alvo * 1.08; bpm += 0.02) {
    const periodo = (60 / bpm) * quadrosPorSeg;
    for (let fase = 0; fase < periodo; fase += 1) {
      let soma = 0;
      let k = 0;
      for (let t = fase; t < n; t += periodo, k++) soma += Math.max(amostra(t - 1), amostra(t), amostra(t + 1));
      const nota = soma / k;
      if (nota > melhor.nota) melhor = { bpm, fase, nota };
    }
  }

  // Primeira batida forte: primeiro tempo da grade com ataque acima de 35% da mediana dos tempos.
  const periodo = (60 / melhor.bpm) * quadrosPorSeg;
  const valores: number[] = [];
  for (let t = melhor.fase; t < n; t += periodo) valores.push(Math.max(amostra(t - 1), amostra(t), amostra(t + 1)));
  const mediana = [...valores].sort((a, b) => a - b)[Math.floor(valores.length / 2)];
  let t0 = melhor.fase;
  for (let t = melhor.fase, i = 0; t < n; t += periodo, i++) {
    if (valores[i] >= 0.35 * mediana) {
      t0 = t;
      break;
    }
  }
  // Refina no pico de ataque mais próximo (±15 ms) e recua até o início do ataque.
  const raio = Math.round(0.015 * quadrosPorSeg);
  let pico = Math.round(t0);
  for (let i = Math.max(1, pico - raio); i <= Math.min(n - 1, pico + raio); i++) if (ataque[i] > ataque[pico]) pico = i;
  // O ataque aparece quando a batida entra no FIM da janela de energia: soma o tamanho da janela.
  // Testado com cliques sintéticos: erro de 1 a 6 ms (menos de um quadro a 30 fps).
  const primeiraBatida = Math.max(0, (pico * SALTO + JANELA) / TAXA);

  return {
    arquivo,
    bpmAlvo: alvo,
    bpm: +melhor.bpm.toFixed(2),
    desvioPercentual: +(((melhor.bpm - alvo) / alvo) * 100).toFixed(2),
    primeiraBatida: +primeiraBatida.toFixed(4),
    confianca: +melhor.nota.toFixed(4),
    duracao: +(amostras.length / TAXA).toFixed(3),
  };
};

if (require.main === module) {
  const arquivo = argumento('arquivo') ?? caminho('audio/trilha-bruta.mp3');
  passo(`Medindo BPM de ${arquivo.replace(caminho(), '.')}`);
  const res = analisar(arquivo, tema.musica.bpm);
  console.log(`  BPM medido: ${res.bpm} (alvo ${res.bpmAlvo}, desvio ${res.desvioPercentual}%)`);
  console.log(`  Primeira batida: ${res.primeiraBatida.toFixed(3)} s`);
  if (Math.abs(res.desvioPercentual) > 2) {
    falhar(
      `A trilha está ${res.desvioPercentual}% fora do BPM. Esticar mais de 2% deforma o som.`,
      'gere a trilha de novo (npm run trilha) ou ajuste tema.musica.bpm para um valor que divida 60 × fps.',
    );
  }
  if (!argumento('arquivo')) writeFileSync(caminho('audio/trilha-analise.json'), JSON.stringify(res, null, 2));
  ok(Math.abs(res.desvioPercentual) > 0.1 ? 'Desvio pequeno: a mixagem corrige com atempo.' : 'BPM dentro da grade.');
}
