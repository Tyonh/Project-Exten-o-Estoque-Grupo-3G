// Validação do documento que o GEDOC envia para a rota de recebimento
// (T8.1). Módulo puro: recebe o JSON cru e devolve dados limpos ou um erro
// em português. Nunca confie nos campos: tudo vem de fora do sistema.

export const TIPOS_DE_DOCUMENTO = ["ORCAMENTO", "AMOSTRA", "PRODUCAO"] as const;
export type TipoDeDocumento = (typeof TIPOS_DE_DOCUMENTO)[number];

export interface ItemRecebido {
  codigo: string;
  quantidade: number;
}

export interface DocumentoRecebido {
  protocolo: string;
  origem: string;
  tipo_documento: TipoDeDocumento;
  cliente_nome: string | null;
  solicitante_nome: string | null;
  validado: boolean;
  itens: ItemRecebido[];
}

export type ResultadoDoPayload =
  | { ok: true; dados: DocumentoRecebido }
  | { ok: false; erro: string };

// Formato do GEDOC: PREFIXO-AAAAMMDD-XXXX (lib/geradorProtocolo.ts). O QR
// code carrega esse texto, então ele também vai em URL: só letras, números e hífen.
// Os prefixos reais do GEDOC têm 1 ou 2 letras (O, A, P, PX...).
const PROTOCOLO = /^[A-Z0-9]{1,12}-\d{8}-[A-Z0-9]{4}$/;
const MAX_ITENS = 500;
const MAX_QUANTIDADE = 1_000_000;
const MAX_TEXTO = 200;

function textoOpcional(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO);
  return limpo || null;
}

export function validarProtocolo(valor: unknown): valor is string {
  return typeof valor === "string" && PROTOCOLO.test(valor);
}

/**
 * Protocolo contido no que o leitor de QR code leu. O QR do GEDOC é uma URL
 * (`https://estoque.../leitura/ORC-20261029-AB12`), mas o texto puro do
 * protocolo também vale. Devolve `null` quando o texto não tem um protocolo.
 */
export function extrairProtocolo(lido: string): string | null {
  const texto = lido.trim();
  if (!texto || texto.length > 500) return null;

  let candidato = texto;
  try {
    const url = new URL(texto);
    const partes = url.pathname.split("/").filter(Boolean);
    const indice = partes.lastIndexOf("leitura");
    candidato = indice >= 0 && partes[indice + 1] ? partes[indice + 1] : (partes.at(-1) ?? "");
    candidato = decodeURIComponent(candidato);
  } catch {
    // Não é URL (ou tem escape inválido): usa o texto como veio.
  }

  const protocolo = candidato.trim().toUpperCase();
  return validarProtocolo(protocolo) ? protocolo : null;
}

export function validarPayloadDoGedoc(bruto: unknown): ResultadoDoPayload {
  if (typeof bruto !== "object" || bruto === null || Array.isArray(bruto)) {
    return { ok: false, erro: "O corpo da requisição precisa ser um objeto JSON." };
  }
  const corpo = bruto as Record<string, unknown>;

  const protocolo = typeof corpo.protocolo === "string" ? corpo.protocolo.trim().toUpperCase() : "";
  if (!validarProtocolo(protocolo)) {
    return { ok: false, erro: "Protocolo inválido. Formato esperado: PREFIXO-AAAAMMDD-XXXX." };
  }

  const tipo = typeof corpo.tipo_documento === "string" ? corpo.tipo_documento.toUpperCase() : "";
  if (!(TIPOS_DE_DOCUMENTO as readonly string[]).includes(tipo)) {
    return { ok: false, erro: "Tipo de documento inválido. Use ORCAMENTO, AMOSTRA ou PRODUCAO." };
  }

  if (!Array.isArray(corpo.itens) || corpo.itens.length === 0) {
    return { ok: false, erro: "O documento precisa ter ao menos um item." };
  }
  if (corpo.itens.length > MAX_ITENS) {
    return { ok: false, erro: `O documento passa do limite de ${MAX_ITENS} itens.` };
  }

  // Um código aparece uma vez por documento (o banco recusa repetido): soma as repetições.
  const somaPorCodigo = new Map<string, number>();
  for (const bruto of corpo.itens) {
    const item = (typeof bruto === "object" && bruto !== null ? bruto : {}) as Record<string, unknown>;
    const codigo = typeof item.codigo === "string" ? item.codigo.replace(/\s+/g, "") : "";
    const quantidade = Number(item.quantidade);
    if (!codigo || codigo.length > 50) {
      return { ok: false, erro: "Todo item precisa ter o código do produto." };
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0 || quantidade > MAX_QUANTIDADE) {
      return { ok: false, erro: `Quantidade inválida para o produto ${codigo}.` };
    }
    somaPorCodigo.set(codigo, (somaPorCodigo.get(codigo) ?? 0) + quantidade);
  }

  return {
    ok: true,
    dados: {
      protocolo,
      origem: textoOpcional(corpo.origem) ?? "GEDOC",
      tipo_documento: tipo as TipoDeDocumento,
      cliente_nome: textoOpcional(corpo.cliente_nome),
      solicitante_nome: textoOpcional(corpo.solicitante_nome),
      validado: corpo.validado === true,
      itens: [...somaPorCodigo.entries()].map(([codigo, quantidade]) => ({ codigo, quantidade })),
    },
  };
}
