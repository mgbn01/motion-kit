import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from '../lib/ambiente.mjs';

const v3 = (...p) => join(RAIZ, 'v3', ...p);

test('o README cita a motionmaxxing com autor, licença e commit fixado, e a v3/ fica fora do Git', () => {
  const readme = readFileSync(join(RAIZ, 'README.md'), 'utf8');
  for (const t of ['https://github.com/Tejashmakwana/motionmaxxing', 'Tejas Makwana', 'Apache-2.0', '8c8ec0f', 'git -C v3 checkout 8c8ec0f']) assert.ok(readme.includes(t), t);
  assert.match(readFileSync(join(RAIZ, '.gitignore'), 'utf8'), /^v3\/$/m);
});

test('a camada da V3 fica fora de v3/ e não traz código da motionmaxxing', () => {
  for (const f of ['look.py', 'modelo/index.html', 'modelo/cenas.json']) assert.ok(existsSync(join(RAIZ, 'v3-camada', f)), f);
  assert.ok(!existsSync(join(RAIZ, 'v3-camada', 'runtime')), 'o runtime vem do clone, não da camada');
});

// Só roda depois do clone (git clone … v3 && git -C v3 checkout 8c8ec0f).
test('com a motionmaxxing clonada em v3/, os arquivos que a camada usa existem', { skip: !existsSync(v3('SKILL.md')) && 'v3/ não clonada' }, () => {
  for (const f of ['LICENSE', 'NOTICE', 'SKILL.md', 'runtime/motion.js', 'runtime/hero3d/hero3d.js', 'templates/film.html',
    'scripts/render.mjs', 'scripts/lint.mjs', 'scripts/look.py', 'scripts/voice.py', 'scripts/mix.py', 'scripts/imagegen.py']) {
    assert.ok(existsSync(v3(f)), f);
  }
});
