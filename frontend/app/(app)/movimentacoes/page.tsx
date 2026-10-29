"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftRight, Plus, SearchX, X } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { CampoDeBusca } from "@/components/ui/campo-de-busca";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Selecao } from "@/components/ui/selecao";
import { cn } from "@/lib/classes";
import { usePrototipo } from "@/prototipo/contexto";
import {
  formatarDataHora,
  formatarNumero,
  normalizar,
  ROTULO_TIPO,
  sinalDaMovimentacao,
  TIPOS_DE_MOVIMENTACAO,
  TOM_DO_TIPO,
} from "@/prototipo/formatos";
import type { Movimentacao } from "@/prototipo/tipos";

function percursoDaMovimentacao(
  movimentacao: Movimentacao,
  caminhoDoLocal: (localId: string) => string,
): string {
  const origem = movimentacao.local_origem_id
    ? caminhoDoLocal(movimentacao.local_origem_id)
    : null;
  const destino = movimentacao.local_destino_id
    ? caminhoDoLocal(movimentacao.local_destino_id)
    : null;

  if (movimentacao.tipo === "transferencia" && origem && destino) return `${origem} → ${destino}`;
  if (movimentacao.tipo === "entrada" && destino) return `Entrada em ${destino}`;
  if (movimentacao.tipo === "saida" && origem) return `Saída de ${origem}`;
  if (movimentacao.tipo === "ajuste") {
    return origem ? `Ajuste em ${origem}` : destino ? `Ajuste em ${destino}` : "Ajuste sem local";
  }
  return "Sem local informado";
}

export default function MovimentacoesPage() {
  const {
    dados,
    cargoVisualizado,
    caminhoDoLocal,
    descendentesDoLocal,
    mensagem,
    limparMensagem,
  } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [localId, setLocalId] = useState("");
  const [periodo, setPeriodo] = useState("todos");
  const [limite, setLimite] = useState<number | null>(null);
  const termo = normalizar(busca);
  const locaisDoFiltro = localId
    ? new Set([localId, ...descendentesDoLocal(localId)])
    : null;

  function mudarPeriodo(valor: string) {
    setPeriodo(valor);
    setLimite(
      valor === "todos" ? null : Date.now() - Number(valor) * 24 * 60 * 60 * 1000,
    );
  }

  const movimentacoes = [...dados.movimentacoes]
    .filter((movimentacao) => {
      if (tipo && movimentacao.tipo !== tipo) return false;

      if (limite && new Date(movimentacao.criado_em).getTime() < limite) return false;

      if (locaisDoFiltro) {
        const origem = movimentacao.local_origem_id;
        const destino = movimentacao.local_destino_id;
        const temLocal =
          (origem && locaisDoFiltro.has(origem)) || (destino && locaisDoFiltro.has(destino));
        if (!temLocal) return false;
      }

      if (termo) {
        const variante = dados.variantes.find((item) => item.id === movimentacao.variante_id);
        const textos = [
          variante?.codigo ?? "",
          variante?.nome ?? "",
          movimentacao.usuario_nome,
          movimentacao.justificativa ?? "",
          percursoDaMovimentacao(movimentacao, caminhoDoLocal),
        ];
        if (!textos.some((texto) => normalizar(texto).includes(termo))) return false;
      }

      return true;
    })
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em));

  function limparFiltros() {
    setBusca("");
    setTipo("");
    setLocalId("");
    mudarPeriodo("todos");
  }

  const temFiltro = Boolean(busca || tipo || localId || periodo !== "todos");

  return (
    <Pagina
      titulo="Movimentações"
      descricao="O histórico de tudo que entrou, saiu, mudou de lugar ou foi ajustado."
      acoes={
        operador ? (
          <Link
            href="/movimentacoes/nova"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-marca-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-marca-700"
          >
            <Plus className="size-4" aria-hidden />
            Nova movimentação
          </Link>
        ) : undefined
      }
    >
      {mensagem && (
        <div className="mb-3 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Alerta tom="sucesso">{mensagem}</Alerta>
          </div>
          <button
            type="button"
            onClick={limparMensagem}
            aria-label="Fechar aviso"
            className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <CampoDeBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar variante ou pessoa"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Selecao rotulo="Tipo" value={tipo} onChange={(evento) => setTipo(evento.target.value)}>
            <option value="">Todos os tipos</option>
            {TIPOS_DE_MOVIMENTACAO.map((valor) => (
              <option key={valor} value={valor}>
                {ROTULO_TIPO[valor]}
              </option>
            ))}
          </Selecao>

          <Selecao
            rotulo="Local"
            value={localId}
            onChange={(evento) => setLocalId(evento.target.value)}
            dica="Inclui os sublocais."
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

          <Selecao
            rotulo="Período"
            value={periodo}
            onChange={(evento) => mudarPeriodo(evento.target.value)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="todos">Todo o histórico</option>
          </Selecao>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {movimentacoes.length}{" "}
            {movimentacoes.length === 1 ? "movimentação encontrada" : "movimentações encontradas"}
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

      <div className="mt-4">
        {movimentacoes.length === 0 ? (
          <EstadoVazio
            icone={SearchX}
            titulo="Nenhuma movimentação encontrada"
            descricao="Tente outro filtro ou registre a primeira entrada."
            acao={
              operador ? (
                <Link
                  href="/movimentacoes/nova"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-marca-600 px-4 text-sm font-semibold text-white hover:bg-marca-700"
                >
                  <Plus className="size-4" aria-hidden />
                  Nova movimentação
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {movimentacoes.map((movimentacao) => {
              const variante = dados.variantes.find(
                (item) => item.id === movimentacao.variante_id,
              );
              const sinal = sinalDaMovimentacao(movimentacao);

              return (
                <article
                  key={movimentacao.id}
                  className="p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiqueta tom={TOM_DO_TIPO[movimentacao.tipo]}>
                      {ROTULO_TIPO[movimentacao.tipo]}
                    </Etiqueta>
                    <span className="font-mono text-[0.6875rem] text-slate-400">
                      {formatarDataHora(movimentacao.criado_em)}
                    </span>
                    <span className="ml-auto text-[0.6875rem] text-slate-400">
                      por {movimentacao.usuario_nome}
                    </span>
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-3">
                    {variante ? (
                      <Link
                        href={`/consulta/variante/${variante.id}`}
                        className="min-w-0 flex-1 hover:underline"
                      >
                        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-wide text-slate-500">
                          {variante.codigo}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {variante.nome}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-500">Variante removida</p>
                    )}
                    <p
                      className={cn(
                        "tabular shrink-0 font-mono text-base font-semibold",
                        sinal === "+"
                          ? "text-emerald-700"
                          : sinal === "−"
                            ? "text-red-700"
                            : "text-slate-500",
                      )}
                    >
                      {sinal}
                      {formatarNumero(movimentacao.quantidade)}{" "}
                      <span className="font-sans text-[0.625rem] font-normal uppercase tracking-wide text-slate-400">
                        un.
                      </span>
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {percursoDaMovimentacao(movimentacao, caminhoDoLocal)}
                  </p>
                  {movimentacao.justificativa && (
                    <p className="mt-1 border-l-2 border-slate-200 pl-2 text-xs italic text-slate-500">
                      {movimentacao.justificativa}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {movimentacoes.length > 0 && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ArrowLeftRight className="size-3.5" aria-hidden />
          Movimentações registradas não podem ser alteradas nem apagadas.
        </p>
      )}
    </Pagina>
  );
}
