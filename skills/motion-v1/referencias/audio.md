# Trilha, voz e mixagem

Tudo sai de `src/tema.ts → audio` e da linha do tempo. A chave `ELEVENLABS_API_KEY` fica no `.env`.
A Music API não funciona no plano gratuito. Nos planos self-serve, a trilha gerada pode ser usada
comercialmente online e offline, mas não em cinema, TV ou rádio; para esses usos, confira os termos
de música da ElevenLabs.

## Trilha — `npm run trilha` e `npm run bpm`
- POST `/v1/music` com `music_length_ms` (filme + 4 s) e `force_instrumental: true`.
- Prompt em `audio.trilha.prompt`; `{BPM}` é trocado pelo BPM do tema. Peça tempo constante, 4/4,
  crescimento a cada 8 compassos e batida final no tempo forte, sem vocal.
- `bpm.ts` mede por energia em Node: BPM com busca de ±8% em passos de 0,02, e a primeira batida
  forte. Testado com cliques sintéticos: BPM exato e erro de 1 a 6 ms na primeira batida.
- Desvio até 2%: a mixagem corrige com `atempo`. Acima disso: gere outra trilha.
- Limitação: o script acha a primeira **batida**, não distingue o tempo forte do compasso. Ouça o
  começo e, se a música abrir num contratempo, ajuste `primeiraBatida` em `audio/trilha-analise.json`.

## Voz — `npm run voz`
- Só roda com `audio.roteiroAprovado: true` e `audio.voiceId` preenchido.
- Um bloco por cena, `eleven_multilingual_v2`, `language_code` do tema, stability 0,5,
  similarity_boost 0,75, style 0,25, com `previous_text` e `next_text` dos blocos vizinhos.
- O texto falado troca `marca.nome` por `marca.nomeFalado` e aplica `audio.pronuncias`. A tela não muda.
- Flashes: um take só, as palavras separadas por ponto, a 80% da velocidade, pelo endpoint
  `/with-timestamps`. A mixagem corta o take nos tempos medidos e põe cada palavra no seu tempo.
- Se o modelo recusar `language_code`, o erro aparece com a correção (esvaziar `audio.idioma`).

## Mixagem — `npm run mixar`
1. Apara o silêncio de cada bloco: limiar -55 dB no começo, -60 dB no fim, com 0,25 s de cauda.
2. Posiciona cada bloco no início da sua cena (`inicioSegundos` da linha do tempo).
3. Bloco maior que a janela (menos 0,1 s): acelera até 14%. Acima disso, o script para e diz
   quantas palavras cortar. Corte, aprove de novo e refaça só aquele bloco.
4. Trilha: corta até a primeira batida, ajusta ao filme, entrada de 0,15 s e saída de 1,5 s.
5. Trilha 6 LU abaixo da voz (medido, não estimado), com sidechain da voz.
6. loudnorm em dois passes: -16 LUFS, pico alvo -1,5 dBTP. O script mede o arquivo final e para
   se o pico passar de -1 dBTP.
7. Mux com `-c:v copy` e duração travada na do vídeo: `out/filme-<formato>-final.mp4`.

Sem voz, sai só trilha; sem trilha, só voz. Os intermediários ficam em `audio/tmp/` para ouvir.
