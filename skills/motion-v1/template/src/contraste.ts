/**
 * Contraste WCAG 2.x, com a conta exposta para o relatório.
 * L = 0,2126 R + 0,7152 G + 0,0722 B (canais linearizados)
 * razão = (L_clara + 0,05) / (L_escura + 0,05)
 */

const linearizar = (canal8bits: number): number => {
  const c = canal8bits / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const hexParaRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Cor inválida: ${hex}. Use #RRGGBB.`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};

export const luminancia = (hex: string): number => {
  const [r, g, b] = hexParaRgb(hex).map(linearizar);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const br = (n: number, casas: number) => n.toFixed(casas).replace('.', ',');

export type Conta = {
  texto: string;
  fundo: string;
  lTexto: number;
  lFundo: number;
  razao: number;
  passa: boolean;
  explicacao: string;
};

export const contraste = (textoHex: string, fundoHex: string, minimo = 4.5): Conta => {
  const lTexto = luminancia(textoHex);
  const lFundo = luminancia(fundoHex);
  const clara = Math.max(lTexto, lFundo);
  const escura = Math.min(lTexto, lFundo);
  const razao = (clara + 0.05) / (escura + 0.05);
  return {
    texto: textoHex,
    fundo: fundoHex,
    lTexto,
    lFundo,
    razao,
    passa: razao >= minimo,
    explicacao: `(${br(clara, 4)} + 0,05) / (${br(escura, 4)} + 0,05) = ${br(razao, 2)}:1`,
  };
};
