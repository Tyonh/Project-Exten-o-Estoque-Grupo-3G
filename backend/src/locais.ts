"use server";

import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { motivoParaNaoApagar } from "./servidor/locais-regras";
import { exigirConsulta, exigirOperacao } from "./servidor/perfil";
import type { Local, NovoLocal } from "./tipos";

interface LinhaDoBanco {
  [chave: string]: unknown;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function mapearLocal(linha: LinhaDoBanco): Local {
  return {
    id: texto(linha.id),
    pai_id: typeof linha.pai_id === "string" ? linha.pai_id : null,
    nome: texto(linha.nome),
    tipo: texto(linha.tipo),
    codigo: texto(linha.codigo),
    capacidade: linha.capacidade == null ? null : Number(linha.capacidade),
    ativo: Boolean(linha.ativo),
  };
}

async function todosOsLocais(): Promise<Local[] | null> {
  const { data, error } = await banco()
    .from("locais")
    .select("id, pai_id, nome, tipo, codigo, capacidade, ativo")
    .order("codigo", { ascending: true });
  if (error) {
    console.error("[locais] Falha ao carregar os locais:", error.message);
    return null;
  }
  return (data ?? []).map((linha) => mapearLocal(linha as LinhaDoBanco));
}

function descendentes(locais: Local[], localId: string): Set<string> {
  const encontrados = new Set<string>();
  const fila = [localId];

  while (fila.length > 0) {
    const atual = fila.shift()!;
    for (const local of locais) {
      if (local.pai_id === atual && !encontrados.has(local.id)) {
        encontrados.add(local.id);
        fila.push(local.id);
      }
    }
  }

  return encontrados;
}

async function validarPai(
  paiId: string | null,
  locais: Local[],
  idAtual: string | null,
  exigirAtivo: boolean,
): Promise<string | null> {
  if (!paiId) return null;

  const pai = locais.find((local) => local.id === paiId);
  if (!pai) return "O local pai não existe.";
  if (paiId === idAtual) return "Um local não pode ficar dentro dele mesmo.";
  if (idAtual && descendentes(locais, idAtual).has(paiId)) {
    return "Um local não pode ser movido para dentro de um descendente.";
  }
  if (exigirAtivo && !pai.ativo) return "O local pai está desativado.";
  return null;
}

async function motivoParaNaoDesativar(locais: Local[], id: string): Promise<string | null> {
  const filhosAtivos = locais.some((local) => local.pai_id === id && local.ativo);
  if (filhosAtivos) {
    return "Desative os sublocais antes de desativar este local.";
  }

  const ids = new Set([id, ...descendentes(locais, id)]);
  const { data: saldos, error: erroSaldos } = await banco()
    .from("saldos")
    .select("local_id, quantidade")
    .in("local_id", [...ids]);
  if (erroSaldos) {
    console.error("[locais] Falha ao conferir o saldo do local:", erroSaldos.message);
    return "Não foi possível conferir o saldo do local.";
  }
  if ((saldos ?? []).some((saldo) => Number(saldo.quantidade) > 0)) {
    return "Este local ainda tem mercadoria e não pode ser desativado.";
  }

  return null;
}

function motivoParaNaoReativar(locais: Local[], paiId: string | null): string | null {
  if (!paiId) return null;
  const pai = locais.find((local) => local.id === paiId);
  if (!pai) return "O local pai não existe.";
  if (!pai.ativo) return "Ative o local pai antes de reativar este local.";
  return null;
}

function validarLocal(entrada: NovoLocal): string | null {
  if (!entrada.nome.trim()) return "Informe o nome do local.";
  if (!entrada.tipo.trim()) return "Informe o tipo do local.";
  if (!entrada.codigo.trim()) return "Informe o código do local.";
  if (
    entrada.capacidade != null &&
    (!Number.isInteger(entrada.capacidade) || entrada.capacidade <= 0)
  ) {
    return "A capacidade precisa ser um número inteiro maior que zero.";
  }
  return null;
}

function traduzirErroDoBanco(
  erro: { code?: string; message: string },
  padrao: string,
): string {
  console.error("[locais] Erro do banco:", erro.code ?? "sem código", erro.message);
  if (erro.code === "23505") return "Já existe um local com esse código.";
  return padrao;
}

export async function listarLocais(): Promise<Resultado<Local[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const locais = await todosOsLocais();
  if (!locais) return falha("Não foi possível carregar os locais.");
  return sucesso(locais);
}

export async function criarLocal(entrada: NovoLocal): Promise<Resultado<Local>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const erro = validarLocal(entrada);
  if (erro) return falha(erro);

  const locais = await todosOsLocais();
  if (!locais) return falha("Não foi possível conferir os locais.");
  const erroPai = await validarPai(entrada.pai_id, locais, null, true);
  if (erroPai) return falha(erroPai);

  const { data, error } = await banco()
    .from("locais")
    .insert({
      pai_id: entrada.pai_id,
      nome: entrada.nome.trim(),
      tipo: entrada.tipo.trim(),
      codigo: entrada.codigo.trim().toUpperCase(),
      capacidade: entrada.capacidade ?? null,
      ativo: entrada.ativo !== false,
    })
    .select("id, pai_id, nome, tipo, codigo, capacidade, ativo")
    .single();

  if (error || !data) {
    return falha(
      traduzirErroDoBanco(
        error ?? { message: "sem dados" },
        "Não foi possível criar o local.",
      ),
    );
  }

  return sucesso(mapearLocal(data as LinhaDoBanco));
}

