/**
 * Verificação visual: 3 quadros por cena (início, meio e fim).
 * Equivale a rodar `npx remotion still` três vezes por cena, mas empacota o projeto
 * uma vez só e reaproveita o navegador, o que é bem mais rápido.
 *
 *   npm run stills                      → todas as cenas, formato 16x9
 *   npm run stills -- --cena solucao-2  → uma cena
 *   npm run stills -- --formato 9x16
 *
 * Saída: out/stills/<formato>/<cena>-1-inicio.png, -2-meio.png, -3-fim.png
 * Depois, OLHE as imagens antes de seguir (texto cortado, letras coladas, contraste,
 * margem de segurança, número que não bate com a tela).
 */
import { mkdirSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { montarLinhaDoTempo } from '../src/linhaDoTempo';
import { tema, type FormatoId } from '../src/tema';
import { argumento, caminho, falhar, ok, passo } from './_comum';

const principal = async () => {
  const formato = (argumento('formato') ?? '16x9') as FormatoId;
  if (!tema.formatos[formato]) falhar(`Formato ${formato} não existe no tema.`);
  const so = argumento('cena');
  const linha = montarLinhaDoTempo(tema).filter((c) => !so || c.id === so);
  if (!linha.length) falhar(`Cena "${so}" não existe no tema.`);

  passo('Empacotando o projeto');
  const serveUrl = await bundle({ entryPoint: caminho('src/index.ts') });
  const navegador = await openBrowser('chrome');
  const composicao = await selectComposition({ serveUrl, id: `Filme-${formato}`, puppeteerInstance: navegador });
  const pasta = caminho('out', 'stills', formato);
  mkdirSync(pasta, { recursive: true });

  for (const c of linha) {
    passo(`Cena ${c.id}`);
    // início: logo depois de aterrissar; fim: logo antes da transição de saída começar.
    const fim = c.fimQuadro - c.saidaQuadros - 1;
    const quadros = [
      ['1-inicio', c.inicioQuadro + 2],
      ['2-meio', Math.round((c.inicioQuadro + fim) / 2)],
      ['3-fim', fim],
    ] as const;
    for (const [nome, frame] of quadros) {
      const saida = `${pasta}/${c.id}-${nome}.png`;
      await renderStill({ serveUrl, composition: composicao, frame, output: saida, imageFormat: 'png', puppeteerInstance: navegador });
      ok(`${saida.replace(caminho(), '.')}  (quadro ${frame})`);
    }
  }
  await navegador.close({ silent: true });
};

principal().catch((e) => falhar(`Render de still falhou: ${e instanceof Error ? e.stack ?? e.message : String(e)}`));
