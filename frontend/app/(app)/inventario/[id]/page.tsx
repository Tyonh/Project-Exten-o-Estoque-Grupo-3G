"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, CircleCheck, ListChecks, Plus, Scale } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import {
  buscarInventario,
  incluirItemNoInventario,
  registrarContagem,
} from "@estoque/backend/inventarios";
import type { InventarioDetalhe, ItemDoInventario } from "@estoque/backend/tipos";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { CampoDeBusca } from "@/components/ui/campo-de-busca";
import { Carregando } from "@/components/ui/carregando";
import { Cartao } from "@/components/ui/cartao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarNumero, normalizar } from "@/prototipo/formatos";

const ITENS_POR_PAGINA = 40;
const MAX_SUGESTOES = 8;

type EstadoDoItem = "salvando" | "salvo" | { erro: string };

const textoDaContagem = (item: ItemDoInventario): string =>
  item.quantidade_contada === null ? "" : String(item.quantidade_contada);

/** T7.2 e T7.3: contagem dos itens de um local, pensada para o celular. */
export default function ContagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { cargoVisualizado, dados } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  const [inventario, setInventario] = useState<InventarioDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [estados, setEstados] = useState<Record<string, EstadoDoItem>>({});
  const [busca, setBusca] = useState("");
  const [soNaoContados, setSoNaoContados] = useState(false);
  const [limite, setLimite] = useState(ITENS_POR_PAGINA);
  const [incluindo, setIncluindo] = useState(false);
  const [buscaNova, setBuscaNova] = useState("");
  const [quantidadeNova, setQuantidadeNova] = useState<Record<string, string>>({});
  const [erroDaInclusao, setErroDaInclusao] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarInventario(id).then((resultado) => {
      if (cancelado) return;
      if (resultado.ok) {
        setInventario(resultado.dados);
        setValores(Object.fromEntries(resultado.dados.itens.map((item) => [item.variante_id, textoDaContagem(item)])));
        setErro(null);
      } else {
        setErro(resultado.erro);
      }
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [id, versao]);

  const editavel = operador && inventario?.status === "aberto";

  async function salvar(item: ItemDoInventario) {
    const digitado = (valores[item.variante_id] ?? "").trim();
    if (digitado === textoDaContagem(item)) return;
    const quantidade = digitado === "" ? null : Number(digitado);

    setEstados((atual) => ({ ...atual, [item.variante_id]: "salvando" }));
    const resultado = await registrarContagem(id, item.variante_id, quantidade);
    if (resultado.ok) {
      setInventario((atual) =>
        atual
          ? {
              ...atual,
              itens: atual.itens.map((outro) =>
                outro.variante_id === item.variante_id ? { ...outro, quantidade_contada: quantidade } : outro,
              ),
              total_contados:
                atual.total_contados + (quantidade !== null ? 1 : 0) - (item.quantidade_contada !== null ? 1 : 0),
            }
          : atual,
      );
      setEstados((atual) => ({ ...atual, [item.variante_id]: "salvo" }));
    } else {
      setEstados((atual) => ({ ...atual, [item.variante_id]: { erro: resultado.erro } }));
    }
  }

  async function incluir(varianteId: string) {
    setErroDaInclusao(null);
    const digitado = (quantidadeNova[varianteId] ?? "").trim();
    const resultado = await incluirItemNoInventario(id, varianteId, digitado === "" ? null : Number(digitado));
    if (resultado.ok) {
      setBuscaNova("");
      setIncluindo(false);
      setCarregando(true);
      setVersao((atual) => atual + 1);
    } else {
      setErroDaInclusao(resultado.erro);
    }
  }

  const termo = normalizar(busca);
  const itensFiltrados = (inventario?.itens ?? []).filter((item) => {
    if (soNaoContados && item.quantidade_contada !== null) return false;
    if (!termo) return true;
    return [item.codigo, item.nome, item.marca ?? "", item.familia ?? ""].some((texto) =>
      normalizar(texto).includes(termo),
    );
  });

  const noInventario = new Set((inventario?.itens ?? []).map((item) => item.variante_id));
  const termoNovo = normalizar(buscaNova);
  const sugestoes = termoNovo
    ? dados.variantes
        .filter(
          (variante) =>
            variante.ativo &&
            !noInventario.has(variante.id) &&
            [variante.codigo, variante.nome, variante.marca ?? ""].some((texto) =>
              normalizar(texto).includes(termoNovo),
            ),
        )
        .slice(0, MAX_SUGESTOES)
    : [];

  return (
    <Pagina
      sobretitulo="Inventário"
      titulo={inventario ? `Contagem · ${inventario.local_codigo}` : "Contagem"}
      descricao={inventario?.local_caminho ?? "Informe a quantidade contada de cada variante do local."}
      acoes={
        <Link
          href="/inventario"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Inventários
        </Link>
      }
    >
      {carregando && <Carregando texto="Abrindo o inventário..." />}
      {!carregando && erro && <Alerta tom="erro">{erro}</Alerta>}

      {!carregando && inventario && (
        <div className="space-y-4 pb-24 sm:pb-0">
          {inventario.status !== "aberto" && (
            <Alerta tom="info" titulo={inventario.status === "concluido" ? "Inventário concluído" : "Inventário cancelado"}>
              Não é mais possível alterar a contagem. Veja o resultado no resumo.
            </Alerta>
          )}

          <Cartao>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-slate-600">
                <strong className="text-slate-900">{inventario.total_contados}</strong> de{" "}
                <strong className="text-slate-900">{inventario.total_de_itens}</strong> itens contados
              </p>
              {inventario.observacao && <Etiqueta>{inventario.observacao}</Etiqueta>}
            </div>
            <div className="mt-3 space-y-3">
              <CampoDeBusca
                valor={busca}
                aoMudar={(valor) => {
                  setBusca(valor);
                  setLimite(ITENS_POR_PAGINA);
                }}
                placeholder="Buscar código, nome ou marca"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={soNaoContados}
                  onChange={(evento) => {
                    setSoNaoContados(evento.target.checked);
                    setLimite(ITENS_POR_PAGINA);
                  }}
                  className="size-4 accent-marca-600"
                />
                Só o que falta contar
              </label>
            </div>
          </Cartao>

          {itensFiltrados.length === 0 ? (
            <EstadoVazio
              icone={ListChecks}
              titulo={inventario.itens.length === 0 ? "Local sem saldo" : "Nada encontrado"}
              descricao={
                inventario.itens.length === 0
                  ? "O sistema não tinha nenhum item neste local. Inclua o que for encontrado."
                  : "Tente outro termo ou desmarque o filtro."
              }
            />
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {itensFiltrados.slice(0, limite).map((item) => {
                const estado = estados[item.variante_id];
                const contado = item.quantidade_contada !== null;
                return (
                  <li key={item.variante_id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-wide text-slate-500">
                        {item.codigo}
                        {item.marca ? ` · ${item.marca}` : ""}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{item.nome}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Sistema: <strong className="tabular text-slate-700">{formatarNumero(item.quantidade_sistema)}</strong>
                      </p>
                      {estado && typeof estado === "object" && (
                        <p role="alert" className="mt-1 text-xs font-semibold text-red-700">
                          {estado.erro}
                        </p>
                      )}
                    </div>
                    {editavel ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {estado === "salvo" && contado && (
                          <CircleCheck className="size-4 text-emerald-600" aria-label="Contagem salva" />
                        )}
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder="—"
                          aria-label={`Quantidade contada de ${item.codigo}`}
                          value={valores[item.variante_id] ?? ""}
                          disabled={estado === "salvando"}
                          onChange={(evento) =>
                            setValores((atual) => ({ ...atual, [item.variante_id]: evento.target.value }))
                          }
                          onBlur={() => salvar(item)}
                          className="h-11 w-24 rounded-md border border-slate-300 px-2 text-right text-base"
                        />
                      </div>
                    ) : (
                      <span className="shrink-0 text-sm font-semibold text-slate-700">
                        {contado ? formatarNumero(item.quantidade_contada ?? 0) : "—"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {itensFiltrados.length > limite && (
            <button
              type="button"
              onClick={() => setLimite((atual) => atual + ITENS_POR_PAGINA)}
              className="h-11 w-full rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Mostrar mais ({itensFiltrados.length - limite} restantes)
            </button>
          )}

          {editavel && (
            <Cartao
              titulo="Item encontrado fora da lista"
              descricao="Achou no local uma variante que o sistema não tinha ali? Inclua com a quantidade contada."
            >
              {!incluindo ? (
                <Botao variante="secundario" icone={Plus} onClick={() => setIncluindo(true)}>
                  Incluir item encontrado
                </Botao>
              ) : (
                <div className="space-y-3">
                  <CampoDeBusca valor={buscaNova} aoMudar={setBuscaNova} placeholder="Buscar código, nome ou marca" />
                  {erroDaInclusao && <Alerta tom="erro">{erroDaInclusao}</Alerta>}
                  {sugestoes.map((variante) => (
                    <div key={variante.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[0.6875rem] uppercase text-slate-500">{variante.codigo}</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{variante.nome}</p>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="Qtd."
                        aria-label={`Quantidade encontrada de ${variante.codigo}`}
                        value={quantidadeNova[variante.id] ?? ""}
                        onChange={(evento) =>
                          setQuantidadeNova((atual) => ({ ...atual, [variante.id]: evento.target.value }))
                        }
                        className="h-10 w-20 rounded-md border border-slate-300 px-2 text-right text-sm"
                      />
                      <Botao tamanho="sm" onClick={() => incluir(variante.id)}>
                        Incluir
                      </Botao>
                    </div>
                  ))}
                  <Botao variante="fantasma" tamanho="sm" onClick={() => setIncluindo(false)}>
                    Fechar
                  </Botao>
                </div>
              )}
            </Cartao>
          )}

          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white p-3 sm:static sm:border-0 sm:bg-transparent sm:p-0">
            <Link
              href={`/inventario/${id}/resumo`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-marca-600 px-5 text-base font-semibold text-white hover:bg-marca-700 sm:w-auto"
            >
              <Scale className="size-4" aria-hidden />
              {editavel ? "Ver resumo e concluir" : "Ver resumo"}
            </Link>
          </div>
        </div>
      )}
    </Pagina>
  );
}
