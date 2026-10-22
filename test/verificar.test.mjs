import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RAIZ } from '../lib/ambiente.mjs';
import { criarReel } from '../scripts/novo.mjs';
import { verificarReel } from '../scripts/verificar.mjs';

function reel(cenas, tipo = 'comercial') {
  const r = mkdtempSync(join(tmpdir(), 'motion-'));
  for (const p of ['modelo', 'marcas', 'node_modules/gsap']) if (existsSync(join(RAIZ, p))) cpSync(join(RAIZ, p), join(r, p), { recursive: true });
  const pasta = criarReel({ marca: 'exemplo', slug: 'teste', tipo, data: '2026-10-10', raiz: r });
  writeFileSync(join(pasta, 'cenas.json'), JSON.stringify(cenas));
  const dur = cenas.cenas.reduce((s, c) => s + c.duracao, 0);
  writeFileSync(join(pasta, 'index.html'), readFileSync(join(pasta, 'index.html'), 'utf8').replace(/data-duration="16"/, `data-duration="${dur}"`));
  return pasta;
}
const marcaTeste = () => ({ proibidos: ['Fulano Proibido'] });
const cenas = { bpm: 120, cenas: [{ id: 'a', duracao: 8, transicao: 'corte', texto: 'x' }, { id: 'b', duracao: 8, transicao: 'dissolve', texto: 'y' }] };
const hfFalso = (checkJson) => async (args) => args[0] === 'check'
  ? { codigo: checkJson.ok ? 0 : 1, saida: JSON.stringify(checkJson), erro: '' }
  : { codigo: 0, saida: '', erro: '' };

