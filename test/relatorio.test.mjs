import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { avaliarCheck, procurarProibidos, temPendente } from '../lib/relatorio.mjs';
const fx = (n) => JSON.parse(readFileSync(new URL(`./fixtures/${n}.json`, import.meta.url), 'utf8'));

test('check aprovado tem avisos mas nenhuma falha', () => {
  const r = avaliarCheck(fx('check-ok'));
  assert.equal(r.ok, true); assert.equal(r.falhas.length, 0); assert.equal(r.avisos.length, 1);
});
test('check reprovado lista contraste e zona do Reels com o texto', () => {
  const r = avaliarCheck(fx('check-ruim'));
  assert.equal(r.ok, false);
  assert.ok(r.falhas.some((f) => /contraste.*Fale no WhatsApp/.test(f)));
  assert.ok(r.falhas.some((f) => /zona do Reels/.test(f)));
});
test('erro do hyperframes vira falha legível (Review Focus 1)', () => {
  assert.deepEqual(avaliarCheck(fx('check-erro')).falhas, ['hyperframes: No composition found']);
  assert.equal(avaliarCheck({ ok: false, strict: true, lint: { findings: [{ severity: 'warning', message: 'x' }] } }).ok, false);
});
test('proibidos ignoram maiúscula e acento; pendente é achado', () => {
  assert.deepEqual(procurarProibidos('<p>Engenheiro JOSÉ da Silva</p>', ['jose da silva', 'REG 9']), ['jose da silva']);
  assert.equal(temPendente('<p>[PENDENTE]</p>'), true);
  assert.equal(temPendente('<p>ok</p>'), false);
});

test('falha de contraste reprova mesmo quando o hyperframes marca como aviso', () => {
  const r = avaliarCheck({ ok: true, contrast: { findings: [{ code: 'contrast_aa_failure', severity: 'warning', message: 'Contrast is 1.19:1; WCAG AA requires 3:1.', text: 'Antes da obra' }] } });
  assert.equal(r.ok, false);
  assert.match(r.falhas[0], /contrast: Contrast is 1\.19:1.*Antes da obra/);
});

test('faixa do Reels e texto vazando reprovam em qualquer severidade; sobreposição só avisa (C1, I2)', () => {
  const r = avaliarCheck({ ok: true, layout: { findings: [
    { code: 'caption_zone_collision', severity: 'warning', message: 'Text intrudes caption zone', text: 'Fale no WhatsApp' },
    { code: 'text_box_overflow', severity: 'info', message: 'Text overflows its box', text: 'Título longo' },
    { code: 'content_overlap', severity: 'warning', message: 'Overlap' },
  ] } });
  assert.equal(r.ok, false);
  assert.equal(r.falhas.length, 2);
  assert.equal(r.avisos.length, 1);
});

test('PENDENTE com complemento também é achado (I4)', () => {
  assert.equal(temPendente('<p>[PENDENTE: fonte]</p>'), true);
});

test('termo proibido é achado mesmo quebrado por tag ou entidade (I5)', () => {
  assert.deepEqual(procurarProibidos('<p>Eng. <em>Fulano</em> de&nbsp;Tal</p>', ['Fulano de Tal']), ['Fulano de Tal']);
});

test('hash muda com estilo e imagens, não com quadros e saídas (I6)', async () => {
  const { mkdtempSync, writeFileSync, mkdirSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { hashReel } = await import('../lib/relatorio.mjs');
  const p = mkdtempSync(join(tmpdir(), 'motion-'));
  for (const d of ['assets', 'quadros', 'renders']) mkdirSync(join(p, d));
  writeFileSync(join(p, 'index.html'), 'a'); writeFileSync(join(p, 'estilo.css'), 'b'); writeFileSync(join(p, 'assets', 'f.jpg'), 'c');
  const h0 = hashReel(p);
  writeFileSync(join(p, 'quadros', 'x.png'), 'q'); writeFileSync(join(p, 'renders', 'r.mp4'), 'r'); writeFileSync(join(p, 'verificacao.json'), '{}');
  assert.equal(hashReel(p), h0);
  writeFileSync(join(p, 'estilo.css'), 'b2');
  const h1 = hashReel(p);
  assert.notEqual(h1, h0);
  writeFileSync(join(p, 'assets', 'f.jpg'), 'c2');
  assert.notEqual(hashReel(p), h1);
});

test('saídas reais do hyperframes 0.8.143: faixa do Reels e contraste reprovam', () => {
  const zona = avaliarCheck(fx('check-real-zona-reels'));
  assert.equal(zona.ok, false);
  assert.ok(zona.falhas.some((f) => /caption band.*Fale no WhatsApp/.test(f)));
  const contraste = avaliarCheck(fx('check-real-contraste'));
  assert.equal(contraste.ok, false);
  assert.ok(contraste.falhas.some((f) => /^contrast:/.test(f)));
});
