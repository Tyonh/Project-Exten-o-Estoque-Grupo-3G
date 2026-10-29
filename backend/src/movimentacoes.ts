"use server";

import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { exigirConsulta, exigirOperacao } from "./servidor/perfil";
import type { DadosDeMovimentacao, Local, Movimentacao, Variante } from "./tipos";

interface LinhaDoBanco {
  [chave: string]: unknown;
}

interface SaldoAtual {
  quantidade: number;
  existe: boolean;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function mapearMovimentacao(linha: LinhaDoBanco, nomes: Map<string, string>): Movimentacao {
  const usuarioId = texto(linha.usuario_id);
  return {
    id: Number(linha.id),
    variante_id: texto(linha.variante_id),
    tipo: texto(linha.tipo) as Movimentacao["tipo"],
    quantidade: Number(linha.quantidade),
    local_origem_id: typeof linha.local_origem_id === "string" ? linha.local_origem_id : null,
    local_destino_id:
      typeof linha.local_destino_id === "string" ? linha.local_destino_id : null,
    documento_id: typeof linha.documento_id === "string" ? linha.documento_id : null,
    inventario_id: typeof linha.inventario_id === "string" ? linha.inventario_id : null,
    justificativa: typeof linha.justificativa === "string" ? linha.justificativa : undefined,
    usuario_id: usuarioId,
    usuario_nome: nomes.get(usuarioId) ?? "Usuário",
    criado_em: texto(linha.criado_em),
  };
}

async function nomesDosUsuarios(): Promise<Map<string, string>> {
  const { data, error } = await banco().from("perfis").select("id, nome");
  if (error) {
    console.error("[movimentacoes] Falha ao carregar os nomes:", error.message);
    return new Map();
  }
  return new Map((data ?? []).map((perfil) => [texto(perfil.id), texto(perfil.nome)]));
}

export async function listarMovimentacoes(): Promise<Resultado<Movimentacao[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const [{ data, error }, nomes] = await Promise.all([
    banco()
      .from("movimentacoes")
      .select(
        "id, variante_id, tipo, quantidade, local_origem_id, local_destino_id, documento_id, inventario_id, justificativa, usuario_id, criado_em",
      )
      .order("criado_em", { ascending: false })
      .limit(1000),
    nomesDosUsuarios(),
  ]);

  if (error) {
    console.error("[movimentacoes] Falha ao listar o histórico:", error.message);
    return falha("Não foi possível carregar o histórico.");
  }

  return sucesso(
    (data ?? []).map((linha) => mapearMovimentacao(linha as LinhaDoBanco, nomes)),
  );
}

async function lerSaldo(varianteId: string, localId: string): Promise<SaldoAtual | null> {
  const { data, error } = await banco()
    .from("saldos")
    .select("quantidade")
    .eq("variante_id", varianteId)
    .eq("local_id", localId)
    .maybeSingle();

  if (error) {
    console.error("[movimentacoes] Falha ao ler o saldo:", error.message);
    return null;
  }
  return { quantidade: data ? Number(data.quantidade) : 0, existe: Boolean(data) };
}

async function gravarSaldoCondicional(
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
      console.error("[movimentacoes] Falha ao gravar o saldo:", error.message);
      return false;
    }
    return Boolean(data && data.length > 0);
  }

  const { error } = await banco()
    .from("saldos")
    .insert({ variante_id: varianteId, local_id: localId, quantidade: novo });
  if (error) {
    console.error("[movimentacoes] Falha ao criar o saldo:", error.message);
    return false;
  }
  return true;
}

async function desfazerSaldo(
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
      console.error("[movimentacoes] Falha ao desfazer o saldo:", error.message);
    }
    return;
  }

  const { error } = await banco()
    .from("saldos")
    .delete()
    .eq("variante_id", varianteId)
    .eq("local_id", localId);
  if (error) {
    console.error("[movimentacoes] Falha ao apagar o saldo criado:", error.message);
  }
}

function combinaComTipo(entrada: DadosDeMovimentacao): string | null {
  if (!Number.isInteger(entrada.quantidade) || entrada.quantidade <= 0) {
    return "A quantidade precisa ser um número inteiro maior que zero.";
  }

  const origem = entrada.local_origem_id;
  const destino = entrada.local_destino_id;
  const justificativa = entrada.justificativa?.trim() ?? "";

  if (entrada.tipo === "entrada") {
    if (!destino || origem) return "A entrada precisa ter só o local de destino.";
    return null;
  }
  if (entrada.tipo === "saida") {
    if (!origem || destino) return "A saída precisa ter só o local de origem.";
    if (!justificativa) return "Informe o motivo da saída.";
    return null;
  }
  if (entrada.tipo === "transferencia") {
    if (!origem || !destino) return "Informe o local de origem e o de destino.";
    if (origem === destino) return "A origem e o destino precisam ser diferentes.";
    return null;
  }
  if (entrada.tipo === "ajuste") {
    if (Boolean(origem) === Boolean(destino)) {
      return "O ajuste precisa ter um local de origem (diminuir) ou de destino (aumentar).";
    }
    if (!justificativa) return "Informe o motivo do ajuste.";
    return null;
  }

  return "Escolha um tipo de movimentação válido.";
}

