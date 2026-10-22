import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

export function ambienteHyperframes(base = process.env) {
  const env = { ...base, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1', HYPERFRAMES_NO_UPDATE_CHECK: '1', HYPERFRAMES_SKIP_SKILLS: '1' };
  delete env.GEMINI_API_KEY; delete env.GOOGLE_API_KEY;
  return env;
}

// O HyperFrames roda pelo próprio Node: sem cmd.exe no Windows, caminho com espaço ou acento funciona.
export function comandoHyperframes(raiz = RAIZ) {
  return { bin: process.execPath, args: [join(raiz, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs')] };
}

export function lerEnv(arquivo) {
  if (!existsSync(arquivo)) return {};
  const env = {};
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

export function rodar(bin, args, { cwd, env } = {}) {
  return new Promise((resolve, reject) => {
    const filho = spawn(bin, args, { cwd, env, shell: false });
    let saida = '', erro = '';
    filho.stdout.on('data', (d) => { saida += d; });
    filho.stderr.on('data', (d) => { erro += d; });
    filho.on('error', reject);
    filho.on('close', (codigo) => resolve({ codigo: codigo ?? 1, saida, erro }));
  });
}
