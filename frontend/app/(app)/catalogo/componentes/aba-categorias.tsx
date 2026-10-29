"use client";

import { useState } from "react";
import { ArrowRight, Pencil, Plus, Tags } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { Botao } from "@/components/ui/botao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { usePrototipo } from "@/prototipo/contexto";
import { FormularioDeCategoria } from "./formulario-de-categoria";

interface AbaCategoriasProps {
  aoVerFamilias: (categoriaId: string) => void;
}

export function AbaCategorias({ aoVerFamilias }: AbaCategoriasProps) {
  const { dados, cargoVisualizado } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);
  const [editandoId, setEditandoId] = useState<string | null | undefined>(undefined);

  const categorias = [...dados.categorias].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-display-3 text-slate-900">Categorias</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Cada categoria define as características e o mínimo padrão das variantes.
          </p>
        </div>
        {operador && (
          <Botao tamanho="sm" icone={Plus} onClick={() => setEditandoId(null)}>
            Nova categoria
          </Botao>
        )}
      </div>

      {editandoId !== undefined && (
        <div className="mb-4">
          <FormularioDeCategoria
            id={editandoId ?? undefined}
            aoFechar={() => setEditandoId(undefined)}
          />
        </div>
      )}

      {categorias.length === 0 ? (
        <EstadoVazio
          icone={Tags}
          titulo="Nenhuma categoria cadastrada"
          descricao="Comece pela categoria; depois crie as famílias e as variantes."
          acao={
            operador ? (
              <Botao icone={Plus} onClick={() => setEditandoId(null)}>
                Nova categoria
              </Botao>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {categorias.map((categoria) => {
            const familias = dados.familias.filter(
              (familia) => familia.categoria_id === categoria.id,
            );
            const variantes = dados.variantes.filter((variante) =>
              familias.some((familia) => familia.id === variante.familia_id),
            ).length;

            return (
              <article
                key={categoria.id}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-marca-50 text-marca-700">
                    <Tags className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
                      {categoria.nome}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Etiqueta tom="neutro">Mínimo {categoria.limiar_padrao}</Etiqueta>
                      <Etiqueta tom="info">
                        {familias.length} {familias.length === 1 ? "família" : "famílias"}
                      </Etiqueta>
                      <Etiqueta tom="info">
                        {variantes} {variantes === 1 ? "variante" : "variantes"}
                      </Etiqueta>
                    </div>
                  </div>
                  {operador && (
                    <button
                      type="button"
                      onClick={() => setEditandoId(categoria.id)}
                      aria-label={`Editar ${categoria.nome}`}
                      className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-1 flex-wrap content-start gap-1">
                  {categoria.atributos.length === 0 ? (
                    <p className="text-xs text-slate-400">Sem características definidas.</p>
                  ) : (
                    categoria.atributos.map((atributo) => (
                      <span
                        key={atributo.chave}
                        className="rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-600"
                      >
                        {atributo.rotulo}
                      </span>
                    ))
                  )}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => aoVerFamilias(categoria.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-marca-700 transition-colors hover:text-marca-800"
                  >
                    Ver famílias
                    <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
