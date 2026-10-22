/**
 * Exporta a lista de tempos das cenas para gravar a narração em outra ferramenta
 * ou conferir a entrega: out/tempos.json, out/tempos.csv e out/tempos.md
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { montarLinhaDoTempo } from '../src/linhaDoTempo';
import { tema } from '../src/tema';
import { caminho, ok, passo } from './_comum';

passo('Exportando tempos das cenas');
const linha = montarLinhaDoTempo(tema);
mkdirSync(caminho('out'), { recursive: true });
const linhas = linha.map((c) => ({
  id: c.id,
  tipo: c.tipo,
  inicio_s: +c.inicioSegundos.toFixed(3),
  fim_s: +c.fimSegundos.toFixed(3),
  janela_s: +c.janelaSegundos.toFixed(3),
  inicio_quadro: c.inicioQuadro,
  fim_quadro: c.fimQuadro,
  transicao_entrada: c.indice === 0 ? '' : c.transicao,
  max_palavras: Math.floor(c.janelaSegundos * tema.audio.palavrasPorSegundo),
  narracao: c.tipo === 'flashes' ? tema.servicos.map((s) => s.palavra).join(' · ') : c.narracao,
}));
writeFileSync(caminho('out/tempos.json'), JSON.stringify({ bpm: tema.musica.bpm, fps: tema.fps, cenas: linhas }, null, 2));
const cab = Object.keys(linhas[0]);
const csv = [cab.join(';'), ...linhas.map((l) => cab.map((k) => `"${String((l as Record<string, unknown>)[k]).replace(/"/g, '""')}"`).join(';'))].join('\n');
writeFileSync(caminho('out/tempos.csv'), csv);
const md = [
  `| cena | início | fim | janela | transição | máx. palavras |`,
  `|---|---|---|---|---|---|`,
  ...linhas.map((l) => `| ${l.id} | ${l.inicio_s.toFixed(2)} s | ${l.fim_s.toFixed(2)} s | ${l.janela_s.toFixed(2)} s | ${l.transicao_entrada || '—'} | ${l.max_palavras} |`),
].join('\n');
writeFileSync(caminho('out/tempos.md'), md + '\n');
ok('out/tempos.json, out/tempos.csv, out/tempos.md');
console.log('\n' + md);
