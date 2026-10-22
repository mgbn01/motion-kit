import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, lerEnv } from './ambiente.mjs';

const CORES = ['fundo', 'superficie', 'tinta', 'suave', 'acento', 'acento2'];

export function carregarMarca(id, raiz = RAIZ, env = lerEnv(join(raiz, '.env'))) {
  const arq = join(raiz, 'marcas', id, 'marca.json');
  if (!/^[a-z0-9-]+$/.test(id) || !existsSync(arq)) throw new Error(`marca sem kit: ${id}`);
  const m = JSON.parse(readFileSync(arq, 'utf8'));
  const ruim = (campo) => { throw new Error(`marca.json inválido: ${campo}`); };
  for (const c of CORES) if (!/^#[0-9A-F]{6}$/i.test(m.cores?.[c] ?? '')) ruim(`cores.${c}`);
  const fontes = JSON.parse(readFileSync(join(raiz, 'modelo', 'assets', 'fonts', 'fontes.json'), 'utf8'));
  for (const f of ['titulo', 'texto', 'rotulo']) if (!fontes[m.fontes?.[f]]) ruim(`fontes.${f}`);
  for (const l of ['clara', 'escura']) if (!m.logo?.[l] || !existsSync(join(raiz, 'marcas', id, m.logo[l]))) ruim(`logo.${l}`);
  const lista = (nome) => (env[`${id.toUpperCase()}_${nome}`] || '').split(';').map((s) => s.trim()).filter(Boolean);
  // <ID>_PROIBIDOS: termos que nunca aparecem nos reels da marca (vêm do .env, fora do Git).
  // <ID>_PERMITIDOS_VENDA: termos proibidos que o anúncio de venda pode e deve mostrar
  // (ex.: o número do registro profissional que o conselho da área exige no anúncio).
  return { ...m, id, proibidos: [...(m.proibidos || []), ...lista('PROIBIDOS')], permitidosVenda: lista('PERMITIDOS_VENDA') };
}
