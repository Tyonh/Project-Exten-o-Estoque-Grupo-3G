import type { Local, Movimentacao, TipoMovimentacao } from "./tipos";

const FUSO = "America/Sao_Paulo";

const FORMATO_MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const FORMATO_NUMERO = new Intl.NumberFormat("pt-BR");

const FORMATO_DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const TIPOS_DE_MOVIMENTACAO: readonly TipoMovimentacao[] = [
  "entrada",
  "saida",
  "transferencia",
  "ajuste",
];

export const ROTULO_TIPO: Record<TipoMovimentacao, string> = {
  entrada: "Entrada",
  saida: "Saída",
  transferencia: "Transferência",
  ajuste: "Ajuste",
};

export const AJUDA_TIPO: Record<TipoMovimentacao, string> = {
  entrada: "Mercadoria chegou ao estoque.",
  saida: "Mercadoria deixou o estoque.",
  transferencia: "Mercadoria mudou de local.",
  ajuste: "Correção depois de uma contagem.",
};

export const TOM_DO_TIPO: Record<
  TipoMovimentacao,
  "sucesso" | "perigo" | "info" | "alerta"
> = {
  entrada: "sucesso",
  saida: "perigo",
  transferencia: "info",
  ajuste: "alerta",
};

export function formatarMoeda(valor?: number | null): string {
  return valor == null ? "—" : FORMATO_MOEDA.format(valor);
}

export function formatarNumero(valor: number): string {
  return FORMATO_NUMERO.format(valor);
}

export function formatarDataHora(iso: string): string {
  return FORMATO_DATA_HORA.format(new Date(iso));
}

export function formatarDataCurta(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}

/** Compara textos sem acento e sem diferenciar maiúsculas de minúsculas. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function capitalizar(texto: string): string {
  return texto
    .trim()
    .split(/\s+/)
    .map((parte) => (parte ? parte[0].toUpperCase() + parte.slice(1).toLowerCase() : parte))
    .join(" ");
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function rotuloDoLocal(local: Local): string {
  return `${local.nome} (${local.codigo})`;
}

export function formatarAtributo(valor: string | number | null | undefined): string {
  if (valor == null || valor === "") return "—";
  return String(valor);
}

/** Sinal que a movimentação soma ou subtrai do saldo total da variante. */
export function sinalDaMovimentacao(movimentacao: Movimentacao): string {
  if (movimentacao.tipo === "entrada") return "+";
  if (movimentacao.tipo === "saida") return "−";
  if (movimentacao.tipo === "ajuste") return movimentacao.local_origem_id ? "−" : "+";
  return "";
}
