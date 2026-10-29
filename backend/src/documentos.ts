"use server";

import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { montarCaminhos, type LocalDaArvore } from "./servidor/caminhos";
import { validarProtocolo } from "./servidor/documento-payload";
import { exigirConsulta, exigirOperacao } from "./servidor/perfil";
import {
  sugerirRetiradas,
  validarRetiradas,
  type ItemPedido,
  type SaldoDoLocal,
} from "./servidor/retiradas";
import { desfazerSaldo, gravarSaldoCondicional, type SaldoAtual } from "./servidor/saldos";
import type {
  DocumentoDetalhe,
  DocumentoSaida,
  ItemDoDocumento,
  LocalComSaldo,
  Retirada,
  StatusDocumento,
  TipoDocumento,
} from "./tipos";

interface LinhaDoBanco {
  [chave: string]: unknown;
}

const COLUNAS_DO_DOCUMENTO =
  "id, protocolo, origem, tipo_documento, cliente_nome, solicitante_nome, status, validado_na_origem, criado_em, baixado_por, baixado_em";
const LIMITE_DA_LISTA = 500;

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function textoOuNulo(valor: unknown): string | null {
  return typeof valor === "string" && valor ? valor : null;
}

async function nomesDosUsuarios(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await banco().from("perfis").select("id, nome").in("id", ids);
  if (error) {
    console.error("[documentos] Falha ao carregar os nomes:", error.message);
    return new Map();
  }
  return new Map((data ?? []).map((perfil) => [texto(perfil.id), texto(perfil.nome)]));
}

function mapearDocumento(
  linha: LinhaDoBanco,
  totalDeItens: number,
  nomes: Map<string, string>,
): DocumentoSaida {
  const baixadoPor = textoOuNulo(linha.baixado_por);
  return {
    id: texto(linha.id),
    protocolo: texto(linha.protocolo),
    origem: texto(linha.origem),
    tipo_documento: textoOuNulo(linha.tipo_documento) as TipoDocumento | null,
    cliente_nome: textoOuNulo(linha.cliente_nome),
    solicitante_nome: textoOuNulo(linha.solicitante_nome),
    status: texto(linha.status) as StatusDocumento,
    validado_na_origem: Boolean(linha.validado_na_origem),
    criado_em: texto(linha.criado_em),
    baixado_em: textoOuNulo(linha.baixado_em),
    baixado_por_nome: baixadoPor ? (nomes.get(baixadoPor) ?? "Usuário") : null,
    total_de_itens: totalDeItens,
  };
}

/** Documentos recebidos, os mais novos primeiro. `status` filtra pendentes, baixados ou cancelados. */
export async function listarDocumentos(
  status?: StatusDocumento,
): Promise<Resultado<DocumentoSaida[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  let consulta = banco()
    .from("documentos_saida")
    .select(COLUNAS_DO_DOCUMENTO)
    .order("criado_em", { ascending: false })
    .limit(LIMITE_DA_LISTA);
  if (status) consulta = consulta.eq("status", status);

  const { data, error } = await consulta;
  if (error) {
    console.error("[documentos] Falha ao listar:", error.message);
    return falha("Não foi possível carregar os documentos.");
  }
  const linhas = (data ?? []) as LinhaDoBanco[];
  if (linhas.length === 0) return sucesso([]);

  const ids = linhas.map((linha) => texto(linha.id));
  const [itens, nomes] = await Promise.all([
    banco().from("documento_itens").select("documento_id").in("documento_id", ids),
    nomesDosUsuarios(linhas.map((l) => texto(l.baixado_por)).filter(Boolean)),
  ]);
  if (itens.error) {
    console.error("[documentos] Falha ao contar os itens:", itens.error.message);
    return falha("Não foi possível carregar os documentos.");
  }

  const totais = new Map<string, number>();
  for (const item of itens.data ?? []) {
    const id = texto(item.documento_id);
    totais.set(id, (totais.get(id) ?? 0) + 1);
  }

  return sucesso(
    linhas.map((linha) => mapearDocumento(linha, totais.get(texto(linha.id)) ?? 0, nomes)),
  );
}

