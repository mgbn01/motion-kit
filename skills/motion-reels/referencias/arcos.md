# Arcos de reel (material real, 9:16, mudo)

Cada arco tem a sequência de cenas, o que costuma funcionar e um `cenas.json` válido de exemplo (passa no `validarCenas`). Troque os textos e as durações. Tudo fica na grade de 120 BPM: múltiplos de 0,5 s, sem repetir transição seguida e com a última cena de pelo menos 1 s.

Transições de base: `corte` (seco, na batida), `dissolve`, `deslize`, `mascara`, `zoom` e `clarao`. Também vale qualquer transição do catálogo oficial do HyperFrames (`hyperframes-animation/transitions/`), pelo nome do catálogo, com no máximo 2 "de efeito" por reel.

## 1. Serviço técnico (ex.: laudo, vistoria, avaliação, consultoria)

**Sequência:** gancho com pergunta → problema (foto real com faixa de texto) → o que a marca faz (2 ou 3 cartões) → norma ou prova (número da norma, ícone de traço) → chamada.
**Funciona:** a pergunta que o cliente faz ("Vai reformar o apartamento?"), cartões com rótulo em fonte mono e traço na cor de acento, a norma em destaque e, na chamada, o canal de contato com "toque no link".
**Cuidado:** só cite norma, prazo ou garantia que a pessoa confirmou. Respeite as regras do kit da marca (nomes e registros proibidos).

```json
{
  "bpm": 120,
  "cenas": [
    { "id": "gancho", "duracao": 3, "transicao": "corte", "texto": "Vai reformar o apartamento?" },
    { "id": "problema", "duracao": 4, "transicao": "deslize", "texto": "O condomínio pede um laudo antes da obra." },
    { "id": "servico", "duracao": 6, "transicao": "mascara", "texto": "Laudo técnico · Plano de reforma · Responsável técnico" },
    { "id": "norma", "duracao": 4, "transicao": "dissolve", "texto": "[PENDENTE: norma confirmada pela pessoa]" },
    { "id": "chamada", "duracao": 3, "transicao": "zoom", "texto": "Fale com a gente no WhatsApp." }
  ]
}
```

## 2. Notícia ou ferramenta (ex.: o lançamento de um modelo de IA)

**Sequência:** gancho com o nome do produto → o que mudou → número com fonte → o que muda para a empresa → assinatura.
**Funciona:** a cor do produto de terceiros, número grande animado que conta até o valor real, linha de fonte pequena ("Resultados divulgados pela …").
**Cuidado:** o exemplo abaixo usa marcadores de propósito; preencha com o número real da fonte oficial citada (nunca copie números de exemplo), sem logotipo copiado e sem parecer peça oficial da empresa dona do produto.

```json
{
  "bpm": 120,
  "cenas": [
    { "id": "gancho", "duracao": 3, "transicao": "corte", "texto": "[nome do produto]" },
    { "id": "mudou", "duracao": 4.5, "transicao": "clarao", "texto": "Menos custo para o que se repete." },
    { "id": "numero", "duracao": 5, "transicao": "deslize", "texto": "[número do teste] — fonte: [publicação oficial]" },
    { "id": "empresa", "duracao": 4.5, "transicao": "mascara", "texto": "Tarefas repetitivas ficam mais baratas." },
    { "id": "assinatura", "duracao": 3, "transicao": "dissolve", "texto": "@suamarca" }
  ]
}
```

## 3. Tela de produto (software, aplicativo, painel)

**Sequência:** gancho → tela real anonimizada com movimento de câmera (empurrão lento) → 3 cartões com o que entrega → chamada.
**Funciona:** a tela dentro de uma moldura com sombra na cor da marca, o destaque que percorre a área importante e os cartões numerados "01 · 02 · 03".
**Cuidado:** só telas anonimizadas. Nenhum dado de cliente (nome, telefone, e-mail, valor), nem em abas, notificações ou avatares.

```json
{
  "bpm": 120,
  "cenas": [
    { "id": "gancho", "duracao": 3, "transicao": "corte", "texto": "Um sistema da sua empresa, não alugado." },
    { "id": "tela", "duracao": 6, "transicao": "zoom", "texto": "Você pede em linguagem simples." },
    { "id": "cartoes", "duracao": 6, "transicao": "deslize", "texto": "01 Funil · 02 Clientes · 03 Aprovações" },
    { "id": "chamada", "duracao": 4, "transicao": "dissolve", "texto": "Fale com a gente." }
  ]
}
```
