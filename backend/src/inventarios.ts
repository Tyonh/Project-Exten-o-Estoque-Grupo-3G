"use server";

import { falha, sucesso, type Resultado } from "./resultado";
import { banco } from "./servidor/banco";
import { montarCaminhos, type LocalDaArvore } from "./servidor/caminhos";
import { calcularAjustes, lerContagem } from "./servidor/inventario-regras";
import { emLotes, lerTodasAsLinhas } from "./servidor/paginar";
import { exigirConsulta, exigirOperacao } from "./servidor/perfil";
import { desfazerSaldo, gravarSaldoCondicional, type SaldoAtual } from "./servidor/saldos";
import type {
  AjusteDoInventario,
  Inventario,
  InventarioDetalhe,
  ItemDoInventario,
  StatusInventario,
} from "./tipos";

interface LinhaDoBanco {
  [chave: string]: unknown;
}

const COLUNAS_DO_INVENTARIO =
  "id, local_id, status, observacao, aberto_por, aberto_em, concluido_por, concluido_em";
const LIMITE_DA_LISTA = 200;
const TAMANHO_DO_LOTE_DE_GRAVACAO = 500;
const JUSTIFICATIVA_DO_AJUSTE = "Ajuste de inventário";

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function textoOuNulo(valor: unknown): string | null {
  return typeof valor === "string" && valor ? valor : null;
}

async function nomesDosUsuarios(ids: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter(Boolean))];
  const nomes = new Map<string, string>();
  for (const lote of emLotes(unicos)) {
    const { data, error } = await banco().from("perfis").select("id, nome").in("id", lote);
    if (error) {
      console.error("[inventarios] Falha ao carregar os nomes:", error.message);
      continue;
    }
    for (const perfil of data ?? []) nomes.set(texto(perfil.id), texto(perfil.nome));
  }
  return nomes;
}

async function lerLocais(): Promise<Resultado<LocalDaArvore[]>> {
  const { data, error } = await banco().from("locais").select("id, pai_id, nome, codigo, ativo");
  if (error) {
    console.error("[inventarios] Falha ao ler os locais:", error.message);
    return falha("Não foi possível carregar os locais.");
  }
  return sucesso((data ?? []) as unknown as LocalDaArvore[]);
}

/** Saldos de todas as variantes em um local, por variante. */
async function saldosDoLocal(localId: string): Promise<Resultado<Map<string, SaldoAtual>>> {
  const { data, error } = await lerTodasAsLinhas((de, ate) =>
    banco()
      .from("saldos")
      .select("variante_id, quantidade")
      .eq("local_id", localId)
      .order("variante_id", { ascending: true })
      .range(de, ate),
  );
  if (error) {
    console.error("[inventarios] Falha ao ler os saldos do local:", error.message);
    return falha("Não foi possível conferir os saldos do local.");
  }
  return sucesso(
    new Map(
      (data as LinhaDoBanco[]).map((linha) => [
        texto(linha.variante_id),
        { quantidade: Number(linha.quantidade), existe: true },
      ]),
    ),
  );
}

interface LinhaDeItem {
  variante_id: string;
  quantidade_sistema: number;
  quantidade_contada: number | null;
}

async function lerItens(inventarioId: string): Promise<Resultado<LinhaDeItem[]>> {
  const { data, error } = await lerTodasAsLinhas((de, ate) =>
    banco()
      .from("inventario_itens")
      .select("variante_id, quantidade_sistema, quantidade_contada")
      .eq("inventario_id", inventarioId)
      .order("variante_id", { ascending: true })
      .range(de, ate),
  );
  if (error) {
    console.error("[inventarios] Falha ao ler os itens:", error.message);
    return falha("Não foi possível carregar os itens do inventário.");
  }
  return sucesso(
    (data as LinhaDoBanco[]).map((linha) => ({
      variante_id: texto(linha.variante_id),
      quantidade_sistema: Number(linha.quantidade_sistema),
      quantidade_contada: linha.quantidade_contada == null ? null : Number(linha.quantidade_contada),
    })),
  );
}