test('aprova reel com check limpo e grava verificacao.json com hash', async () => {
  const pasta = reel(cenas);
  const r = await verificarReel(pasta, { carregar: marcaTeste, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.equal(r.aprovado, true, r.falhas.join('; '));
  const v = JSON.parse(readFileSync(join(pasta, 'verificacao.json'), 'utf8'));
  assert.equal(v.aprovado, true); assert.match(v.hash, /^[0-9a-f]{64}$/);
});
test('reprova duração do HTML diferente das cenas e [PENDENTE]', async () => {
  const pasta = reel(cenas);
  writeFileSync(join(pasta, 'index.html'), readFileSync(join(pasta, 'index.html'), 'utf8').replace('data-duration="16"', 'data-duration="20"').replace('Título da abertura', '[PENDENTE]'));
  const r = await verificarReel(pasta, { carregar: marcaTeste, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.equal(r.aprovado, false);
  assert.ok(r.falhas.some((f) => /duração/.test(f)));
  assert.ok(r.falhas.some((f) => /PENDENTE/.test(f)));
});
test('check sem JSON vira falha clara', async () => {
  const pasta = reel(cenas);
  const r = await verificarReel(pasta, { carregar: marcaTeste, rodarHf: async () => ({ codigo: 1, saida: 'Error: boom', erro: 'Chrome não abriu' }) });
  assert.ok(r.falhas.some((f) => /não devolveu JSON.*Chrome não abriu/.test(f)));
});
test('modo cena: PENDENTE é só aviso e os quadros são só da cena', async () => {
  const pasta = reel(cenas);
  writeFileSync(join(pasta, 'index.html'), readFileSync(join(pasta, 'index.html'), 'utf8').replace('Título da abertura', '[PENDENTE]'));
  const chamadas = [];
  const r = await verificarReel(pasta, { carregar: marcaTeste, cena: 'b', rodarHf: async (args) => { chamadas.push(args); return hfFalso({ ok: true, lint: { findings: [] } })(args); } });
  assert.equal(r.aprovado, true);
  const snap = chamadas.find((a) => a[0] === 'snapshot');
  assert.equal(snap[snap.indexOf('--at') + 1], '8.033,12,15.967');
  assert.ok(snap.includes('--describe') && snap[snap.indexOf('--describe') + 1] === 'false');
  assert.equal(existsSync(join(pasta, 'verificacao.json')), false);
});

test('check mede no fim assentado de cada cena e a faixa do Reels bloqueia nesses momentos (C1)', async () => {
  const pasta = reel(cenas);
  const chamadas = [];
  await verificarReel(pasta, { carregar: marcaTeste, rodarHf: async (args) => { chamadas.push(args); return hfFalso({ ok: true, lint: { findings: [] } })(args); } });
  const check = chamadas.find((a) => a[0] === 'check');
  assert.equal(check[check.indexOf('--at') + 1], '7.967,15.967');
  assert.equal(check[check.indexOf('--caption-zone') + 1], 'x0=0;y0=0.80;x1=1;y1=1;severity=error;seek=0.498,0.998');
});

test('mais de 5 cenas: check roda em lotes de 5 momentos, para todas terem contraste medido (I1)', async () => {
  const sete = { bpm: 120, cenas: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id, i) => ({ id, duracao: id === 'g' ? 4 : 3, transicao: i % 2 ? 'dissolve' : 'corte', texto: id })) };
  const pasta = reel(sete);
  const chamadas = [];
  await verificarReel(pasta, { carregar: marcaTeste, rodarHf: async (args) => { chamadas.push(args); return hfFalso({ ok: true, lint: { findings: [] } })(args); } });
  const checks = chamadas.filter((a) => a[0] === 'check');
  assert.equal(checks.length, 2);
  assert.equal(checks[0][checks[0].indexOf('--at') + 1].split(',').length, 5);
  assert.equal(checks[1][checks[1].indexOf('--at') + 1].split(',').length, 2);
});

test('BRIEF sem marca e marca que exige termos proibidos sem a lista reprovam (I5)', async () => {
  const pasta = reel(cenas);
  const r1 = await verificarReel(pasta, { rodarHf: hfFalso({ ok: true, lint: { findings: [] } }), carregar: () => ({ proibidos: [], exigeProibidos: true }) });
  assert.ok(r1.falhas.some((f) => /EXEMPLO_PROIBIDOS vazio/.test(f)), r1.falhas.join('; '));
  const r0 = await verificarReel(pasta, { rodarHf: hfFalso({ ok: true, lint: { findings: [] } }), carregar: () => ({ proibidos: [] }) });
  assert.ok(!r0.falhas.some((f) => /_PROIBIDOS/.test(f)), 'sem exigeProibidos a lista vazia não reprova');
  writeFileSync(join(pasta, 'BRIEF.md'), '---\nflow: automation\n---\n');
  const r2 = await verificarReel(pasta, { carregar: marcaTeste, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.ok(r2.falhas.some((f) => /BRIEF\.md sem marca/.test(f)));
});

test('quadros antigos são apagados e todas as folhas de quadros voltam (I7)', async () => {
  const pasta = reel(cenas);
  const { mkdirSync } = await import('node:fs');
  mkdirSync(join(pasta, 'quadros')); writeFileSync(join(pasta, 'quadros', 'velho.png'), 'x');
  const r = await verificarReel(pasta, { carregar: marcaTeste, rodarHf: async (args, cwd) => {
    if (args[0] === 'snapshot') { const d = join(cwd, 'quadros'); mkdirSync(d, { recursive: true }); for (const f of ['frame-00-at-1s.png', 'contact-sheet-1.jpg', 'contact-sheet-2.jpg']) writeFileSync(join(d, f), 'x'); return { codigo: 0, saida: '', erro: '' }; }
    return hfFalso({ ok: true, lint: { findings: [] } })(args);
  } });
  assert.deepEqual(r.quadros.map((q) => q.split(/[\\/]/).pop()), ['frame-00-at-1s.png']);
  assert.deepEqual(r.folhas.map((q) => q.split(/[\\/]/).pop()), ['contact-sheet-1.jpg', 'contact-sheet-2.jpg']);
});

const marcaRegistro = () => ({ proibidos: ['Fulano Proibido', 'REG 9999-F'], permitidosVenda: ['REG 9999-F'] });
const comTexto = (pasta, txt) => writeFileSync(join(pasta, 'index.html'), readFileSync(join(pasta, 'index.html'), 'utf8').replace('</section>', `<p>${txt}</p></section>`));

test('o registro profissional só passa no tipo venda', async () => {
  const venda = reel(cenas, 'venda'); comTexto(venda, 'Exemplo · REG 9999-F');
  const r1 = await verificarReel(venda, { carregar: marcaRegistro, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.equal(r1.aprovado, true, r1.falhas.join('; '));
  const comercial = reel(cenas, 'comercial'); comTexto(comercial, 'Exemplo · REG 9999-F');
  const r2 = await verificarReel(comercial, { carregar: marcaRegistro, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.ok(r2.falhas.some((f) => /termo proibido.*REG 9999-F/.test(f)));
});

test('no tipo venda o nome continua proibido e o registro é obrigatório', async () => {
  const p1 = reel(cenas, 'venda'); comTexto(p1, 'Fulano Proibido · REG 9999-F');
  const r1 = await verificarReel(p1, { carregar: marcaRegistro, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.ok(r1.falhas.some((f) => /termo proibido.*Fulano Proibido/.test(f)));
  const p2 = reel(cenas, 'venda');
  const r2 = await verificarReel(p2, { carregar: marcaRegistro, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.ok(r2.falhas.some((f) => /anúncio de venda sem o registro profissional/.test(f)));
});

test('BRIEF sem tipo válido reprova', async () => {
  const pasta = reel(cenas);
  writeFileSync(join(pasta, 'BRIEF.md'), readFileSync(join(pasta, 'BRIEF.md'), 'utf8').replace(/^tipo: .*$/m, 'tipo: institucional'));
  const r = await verificarReel(pasta, { carregar: marcaTeste, rodarHf: hfFalso({ ok: true, lint: { findings: [] } }) });
  assert.ok(r.falhas.some((f) => /BRIEF\.md sem tipo/.test(f)));
});

test('pasta V2 sem motor segue no hyperframes e não chama a V3', async () => {
  const pasta = reel(cenas);
  let v3 = 0, hf = 0;
  const r = await verificarReel(pasta, {
    carregar: marcaTeste,
    rodarHf: async (args) => { hf++; return hfFalso({ ok: true, lint: { findings: [] } })(args); },
    rodarV3: async () => { v3++; return { codigo: 0, saida: '', erro: '' }; },
  });
  assert.equal(r.aprovado, true, r.falhas.join('; '));
  assert.ok(hf > 0);
  assert.equal(v3, 0);
  assert.doesNotMatch(readFileSync(join(pasta, 'BRIEF.md'), 'utf8'), /^motor:/m);
});
