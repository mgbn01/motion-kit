import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ambienteHyperframes, comandoHyperframes, rodar } from '../lib/ambiente.mjs';
import { validarCenas, temposDosQuadros } from '../lib/cenas.mjs';
import { avaliarCheck, temPendente, hashReel, conferirMarca, conferirShader } from '../lib/relatorio.mjs';
import { validarCenasV3, duracaoDoFilme, filtrarLint, avaliarGates, rodarV3 } from '../lib/v3.mjs';
import { carregarMarca } from '../lib/marcas.mjs';
import { TIPOS } from './novo.mjs';

export const ZONA_REELS = 'x0=0;y0=0.80;x1=1;y1=1';
// O hyperframes mede contraste em no máximo 5 momentos por check: acima disso, roda em lotes.
const LOTE = 5;
const r3 = (n) => Math.round(n * 1000) / 1000;

export const rodarHyperframes = (args, cwd) => {
  const c = comandoHyperframes();
  return rodar(c.bin, [...c.args, ...args], { cwd, env: ambienteHyperframes() });
};

function doBrief(pasta, campo) {
  const m = readFileSync(join(pasta, 'BRIEF.md'), 'utf8').match(new RegExp(`^${campo}:\\s*([a-z0-9-]+)`, 'm'));
  return m ? m[1] : null;
}

export async function verificarV3(pasta, { rodar = rodarV3, carregar = carregarMarca } = {}) {
  const falhas = [], avisos = [];
  const html = readFileSync(join(pasta, 'index.html'), 'utf8');
  const cenasTexto = readFileSync(join(pasta, 'cenas.json'), 'utf8');
  const v = validarCenasV3(JSON.parse(cenasTexto));
  falhas.push(...v.erros);
  const durFilme = duracaoDoFilme(html);
  if (durFilme !== v.duracao) {
    const visto = durFilme == null ? 'ausente' : `${durFilme} s`;
    falhas.push(`duração do index.html (${visto}) diferente da soma das cenas (${v.duracao} s)`);
  }
  if (temPendente(html) || temPendente(cenasTexto)) falhas.push('há [PENDENTE] no reel');

  const marca = doBrief(pasta, 'marca');
  const tipo = doBrief(pasta, 'tipo');
  if (!TIPOS.includes(tipo)) falhas.push(`BRIEF.md sem tipo válido (${TIPOS.join(', ')})`);
  falhas.push(...conferirMarca({ html, cenasTexto, marca, tipo, carregar }));
  const liberados = marca && tipo === 'venda' ? (carregar(marca).permitidosVenda || []) : [];

  const lint = await rodar('lint.mjs', ['index.html', '--json'], { cwd: pasta });
  let rel = null;
  try { rel = JSON.parse(lint.saida); } catch { rel = null; }
  if (!rel) falhas.push(`lint não devolveu JSON: ${(lint.erro || lint.saida).slice(0, 300)}`);
  else {
    const a = filtrarLint(rel, liberados);
    falhas.push(...a.falhas);
    avisos.push(...a.avisos);
  }

  // Rascunho leve. O look lê o mp4 e grava quadros/gates.json e quadros/sheet.jpg.
  rmSync(join(pasta, 'quadros'), { recursive: true, force: true });
  const render = await rodar('render.mjs', ['index.html', 'renders/rascunho.mp4', '--scale', '0.5'], { cwd: pasta });
  if (render.codigo !== 0) falhas.push(`render do rascunho falhou: ${(render.erro || render.saida).slice(0, 300)}`);
  const look = await rodar('look.py', ['renders/rascunho.mp4', '--out', 'quadros', '--expect', String(v.duracao)], { cwd: pasta });
  const gatesArq = join(pasta, 'quadros', 'gates.json');
  if (look.codigo !== 0) falhas.push(`look falhou: ${(look.erro || look.saida).trim().slice(-400)}`);
  else if (!existsSync(gatesArq)) falhas.push(`look não devolveu gates.json: ${(look.erro || look.saida).trim().slice(-400)}`);
  else {
    let gates = null;
    try { gates = JSON.parse(readFileSync(gatesArq, 'utf8')); } catch { gates = null; }
    if (!gates) falhas.push('look não devolveu gates.json: JSON inválido');
    else {
      const a = avaliarGates(gates);
      falhas.push(...a.falhas);
      avisos.push(...a.avisos);
    }
  }

  const folhaArq = join(pasta, 'quadros', 'sheet.jpg');
  const folhas = existsSync(folhaArq) ? [folhaArq] : [];
  const aprovado = falhas.length === 0;
  writeFileSync(join(pasta, 'verificacao.json'), JSON.stringify({ aprovado, hash: hashReel(pasta), quando: new Date().toISOString(), falhas, avisos }, null, 2));
  return { aprovado, falhas, avisos, quadros: [], folhas, folha: folhas[0] ?? null };
}

