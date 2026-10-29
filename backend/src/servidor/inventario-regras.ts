// Regras puras do inventário (sem banco), para serem testadas sozinhas.
// Quem grava é `concluirInventario` em inventarios.ts.

export interface ItemContado {
  variante_id: string;
  quantidade_contada: number | null;
}

export interface Ajuste {
  variante_id: string;
  /** `entrada` quando contou mais que o sistema, `saida` quando contou menos. */
  tipo: "entrada" | "saida";
  quantidade: number;
  saldo_atual: number;
  saldo_novo: number;
}

const MAX_CONTAGEM = 1_000_000;

/** Quantidade contada digitada: inteiro maior ou igual a zero, ou `null` para limpar a contagem. */
export function lerContagem(valor: unknown): { ok: true; quantidade: number | null } | { ok: false; erro: string } {
  if (valor === null || valor === undefined || valor === "") return { ok: true, quantidade: null };
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > MAX_CONTAGEM) {
    return { ok: false, erro: "A quantidade contada precisa ser um número inteiro maior ou igual a zero." };
  }
  return { ok: true, quantidade: numero };
}

/**
 * Compara a contagem com o saldo **do momento da conclusão** (não com o que o
 * inventário guardou ao abrir) e devolve só as diferenças. Itens sem
 * contagem são ignorados; contagem igual ao saldo não gera ajuste.
 */
export function calcularAjustes(
  itens: readonly ItemContado[],
  saldoAtual: (varianteId: string) => number,
): Ajuste[] {
  const ajustes: Ajuste[] = [];
  for (const item of itens) {
    if (item.quantidade_contada === null) continue;
    const atual = saldoAtual(item.variante_id);
    const diferenca = item.quantidade_contada - atual;
    if (diferenca === 0) continue;
    ajustes.push({
      variante_id: item.variante_id,
      tipo: diferenca > 0 ? "entrada" : "saida",
      quantidade: Math.abs(diferenca),
      saldo_atual: atual,
      saldo_novo: item.quantidade_contada,
    });
  }
  return ajustes;
}
