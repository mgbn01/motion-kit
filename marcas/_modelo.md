# Kit de marca: [NOME DA MARCA]

Copie este arquivo para `marcas/<id>.md` e crie a pasta `marcas/<id>/` com o `marca.json` e as duas logos. O `<id>` é curto, em minúsculas, com hífen se precisar (ex.: `padaria-sol`). É ele que vai no `npm run novo -- --marca <id>`.

**O que é:** [o que a marca faz, em uma ou duas frases]
**Nome:** [como se escreve, com maiúsculas e acentos]. Perfil: [@perfil]. Site: [endereço, se houver].
**Tom:** [direto, técnico, leve, sóbrio…] e uma frase que resume a voz da marca.

## Paleta (`marca.json` → `cores`)

Seis cores em hex (`#RRGGBB`). O `npm run novo` grava todas no `tema.css` do reel como variáveis CSS (`--fundo`, `--tinta` etc.).

| cor | hex | uso | nunca |
|---|---|---|---|
| fundo | #______ | fundo padrão | |
| superficie | #______ | cartões, faixas | |
| tinta | #______ | texto principal | |
| suave | #______ | texto de apoio | títulos |
| acento | #______ | destaque | texto pequeno se o contraste for baixo |
| acento2 | #______ | segundo destaque | fundo de texto |

Confira o contraste de cada par de texto e fundo (mínimo 4,5:1 para texto normal, 3:1 para texto grande). O `npm run verificar` mede no vídeo, mas é mais barato acertar aqui.

## Fontes (`marca.json` → `fontes`)

`titulo`, `texto` e `rotulo`, cada uma com o nome de uma família que exista em `modelo/assets/fonts/fontes.json` (hoje: `Inter`, `Archivo`, `IBM Plex Mono`, todas OFL). Para usar outra fonte livre, ponha os `.woff2` e o arquivo de licença (`OFL-<Nome>.txt`) em `modelo/assets/fonts/` e registre a família e os pesos em `fontes.json`. Fonte sem licença de redistribuição não entra no repositório.

## Logos (`marca.json` → `logo`)

- `clara`: para **fundo escuro**.
- `escura`: para fundo claro.

PNG com fundo transparente ou SVG. Prefira SVG sem texto (ou com o texto convertido em curvas), para não depender de fonte instalada.

## `marca.json`

```json
{
  "id": "<id>",
  "nome": "Nome da Marca",
  "cores": { "fundo": "#000000", "superficie": "#111111", "tinta": "#FFFFFF", "suave": "#AAAAAA", "acento": "#FF5500", "acento2": "#00AAFF" },
  "fontes": { "titulo": "Archivo", "texto": "Inter", "rotulo": "IBM Plex Mono" },
  "logo": { "clara": "logo-clara.svg", "escura": "logo-escura.svg" },
  "assinatura": "@perfil",
  "proibidos": [],
  "exigeProibidos": false
}
```

- `assinatura`: o texto pequeno que aparece acima da faixa da interface do Reels (perfil, site).
- `proibidos`: termos que nunca podem aparecer na tela e que podem ficar no Git (ex.: o nome antigo da marca).
- `exigeProibidos`: com `true`, o `verificar` recusa enquanto `<ID>_PROIBIDOS` estiver vazio no `.env`. Use quando a lista existe mas é sensível (ex.: o nome de uma pessoa que nunca aparece).

## Regras da marca (`.env`, fora do Git)

O `<ID>` é o id da marca em maiúsculas, com `_` no lugar do hífen.

- `<ID>_PROIBIDOS`: termos que nunca aparecem, separados por `;`.
- `<ID>_PERMITIDOS_VENDA`: termos proibidos que o anúncio de venda (`tipo: venda`) pode e deve mostrar, separados por `;`. Se a sua área exige registro profissional no anúncio (ex.: corretor de imóveis), ponha o número aqui e também em `<ID>_PROIBIDOS`: o `verificar` passa a exigir o registro no `tipo: venda` e a recusá-lo nos outros tipos.

## Regras de conteúdo

- [o que a marca nunca diz, nunca mostra, nunca promete]
- [como cita fontes, números e terceiros]
- [como trata telas e dados de cliente: sempre anonimizados]

## Material aprovado

- [onde estão fotos, renders, telas, carrosséis e textos já aprovados]
