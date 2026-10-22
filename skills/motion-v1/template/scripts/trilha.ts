/**
 * Gera a trilha com a API de música da ElevenLabs.
 *   POST /v1/music  { prompt, music_length_ms, force_instrumental: true }
 * Pede alguns segundos a mais que o filme: o começo é cortado para a primeira batida
 * cair em 0:00 (veja bpm.ts) e o resto é aparado na mixagem.
 *
 *   npm run trilha
 * Saída: audio/trilha-bruta.mp3
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { duracaoTotalQuadros } from '../src/linhaDoTempo';
import { tema } from '../src/tema';
import { caminho, falhar, ok, passo, segredo, semSegredo } from './_comum';

const principal = async () => {
  const chave = segredo('ELEVENLABS_API_KEY');
  const segundos = duracaoTotalQuadros(tema) / tema.fps;
  const prompt = tema.audio.trilha.prompt.replace('{BPM}', String(tema.musica.bpm));
  const music_length_ms = Math.round((segundos + 4) * 1000);

  passo(`Gerando trilha de ${(music_length_ms / 1000).toFixed(1)} s a ${tema.musica.bpm} BPM`);
  console.log(`  prompt: ${prompt}`);
  const r = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: { 'xi-api-key': chave, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ prompt, music_length_ms, force_instrumental: true }),
  });
  if (!r.ok) {
    const corpo = semSegredo(await r.text(), chave);
    falhar(
      `ElevenLabs /v1/music respondeu ${r.status}: ${corpo.slice(0, 600)}`,
      r.status === 401 || r.status === 403
        ? 'confira a chave no .env e se o plano é pago (a Music API não funciona no plano gratuito).'
        : 'leia a mensagem acima; se for limite de crédito ou de concorrência, espere ou troque de plano.',
    );
  }
  mkdirSync(caminho('audio'), { recursive: true });
  writeFileSync(caminho('audio/trilha-bruta.mp3'), Buffer.from(await r.arrayBuffer()));
  ok('audio/trilha-bruta.mp3 — agora rode: npm run bpm');
};

principal().catch((e) => falhar(`Falha ao gerar a trilha: ${e instanceof Error ? e.message : String(e)}`));