/** Inventários, os mais novos primeiro, com quantos itens têm e quantos já foram contados. */
export async function listarInventarios(): Promise<Resultado<Inventario[]>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const { data, error } = await banco()
    .from("inventarios")
    .select(COLUNAS_DO_INVENTARIO)
    .order("aberto_em", { ascending: false })
    .limit(LIMITE_DA_LISTA);
  if (error) {
    console.error("[inventarios] Falha ao listar:", error.message);
    return falha("Não foi possível carregar os inventários.");
  }
  const linhas = (data ?? []) as LinhaDoBanco[];
  if (linhas.length === 0) return sucesso([]);

  const locais = await lerLocais();
  if (!locais.ok) return locais;
  const caminhoDe = montarCaminhos(locais.dados);
  const localDoId = new Map(locais.dados.map((local) => [local.id, local]));
  const nomes = await nomesDosUsuarios(
    linhas.flatMap((linha) => [texto(linha.aberto_por), texto(linha.concluido_por)]),
  );

  const totais = new Map<string, { itens: number; contados: number }>();
  for (const lote of emLotes(linhas.map((linha) => texto(linha.id)), 20)) {
    const { data: itens, error: erroItens } = await lerTodasAsLinhas((de, ate) =>
      banco()
        .from("inventario_itens")
        .select("inventario_id, variante_id, quantidade_contada")
        .in("inventario_id", lote)
        .order("inventario_id", { ascending: true })
        .order("variante_id", { ascending: true })
        .range(de, ate),
    );
    if (erroItens) {
      console.error("[inventarios] Falha ao contar os itens:", erroItens.message);
      return falha("Não foi possível carregar os inventários.");
    }
    for (const item of itens as LinhaDoBanco[]) {
      const id = texto(item.inventario_id);
      const atual = totais.get(id) ?? { itens: 0, contados: 0 };
      totais.set(id, {
        itens: atual.itens + 1,
        contados: atual.contados + (item.quantidade_contada == null ? 0 : 1),
      });
    }
  }

  return sucesso(
    linhas.map((linha): Inventario => {
      const total = totais.get(texto(linha.id)) ?? { itens: 0, contados: 0 };
      return {
        id: texto(linha.id),
        local_id: texto(linha.local_id),
        local_codigo: localDoId.get(texto(linha.local_id))?.codigo ?? "",
        local_caminho: caminhoDe(texto(linha.local_id)),
        status: texto(linha.status) as StatusInventario,
        observacao: textoOuNulo(linha.observacao),
        aberto_por_nome: nomes.get(texto(linha.aberto_por)) ?? "Usuário",
        aberto_em: texto(linha.aberto_em),
        concluido_por_nome: nomes.get(texto(linha.concluido_por)) ?? null,
        concluido_em: textoOuNulo(linha.concluido_em),
        total_de_itens: total.itens,
        total_contados: total.contados,
      };
    }),
  );
}

/**
 * Abre o inventário de um local. Só pode haver um aberto por local. Guarda o
 * que o sistema dizia ter ali naquele momento (variantes com saldo maior que
 * zero).
 */
