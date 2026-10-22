import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { podeEntregar, pastaDeEntrega, duracaoValida, entregarReel } from '../scripts/entregar.mjs';
import { hashReel } from '../lib/relatorio.mjs';
import { RAIZ } from '../lib/ambiente.mjs';
import { criarReel } from '../scripts/novo.mjs';

function pastaReel() {
  const p = mkdtempSync(join(tmpdir(), 'motion-'));
  writeFileSync(join(p, 'index.html'), '<div id="root" data-duration="16"></div>');
  writeFileSync(join(p, 'cenas.json'), JSON.stringify({ bpm: 120, cenas: [{ id: 'a', duracao: 8, transicao: 'corte', texto: 'x' }, { id: 'b', duracao: 8, transicao: 'dissolve', texto: 'y' }] }));
  writeFileSync(join(p, 'tema.css'), ':root{}');
  return p;
}
const aprovar = (p) => writeFileSync(join(p, 'verificacao.json'), JSON.stringify({ aprovado: true, hash: hashReel(p) }));

test('recusa sem verificação, reprovada ou desatualizada (Review Focus 3)', () => {
  const p = pastaReel();
  assert.match(podeEntregar(p).motivo, /verificar/);
  writeFileSync(join(p, 'verificacao.json'), JSON.stringify({ aprovado: false, hash: hashReel(p) }));
  assert.match(podeEntregar(p).motivo, /reprovad/);
  aprovar(p);
  assert.equal(podeEntregar(p).ok, true);
  writeFileSync(join(p, 'index.html'), '<div id="root" data-duration="16">mudou</div>');
  assert.match(podeEntregar(p).motivo, /mudou depois/);
});

test('pasta de entrega com espaço e acento no Windows (Review Focus 2)', () => {
  const win = { raiz: 'C:\\motion-kit', home: 'C:\\Users\\Pessoa', p: path.win32 };
  assert.equal(pastaDeEntrega({ PASTA_ENTREGA: 'D:\\Vídeos\\Área de reels' }, '2026-10-10-x', win), 'D:\\Vídeos\\Área de reels\\2026-10-10-x');
  assert.equal(pastaDeEntrega({}, '2026-10-10-x', win), 'C:\\motion-kit\\entregas\\2026-10-10-x');
});

test('duração entre 15 e 30 s', () => {
  assert.equal(duracaoValida(16.02), true);
  assert.equal(duracaoValida(14.5), false);
  assert.equal(duracaoValida(31), false);
});

test('entrega chama render, ffprobe e ffmpeg e copia os arquivos', async () => {
  const p = pastaReel(); aprovar(p);
  mkdirSync(join(p, 'quadros')); writeFileSync(join(p, 'quadros', 'contact-sheet.jpg'), 'jpg');
  const destinoBase = mkdtempSync(join(tmpdir(), 'entrega-'));
  const rodarHf = async (args, cwd) => { mkdirSync(join(cwd, 'renders'), { recursive: true }); writeFileSync(join(cwd, 'renders', 'reel-1080.mp4'), 'mp4'); return { codigo: 0, saida: '', erro: '' }; };
  const rodarCmd = async (bin, args, { cwd }) => {
    if (bin === 'ffprobe') return { codigo: 0, saida: '16.0\n', erro: '' };
    writeFileSync(join(cwd, 'renders', 'reel-720.mp4'), 'mp4'); return { codigo: 0, saida: '', erro: '' };
  };
  const r = await entregarReel(p, { rodarHf, rodarCmd, env: { PASTA_ENTREGA: destinoBase } });
  for (const f of ['reel-1080.mp4', 'reel-720.mp4', 'tempos.json', 'contact-sheet.jpg']) assert.ok(existsSync(join(r.destino, f)), f);
  assert.equal(JSON.parse(readFileSync(join(r.destino, 'tempos.json'), 'utf8')).cenas[1].inicio, 8);
});

test('entrega recusa vídeo com duração errada', async () => {
  const p = pastaReel(); aprovar(p);
  const rodarHf = async (args, cwd) => { mkdirSync(join(cwd, 'renders'), { recursive: true }); writeFileSync(join(cwd, 'renders', 'reel-1080.mp4'), 'mp4'); return { codigo: 0, saida: '', erro: '' }; };
  const rodarCmd = async () => ({ codigo: 0, saida: '9.5\n', erro: '' });
  await assert.rejects(entregarReel(p, { rodarHf, rodarCmd, env: { PASTA_ENTREGA: tmpdir() } }), /9,5 s/);
});