export async function registrarMovimentacao(
  entrada: DadosDeMovimentacao,
): Promise<Resultado<Movimentacao>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const erroDeTipo = combinaComTipo(entrada);
  if (erroDeTipo) return falha(erroDeTipo);

  const { data: varianteData, error: erroVariante } = await banco()
    .from("variantes")
    .select("id, codigo, nome, ativo")
    .eq("id", entrada.variante_id)
    .maybeSingle();
  if (erroVariante) {
    console.error("[movimentacoes] Falha ao ler a variante:", erroVariante.message);
    return falha("Não foi possível conferir a variante.");
  }
  if (!varianteData) return falha("Escolha uma variante.");
  const variante = varianteData as unknown as Variante;
  if (!variante.ativo) return falha("Esta variante está desativada e não pode ser movimentada.");

  const idsDeLocal = [entrada.local_origem_id, entrada.local_destino_id].filter(
    (id): id is string => Boolean(id),
  );
  const { data: locaisData, error: erroLocais } = await banco()
    .from("locais")
    .select("id, nome, codigo, ativo")
    .in("id", idsDeLocal);
  if (erroLocais) {
    console.error("[movimentacoes] Falha ao ler os locais:", erroLocais.message);
    return falha("Não foi possível conferir os locais.");
  }
  const locais = new Map(
    (locaisData ?? []).map((local) => [texto(local.id), local as unknown as Local]),
  );

  const origem = entrada.local_origem_id ? locais.get(entrada.local_origem_id) : null;
  const destino = entrada.local_destino_id ? locais.get(entrada.local_destino_id) : null;
  if (entrada.local_origem_id && !origem) return falha("O local de origem não existe.");
  if (entrada.local_destino_id && !destino) return falha("O local de destino não existe.");
  if (origem && !origem.ativo) return falha("O local de origem está desativado.");
  if (destino && !destino.ativo) return falha("O local de destino está desativado.");

  let saldoOrigem: SaldoAtual | null = null;
  let saldoDestino: SaldoAtual | null = null;

  if (entrada.local_origem_id) {
    saldoOrigem = await lerSaldo(entrada.variante_id, entrada.local_origem_id);
    if (!saldoOrigem) return falha("Não foi possível conferir o saldo de origem.");
    if (saldoOrigem.quantidade < entrada.quantidade) {
      return falha(
        `Saldo insuficiente em ${origem?.codigo ?? "origem"}: há ${saldoOrigem.quantidade} unidade(s).`,
      );
    }
  }

  if (entrada.local_destino_id) {
    saldoDestino = await lerSaldo(entrada.variante_id, entrada.local_destino_id);
    if (!saldoDestino) return falha("Não foi possível conferir o saldo de destino.");
  }

  let origemGravada = false;
  let destinoGravado = false;

  if (saldoOrigem && entrada.local_origem_id) {
    origemGravada = await gravarSaldoCondicional(
      entrada.variante_id,
      entrada.local_origem_id,
      saldoOrigem,
      saldoOrigem.quantidade - entrada.quantidade,
    );
    if (!origemGravada) {
      return falha("O saldo mudou enquanto a operação era feita. Tente de novo.");
    }
  }

  if (saldoDestino && entrada.local_destino_id) {
    destinoGravado = await gravarSaldoCondicional(
      entrada.variante_id,
      entrada.local_destino_id,
      saldoDestino,
      saldoDestino.quantidade + entrada.quantidade,
    );
    if (!destinoGravado) {
      if (origemGravada && saldoOrigem && entrada.local_origem_id) {
        await desfazerSaldo(entrada.variante_id, entrada.local_origem_id, saldoOrigem);
      }
      return falha("O saldo mudou enquanto a operação era feita. Tente de novo.");
    }
  }

  const justificativa = entrada.justificativa?.trim() || null;
  const { data: movimento, error: erroMovimento } = await banco()
    .from("movimentacoes")
    .insert({
      variante_id: entrada.variante_id,
      tipo: entrada.tipo,
      quantidade: entrada.quantidade,
      local_origem_id: entrada.local_origem_id,
      local_destino_id: entrada.local_destino_id,
      justificativa,
      usuario_id: autor.dados.id,
    })
    .select(
      "id, variante_id, tipo, quantidade, local_origem_id, local_destino_id, documento_id, inventario_id, justificativa, usuario_id, criado_em",
    )
    .single();

  if (erroMovimento || !movimento) {
    console.error(
      "[movimentacoes] Falha ao gravar o histórico:",
      erroMovimento?.message ?? "sem dados",
    );
    if (origemGravada && saldoOrigem && entrada.local_origem_id) {
      await desfazerSaldo(entrada.variante_id, entrada.local_origem_id, saldoOrigem);
    }
    if (destinoGravado && saldoDestino && entrada.local_destino_id) {
      await desfazerSaldo(entrada.variante_id, entrada.local_destino_id, saldoDestino);
    }
    return falha("Não foi possível registrar a movimentação. Nada foi alterado.");
  }

  return sucesso(
    mapearMovimentacao(
      movimento as LinhaDoBanco,
      new Map([[autor.dados.id, autor.dados.nome]]),
    ),
  );
}
