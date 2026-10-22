/**
 * Traz uma imagem ou vídeo (arquivo local ou URL de resultado do Higgsfield) para public/midias/,
 * já no formato do filme. Vídeo: 30 fps, recorte para preencher, sem áudio. Imagem: JPG com 15% de
 * folga para o movimento de câmera.
 *
 *   npm run importar-midia -- --chave sala --origem gerada --arquivo https://...png
 *   npm run importar-midia -- --chave obra --origem real --arquivo ~/fotos/obra.jpg --formato 9x16
 *
 * Depois, declare em tema.midias: { arquivo, origem, descricao }. O script imprime a linha pronta.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tema, type FormatoId } from '../src/tema';
import { argumento, caminho, falhar, ffmpegDoSistema, ok, passo, rodar } from './_comum';

const principal = async () => {
  const FF = ffmpegDoSistema();
  const chave = argumento('chave');
  const origem = argumento('origem');
  let fonte = argumento('arquivo');
  const formato = (argumento('formato') ?? '9x16') as FormatoId;
  if (!chave || !fonte || (origem !== 'gerada' && origem !== 'real')) falhar('Uso: --chave <nome> --origem gerada|real --arquivo <caminho ou URL>');
  const f = tema.formatos[formato];
  mkdirSync(caminho('entrada-bruta'), { recursive: true });
  if (/^https:\/\//.test(fonte!)) {
    passo(`Baixando ${chave}`);
    const r = await fetch(fonte!);
    if (!r.ok) falhar(`Download respondeu ${r.status}.`);
    const ext = (new URL(fonte!).pathname.match(/\.(png|jpe?g|webp|mp4|mov|webm)$/i)?.[0] ?? '.bin').toLowerCase();
    const local = caminho('entrada-bruta', `${chave}${ext}`);
    writeFileSync(local, Buffer.from(await r.arrayBuffer()));
    fonte = local;
  }
  const entrada = path.resolve(fonte!);
  if (!existsSync(entrada)) falhar(`Não achei ${fonte}.`);
  mkdirSync(caminho('public/midias'), { recursive: true });
  const video = /\.(mp4|mov|webm)$/i.test(entrada);
  const saida = `${chave}${video ? '.mp4' : '.jpg'}`;
  passo(`Normalizando para ${formato} (${f.largura}×${f.altura})`);
  if (video) {
    rodar(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', entrada, '-vf', `fps=${tema.fps},scale=${f.largura}:${f.altura}:force_original_aspect_ratio=increase,crop=${f.largura}:${f.altura},setsar=1`, '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', caminho('public/midias', saida)]);
  } else {
    const W = Math.round(f.largura * 1.15), H = Math.round(f.altura * 1.15);
    rodar(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', entrada, '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`, '-q:v', '2', '-map_metadata', '-1', caminho('public/midias', saida)]);
  }
  ok(`public/midias/${saida}`);
  console.log(`\n  Declare em tema.midias:\n  ${chave}: { arquivo: '${saida}', origem: '${origem}', descricao: '…' },`);
  if (origem === 'gerada') console.log('  Confira nos stills: nenhuma letra, logo, rosto real ou deformação inventada pelo gerador.');
};
principal().catch((e) => falhar(String(e)));
