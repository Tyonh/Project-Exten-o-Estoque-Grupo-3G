"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

const ITENS_POR_PAGINA = 50;
const SEM_MARCA = "__sem_marca__";

type FiltroDeSituacao = "todas" | "ativas" | "inativas";

interface AbaVariantesProps {
  familiaFiltro: string | null;
  aoLimparFiltro: () => void;
}

export function AbaVariantes({ familiaFiltro, aoLimparFiltro }: AbaVariantesProps) {
  const { dados, cargoVisualizado, saldoDaVariante, minimoDaVariante, alternarVariante } =
    usePrototipo();
  const operador = podeOperar(cargoVisualizado);
  const [editandoId, setEditandoId] = useState<string | null | undefined>(undefined);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroFamilia, setFiltroFamilia] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [situacao, setSituacao] = useState<FiltroDeSituacao>("todas");
  const [limite, setLimite] = useState(ITENS_POR_PAGINA);
  const [erro, setErro] = useState<string | null>(null);
  const [alternandoId, setAlternandoId] = useState<string | null>(null);

  const familiaAtiva = familiaFiltro ?? (filtroFamilia || null);
  const familiaEscolhida = familiaAtiva
    ? dados.familias.find((item) => item.id === familiaAtiva)
    : undefined;
  const termo = normalizar(busca);

  // Mapas montados uma vez: com milhares de variantes, `find` por linha pesa.
  const familiaPorId = useMemo(() => new Map(dados.familias.map((f) => [f.id, f])), [dados.familias]);
  const categoriaPorId = useMemo(() => new Map(dados.categorias.map((c) => [c.id, c])), [dados.categorias]);
  const marcas = useMemo(
    () =>
      [...new Set(dados.variantes.map((v) => v.marca).filter((m): m is string => Boolean(m)))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [dados.variantes],
  );
  const familiasDaCategoria = useMemo(
    () =>
      dados.familias
        .filter((familia) => !filtroCategoria || familia.categoria_id === filtroCategoria)
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [dados.familias, filtroCategoria],
  );

  const variantes = useMemo(
    () =>
      dados.variantes
        .filter((variante) => {
          const familia = familiaPorId.get(variante.familia_id);
          if (familiaAtiva && variante.familia_id !== familiaAtiva) return false;
          if (filtroCategoria && familia?.categoria_id !== filtroCategoria) return false;
          if (filtroMarca === SEM_MARCA ? variante.marca : filtroMarca && variante.marca !== filtroMarca) {
            return false;
          }
          if (situacao === "ativas" && !variante.ativo) return false;
          if (situacao === "inativas" && variante.ativo) return false;
          if (!termo) return true;
          return [variante.codigo, variante.nome, variante.marca ?? "", familia?.nome ?? ""].some((texto) =>
            normalizar(texto).includes(termo),
          );
        })
        .sort((a, b) => a.codigo.localeCompare(b.codigo)),
    [dados.variantes, familiaPorId, familiaAtiva, filtroCategoria, filtroMarca, situacao, termo],
  );

  const temFiltro = Boolean(
    busca || familiaAtiva || filtroCategoria || filtroMarca || situacao !== "todas",
  );

  function limparFiltros() {
    aoLimparFiltro();
    setBusca("");
    setFiltroCategoria("");
    setFiltroFamilia("");
    setFiltroMarca("");
    setSituacao("todas");
    setLimite(ITENS_POR_PAGINA);
  }

  function mudar<T>(definir: (valor: T) => void) {
    return (valor: T) => {
      definir(valor);
      setLimite(ITENS_POR_PAGINA);
    };
  }

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
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-display-3 text-slate-900">Variantes</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            A variante é o item que tem código, preço e saldo. O código é a referência do estoque.
          </p>
        </div>
        {operador && (
          <Botao tamanho="sm" icone={Plus} onClick={() => setEditandoId(null)}>
            Nova variante
          </Botao>
        )}
      </div>

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

      <div className="mb-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
        <CampoDeBusca
          valor={busca}
          aoMudar={mudar(setBusca)}
          placeholder="Buscar código, nome, marca ou família"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Selecao
            rotulo="Categoria"
            value={filtroCategoria}
            onChange={(evento) => {
              aoLimparFiltro();
              setFiltroFamilia("");
              mudar(setFiltroCategoria)(evento.target.value);
            }}
          >
            <option value="">Todas as categorias</option>
            {dados.categorias
              .slice()
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
          </Selecao>
          <Selecao
            rotulo="Família"
            value={familiaFiltro ? familiaFiltro : filtroFamilia}
            onChange={(evento) => {
              aoLimparFiltro();
              mudar(setFiltroFamilia)(evento.target.value);
            }}
          >
            <option value="">Todas as famílias</option>
            {familiasDaCategoria.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </Selecao>
          <Selecao
            rotulo="Marca"
            value={filtroMarca}
            onChange={(evento) => mudar(setFiltroMarca)(evento.target.value)}
          >
            <option value="">Todas as marcas</option>
            {marcas.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
            <option value={SEM_MARCA}>Sem marca</option>
          </Selecao>
          <Selecao
            rotulo="Situação"
            value={situacao}
            onChange={(evento) => mudar(setSituacao)(evento.target.value as FiltroDeSituacao)}
          >
            <option value="todas">Ativas e inativas</option>
            <option value="ativas">Só ativas</option>
            <option value="inativas">Só inativas</option>
          </Selecao>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500" aria-live="polite">
            {variantes.length === dados.variantes.length
              ? `${formatarNumero(variantes.length)} variantes`
              : `${formatarNumero(variantes.length)} de ${formatarNumero(dados.variantes.length)} variantes`}
            {familiaEscolhida && familiaFiltro ? ` · família ${familiaEscolhida.nome}` : ""}
          </p>
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

      {variantes.length === 0 ? (
        <EstadoVazio
          icone={PackageSearch}
          titulo="Nenhuma variante encontrada"
          descricao={
            temFiltro
              ? "Tente outro termo ou limpe os filtros."
              : "Cadastre a primeira variante para começar a controlar o estoque."
          }
          acao={
            operador && !temFiltro ? (
              <Botao icone={Plus} onClick={() => setEditandoId(null)}>
                Nova variante
              </Botao>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {variantes.slice(0, limite).map((variante) => {
              const familia = familiaPorId.get(variante.familia_id);
              const categoria = familia ? categoriaPorId.get(familia.categoria_id) : undefined;
              const total = saldoDaVariante(variante.id);
              const minimo = minimoDaVariante(variante);
              const abaixo = variante.monitorar && total < minimo;

              return (
                <article
                  key={variante.id}
                  className={cn("border-l-2 p-3 sm:p-4", abaixo ? "border-amber-400" : "border-transparent")}
                >
                  <div className="flex items-start gap-3">
                    <RetratoDoProduto nome={variante.nome} src={variante.imagem_url} className="size-12" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wide text-slate-500">
                          {variante.codigo}
                        </span>
                        {variante.marca && <Etiqueta tom="info">{variante.marca}</Etiqueta>}
                        {!variante.ativo && <Etiqueta tom="neutro">Inativa</Etiqueta>}
                        {abaixo && <Etiqueta tom="alerta">Abaixo do mínimo</Etiqueta>}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">{variante.nome}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {familia?.nome ?? "Sem família"}
                        {categoria ? ` · ${categoria.nome}` : ""}
                      </p>
                    </div>

                    {operador && (
                      <button
                        type="button"
                        onClick={() => setEditandoId(variante.id)}
                        aria-label={`Editar ${variante.codigo}`}
                        className="grid size-9 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 sm:pl-[3.75rem]">
                    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">Preço</dt>
                        <dd className="tabular font-semibold text-slate-700">{formatarMoeda(variante.preco)}</dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">Saldo</dt>
                        <dd className={cn("tabular font-semibold", abaixo ? "font-bold text-amber-700" : "text-slate-700")}>
                          {formatarNumero(total)}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">Mínimo</dt>
                        <dd className="tabular font-semibold text-slate-700">{formatarNumero(minimo)}</dd>
                      </div>
                    </dl>

                    <div className="ml-auto flex items-center gap-4">
                      <Link
                        href={`/consulta/variante/${variante.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-marca-700 hover:text-marca-800"
                      >
                        <Eye className="size-3.5" aria-hidden />
                        Detalhes e saldos
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
                          {alternandoId === variante.id ? "Salvando..." : variante.ativo ? "Desativar" : "Reativar"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {variantes.length > limite && (
            <button
              type="button"
              onClick={() => setLimite((atual) => atual + ITENS_POR_PAGINA)}
              className="mt-3 h-11 w-full rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Mostrar mais ({formatarNumero(variantes.length - limite)} restantes)
            </button>
          )}
        </>
      )}
    </section>
  );
}
