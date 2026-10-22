/**
 * Pacote para o agente de áudio: out/tempos.json, .csv e .md com início e fim de cada cena,
 * BPM, quadros, transição e os textos que aparecem na tela.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { montarLinhaDoTempo } from '../src/linhaDoTempo';
import { tema } from '../src/tema';
import { caminho, ok, passo } from './_comum';

passo('Exportando tempos das cenas');
const textos = (c: Record<string, unknown>) =>
  ['rotulo', 'titulo', 'texto', 'selo', 'botao', 'dica'].map((k) => c[k]).filter((v): v is string => typeof v === 'string').join(' · ');
const linhas = montarLinhaDoTempo(tema).map((c) => ({
  id: c.id,
  tipo: c.tipo,
  inicio_s: +c.inicioSegundos.toFixed(3),
  fim_s: +c.fimSegundos.toFixed(3),
  inicio_quadro: c.inicioQuadro,
  fim_quadro: c.fimQuadro,
  transicao_entrada: c.indice === 0 ? '' : c.transicao,
  inicio_transicao_s: +((c.inicioQuadro - c.entradaQuadros) / tema.fps).toFixed(3),
  texto_na_tela: c.tipo === 'cartoes' ? c.cartoes.map((x) => x.titulo).join(' · ') : textos(c as unknown as Record<string, unknown>),
}));
mkdirSync(caminho('out'), { recursive: true });
writeFileSync(caminho('out/tempos.json'), JSON.stringify({ bpm: tema.musica.bpm, fps: tema.fps, primeira_batida_s: 0, cenas: linhas }, null, 2));
const cab = Object.keys(linhas[0]);
writeFileSync(caminho('out/tempos.csv'), [cab.join(';'), ...linhas.map((l) => cab.map((k) => `"${String((l as Record<string, unknown>)[k]).replace(/"/g, '""')}"`).join(';'))].join('\n'));
const md = ['| cena | tipo | início | fim | transição | texto na tela |', '|---|---|---|---|---|---|', ...linhas.map((l) => `| ${l.id} | ${l.tipo} | ${l.inicio_s.toFixed(2)} s | ${l.fim_s.toFixed(2)} s | ${l.transicao_entrada || '—'} | ${l.texto_na_tela} |`)].join('\n');
writeFileSync(caminho('out/tempos.md'), md + '\n');
ok('out/tempos.json, out/tempos.csv, out/tempos.md');
console.log('\n' + md);
