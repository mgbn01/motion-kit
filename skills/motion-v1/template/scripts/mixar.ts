/**
 * Mixagem e mux, tudo com o ffmpeg do sistema.
 *
 *   npm run mixar                    → usa out/filme-16x9-sem-audio.mp4
 *   npm run mixar -- --formato 9x16
 *
 * Passos:
 *  1. Apara o silêncio de cada bloco de voz (-55 dB no começo, -60 dB no fim,
 *     deixando 0,25 s de cauda para não comer a última sílaba).
 *  2. Se um bloco estourar a janela da cena, acelera no máximo 14%. Mais que isso: erro.
 *  3. Flashes: corta o take único nos tempos medidos de cada palavra e põe cada uma
 *     no seu tempo musical.
 *  4. Trilha: corta o começo até a primeira batida, corrige BPM se o desvio for ≤ 2%,
 *     ajusta ao tamanho do filme, entrada e saída suaves.
 *  5. Trilha ~6 LU abaixo da voz, com sidechain abaixando quando a voz fala.
 *  6. Normaliza o total em -16 LUFS com pico abaixo de -1 dBTP (dois passes de loudnorm).
 *  7. Cola o áudio no vídeo já renderizado com -c:v copy.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { duracaoTotalQuadros, montarLinhaDoTempo } from '../src/linhaDoTempo';
import { tema, type FormatoId } from '../src/tema';
import { argumento, aviso, caminho, falhar, ffmpegDoSistema, ffprobeDuracao, ok, passo, rodar } from './_comum';

const FF = ffmpegDoSistema();
const TMP = caminho('audio/tmp');
mkdirSync(TMP, { recursive: true });
const TAXA = 48000;

type Loudnorm = { input_i: string; input_tp: string; input_lra: string; input_thresh: string; target_offset: string };

const medir = (arquivo: string): Loudnorm => {
  const r = rodar(FF, ['-hide_banner', '-nostats', '-i', arquivo, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
  const m = r.stderr.match(/\{[\s\S]*?"target_offset"[\s\S]*?\}/);
  if (!m) falhar(`Não consegui medir o loudness de ${arquivo}.`);
  return JSON.parse((m as RegExpMatchArray)[0]) as Loudnorm;
};

const ff = (args: string[]) => rodar(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

const principal = () => {
  const formato = (argumento('formato') ?? '16x9') as FormatoId;
  const total = duracaoTotalQuadros(tema) / tema.fps;
  const linha = montarLinhaDoTempo(tema);
  const { silencio } = tema.audio;

  // 1–3. Voz
  passo('Voz: aparando e posicionando cada bloco');
  const blocos: { arquivo: string; inicio: number }[] = [];
  for (const c of linha) {
    const mp3 = caminho(`audio/voz/${c.id}.mp3`);
    if (!existsSync(mp3)) continue;

    if (c.tipo === 'flashes') {
      const alin = JSON.parse(readFileSync(caminho(`audio/voz/${c.id}.alinhamento.json`), 'utf8')) as {
        alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
      };
      const { characters: ch, character_start_times_seconds: ini, character_end_times_seconds: fim } = alin.alignment;
      // Cada palavra é o trecho entre pontos finais.
      const palavras: { de: number; ate: number }[] = [];
      let atual: { de: number; ate: number } | null = null;
      ch.forEach((x, i) => {
        if (x === '.') {
          if (atual) palavras.push(atual);
          atual = null;
        } else if (/[\p{L}\p{N}]/u.test(x)) {
          atual = atual ? { de: atual.de, ate: fim[i] } : { de: ini[i], ate: fim[i] };
        }
      });
      if (atual) palavras.push(atual);
      if (palavras.length !== tema.servicos.length) {
        falhar(`Flashes: o alinhamento achou ${palavras.length} palavras, o tema tem ${tema.servicos.length}.`, 'refaça o take: npm run voz -- --cena flashes');
      }
      const slot = (tema.flashes.temposPorPalavra * 60) / tema.musica.bpm;
      const partes: string[] = [];
      const rotulos: string[] = [];
      palavras.forEach((p, i) => {
        const de = Math.max(0, p.de - 0.03);
        const ate = Math.min(palavras[i + 1]?.de ?? p.ate + 0.3, p.ate + 0.12);
        const dur = ate - de;
        const limite = slot - 0.05;
        let tempo = '';
        if (dur > limite) {
          const fator = dur / limite;
          if (fator > tema.audio.aceleracaoMaxima) falhar(`Flash "${tema.servicos[i].palavra}" dura ${dur.toFixed(2)} s para ${slot} s.`, 'use uma palavra mais curta ou aumente temposPorPalavra.');
          tempo = `,atempo=${fator.toFixed(4)}`;
        }
        const atraso = Math.round(i * slot * 1000);
        partes.push(`[s${i}]atrim=start=${de.toFixed(3)}:end=${ate.toFixed(3)},asetpts=PTS-STARTPTS${tempo},adelay=${atraso}|${atraso}[w${i}]`);
        rotulos.push(`[w${i}]`);
      });
      const filtro = [`[0:a]aresample=${TAXA},aformat=channel_layouts=stereo,asplit=${palavras.length}${palavras.map((_, i) => `[s${i}]`).join('')}`, ...partes, `${rotulos.join('')}amix=inputs=${palavras.length}:normalize=0[out]`].join(';');
      const saida = `${TMP}/${c.id}-final.wav`;
      ff(['-i', mp3, '-filter_complex', filtro, '-map', '[out]', saida]);
      blocos.push({ arquivo: saida, inicio: c.inicioSegundos });
      ok(`flashes: ${palavras.length} palavras de um take só, cada uma no seu tempo`);
      continue;
    }

    const aparado = `${TMP}/${c.id}-aparado.wav`;
    ff([
      '-i', mp3,
      '-af',
      `aresample=${TAXA},aformat=channel_layouts=stereo,` +
        `silenceremove=start_periods=1:start_threshold=${silencio.inicioDb}dB:start_silence=0.02,` +
        `areverse,silenceremove=start_periods=1:start_threshold=${silencio.fimDb}dB:start_silence=${silencio.folgaFimSegundos},areverse`,
      aparado,
    ]);
    const d = ffprobeDuracao(aparado);
    if (!Number.isFinite(d) || d < 0.2) {
      falhar(
        `${c.id}: depois de aparar o silêncio sobrou ${Number.isFinite(d) ? d.toFixed(2) + ' s' : 'nada'}. O áudio está quase todo abaixo de ${silencio.inicioDb} dB.`,
        `ouça audio/voz/${c.id}.mp3; se a voz estiver baixa, gere de novo (npm run voz -- --cena ${c.id}).`,
      );
    }
    const limite = c.janelaSegundos - 0.1;
    let final = aparado;
    if (d > limite) {
      const fator = d / limite;
      if (fator > tema.audio.aceleracaoMaxima) {
        const palavras = c.narracao.trim().split(/\s+/).length;
        const cortar = Math.ceil(palavras * (1 - (limite * tema.audio.aceleracaoMaxima) / d));
        falhar(
          `${c.id}: a fala tem ${d.toFixed(2)} s para ${limite.toFixed(2)} s; precisaria acelerar ${Math.round((fator - 1) * 100)}% (máximo ${Math.round((tema.audio.aceleracaoMaxima - 1) * 100)}%).`,
          `corte umas ${cortar} palavra(s) desse bloco, aprove a copy de novo e rode npm run voz -- --cena ${c.id}.`,
        );
      }
      final = `${TMP}/${c.id}-final.wav`;
      ff(['-i', aparado, '-af', `atempo=${fator.toFixed(4)}`, final]);
      aviso(`${c.id}: acelerado ${((fator - 1) * 100).toFixed(1)}% para caber`);
    }
    blocos.push({ arquivo: final, inicio: c.inicioSegundos });
    ok(`${c.id}: ${Math.min(d, limite).toFixed(2)} s, começa em ${c.inicioSegundos.toFixed(2)} s`);
  }

  const vozBus = `${TMP}/voz.wav`;
  if (blocos.length) {
    // Uma base de silêncio com a duração exata do filme entra no amix: assim a duração
    // do barramento nunca depende de onde termina o último bloco.
    const entradas = ['-f', 'lavfi', '-i', `anullsrc=r=${TAXA}:cl=stereo:d=${total}`, ...blocos.flatMap((b) => ['-i', b.arquivo])];
    const filtro =
      blocos.map((b, i) => `[${i + 1}:a]aresample=${TAXA},aformat=channel_layouts=stereo,adelay=${Math.round(b.inicio * 1000)}|${Math.round(b.inicio * 1000)}[v${i}]`).join(';') +
      `;[0:a]${blocos.map((_, i) => `[v${i}]`).join('')}amix=inputs=${blocos.length + 1}:normalize=0:dropout_transition=0:duration=first,atrim=0:${total}[voz]`;
    ff([...entradas, '-filter_complex', filtro, '-map', '[voz]', vozBus]);
  } else aviso('Sem blocos de voz em audio/voz/: o filme sai só com trilha.');

  // 4. Trilha
  const trilhaBruta = caminho('audio/trilha-bruta.mp3');
  const trilha = `${TMP}/trilha.wav`;
  const temTrilha = existsSync(trilhaBruta);
  if (temTrilha) {
    passo('Trilha: cortando até a primeira batida e ajustando ao filme');
    const arqAnalise = caminho('audio/trilha-analise.json');
    if (!existsSync(arqAnalise)) falhar('audio/trilha-analise.json não existe.', 'rode npm run bpm antes de mixar.');
    const an = JSON.parse(readFileSync(arqAnalise, 'utf8')) as { bpm: number; primeiraBatida: number; desvioPercentual: number };
    if (Math.abs(an.desvioPercentual) > 2) falhar(`Trilha ${an.desvioPercentual}% fora do BPM.`, 'gere outra trilha.');
    const correcao = Math.abs(an.desvioPercentual) > 0.1 ? `,atempo=${(tema.musica.bpm / an.bpm).toFixed(5)}` : '';
    const { entradaSegundos: ent, saidaSegundos: sai } = tema.audio.trilha;
    ff([
      '-i', trilhaBruta,
      '-af',
      `aresample=${TAXA},aformat=channel_layouts=stereo,atrim=start=${an.primeiraBatida},asetpts=PTS-STARTPTS${correcao},` +
        `apad=whole_dur=${total},atrim=0:${total},afade=t=in:d=${ent},afade=t=out:st=${(total - sai).toFixed(3)}:d=${sai}`,
      trilha,
    ]);
    ok(`primeira batida em ${an.primeiraBatida.toFixed(3)} s cortada para 0:00${correcao ? `; BPM corrigido de ${an.bpm} para ${tema.musica.bpm}` : ''}`);
  } else aviso('Sem audio/trilha-bruta.mp3: o filme sai só com voz.');

  if (!blocos.length && !temTrilha) falhar('Nada para mixar: não há voz nem trilha.', 'rode npm run voz e/ou npm run trilha + npm run bpm.');

  // 5. Níveis e sidechain
  passo('Níveis: trilha abaixo da voz, com sidechain');
  const bruto = `${TMP}/mix-bruto.wav`;
  if (blocos.length && temTrilha) {
    const lv = parseFloat(medir(vozBus).input_i);
    const lt = parseFloat(medir(trilha).input_i);
    const ganho = lv - tema.audio.trilha.abaixoDaVozLU - lt;
    ff([
      '-i', vozBus, '-i', trilha,
      '-filter_complex',
      `[0:a]asplit=2[voz][chave];[1:a]volume=${ganho.toFixed(2)}dB[mus];` +
        `[mus][chave]sidechaincompress=threshold=0.04:ratio=5:attack=20:release=400:makeup=1[abaixada];` +
        `[voz][abaixada]amix=inputs=2:normalize=0:duration=first[mix]`,
      '-map', '[mix]', bruto,
    ]);
    ok(`voz ${lv.toFixed(1)} LUFS, trilha ${lt.toFixed(1)} → ${(lt + ganho).toFixed(1)} LUFS (${tema.audio.trilha.abaixoDaVozLU} LU abaixo), sidechain ligado`);
  } else {
    ff(['-i', blocos.length ? vozBus : trilha, bruto]);
  }

  // 6. Loudness final em dois passes
  passo(`Loudness: ${tema.audio.alvoLufs} LUFS, pico ≤ ${tema.audio.picoMaximoDbtp} dBTP`);
  const m = medir(bruto);
  const mix = caminho('audio/mix-final.wav');
  ff([
    '-i', bruto,
    '-af',
    `loudnorm=I=${tema.audio.alvoLufs}:TP=${tema.audio.picoMaximoDbtp}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
      `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=${TAXA}`,
    '-c:a', 'pcm_s24le', mix,
  ]);
  const conf = medir(mix);
  const i = parseFloat(conf.input_i);
  const tp = parseFloat(conf.input_tp);
  console.log(`  medido no arquivo final: ${i.toFixed(1)} LUFS, pico ${tp.toFixed(1)} dBTP`);
  if (tp > -1.0) falhar(`Pico de ${tp.toFixed(1)} dBTP passou de -1 dBTP.`, 'baixe tema.audio.picoMaximoDbtp (ex.: -2) e rode de novo.');
  if (Math.abs(i - tema.audio.alvoLufs) > 1) aviso(`Loudness ${i.toFixed(1)} LUFS ficou a mais de 1 LU do alvo (o loudnorm linear não alcançou; normal com faixa dinâmica grande).`);
  ok('audio/mix-final.wav');

  // 7. Mux sem re-render
  const video = caminho(`out/filme-${formato}-sem-audio.mp4`);
  if (!existsSync(video)) {
    aviso(`Não achei out/filme-${formato}-sem-audio.mp4: o áudio ficou pronto em audio/mix-final.wav. Rode npm run render e depois npm run mixar de novo.`);
    return;
  }
  passo('Colando o áudio no vídeo (-c:v copy, sem renderizar de novo)');
  const saida = caminho(`out/filme-${formato}-final.mp4`);
  const dv = ffprobeDuracao(video);
  ff(['-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', String(TAXA), '-t', dv.toFixed(3), '-movflags', '+faststart', saida]);
  const df = ffprobeDuracao(saida);
  if (Math.abs(dv - df) > 1 / tema.fps + 0.03) falhar(`Duração mudou no mux: vídeo ${dv.toFixed(3)} s, final ${df.toFixed(3)} s.`, 'confira audio/mix-final.wav (deve ter a duração do filme).');
  ok(`out/filme-${formato}-final.mp4 (${df.toFixed(2)} s)`);
};

principal();
