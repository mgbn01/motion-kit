# Receitas por segmento

Cada receita traz: o arco sugerido (tipos de cena em ordem), prompts de imagem e de animação para
o Higgsfield (em inglês, que os modelos seguem melhor) e o objeto 3D que costuma funcionar.
Todo prompt de imagem termina com o **fecho padrão**:

`Vertical 9:16 frame. Photorealistic. No people, no text, no signage, no logos, no watermarks. Original design.`

Todo prompt de animação termina com: `Subtle, steady motion. Keep shapes and proportions exactly the same, no warping. No people, no text.`

Troque o que está entre colchetes. Gere, **revise antes de animar**, e só anime o que precisa se mexer.

---

## 1. Imobiliário e engenharia
**Arco:** midia (fachada animada) → mira ("é render") → midia (interior animado) → midia (lazer) → rajada → midia conter (planta) → objeto3d `predio` → aparelho → cartoes → cta
- Fachada: `A [slender residential tower / low-rise condo / house] in [city type], [golden hour / blue hour], [facade materials], low angle from the street, lush landscaping.`
- Interior: `[Living room / kitchen / suite] of a [premium] apartment, [materials], [view], soft natural light.`
- Planta: `Straight overhead 3D cutaway floor plan of a [two/three]-bedroom apartment, realistic furniture, light grey background, soft shadows. Absolutely no text, labels, dimensions or numbers.`
- Animação: `Slow cinematic crane up along the facade, palm leaves swaying` · `Very slow dolly forward, sheer curtains moving in a breeze`
- **Cuidado:** imagem de algo que ainda não existe pede a legenda "Imagens ilustrativas" (confirme com a incorporadora/jurídico).

## 2. Gastronomia (restaurante, café, bar, delivery)
**Arco:** midia (prato com vapor) → rajada (3–4 pratos) → midia (salão) → mira (ingrediente ou detalhe) → objeto3d `cilindro` (copo, lata, pote) ou `caixa` (embalagem de delivery) → aparelho (cardápio/pedido) → cta
- Prato: `Overhead / 45-degree shot of [dish], [plating style], on a [stone/wood/ceramic] surface, warm side light, shallow depth of field, food photography.`
- Salão: `Interior of a [cozy bistro / modern bar], [materials], warm practical lights, evening, empty tables set.`
- Animação: `Steam rising gently from the dish, very slow push-in` · `Candle flames flicker, slow lateral slide`
- **Cuidado:** não gere prato que não existe no cardápio nem "melhore" o prato real. Para os pratos, prefira foto real; use geração para ambiente e textura.

## 3. Hotelaria e turismo (hotel, pousada, passeio)
**Arco:** midia (paisagem animada) → midia (quarto) → midia (piscina/spa) → rajada → mira (vista da varanda) → aparelho (reserva) → cartoes (o que inclui) → cta
- Paisagem: `[Beach / mountain / river] landscape at [sunrise], [vegetation], calm, no landmarks.`
- Quarto: `Boutique hotel suite, [style], [view], morning light through linen curtains.`
- Animação: `Gentle waves rolling, clouds drifting slowly` · `Pool water rippling, light mist`
- **Cuidado:** paisagem gerada não pode passar por foto do lugar real. Para o destino em si, use foto real; gere só o clima.

## 4. Saúde e estética (clínica, odontologia, estética, bem-estar)
**Arco:** midia (ambiente da clínica) → mira (equipamento ou detalhe) → objeto3d `logo` → cartoes (diferenciais) → aparelho (agendamento) → cta
- Ambiente: `Reception of a [modern clinic], [calm palette], soft daylight, plants, spotless.`
- Detalhe: `Close-up of [dental chair / treatment room / skincare products on a shelf], clinical but warm.`
- Animação: `Slow push-in, soft light shifting across the room`
- **Cuidado (importante):** nunca gere resultado de procedimento, antes e depois, corpo ou rosto. A publicidade de saúde tem regras dos conselhos profissionais (CFM, CFO e outros): confirme o que pode antes de publicar. Nada de promessa de resultado.

## 5. Produto físico (cosmético, bebida, alimento embalado, acessório)
**Arco:** midia (produto em cena, ambiente) → objeto3d `cilindro` ou `caixa` com o rótulo real → rajada (usos/texturas) → mira (detalhe do material) → objeto3d `montagem` (o que vem dentro / camadas) → aparelho (loja) → cta
- Cena: `[Product type] on a [marble / sand / water] surface, [mood] studio lighting, [props], high-end commercial look.` (sem marca, use a forma genérica)
- Textura: `Macro shot of [cream texture / bubbles / coffee beans / fabric weave], studio light.`
- Animação: `Water droplets sliding slowly, soft light sweep` · `Slow orbit around the product`
- **Rótulo do objeto 3D:** use a arte real da embalagem (planificada) como `textura`. O produto da marca deve ser o real; a geração cria só o ambiente.
- **Cuidado:** não gere o produto de outra marca nem imite rótulo conhecido.

## 6. Automotivo (concessionária, oficina, estética automotiva)
**Arco:** midia (carro em movimento ou estúdio) → mira (farol, roda, interior) → rajada → midia (oficina/estúdio limpo) → cartoes (serviços) → aparelho (agendamento) → cta
- Estúdio: `Generic modern [sedan / SUV / pickup] in a dark studio with a long light strip reflection, glossy paint, low angle. Unbranded, no badges, no logos.`
- Oficina: `Clean modern auto workshop, epoxy floor, organized tools, cool lighting.`
- Animação: `Slow light sweep across the car body, camera slowly orbiting`
- **Cuidado:** carro gerado é genérico, sem marca. Para vender um modelo real, use foto real do modelo; marcas de montadora são propriedade delas.

## 7. Casa e decoração (móveis planejados, marcenaria, iluminação)
**Arco:** midia (ambiente pronto animado) → objeto3d `montagem` (o móvel se montando) → mira (acabamento, puxador, veio da madeira) → rajada → midia conter (projeto em vista superior) → cta
- Ambiente: `[Kitchen / closet / home office] with custom [oak / walnut / lacquer] joinery, [style], natural light.`
- Detalhe: `Macro of [wood grain / brass handle / stone countertop edge], raking light.`
- Animação: `Sunlight moving slowly across the cabinets, slow dolly`

## 8. Serviços e tecnologia (agência, consultoria, plataforma)
**Arco:** midia (cena conceitual animada) → objeto3d `logo` → aparelho (produto/site) → cartoes (o que entrega) → rajada (casos, sem dado de cliente) → cta
- Conceito: `Abstract [glass / light / architectural] composition representing [speed / order / connection], brand colors [hex], cinematic.`
- Animação: `Light trails flowing slowly, gentle camera drift`
- **Cuidado:** se o produto tem telas reais e precisa de explicação, a V1 (motion-v1) conta melhor. A V2 entra como filme de marca.

---

## Objeto 3D: qual forma usar
| forma | quando | textura |
|---|---|---|
| `caixa` | embalagem, livro, caixa de presente, cartão | frente e verso da arte real |
| `cilindro` | frasco, lata, pote, copo, vela | rótulo planificado (largura ≈ 3,1 × altura) |
| `logo` | fechamento, assinatura de marca | usa `marca.logo` |
| `montagem` | produto em camadas, móvel, kit, "o que vem dentro" | topo/base com imagem opcional |
| `predio` | volumetria de empreendimento | não usa |
