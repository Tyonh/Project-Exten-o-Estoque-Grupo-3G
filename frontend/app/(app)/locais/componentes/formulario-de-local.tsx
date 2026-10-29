"use client";

import { useState } from "react";
import type { Resultado } from "@estoque/backend/resultado";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";
import { Selecao } from "@/components/ui/selecao";
import { usePrototipo } from "@/prototipo/contexto";
import type { Local } from "@/prototipo/tipos";

type ModoDoFormulario = "criar" | "editar" | "mover";

interface FormularioDeLocalProps {
  modo: ModoDoFormulario;
  id?: string;
  paiInicial?: string | null;
  aoFechar: () => void;
  aoSalvar?: (local: Local) => void;
}

export function FormularioDeLocal({
  modo,
  id,
  paiInicial,
  aoFechar,
  aoSalvar,
}: FormularioDeLocalProps) {
  const { dados, criarLocal, editarLocal, moverLocal, locaisDisponiveisComoPai, caminhoDoLocal } =
    usePrototipo();
  const local = id ? dados.locais.find((item) => item.id === id) : undefined;

  const [nome, setNome] = useState(local?.nome ?? "");
  const [tipo, setTipo] = useState(local?.tipo ?? "");
  const [codigo, setCodigo] = useState(local?.codigo ?? "");
  const [capacidade, setCapacidade] = useState(
    local?.capacidade != null ? String(local.capacidade) : "",
  );
  const [paiId, setPaiId] = useState<string | null>(local?.pai_id ?? paiInicial ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (modo !== "criar" && !local) {
    return (
      <Cartao titulo="Local não encontrado">
        <Alerta tom="erro">O local não existe mais. Feche e tente de novo.</Alerta>
        <Botao variante="secundario" className="mt-3" onClick={aoFechar}>
          Fechar
        </Botao>
      </Cartao>
    );
  }

  const paisDisponiveis = locaisDisponiveisComoPai(modo === "criar" ? undefined : id);

  function concluir(resultado: Resultado<Local>) {
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    aoSalvar?.(resultado.dados);
    aoFechar();
  }

  async function executar(acao: Promise<Resultado<Local>>) {
    setEnviando(true);
    const resultado = await acao;
    setEnviando(false);
    concluir(resultado);
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (modo === "mover") {
      if (!id) return;
      await executar(moverLocal(id, paiId));
      return;
    }

    const capacidadeNumero = capacidade.trim() === "" ? null : Number(capacidade);
    if (
      capacidadeNumero != null &&
      (!Number.isInteger(capacidadeNumero) || capacidadeNumero <= 0)
    ) {
      setErro("A capacidade precisa ser um número inteiro maior que zero.");
      return;
    }

    const dadosDoLocal = {
      pai_id: paiId || null,
      nome,
      tipo,
      codigo,
      capacidade: capacidadeNumero,
      ativo: local?.ativo ?? true,
    };

    if (modo === "editar") {
      if (!id) return;
      await executar(editarLocal(id, dadosDoLocal));
      return;
    }

    await executar(criarLocal(dadosDoLocal));
  }

  const titulo =
    modo === "mover" ? "Mover local" : modo === "editar" ? "Editar local" : paiInicial ? "Novo sublocal" : "Novo local";

  return (
    <Cartao
      titulo={titulo}
      descricao={
        modo === "mover"
          ? "Escolha o novo local pai. Um local não pode ir para dentro de um descendente."
          : "O código é o endereço curto usado nas etiquetas e nas buscas (ex.: G1-A-03)."
      }
    >
      <form onSubmit={enviar} className="space-y-4">
        {erro && <Alerta tom="erro">{erro}</Alerta>}

        {modo === "mover" && local && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Hoje em: <strong className="text-slate-800">{caminhoDoLocal(local.id)}</strong>
          </p>
        )}

        {modo !== "mover" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Nome do local"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder="Ex.: Módulo 01"
                required
              />
              <Campo
                rotulo="Tipo"
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value)}
                placeholder="Galpão, Setor, Módulo..."
                list="tipos-de-local"
                required
              />
              <datalist id="tipos-de-local">
                <option value="Galpão" />
                <option value="Setor" />
                <option value="Módulo" />
                <option value="Prateleira" />
              </datalist>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Código"
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
                placeholder="Ex.: G1-A-03"
                autoCapitalize="characters"
                maxLength={40}
                required
              />
              <Campo
                rotulo="Capacidade"
                type="number"
                min={1}
                step={1}
                value={capacidade}
                onChange={(evento) => setCapacidade(evento.target.value)}
                placeholder="Opcional"
                dica="Número inteiro maior que zero, se quiser registrar um limite."
              />
            </div>
          </>
        )}

        <Selecao
          rotulo="Local pai"
          value={paiId ?? ""}
          onChange={(evento) => setPaiId(evento.target.value || null)}
          dica={
            modo === "mover"
              ? "O local e todos os sublocais dele passam para o novo pai."
              : "Deixe em branco para um local de primeiro nível."
          }
        >
          <option value="">Sem local pai (raiz)</option>
          {paisDisponiveis.map((pai) => (
            <option key={pai.id} value={pai.id}>
              {caminhoDoLocal(pai.id)} · {pai.codigo}
            </option>
          ))}
        </Selecao>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Botao type="button" variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={enviando}>
            {modo === "mover"
              ? "Mover local"
              : modo === "editar"
                ? "Salvar alterações"
                : "Criar local"}
          </Botao>
        </div>
      </form>
    </Cartao>
  );
}
