"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MapPin, PackageSearch, SearchX } from "lucide-react";
import { Pagina } from "@/components/layout/pagina";
import { CampoDeBusca } from "@/components/ui/campo-de-busca";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { RetratoDoProduto } from "@/components/ui/retrato-do-produto";
import { Selecao } from "@/components/ui/selecao";
import { cn } from "@/lib/classes";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarMoeda, formatarNumero, normalizar } from "@/prototipo/formatos";

export default function ConsultaPage() {
  const {
    dados,
    saldoDaVariante,
    minimoDaVariante,
    saldosDaVariante,
    caminhoDoLocal,
    descendentesDoLocal,
  } = usePrototipo();

  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [localId, setLocalId] = useState("");
  const [soBaixo, setSoBaixo] = useState(false);

  const termo = normalizar(busca);
  const locaisDoFiltro = localId
    ? new Set([localId, ...descendentesDoLocal(localId)])
    : null;

  const variantes = [...dados.variantes]
    .filter((variante) => {
      const familia = dados.familias.find((item) => item.id === variante.familia_id);
      const categoria = familia
        ? dados.categorias.find((item) => item.id === familia.categoria_id)
        : undefined;

      if (categoriaId && categoria?.id !== categoriaId) return false;

      if (termo) {
        const textos = [
          variante.codigo,
          variante.nome,
          familia?.nome ?? "",
          categoria?.nome ?? "",
          ...Object.values(variante.atributos).map(String),
        ];
        if (!textos.some((texto) => normalizar(texto).includes(termo))) return false;
      }

      if (locaisDoFiltro) {
        const temNoLocal = saldosDaVariante(variante.id).some(({ local }) =>
          locaisDoFiltro.has(local.id),
        );
        if (!temNoLocal) return false;
      }

      if (soBaixo) {
        if (!variante.monitorar) return false;
        if (saldoDaVariante(variante.id) >= minimoDaVariante(variante)) return false;
      }

      return true;
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  function limparFiltros() {
    setBusca("");
    setCategoriaId("");
    setLocalId("");
    setSoBaixo(false);
  }

  const temFiltro = Boolean(busca || categoriaId || localId || soBaixo);

  return (
    <Pagina
      titulo="Consulta"
      descricao="Encontre uma variante, veja o saldo total e em quais locais ela está."
    >
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <CampoDeBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar código, nome ou atributo"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Selecao
            rotulo="Categoria"
            value={categoriaId}
            onChange={(evento) => setCategoriaId(evento.target.value)}
          >
            <option value="">Todas as categorias</option>
            {dados.categorias
              .slice()
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
          </Selecao>

          <Selecao
            rotulo="Local"
            value={localId}
            onChange={(evento) => setLocalId(evento.target.value)}
            dica="Inclui os sublocais do local escolhido."
          >
            <option value="">Todos os locais</option>
            {dados.locais
              .slice()
              .sort((a, b) => caminhoDoLocal(a.id).localeCompare(caminhoDoLocal(b.id)))
              .map((local) => (
                <option key={local.id} value={local.id}>
                  {caminhoDoLocal(local.id)} · {local.codigo}
                </option>
              ))}
          </Selecao>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={soBaixo}
              onChange={(evento) => setSoBaixo(evento.target.checked)}
              className="size-4 accent-marca-600"
            />
            Só variantes abaixo do mínimo
          </label>
          {temFiltro && (
            <button
              type="button"
              onClick={limparFiltros}
              className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {variantes.length} {variantes.length === 1 ? "variante encontrada" : "variantes encontradas"}
        </p>
        {localId && (
          <Etiqueta tom="info" className="max-w-[60%] truncate">
            <MapPin className="mr-1 size-3" aria-hidden />
            {caminhoDoLocal(localId)}
          </Etiqueta>
        )}
      </div>

      {variantes.length === 0 ? (
        <div className="mt-3">
          <EstadoVazio
            icone={SearchX}
            titulo="Nada encontrado"
            descricao="Tente outro termo ou limpe os filtros para ver o catálogo inteiro."
            acao={
              temFiltro ? (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-sm font-semibold text-marca-700 hover:underline"
                >
                  Limpar filtros
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {variantes.map((variante) => {
            const familia = dados.familias.find((item) => item.id === variante.familia_id);
            const categoria = familia
              ? dados.categorias.find((item) => item.id === familia.categoria_id)
              : undefined;
            const total = saldoDaVariante(variante.id);
            const minimo = minimoDaVariante(variante);
            const abaixo = variante.monitorar && total < minimo;
            const locais = saldosDaVariante(variante.id);

            return (
              <Link
                key={variante.id}
                href={`/consulta/variante/${variante.id}`}
                className={cn(
                  "group flex items-start gap-3 border-l-2 p-4 transition-colors hover:bg-slate-50",
                  abaixo ? "border-amber-400" : "border-transparent",
                )}
              >
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
                    {!variante.ativo && <Etiqueta tom="neutro">Inativa</Etiqueta>}
                    {abaixo && <Etiqueta tom="alerta">Abaixo do mínimo</Etiqueta>}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{variante.nome}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {familia?.nome ?? "Sem família"}
                    {categoria ? ` · ${categoria.nome}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Saldo:{" "}
                      <strong
                        className={cn("tabular", abaixo ? "text-amber-700" : "text-slate-800")}
                      >
                        {formatarNumero(total)}
                      </strong>
                    </span>
                    <span>
                      Mínimo:{" "}
                      <strong className="tabular text-slate-700">{formatarNumero(minimo)}</strong>
                    </span>
                    <span>
                      Preço:{" "}
                      <strong className="tabular text-slate-700">
                        {formatarMoeda(variante.preco)}
                      </strong>
                    </span>
                    <span>
                      {locais.length} {locais.length === 1 ? "local" : "locais"}
                    </span>
                  </div>
                </div>
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-slate-300 transition-colors group-hover:text-marca-600"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      )}

      {variantes.length > 0 && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <PackageSearch className="size-3.5" aria-hidden />
          Toque em uma variante para ver os saldos por local e o histórico.
        </p>
      )}
    </Pagina>
  );
}
