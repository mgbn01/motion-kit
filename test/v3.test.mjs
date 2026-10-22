import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RAIZ } from '../lib/ambiente.mjs';
import { criarReel } from '../scripts/novo.mjs';
import { verificarReel } from '../scripts/verificar.mjs';
import { validarCenasV3, duracaoDoFilme, filtrarLint, avaliarGates, caminhoV3 } from '../lib/v3.mjs';

// JSON real do `lint.mjs --json`: rules[].id, rules[].hits[].text, rules[].hits[].sev, gate.
// Conferido em v3/examples/demo/index.html do clone da motionmaxxing (amostra --times 1; o demo passou sem achados).

function raizTempV3() {
  const r = mkdtempSync(join(tmpdir(), 'motion-'));
  for (const p of ['modelo', 'marcas', 'node_modules/gsap']) if (existsSync(join(RAIZ, p))) cpSync(join(RAIZ, p), join(r, p), { recursive: true });
  cpSync(join(RAIZ, 'v3-camada'), join(r, 'v3-camada'), { recursive: true });
  // O runtime vem do clone da motionmaxxing em ./v3 (fora do Git). Sem o clone, um runtime falso basta para o novo.
  if (existsSync(join(RAIZ, 'v3', 'runtime'))) cpSync(join(RAIZ, 'v3', 'runtime'), join(r, 'v3', 'runtime'), { recursive: true });
  else { mkdirSync(join(r, 'v3', 'runtime'), { recursive: true }); writeFileSync(join(r, 'v3', 'runtime', 'motion.js'), '// runtime falso para teste\n'); }
  return r;
}

const cenas15 = { cenas: [
  { id: 'gancho', duracao: 8, texto: 'abre', compra: 'o gancho' },
  { id: 'fecho', duracao: 7, texto: 'fecha', compra: 'a marca' },
] };

function reelV3({ marca = 'exemplo', tipo = 'viral', slug = 'v3' } = {}) {
  const pasta = criarReel({ marca, slug, tipo, motor: 'v3', audio: 'sem', data: '2026-10-14', raiz: raizTempV3() });
  writeFileSync(join(pasta, 'cenas.json'), JSON.stringify(cenas15));
  return pasta;
}

const marcaRegistro = () => ({ proibidos: ['Fulano Proibido', 'REG 9999-F'], permitidosVenda: ['REG 9999-F'] });

function rodarPass(lintRel) {
  const chamadas = [];
  const rodarV3 = async (script, args, { cwd } = {}) => {
    chamadas.push([script, args]);
    if (script === 'look.py') {
      mkdirSync(join(cwd, 'quadros'), { recursive: true });
      writeFileSync(join(cwd, 'quadros', 'gates.json'), JSON.stringify({ gates: [
        { id: 'G0', status: 'PASS', detail: 'ok' },
        { id: 'G2', status: 'PASS', detail: 'ok' },
        { id: 'G3', status: 'PASS', detail: 'ok' },
      ] }));
      writeFileSync(join(cwd, 'quadros', 'sheet.jpg'), 'jpg');
    }
    if (script === 'lint.mjs') return { codigo: 0, saida: JSON.stringify(lintRel || { gate: 'PASS', rules: [], failed: [] }), erro: '' };
    return { codigo: 0, saida: '', erro: '' };
  };
  return { rodarV3, chamadas };
}

const lintLimpo = { gate: 'PASS', rules: [], failed: [] };

test('validarCenasV3 exige compra em cada cena e duração de 15 a 30 s', () => {
  const ok = validarCenasV3({ cenas: [{ id: 'a', duracao: 8, texto: 'x', compra: 'y' }, { id: 'b', duracao: 8, texto: 'z', compra: 'w' }] });
  assert.equal(ok.ok, true); assert.equal(ok.duracao, 16);
  assert.equal(ok.cenas[1].inicio, 8);
  const sem = validarCenasV3({ cenas: [{ id: 'a', duracao: 16, texto: 'x' }] });
  assert.match(sem.erros.join(' '), /compra/);
  assert.match(validarCenasV3({ cenas: [{ id: 'a', duracao: 5, texto: 'x', compra: 'y' }] }).erros.join(' '), /15 a 30/);
});

test('duracaoDoFilme lê o Motion.film', () => {
  assert.equal(duracaoDoFilme('const M = Motion.film({ fps: 30, duration: 18.5, width: 1080 });'), 18.5);
  assert.equal(duracaoDoFilme('<html></html>'), null);
});

test('filtrarLint ignora o registro liberado e reprova o resto', () => {
  const rel = { gate: 'FAIL', failed: ['C1', 'C3'], rules: [
    { id: 'C1', name: 'corner/edge micro-label', status: 'FAIL', hits: [{ text: 'REG 12345-F', sev: 'FAIL' }] },
    { id: 'C3', name: 'chapter / counter index', status: 'FAIL', hits: [{ text: '02 / FALA', sev: 'FAIL' }] },
    { id: 'C5', name: 'mono micro-label', status: 'WARN', hits: [{ text: 'nota', sev: 'WARN' }] },
  ] };
  const r = filtrarLint(rel, ['REG 12345-F']);
  assert.deepEqual(r.falhas, ['G5 C3: 02 / FALA']);
  assert.deepEqual(r.avisos, ['G5 C5: nota']);
});