export async function abrirInventario(
  localId: string,
  observacao?: string,
): Promise<Resultado<{ id: string }>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const { data: local, error: erroLocal } = await banco()
    .from("locais")
    .select("id, ativo")
    .eq("id", localId)
    .maybeSingle();
  if (erroLocal) {
    console.error("[inventarios] Falha ao ler o local:", erroLocal.message);
    return falha("Não foi possível conferir o local.");
  }
  if (!local) return falha("Escolha um local.");
  if (!local.ativo) return falha("Este local está desativado.");

  const { data: abertos, error: erroAbertos } = await banco()
    .from("inventarios")
    .select("id")
    .eq("local_id", localId)
    .eq("status", "aberto")
    .limit(1);
  if (erroAbertos) {
    console.error("[inventarios] Falha ao procurar inventário aberto:", erroAbertos.message);
    return falha("Não foi possível conferir os inventários do local.");
  }
  if ((abertos ?? []).length > 0) {
    return falha("Já existe um inventário aberto para este local. Conclua ou cancele antes de abrir outro.");
  }

  const saldos = await saldosDoLocal(localId);
  if (!saldos.ok) return saldos;
  const comSaldo = [...saldos.dados.entries()].filter(([, saldo]) => saldo.quantidade > 0);

  const { data: criado, error: erroCriar } = await banco()
    .from("inventarios")
    .insert({
      local_id: localId,
      observacao: observacao?.trim() || null,
      aberto_por: autor.dados.id,
    })
    .select("id")
    .single();
  if (erroCriar || !criado) {
    console.error("[inventarios] Falha ao criar:", erroCriar?.message ?? "sem dados");
    return falha("Não foi possível abrir o inventário.");
  }

  for (const lote of emLotes(comSaldo, TAMANHO_DO_LOTE_DE_GRAVACAO)) {
    const { error: erroItens } = await banco()
      .from("inventario_itens")
      .insert(
        lote.map(([varianteId, saldo]) => ({
          inventario_id: criado.id,
          variante_id: varianteId,
          quantidade_sistema: saldo.quantidade,
        })),
      );
    if (erroItens) {
      console.error("[inventarios] Falha ao gravar os itens:", erroItens.message);
      // Os itens saem junto (ON DELETE CASCADE): não fica inventário pela metade.
      await banco().from("inventarios").delete().eq("id", criado.id);
      return falha("Não foi possível abrir o inventário. Nada foi criado.");
    }
  }

  return sucesso({ id: texto(criado.id) });
}

async function lerInventarioAberto(
  inventarioId: string,
): Promise<Resultado<{ id: string; local_id: string }>> {
  const { data, error } = await banco()
    .from("inventarios")
    .select("id, local_id, status")
    .eq("id", inventarioId)
    .maybeSingle();
  if (error) {
    console.error("[inventarios] Falha ao ler o inventário:", error.message);
    return falha("Não foi possível carregar o inventário.");
  }
  if (!data) return falha("Inventário não encontrado.");
  if (data.status === "concluido") return falha("Este inventário já foi concluído e não pode ser alterado.");
  if (data.status === "cancelado") return falha("Este inventário foi cancelado e não pode ser alterado.");
  return sucesso({ id: texto(data.id), local_id: texto(data.local_id) });
}