async function lerItensDoPedido(documentoId: string): Promise<Resultado<ItemPedido[]>> {
  const { data, error } = await banco()
    .from("documento_itens")
    .select("variante_id, quantidade")
    .eq("documento_id", documentoId);
  if (error) {
    console.error("[documentos] Falha ao ler os itens:", error.message);
    return falha("Não foi possível carregar os itens do documento.");
  }
  const itens = data ?? [];
  const ids = itens.map((item) => texto(item.variante_id));
  const { data: variantes, error: erroVariantes } = await banco()
    .from("variantes")
    .select("id, codigo, nome")
    .in("id", ids);
  if (erroVariantes) {
    console.error("[documentos] Falha ao ler as variantes:", erroVariantes.message);
    return falha("Não foi possível carregar os itens do documento.");
  }
  const porId = new Map((variantes ?? []).map((v) => [texto(v.id), v]));
  return sucesso(
    itens.map((item) => {
      const variante = porId.get(texto(item.variante_id));
      return {
        variante_id: texto(item.variante_id),
        quantidade: Number(item.quantidade),
        rotulo: variante ? `${texto(variante.codigo)} · ${texto(variante.nome)}` : "item",
      };
    }),
  );
}

/**
 * Abre um documento pelo protocolo (o que o QR code carrega), com os itens, os
 * locais com saldo de cada um e a sugestão de de onde tirar.
 */
