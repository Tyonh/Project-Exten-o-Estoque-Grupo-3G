"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Boxes,
  MapPin,
  Move,
  PackageSearch,
  Pencil,
  Plus,
  Power,
} from "lucide-react";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { RetratoDoProduto } from "@/components/ui/retrato-do-produto";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarNumero } from "@/prototipo/formatos";
import { cn } from "@/lib/classes";

interface DetalheDoLocalProps {
  localId: string;
  operador: boolean;
  aoEditar: (localId: string) => void;
  aoMover: (localId: string) => void;
  aoNovoFilho: (paiId: string) => void;
  aoSelecionar: (localId: string) => void;
}

export function DetalheDoLocal({
  localId,
  operador,
  aoEditar,
  aoMover,
  aoNovoFilho,
  aoSelecionar,
}: DetalheDoLocalProps) {
  const {
    dados,
    caminhoDoLocal,
    filhosDoLocal,
    itensNoLocal,
    totalNoLocal,
    alternarLocal,
  } = usePrototipo();
  const [incluirDescendentes, setIncluirDescendentes] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [alternando, setAlternando] = useState(false);

  const local = dados.locais.find((item) => item.id === localId);

  if (!local) {
    return (
      <EstadoVazio
        icone={MapPin}
        titulo="Local não encontrado"
        descricao="Escolha um local na árvore ao lado para ver os detalhes."
      />
    );
  }

  const filhos = filhosDoLocal(local.id);
  const itens = itensNoLocal(local.id, incluirDescendentes);
  const totalDireto = totalNoLocal(local.id, false);
  const totalGeral = totalNoLocal(local.id, true);
  const podeDesativar = totalGeral === 0 && !filhos.some((filho) => filho.ativo);

  async function alternar() {
    if (!local) return;
    setErro(null);
    if (local.ativo) {
      if (!podeDesativar) {
        setErro("Para desativar, o local precisa estar vazio e sem sublocais ativos.");
        return;
      }
      if (!window.confirm(`Desativar ${local.nome}? Ele deixa de aparecer para novas movimentações.`)) {
        return;
      }
    }
    setAlternando(true);
    const resultado = await alternarLocal(local.id);
    setAlternando(false);
    if (!resultado.ok) setErro(resultado.erro);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-400">
              Local
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
              {local.nome}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{caminhoDoLocal(local.id)}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Etiqueta tom="info">{local.tipo}</Etiqueta>
              <Etiqueta tom="neutro">{local.codigo}</Etiqueta>
              <Etiqueta tom={local.ativo ? "sucesso" : "neutro"}>
                {local.ativo ? "Ativo" : "Inativo"}
              </Etiqueta>
              {local.capacidade != null && (
                <Etiqueta tom="neutro">
                  Capacidade {formatarNumero(local.capacidade)}
                </Etiqueta>
              )}
            </div>
          </div>

          {operador && (
            <div className="flex flex-wrap gap-1.5">
              <Botao
                tamanho="sm"
                variante="secundario"
                icone={Plus}
                onClick={() => aoNovoFilho(local.id)}
              >
                Sublocal
              </Botao>
              <Botao
                tamanho="sm"
                variante="secundario"
                icone={Pencil}
                onClick={() => aoEditar(local.id)}
              >
                Editar
              </Botao>
              <Botao
                tamanho="sm"
                variante="secundario"
                icone={Move}
                onClick={() => aoMover(local.id)}
              >
                Mover
              </Botao>
              <Botao
                tamanho="sm"
                variante="secundario"
                icone={Power}
                onClick={alternar}
                carregando={alternando}
                disabled={local.ativo && !podeDesativar}
                title={
                  local.ativo && !podeDesativar
                    ? "Só é possível desativar um local vazio e sem sublocais ativos."
                    : undefined
                }
              >
                {local.ativo ? "Desativar" : "Reativar"}
              </Botao>
            </div>
          )}
        </div>

        {!local.ativo && (
          <div className="mt-3">
            <Alerta tom="atencao">
              Este local está inativo. Ele continua no histórico, mas não recebe novas movimentações.
            </Alerta>
          </div>
        )}

        {erro && (
          <div className="mt-3">
            <Alerta tom="erro">{erro}</Alerta>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-4">
          <div className="border-b border-r border-slate-200 p-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Direto aqui
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold text-slate-900">
              {formatarNumero(totalDireto)}
            </p>
            <p className="text-[0.6875rem] text-slate-500">unidades</p>
          </div>
          <div className="border-b border-r border-slate-200 p-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Com sublocais
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold text-slate-900">
              {formatarNumero(totalGeral)}
            </p>
            <p className="text-[0.6875rem] text-slate-500">unidades</p>
          </div>
          <div className="border-b border-r border-slate-200 p-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Sublocais
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold text-slate-900">
              {formatarNumero(filhos.length)}
            </p>
            <p className="text-[0.6875rem] text-slate-500">
              {filhos.length === 1 ? "local" : "locais"}
            </p>
          </div>
          <div className="border-b border-r border-slate-200 p-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Variantes
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold text-slate-900">
              {formatarNumero(itens.length)}
            </p>
            <p className="text-[0.6875rem] text-slate-500">
              {incluirDescendentes ? "com sublocais" : "diretas"}
            </p>
          </div>
        </div>
      </section>

      {filhos.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-display-3 text-slate-900">Sublocais</h3>
              <p className="mt-0.5 text-sm text-slate-500">Endereços dentro deste local.</p>
            </div>
            <Etiqueta tom="neutro">{filhos.length}</Etiqueta>
          </div>
          <div className="divide-y divide-slate-100">
            {filhos.map((filho) => (
              <button
                key={filho.id}
                type="button"
                onClick={() => aoSelecionar(filho.id)}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-md border",
                    filho.ativo
                      ? "border-slate-200 bg-white text-slate-500"
                      : "border-slate-200 bg-slate-100 text-slate-400",
                  )}
                >
                  <Boxes className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {filho.nome}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {filho.tipo} · {filho.codigo} · {formatarNumero(totalNoLocal(filho.id, true))} un.
                  </span>
                </span>
                {!filho.ativo && <Etiqueta tom="neutro">Inativo</Etiqueta>}
                <ArrowRight className="size-4 shrink-0 text-slate-300" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-display-3 text-slate-900">O que há aqui</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {incluirDescendentes
                ? "Somatório deste local e de todos os sublocais."
                : "Somente a mercadoria guardada diretamente neste local."}
            </p>
          </div>

          {filhos.length > 0 && (
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setIncluirDescendentes(false)}
                aria-pressed={!incluirDescendentes}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[0.6875rem] font-semibold transition-colors",
                  !incluirDescendentes
                    ? "bg-white text-slate-900"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                Só aqui
              </button>
              <button
                type="button"
                onClick={() => setIncluirDescendentes(true)}
                aria-pressed={incluirDescendentes}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[0.6875rem] font-semibold transition-colors",
                  incluirDescendentes
                    ? "bg-white text-slate-900"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                Com sublocais
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          {itens.length === 0 ? (
            <EstadoVazio
              icone={PackageSearch}
              titulo="Nenhuma mercadoria aqui"
              descricao={
                incluirDescendentes
                  ? "Este local e os sublocais dele estão vazios."
                  : "Não há saldo guardado diretamente neste local."
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {itens.map(({ variante, quantidade }) => (
                <Link
                  key={variante.id}
                  href={`/consulta/variante/${variante.id}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <RetratoDoProduto
                    nome={variante.nome}
                    src={variante.imagem_url}
                    className="size-10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold tracking-wide text-slate-500">
                      {variante.codigo}
                    </span>
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {variante.nome}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-slate-900">
                      {formatarNumero(quantidade)}
                    </span>
                    <span className="block text-[0.625rem] uppercase tracking-wide text-slate-400">
                      unidades
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-slate-300" aria-hidden />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
