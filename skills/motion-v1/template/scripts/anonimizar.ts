/**
 * Anonimiza prints antes de entrarem no filme. O original fica em entrada-bruta/
 * (fora do public/, então nunca vai para o bundle do Remotion).
 *
 *   npm run anonimizar -- --grade entrada-bruta/painel.png
 *       → entrada-bruta/painel.grade.png com grade de 100 px para ler coordenadas
 *
 *   npm run anonimizar -- entrada-bruta/painel.png
 *       → lê entrada-bruta/painel.regioes.json e grava public/telas/painel.png
 *
 * painel.regioes.json:
 *   { "recorte": { "x": 0, "y": 0, "w": 1600, "h": 1000 },          (opcional)
 *     "regioes": [ { "x": 120, "y": 340, "w": 400, "h": 40, "modo": "tarja" },
 *                  { "x": 900, "y": 200, "w": 300, "h": 300, "modo": "borrar" } ] }
 * Coordenadas em px do print ORIGINAL. "tarja" (preenchimento sólido) é o padrão
 * para nome, telefone, e-mail e valores. "borrar" é para áreas grandes.
 *
 * Depois de gerar, MOSTRE o print anonimizado ao responsável pela marca e espere o ok.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { tema } from '../src/tema';
import { argumento, caminho, falhar, ffmpegDoSistema, ok, passo, rodar } from './_comum';

type Regiao = { x: number; y: number; w: number; h: number; modo?: 'tarja' | 'borrar' };
const FF = ffmpegDoSistema();

const gradeArg = argumento('grade');
const alvo = gradeArg && gradeArg !== 'sim' ? gradeArg : process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!alvo) falhar('Informe o print.', 'npm run anonimizar -- entrada-bruta/arquivo.png');
const entrada = path.resolve(alvo as string);
if (!existsSync(entrada)) falhar(`Não achei ${alvo}.`);
const base = entrada.replace(/\.[^.]+$/, '');

if (gradeArg) {
  passo('Gerando grade de coordenadas');
  rodar(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', entrada, '-vf',
    'drawgrid=w=100:h=100:t=1:c=red@0.45,drawgrid=w=500:h=500:t=3:c=red@0.8', '-frames:v', '1', `${base}.grade.png`]);
  ok(`${path.relative(caminho(), base)}.grade.png — linhas finas a cada 100 px, grossas a cada 500 px`);
  process.exit(0);
}

const arqRegioes = `${base}.regioes.json`;
if (!existsSync(arqRegioes)) falhar(`Falta ${path.relative(caminho(), arqRegioes)}.`, 'gere a grade (--grade), marque as regiões e salve o JSON.');
const cfg = JSON.parse(readFileSync(arqRegioes, 'utf8')) as { recorte?: Regiao; regioes: Regiao[] };

passo(`Anonimizando ${path.basename(entrada)}: ${cfg.regioes.length} região(ões)`);
const partes: string[] = [];
let atual = '0:v';
const cinza = tema.cores.tinta.hex.replace('#', '0x');
cfg.regioes.forEach((r, i) => {
  const prox = `p${i}`;
  if ((r.modo ?? 'tarja') === 'tarja') {
    partes.push(`[${atual}]drawbox=x=${r.x}:y=${r.y}:w=${r.w}:h=${r.h}:color=${cinza}@1:t=fill[${prox}]`);
  } else {
    partes.push(`[${atual}]split[b${i}][c${i}];[c${i}]crop=${r.w}:${r.h}:${r.x}:${r.y},gblur=sigma=40:steps=4,gblur=sigma=40:steps=4[d${i}];[b${i}][d${i}]overlay=${r.x}:${r.y}[${prox}]`);
  }
  atual = prox;
});
if (cfg.recorte) {
  const r = cfg.recorte;
  partes.push(`[${atual}]crop=${r.w}:${r.h}:${r.x}:${r.y}[rec]`);
  atual = 'rec';
}
mkdirSync(caminho('public/telas'), { recursive: true });
const saida = caminho('public/telas', `${path.basename(base)}.png`);
const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', entrada];
if (partes.length) args.push('-filter_complex', partes.join(';'), '-map', `[${atual}]`);
args.push('-map_metadata', '-1', '-frames:v', '1', saida);
rodar(FF, args);
ok(`${path.relative(caminho(), saida)} — mostre ao responsável pela marca antes de usar no tema`);