export async function buscarDocumento(protocolo: string): Promise<Resultado<DocumentoDetalhe>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const normalizado = protocolo.trim().toUpperCase();
  if (!validarProtocolo(normalizado)) return falha("Protocolo inválido.");

  const { data: linha, error } = await banco()
    .from("documentos_saida")
    .select(COLUNAS_DO_DOCUMENTO)
    .eq("protocolo", normalizado)
    .maybeSingle();
  if (error) {
    console.error("[documentos] Falha ao buscar o documento:", error.message);
    return falha("Não foi possível carregar o documento.");
  }
  if (!linha) {
    return falha("Documento não encontrado. Confirme se o GEDOC já enviou este protocolo.");
  }

  const documentoId = texto(linha.id);
  const { data: itensBrutos, error: erroItens } = await banco()
    .from("documento_itens")
    .select("variante_id, quantidade")
    .eq("documento_id", documentoId);
  if (erroItens) {
    console.error("[documentos] Falha ao buscar os itens:", erroItens.message);
    return falha("Não foi possível carregar o documento.");
  }
  const itens = itensBrutos ?? [];
  const varianteIds = itens.map((item) => texto(item.variante_id));

  const [variantes, saldos, locais, nomes] = await Promise.all([
    banco().from("variantes").select("id, codigo, nome, marca, familia_id").in("id", varianteIds),
    banco().from("saldos").select("variante_id, local_id, quantidade").in("variante_id", varianteIds).gt("quantidade", 0),
    banco().from("locais").select("id, pai_id, nome, codigo, ativo"),
    nomesDosUsuarios([texto(linha.baixado_por)].filter(Boolean)),
  ]);
  for (const resposta of [variantes, saldos, locais]) {
    if (resposta.error) {
      console.error("[documentos] Falha ao montar o documento:", resposta.error.message);
      return falha("Não foi possível carregar o documento.");
    }
  }

  const familiaIds = [...new Set((variantes.data ?? []).map((v) => texto(v.familia_id)))];
  const { data: familias } = await banco().from("familias").select("id, nome").in("id", familiaIds);
  const nomeDaFamilia = new Map((familias ?? []).map((f) => [texto(f.id), texto(f.nome)]));
  const varianteDoId = new Map((variantes.data ?? []).map((v) => [texto(v.id), v]));

  const locaisDaArvore = (locais.data ?? []) as unknown as LocalDaArvore[];
  const caminhoDe = montarCaminhos(locaisDaArvore);
  const localDoId = new Map(locaisDaArvore.map((local) => [local.id, local]));

  const saldosPorVariante = new Map<string, SaldoDoLocal[]>();
  for (const saldo of saldos.data ?? []) {
    const local = localDoId.get(texto(saldo.local_id));
    if (!local?.ativo) continue;
    const lista = saldosPorVariante.get(texto(saldo.variante_id)) ?? [];
    lista.push({ local_id: texto(saldo.local_id), quantidade: Number(saldo.quantidade) });
    saldosPorVariante.set(texto(saldo.variante_id), lista);
  }

  const pedidos: ItemPedido[] = itens.map((item) => {
    const variante = varianteDoId.get(texto(item.variante_id));
    return {
      variante_id: texto(item.variante_id),
      quantidade: Number(item.quantidade),
      rotulo: variante ? `${texto(variante.codigo)} · ${texto(variante.nome)}` : "item",
    };
  });
  const { retiradas, faltas } = sugerirRetiradas(pedidos, saldosPorVariante);

  const itensDoDocumento: ItemDoDocumento[] = pedidos
    .map((pedido) => {
      const variante = varianteDoId.get(pedido.variante_id);
      const locaisDoItem: LocalComSaldo[] = [...(saldosPorVariante.get(pedido.variante_id) ?? [])]
        .sort((a, b) => b.quantidade - a.quantidade)
        .map((saldo) => ({
          local_id: saldo.local_id,
          codigo: localDoId.get(saldo.local_id)?.codigo ?? "",
          caminho: caminhoDe(saldo.local_id),
          quantidade: saldo.quantidade,
        }));
      return {
        variante_id: pedido.variante_id,
        codigo: texto(variante?.codigo),
        nome: texto(variante?.nome),
        marca: textoOuNulo(variante?.marca),
        familia: nomeDaFamilia.get(texto(variante?.familia_id)) ?? null,
        quantidade: pedido.quantidade,
        locais: locaisDoItem,
        sugestao: retiradas.filter((r) => r.variante_id === pedido.variante_id),
        falta: faltas.find((f) => f.variante_id === pedido.variante_id)?.faltam ?? 0,
      };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  return sucesso({
    ...mapearDocumento(linha as LinhaDoBanco, itens.length, nomes),
    itens: itensDoDocumento,
  });
}

function lerRetiradas(bruto: unknown): Retirada[] | null {
  if (!Array.isArray(bruto) || bruto.length === 0) return null;
  const retiradas: Retirada[] = [];
  for (const item of bruto) {
    if (typeof item !== "object" || item === null) return null;
    const { variante_id, local_id, quantidade } = item as Record<string, unknown>;
    if (typeof variante_id !== "string" || typeof local_id !== "string") return null;
    retiradas.push({ variante_id, local_id, quantidade: Number(quantidade) });
  }
  return retiradas;
}

async function devolverDocumentoParaPendente(documentoId: string): Promise<void> {
  const { error } = await banco()
    .from("documentos_saida")
    .update({ status: "pendente", baixado_por: null, baixado_em: null })
    .eq("id", documentoId);
  if (error) {
    console.error("[documentos] Falha ao reabrir o documento após erro:", error.message);
  }
}

/**
 * Dá baixa em um documento de saída. As retiradas dizem de qual local sai
 * cada item. Não existe baixa parcial; se faltar saldo em qualquer item,
 * nada é baixado. Só gerente de estoque e admin.
 */
export async function confirmarSaidaDocumento(
  documentoId: string,
  retiradasBrutas: Retirada[],
): Promise<Resultado<null>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const retiradas = lerRetiradas(retiradasBrutas);
  if (!retiradas) return falha("Informe de onde sai cada item do documento.");

  const { data: documento, error } = await banco()
    .from("documentos_saida")
    .select("id, protocolo, status, validado_na_origem")
    .eq("id", documentoId)
    .maybeSingle();
  if (error) {
    console.error("[documentos] Falha ao ler o documento:", error.message);
    return falha("Não foi possível conferir o documento.");
  }
  if (!documento) return falha("Documento não encontrado.");
  if (documento.status === "baixado") {
    return falha("Este documento já foi baixado e não pode ser baixado de novo.");
  }
  if (documento.status !== "pendente") return falha("Este documento foi cancelado.");
  if (!documento.validado_na_origem) {
    return falha("Este documento ainda não foi validado no GEDOC. A baixa só é liberada depois da validação.");
  }

  const itens = await lerItensDoPedido(documentoId);
  if (!itens.ok) return itens;

  const varianteIds = [...new Set(retiradas.map((r) => r.variante_id))];
  const localIds = [...new Set(retiradas.map((r) => r.local_id))];
  const { data: saldosLidos, error: erroSaldos } = await banco()
    .from("saldos")
    .select("variante_id, local_id, quantidade")
    .in("variante_id", varianteIds)
    .in("local_id", localIds);
  if (erroSaldos) {
    console.error("[documentos] Falha ao ler os saldos:", erroSaldos.message);
    return falha("Não foi possível conferir os saldos.");
  }
  const saldoAnterior = new Map<string, SaldoAtual>(
    (saldosLidos ?? []).map((s) => [
      `${texto(s.variante_id)}|${texto(s.local_id)}`,
      { quantidade: Number(s.quantidade), existe: true },
    ]),
  );
  const saldoDe = (v: string, l: string): number => saldoAnterior.get(`${v}|${l}`)?.quantidade ?? 0;

  const conferidas = validarRetiradas(itens.dados, retiradas, saldoDe);
  if (!conferidas.ok) return falha(conferidas.erro);

  // Trava o documento: duas confirmações ao mesmo tempo viram uma só. Quem
  // perder a corrida não encontra mais o documento pendente.
  const { data: travado, error: erroTrava } = await banco()
    .from("documentos_saida")
    .update({ status: "baixado", baixado_por: autor.dados.id, baixado_em: new Date().toISOString() })
    .eq("id", documentoId)
    .eq("status", "pendente")
    .select("id");
  if (erroTrava) {
    console.error("[documentos] Falha ao travar o documento:", erroTrava.message);
    return falha("Não foi possível baixar o documento. Nada foi alterado.");
  }
  if (!travado || travado.length === 0) {
    return falha("Este documento já foi baixado e não pode ser baixado de novo.");
  }

  const gravados: Array<{ retirada: (typeof conferidas.retiradas)[number]; anterior: SaldoAtual }> = [];
  async function desfazerTudo(): Promise<void> {
    for (const { retirada, anterior } of gravados) {
      await desfazerSaldo(retirada.variante_id, retirada.local_id, anterior);
    }
    await devolverDocumentoParaPendente(documentoId);
  }

  for (const retirada of conferidas.retiradas) {
    const anterior = saldoAnterior.get(`${retirada.variante_id}|${retirada.local_id}`);
    if (!anterior) {
      await desfazerTudo();
      return falha("O saldo mudou enquanto a operação era feita. Tente de novo.");
    }
    const gravou = await gravarSaldoCondicional(
      retirada.variante_id,
      retirada.local_id,
      anterior,
      anterior.quantidade - retirada.quantidade,
    );
    if (!gravou) {
      await desfazerTudo();
      return falha("O saldo mudou enquanto a operação era feita. Tente de novo.");
    }
    gravados.push({ retirada, anterior });
  }

  // O histórico é gravado de uma vez: ou todas as saídas entram, ou nenhuma.
  const { error: erroHistorico } = await banco()
    .from("movimentacoes")
    .insert(
      conferidas.retiradas.map((retirada) => ({
        variante_id: retirada.variante_id,
        tipo: "saida",
        quantidade: retirada.quantidade,
        local_origem_id: retirada.local_id,
        documento_id: documentoId,
        justificativa: `Saída do documento ${texto(documento.protocolo)}`,
        usuario_id: autor.dados.id,
      })),
    );
  if (erroHistorico) {
    console.error("[documentos] Falha ao gravar o histórico:", erroHistorico.message);
    await desfazerTudo();
    return falha("Não foi possível registrar a baixa. Nada foi alterado.");
  }

  return sucesso(null);
}
