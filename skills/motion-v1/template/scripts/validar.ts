/**
 * Validador do tema. Roda antes de qualquer render e mostra as contas.
 *
 *   npm run validar            → erros bloqueiam; [PENDENTE] vira aviso
 *   npm run validar -- --final → [PENDENTE] também bloqueia (use antes do render final)
 *
 * Confere: grade musical, duração, cortes de seção no compasso, transições sem repetir,
 * fundos alternando, contraste de todo par texto/fundo (com a conta), tracking,
 * âncoras dentro da margem de segurança, janela de palavras da narração,
 * telas que existem em public/telas e números com fonte.
 */
import { existsSync } from 'node:fs';
import { contraste } from '../src/contraste';
import { ehPendente, montarLinhaDoTempo, quadrosPorTempo } from '../src/linhaDoTempo';
import { tema, type NomeCor } from '../src/tema';
import { argumento, caminho, ffprobeDuracao } from './_comum';

const final = argumento('final') !== undefined;
const erros: string[] = [];
const avisos: string[] = [];
const erro = (t: string) => erros.push(t);
const aviso = (t: string) => avisos.push(t);
const pendente = (onde: string) => (final ? erro : aviso)(`[PENDENTE] em ${onde}`);

// 1. Grade musical
const qptExato = (tema.fps * 60) / tema.musica.bpm;
console.log('\n▸ Grade musical');
console.log(`  ${tema.musica.bpm} BPM a ${tema.fps} fps → 1 tempo = ${(60 / tema.musica.bpm).toFixed(3)} s = ${qptExato} quadros; 1 compasso = ${qptExato * tema.musica.temposPorCompasso} quadros`);
if (!Number.isInteger(qptExato)) erro(`60 × ${tema.fps} / ${tema.musica.bpm} = ${qptExato} não é inteiro. Use 90, 100, 120 BPM (ou outro divisor de ${tema.fps * 60}).`);
const qpt = quadrosPorTempo(tema);
const compasso = qpt * tema.musica.temposPorCompasso;

const linha = montarLinhaDoTempo(tema);
const total = linha[linha.length - 1].fimQuadro / tema.fps;
console.log(`  Duração: ${total.toFixed(2)} s (aceito: ${tema.duracao.min}–${tema.duracao.max} s)`);
if (total < tema.duracao.min || total > tema.duracao.max) erro(`Duração ${total.toFixed(2)} s fora de ${tema.duracao.min}–${tema.duracao.max} s.`);

// 2. Storyboard
console.log('\n▸ Storyboard (corte = quadro em que a cena aterrissa)');
console.log('  id            início   fim      quadros      transição   fundo       palavras');
for (const c of linha) {
  const anterior = linha[c.indice - 1];
  if (c.inicioQuadro % qpt !== 0) erro(`${c.id}: corte no quadro ${c.inicioQuadro} não é múltiplo de ${qpt}.`);
  if (c.abreSecao && c.inicioQuadro % compasso !== 0) erro(`${c.id}: abre seção no quadro ${c.inicioQuadro}, que não é múltiplo de ${compasso} (um compasso).`);
  if (anterior && anterior.indice > 0 && anterior.transicao === c.transicao) erro(`${c.id}: transição "${c.transicao}" repetida logo após ${anterior.id}.`);

  // Fundos: compara a última cor de uma cena com a primeira da seguinte.
  const primeiroFundo = (x: typeof c): NomeCor => (x.tipo === 'flashes' ? tema.flashes.fundos[0] : x.fundo);
  const ultimoFundo = (x: typeof c): NomeCor =>
    x.tipo === 'flashes' ? tema.flashes.fundos[(tema.servicos.length - 1) % tema.flashes.fundos.length] : x.fundo;
  if (anterior && ultimoFundo(anterior) === primeiroFundo(c)) erro(`${c.id}: mesmo fundo (${c.fundo}) que a cena anterior. Os fundos precisam alternar.`);

  // Narração: ~2,5 palavras por segundo
  const limite = Math.floor(c.janelaSegundos * tema.audio.palavrasPorSegundo);
  const texto = c.tipo === 'flashes' ? tema.servicos.map((s) => s.palavra).join(' ') : c.narracao;
  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;
  if (c.tipo !== 'flashes' && !texto.trim()) aviso(`${c.id}: narração vazia (normal até a copy ser aprovada).`);
  if (palavras > limite) erro(`${c.id}: ${palavras} palavras para ${c.janelaSegundos.toFixed(1)} s (máximo ${limite}).`);
  console.log(
    `  ${c.id.padEnd(13)} ${c.inicioSegundos.toFixed(2).padStart(6)}s ${c.fimSegundos.toFixed(2).padStart(6)}s  ${String(c.inicioQuadro).padStart(5)}–${String(c.fimQuadro).padEnd(5)}  ${(c.indice === 0 ? '—' : c.transicao).padEnd(11)} ${c.fundo.padEnd(11)} ${palavras}/${limite}`,
  );
}

const flashes = linha.find((c) => c.tipo === 'flashes');
if (flashes && flashes.tempos !== tema.servicos.length * tema.flashes.temposPorPalavra) {
  erro(`flashes: ${flashes.tempos} tempos, mas ${tema.servicos.length} serviços × ${tema.flashes.temposPorPalavra} = ${tema.servicos.length * tema.flashes.temposPorPalavra}.`);
}
if (tema.servicos.length < 4 || tema.servicos.length > 8) erro(`São ${tema.servicos.length} serviços; o método pede de 4 a 8.`);
tema.servicos.forEach((s, i) => {
  if (s.palavra.trim().split(/\s+/).length > 1) erro(`servicos[${i}].palavra "${s.palavra}" tem mais de uma palavra.`);
  if (!linha.some((c) => c.tipo === 'solucao' && c.servico === i)) aviso(`servicos[${i}] (${s.palavra}) não tem cena de solução.`);
});

