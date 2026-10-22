import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, readlinkSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RAIZ } from '../lib/ambiente.mjs';
import { validarCenas } from '../lib/cenas.mjs';
import { instalarSkill, SKILLS } from '../scripts/instalar-skill.mjs';

const skill = readFileSync(join(RAIZ, 'skills/motion-reels/SKILL.md'), 'utf8');

test('as quatro skills têm SKILL.md com o name igual ao da pasta', () => {
  assert.deepEqual(SKILLS, ['motion-v1', 'motion-v2', 'motion-reels', 'motion-v3']);
  for (const nome of SKILLS) {
    const s = readFileSync(join(RAIZ, 'skills', nome, 'SKILL.md'), 'utf8');
    assert.match(s, new RegExp(`^---\\nname: ${nome}\\ndescription: .+\\n---`), nome);
  }
});

test('SKILL.md da motion-reels tem frontmatter e cita os tipos, os comandos e o checklist', () => {
  for (const c of ['--tipo', 'tipo: venda', 'tipo: comercial', 'tipo: viral', 'npm run novo', 'npm run verificar', 'npm run entregar', 'PASTA_ENTREGA', '[PENDENTE]', 'checklist-qa.md']) assert.ok(skill.includes(c), c);
});

test('referências citadas existem', () => {
  for (const r of ['checklist-qa.md', 'arcos.md', 'hyperframes.md']) assert.ok(existsSync(join(RAIZ, 'skills/motion-reels/referencias', r)), r);
});

test('todo exemplo de cenas.json em arcos.md é válido', () => {
  const arcos = readFileSync(join(RAIZ, 'skills/motion-reels/referencias/arcos.md'), 'utf8');
  const cerca = '`'.repeat(3);
  const blocos = arcos.split(cerca + 'json\n').slice(1).map((b) => JSON.parse(b.split(cerca)[0]));
  assert.ok(blocos.length >= 3);
  for (const b of blocos) assert.equal(validarCenas(b).ok, true, validarCenas(b).erros.join('; '));
});

test('instalar cria link e não sobrescreve destino diferente', () => {
  const d = mkdtempSync(join(tmpdir(), 'skills-'));
  const destino = join(d, 'motion-reels');
  assert.equal(instalarSkill({ destino }), 'criado');
  assert.ok(lstatSync(destino).isSymbolicLink());
  assert.equal(instalarSkill({ destino }), 'ja-existe');
  const outro = join(d, 'outro'); mkdirSync(outro);
  assert.throws(() => instalarSkill({ destino: outro }), /já existe e não é este link/);
});

test('skill motion-v3 traz a origem da motionmaxxing e a camada', () => {
  const v3 = readFileSync(join(RAIZ, 'skills/motion-v3/SKILL.md'), 'utf8');
  for (const t of ['https://github.com/Tejashmakwana/motionmaxxing', '8c8ec0f', 'Apache-2.0', 'NOTICE', '--motor v3', 'v3/SKILL.md', 'v3-camada', 'compra', 'registro profissional', '[PENDENTE]', 'audio/mix.wav', 'NOTE.md', 'legenda.txt', 'ElevenLabs', 'M.show', 'G0', 'G5']) assert.ok(v3.includes(t), t);
});

test('instalar cada skill cria o link para skills/<nome>', () => {
  const d = mkdtempSync(join(tmpdir(), 'skills-'));
  for (const nome of SKILLS) {
    const destino = join(d, nome);
    assert.equal(instalarSkill({ destino, origem: join(RAIZ, 'skills', nome) }), 'criado');
    assert.equal(readlinkSync(destino), join(RAIZ, 'skills', nome));
  }
});