export async function editarLocal(
  id: string,
  entrada: NovoLocal,
): Promise<Resultado<Local>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const erro = validarLocal(entrada);
  if (erro) return falha(erro);

  const locais = await todosOsLocais();
  if (!locais) return falha("Não foi possível conferir os locais.");
  const atual = locais.find((local) => local.id === id);
  if (!atual) return falha("Local não encontrado.");

  const mudouDePai = (atual.pai_id ?? null) !== (entrada.pai_id ?? null);
  const erroPai = await validarPai(entrada.pai_id, locais, id, mudouDePai);
  if (erroPai) return falha(erroPai);

  if (atual.ativo && entrada.ativo === false) {
    const motivo = await motivoParaNaoDesativar(locais, id);
    if (motivo) return falha(motivo);
  }
  if (!atual.ativo && entrada.ativo !== false) {
    const motivo = motivoParaNaoReativar(locais, entrada.pai_id);
    if (motivo) return falha(motivo);
  }

  const { data, error } = await banco()
    .from("locais")
    .update({
      pai_id: entrada.pai_id,
      nome: entrada.nome.trim(),
      tipo: entrada.tipo.trim(),
      codigo: entrada.codigo.trim().toUpperCase(),
      capacidade: entrada.capacidade ?? null,
      ativo: entrada.ativo !== false,
    })
    .eq("id", id)
    .select("id, pai_id, nome, tipo, codigo, capacidade, ativo")
    .maybeSingle();

  if (error) {
    return falha(traduzirErroDoBanco(error, "Não foi possível salvar o local."));
  }
  if (!data) return falha("Local não encontrado.");

  return sucesso(mapearLocal(data as LinhaDoBanco));
}

export async function moverLocal(
  id: string,
  paiId: string | null,
): Promise<Resultado<Local>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const locais = await todosOsLocais();
  if (!locais) return falha("Não foi possível conferir os locais.");
  if (!locais.some((local) => local.id === id)) return falha("Local não encontrado.");

  const erroPai = await validarPai(paiId, locais, id, true);
  if (erroPai) return falha(erroPai);

  const { data, error } = await banco()
    .from("locais")
    .update({ pai_id: paiId })
    .eq("id", id)
    .select("id, pai_id, nome, tipo, codigo, capacidade, ativo")
    .maybeSingle();

  if (error) {
    return falha(traduzirErroDoBanco(error, "Não foi possível mover o local."));
  }
  if (!data) return falha("Local não encontrado.");

  return sucesso(mapearLocal(data as LinhaDoBanco));
}

/**
 * Apaga um local criado por engano. Só é permitido quando ele não tem
 * sublocais, mercadoria, movimentação nem inventário: o histórico nunca é
 * apagado. Local com histórico continua podendo ser desativado.
 */
export async function apagarLocal(id: string): Promise<Resultado<null>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const locais = await todosOsLocais();
  if (!locais) return falha("Não foi possível conferir os locais.");
  if (!locais.some((local) => local.id === id)) return falha("Local não encontrado.");

  const [saldos, comoOrigem, comoDestino, inventarios] = await Promise.all([
    banco().from("saldos").select("quantidade").eq("local_id", id),
    banco().from("movimentacoes").select("id", { count: "exact", head: true }).eq("local_origem_id", id),
    banco().from("movimentacoes").select("id", { count: "exact", head: true }).eq("local_destino_id", id),
    banco().from("inventarios").select("id", { count: "exact", head: true }).eq("local_id", id),
  ]);
  const falhaNaConferencia = [saldos, comoOrigem, comoDestino, inventarios].find((r) => r.error);
  if (falhaNaConferencia?.error) {
    console.error("[locais] Falha ao conferir o local antes de apagar:", falhaNaConferencia.error.message);
    return falha("Não foi possível conferir o local. Nada foi apagado.");
  }

  const motivo = motivoParaNaoApagar({
    sublocais: locais.filter((local) => local.pai_id === id).length,
    temSaldo: (saldos.data ?? []).some((saldo) => Number(saldo.quantidade) > 0),
    movimentacoes: (comoOrigem.count ?? 0) + (comoDestino.count ?? 0),
    inventarios: inventarios.count ?? 0,
  });
  if (motivo) return falha(motivo);

  // Linhas de saldo zerado, sem nenhuma movimentação por trás, só atrapalham a exclusão.
  const { error: erroSaldos } = await banco().from("saldos").delete().eq("local_id", id);
  if (erroSaldos) {
    console.error("[locais] Falha ao limpar os saldos zerados:", erroSaldos.message);
    return falha("Não foi possível apagar o local.");
  }

  const { error } = await banco().from("locais").delete().eq("id", id);
  if (error) {
    // 23503: alguém movimentou o local entre a conferência e a exclusão.
    if (error.code === "23503") {
      return falha("Este local acabou de receber movimentação e não pode mais ser apagado. Use Desativar.");
    }
    return falha(traduzirErroDoBanco(error, "Não foi possível apagar o local."));
  }

  return sucesso(null);
}

export async function alternarLocal(id: string): Promise<Resultado<Local>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const locais = await todosOsLocais();
  if (!locais) return falha("Não foi possível conferir os locais.");
  const atual = locais.find((local) => local.id === id);
  if (!atual) return falha("Local não encontrado.");

  if (atual.ativo) {
    const motivo = await motivoParaNaoDesativar(locais, id);
    if (motivo) return falha(motivo);
  } else {
    const motivo = motivoParaNaoReativar(locais, atual.pai_id);
    if (motivo) return falha(motivo);
  }

  const { data, error } = await banco()
    .from("locais")
    .update({ ativo: !atual.ativo })
    .eq("id", id)
    .select("id, pai_id, nome, tipo, codigo, capacidade, ativo")
    .maybeSingle();

  if (error) {
    return falha(traduzirErroDoBanco(error, "Não foi possível alterar o local."));
  }
  if (!data) return falha("Local não encontrado.");

  return sucesso(mapearLocal(data as LinhaDoBanco));
}
