import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ambienteHyperframes, comandoHyperframes, lerEnv } from '../lib/ambiente.mjs';

test('ambiente do hyperframes é silencioso e sem chave do Gemini', () => {
  const env = ambienteHyperframes({ PATH: '/x', GEMINI_API_KEY: 'k', GOOGLE_API_KEY: 'g' });
  assert.equal(env.HYPERFRAMES_NO_TELEMETRY, '1');
  assert.equal(env.DO_NOT_TRACK, '1');
  assert.equal(env.HYPERFRAMES_NO_UPDATE_CHECK, '1');
  assert.equal(env.HYPERFRAMES_SKIP_SKILLS, '1');
  assert.equal(env.PATH, '/x');
  assert.equal('GEMINI_API_KEY' in env, false);
  assert.equal('GOOGLE_API_KEY' in env, false);
});

test('hyperframes roda pelo próprio Node, sem cmd.exe (I8)', () => {
  const c = comandoHyperframes('C:\\Users\\Pessoa\\Área de Trabalho\\motion');
  assert.equal(c.bin, process.execPath);
  assert.match(c.args[0], /node_modules[\\/]hyperframes[\\/]bin[\\/]hyperframes\.mjs$/);
});

test('lerEnv lê chave=valor, ignora comentário e tira aspas', () => {
  const d = mkdtempSync(join(tmpdir(), 'motion-'));
  writeFileSync(join(d, '.env'), '# c\nA=1\nB="dois"\n\nC=\'tres\'\n');
  assert.deepEqual(lerEnv(join(d, '.env')), { A: '1', B: 'dois', C: 'tres' });
  assert.deepEqual(lerEnv(join(d, 'nao-existe')), {});
});

test('lerEnv tira espaços do fim do valor (M4)', () => {
  const d = mkdtempSync(join(tmpdir(), 'motion-'));
  writeFileSync(join(d, '.env'), 'T=abc123456   \n');
  assert.equal(lerEnv(join(d, '.env')).T, 'abc123456');
});
