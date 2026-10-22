/**
 * Render final SEM áudio. Um render por vez, concorrência 2, conferindo disco antes.
 *
 *   npm run render                       → Filme-16x9
 *   npm run render -- --formato 9x16
 *   npm run render -- --quadros 0-299    → só um trecho (teste)
 *   npm run render -- --rascunho         → filme inteiro com [PENDENTE] (prévia; não é entrega)
 *
 * Saída: out/filme-<formato>-sem-audio.mp4
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { spawnSync } from 'node:child_process';
import { tema, type FormatoId } from '../src/tema';
import { argumento, caminho, espacoLivreGB, falhar, ok, passo, rodar } from './_comum';

const MINIMO_GB = 4;
const formato = (argumento('formato') ?? '16x9') as FormatoId;
if (!tema.formatos[formato]) falhar(`Formato ${formato} não existe no tema.`);
const quadros = argumento('quadros');

passo('Validando o tema em modo final');
const rascunho = argumento('rascunho') !== undefined;
if (!quadros && !rascunho) rodar('npx', ['tsx', 'scripts/validar.ts', '--final'], { stdio: 'inherit' });
else ok(`${quadros ? 'trecho de teste' : 'rascunho'}: validação final pulada (não entregue este arquivo)`);

passo('Conferindo espaço em disco');
mkdirSync(caminho('out'), { recursive: true });
const livre = espacoLivreGB(caminho('out'));
if (livre < MINIMO_GB) falhar(`Só ${livre.toFixed(1)} GB livres em out/.`, `libere pelo menos ${MINIMO_GB} GB (apague renders antigos em out/).`);
ok(`${livre.toFixed(1)} GB livres`);

const trava = caminho('out/.render.lock');
if (existsSync(trava)) {
  // Trava de um processo que morreu (máquina reiniciou, terminal fechou) não deve bloquear para sempre.
  const pid = Number(readFileSync(trava, 'utf8'));
  let vivo = false;
  try {
    process.kill(pid, 0);
    vivo = true;
  } catch {
    vivo = false;
  }
  if (vivo) falhar(`Já existe um render em andamento (pid ${pid}).`, 'espere ele terminar: um render por vez.');
  console.log(`  ! trava antiga do pid ${pid}, que não está mais rodando: removida`);
  rmSync(trava, { force: true });
}
writeFileSync(trava, String(process.pid));

{
  const saida = `out/filme-${formato}-sem-audio${quadros ? '-trecho' : ''}.mp4`;
  passo(`Renderizando Filme-${formato} → ${saida}`);
  // O método pede concorrência 2. Em máquina com 1 núcleo o Remotion recusa 2, então cai para 1 e avisa.
  const concorrencia = Math.min(2, cpus().length);
  if (concorrencia < 2) console.log(`  ! só ${cpus().length} núcleo(s): usando --concurrency=${concorrencia}`);
  const args = ['remotion', 'render', `Filme-${formato}`, saida, `--concurrency=${concorrencia}`, '--codec=h264', '--crf=18', '--muted'];
  if (quadros) args.push(`--frames=${quadros}`);
  const r = spawnSync('npx', args, { cwd: caminho(), stdio: 'inherit', shell: process.platform === 'win32' });
  rmSync(trava, { force: true }); // solta a trava antes de qualquer saída
  if (r.status !== 0) falhar(`O render terminou com código ${r.status}. O erro do Remotion está logo acima.`);
  ok(saida);
}
