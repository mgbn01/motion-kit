import test from 'node:test';
import assert from 'node:assert/strict';
import { validarCenas, temposDosQuadros } from '../lib/cenas.mjs';

const ok = { bpm: 120, cenas: [
  { id: 'gancho', duracao: 3, transicao: 'corte', texto: 'Vai reformar?' },
  { id: 'problema', duracao: 4, transicao: 'deslize', texto: 'O condomínio pede laudo.' },
  { id: 'servico', duracao: 5, transicao: 'mascara', texto: 'A marca faz.' },
  { id: 'chamada', duracao: 4, transicao: 'dissolve', texto: 'Fale no WhatsApp.' },
] };

test('aceita roteiro na grade e calcula início e fim', () => {
  const r = validarCenas(ok);
  assert.equal(r.ok, true, r.erros.join('; '));
  assert.equal(r.duracao, 16);
  assert.deepEqual(r.cenas.map((c) => [c.inicio, c.fim]), [[0, 3], [3, 7], [7, 12], [12, 16]]);
});

test('recusa corte fora da batida, transição repetida, final curto e duração fora de 15–30 s', () => {
  const fora = structuredClone(ok); fora.cenas[0].duracao = 3.2;
  assert.match(validarCenas(fora).erros.join(), /gancho.*múltiplo de 0,5/);
  const rep = structuredClone(ok); rep.cenas[2].transicao = 'deslize';
  assert.match(validarCenas(rep).erros.join(), /servico.*repete a transição/);
  const curta = structuredClone(ok); curta.cenas[3].duracao = 0.5; curta.cenas[2].duracao = 8.5;
  assert.match(validarCenas(curta).erros.join(), /última cena/);
  const longo = structuredClone(ok); longo.cenas[2].duracao = 20;
  assert.match(validarCenas(longo).erros.join(), /15 a 30 s/);
});

test('corte pode repetir e bpm inválido é recusado', () => {
  const c = structuredClone(ok); c.cenas[1].transicao = 'corte';
  assert.equal(validarCenas(c).ok, true);
  assert.match(validarCenas({ ...ok, bpm: 128 }).erros.join(), /bpm/);
});

test('tempos dos quadros: início, meio e fim de cada cena', () => {
  const r = validarCenas(ok);
  assert.deepEqual(temposDosQuadros(r.cenas).slice(0, 3), [0.033, 1.5, 2.967]);
  assert.equal(temposDosQuadros(r.cenas).length, 12);
});

test('aceita transições do catálogo oficial do HyperFrames e recusa nome fora do formato', () => {
  const c = structuredClone(ok); c.cenas[1].transicao = 'shader-wipe'; c.cenas[2].transicao = 'light-leak';
  assert.equal(validarCenas(c).ok, true, validarCenas(c).erros.join('; '));
  const ruim = structuredClone(ok); ruim.cenas[1].transicao = 'Glitch Bonito';
  assert.match(validarCenas(ruim).erros.join(), /problema: transição "Glitch Bonito"/);
  const vazia = structuredClone(ok); delete vazia.cenas[1].transicao;
  assert.match(validarCenas(vazia).erros.join(), /problema: transição/);
});