// 3. Contraste
console.log('\n▸ Contraste (mínimo 4,5:1)   L = 0,2126 R + 0,7152 G + 0,0722 B; razão = (L clara + 0,05) / (L escura + 0,05)');
const fundosUsados = new Set<NomeCor>([...linha.map((c) => c.fundo), ...tema.flashes.fundos]);
const pares: [string, NomeCor, NomeCor][] = [];
for (const f of fundosUsados) {
  pares.push(['texto', tema.textoSobre[f], f]);
  pares.push(['acento', tema.acentoSobre[f], f]);
}
pares.push(['selo da tela', 'papel', 'tinta']);
for (const [papel, t, f] of pares) {
  const c = contraste(tema.cores[t].hex, tema.cores[f].hex);
  console.log(`  ${(c.passa ? '✓' : '✗')} ${papel.padEnd(13)} ${t.padEnd(10)} sobre ${f.padEnd(10)} ${c.explicacao}`);
  if (!c.passa) erro(`Contraste ${t} sobre ${f} = ${c.razao.toFixed(2)}:1 (abaixo de 4,5).`);
}

// 4. Tipografia
for (const [nome, e] of Object.entries(tema.tipografia.estilos)) {
  if (e.tracking < -0.03) erro(`Estilo ${nome}: tracking ${e.tracking}em aperta demais (mínimo -0,03em).`);
}
for (const a of tema.tipografia.arquivos) {
  if (!existsSync(caminho('public', a.arquivo))) erro(`Fonte ausente: public/${a.arquivo}. O render não pode baixar fontes.`);
}

// 5. Margem de segurança das âncoras do elemento recorrente
for (const [id, f] of Object.entries(tema.formatos)) {
  for (const c of linha) {
    const { x, y } = c.ancora;
    if (x < f.margem.x || x > 1 - f.margem.x || y < f.margem.y || y > 1 - f.margem.y) {
      erro(`${c.id}: âncora (${x}, ${y}) fora da margem de segurança do formato ${id}.`);
    }
  }
}

// 6. Dados: telas, números, marca
if (!existsSync(caminho('public', tema.marca.logo))) erro(`Logo ausente: public/${tema.marca.logo}.`);
tema.servicos.forEach((s, i) => {
  if (s.tela && !existsSync(caminho('public', 'telas', s.tela))) erro(`servicos[${i}].tela: public/telas/${s.tela} não existe.`);
  if (!s.tela && !s.ilustrativa) erro(`servicos[${i}] não tem tela e não está marcado como ilustrativa.`);
  if (ehPendente(s.titulo)) pendente(`servicos[${i}].titulo`);
  if (ehPendente(s.resultado)) pendente(`servicos[${i}].resultado`);
});
tema.numeros.forEach((n, i) => {
  if (n.valor === null) pendente(`numeros[${i}].valor`);
  if (n.valor !== null && ehPendente(n.fonte)) erro(`numeros[${i}] tem valor mas não tem fonte. Número sem fonte não entra.`);
  if (ehPendente(n.rotulo)) pendente(`numeros[${i}].rotulo`);
});
for (const k of ['nome', 'promessa', 'assinatura', 'site'] as const) if (ehPendente(tema.marca[k]) || tema.marca[k].includes('[')) pendente(`marca.${k}`);
// Pronúncia só importa quando a voz é gerada aqui; com áudio desligado, não bloqueia.
if (ehPendente(tema.marca.nomeFalado)) (tema.audio.roteiroAprovado ? pendente : aviso)('marca.nomeFalado');

// 7. Planos gerados por IA
const planos = linha.filter((c) => c.tipo === 'plano');
if (planos.length && !tema.marca.permitePlanosGerados) {
  erro(`Esta marca não permite planos gerados por IA (marca.permitePlanosGerados = false), mas há ${planos.length} cena(s) do tipo plano.`);
}
for (const c of planos) {
  const precisa = (c.fimQuadro - c.inicioQuadro + c.entradaQuadros) / tema.fps;
  for (const id of Object.keys(tema.formatos)) {
    const arq = caminho('public', 'planos', `${c.id}-${id}.mp4`);
    if (!existsSync(arq)) {
      (id === '16x9' ? pendente : aviso)(`plano ${c.id} no formato ${id} (public/planos/${c.id}-${id}.mp4)`);
      continue;
    }
    const d = ffprobeDuracao(arq);
    if (d + 1e-3 < precisa) erro(`Plano ${c.id}-${id}: ${d.toFixed(2)} s, a cena precisa de ${precisa.toFixed(2)} s.`);
  }
  if (c.legenda && ehPendente(c.legenda)) pendente(`${c.id}.legenda`);
}

// Resultado
console.log('');
for (const a of avisos) console.log(`  ! ${a}`);
for (const e of erros) console.log(`  ✗ ${e}`);
console.log(`\n${erros.length ? '✗' : '✓'} ${erros.length} erro(s), ${avisos.length} aviso(s)${final ? ' (modo final)' : ''}.`);
process.exit(erros.length ? 1 : 0);
