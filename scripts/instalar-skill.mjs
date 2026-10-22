import { existsSync, lstatSync, mkdirSync, readlinkSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ } from '../lib/ambiente.mjs';

export const SKILLS = ['motion-v1', 'motion-v2', 'motion-reels', 'motion-v3'];

export function instalarSkill({ destino = join(homedir(), '.claude', 'skills', 'motion-reels'), origem = join(RAIZ, 'skills', 'motion-reels'), plataforma = process.platform } = {}) {
  if (existsSync(destino) || (() => { try { return lstatSync(destino).isSymbolicLink(); } catch { return false; } })()) {
    if (lstatSync(destino).isSymbolicLink() && resolve(dirname(destino), readlinkSync(destino)) === resolve(origem)) return 'ja-existe';
    throw new Error(`${destino} já existe e não é este link; confira e apague à mão se for o caso`);
  }
  mkdirSync(dirname(destino), { recursive: true });
  symlinkSync(origem, destino, plataforma === 'win32' ? 'junction' : 'dir');
  return 'criado';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // Instala as quatro por link em ~/.claude/skills/: mudanças no repositório valem na hora.
  let erro = false;
  for (const nome of SKILLS) {
    try {
      const r = instalarSkill({ destino: join(homedir(), '.claude', 'skills', nome), origem: join(RAIZ, 'skills', nome) });
      console.log(r === 'criado' ? `Skill ${nome} instalada.` : `Skill ${nome} já estava instalada.`);
    } catch (e) { console.error(e.message); erro = true; }
  }
  if (erro) process.exit(1);
}