test('entrega copia todas as folhas de quadros (I7)', async () => {
  const p = pastaReel(); aprovar(p);
  mkdirSync(join(p, 'quadros'));
  for (const f of ['contact-sheet-1.jpg', 'contact-sheet-2.jpg']) writeFileSync(join(p, 'quadros', f), 'jpg');
  aprovar(p);
  const destinoBase = mkdtempSync(join(tmpdir(), 'entrega-'));
  const rodarHf = async (args, cwd) => { mkdirSync(join(cwd, 'renders'), { recursive: true }); writeFileSync(join(cwd, 'renders', 'reel-1080.mp4'), 'mp4'); return { codigo: 0, saida: '', erro: '' }; };
  const rodarCmd = async (bin, args, { cwd }) => bin === 'ffprobe' ? { codigo: 0, saida: '16.0\n', erro: '' } : (writeFileSync(join(cwd, 'renders', 'reel-720.mp4'), 'mp4'), { codigo: 0, saida: '', erro: '' });
  const r = await entregarReel(p, { rodarHf, rodarCmd, env: { PASTA_ENTREGA: destinoBase } });
  assert.ok(existsSync(join(r.destino, 'contact-sheet-1.jpg')));
  assert.ok(existsSync(join(r.destino, 'contact-sheet-2.jpg')));
});

test('PASTA_ENTREGA aceita caminho relativo à raiz e ~/; sem ela, entregas/ na raiz', () => {
  const nix = { raiz: '/repo', home: '/home/p', p: path.posix };
  assert.equal(pastaDeEntrega({}, 'x', nix), '/repo/entregas/x');
  assert.equal(pastaDeEntrega({ PASTA_ENTREGA: '  ' }, 'x', nix), '/repo/entregas/x');
  assert.equal(pastaDeEntrega({ PASTA_ENTREGA: 'saida/reels' }, 'x', nix), '/repo/saida/reels/x');
  assert.equal(pastaDeEntrega({ PASTA_ENTREGA: '~/Videos/reels' }, 'x', nix), '/home/p/Videos/reels/x');
  assert.equal(pastaDeEntrega({ PASTA_ENTREGA: '/mnt/videos' }, 'x', nix), '/mnt/videos/x');
});

function raizTempV3() {
  const r = mkdtempSync(join(tmpdir(), 'motion-'));
  for (const p of ['modelo', 'marcas', 'node_modules/gsap']) if (existsSync(join(RAIZ, p))) cpSync(join(RAIZ, p), join(r, p), { recursive: true });
  cpSync(join(RAIZ, 'v3-camada'), join(r, 'v3-camada'), { recursive: true });
  // O runtime vem do clone da motionmaxxing em ./v3 (fora do Git). Sem o clone, um runtime falso basta para o novo.
  if (existsSync(join(RAIZ, 'v3', 'runtime'))) cpSync(join(RAIZ, 'v3', 'runtime'), join(r, 'v3', 'runtime'), { recursive: true });
  else { mkdirSync(join(r, 'v3', 'runtime'), { recursive: true }); writeFileSync(join(r, 'v3', 'runtime', 'motion.js'), '// runtime falso para teste\n'); }
  return r;
}

function reelV3Aprovado({ audio = 'sem', tipo = 'viral', nota = true, legenda = true, comMix = false, slug = 'entrega-v3' } = {}) {
  const pasta = criarReel({ marca: 'exemplo', slug, tipo, motor: 'v3', audio, data: '2026-10-14', raiz: raizTempV3() });
  writeFileSync(join(pasta, 'cenas.json'), JSON.stringify({ cenas: [
    { id: 'a', duracao: 8, texto: 'x', compra: 'gancho' },
    { id: 'b', duracao: 8, texto: 'y', compra: 'fecho' },
  ] }));
  if (comMix) { mkdirSync(join(pasta, 'audio'), { recursive: true }); writeFileSync(join(pasta, 'audio', 'mix.wav'), 'wav'); }
  if (nota) writeFileSync(join(pasta, 'NOTE.md'), 'G0 pass. G2 pass. G3 pass.\n');
  if (legenda) writeFileSync(join(pasta, 'legenda.txt'), 'Legenda do post. Qual desses mora na sua empresa?\n');
  writeFileSync(join(pasta, 'verificacao.json'), JSON.stringify({ aprovado: true, hash: hashReel(pasta) }));
  return pasta;
}

