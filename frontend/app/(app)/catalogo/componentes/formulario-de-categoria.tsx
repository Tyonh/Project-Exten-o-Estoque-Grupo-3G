"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";
import { Selecao } from "@/components/ui/selecao";
import { usePrototipo } from "@/prototipo/contexto";
import type { Atributo, TipoAtributo } from "@/prototipo/tipos";

interface FormularioDeCategoriaProps {
  id?: string;
  aoFechar: () => void;
}

export function FormularioDeCategoria({ id, aoFechar }: FormularioDeCategoriaProps) {
  const { dados, criarCategoria, editarCategoria } = usePrototipo();
  const categoria = id ? dados.categorias.find((item) => item.id === id) : undefined;

  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [limiar, setLimiar] = useState(String(categoria?.limiar_padrao ?? 0));
  const [atributos, setAtributos] = useState<Atributo[]>(
    categoria?.atributos.map((atributo) => ({ ...atributo })) ?? [],
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (id && !categoria) {
    return (
      <Cartao titulo="Categoria não encontrada">
        <Alerta tom="erro">A categoria não existe mais. Feche e tente de novo.</Alerta>
        <Botao variante="secundario" className="mt-3" onClick={aoFechar}>
          Fechar
        </Botao>
      </Cartao>
    );
  }

  function atualizarAtributo(indice: number, mudanca: Partial<Atributo>) {
    setAtributos((atuais) =>
      atuais.map((atributo, posicao) =>
        posicao === indice ? { ...atributo, ...mudanca } : atributo,
      ),
    );
  }

  function adicionarAtributo() {
    setAtributos((atuais) => [...atuais, { chave: "", rotulo: "", tipo: "texto" }]);
  }

  function removerAtributo(indice: number) {
    setAtributos((atuais) => atuais.filter((_, posicao) => posicao !== indice));
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const limiarNumero = Number(limiar);
    if (!Number.isInteger(limiarNumero) || limiarNumero < 0) {
      setErro("O estoque mínimo padrão precisa ser um número inteiro maior ou igual a zero.");
      return;
    }

    const dadosDaCategoria = {
      nome,
      limiar_padrao: limiarNumero,
      atributos,
    };

    setEnviando(true);
    const resultado = id
      ? await editarCategoria(id, dadosDaCategoria)
      : await criarCategoria(dadosDaCategoria);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    aoFechar();
  }

  return (
    <Cartao
      titulo={id ? "Editar categoria" : "Nova categoria"}
      descricao="A categoria agrupa famílias parecidas e define o mínimo padrão."
    >
      <form onSubmit={enviar} className="space-y-4">
        {erro && <Alerta tom="erro">{erro}</Alerta>}

        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Campo
            rotulo="Nome da categoria"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Refletor"
            required
          />
          <Campo
            rotulo="Estoque mínimo padrão"
            type="number"
            min={0}
            step={1}
            value={limiar}
            onChange={(evento) => setLimiar(evento.target.value)}
            dica="Usado quando a variante não tem mínimo próprio."
          />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Características</p>
              <p className="text-xs text-slate-500">
                Campos que toda variante desta categoria vai preencher.
              </p>
            </div>
            <Botao
              type="button"
              variante="secundario"
              tamanho="sm"
              icone={Plus}
              onClick={adicionarAtributo}
            >
              Adicionar
            </Botao>
          </div>

          {atributos.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
              Nenhuma característica. A variante pode ser cadastrada só com código e nome.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {atributos.map((atributo, indice) => (
                <div
                  key={indice}
                  className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1.2fr_8rem_auto] sm:items-end"
                >
                  <Campo
                    rotulo="Chave interna"
                    value={atributo.chave}
                    onChange={(evento) => atualizarAtributo(indice, { chave: evento.target.value })}
                    placeholder="potencia_w"
                    dica="Sem espaços."
                  />
                  <Campo
                    rotulo="Rótulo na tela"
                    value={atributo.rotulo}
                    onChange={(evento) => atualizarAtributo(indice, { rotulo: evento.target.value })}
                    placeholder="Potência (W)"
                  />
                  <Selecao
                    rotulo="Tipo"
                    value={atributo.tipo}
                    onChange={(evento) =>
                      atualizarAtributo(indice, { tipo: evento.target.value as TipoAtributo })
                    }
                  >
                    <option value="texto">Texto</option>
                    <option value="numero">Número</option>
                  </Selecao>
                  <button
                    type="button"
                    onClick={() => removerAtributo(indice)}
                    aria-label={`Remover ${atributo.rotulo || "característica"}`}
                    className="grid size-9 place-items-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Botao type="button" variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={enviando}>
            {id ? "Salvar alterações" : "Criar categoria"}
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
