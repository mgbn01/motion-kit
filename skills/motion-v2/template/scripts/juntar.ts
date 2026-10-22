/**
 * Emenda as partes de `npm run render -- --parte N/T` num filme só, sem reencodar (-c copy).
 *   npm run juntar [-- --formato 9x16]
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { duracaoTotalQuadros } from '../src/linhaDoTempo';
import { tema } from '../src/tema';
import { argumento, caminho, falhar, ffmpegDoSistema, ffprobeDuracao, ok, passo, rodar } from './_comum';

const FF = ffmpegDoSistema();
const formato = argumento('formato') ?? '9x16';
const pasta = caminho('out/partes');
if (!existsSync(pasta)) falhar('Não há out/partes/.', 'rode npm run render -- --parte 1/3 (e 2/3, 3/3).');
const partes = readdirSync(pasta).filter((a) => a.startsWith(`${formato}-`) && a.endsWith('.mp4')).sort((a, b) => Number(a.split('-')[1].split('de')[0]) - Number(b.split('-')[1].split('de')[0]));
if (!partes.length) falhar(`Nenhuma parte de ${formato} em out/partes/.`);
const total = Number(partes[0].split('de')[1].replace('.mp4', ''));
if (partes.length !== total) falhar(`Encontrei ${partes.length} de ${total} partes.`, 'renderize as que faltam.');
passo(`Juntando ${partes.length} partes`);
writeFileSync(`${pasta}/lista.txt`, partes.map((a) => `file '${pasta}/${a}'`).join('\n'));
const saida = caminho(`out/filme-${formato}-sem-audio.mp4`);
rodar(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${pasta}/lista.txt`, '-c', 'copy', '-movflags', '+faststart', saida]);
const d = ffprobeDuracao(saida);
const esperado = duracaoTotalQuadros(tema) / tema.fps;
if (Math.abs(d - esperado) > 2 / tema.fps) falhar(`O filme ficou com ${d.toFixed(3)} s; o esperado é ${esperado.toFixed(3)} s.`);
ok(`out/filme-${formato}-sem-audio.mp4 (${d.toFixed(2)} s)`);
