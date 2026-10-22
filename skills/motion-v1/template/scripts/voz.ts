/**
 * Narração com a ElevenLabs, um bloco por cena, mantendo a entonação entre blocos
 * com previous_text e next_text.
 *
 *   npm run voz                     → todos os blocos
 *   npm run voz -- --cena prova     → refaz um bloco
 *
 * Regras:
 * - só roda com tema.audio.roteiroAprovado = true (a copy é do responsável pela marca);
 * - o texto falado troca o nome da marca por marca.nomeFalado e aplica audio.pronuncias
 *   (a tela continua com a grafia original);
 * - os flashes são UM take só, a 80% da velocidade, com tempos de cada palavra vindos
 *   do endpoint /with-timestamps. Nunca um arquivo por palavra.
 *
 * Saída: audio/voz/<cena>.mp3 e audio/voz/<cena>.alinhamento.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { ehPendente, montarLinhaDoTempo, type CenaNaLinha } from '../src/linhaDoTempo';
import { tema } from '../src/tema';
import { argumento, caminho, falhar, ffprobeDuracao, ok, passo, segredo, semSegredo } from './_comum';

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const textoFalado = (texto: string): string => {
  let s = texto;
  if (!ehPendente(tema.marca.nomeFalado)) s = s.split(tema.marca.nome).join(tema.marca.nomeFalado);
  for (const [escrito, falado] of Object.entries(tema.audio.pronuncias)) {
    s = s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapar(escrito)}(?![\\p{L}\\p{N}])`, 'gu'), falado);
  }
  return s;
};

/** Texto do bloco de uma cena. Flashes: as palavras separadas por ponto, num take só. */
export const textoDaCena = (c: CenaNaLinha): string =>
  c.tipo === 'flashes' ? tema.servicos.map((s) => textoFalado(s.palavra)).join('. ') + '.' : textoFalado(c.narracao.trim());

const principal = async () => {
  if (!tema.audio.roteiroAprovado) {
    falhar('O roteiro ainda não foi aprovado (tema.audio.roteiroAprovado = false).', 'mostre o roteiro ao responsável pela marca e só mude para true depois do "sim".');
  }
  if (ehPendente(tema.audio.voiceId)) falhar('tema.audio.voiceId está [PENDENTE].', 'escolha a voz na ElevenLabs e cole o voice ID no tema.');
  const chave = segredo('ELEVENLABS_API_KEY');

  const linha = montarLinhaDoTempo(tema).filter((c) => c.tipo === 'flashes' || c.narracao.trim());
  const pend = linha.find((c) => ehPendente(c.narracao));
  if (pend) falhar(`A narração de ${pend.id} ainda tem [PENDENTE].`);
  const so = argumento('cena');
  mkdirSync(caminho('audio/voz'), { recursive: true });

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (so && c.id !== so) continue;
    const flashes = c.tipo === 'flashes';
    const corpo = {
      text: textoDaCena(c),
      model_id: tema.audio.modelo,
      language_code: tema.audio.idioma,
      previous_text: i > 0 ? textoDaCena(linha[i - 1]) : undefined,
      next_text: i < linha.length - 1 ? textoDaCena(linha[i + 1]) : undefined,
      voice_settings: { ...tema.audio.voz, ...(flashes ? { speed: tema.audio.velocidadeFlashes } : {}) },
    };
    passo(`Voz: ${c.id}${flashes ? ' (take único dos flashes, 80% da velocidade)' : ''}`);
    console.log(`  "${corpo.text}"`);
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(tema.audio.voiceId)}/with-timestamps?output_format=mp3_44100_128`,
      { method: 'POST', headers: { 'xi-api-key': chave, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) },
    );
    if (!r.ok) {
      const erro = semSegredo(await r.text(), chave);
      falhar(
        `ElevenLabs respondeu ${r.status} em ${c.id}: ${erro.slice(0, 600)}`,
        /language/i.test(erro)
          ? 'o modelo recusou language_code. Troque tema.audio.idioma para "" ou use um modelo que aceite o parâmetro.'
          : 'leia a mensagem acima (chave, voice ID, crédito ou limite de concorrência).',
      );
    }
    const json = (await r.json()) as { audio_base64: string; alignment?: unknown; normalized_alignment?: unknown };
    const mp3 = caminho(`audio/voz/${c.id}.mp3`);
    writeFileSync(mp3, Buffer.from(json.audio_base64, 'base64'));
    writeFileSync(caminho(`audio/voz/${c.id}.alinhamento.json`), JSON.stringify({ texto: corpo.text, alignment: json.alignment }, null, 2));
    const d = ffprobeDuracao(mp3);
    const folga = c.janelaSegundos - d;
    ok(`${c.id}: ${d.toFixed(2)} s para janela de ${c.janelaSegundos.toFixed(2)} s ${folga >= 0 ? '(cabe)' : `(estoura ${(-folga).toFixed(2)} s; a mixagem tenta acelerar até ${Math.round((tema.audio.aceleracaoMaxima - 1) * 100)}%)`}`);
  }
};

if (require.main === module) principal().catch((e) => falhar(`Falha na voz: ${e instanceof Error ? e.message : String(e)}`));