const semRenderReal = {
  rodarHf: async () => ({ codigo: 0, saida: '', erro: '' }),
  rodarCmd: async () => ({ codigo: 0, saida: '16.0\n', erro: '' }),
};

test('entregar V3 recusa áudio escolhido sem mix.wav, antes do render', async () => {
  const pasta = reelV3Aprovado({ audio: 'locucao' });
  let renderizou = false;
  await assert.rejects(entregarReel(pasta, {
    ...semRenderReal,
    rodarV3: async () => { renderizou = true; return { codigo: 0, saida: '', erro: '' }; },
    rodarHf: async () => { renderizou = true; return { codigo: 0, saida: '', erro: '' }; },
  }), /falta audio\/mix.wav/);
  assert.equal(renderizou, false);
});

test('entregar V3 recusa sem NOTE.md', async () => {
  const pasta = reelV3Aprovado({ audio: 'sem', nota: false });
  await assert.rejects(entregarReel(pasta, {
    ...semRenderReal,
    rodarV3: async () => ({ codigo: 0, saida: '', erro: '' }),
  }), /falta NOTE.md/);
});

test('entregar V3 recusa sem legenda.txt (o post sai com a legenda)', async () => {
  const pasta = reelV3Aprovado({ audio: 'sem', legenda: false });
  await assert.rejects(entregarReel(pasta, {
    ...semRenderReal,
    rodarV3: async () => ({ codigo: 0, saida: '', erro: '' }),
  }), /falta legenda.txt/);
});

test('entregar V3 recusa reel mudado depois da verificação', async () => {
  const pasta = reelV3Aprovado({ audio: 'sem' });
  writeFileSync(join(pasta, 'index.html'), readFileSync(join(pasta, 'index.html'), 'utf8') + '\n<!-- mudou -->\n');
  let renderizou = false;
  await assert.rejects(entregarReel(pasta, {
    rodarV3: async () => { renderizou = true; return { codigo: 0, saida: '', erro: '' }; },
    rodarHf: async () => { renderizou = true; return { codigo: 0, saida: '', erro: '' }; },
  }), /mudou depois/);
  assert.equal(renderizou, false);
});

test('entregar V3 recusa gate FAIL do look', async () => {
  const pasta = reelV3Aprovado({ audio: 'sem' });
  const rodarV3 = async (script, args, { cwd }) => {
    if (script === 'render.mjs') { mkdirSync(join(cwd, 'renders'), { recursive: true }); writeFileSync(join(cwd, 'renders', 'reel-1080.mp4'), 'mp4'); }
    if (script === 'look.py') {
      mkdirSync(join(cwd, 'quadros-final'), { recursive: true });
      writeFileSync(join(cwd, 'quadros-final', 'gates.json'), JSON.stringify({ gates: [
        { id: 'G0', status: 'PASS', detail: '' }, { id: 'G3', status: 'FAIL', detail: 'end hold 2.1 s' },
      ] }));
    }
    return { codigo: 0, saida: '', erro: '' };
  };
  await assert.rejects(entregarReel(pasta, { ...semRenderReal, rodarV3, env: { PASTA_ENTREGA: mkdtempSync(join(tmpdir(), 'entrega-')) } }), /end hold 2\.1 s/);
});

test('entregar V3 não aproveita gates.json velho quando o look falha', async () => {
  const pasta = reelV3Aprovado({ audio: 'sem' });
  mkdirSync(join(pasta, 'quadros-final'), { recursive: true });
  writeFileSync(join(pasta, 'quadros-final', 'gates.json'), JSON.stringify({ gates: [
    { id: 'G0', status: 'PASS' }, { id: 'G2', status: 'PASS' }, { id: 'G3', status: 'PASS' } ] }));
  const rodarV3 = async (script, args, { cwd }) => {
    if (script === 'render.mjs') { mkdirSync(join(cwd, 'renders'), { recursive: true }); writeFileSync(join(cwd, 'renders', 'reel-1080.mp4'), 'mp4'); return { codigo: 0, saida: '', erro: '' }; }
    return { codigo: 1, saida: '', erro: 'look quebrou' };
  };
  await assert.rejects(entregarReel(pasta, { ...semRenderReal, rodarV3, env: { PASTA_ENTREGA: mkdtempSync(join(tmpdir(), 'entrega-')) } }), /look/);
});

