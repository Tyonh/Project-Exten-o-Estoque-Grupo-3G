"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  alternarVariante as alternarVarianteNoBanco,
  criarCategoria as criarCategoriaNoBanco,
  criarFamilia as criarFamiliaNoBanco,
  criarVariante as criarVarianteNoBanco,
  editarCategoria as editarCategoriaNoBanco,
  editarFamilia as editarFamiliaNoBanco,
  editarVariante as editarVarianteNoBanco,
} from "@estoque/backend/catalogo";
import type { Cargo } from "@estoque/backend/cargos";
import { carregarDadosDoEstoque } from "@estoque/backend/consulta";
import {
  alternarLocal as alternarLocalNoBanco,
  criarLocal as criarLocalNoBanco,
  editarLocal as editarLocalNoBanco,
  moverLocal as moverLocalNoBanco,
} from "@estoque/backend/locais";
import { registrarMovimentacao as registrarMovimentacaoNoBanco } from "@estoque/backend/movimentacoes";
import type { Resultado } from "@estoque/backend/resultado";
import type { Perfil } from "@estoque/backend/tipos";
import { ROTULO_TIPO } from "./formatos";
import type {
  Categoria,
  DadosDeMovimentacao,
  DadosDoPrototipo,
  Familia,
  Local,
  Movimentacao,
  NovaCategoria,
  NovaFamilia,
  NovaVariante,
  NovoLocal,
  Saldo,
  Variante,
} from "./tipos";

interface ContextoDoPrototipo {
  perfil: Perfil;
  cargoVisualizado: Cargo;
  dados: DadosDoPrototipo;

  criarCategoria: (entrada: NovaCategoria) => Promise<Resultado<Categoria>>;
  editarCategoria: (id: string, entrada: NovaCategoria) => Promise<Resultado<Categoria>>;
  criarFamilia: (entrada: NovaFamilia) => Promise<Resultado<Familia>>;
  editarFamilia: (id: string, entrada: NovaFamilia) => Promise<Resultado<Familia>>;
  criarVariante: (entrada: NovaVariante) => Promise<Resultado<Variante>>;
  editarVariante: (id: string, entrada: NovaVariante) => Promise<Resultado<Variante>>;
  alternarVariante: (id: string) => Promise<Resultado<Variante>>;

  criarLocal: (entrada: NovoLocal) => Promise<Resultado<Local>>;
  editarLocal: (id: string, entrada: NovoLocal) => Promise<Resultado<Local>>;
  moverLocal: (id: string, paiId: string | null) => Promise<Resultado<Local>>;
  alternarLocal: (id: string) => Promise<Resultado<Local>>;

  registrarMovimentacao: (
    entrada: DadosDeMovimentacao,
  ) => Promise<Resultado<Movimentacao>>;

  categoriaDaFamilia: (familiaId: string) => Categoria | undefined;
  categoriaDaVariante: (varianteId: string) => Categoria | undefined;
  familiaDaVariante: (varianteId: string) => Familia | undefined;
  minimoDaVariante: (variante: Variante) => number;
  saldoNoLocal: (varianteId: string, localId: string) => number;
  saldoDaVariante: (varianteId: string) => number;
  saldosDaVariante: (varianteId: string) => Array<{ saldo: Saldo; local: Local }>;
  caminhoDoLocal: (localId: string) => string;
  filhosDoLocal: (localId: string | null) => Local[];
  descendentesDoLocal: (localId: string) => string[];
  totalNoLocal: (localId: string, incluirDescendentes?: boolean) => number;
  itensNoLocal: (
    localId: string,
    incluirDescendentes?: boolean,
  ) => Array<{ variante: Variante; quantidade: number }>;
  locaisDisponiveisComoPai: (localId?: string) => Local[];
  variantesAbaixoDoMinimo: () => Array<{ variante: Variante; total: number; minimo: number }>;
  movimentacoesDaVariante: (varianteId: string) => Movimentacao[];

  mensagem: string | null;
  limparMensagem: () => void;
}

const Contexto = createContext<ContextoDoPrototipo | null>(null);

interface ProvedorDoPrototipoProps {
  perfilInicial: Perfil;
  dadosIniciais: DadosDoPrototipo;
  children: ReactNode;
}

/**
 * Dados reais do estoque compartilhados entre as telas.
 *
 * As telas recebem uma fotografia do servidor. Depois de qualquer alteração,
 * a fotografia é recarregada, para saldos, histórico e listas continuarem
 * iguais em todas as páginas. Nenhuma regra de negócio fica aqui: as funções
 * de `backend/src/` conferem sessão, perfil e dados antes de gravar.
 */