/** Inventário com os itens e, enquanto aberto, as diferenças que a conclusão vai gravar. */
export async function buscarInventario(inventarioId: string): Promise<Resultado<InventarioDetalhe>> {
  const autor = await exigirConsulta();
  if (!autor.ok) return autor;

  const { data: linha, error } = await banco()
    .from("inventarios")
    .select(COLUNAS_DO_INVENTARIO)
    .eq("id", inventarioId)
    .maybeSingle();
  if (error) {
    console.error("[inventarios] Falha ao buscar:", error.message);
    return falha("Não foi possível carregar o inventário.");
  }
  if (!linha) return falha("Inventário não encontrado.");

  const itens = await lerItens(inventarioId);
  if (!itens.ok) return itens;

  const varianteDoId = new Map<string, LinhaDoBanco>();
  const familiaDoId = new Map<string, string>();
  for (const lote of emLotes(itens.dados.map((item) => item.variante_id))) {
    const { data: variantes, error: erroVariantes } = await banco()
      .from("variantes")
      .select("id, codigo, nome, marca, familia_id")
      .in("id", lote);
    if (erroVariantes) {
      console.error("[inventarios] Falha ao ler as variantes:", erroVariantes.message);
      return falha("Não foi possível carregar o inventário.");
    }
    for (const variante of variantes ?? []) varianteDoId.set(texto(variante.id), variante);
  }
  const familiaIds = [...new Set([...varianteDoId.values()].map((v) => texto(v.familia_id)))];
  for (const lote of emLotes(familiaIds)) {
    const { data: familias } = await banco().from("familias").select("id, nome").in("id", lote);
    for (const familia of familias ?? []) familiaDoId.set(texto(familia.id), texto(familia.nome));
  }

  const locais = await lerLocais();
  if (!locais.ok) return locais;
  const caminhoDe = montarCaminhos(locais.dados);
  const local = locais.dados.find((item) => item.id === texto(linha.local_id));
  const nomes = await nomesDosUsuarios([texto(linha.aberto_por), texto(linha.concluido_por)]);

  const itensDaTela: ItemDoInventario[] = itens.dados
    .map((item) => {
      const variante = varianteDoId.get(item.variante_id);
      return {
        variante_id: item.variante_id,
        codigo: texto(variante?.codigo),
        nome: texto(variante?.nome),
        marca: textoOuNulo(variante?.marca),
        familia: familiaDoId.get(texto(variante?.familia_id)) ?? null,
        quantidade_sistema: item.quantidade_sistema,
        quantidade_contada: item.quantidade_contada,
      };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  let ajustes: AjusteDoInventario[] = [];
  if (linha.status === "aberto") {
    const saldos = await saldosDoLocal(texto(linha.local_id));
    if (!saldos.ok) return saldos;
    ajustes = calcularAjustes(itens.dados, (v) => saldos.dados.get(v)?.quantidade ?? 0);
  }

  return sucesso({
    id: texto(linha.id),
    local_id: texto(linha.local_id),
    local_codigo: local?.codigo ?? "",
    local_caminho: caminhoDe(texto(linha.local_id)),
    status: texto(linha.status) as StatusInventario,
    observacao: textoOuNulo(linha.observacao),
    aberto_por_nome: nomes.get(texto(linha.aberto_por)) ?? "Usuário",
    aberto_em: texto(linha.aberto_em),
    concluido_por_nome: nomes.get(texto(linha.concluido_por)) ?? null,
    concluido_em: textoOuNulo(linha.concluido_em),
    total_de_itens: itensDaTela.length,
    total_contados: itensDaTela.filter((item) => item.quantidade_contada !== null).length,
    itens: itensDaTela,
    ajustes,
  });
}

/** Grava a quantidade contada de um item (vazio apaga a contagem). Só com o inventário aberto. */
export async function registrarContagem(
  inventarioId: string,
  varianteId: string,
  quantidade: number | null,
): Promise<Resultado<null>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const contagem = lerContagem(quantidade);
  if (!contagem.ok) return falha(contagem.erro);

  const aberto = await lerInventarioAberto(inventarioId);
  if (!aberto.ok) return aberto;

  const { data, error } = await banco()
    .from("inventario_itens")
    .update({ quantidade_contada: contagem.quantidade })
    .eq("inventario_id", inventarioId)
    .eq("variante_id", varianteId)
    .select("variante_id");
  if (error) {
    console.error("[inventarios] Falha ao gravar a contagem:", error.message);
    return falha("Não foi possível gravar a contagem.");
  }
  if (!data || data.length === 0) return falha("Este item não está na lista do inventário.");
  return sucesso(null);
}

/** Inclui no inventário uma variante encontrada no local que não estava na lista. */
export async function incluirItemNoInventario(
  inventarioId: string,
  varianteId: string,
  quantidadeContada: number | null,
): Promise<Resultado<null>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const contagem = lerContagem(quantidadeContada);
  if (!contagem.ok) return falha(contagem.erro);

  const aberto = await lerInventarioAberto(inventarioId);
  if (!aberto.ok) return aberto;

  const { data: variante, error: erroVariante } = await banco()
    .from("variantes")
    .select("id, ativo")
    .eq("id", varianteId)
    .maybeSingle();
  if (erroVariante) {
    console.error("[inventarios] Falha ao ler a variante:", erroVariante.message);
    return falha("Não foi possível conferir a variante.");
  }
  if (!variante) return falha("Escolha uma variante.");
  if (!variante.ativo) return falha("Esta variante está desativada.");

  const { data: saldo } = await banco()
    .from("saldos")
    .select("quantidade")
    .eq("variante_id", varianteId)
    .eq("local_id", aberto.dados.local_id)
    .maybeSingle();

  const { error } = await banco().from("inventario_itens").insert({
    inventario_id: inventarioId,
    variante_id: varianteId,
    quantidade_sistema: saldo ? Number(saldo.quantidade) : 0,
    quantidade_contada: contagem.quantidade,
  });
  if (error) {
    if (error.code === "23505") return falha("Esta variante já está na lista do inventário.");
    console.error("[inventarios] Falha ao incluir o item:", error.message);
    return falha("Não foi possível incluir o item.");
  }
  return sucesso(null);
}

