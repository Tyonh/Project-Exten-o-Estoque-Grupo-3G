"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { Pagina } from "@/components/layout/pagina";
import { Botao } from "@/components/ui/botao";
import { CampoDeBusca } from "@/components/ui/campo-de-busca";
import { Etiqueta } from "@/components/ui/etiqueta";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarNumero, normalizar } from "@/prototipo/formatos";
import { cn } from "@/lib/classes";
import { ArvoreDeLocais } from "./componentes/arvore-de-locais";
import { DetalheDoLocal } from "./componentes/detalhe-do-local";
import { FormularioDeLocal } from "./componentes/formulario-de-local";

type FormularioAberto =
  | { modo: "criar"; paiId: string | null }
  | { modo: "editar"; id: string }
  | { modo: "mover"; id: string }
  | null;

export default function LocaisPage() {
  const { dados, cargoVisualizado, caminhoDoLocal, totalNoLocal } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(
    () => dados.locais.find((local) => local.pai_id === null)?.id ?? dados.locais[0]?.id ?? null,
  );
  const [formulario, setFormulario] = useState<FormularioAberto>(null);
  const [busca, setBusca] = useState("");

  const termo = normalizar(busca);
  const encontrados = termo
    ? dados.locais
        .filter((local) => {
          return (
            normalizar(local.nome).includes(termo) ||
            normalizar(local.codigo).includes(termo) ||
            normalizar(caminhoDoLocal(local.id)).includes(termo)
          );
        })
        .sort((a, b) => caminhoDoLocal(a.id).localeCompare(caminhoDoLocal(b.id)))
    : [];

  return (
    <Pagina
      titulo="Locais"
      descricao="A árvore de endereços do estoque. Abra um local para ver o que há nele."
      acoes={
        operador ? (
          <Botao icone={Plus} onClick={() => setFormulario({ modo: "criar", paiId: null })}>
            Novo local
          </Botao>
        ) : undefined
      }
    >
      {formulario && (
        <div className="mb-4">
          <FormularioDeLocal
            modo={formulario.modo}
            id={formulario.modo === "criar" ? undefined : formulario.id}
            paiInicial={formulario.modo === "criar" ? formulario.paiId : undefined}
            aoSalvar={(local) => setSelecionadoId(local.id)}
            aoFechar={() => setFormulario(null)}
          />
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-2 lg:sticky lg:top-6">
          <CampoDeBusca
            valor={busca}
            aoMudar={setBusca}
            placeholder="Buscar local por nome ou código"
            className="mb-2"
          />

          {busca ? (
            <div className="space-y-0.5">
              {encontrados.length === 0 ? (
                <p className="px-3 py-5 text-center text-xs text-slate-500">
                  Nenhum local encontrado para “{busca}”.
                </p>
              ) : (
                encontrados.map((local) => {
                  const selecionado = local.id === selecionadoId;
                  return (
                    <button
                      key={local.id}
                      type="button"
                      onClick={() => setSelecionadoId(local.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                        selecionado ? "bg-marca-50" : "hover:bg-slate-50",
                      )}
                    >
                      <MapPin
                        className={cn(
                          "size-4 shrink-0",
                          local.ativo ? "text-marca-600" : "text-slate-400",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {local.nome} · {local.codigo}
                        </span>
                        <span className="block truncate text-[0.6875rem] text-slate-400">
                          {caminhoDoLocal(local.id)} · {formatarNumero(totalNoLocal(local.id, true))}{" "}
                          un.
                        </span>
                      </span>
                      {!local.ativo && <Etiqueta tom="neutro">Inativo</Etiqueta>}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <ArvoreDeLocais
              selecionadoId={selecionadoId}
              aoSelecionar={(localId) => setSelecionadoId(localId)}
            />
          )}
        </div>

        <div className="min-w-0">
          {selecionadoId ? (
            <DetalheDoLocal
              localId={selecionadoId}
              operador={operador}
              aoEditar={(id) => setFormulario({ modo: "editar", id })}
              aoMover={(id) => setFormulario({ modo: "mover", id })}
              aoNovoFilho={(paiId) => setFormulario({ modo: "criar", paiId })}
              aoSelecionar={setSelecionadoId}
            />
          ) : (
            <EstadoVazio
              icone={MapPin}
              titulo="Nenhum local selecionado"
              descricao="Escolha um local na árvore ou crie o primeiro galpão."
              acao={
                operador ? (
                  <Botao
                    icone={Plus}
                    onClick={() => setFormulario({ modo: "criar", paiId: null })}
                  >
                    Novo local
                  </Botao>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </Pagina>
  );
}
