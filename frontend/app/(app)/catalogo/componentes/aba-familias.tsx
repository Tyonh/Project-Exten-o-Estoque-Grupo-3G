"use client";

import { useState } from "react";
import { ArrowRight, Layers, Pencil, Plus } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { Botao } from "@/components/ui/botao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { RetratoDoProduto } from "@/components/ui/retrato-do-produto";
import { usePrototipo } from "@/prototipo/contexto";
import { FormularioDeFamilia } from "./formulario-de-familia";

interface AbaFamiliasProps {
  categoriaFiltro: string | null;
  aoLimparFiltro: () => void;
  aoVerVariantes: (familiaId: string) => void;
}

export function AbaFamilias({
  categoriaFiltro,
  aoLimparFiltro,
  aoVerVariantes,
}: AbaFamiliasProps) {
  const { dados, cargoVisualizado } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);
  const [editandoId, setEditandoId] = useState<string | null | undefined>(undefined);

  const categoria = categoriaFiltro
    ? dados.categorias.find((item) => item.id === categoriaFiltro)
    : undefined;
  const familias = dados.familias
    .filter((familia) => !categoriaFiltro || familia.categoria_id === categoriaFiltro)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-display-3 text-slate-900">Famílias</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Uma família reúne variantes do mesmo tipo, com foto e descrição.
          </p>
        </div>
        {operador && (
          <Botao tamanho="sm" icone={Plus} onClick={() => setEditandoId(null)}>
            Nova família
          </Botao>
        )}
      </div>

      {categoriaFiltro && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Etiqueta tom="info">Categoria: {categoria?.nome ?? "selecionada"}</Etiqueta>
          <button
            type="button"
            onClick={aoLimparFiltro}
            className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {editandoId !== undefined && (
        <div className="mb-4">
          <FormularioDeFamilia
            id={editandoId ?? undefined}
            categoriaInicial={categoriaFiltro ?? undefined}
            aoFechar={() => setEditandoId(undefined)}
          />
        </div>
      )}

      {familias.length === 0 ? (
        <EstadoVazio
          icone={Layers}
          titulo={categoriaFiltro ? "Nenhuma família nesta categoria" : "Nenhuma família cadastrada"}
          descricao="A família define a categoria e a imagem que aparecem na consulta."
          acao={
            operador ? (
              <Botao icone={Plus} onClick={() => setEditandoId(null)}>
                Nova família
              </Botao>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {familias.map((familia) => {
            const categoriaDaFamilia = dados.categorias.find(
              (item) => item.id === familia.categoria_id,
            );
            const variantes = dados.variantes.filter(
              (variante) => variante.familia_id === familia.id,
            ).length;

            return (
              <article
                key={familia.id}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <RetratoDoProduto
                    nome={familia.nome}
                    src={familia.imagem_url}
                    className="size-14"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
                        {familia.nome}
                      </h3>
                      {operador && (
                        <button
                          type="button"
                          onClick={() => setEditandoId(familia.id)}
                          aria-label={`Editar ${familia.nome}`}
                          className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Etiqueta tom="info">{categoriaDaFamilia?.nome ?? "Sem categoria"}</Etiqueta>
                      <Etiqueta tom={familia.ativo ? "sucesso" : "neutro"}>
                        {familia.ativo ? "Ativa" : "Inativa"}
                      </Etiqueta>
                    </div>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 min-h-8 text-xs leading-snug text-slate-500">
                  {familia.descricao || "Sem descrição cadastrada."}
                </p>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">
                    {variantes} {variantes === 1 ? "variante" : "variantes"}
                  </span>
                  <button
                    type="button"
                    onClick={() => aoVerVariantes(familia.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-marca-700 transition-colors hover:text-marca-800"
                  >
                    Ver variantes
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
