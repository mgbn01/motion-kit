import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarReel } from '../scripts/novo.mjs';
import { RAIZ } from '../lib/ambiente.mjs';

function raizTemp() {
  const r = mkdtempSync(join(tmpdir(), 'motion-'));
  for (const p of ['modelo', 'marcas', 'node_modules/gsap']) if (existsSync(join(RAIZ, p))) cpSync(join(RAIZ, p), join(r, p), { recursive: true });
  return r;
}

// O reel V3 copia o modelo da camada e o runtime da motionmaxxing a partir da raiz. Sem isso o teste escreve no repo.
function raizTempV3() {
  const r = raizTemp();
  cpSync(join(RAIZ, 'v3-camada'), join(r, 'v3-camada'), { recursive: true });
  // O runtime vem do clone em ./v3 (fora do Git). Sem o clone, um runtime falso basta para o novo.
  if (existsSync(join(RAIZ, 'v3', 'runtime'))) cpSync(join(RAIZ, 'v3', 'runtime'), join(r, 'v3', 'runtime'), { recursive: true });
  else { mkdirSync(join(r, 'v3', 'runtime'), { recursive: true }); writeFileSync(join(r, 'v3', 'runtime', 'motion.js'), '// runtime falso para teste\n'); }
  return r;
}

test('cria a pasta do reel com tema da marca, logos e BRIEF', () => {
  const r = raizTemp();
  const pasta = criarReel({ marca: 'exemplo', slug: 'laudo-reforma', tipo: 'venda', data: '2026-10-10', raiz: r });
  assert.equal(pasta, join(r, 'reels', '2026-10-10-laudo-reforma'));
  const tema = readFileSync(join(pasta, 'tema.css'), 'utf8');
  assert.match(tema, /--fundo:\s*#14213D/);
  assert.match(tema, /@font-face\s*{[^}]*Archivo/);
  assert.ok(existsSync(join(pasta, 'assets', 'marca', 'logo-clara.svg')));
  assert.ok(existsSync(join(pasta, 'assets', 'vendor', 'gsap.min.js')));
  assert.match(readFileSync(join(pasta, 'BRIEF.md'), 'utf8'), /flow: automation/);
  assert.match(readFileSync(join(pasta, 'BRIEF.md'), 'utf8'), /^tipo: venda$/m);
  const html = readFileSync(join(pasta, 'index.html'), 'utf8');
  assert.match(html, /@marcaexemplo/);
  assert.match(html, /logo-clara\.svg/);
});

test('recusa pasta existente, slug inválido e marca sem kit', () => {
  const r = raizTemp();
  criarReel({ marca: 'exemplo', slug: 'haiku', tipo: 'viral', data: '2026-10-10', raiz: r });
  assert.throws(() => criarReel({ marca: 'exemplo', slug: 'haiku', tipo: 'viral', data: '2026-10-10', raiz: r }), /já existe/);
  assert.throws(() => criarReel({ marca: 'exemplo', slug: '../fora', tipo: 'viral', raiz: r }), /slug/);
  assert.throws(() => criarReel({ marca: 'inexistente', slug: 'x', tipo: 'viral', raiz: r }), /marca sem kit/);
  assert.throws(() => criarReel({ marca: 'exemplo', slug: 'sem-tipo', raiz: r }), /tipo/);
  assert.throws(() => criarReel({ marca: 'exemplo', slug: 'tipo-errado', tipo: 'institucional', raiz: r }), /tipo/);
});

test('novo --motor v3 cria reel em pé com runtime, tema e brief com motor e áudio', () => {
  const raiz = raizTempV3();
  const pasta = criarReel({ marca: 'exemplo', slug: 'teste-v3', tipo: 'viral', motor: 'v3', audio: 'musica', data: '2026-10-14', raiz });
  const html = readFileSync(join(pasta, 'index.html'), 'utf8');
  assert.match(html, /width: 1080, height: 1920/);
  assert.ok(existsSync(join(pasta, 'runtime', 'motion.js')));
  assert.ok(existsSync(join(pasta, 'tema.css')));
  assert.ok(existsSync(join(pasta, 'assets', 'marca', 'logo-clara.svg')));
  const cenas = JSON.parse(readFileSync(join(pasta, 'cenas.json'), 'utf8'));
  assert.equal(cenas.cenas[0].id, 'gancho');
  assert.match(cenas.cenas[0].compra, /\[PENDENTE\]/);
  const brief = readFileSync(join(pasta, 'BRIEF.md'), 'utf8');
  assert.match(brief, /^motor: v3$/m);
  assert.match(brief, /^audio: musica$/m);
});

test('novo recusa motor e áudio desconhecidos', () => {
  const raiz = raizTemp();
  assert.throws(() => criarReel({ marca: 'exemplo', slug: 'x', tipo: 'viral', motor: 'v9', raiz }), /motor inválido/);
  assert.throws(() => criarReel({ marca: 'exemplo', slug: 'x', tipo: 'viral', motor: 'v3', audio: 'alto', raiz }), /áudio inválido/);
  assert.ok(!existsSync(join(raiz, 'reels')));
});

test('novo sem motor continua criando V2 igual a antes', () => {
  const raiz = raizTemp();
  const pasta = criarReel({ marca: 'exemplo', slug: 'igual-v2', tipo: 'viral', data: '2026-10-14', raiz });
  const cenas = JSON.parse(readFileSync(join(pasta, 'cenas.json'), 'utf8'));
  assert.equal(cenas.bpm, 120);
  assert.equal(cenas.cenas[0].id, 'abertura');
  const brief = readFileSync(join(pasta, 'BRIEF.md'), 'utf8');
  assert.match(brief, /^tipo: viral$/m);
  assert.doesNotMatch(brief, /^motor: v3$/m);
  assert.doesNotMatch(brief, /^audio:/m);
  assert.ok(existsSync(join(pasta, 'assets', 'vendor', 'gsap.min.js')));
  assert.ok(!existsSync(join(pasta, 'runtime')));
});

test('novo --motor v3 sem o clone da motionmaxxing em ./v3 explica o que fazer', () => {
  const raiz = raizTemp();
  cpSync(join(RAIZ, 'v3-camada'), join(raiz, 'v3-camada'), { recursive: true });
  assert.throws(() => criarReel({ marca: 'exemplo', slug: 'sem-v3', tipo: 'viral', motor: 'v3', raiz }), /V3 não encontrada em \.\/v3/);
  assert.ok(!existsSync(join(raiz, 'reels')));
});
