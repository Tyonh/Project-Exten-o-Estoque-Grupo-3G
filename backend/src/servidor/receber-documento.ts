import "server-only";

import { falha, sucesso, type Resultado } from "../resultado";
import { banco } from "./banco";
import type { DocumentoRecebido } from "./documento-payload";

// Recebimento de um documento de saída enviado pelo GEDOC (T8.1). Fica em
// servidor/ de propósito: NÃO é chamável pelas telas. Quem o chama é a rota
// frontend/app/api/documentos/route.ts, depois de conferir o segredo
// compartilhado com o GEDOC.

export interface DocumentoRegistrado {
  protocolo: string;
  criado: boolean;
  validado: boolean;
  total_de_itens: number;
}

const MAX_CODIGOS_NA_MENSAGEM = 10;

/**
 * Registra (ou atualiza) um documento pendente. O GEDOC reenvia o mesmo
 * protocolo quando o documento é validado: nesse caso só muda o que ainda
 * não foi baixado. Documento já baixado nunca é alterado.
 */
export async function registrarDocumentoRecebido(
  documento: DocumentoRecebido,
): Promise<Resultado<DocumentoRegistrado>> {
  // O catálogo guarda o código como veio do GEDOC ("50501-Nd"), mas cadastros
  // manuais ficam em maiúsculas: casa pelos dois jeitos.
  const codigos = documento.itens.map((item) => item.codigo);
  const consultados = [...new Set([...codigos, ...codigos.map((c) => c.toUpperCase())])];
  const { data: variantes, error: erroVariantes } = await banco()
    .from("variantes")
    .select("id, codigo, ativo")
    .in("codigo", consultados);
  if (erroVariantes) {
    console.error("[receber-documento] Falha ao ler as variantes:", erroVariantes.message);
    return falha("Não foi possível conferir os produtos do documento.");
  }

  const porCodigo = new Map<string, { id: string; ativo: boolean }>();
  for (const variante of variantes ?? []) {
    porCodigo.set(String(variante.codigo).toUpperCase(), {
      id: String(variante.id),
      ativo: Boolean(variante.ativo),
    });
  }

  const desconhecidos = codigos.filter((codigo) => !porCodigo.has(codigo.toUpperCase()));
  if (desconhecidos.length > 0) {
    const lista = desconhecidos.slice(0, MAX_CODIGOS_NA_MENSAGEM).join(", ");
    const resto = desconhecidos.length - MAX_CODIGOS_NA_MENSAGEM;
    return falha(
      `Produtos não cadastrados no estoque: ${lista}${resto > 0 ? ` e mais ${resto}` : ""}.`,
    );
  }

  const itens = documento.itens.map((item) => ({
    variante_id: porCodigo.get(item.codigo.toUpperCase())!.id,
    quantidade: item.quantidade,
  }));

  const { data: existente, error: erroExistente } = await banco()
    .from("documentos_saida")
    .select("id, status")
    .eq("protocolo", documento.protocolo)
    .maybeSingle();
  if (erroExistente) {
    console.error("[receber-documento] Falha ao procurar o protocolo:", erroExistente.message);
    return falha("Não foi possível registrar o documento.");
  }

  const campos = {
    origem: documento.origem,
    tipo_documento: documento.tipo_documento,
    cliente_nome: documento.cliente_nome,
    solicitante_nome: documento.solicitante_nome,
    validado_na_origem: documento.validado,
  };

  if (existente) {
    if (existente.status !== "pendente") {
      return falha("Este documento já foi baixado ou cancelado e não pode ser alterado.");
    }
    return atualizarPendente(String(existente.id), documento, campos, itens);
  }

  const { data: novo, error: erroNovo } = await banco()
    .from("documentos_saida")
    .insert({ protocolo: documento.protocolo, ...campos })
    .select("id")
    .single();
  if (erroNovo || !novo) {
    console.error("[receber-documento] Falha ao criar o documento:", erroNovo?.message ?? "sem dados");
    return falha("Não foi possível registrar o documento.");
  }

  const { error: erroItens } = await banco()
    .from("documento_itens")
    .insert(itens.map((item) => ({ documento_id: novo.id, ...item })));
  if (erroItens) {
    console.error("[receber-documento] Falha ao gravar os itens:", erroItens.message);
    await banco().from("documentos_saida").delete().eq("id", novo.id);
    return falha("Não foi possível registrar os itens do documento.");
  }

  return sucesso({
    protocolo: documento.protocolo,
    criado: true,
    validado: documento.validado,
    total_de_itens: itens.length,
  });
}

async function atualizarPendente(
  documentoId: string,
  documento: DocumentoRecebido,
  campos: Record<string, unknown>,
  itens: Array<{ variante_id: string; quantidade: number }>,
): Promise<Resultado<DocumentoRegistrado>> {
  // Guarda o que existia para devolver se a troca de itens falhar no meio.
  const { data: itensAntigos, error: erroLeitura } = await banco()
    .from("documento_itens")
    .select("variante_id, quantidade")
    .eq("documento_id", documentoId);
  if (erroLeitura) {
    console.error("[receber-documento] Falha ao ler os itens atuais:", erroLeitura.message);
    return falha("Não foi possível atualizar o documento.");
  }

  const { data: atualizado, error: erroUpdate } = await banco()
    .from("documentos_saida")
    .update(campos)
    .eq("id", documentoId)
    .eq("status", "pendente")
    .select("id");
  if (erroUpdate || !atualizado || atualizado.length === 0) {
    if (erroUpdate) console.error("[receber-documento] Falha ao atualizar:", erroUpdate.message);
    return falha("Não foi possível atualizar o documento. Ele pode ter sido baixado agora.");
  }

  const { error: erroApagar } = await banco().from("documento_itens").delete().eq("documento_id", documentoId);
  const { error: erroInserir } = erroApagar
    ? { error: erroApagar }
    : await banco()
        .from("documento_itens")
        .insert(itens.map((item) => ({ documento_id: documentoId, ...item })));
  if (erroApagar || erroInserir) {
    console.error("[receber-documento] Falha ao trocar os itens:", (erroApagar ?? erroInserir)?.message);
    if (itensAntigos && itensAntigos.length > 0) {
      await banco().from("documento_itens").delete().eq("documento_id", documentoId);
      await banco()
        .from("documento_itens")
        .insert(itensAntigos.map((item) => ({ documento_id: documentoId, ...item })));
    }
    return falha("Não foi possível atualizar os itens do documento.");
  }

  return sucesso({
    protocolo: documento.protocolo,
    criado: false,
    validado: documento.validado,
    total_de_itens: itens.length,
  });
}
