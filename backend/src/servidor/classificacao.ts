// Classificação do catálogo legado da 3G em categoria, família, marca e
// atributos. Módulo puro (sem banco, sem imports de runtime): é usado pelo
// gerador de seed (backend/supabase/tools) e pelos testes.
//
// A descrição do catálogo legado é abreviada e tem a marca quase sempre no
// fim, por exemplo "LAMP FL TUBO T5 28W 841 CROWN" ou "FITA LED COB 10W 3000K
// 24V 3G". As regras abaixo leem esse padrão; o que não casa com nenhuma
// regra cai em "Diversos" para revisão manual em /catalogo.

export interface Classificacao {
  categoria: string;
  familia: string;
  marca: string | null;
  atributos: Record<string, string | number>;
}

interface Regra {
  categoria: string;
  familia: string;
  casa: RegExp;
}

export const CATEGORIA_FALLBACK = "Diversos";
export const FAMILIA_FALLBACK = "Produtos diversos";

// A ordem importa: a primeira regra que casa vence. Natal vem antes de
// lâmpada porque "LAMP NATAL" e "LAMP HLG NATAL" são decoração, não lâmpada.
const REGRAS: readonly Regra[] = [
  { categoria: "Natal", familia: "Lâmpada natalina", casa: /^LAMP\.?\s+(HLG\s+)?NATAL/ },
  { categoria: "Natal", familia: "Cordão natalino", casa: /^(CORDAO|CORD)\b/ },
  { categoria: "Natal", familia: "Mangueira natalina", casa: /^(MANG|MANGUEIRA)\b/ },
  { categoria: "Natal", familia: "Cascata, meteoro e cortina", casa: /^(CASCATA|METEORO|CORTINA)\b/ },
  { categoria: "Natal", familia: "Guirlanda e árvore", casa: /^(GUIRLANDA|ARVORE|INFLAV|BOLA LUZ)\b/ },

  { categoria: "Lâmpada", familia: "Lâmpada fluorescente tubular", casa: /^LAMP\.?\s+FL.*\b(TUBO|T5|T8|T10|T12)\b/ },
  { categoria: "Lâmpada", familia: "Lâmpada fluorescente compacta", casa: /^LAMP\.?\s+FL/ },
  { categoria: "Lâmpada", familia: "Lâmpada LED tubular", casa: /^LAMP\.?\s+LED\w*.*\b(TUBO|T5|T8|BFT8)\b/ },
  { categoria: "Lâmpada", familia: "Lâmpada LED", casa: /^LAMP\.?\s+LED/ },
  { categoria: "Lâmpada", familia: "Lâmpada halógena", casa: /^LAMP\.?\s+(HALOG|HLG)/ },
  { categoria: "Lâmpada", familia: "Lâmpada de vapor", casa: /^LAMP\.?\s+(VAPOR|V\b|MET)/ },
  { categoria: "Lâmpada", familia: "Lâmpada incandescente", casa: /^LAMP\.?\s+(INC|INCAND)/ },
  { categoria: "Lâmpada", familia: "Lâmpada diversa", casa: /^LAMP\b/ },

  { categoria: "Refletor", familia: "Refletor aberto", casa: /^REFL\.?\s+AB\b/ },
  { categoria: "Refletor", familia: "Refletor para lâmpada", casa: /^(REFL|REFLETOR)\s+P\// },
  { categoria: "Refletor", familia: "Refletor LED", casa: /^(REFL|REFLETOR)\b.*\bLED\b/ },
  { categoria: "Refletor", familia: "Refletor", casa: /^(REFL|REFLETOR)\b/ },

  { categoria: "Luminária", familia: "Luminária downlight", casa: /^(LUMINARIA|LUM|LUMIN)\b.*DOWNLIGHT/ },
  { categoria: "Luminária", familia: "Luminária pública", casa: /^(LUMINARIA|LUM|LUMIN)\b.*\b(PUBLICA|POSTE|VIARIA)\b/ },
  { categoria: "LED e fitas", familia: "Fita LED", casa: /^(LUMINARIA|LUM)\s+FITA/ },
  { categoria: "Luminária", familia: "Luminária LED", casa: /^(LUMINARIA|LUM|LUMIN)\b.*\bLED\b/ },
  { categoria: "Luminária", familia: "Luminária high bay", casa: /^HIGH\s+BAY/ },
  { categoria: "Luminária", familia: "Luminária", casa: /^(LUMINARIA|LUM|LUMIN)\b/ },
  { categoria: "Luminária", familia: "Spot e plafon", casa: /^(SPOT|PLAFON)\b/ },

  { categoria: "LED e fitas", familia: "Fita LED", casa: /^(FITA|LEDSMD\d+\s+FITA)\b/ },
  { categoria: "LED e fitas", familia: "Módulo LED", casa: /^(LEDSMD|LED\s+(MTDO|MODULO|MONTADO)|MODULO)/ },
  { categoria: "LED e fitas", familia: "LED avulso", casa: /^LED\b/ },

  { categoria: "Bases e peças", familia: "Base para lâmpada", casa: /^BASE\s+P\/\s*LAMP/ },
  { categoria: "Bases e peças", familia: "Base para luminária", casa: /^BASE\b/ },
  { categoria: "Bases e peças", familia: "Parte de luminária", casa: /^(PARTE|AP\s+ELETR|AP\b|PA\b|ALOJAMENTO|TAMPA)/ },
  { categoria: "Bases e peças", familia: "Suporte e perfil", casa: /^(SUPORTE|PERFIL|POSTE)\b/ },

  {
    categoria: "Bases e peças",
    familia: "Peças e acessórios",
    casa: /^(CANOPLA|CRISTAL|VITRIOS|VIDRO|TULIPA|CUPULA|SOQUETE|CORPO DA|CONJUNTO|PECA|ACESSORIOS|ARRUELA|ABRACADEIRA|PINO|NUCLEO)/,
  },
  { categoria: "Informática", familia: "Informática", casa: /^(SSD|PSSD|TECLAD|MOUSEPAD|MOUSE|MONITOR|HD|MEMORIA)\b/ },

  { categoria: "Decoração", familia: "Abajur", casa: /^ABAJUR\b/ },
  { categoria: "Decoração", familia: "Lustre", casa: /^LUSTRE\b/ },
  { categoria: "Decoração", familia: "Ventilador", casa: /^VENTILADOR\b/ },

  { categoria: "Elétrica", familia: "Reator", casa: /^REATOR\b/ },
  { categoria: "Elétrica", familia: "Driver e fonte", casa: /^(DRIVER|TRANSFORMADOR|FONTE)\b/ },
  {
    categoria: "Elétrica",
    familia: "Componentes elétricos",
    casa: /^(IGNITOR|CAPACITOR|RELE|TOMADA|CABO|CONECTOR|ADAPTADOR|BATERIA|FILTRO)\b/,
  },
  { categoria: "Elétrica", familia: "Kit", casa: /^KIT\b/ },
];

// Marca → grafias que aparecem no catálogo legado (comparadas por token
// inteiro, sem acento e em maiúsculas). "CR" e "C" ficam de fora de
// propósito: são ambíguos (cromado, cor) e geram marca errada.
const MARCAS: ReadonlyArray<{ marca: string; tokens: readonly string[] }> = [
  { marca: "Crown", tokens: ["CROWN", "CROW", "CRO"] },
  { marca: "3G", tokens: ["3G", "M3G"] },
  { marca: "Ebron", tokens: ["EBRON"] },
  { marca: "Teja", tokens: ["TEJA"] },
  { marca: "Gyal", tokens: ["GYAL"] },
  { marca: "Corsair", tokens: ["CORSAIR"] },
];

export function normalizarDescricao(descricao: string): string {
  return descricao
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Marca da descrição: procura de trás para frente, onde o catálogo a escreve. */
export function detectarMarca(descricao: string): string | null {
  const tokens = normalizarDescricao(descricao).split(/[\s/,]+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const achada = MARCAS.find(({ tokens: grafias }) => grafias.includes(tokens[i]));
    if (achada) return achada.marca;
  }
  return null;
}

/** Atributos que dá para ler com segurança da descrição (potência, cor, tensão). */
export function extrairAtributos(descricao: string): Record<string, string | number> {
  const texto = normalizarDescricao(descricao);
  const atributos: Record<string, string | number> = {};

  const potencia = texto.match(/(?<![\w.,-])(\d{1,4}(?:[.,]\d{1,2})?)\s?W\b/);
  if (potencia) atributos.potencia_w = Number(potencia[1].replace(",", "."));

  // Faixas como "5500-6000K" não viram um valor único.
  const cor = texto.match(/(?<!\d-)\b(\d{4})\s?K\b(?!-)/);
  if (cor) atributos.temperatura_cor_k = Number(cor[1]);

  if (/\b85-265\s?V\b|\b100-240\s?V\b|\bBIVOLT\b/.test(texto)) {
    atributos.tensao = "bivolt";
  } else {
    const tensao = texto.match(/\b(110|127|220|240)\s?V\b/);
    if (tensao) atributos.tensao = `${tensao[1]}V`;
  }

  return atributos;
}

export function classificarProduto(descricao: string): Classificacao {
  const texto = normalizarDescricao(descricao);
  const regra = REGRAS.find((candidata) => candidata.casa.test(texto));
  return {
    categoria: regra?.categoria ?? CATEGORIA_FALLBACK,
    familia: regra?.familia ?? FAMILIA_FALLBACK,
    marca: detectarMarca(descricao),
    atributos: extrairAtributos(descricao),
  };
}

/** Preço do catálogo legado: número, "90,00" ou vazio. Nulo quando não há preço válido. */
export function lerPreco(bruto: unknown): number | null {
  if (typeof bruto === "number") return bruto > 0 ? bruto : null;
  if (typeof bruto !== "string") return null;
  const numero = Number(bruto.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

/** O catálogo legado tem códigos com quebra de linha no fim (ex.: "50508-1\r\n"). */
export function limparCodigo(codigo: string): string {
  return codigo.replace(/\s+/g, "").trim();
}
