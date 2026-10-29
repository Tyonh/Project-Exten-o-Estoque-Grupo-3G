"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  MapPin,
  PackageSearch,
  Plus,
} from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Etiqueta } from "@/components/ui/etiqueta";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { RetratoDoProduto } from "@/components/ui/retrato-do-produto";
import { usePrototipo } from "@/prototipo/contexto";
import {
  formatarAtributo,
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
  ROTULO_TIPO,
  sinalDaMovimentacao,
  TOM_DO_TIPO,
} from "@/prototipo/formatos";

export function ConteudoDaVariante({ id }: { id: string }) {
  const {
    dados,
    cargoVisualizado,
    saldoDaVariante,
    minimoDaVariante,
    saldosDaVariante,
    caminhoDoLocal,
    movimentacoesDaVariante,
  } = usePrototipo();

  const variante = dados.variantes.find((item) => item.id === id);

  if (!variante) {
    return (
      <Pagina titulo="Variante">
        <EstadoVazio
          icone={PackageSearch}
          titulo="Variante não encontrada"
          descricao="Ela pode ter sido removida ou o endereço está errado."
          acao={
            <Link
              href="/consulta"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-marca-600 px-4 text-sm font-semibold text-white hover:bg-marca-700"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar para a consulta
            </Link>
          }
        />
      </Pagina>
    );
  }

  const operador = podeOperar(cargoVisualizado);
  const familia = dados.familias.find((item) => item.id === variante.familia_id);
  const categoria = familia
    ? dados.categorias.find((item) => item.id === familia.categoria_id)
    : undefined;
  const total = saldoDaVariante(variante.id);
  const minimo = minimoDaVariante(variante);
  const abaixo = variante.monitorar && total < minimo;
  const locais = saldosDaVariante(variante.id);
  const historico = movimentacoesDaVariante(variante.id);

  return (
    <Pagina
      titulo={variante.nome}
      descricao={`${variante.codigo} · ${familia?.nome ?? "Sem família"}`}
      acoes={
        operador ? (
          <Link
            href={`/movimentacoes/nova?variante=${variante.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-marca-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-marca-700"
          >
            <Plus className="size-4" aria-hidden />
            Movimentar
          </Link>
        ) : undefined
      }
    >
      <Link
        href="/consulta"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Voltar para a consulta
      </Link>

      {!variante.ativo && (
        <div className="mb-4">
          <Alerta tom="atencao">
            Esta variante está inativa. O histórico continua disponível, mas novas movimentações são
            bloqueadas.
          </Alerta>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <RetratoDoProduto
                nome={variante.nome}
                src={variante.imagem_url}
                className="size-20"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  <Etiqueta tom={variante.ativo ? "sucesso" : "neutro"}>
                    {variante.ativo ? "Ativa" : "Inativa"}
                  </Etiqueta>
                  {abaixo && <Etiqueta tom="alerta">Abaixo do mínimo</Etiqueta>}
                  <Etiqueta tom="info">{categoria?.nome ?? "Sem categoria"}</Etiqueta>
                </div>
                <p className="mt-2 font-mono text-sm font-semibold tracking-wide text-slate-800">
                  {variante.codigo}
                </p>
                <p className="mt-1 text-sm text-slate-500">{familia?.nome ?? "Sem família"}</p>
                <p className="tabular mt-2 text-sm text-slate-700">
                  Preço: <strong>{formatarMoeda(variante.preco)}</strong>
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h2 className="text-display-3 text-slate-900">Características</h2>
              {categoria && categoria.atributos.length > 0 ? (
                <dl className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {categoria.atributos.map((atributo) => (
                    <div key={atributo.chave} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-1.5">
                      <dt className="text-xs text-slate-500">{atributo.rotulo}</dt>
                      <dd className="text-sm font-semibold text-slate-800">
                        {formatarAtributo(variante.atributos[atributo.chave])}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Sem características cadastradas.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-display-3 text-slate-900">Saldos por local</h2>
                <p className="mt-0.5 text-sm text-slate-500">Onde esta variante está guardada.</p>
              </div>
              <Etiqueta tom="neutro">
                {locais.length} {locais.length === 1 ? "local" : "locais"}
              </Etiqueta>
            </div>

            {locais.length === 0 ? (
              <div className="mt-3">
                <EstadoVazio
                  icone={MapPin}
                  titulo="Sem saldo em nenhum local"
                  descricao="Registre uma entrada para esta variante começar a aparecer no estoque."
                />
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {locais.map(({ local, saldo }) => (
                  <div key={local.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-500">
                      <MapPin className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{local.nome}</p>
                      <p className="truncate text-xs text-slate-400">
                        {caminhoDoLocal(local.id)} · {local.codigo}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-900">
                      {formatarNumero(saldo.quantidade)}
                    </p>
                    <span className="text-[0.625rem] uppercase tracking-wide text-slate-400">un.</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-display-3 text-slate-900">Histórico desta variante</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Tudo que entrou, saiu, mudou de lugar ou foi ajustado.
                </p>
              </div>
              <Link
                href="/movimentacoes"
                className="shrink-0 text-xs font-semibold text-marca-700 hover:underline"
              >
                Ver tudo
              </Link>
            </div>

            {historico.length === 0 ? (
              <div className="mt-3">
                <EstadoVazio
                  icone={ArrowLeftRight}
                  titulo="Nenhuma movimentação"
                  descricao="O histórico começa quando a primeira entrada for registrada."
                />
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {historico.map((movimentacao) => {
                  const origem = movimentacao.local_origem_id
                    ? caminhoDoLocal(movimentacao.local_origem_id)
                    : null;
                  const destino = movimentacao.local_destino_id
                    ? caminhoDoLocal(movimentacao.local_destino_id)
                    : null;

                  return (
                    <div key={movimentacao.id} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Etiqueta tom={TOM_DO_TIPO[movimentacao.tipo]}>
                          {ROTULO_TIPO[movimentacao.tipo]}
                        </Etiqueta>
                        <span className="text-sm font-bold text-slate-900">
                          {sinalDaMovimentacao(movimentacao)}
                          {formatarNumero(movimentacao.quantidade)} un.
                        </span>
                        <span className="text-[0.6875rem] text-slate-400">
                          {formatarDataHora(movimentacao.criado_em)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {movimentacao.tipo === "transferencia" && origem && destino
                          ? `${origem} → ${destino}`
                          : movimentacao.tipo === "entrada" && destino
                            ? `Entrada em ${destino}`
                            : movimentacao.tipo === "saida" && origem
                              ? `Saída de ${origem}`
                              : origem
                                ? `Ajuste em ${origem}`
                                : destino
                                  ? `Ajuste em ${destino}`
                                  : "Sem local informado"}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-slate-400">
                        por {movimentacao.usuario_nome}
                        {movimentacao.justificativa ? ` · ${movimentacao.justificativa}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-display-3 text-slate-900">Resumo</h2>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-[0.625rem] font-semibold uppercase tracking-wide text-slate-400">
                  Saldo total
                </dt>
                <dd className="font-display text-3xl font-bold tracking-tight text-slate-900">
                  {formatarNumero(total)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <dt className="text-xs text-slate-500">Estoque mínimo</dt>
                <dd className="text-sm font-semibold text-slate-800">{formatarNumero(minimo)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-slate-500">Situação</dt>
                <dd>
                  <Etiqueta tom={abaixo ? "alerta" : "sucesso"}>
                    {abaixo ? "Abaixo do mínimo" : "Saldo suficiente"}
                  </Etiqueta>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-slate-500">Monitorada</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {variante.monitorar ? "Sim" : "Não"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-slate-500">Mínimo</dt>
                <dd className="text-xs text-slate-500">
                  {variante.estoque_minimo == null && categoria
                    ? `Herdado (${categoria.limiar_padrao})`
                    : "Definido na variante"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-display-3 text-slate-900">Ações</h2>
            {operador ? (
              <div className="mt-3 space-y-2">
                <Link
                  href={`/movimentacoes/nova?variante=${variante.id}`}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-marca-600 text-sm font-semibold text-white transition-colors hover:bg-marca-700"
                >
                  <Plus className="size-4" aria-hidden />
                  Registrar movimentação
                </Link>
                <Link
                  href="/catalogo"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Editar no catálogo
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Seu perfil consulta o estoque, mas não registra movimentações.
              </p>
            )}
          </section>
        </aside>
      </div>
    </Pagina>
  );
}

/** Página real: lê o id da rota e entrega ao conteúdo reutilizável. */
export default function VariantePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  return <ConteudoDaVariante id={id} />;
}
