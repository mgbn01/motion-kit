import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { carregarMarca } from '../lib/marcas.mjs';
import { RAIZ } from '../lib/ambiente.mjs';

test('carrega a marca de exemplo com cores, fontes e logos existentes', () => {
  for (const id of ['exemplo']) {
    const m = carregarMarca(id);
    assert.equal(m.id, id);
    for (const c of Object.values(m.cores)) assert.match(c, /^#[0-9A-F]{6}$/i);
    assert.ok(m.fontes.titulo && m.fontes.texto && m.fontes.rotulo);
  }
  assert.equal(carregarMarca('exemplo').fontes.titulo, 'Archivo');
});

test('recusa marca sem kit', () => {
  assert.throws(() => carregarMarca('inexistente'), /marca sem kit: inexistente/);
});

function raizFalsa(mudar) {
  const r = mkdtempSync(join(tmpdir(), 'motion-'));
  cpSync(join(RAIZ, 'modelo', 'assets', 'fonts', 'fontes.json'), join(r, 'fontes.json'));
  mkdirSync(join(r, 'modelo', 'assets', 'fonts'), { recursive: true });
  cpSync(join(RAIZ, 'modelo', 'assets', 'fonts', 'fontes.json'), join(r, 'modelo', 'assets', 'fonts', 'fontes.json'));
  mkdirSync(join(r, 'marcas', 'x'), { recursive: true });
  writeFileSync(join(r, 'marcas', 'x', 'l.png'), 'png');
  const m = { id: 'x', nome: 'X', cores: { fundo: '#000000', superficie: '#111111', tinta: '#FFFFFF', suave: '#AAAAAA', acento: '#FF0000', acento2: '#00FF00' },
    fontes: { titulo: 'Inter', texto: 'Inter', rotulo: 'IBM Plex Mono' }, logo: { clara: 'l.png', escura: 'l.png' }, assinatura: '@x', proibidos: [] };
  mudar(m);
  writeFileSync(join(r, 'marcas', 'x', 'marca.json'), JSON.stringify(m));
  return r;
}

test('recusa cor inválida, fonte fora do modelo e logo ausente', () => {
  assert.throws(() => carregarMarca('x', raizFalsa((m) => { m.cores.fundo = 'azul'; })), /cores\.fundo/);
  assert.throws(() => carregarMarca('x', raizFalsa((m) => { m.fontes.titulo = 'Comic Sans'; })), /fontes\.titulo/);
  assert.throws(() => carregarMarca('x', raizFalsa((m) => { m.logo.clara = 'nao.png'; })), /logo\.clara/);
});

test('proibidos do .env entram na marca', () => {
  const m = carregarMarca('exemplo', RAIZ, { EXEMPLO_PROIBIDOS: 'Fulano de Tal; REG 123' });
  assert.deepEqual(m.proibidos, ['Fulano de Tal', 'REG 123']);
});

test('termos liberados no anúncio de venda vêm do .env', () => {
  const m = carregarMarca('x', raizFalsa(() => {}), { X_PROIBIDOS: 'Nome; REG 1', X_PERMITIDOS_VENDA: ' REG 1 ;' });
  assert.deepEqual(m.permitidosVenda, ['REG 1']);
  assert.deepEqual(carregarMarca('x', raizFalsa(() => {}), {}).permitidosVenda, []);
});
