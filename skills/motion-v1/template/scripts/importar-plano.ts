/**
 * Importa um plano gerado por IA (MiniMax, Higgsfield ou outro) para uma cena do tipo "plano".
 * Normaliza para o formato do filme: 30 fps, recorte para preencher a tela, sem áudio,
 * cortado na duração que a cena precisa.
 *
 *   npm run importar-plano -- --arquivo ~/Downloads/hero.mp4 --cena plano-abertura
 *   npm run importar-plano -- --arquivo hero.mp4 --cena plano-abertura --formato 9x16 --inicio 1.2
 *
 * Saída: public/planos/<cena>-<formato>.mp4
 */
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { montarLinhaDoTempo } from '../src/linhaDoTempo';
import { tema, type FormatoId } from '../src/tema';
import { argumento, caminho, falhar, ffmpegDoSistema, ffprobeDuracao, ok, passo, rodar } from './_comum';

const FF = ffmpegDoSistema();
const arquivo = argumento('arquivo');
const id = argumento('cena');
const formato = (argumento('formato') ?? '16x9') as FormatoId;
const inicio = parseFloat(argumento('inicio') ?? '0');
if (!arquivo || !id) falhar('Uso: npm run importar-plano -- --arquivo <video> --cena <id>');
const entrada = path.resolve(arquivo as string);
if (!existsSync(entrada)) falhar(`Não achei ${arquivo}.`);
const cena = montarLinhaDoTempo(tema).find((c) => c.id === id);
if (!cena) falhar(`A cena ${id} não existe no tema.`);
if (cena!.tipo !== 'plano') falhar(`A cena ${id} é do tipo "${cena!.tipo}". Planos gerados só entram em cenas do tipo "plano".`);
const f = tema.formatos[formato];

// A cena precisa do plano desde o começo da transição de entrada até o fim da de saída.
const precisa = (cena!.fimQuadro - cena!.inicioQuadro + cena!.entradaQuadros) / tema.fps;
const tem = ffprobeDuracao(entrada) - inicio;
if (tem + 1e-3 < precisa) {
  falhar(`O plano tem ${tem.toFixed(2)} s úteis; a cena ${id} precisa de ${precisa.toFixed(2)} s.`, 'gere um plano mais longo, reduza os tempos da cena ou use --inicio menor.');
}

passo(`Importando plano para ${id} (${formato}, ${precisa.toFixed(2)} s)`);
mkdirSync(caminho('public/planos'), { recursive: true });
const saida = caminho('public/planos', `${id}-${formato}.mp4`);
rodar(FF, [
  '-hide_banner', '-loglevel', 'error', '-y', '-ss', String(inicio), '-i', entrada, '-t', precisa.toFixed(3),
  '-vf', `fps=${tema.fps},scale=${f.largura}:${f.altura}:force_original_aspect_ratio=increase,crop=${f.largura}:${f.altura},setsar=1`,
  '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', saida,
]);
ok(`${path.relative(caminho(), saida)} — confira texto, logo ou rosto real que o gerador tenha inventado antes de aprovar`);
