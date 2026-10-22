import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ } from '../lib/ambiente.mjs';
import { carregarMarca } from '../lib/marcas.mjs';

export const TIPOS = ['venda', 'comercial', 'viral'];
export const MOTORES = ['v2', 'v3'];
export const AUDIOS = ['sem', 'musica', 'locucao'];

// Data no fuso da máquina, no formato aaaa-mm-dd.
const hoje = () => new Date().toLocaleDateString('sv-SE');

function acharGsap(raiz) {
  const p = join(raiz, 'node_modules', 'gsap', 'dist', 'gsap.min.js');
  if (existsSync(p)) return p;
  throw new Error('GSAP não encontrado: rode npm install');
}

export function criarReel({ marca, slug, tipo, motor = 'v2', audio = 'sem', data = hoje(), raiz = RAIZ }) {
  if (!TIPOS.includes(tipo)) throw new Error(`tipo inválido: ${tipo} (use ${TIPOS.join(', ')})`);
  if (!/^[a-z0-9][a-z0-9-]{0,50}$/.test(slug ?? '')) throw new Error(`slug inválido: ${slug}`);
  if (!MOTORES.includes(motor)) throw new Error(`motor inválido: ${motor} (use ${MOTORES.join(', ')})`);
  if (!AUDIOS.includes(audio)) throw new Error(`áudio inválido: ${audio} (use ${AUDIOS.join(', ')})`);
  const m = carregarMarca(marca, raiz);
  const pasta = join(raiz, 'reels', `${data}-${slug}`);
  if (existsSync(pasta)) throw new Error(`a pasta do reel já existe: ${pasta}`);
  const v3 = motor === 'v3';
  // V3 usa o modelo em pé da camada e o runtime da motionmaxxing (clonada em ./v3). O GSAP desse motor fica em runtime/vendor.
  if (v3 && !existsSync(join(raiz, 'v3', 'runtime', 'motion.js'))) throw new Error('V3 não encontrada em ./v3: clone a motionmaxxing (veja "V3" no README) e rode de novo');
  cpSync(join(raiz, v3 ? 'v3-camada/modelo' : 'modelo'), pasta, { recursive: true });
  mkdirSync(join(pasta, 'assets', 'marca'), { recursive: true });
  if (v3) {
    cpSync(join(raiz, 'modelo', 'assets', 'fonts'), join(pasta, 'assets', 'fonts'), { recursive: true });
    cpSync(join(raiz, 'v3', 'runtime'), join(pasta, 'runtime'), { recursive: true });
  } else {
    mkdirSync(join(pasta, 'assets', 'vendor'), { recursive: true });
    cpSync(acharGsap(raiz), join(pasta, 'assets', 'vendor', 'gsap.min.js'));
  }
  for (const l of ['clara', 'escura']) cpSync(join(raiz, 'marcas', marca, m.logo[l]), join(pasta, 'assets', 'marca', `logo-${l}${m.logo[l].slice(m.logo[l].lastIndexOf('.'))}`));
  const pesos = JSON.parse(readFileSync(join(raiz, 'modelo', 'assets', 'fonts', 'fontes.json'), 'utf8'));
  const familias = [...new Set(Object.values(m.fontes))];
  const faces = familias.flatMap((f) => pesos[f].map((p) => `@font-face { font-family: "${f}"; font-weight: ${p}; font-style: normal; src: url("./assets/fonts/${f.replace(/ /g, '')}-${p}.woff2") format("woff2"); }`));
  const vars = Object.entries(m.cores).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  writeFileSync(join(pasta, 'tema.css'), `${faces.join('\n')}\n:root {\n${vars}\n  --fonte-titulo: "${m.fontes.titulo}";\n  --fonte-texto: "${m.fontes.texto}";\n  --fonte-rotulo: "${m.fontes.rotulo}";\n}\n`);
  const html = join(pasta, 'index.html');
  writeFileSync(html, readFileSync(html, 'utf8').replace('ASSINATURA', m.assinatura).replace('logo-clara.png', `logo-clara${m.logo.clara.slice(m.logo.clara.lastIndexOf('.'))}`));
  const extra = v3 ? `motor: v3\naudio: ${audio}\n` : '';
  writeFileSync(join(pasta, 'BRIEF.md'), `---\nflow: automation\nstoryboard: no\nmode: autonomous\nmarca: ${marca}\ntipo: ${tipo}\nslug: ${slug}\n${extra}---\n\n# ${slug}\n\nPreencher: objetivo, público, mecanismo em uma frase, material usado.\n`);
  return pasta;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
  try { console.log(criarReel({ marca: arg('marca'), slug: arg('slug'), tipo: arg('tipo'), motor: arg('motor'), audio: arg('audio') })); }
  catch (e) { console.error(e.message); process.exit(1); }
}
