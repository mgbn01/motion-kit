import { join } from 'node:path';
import { RAIZ, rodar } from './ambiente.mjs';

const r3 = (n) => Math.round(n * 1000) / 1000;
const br = (n) => String(n).replace('.', ',');
const GATES = new Set(['G0', 'G2', 'G3']);

// Cenas da V3: id, duração, texto e o que a cena compra. O total fica entre 15 e 30 s.
export function validarCenasV3(doc) {
  const erros = [];
  const lista = Array.isArray(doc?.cenas) ? doc.cenas : [];
  if (!lista.length) erros.push('cenas.json sem cenas');
  const ids = new Set();
  let t = 0;
  const cenas = lista.map((c, i) => {
    const id = c?.id;
    if (!/^[a-z0-9-]+$/.test(id ?? '') || ids.has(id)) erros.push(`cena ${i + 1}: id inválido ou repetido`);
    if (id) ids.add(id);
    const d = Number(c?.duracao);
    if (!(d > 0)) erros.push(`${id || i + 1}: duração precisa ser maior que zero`);
    if (typeof c?.texto !== 'string') erros.push(`${id || i + 1}: texto precisa ser texto`);
    if (typeof c?.compra !== 'string' || !c.compra.trim()) erros.push(`${id || i + 1}: compra vazia`);
    const passo = d > 0 ? d : 0;
    const cena = { id, inicio: r3(t), fim: r3(t + passo), texto: typeof c?.texto === 'string' ? c.texto : '', compra: typeof c?.compra === 'string' ? c.compra : '' };
    t += passo;
    return cena;
  });
  const duracao = r3(t);
  if (lista.length && (duracao < 15 || duracao > 30)) erros.push(`duração total ${br(duracao)} s fora de 15 a 30 s`);
  return { ok: erros.length === 0, erros, cenas, duracao };
}

// Lê `duration: N` de Motion.film({...}). Sem isso, null.
export function duracaoDoFilme(html) {
  const m = String(html).match(/Motion\.film\(\s*\{[^}]*?\bduration\s*:\s*([\d.]+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

// O lint não conhece o registro profissional do anúncio de venda. Achado cujo texto contém um termo liberado não reprova.
export function filtrarLint(rel, liberados = []) {
  const falhas = [], avisos = [];
  const livre = (texto) => liberados.some((t) => t && String(texto).toLowerCase().includes(String(t).toLowerCase()));
  for (const regra of rel?.rules ?? []) {
    for (const h of regra.hits ?? []) {
      const pedacos = [h.text, h.snippet, h.note].filter((s) => typeof s === 'string' && s.trim());
      if (pedacos.some(livre)) continue;
      const texto = pedacos[0] ?? '';
      const linha = `G5 ${regra.id}: ${texto}`;
      const severo = h.sev || (regra.status === 'WARN' ? 'WARN' : 'FAIL');
      if (severo === 'WARN') avisos.push(linha);
      else falhas.push(linha);
    }
  }
  return { falhas, avisos };
}

// gates.json do look.py. G0, G2 e G3 precisam estar lá e passar; ausente ou FAIL reprova.
export function avaliarGates(doc) {
  const falhas = [], avisos = [];
  const lista = Array.isArray(doc?.gates) ? doc.gates : [];
  for (const id of GATES) {
    const g = lista.find((x) => x?.id === id);
    if (!g) falhas.push(`${id}: o look não devolveu este gate`);
    else if (g.status !== 'PASS') falhas.push(`${id}: ${g.detail ?? g.status ?? ''}`);
  }
  return { falhas, avisos };
}

// O look.py passa pelo adaptador da camada (v3-camada/look.py: ffmpeg sem drawtext); os outros vão direto
// ao código da motionmaxxing, clonado em ./v3 (veja o README).
export const caminhoV3 = (script, raiz = RAIZ) => script === 'look.py' ? join(raiz, 'v3-camada', 'look.py') : join(raiz, 'v3', 'scripts', script);

// Chama um script da V3 pelo caminho absoluto: node para .mjs, python3 -I para .py.
export function rodarV3(script, args = [], { cwd } = {}) {
  const arquivo = caminhoV3(script);
  if (script.endsWith('.py')) return rodar('python3', ['-I', arquivo, ...args], { cwd });
  return rodar(process.execPath, [arquivo, ...args], { cwd });
}
