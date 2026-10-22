/**
 * Utilidades dos scripts. Regras que valem aqui:
 * - chave de API só vem do .env e nunca é impressa;
 * - se algo falhar, mostra o erro real e sai com código 1 (nada de contornar em silêncio).
 */
import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { existsSync, readFileSync, statfsSync } from 'node:fs';
import path from 'node:path';

export const RAIZ = path.resolve(__dirname, '..');
export const caminho = (...p: string[]) => path.join(RAIZ, ...p);

export const passo = (texto: string) => console.log(`\n▸ ${texto}`);
export const ok = (texto: string) => console.log(`  ✓ ${texto}`);
export const aviso = (texto: string) => console.log(`  ! ${texto}`);

export const falhar = (texto: string, correcao?: string): never => {
  console.error(`\n✗ ${texto}`);
  if (correcao) console.error(`  Correção: ${correcao}`);
  process.exit(1);
};

/** Lê uma variável do .env sem nunca imprimir o valor. */
export const segredo = (nome: string): string => {
  const arquivo = caminho('.env');
  let valor = process.env[nome];
  if (!valor && existsSync(arquivo)) {
    for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === nome) valor = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  if (!valor) falhar(`${nome} não encontrada.`, `crie o arquivo .env a partir de .env.example e preencha ${nome}.`);
  return valor as string;
};

/** Mascara qualquer ocorrência da chave em mensagens de erro vindas de fora. */
export const semSegredo = (texto: string, chave: string) => texto.split(chave).join('***');

export const rodar = (cmd: string, args: string[], opcoes: SpawnSyncOptions = {}) => {
  const r = spawnSync(cmd, args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1024 * 1024 * 200, ...opcoes });
  if (r.error) falhar(`Não consegui executar ${cmd}: ${r.error.message}`);
  if (r.status !== 0) {
    const saida = `${r.stderr ?? ''}`.trim().split('\n').slice(-25).join('\n');
    falhar(`${cmd} ${args.slice(0, 3).join(' ')}… terminou com código ${r.status}.\n${saida}`);
  }
  return { ...r, stdout: String(r.stdout ?? ''), stderr: String(r.stderr ?? '') };
};

/**
 * ffmpeg do SISTEMA para mixagem e anonimização.
 * O ffmpeg que vem com o Remotion é enxuto: não tem silenceremove, sidechaincompress,
 * afade, areverse, boxblur nem drawbox. Ele serve para o render, não para isto.
 */
const FILTROS_NECESSARIOS = ['silenceremove', 'sidechaincompress', 'loudnorm', 'afade', 'areverse', 'atempo', 'adelay', 'amix', 'gblur', 'drawbox', 'overlay', 'drawgrid'];

export const ffmpegDoSistema = (): string => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-filters'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) {
    falhar(
      'ffmpeg não encontrado no PATH.',
      'instale o ffmpeg completo (Linux: sudo apt install ffmpeg · Windows: winget install Gyan.FFmpeg · macOS: brew install ffmpeg).',
    );
  }
  const faltando = FILTROS_NECESSARIOS.filter((f) => !new RegExp(`\\s${f}\\s`).test(r.stdout));
  if (faltando.length) falhar(`O ffmpeg instalado não tem os filtros: ${faltando.join(', ')}.`, 'instale uma build completa do ffmpeg.');
  return 'ffmpeg';
};

export const ffprobeDuracao = (arquivo: string): number => {
  const r = rodar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', arquivo]);
  return parseFloat(r.stdout.trim());
};

export const espacoLivreGB = (dir: string): number => {
  const s = statfsSync(dir);
  return (s.bavail * s.bsize) / 1024 ** 3;
};

export const argumento = (nome: string): string | undefined => {
  const i = process.argv.indexOf(`--${nome}`);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : 'sim';
};
