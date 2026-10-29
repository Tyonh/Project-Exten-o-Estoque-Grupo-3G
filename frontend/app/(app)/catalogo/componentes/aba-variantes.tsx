"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, PackageSearch, Pencil, Plus, Power } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { CampoDeBusca } from "@/components/ui/campo-de-busca";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { RetratoDoProduto } from "@/components/ui/retrato-do-produto";
import { Selecao } from "@/components/ui/selecao";
import { cn } from "@/lib/classes";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarMoeda, formatarNumero, normalizar } from "@/prototipo/formatos";
import type { Variante } from "@/prototipo/tipos";
import { FormularioDeVariante } from "./formulario-de-variante";

interface AbaVariantesProps {
  familiaFiltro: string | null;
  aoLimparFiltro: () => void;
}

export function AbaVariantes({ familiaFiltro, aoLimparFiltro }: AbaVariantesProps) {
  const {
    dados,
    cargoVisualizado,
    saldoDaVariante,
    minimoDaVariante,
    alternarVariante,
  } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);
  const [editandoId, setEditandoId] = useState<string | null | undefined>(undefined);
  const [busca, setBusca] = useState("");
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [alternandoId, setAlternandoId] = useState<string | null>(null);

  const familiaAtiva = familiaFiltro ?? (filtroFamilia || null);
  const familia = familiaAtiva
    ? dados.familias.find((item) => item.id === familiaAtiva)
    : undefined;
  const termo = normalizar(busca);

  const variantes = [...dados.variantes]
    .filter((variante) => {
      if (familiaAtiva && variante.familia_id !== familiaAtiva) return false;
      if (!termo) return true;
      const familiaDaVariante = dados.familias.find(
        (item) => item.id === variante.familia_id,
      );
      return [variante.codigo, variante.nome, familiaDaVariante?.nome ?? ""].some((texto) =>
        normalizar(texto).includes(termo),
      );
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  async function alternar(variante: Variante) {
    setErro(null);
    if (
      variante.ativo &&
      !window.confirm(
        `Desativar ${variante.codigo}? Ela deixa de aparecer na consulta e não pode ser movimentada.`,
      )
    ) {
      return;
    }
    setAlternandoId(variante.id);
    const resultado = await alternarVariante(variante.id);
    setAlternandoId(null);
    if (!resultado.ok) setErro(resultado.erro);
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-display-3 text-slate-900">Variantes</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            A variante é o item que tem código, preço e saldo. O código é a referência do estoque.
          </p>
        </div>
        {operador && (
          <Botao
            tamanho="sm"
            icone={Plus}
            onClick={() => setEditandoId(null)}
          >
            Nova variante
          </Botao>
        )}
      </div>

      {familiaAtiva && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Etiqueta tom="info">Família: {familia?.nome ?? "selecionada"}</Etiqueta>
          <button
            type="button"
            onClick={() => {
              aoLimparFiltro();
              setFiltroFamilia("");
            }}
            className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {editandoId !== undefined && (
        <div className="mb-4">
          <FormularioDeVariante
            id={editandoId ?? undefined}
            familiaInicial={familiaAtiva ?? undefined}
            aoFechar={() => setEditandoId(undefined)}
          />
        </div>
      )}

      {erro && (
        <div className="mb-3">
          <Alerta tom="erro">{erro}</Alerta>
        </div>
      )}

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_16rem]">
        <CampoDeBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar código, nome ou família"
        />
        <Selecao
          rotulo="Família"
          value={familiaFiltro ? "" : filtroFamilia}
          onChange={(evento) => {
            aoLimparFiltro();
            setFiltroFamilia(evento.target.value);
          }}
        >
          <option value="">Todas as famílias</option>
          {dados.familias
            .slice()
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
        </Selecao>
      </div>

      {variantes.length === 0 ? (
        <EstadoVazio
          icone={PackageSearch}
          titulo="Nenhuma variante encontrada"
          descricao={
            busca || familiaAtiva
              ? "Tente outro termo ou limpe os filtros."
              : "Cadastre a primeira variante para começar a controlar o estoque."
          }
          acao={
            operador ? (
              <Botao icone={Plus} onClick={() => setEditandoId(null)}>
                Nova variante
              </Botao>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {variantes.map((variante) => {
            const familiaDaVariante = dados.familias.find(
              (item) => item.id === variante.familia_id,
            );
            const categoria = familiaDaVariante
              ? dados.categorias.find((item) => item.id === familiaDaVariante.categoria_id)
              : undefined;
            const total = saldoDaVariante(variante.id);
            const minimo = minimoDaVariante(variante);
            const abaixo = variante.monitorar && total < minimo;

            return (
              <article
                key={variante.id}
                className={cn(
                  "border-l-2 p-4",
                  abaixo ? "border-amber-400" : "border-transparent",
                )}
              >
                <div className="flex items-start gap-3">
                  <RetratoDoProduto
                    nome={variante.nome}
                    src={variante.imagem_url}
                    className="size-12"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wide text-slate-500">
                        {variante.codigo}
                      </span>
                      <Etiqueta tom={variante.ativo ? "sucesso" : "neutro"}>
                        {variante.ativo ? "Ativa" : "Inativa"}
                      </Etiqueta>
                      {abaixo && <Etiqueta tom="alerta">Abaixo do mínimo</Etiqueta>}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900">{variante.nome}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {familiaDaVariante?.nome ?? "Sem família"}
                      {categoria ? ` · ${categoria.nome}` : ""}
                    </p>
                  </div>

                  {operador && (
                    <button
                      type="button"
                      onClick={() => setEditandoId(variante.id)}
                      aria-label={`Editar ${variante.codigo}`}
                      className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <div>
                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Preço
                    </p>
                    <p className="tabular font-semibold text-slate-700">
                      {formatarMoeda(variante.preco)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Saldo
                    </p>
                    <p
                      className={cn(
                        "tabular font-semibold",
                        abaixo ? "font-bold text-amber-700" : "text-slate-700",
                      )}
                    >
                      {formatarNumero(total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Mínimo
                    </p>
                    <p className="tabular font-semibold text-slate-700">{formatarNumero(minimo)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/consulta/variante/${variante.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-marca-700 hover:text-marca-800"
                  >
                    <Eye className="size-3.5" aria-hidden />
                    Ver detalhes e saldos
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>

                  {operador && (
                    <button
                      type="button"
                      onClick={() => alternar(variante)}
                      disabled={alternandoId === variante.id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-50"
                    >
                      <Power className="size-3.5" aria-hidden />
                      {alternandoId === variante.id
                        ? "Salvando..."
                        : variante.ativo
                          ? "Desativar"
                          : "Reativar"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
