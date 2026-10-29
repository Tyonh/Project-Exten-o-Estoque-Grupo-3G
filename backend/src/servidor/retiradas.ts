// Regras puras da baixa de um documento de saída (sem banco), para serem
// testadas sozinhas. Quem grava é `confirmarSaidaDocumento` em documentos.ts.

export interface ItemPedido {
  variante_id: string;
  quantidade: number;
  /** Texto para as mensagens de erro, por exemplo "50501 · Refletor LED 100W". */
  rotulo: string;
}

export interface Retirada {
  variante_id: string;
  local_id: string;
  quantidade: number;
}

export interface SaldoDoLocal {
  local_id: string;
  quantidade: number;
}

export interface Falta {
  variante_id: string;
  rotulo: string;
  faltam: number;
}

export type ResultadoDeRetiradas =
  | { ok: true; retiradas: Retirada[] }
  | { ok: false; erro: string };

/**
 * Sugere de onde tirar cada item: começa pelo local com mais saldo e completa
 * com os seguintes, então um item pode sair de dois ou mais locais. O que não
 * há saldo para cobrir volta em `faltas`.
 */
export function sugerirRetiradas(
  itens: readonly ItemPedido[],
  saldosPorVariante: ReadonlyMap<string, readonly SaldoDoLocal[]>,
): { retiradas: Retirada[]; faltas: Falta[] } {
  const retiradas: Retirada[] = [];
  const faltas: Falta[] = [];

  for (const item of itens) {
    const locais = [...(saldosPorVariante.get(item.variante_id) ?? [])]
      .filter((saldo) => saldo.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade || a.local_id.localeCompare(b.local_id));

    let restante = item.quantidade;
    for (const saldo of locais) {
      if (restante <= 0) break;
      const quantidade = Math.min(restante, saldo.quantidade);
      retiradas.push({ variante_id: item.variante_id, local_id: saldo.local_id, quantidade });
      restante -= quantidade;
    }
    if (restante > 0) {
      faltas.push({ variante_id: item.variante_id, rotulo: item.rotulo, faltam: restante });
    }
  }

  return { retiradas, faltas };
}

/**
 * Confere as retiradas escolhidas na tela contra o documento e os saldos.
 * Não existe baixa parcial: a soma de cada variante tem de ser exatamente a
 * quantidade pedida. Retiradas repetidas do mesmo local são somadas.
 */
export function validarRetiradas(
  itens: readonly ItemPedido[],
  retiradas: readonly Retirada[],
  saldoDe: (varianteId: string, localId: string) => number,
): ResultadoDeRetiradas {
  const pedidos = new Map(itens.map((item) => [item.variante_id, item]));
  const agrupadas = new Map<string, Retirada>();

  for (const retirada of retiradas) {
    if (!Number.isInteger(retirada.quantidade) || retirada.quantidade <= 0) {
      return { ok: false, erro: "A quantidade de cada retirada precisa ser um número inteiro maior que zero." };
    }
    if (!pedidos.has(retirada.variante_id)) {
      return { ok: false, erro: "As retiradas informadas não batem com os itens do documento." };
    }
    if (!retirada.local_id) {
      return { ok: false, erro: "Escolha o local de onde sai cada item." };
    }
    const chave = `${retirada.variante_id}|${retirada.local_id}`;
    const anterior = agrupadas.get(chave);
    agrupadas.set(chave, {
      ...retirada,
      quantidade: (anterior?.quantidade ?? 0) + retirada.quantidade,
    });
  }

  const somaPorVariante = new Map<string, number>();
  for (const retirada of agrupadas.values()) {
    somaPorVariante.set(
      retirada.variante_id,
      (somaPorVariante.get(retirada.variante_id) ?? 0) + retirada.quantidade,
    );
  }

  for (const item of itens) {
    if ((somaPorVariante.get(item.variante_id) ?? 0) !== item.quantidade) {
      return { ok: false, erro: "As retiradas informadas não batem com os itens do documento." };
    }
  }

  for (const retirada of agrupadas.values()) {
    const disponivel = saldoDe(retirada.variante_id, retirada.local_id);
    if (disponivel < retirada.quantidade) {
      const rotulo = pedidos.get(retirada.variante_id)?.rotulo ?? "item";
      return {
        ok: false,
        erro: `Saldo insuficiente para ${rotulo} (disponível: ${disponivel}, solicitado: ${retirada.quantidade}). Nada foi baixado.`,
      };
    }
  }

  return { ok: true, retiradas: [...agrupadas.values()] };
}
