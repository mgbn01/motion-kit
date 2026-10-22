import nodePath, { basename, join, resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { RAIZ, lerEnv, rodar } from '../lib/ambiente.mjs';
import { hashReel } from '../lib/relatorio.mjs';
import { validarCenas } from '../lib/cenas.mjs';
import { validarCenasV3, avaliarGates, rodarV3 } from '../lib/v3.mjs';
import { rodarHyperframes } from './verificar.mjs';

export function podeEntregar(pasta) {
  const arq = join(pasta, 'verificacao.json');
  if (!existsSync(arq)) return { ok: false, motivo: 'rode npm run verificar antes de entregar' };
  const v = JSON.parse(readFileSync(arq, 'utf8'));
  if (!v.aprovado) return { ok: false, motivo: 'a última verificação foi reprovada' };
  if (v.hash !== hashReel(pasta)) return { ok: false, motivo: 'o reel mudou depois da última verificação: rode npm run verificar de novo' };
  return { ok: true };
}

// Pasta de entrega: PASTA_ENTREGA do .env (absoluta, relativa à raiz do repositório ou começando com ~/);
// sem ela, entregas/ na raiz do repositório (fora do Git).
export function pastaDeEntrega(env, nome, { raiz = RAIZ, home = homedir(), p = nodePath } = {}) {
  const dir = (env.PASTA_ENTREGA || '').trim();
  if (!dir) return p.join(raiz, 'entregas', nome);
  const base = /^~[\\/]/.test(dir) ? p.join(home, dir.slice(2)) : p.resolve(raiz, dir);
  return p.join(base, nome);
}

export const duracaoValida = (s) => s >= 14.95 && s <= 30.05;

function campoDoBrief(pasta, campo) {
  const arq = join(pasta, 'BRIEF.md');
  if (!existsSync(arq)) return null;
  const m = readFileSync(arq, 'utf8').match(new RegExp(`^${campo}:\\s*([a-z0-9-]+)`, 'm'));
  return m ? m[1] : null;
}

export async function entregarV3(pasta, { rodar: rodarScript = rodarV3, rodarCmd = rodar, env = lerEnv(join(RAIZ, '.env')), raiz = RAIZ } = {}) {
  const pode = podeEntregar(pasta);
  if (!pode.ok) throw new Error(pode.motivo);
  const audio = campoDoBrief(pasta, 'audio') || 'sem';
  const tipo = campoDoBrief(pasta, 'tipo');
  const comAudio = audio === 'musica' || audio === 'locucao';
  if (comAudio && !existsSync(join(pasta, 'audio', 'mix.wav'))) throw new Error(`falta audio/mix.wav (áudio escolhido: ${audio})`);
  if (!existsSync(join(pasta, 'NOTE.md'))) throw new Error('falta NOTE.md (relato com os números dos gates)');
  if (!existsSync(join(pasta, 'legenda.txt'))) throw new Error('falta legenda.txt (o texto do post que vai junto com o vídeo)');

  const doc = JSON.parse(readFileSync(join(pasta, 'cenas.json'), 'utf8'));
  const c = validarCenasV3(doc);
  if (!c.ok) throw new Error(c.erros.join('; '));

  const t0 = Date.now();
  const argsRender = ['index.html', 'renders/reel-1080.mp4'];
  if (comAudio) argsRender.push('--audio', 'audio/mix.wav');
  const r = await rodarScript('render.mjs', argsRender, { cwd: pasta });
  if (r.codigo !== 0) throw new Error(`render falhou: ${(r.erro || r.saida).slice(-400)}`);
  const segundosRender = Math.round((Date.now() - t0) / 1000);

  // Nunca aproveitar a revisão de um render anterior.
  rmSync(join(pasta, 'quadros-final'), { recursive: true, force: true });
  const argsLook = ['renders/reel-1080.mp4', '--out', 'quadros-final', '--expect', String(c.duracao)];
  if (comAudio) argsLook.push('--expect-audio');
  const look = await rodarScript('look.py', argsLook, { cwd: pasta });
  if (look.codigo !== 0) throw new Error(`look falhou: ${(look.erro || look.saida).trim().slice(-400)}`);
  const gatesArq = join(pasta, 'quadros-final', 'gates.json');
  if (!existsSync(gatesArq)) throw new Error(`look não devolveu gates.json: ${(look.erro || look.saida).trim().slice(-400)}`);
  let gates = null;
  try { gates = JSON.parse(readFileSync(gatesArq, 'utf8')); } catch { gates = null; }
  if (!gates) throw new Error('look não devolveu gates.json: JSON inválido');
  const av = avaliarGates(gates);
  if (av.falhas.length) throw new Error(av.falhas.join('; '));

  const v1080 = join(pasta, 'renders', 'reel-1080.mp4');
  const pr = await rodarCmd('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v1080], { cwd: pasta });
  const dur = Number(pr.saida.trim());
  if (!duracaoValida(dur)) throw new Error(`o vídeo saiu com ${String(dur).replace('.', ',')} s; precisa ter de 15 a 30 s`);
  const v720 = join(pasta, 'renders', 'reel-720.mp4');
  const f = await rodarCmd('ffmpeg', ['-y', '-i', v1080, '-vf', 'scale=720:-2', '-c:v', 'libx264', '-crf', '24', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', v720], { cwd: pasta });
  if (f.codigo !== 0) throw new Error(`ffmpeg falhou: ${(f.erro || '').slice(-300)}`);
  let semAudio = null;
  if (tipo === 'viral' && comAudio) {
    semAudio = join(pasta, 'renders', 'reel-1080-sem-audio.mp4');
    const s = await rodarCmd('ffmpeg', ['-y', '-i', v1080, '-c:v', 'copy', '-an', semAudio], { cwd: pasta });
    if (s.codigo !== 0) throw new Error(`ffmpeg falhou: ${(s.erro || '').slice(-300)}`);
  }
  const tempos = { bpm: doc.bpm ?? 120, duracao: c.duracao, cenas: c.cenas.map(({ id, inicio, fim, texto, compra }) => ({ id, inicio, fim, texto, compra })) };
  mkdirSync(join(pasta, 'renders'), { recursive: true });
  writeFileSync(join(pasta, 'renders', 'tempos.json'), JSON.stringify(tempos, null, 2));

  const destino = pastaDeEntrega(env, basename(pasta), { raiz });
  mkdirSync(destino, { recursive: true });
  const arquivos = [];
  for (const [de, nome] of [[v1080, 'reel-1080.mp4'], [v720, 'reel-720.mp4'], [semAudio, 'reel-1080-sem-audio.mp4'], [join(pasta, 'renders', 'tempos.json'), 'tempos.json'], [join(pasta, 'quadros-final', 'sheet.jpg'), 'sheet.jpg'], [join(pasta, 'NOTE.md'), 'NOTE.md'], [join(pasta, 'legenda.txt'), 'legenda.txt']]) {
    if (de && existsSync(de)) { copyFileSync(de, join(destino, nome)); arquivos.push(join(destino, nome)); }
  }
  writeFileSync(join(pasta, 'entrega.json'), JSON.stringify({ destino, arquivos, segundosRender, quando: new Date().toISOString() }, null, 2));
  return { arquivos, destino, segundosRender };
}

export async function entregarReel(pasta, { rodarHf = rodarHyperframes, rodarCmd = rodar, rodarV3: rodarV3fn = rodarV3, env = lerEnv(join(RAIZ, '.env')), raiz = RAIZ } = {}) {
  if (campoDoBrief(pasta, 'motor') === 'v3') return entregarV3(pasta, { rodar: rodarV3fn, rodarCmd, env, raiz });
  const pode = podeEntregar(pasta);
  if (!pode.ok) throw new Error(pode.motivo);
  const t0 = Date.now();
  const r = await rodarHf(['render', '.', '-q', 'delivery', '--fps', '30', '-o', 'renders/reel-1080.mp4'], pasta);
  if (r.codigo !== 0) throw new Error(`render falhou: ${(r.erro || r.saida).slice(-400)}`);
  const segundosRender = Math.round((Date.now() - t0) / 1000);
  const v1080 = join(pasta, 'renders', 'reel-1080.mp4');
  const pr = await rodarCmd('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v1080], { cwd: pasta });
  const dur = Number(pr.saida.trim());
  if (!duracaoValida(dur)) throw new Error(`o vídeo saiu com ${String(dur).replace('.', ',')} s; precisa ter de 15 a 30 s`);
  const f = await rodarCmd('ffmpeg', ['-y', '-i', v1080, '-vf', 'scale=720:-2', '-c:v', 'libx264', '-crf', '24', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', join(pasta, 'renders', 'reel-720.mp4')], { cwd: pasta });
  if (f.codigo !== 0) throw new Error(`ffmpeg falhou: ${(f.erro || '').slice(-300)}`);
  const doc = JSON.parse(readFileSync(join(pasta, 'cenas.json'), 'utf8'));
  const c = validarCenas(doc);
  const tempos = { bpm: doc.bpm ?? 120, duracao: c.duracao, cenas: c.cenas.map(({ id, inicio, fim, texto }) => ({ id, inicio, fim, texto })) };
  writeFileSync(join(pasta, 'renders', 'tempos.json'), JSON.stringify(tempos, null, 2));
  const destino = pastaDeEntrega(env, basename(pasta), { raiz });
  mkdirSync(destino, { recursive: true });
  const arquivos = [];
  const dirQuadros = join(pasta, 'quadros');
  const folhas = existsSync(dirQuadros) ? readdirSync(dirQuadros).filter((f) => /^contact-sheet.*\.jpg$/.test(f)).sort() : [];
  for (const [de, nome] of [[v1080, 'reel-1080.mp4'], [join(pasta, 'renders', 'reel-720.mp4'), 'reel-720.mp4'], [join(pasta, 'renders', 'tempos.json'), 'tempos.json'], ...folhas.map((f) => [join(dirQuadros, f), f])]) {
    if (existsSync(de)) { copyFileSync(de, join(destino, nome)); arquivos.push(join(destino, nome)); }
  }
  writeFileSync(join(pasta, 'entrega.json'), JSON.stringify({ destino, arquivos, segundosRender, quando: new Date().toISOString() }, null, 2));
  return { arquivos, destino, segundosRender };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const r = await entregarReel(resolve(process.argv[2] || '.'));
    console.log(`Entregue em ${r.destino} (render em ${r.segundosRender} s)`);
    for (const a of r.arquivos) console.log(`  ${a}`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
