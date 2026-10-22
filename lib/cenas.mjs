// As 6 transições de base ou qualquer transição do catálogo oficial do HyperFrames (ex.: shader-wipe, light-leak).
const TRANSICAO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const r3 = (n) => Math.round(n * 1000) / 1000;
const br = (n) => String(n).replace('.', ',');

export function validarCenas(doc) {
  const erros = [];
  const bpm = doc?.bpm ?? 120;
  if (![90, 100, 120].includes(bpm)) erros.push(`bpm ${bpm} não permitido (use 90, 100 ou 120)`);
  const tempo = 60 / bpm;
  const lista = Array.isArray(doc?.cenas) ? doc.cenas : [];
  if (!lista.length) erros.push('cenas.json sem cenas');
  const ids = new Set();
  let t = 0;
  const cenas = lista.map((c, i) => {
    if (!/^[a-z0-9-]+$/.test(c.id ?? '') || ids.has(c.id)) erros.push(`cena ${i + 1}: id inválido ou repetido`);
    ids.add(c.id);
    const d = Number(c.duracao);
    if (!(d > 0) || Math.abs(d / tempo - Math.round(d / tempo)) > 1e-6) erros.push(`${c.id}: duração ${br(d)} s não é múltiplo de ${br(tempo)} s`);
    if (!TRANSICAO.test(c.transicao ?? '')) erros.push(`${c.id}: transição "${c.transicao}" fora do formato (minúsculas e hífen)`);
    if (i > 0 && c.transicao !== 'corte' && c.transicao === lista[i - 1].transicao) erros.push(`${c.id}: repete a transição da cena anterior`);
    const cena = { ...c, inicio: r3(t), fim: r3(t + d) };
    t += d;
    return cena;
  });
  const ultima = lista.at(-1);
  if (ultima && Number(ultima.duracao) < 2 * tempo - 1e-6) erros.push(`última cena precisa de pelo menos 2 tempos (${br(2 * tempo)} s)`);
  const duracao = r3(t);
  if (duracao < 15 || duracao > 30) erros.push(`duração total ${br(duracao)} s fora de 15 a 30 s`);
  return { ok: erros.length === 0, erros, cenas, duracao };
}

export function temposDosQuadros(cenas, fps = 30) {
  return cenas.flatMap((c) => [r3(c.inicio + 1 / fps), r3((c.inicio + c.fim) / 2), r3(c.fim - 1 / fps)]);
}