export function ProvedorDoPrototipo({
  perfilInicial,
  dadosIniciais,
  children,
}: ProvedorDoPrototipoProps) {
  const [dados, setDados] = useState<DadosDoPrototipo>(dadosIniciais);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const cargoVisualizado = perfilInicial.cargo;

  async function atualizarDados(): Promise<void> {
    const resultado = await carregarDadosDoEstoque();
    if (resultado.ok) {
      setDados(resultado.dados);
    } else {
      console.error("[estoque] Falha ao atualizar os dados:", resultado.erro);
    }
  }

  async function criarCategoria(entrada: NovaCategoria): Promise<Resultado<Categoria>> {
    const resultado = await criarCategoriaNoBanco(entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function editarCategoria(
    id: string,
    entrada: NovaCategoria,
  ): Promise<Resultado<Categoria>> {
    const resultado = await editarCategoriaNoBanco(id, entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function criarFamilia(entrada: NovaFamilia): Promise<Resultado<Familia>> {
    const resultado = await criarFamiliaNoBanco(entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function editarFamilia(
    id: string,
    entrada: NovaFamilia,
  ): Promise<Resultado<Familia>> {
    const resultado = await editarFamiliaNoBanco(id, entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function criarVariante(entrada: NovaVariante): Promise<Resultado<Variante>> {
    const resultado = await criarVarianteNoBanco(entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function editarVariante(
    id: string,
    entrada: NovaVariante,
  ): Promise<Resultado<Variante>> {
    const resultado = await editarVarianteNoBanco(id, entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function alternarVariante(id: string): Promise<Resultado<Variante>> {
    const resultado = await alternarVarianteNoBanco(id);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function criarLocal(entrada: NovoLocal): Promise<Resultado<Local>> {
    const resultado = await criarLocalNoBanco(entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function editarLocal(id: string, entrada: NovoLocal): Promise<Resultado<Local>> {
    const resultado = await editarLocalNoBanco(id, entrada);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function moverLocal(id: string, paiId: string | null): Promise<Resultado<Local>> {
    const resultado = await moverLocalNoBanco(id, paiId);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function alternarLocal(id: string): Promise<Resultado<Local>> {
    const resultado = await alternarLocalNoBanco(id);
    if (resultado.ok) await atualizarDados();
    return resultado;
  }

  async function registrarMovimentacao(
    entrada: DadosDeMovimentacao,
  ): Promise<Resultado<Movimentacao>> {
    const variante = dados.variantes.find((item) => item.id === entrada.variante_id);
    const resultado = await registrarMovimentacaoNoBanco(entrada);
    if (resultado.ok) {
      await atualizarDados();
      setMensagem(
        `${ROTULO_TIPO[resultado.dados.tipo]} de ${resultado.dados.quantidade} unidade(s)${
          variante ? ` de ${variante.codigo}` : ""
        } registrada.`,
      );
    }
    return resultado;
  }

  function categoriaDaFamilia(familiaId: string): Categoria | undefined {
    const familia = dados.familias.find((item) => item.id === familiaId);
    return familia
      ? dados.categorias.find((categoria) => categoria.id === familia.categoria_id)
      : undefined;
  }

  function familiaDaVariante(varianteId: string): Familia | undefined {
    const variante = dados.variantes.find((item) => item.id === varianteId);
    return variante
      ? dados.familias.find((familia) => familia.id === variante.familia_id)
      : undefined;
  }

  function categoriaDaVariante(varianteId: string): Categoria | undefined {
    const familia = familiaDaVariante(varianteId);
    return familia ? categoriaDaFamilia(familia.id) : undefined;
  }

  function minimoDaVariante(variante: Variante): number {
    return variante.estoque_minimo ?? categoriaDaVariante(variante.id)?.limiar_padrao ?? 0;
  }

  function saldoNoLocal(varianteId: string, localId: string): number {
    return dados.saldos
      .filter((saldo) => saldo.variante_id === varianteId && saldo.local_id === localId)
      .reduce((total, saldo) => total + saldo.quantidade, 0);
  }

  function saldoDaVariante(varianteId: string): number {
    return dados.saldos
      .filter((saldo) => saldo.variante_id === varianteId)
      .reduce((total, saldo) => total + saldo.quantidade, 0);
  }

  function saldosDaVariante(varianteId: string): Array<{ saldo: Saldo; local: Local }> {
    return dados.saldos
      .filter((saldo) => saldo.variante_id === varianteId && saldo.quantidade > 0)
      .map((saldo) => ({
        saldo,
        local: dados.locais.find((local) => local.id === saldo.local_id)!,
      }))
      .filter((item) => Boolean(item.local))
      .sort((a, b) => caminhoDoLocal(a.local.id).localeCompare(caminhoDoLocal(b.local.id)));
  }

  function caminhoDoLocal(localId: string): string {
    const nomes: string[] = [];
    const visitados = new Set<string>();
    let atual = dados.locais.find((local) => local.id === localId);

    while (atual && !visitados.has(atual.id)) {
      visitados.add(atual.id);
      nomes.unshift(atual.nome);
      atual = atual.pai_id
        ? dados.locais.find((local) => local.id === atual?.pai_id)
        : undefined;
    }

    return nomes.length > 0 ? nomes.join(" › ") : "Local não encontrado";
  }

  function filhosDoLocal(localId: string | null): Local[] {
    return dados.locais
      .filter((local) => local.pai_id === localId)
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  function descendentesDoLocal(localId: string): string[] {
    const resultado: string[] = [];
    const fila = [localId];
    const visitados = new Set<string>([localId]);

    while (fila.length > 0) {
      const atual = fila.shift()!;
      for (const local of dados.locais) {
        if (local.pai_id === atual && !visitados.has(local.id)) {
          visitados.add(local.id);
          resultado.push(local.id);
          fila.push(local.id);
        }
      }
    }
    return resultado;
  }

  function idsComDescendentes(localId: string, incluirDescendentes: boolean): Set<string> {
    return new Set([localId, ...(incluirDescendentes ? descendentesDoLocal(localId) : [])]);
  }

  function totalNoLocal(localId: string, incluirDescendentes = true): number {
    const ids = idsComDescendentes(localId, incluirDescendentes);
    return dados.saldos
      .filter((saldo) => ids.has(saldo.local_id))
      .reduce((total, saldo) => total + saldo.quantidade, 0);
  }

  function itensNoLocal(
    localId: string,
    incluirDescendentes = false,
  ): Array<{ variante: Variante; quantidade: number }> {
    const ids = idsComDescendentes(localId, incluirDescendentes);
    const quantidades = new Map<string, number>();

    for (const saldo of dados.saldos) {
      if (!ids.has(saldo.local_id) || saldo.quantidade <= 0) continue;
      quantidades.set(
        saldo.variante_id,
        (quantidades.get(saldo.variante_id) ?? 0) + saldo.quantidade,
      );
    }

    return [...quantidades.entries()]
      .map(([varianteId, quantidade]) => ({
        variante: dados.variantes.find((variante) => variante.id === varianteId),
        quantidade,
      }))
      .filter((item): item is { variante: Variante; quantidade: number } => Boolean(item.variante))
      .sort((a, b) => a.variante.nome.localeCompare(b.variante.nome));
  }

  function locaisDisponiveisComoPai(localId?: string): Local[] {
    const bloqueados = localId
      ? new Set([localId, ...descendentesDoLocal(localId)])
      : new Set<string>();
    return dados.locais
      .filter((local) => local.ativo && !bloqueados.has(local.id))
      .sort((a, b) => caminhoDoLocal(a.id).localeCompare(caminhoDoLocal(b.id)));
  }

  function variantesAbaixoDoMinimo(): Array<{ variante: Variante; total: number; minimo: number }> {
    return dados.variantes
      .filter((variante) => variante.ativo && variante.monitorar)
      .map((variante) => ({
        variante,
        total: saldoDaVariante(variante.id),
        minimo: minimoDaVariante(variante),
      }))
      .filter((item) => item.total < item.minimo)
      .sort((a, b) => b.minimo - b.total - (a.minimo - a.total));
  }

  function movimentacoesDaVariante(varianteId: string): Movimentacao[] {
    return dados.movimentacoes
      .filter((movimentacao) => movimentacao.variante_id === varianteId)
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  }

  const valor: ContextoDoPrototipo = {
    perfil: perfilInicial,
    cargoVisualizado,
    dados,
    criarCategoria,
    editarCategoria,
    criarFamilia,
    editarFamilia,
    criarVariante,
    editarVariante,
    alternarVariante,
    criarLocal,
    editarLocal,
    moverLocal,
    alternarLocal,
    registrarMovimentacao,
    categoriaDaFamilia,
    categoriaDaVariante,
    familiaDaVariante,
    minimoDaVariante,
    saldoNoLocal,
    saldoDaVariante,
    saldosDaVariante,
    caminhoDoLocal,
    filhosDoLocal,
    descendentesDoLocal,
    totalNoLocal,
    itensNoLocal,
    locaisDisponiveisComoPai,
    variantesAbaixoDoMinimo,
    movimentacoesDaVariante,
    mensagem,
    limparMensagem: () => setMensagem(null),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePrototipo(): ContextoDoPrototipo {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("usePrototipo precisa estar dentro de ProvedorDoPrototipo.");
  }
  return contexto;
}