test('entregar V3 viral com música entrega também a versão sem áudio', async () => {
  const pasta = reelV3Aprovado({ audio: 'musica', tipo: 'viral', comMix: true });
  const destinoBase = mkdtempSync(join(tmpdir(), 'entrega-'));
  const chamadas = [];
  const rodarV3 = async (script, args, { cwd }) => {
    chamadas.push([script, args]);
    if (script === 'render.mjs') { mkdirSync(join(cwd, 'renders'), { recursive: true }); writeFileSync(join(cwd, 'renders', 'reel-1080.mp4'), 'mp4'); }
    if (script === 'look.py') {
      mkdirSync(join(cwd, 'quadros-final'), { recursive: true });
      writeFileSync(join(cwd, 'quadros-final', 'gates.json'), JSON.stringify({ gates: [
        { id: 'G0', status: 'PASS', detail: 'ok' }, { id: 'G2', status: 'PASS', detail: 'ok' }, { id: 'G3', status: 'PASS', detail: 'ok' },
      ] }));
      writeFileSync(join(cwd, 'quadros-final', 'sheet.jpg'), 'jpg');
    }
    return { codigo: 0, saida: '', erro: '' };
  };
  const rodarCmd = async (bin, args, { cwd }) => {
    if (bin === 'ffprobe') return { codigo: 0, saida: '16.0\n', erro: '' };
    if (args.includes('-an')) { writeFileSync(join(cwd, 'renders', 'reel-1080-sem-audio.mp4'), 'mp4'); return { codigo: 0, saida: '', erro: '' }; }
    writeFileSync(join(cwd, 'renders', 'reel-720.mp4'), 'mp4');
    return { codigo: 0, saida: '', erro: '' };
  };
  const r = await entregarReel(pasta, { rodarV3, rodarCmd, rodarHf: async () => { throw new Error('caminho V2'); }, env: { PASTA_ENTREGA: destinoBase } });
  assert.ok(r.arquivos.some((a) => a.endsWith('reel-1080-sem-audio.mp4')));
  assert.ok(existsSync(join(r.destino, 'NOTE.md')));
  assert.ok(existsSync(join(r.destino, 'legenda.txt')));
  assert.ok(existsSync(join(r.destino, 'sheet.jpg')));
  const render = chamadas.find(([s]) => s === 'render.mjs');
  assert.ok(render[1].includes('--audio') && render[1].includes('audio/mix.wav'));
  const look = chamadas.find(([s]) => s === 'look.py');
  assert.ok(look[1].includes('--out') && look[1][look[1].indexOf('--out') + 1] === 'quadros-final');
  assert.ok(look[1].includes('--expect-audio'));
  assert.equal(look[1][look[1].indexOf('--expect') + 1], '16');
  assert.equal(podeEntregar(pasta).ok, true);
});

test('a versão 720p mantém o áudio do reel (locução)', async () => {
  const p = pastaReel(); aprovar(p);
  const rodarHf = async (args, cwd) => { mkdirSync(join(cwd, 'renders'), { recursive: true }); writeFileSync(join(cwd, 'renders', 'reel-1080.mp4'), 'mp4'); return { codigo: 0, saida: '', erro: '' }; };
  let argsFfmpeg = null;
  const rodarCmd = async (bin, args, { cwd }) => bin === 'ffprobe' ? { codigo: 0, saida: '16.0\n', erro: '' } : (argsFfmpeg = args, writeFileSync(join(cwd, 'renders', 'reel-720.mp4'), 'mp4'), { codigo: 0, saida: '', erro: '' });
  await entregarReel(p, { rodarHf, rodarCmd, env: { PASTA_ENTREGA: mkdtempSync(join(tmpdir(), 'entrega-')) } });
  assert.ok(!argsFfmpeg.includes('-an'), 'não pode descartar o áudio');
  assert.deepEqual(argsFfmpeg.slice(argsFfmpeg.indexOf('-c:a'), argsFfmpeg.indexOf('-c:a') + 2), ['-c:a', 'aac']);
});
