/**
 * Validador V2. `npm run validar` (pendências viram aviso) · `npm run validar -- --final` (bloqueiam).
 * Confere: grade musical, duração, cortes no tempo, transições sem repetir, mídias declaradas e
 * existentes, origem (real/gerada) contra a permissão da marca, vídeos longos o bastante para a cena,
 * tracking, textos pendentes. O contraste do texto sobre imagem é medido à parte: `npm run contraste`.
 */
import { existsSync } from 'node:fs';
import { ehPendente, montarLinhaDoTempo, quadrosPorTempo, segundosNecessarios } from '../src/linhaDoTempo';
import { tema } from '../src/tema';
import { argumento, caminho, ffprobeDuracao } from './_comum';
import { contraste } from '../src/contraste';

const final = argumento('final') !== undefined;
const erros: string[] = [];
const avisos: string[] = [];
const erro = (t: string) => erros.push(t);
const pendente = (onde: string) => (final ? erros : avisos).push(`[PENDENTE] em ${onde}`);

const qpt = (tema.fps * 60) / tema.musica.bpm;
console.log(`\n▸ Grade: ${tema.musica.bpm} BPM a ${tema.fps} fps → 1 tempo = ${qpt} quadros`);
if (!Number.isInteger(qpt)) erro(`60 × ${tema.fps} / ${tema.musica.bpm} não dá inteiro. Use 90, 100 ou 120 BPM.`);
const linha = montarLinhaDoTempo(tema);
if (!linha.length) erro('tema.cenas está vazio.');
const total = linha.length ? linha[linha.length - 1].fimQuadro / tema.fps : 0;
console.log(`  Duração: ${total.toFixed(2)} s (aceito ${tema.duracao.min}–${tema.duracao.max} s)`);
if (total < tema.duracao.min || total > tema.duracao.max) erro(`Duração ${total.toFixed(2)} s fora de ${tema.duracao.min}–${tema.duracao.max} s.`);

const usadas = new Set<string>();
const usar = (c: string, chave: string) => {
  usadas.add(chave);
  const m = tema.midias[chave];
  if (!m) {
    erro(`${c}: mídia "${chave}" não está declarada em tema.midias.`);
    return undefined;
  }
  if (!existsSync(caminho('public/midias', m.arquivo))) erro(`${c}: public/midias/${m.arquivo} não existe (rode npm run importar-midia).`);
  if (m.origem === 'gerada' && !tema.marca.permiteMidiaGerada) erro(`${c}: "${chave}" é gerada por IA e a marca não permite (marca.permiteMidiaGerada = false).`);
  return m;
};