test('avaliarGates reprova FAIL e deixa o resto passar', () => {
  const r = avaliarGates({ gates: [ { id: 'G0', status: 'PASS', detail: '' }, { id: 'G2', status: 'PASS', detail: '' }, { id: 'G3', status: 'FAIL', detail: 'end hold 2.1 s' } ] });
  assert.deepEqual(r.falhas, ['G3: end hold 2.1 s']);
  assert.deepEqual(r.avisos, []);
});

test('verificar V3: venda sem o registro profissional reprova', async () => {
  const pasta = reelV3({ tipo: 'venda', slug: 'venda-sem-registro' });
  const { rodarV3, chamadas } = rodarPass(lintLimpo);
  let hf = 0;
  const r = await verificarReel(pasta, { carregar: marcaRegistro, rodarV3, rodarHf: async () => { hf++; return { codigo: 0, saida: '{}', erro: '' }; } });
  assert.equal(hf, 0);
  assert.ok(chamadas.some(([s]) => s === 'lint.mjs'));
  assert.ok(r.falhas.some((f) => /anúncio de venda sem o registro profissional na tela/.test(f)), r.falhas.join('; '));
  assert.equal(r.aprovado, false);
});

test('verificar V3: registro na venda acusado de etiqueta pelo lint não reprova', async () => {
  const pasta = reelV3({ tipo: 'venda', slug: 'venda-com-registro' });
  const html = readFileSync(join(pasta, 'index.html'), 'utf8').replace('<div id="main">', '<div id="main"><p class="segura">Exemplo · REG 9999-F</p>');
  writeFileSync(join(pasta, 'index.html'), html);
  const rel = { gate: 'FAIL', failed: ['C1'], rules: [
    { id: 'C1', name: 'corner/edge micro-label', status: 'FAIL', hits: [{ text: 'Exemplo · REG 9999-F', sev: 'FAIL' }] },
  ] };
  const { rodarV3 } = rodarPass(rel);
  const r = await verificarReel(pasta, { carregar: marcaRegistro, rodarV3 });
  assert.equal(r.aprovado, true, r.falhas.join('; '));
  assert.ok(!r.falhas.some((f) => /REG|registro|G5/.test(f)));
});

test('verificar V3: [PENDENTE] reprova e verificacao.json é gravado', async () => {
  const pasta = reelV3({ slug: 'com-pendente' });
  const doc = JSON.parse(readFileSync(join(pasta, 'cenas.json'), 'utf8'));
  doc.cenas[0].texto = '[PENDENTE] abre';
  writeFileSync(join(pasta, 'cenas.json'), JSON.stringify(doc));
  const { rodarV3, chamadas } = rodarPass(lintLimpo);
  const r = await verificarReel(pasta, { carregar: () => ({ proibidos: [] }), rodarV3 });
  assert.equal(r.aprovado, false);
  assert.ok(r.falhas.some((f) => /PENDENTE/.test(f)), r.falhas.join('; '));
  assert.ok(!r.falhas.some((f) => /transição|hyperframes/.test(f)), r.falhas.join('; '));
  const v = JSON.parse(readFileSync(join(pasta, 'verificacao.json'), 'utf8'));
  assert.equal(v.aprovado, false);
  assert.match(v.hash, /^[0-9a-f]{64}$/);
  assert.ok(v.quando && Array.isArray(v.falhas) && Array.isArray(v.avisos));
  const look = chamadas.find(([s]) => s === 'look.py');
  assert.deepEqual(look[1], ['renders/rascunho.mp4', '--out', 'quadros', '--expect', '15']);
  assert.match(r.folha, /quadros[/\\]sheet\.jpg$/);
});

test('caminhoV3 usa o adaptador da camada para o look.py e o original para o resto', () => {
  assert.equal(caminhoV3('look.py'), join(RAIZ, 'v3-camada', 'look.py'));
  assert.ok(existsSync(caminhoV3('look.py')), 'v3-camada/look.py existe no repositório');
  assert.equal(caminhoV3('lint.mjs'), join(RAIZ, 'v3', 'scripts', 'lint.mjs'));
});

test('avaliarGates reprova relatório sem G0, G2 ou G3', () => {
  assert.match(avaliarGates({}).falhas.join(' '), /G0/);
  assert.match(avaliarGates({ gates: [] }).falhas.join(' '), /G2/);
  const r = avaliarGates({ gates: [{ id: 'G0', status: 'PASS' }, { id: 'G2', status: 'PASS' }] });
  assert.deepEqual(r.falhas, ['G3: o look não devolveu este gate']);
  assert.deepEqual(avaliarGates({ gates: [{ id: 'G0', status: 'PASS' }, { id: 'G2', status: 'PASS' }, { id: 'G3', status: 'PASS' }] }).falhas, []);
});