export async function verificarReel(pasta, { cena, rodarHf = rodarHyperframes, carregar = carregarMarca, rodarV3: rodar = rodarV3 } = {}) {
  if (doBrief(pasta, 'motor') === 'v3') return verificarV3(pasta, { rodar, carregar });
  const falhas = [], avisos = [];
  const html = readFileSync(join(pasta, 'index.html'), 'utf8');
  const cenasTexto = readFileSync(join(pasta, 'cenas.json'), 'utf8');
  const v = validarCenas(JSON.parse(cenasTexto));
  falhas.push(...v.erros);
  const dur = Number((html.match(/id="root"[^>]*data-duration="([\d.]+)"/) || [])[1]);
  if (dur !== v.duracao) falhas.push(`duração do index.html (${dur} s) diferente da soma das cenas (${v.duracao} s)`);
  if (temPendente(html) || temPendente(cenasTexto)) (cena ? avisos : falhas).push('há [PENDENTE] no reel');

  const marca = doBrief(pasta, 'marca');
  const tipo = doBrief(pasta, 'tipo');
  if (!TIPOS.includes(tipo)) falhas.push(`BRIEF.md sem tipo válido (${TIPOS.join(', ')})`);
  falhas.push(...conferirMarca({ html, cenasTexto, marca, tipo, carregar }));
  falhas.push(...conferirShader(html));

  // Momento assentado de cada cena: o último quadro antes da troca, com as entradas já terminadas.
  const alvo = cena ? v.cenas.filter((c) => c.id === cena) : v.cenas;
  if (cena && !alvo.length) falhas.push(`cena não encontrada: ${cena}`);
  const assentados = alvo.map((c) => r3(c.fim - 1 / 30));
  const lotes = [];
  for (let i = 0; i < assentados.length; i += LOTE) lotes.push(assentados.slice(i, i + LOTE));
  const vistos = new Set();
  for (const lote of lotes) {
    const seek = lote.map((t) => r3(t / v.duracao)).join(',');
    const ch = await rodarHf(['check', '.', '--json', '--at', lote.join(','), '--caption-zone', `${ZONA_REELS};severity=error;seek=${seek}`], pasta);
    let rel;
    try { rel = JSON.parse(ch.saida); } catch { rel = null; }
    const a = rel ? avaliarCheck(rel) : { falhas: [`hyperframes check não devolveu JSON: ${(ch.erro || ch.saida).slice(0, 300)}`], avisos: [] };
    for (const f of a.falhas) if (!vistos.has(f)) { vistos.add(f); falhas.push(f); }
    for (const f of a.avisos) if (!vistos.has(f)) { vistos.add(f); avisos.push(f); }
  }

  const tempos = temposDosQuadros(alvo);
  const dir = join(pasta, 'quadros');
  rmSync(dir, { recursive: true, force: true });
  let quadros = [], folhas = [];
  if (tempos.length) {
    const sn = await rodarHf(['snapshot', '.', '--at', tempos.join(','), '--describe', 'false', '-o', 'quadros'], pasta);
    if (sn.codigo !== 0) avisos.push(`snapshot falhou: ${(sn.erro || sn.saida).slice(0, 200)}`);
    if (existsSync(dir)) {
      const nomes = readdirSync(dir).sort();
      quadros = nomes.filter((f) => f.endsWith('.png')).map((f) => join(dir, f));
      folhas = nomes.filter((f) => /^contact-sheet.*\.jpg$/.test(f)).map((f) => join(dir, f));
    }
  }
  const aprovado = falhas.length === 0;
  if (!cena) writeFileSync(join(pasta, 'verificacao.json'), JSON.stringify({ aprovado, hash: hashReel(pasta), quando: new Date().toISOString(), falhas, avisos }, null, 2));
  return { aprovado, falhas, avisos, quadros, folhas, folha: folhas[0] ?? null };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pasta = resolve(process.argv[2] || '.');
  const i = process.argv.indexOf('--cena');
  const r = await verificarReel(pasta, { cena: i > 0 ? process.argv[i + 1] : undefined });
  console.log(r.aprovado ? 'APROVADO' : 'REPROVADO');
  for (const f of r.falhas) console.log(`  ✗ ${f}`);
  for (const a of r.avisos) console.log(`  ⚠ ${a}`);
  for (const f of r.folhas) console.log(`Folha de quadros: ${f}`);
  for (const q of r.quadros) console.log(`Quadro: ${q}`);
  process.exit(r.aprovado ? 0 : 1);
}