console.log('\n▸ Storyboard');
console.log('  id              início    fim     tipo       transição  mídias');
for (const c of linha) {
  if (c.inicioQuadro % quadrosPorTempo(tema) !== 0) erro(`${c.id}: corte fora do tempo (quadro ${c.inicioQuadro}).`);
  const ant = linha[c.indice - 1];
  if (ant && ant.indice > 0 && c.transicao !== 'corte' && ant.transicao === c.transicao) erro(`${c.id}: transição "${c.transicao}" repetida logo após ${ant.id}.`);
  const chaves = c.tipo === 'rajada' ? c.midias : c.tipo === 'aparelho' ? [c.midiaFundo, ...c.telas] : c.tipo === 'cartoes' || c.tipo === 'cta' ? [c.midiaFundo] : c.tipo === 'volume' ? [] : c.tipo === 'objeto3d' ? [c.textura, c.texturaVerso].filter((x): x is string => Boolean(x)) : [c.midia];
  for (const k of chaves) {
    const m = usar(c.id, k);
    // vídeo precisa durar a cena inteira (rajada usa um tempo por mídia)
    if (m && /\.(mp4|webm|mov)$/i.test(m.arquivo) && existsSync(caminho('public/midias', m.arquivo))) {
      const precisa = c.tipo === 'rajada' ? 60 / tema.musica.bpm : segundosNecessarios(c, tema.fps);
      const tem = ffprobeDuracao(caminho('public/midias', m.arquivo));
      if (tem + 1e-3 < precisa) erro(`${c.id}: vídeo "${k}" tem ${tem.toFixed(2)} s e a cena precisa de ${precisa.toFixed(2)} s.`);
    }
  }
  // Texto sobre fundo chapado: contraste pela paleta (o texto sobre imagem é medido em npm run contraste).
  const chapado = c.tipo === 'objeto3d' || c.tipo === 'volume' ? c.fundo : c.tipo === 'midia' && c.ajuste === 'conter' ? c.fundo ?? 'claro' : undefined;
  if (chapado) {
    const k = contraste(tema.cores[tema.textoSobre[chapado]].hex, tema.cores[chapado].hex);
    if (!k.passa) erro(`${c.id}: texto ${tema.textoSobre[chapado]} sobre ${chapado} = ${k.explicacao} (mínimo 4,5).`);
  }
  if (c.tipo === 'objeto3d') {
    for (const k of [c.textura, c.texturaVerso]) if (k && tema.midias[k] && /\.(mp4|webm|mov)$/i.test(tema.midias[k].arquivo)) erro(`${c.id}: textura "${k}" é vídeo; o objeto 3D usa imagem.`);
    if ((c.forma === 'caixa' || c.forma === 'cilindro') && !c.textura) avisos.push(`${c.id}: ${c.forma} sem textura (sai na cor do corpo).`);
  }
  if (c.tipo === 'rajada' && c.midias.length !== c.tempos) erro(`${c.id}: rajada com ${c.midias.length} mídias em ${c.tempos} tempos (uma por tempo).`);
  const textos = Object.entries(c).filter(([k, v]) => ['rotulo', 'titulo', 'texto', 'botao', 'dica', 'selo'].includes(k) && typeof v === 'string') as [string, string][];
  for (const [k, v] of textos) if (ehPendente(v)) pendente(`${c.id}.${k}`);
  if (c.tipo === 'cartoes') c.cartoes.forEach((x, i) => (ehPendente(x.titulo) || ehPendente(x.texto)) && pendente(`${c.id}.cartoes[${i}]`));
  console.log(`  ${c.id.padEnd(15)} ${c.inicioSegundos.toFixed(2).padStart(6)}s ${c.fimSegundos.toFixed(2).padStart(6)}s  ${c.tipo.padEnd(10)} ${(c.indice === 0 ? '—' : c.transicao).padEnd(10)} ${chaves.join(', ')}`);
}

for (const [k, m] of Object.entries(tema.midias)) {
  if (!usadas.has(k)) avisos.push(`mídia "${k}" declarada e não usada`);
  if (!m.descricao.trim()) avisos.push(`mídia "${k}" sem descrição`);
}
for (const [n, e] of Object.entries(tema.tipografia.estilos)) if (e.tracking < -0.03) erro(`Estilo ${n}: tracking ${e.tracking}em aperta demais.`);
for (const a of tema.tipografia.arquivos) if (!existsSync(caminho('public', a.arquivo))) erro(`Fonte ausente: public/${a.arquivo}.`);
if (!existsSync(caminho('public', tema.marca.logo))) erro(`Logo ausente: public/${tema.marca.logo}.`);
if (ehPendente(tema.marca.nome) || tema.marca.nome.includes('[')) pendente('marca.nome');
const geradas = Object.values(tema.midias).filter((m) => m.origem === 'gerada').length;
console.log(`\n  Mídias: ${Object.keys(tema.midias).length} (${geradas} geradas por IA, ${Object.keys(tema.midias).length - geradas} reais)`);

console.log('');
for (const a of avisos) console.log(`  ! ${a}`);
for (const e of erros) console.log(`  ✗ ${e}`);
console.log(`\n${erros.length ? '✗' : '✓'} ${erros.length} erro(s), ${avisos.length} aviso(s)${final ? ' (modo final)' : ''}.`);
process.exit(erros.length ? 1 : 0);
