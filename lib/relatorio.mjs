import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SECOES = ['lint', 'runtime', 'layout', 'motion', 'contrast'];
// O check só mede nos momentos assentados de cada cena (o verificar passa --at), então estes
// achados são reais mesmo quando o hyperframes os rebaixa por terem aparecido numa amostra só.
const BLOQUEIAM = new Set(['caption_zone_collision', 'text_box_overflow', 'clipped_text', 'canvas_overflow', 'text_occluded', 'frame_out_of_frame']);
const sem = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ');

export function avaliarCheck(json) {
  const falhas = [], avisos = [];
  for (const s of SECOES) for (const f of json?.[s]?.findings ?? []) {
    const linha = `${s}: ${f.message}${f.text ? ` ("${f.text}")` : ''}`;
    const bloqueia = f.severity === 'error' || (s === 'contrast' && /contrast/i.test(f.code || '')) || BLOQUEIAM.has(f.code);
    if (bloqueia) falhas.push(linha); else if (f.severity === 'warning') avisos.push(linha);
  }
  if (json?.ok === false && !falhas.length) falhas.push(json.error ? `hyperframes: ${json.error}` : 'hyperframes: check reprovado (modo estrito ou aviso bloqueante)');
  return { ok: falhas.length === 0, falhas, avisos };
}

/** Texto que aparece na tela: sem tags, sem scripts, entidades comuns decodificadas. */
export function textoVisivel(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function procurarProibidos(html, termos) {
  const h = sem(textoVisivel(html));
  return termos.filter((t) => t && h.includes(sem(t)));
}

// O mesmo bloco dos reels em HyperFrames e da V3: termos proibidos da marca e, no anúncio de venda,
// o registro profissional obrigatório quando a marca declara um (PERMITIDOS_VENDA).
export function conferirMarca({ html, cenasTexto, marca, tipo, carregar }) {
  if (!marca) return ['BRIEF.md sem marca: os termos proibidos não podem ser conferidos'];
  const m = carregar(marca);
  const falhas = [];
  const liberados = tipo === 'venda' ? (m.permitidosVenda || []) : [];
  const proibidos = m.proibidos.filter((t) => !liberados.some((l) => l.toLowerCase() === t.toLowerCase()));
  // Marca com "exigeProibidos": true no marca.json não verifica sem a lista do .env (ex.: o nome de alguém que nunca pode aparecer).
  if (m.exigeProibidos && !m.proibidos.length) falhas.push(`${marca.toUpperCase().replace(/-/g, '_')}_PROIBIDOS vazio no .env: preencha antes de verificar um reel desta marca`);
  if (tipo === 'venda' && liberados.length && !procurarProibidos(html, liberados).length) falhas.push('anúncio de venda sem o registro profissional na tela');
  for (const t of procurarProibidos(html, proibidos)) falhas.push(`termo proibido para a marca: ${t}`);
  for (const t of procurarProibidos(cenasTexto, proibidos)) falhas.push(`termo proibido no cenas.json: ${t}`);
  return falhas;
}

export const temPendente = (texto) => /\[PENDENTE[^\]]*\]/i.test(texto);

const FORA_DO_HASH = new Set(['quadros', 'quadros-final', 'renders', 'snapshots', 'verificacao.json', 'entrega.json', 'previa.json']);

function arquivos(pasta, base = pasta) {
  return readdirSync(pasta, { withFileTypes: true })
    .filter((d) => !(pasta === base && FORA_DO_HASH.has(d.name)))
    .flatMap((d) => d.isDirectory() ? arquivos(join(pasta, d.name), base) : [join(pasta, d.name)]);
}

/** Hash de tudo o que entra no vídeo (HTML, CSS, cenas, imagens, fontes); quadros e saídas ficam de fora. */
export function hashReel(pasta) {
  const h = createHash('sha256');
  for (const f of arquivos(pasta).sort()) {
    h.update(relative(pasta, f).split(sep).join('/'));
    h.update(readFileSync(f));
  }
  return h.digest('hex');
}
