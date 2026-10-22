/**
 * Entrega: versão leve em 720p (CRF 24), lista de tempos e resumo do que trocar no tema.
 *
 *   npm run entregar
 *   npm run entregar -- --formato 9x16
 */
import { existsSync, statSync } from 'node:fs';
import { tema, type FormatoId } from '../src/tema';
import { argumento, caminho, falhar, ffmpegDoSistema, ffprobeDuracao, ok, passo, rodar } from './_comum';

const FF = ffmpegDoSistema();
const formato = (argumento('formato') ?? '16x9') as FormatoId;
const final = caminho(`out/filme-${formato}-final.mp4`);
const mudo = caminho(`out/filme-${formato}-sem-audio.mp4`);
const fonte = existsSync(final) ? final : existsSync(mudo) ? mudo : '';
if (!fonte) falhar(`Não há vídeo de ${formato} em out/.`, 'rode npm run render (e npm run mixar, se houver áudio).');
if (fonte === mudo) ok('Versão muda: o áudio fica com o agente de áudio, que usa out/tempos.json para sincronizar.');

passo('Versão leve em 720p (CRF 24)');
const f = tema.formatos[formato];
const escala = f.largura >= f.altura ? 'scale=-2:720' : 'scale=720:-2';
const leve = fonte.replace('.mp4', '-720p.mp4');
rodar(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', fonte, '-vf', escala, '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', leve]);

const mb = (a: string) => (statSync(a).size / 1024 ** 2).toFixed(1);
ok(`${fonte.replace(caminho(), '.')}  ${mb(fonte)} MB  ${ffprobeDuracao(fonte).toFixed(2)} s`);
ok(`${leve.replace(caminho(), '.')}  ${mb(leve)} MB`);

rodar('npx', ['tsx', 'scripts/tempos.ts'], { stdio: 'inherit' });

console.log(`
▸ Para reaproveitar o filme em outra marca, troque em src/tema.ts:
  marca (nome, nomeFalado, promessa, assinatura, site, logo) · cores + textoSobre + acentoSobre
  tipografia (familia + arquivos em public/fontes) · servicos · numeros · cenas[].narracao
  audio.voiceId · audio.pronuncias · audio.roteiroAprovado (volta para false)
  Depois: npm run validar → npm run stills → aprovação → render.`);
