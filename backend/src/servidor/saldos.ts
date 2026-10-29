import "server-only";

import { banco } from "./banco";

// Leitura e gravação condicional de saldos, usadas por todas as operações que
// mexem no estoque (movimentação avulsa, baixa de documento). Fica fora dos
// arquivos "use server" para não virar uma função chamável pelo navegador.

export interface SaldoAtual {
  quantidade: number;
  existe: boolean;
}

export async function lerSaldo(varianteId: string, localId: string): Promise<SaldoAtual | null> {
  const { data, error } = await banco()
    .from("saldos")
    .select("quantidade")
    .eq("variante_id", varianteId)
    .eq("local_id", localId)
    .maybeSingle();

  if (error) {
    console.error("[saldos] Falha ao ler o saldo:", error.message);
    return null;
  }
  return { quantidade: data ? Number(data.quantidade) : 0, existe: Boolean(data) };
}

/** Só grava se o saldo ainda for o que foi lido: impede duas operações de se atropelarem. */
export async function gravarSaldoCondicional(
  varianteId: string,
  localId: string,
  anterior: SaldoAtual,
  novo: number,
): Promise<boolean> {
  const agora = new Date().toISOString();

  if (anterior.existe) {
    const { data, error } = await banco()
      .from("saldos")
      .update({ quantidade: novo, atualizado_em: agora })
      .eq("variante_id", varianteId)
      .eq("local_id", localId)
      .eq("quantidade", anterior.quantidade)
      .select("quantidade");
    if (error) {
      console.error("[saldos] Falha ao gravar o saldo:", error.message);
      return false;
    }
    return Boolean(data && data.length > 0);
  }

  const { error } = await banco()
    .from("saldos")
    .insert({ variante_id: varianteId, local_id: localId, quantidade: novo });
  if (error) {
    console.error("[saldos] Falha ao criar o saldo:", error.message);
    return false;
  }
  return true;
}

export async function desfazerSaldo(
  varianteId: string,
  localId: string,
  anterior: SaldoAtual,
): Promise<void> {
  if (anterior.existe) {
    const { error } = await banco()
      .from("saldos")
      .update({ quantidade: anterior.quantidade, atualizado_em: new Date().toISOString() })
      .eq("variante_id", varianteId)
      .eq("local_id", localId);
    if (error) {
      console.error("[saldos] Falha ao desfazer o saldo:", error.message);
    }
    return;
  }

  const { error } = await banco()
    .from("saldos")
    .delete()
    .eq("variante_id", varianteId)
    .eq("local_id", localId);
  if (error) {
    console.error("[saldos] Falha ao apagar o saldo criado:", error.message);
  }
}
