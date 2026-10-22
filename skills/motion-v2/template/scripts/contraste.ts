/**
 * Contraste MEDIDO nos pixels. Para cada cena com texto sobre imagem, renderiza o quadro do meio
 * sem o texto (inputProps.semTexto) e mede a zona onde o texto fica, já com o degradê/vidro.
 * Usa o percentil 95 da luminância (as partes mais claras sob o texto branco) contra o papel.
 *
 *   npm run contraste [-- --formato 9x16]
 */
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { contraste, luminancia } from '../src/contraste';
import { montarLinhaDoTempo } from '../src/linhaDoTempo';
import { tema, type FormatoId } from '../src/tema';
import { argumento, caminho, falhar, ffmpegDoSistema, ok, passo } from './_comum';

const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };

/**
 * Mede o fundo exatamente embaixo das letras: renderiza o quadro COM e SEM texto, marca os
 * pixels que mudaram (as letras), alarga 2 px e mede a luminância do quadro sem texto ali.
 * Usa o percentil 95 (as partes mais claras sob letra clara) contra a cor do texto.
 */
const lerRGB = (FF: string, arq: string, w: number, h: number) => {
  const r = spawnSync(FF, ['-v', 'error', '-i', arq, '-vf', `scale=${w}:${h}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  return r.stdout as Buffer;
};

const principal = async () => {
  const FF = ffmpegDoSistema();
  const formato = (argumento('formato') ?? '9x16') as FormatoId;
  const f = tema.formatos[formato];
  const W = Math.round(f.largura / 2), H = Math.round(f.altura / 2);
  const alvo = montarLinhaDoTempo(tema).filter((c) => ['midia', 'mira', 'aparelho', 'cartoes', 'cta'].includes(c.tipo) && !(c.tipo === 'midia' && c.ajuste === 'conter'));
  passo('Empacotando');
  const serveUrl = await bundle({ entryPoint: caminho('src/index.ts') });
  const nav = await openBrowser('chrome');
  mkdirSync(caminho('out/contraste'), { recursive: true });
  const papel = luminancia(tema.cores.papel.hex);
  let falhas = 0;
  console.log('\n  cena            pixels de letra   L p95 do fundo   razão     resultado');
  for (const c of alvo) {
    // fim da cena, antes da transição de saída: todas as linhas já entraram
    const quadro = c.fimQuadro - c.saidaQuadros - 2;
    const com = caminho(`out/contraste/${c.id}-com-texto.png`);
    const sem = caminho(`out/contraste/${c.id}-sem-texto.png`);
    for (const [arq, semTexto] of [[com, false], [sem, true]] as const) {
      const comp = await selectComposition({ serveUrl, id: `Filme-${formato}`, puppeteerInstance: nav, inputProps: { semTexto } });
      await renderStill({ serveUrl, composition: comp, frame: quadro, output: arq, imageFormat: 'png', puppeteerInstance: nav, inputProps: { semTexto } });
    }
    const a = lerRGB(FF, com, W, H), b = lerRGB(FF, sem, W, H);
    const marca = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const d = Math.max(Math.abs(a[i * 3] - b[i * 3]), Math.abs(a[i * 3 + 1] - b[i * 3 + 1]), Math.abs(a[i * 3 + 2] - b[i * 3 + 2]));
      if (d > 48) marca[i] = 1;
    }
    const ls: number[] = [];
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      let perto = 0;
      for (let dy = -2; dy <= 2 && !perto; dy++) for (let dx = -2; dx <= 2; dx++) if (marca[(y + dy) * W + x + dx]) { perto = 1; break; }
      if (!perto) continue;
      const i = (y * W + x) * 3;
      ls.push(0.2126 * lin(b[i]) + 0.7152 * lin(b[i + 1]) + 0.0722 * lin(b[i + 2]));
    }
    ls.sort((x, y) => x - y);
    const p95 = ls.length ? ls[Math.floor(ls.length * 0.95)] : 0;
    const razao = (Math.max(papel, p95) + 0.05) / (Math.min(papel, p95) + 0.05);
    const passa = ls.length > 0 && razao >= tema.contrasteMinimo;
    if (!passa) falhas++;
    console.log(`  ${c.id.padEnd(15)} ${String(ls.length).padStart(10)}        ${p95.toFixed(4)}         ${razao.toFixed(2).replace('.', ',').padStart(6)}:1   ${passa ? '✓' : '✗'}`);
  }
  void contraste;
  await nav.close({ silent: true });
  console.log('');
  if (falhas) falhar(`${falhas} cena(s) abaixo de ${tema.contrasteMinimo}:1 medidos sob as letras.`, 'veja out/contraste/<cena>-sem-texto.png e escureça o degradê/vidro ou mude o texto de lugar.');
  ok(`Todo texto sobre imagem passa de ${tema.contrasteMinimo}:1, medido nos pixels sob as letras.`);
};
principal().catch((e) => falhar(String(e instanceof Error ? e.stack : e)));
