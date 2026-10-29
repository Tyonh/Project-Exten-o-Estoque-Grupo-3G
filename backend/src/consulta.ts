"use server";

import { listarCategorias, listarFamilias, listarVariantes } from "./catalogo";
import { listarLocais } from "./locais";
import { listarMovimentacoes } from "./movimentacoes";
import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { lerTodasAsLinhas } from "./servidor/paginar";
import { exigirConsulta } from "./servidor/perfil";
import type { DadosDoEstoque, Saldo } from "./tipos";

interface LinhaDoBanco {
  [chave: string]: unknown;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function mapearSaldo(linha: LinhaDoBanco): Saldo {
  return {
    variante_id: texto(linha.variante_id),
    local_id: texto(linha.local_id),
    quantidade: Number(linha.quantidade ?? 0),
  };
}

/** Saldos positivos de todas as variantes em todos os locais. */
export async function listarSaldos(): Promise<Resultado<Saldo[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const { data, error } = await lerTodasAsLinhas((de, ate) =>
    banco()
      .from("saldos")
      .select("variante_id, local_id, quantidade")
      .gt("quantidade", 0)
      .order("variante_id", { ascending: true })
      .order("local_id", { ascending: true })
      .range(de, ate),
  );

  if (error) {
    console.error("[consulta] Falha ao listar os saldos:", error.message);
    return falha("Não foi possível carregar os saldos.");
  }

  return sucesso((data ?? []).map((linha) => mapearSaldo(linha as LinhaDoBanco)));
}

/**
 * Carrega uma fotografia do estoque para as telas. As telas não falam com o
 * banco: recebem este pacote pronto do servidor e, depois de uma alteração,
 * pedem uma nova fotografia.
 */
export async function carregarDadosDoEstoque(): Promise<Resultado<DadosDoEstoque>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const [categorias, familias, variantes, locais, saldos, movimentacoes] =
    await Promise.all([
      listarCategorias(),
      listarFamilias(),
      listarVariantes(),
      listarLocais(),
      listarSaldos(),
      listarMovimentacoes(),
    ]);

  if (!categorias.ok) return categorias;
  if (!familias.ok) return familias;
  if (!variantes.ok) return variantes;
  if (!locais.ok) return locais;
  if (!saldos.ok) return saldos;
  if (!movimentacoes.ok) return movimentacoes;

  return sucesso({
    categorias: categorias.dados,
    familias: familias.dados,
    variantes: variantes.dados,
    locais: locais.dados,
    saldos: saldos.dados,
    movimentacoes: movimentacoes.dados,
  });
}