async function reabrirInventario(inventarioId: string): Promise<void> {
  const { error } = await banco()
    .from("inventarios")
    .update({ status: "aberto", concluido_por: null, concluido_em: null })
    .eq("id", inventarioId);
  if (error) console.error("[inventarios] Falha ao reabrir após erro:", error.message);
}

/**
 * Conclui o inventário: cada diferença entre o contado e o saldo **de agora**
 * vira um ajuste ligado ao inventário. Item não contado não é alterado.
 * Devolve quantos ajustes foram gerados.
 */
export async function concluirInventario(inventarioId: string): Promise<Resultado<number>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const aberto = await lerInventarioAberto(inventarioId);
  if (!aberto.ok) return aberto;
  const localId = aberto.dados.local_id;

  const itens = await lerItens(inventarioId);
  if (!itens.ok) return itens;
  const saldos = await saldosDoLocal(localId);
  if (!saldos.ok) return saldos;

  const ajustes = calcularAjustes(itens.dados, (v) => saldos.dados.get(v)?.quantidade ?? 0);

  // Trava o inventário: duas conclusões ao mesmo tempo viram uma só.
  const { data: travado, error: erroTrava } = await banco()
    .from("inventarios")
    .update({ status: "concluido", concluido_por: autor.dados.id, concluido_em: new Date().toISOString() })
    .eq("id", inventarioId)
    .eq("status", "aberto")
    .select("id");
  if (erroTrava) {
    console.error("[inventarios] Falha ao travar:", erroTrava.message);
    return falha("Não foi possível concluir o inventário. Nada foi alterado.");
  }
  if (!travado || travado.length === 0) {
    return falha("Este inventário já foi concluído ou cancelado.");
  }

  const gravados: Array<{ varianteId: string; anterior: SaldoAtual }> = [];
  async function desfazerTudo(): Promise<void> {
    for (const { varianteId, anterior } of gravados) {
      await desfazerSaldo(varianteId, localId, anterior);
    }
    await reabrirInventario(inventarioId);
  }

  for (const ajuste of ajustes) {
    const anterior = saldos.dados.get(ajuste.variante_id) ?? { quantidade: 0, existe: false };
    const gravou = await gravarSaldoCondicional(ajuste.variante_id, localId, anterior, ajuste.saldo_novo);
    if (!gravou) {
      await desfazerTudo();
      return falha("O saldo mudou enquanto o inventário era concluído. Confira o resumo e tente de novo.");
    }
    gravados.push({ varianteId: ajuste.variante_id, anterior });
  }

  if (ajustes.length > 0) {
    const { error: erroHistorico } = await banco()
      .from("movimentacoes")
      .insert(
        ajustes.map((ajuste) => ({
          variante_id: ajuste.variante_id,
          tipo: "ajuste",
          quantidade: ajuste.quantidade,
          local_origem_id: ajuste.tipo === "saida" ? localId : null,
          local_destino_id: ajuste.tipo === "entrada" ? localId : null,
          inventario_id: inventarioId,
          justificativa: JUSTIFICATIVA_DO_AJUSTE,
          usuario_id: autor.dados.id,
        })),
      );
    if (erroHistorico) {
      console.error("[inventarios] Falha ao gravar o histórico:", erroHistorico.message);
      await desfazerTudo();
      return falha("Não foi possível registrar os ajustes. Nada foi alterado.");
    }
  }

  return sucesso(ajustes.length);
}

/** Cancela um inventário aberto, sem gerar ajuste. Um inventário cancelado não volta a abrir. */
export async function cancelarInventario(inventarioId: string): Promise<Resultado<null>> {
  const autor = await exigirOperacao();
  if (!autor.ok) return autor;

  const aberto = await lerInventarioAberto(inventarioId);
  if (!aberto.ok) return aberto;

  const { data, error } = await banco()
    .from("inventarios")
    .update({ status: "cancelado" })
    .eq("id", inventarioId)
    .eq("status", "aberto")
    .select("id");
  if (error) {
    console.error("[inventarios] Falha ao cancelar:", error.message);
    return falha("Não foi possível cancelar o inventário.");
  }
  if (!data || data.length === 0) return falha("Este inventário já foi concluído ou cancelado.");
  return sucesso(null);
}
