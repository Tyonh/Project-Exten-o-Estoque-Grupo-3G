"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromLine,
  Info,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Selecao } from "@/components/ui/selecao";
import { usePrototipo } from "@/prototipo/contexto";
import {
  AJUDA_TIPO,
  formatarNumero,
  ROTULO_TIPO,
  TIPOS_DE_MOVIMENTACAO,
} from "@/prototipo/formatos";
import type { TipoMovimentacao } from "@/prototipo/tipos";
import { cn } from "@/lib/classes";

const ICONES: Record<TipoMovimentacao, LucideIcon> = {
  entrada: ArrowDownToLine,
  saida: ArrowUpFromLine,
  transferencia: ArrowLeftRight,
  ajuste: Wrench,
};

interface FormularioDeMovimentacaoProps {
  varianteInicial?: string;
}

export function FormularioDeMovimentacao({ varianteInicial }: FormularioDeMovimentacaoProps) {
  const router = useRouter();
  const {
    dados,
    cargoVisualizado,
    saldoDaVariante,
    saldoNoLocal,
    minimoDaVariante,
    caminhoDoLocal,
    registrarMovimentacao,
  } = usePrototipo();

  const operador = podeOperar(cargoVisualizado);
  const [tipo, setTipo] = useState<TipoMovimentacao>("entrada");
  const [varianteId, setVarianteId] = useState(() => {
    if (
      varianteInicial &&
      dados.variantes.some((variante) => variante.id === varianteInicial && variante.ativo)
    ) {
      return varianteInicial;
    }
    return "";
  });
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [localAjusteId, setLocalAjusteId] = useState("");
  const [sentido, setSentido] = useState<"aumentar" | "diminuir">("aumentar");
  const [quantidade, setQuantidade] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const variantesAtivas = dados.variantes
    .filter((variante) => variante.ativo)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
  const locaisAtivos = dados.locais
    .filter((local) => local.ativo)
    .sort((a, b) => caminhoDoLocal(a.id).localeCompare(caminhoDoLocal(b.id)));
  const variante = dados.variantes.find((item) => item.id === varianteId);
  const totalAtual = variante ? saldoDaVariante(variante.id) : 0;
  const minimo = variante ? minimoDaVariante(variante) : 0;
  const abaixo = Boolean(variante && variante.monitorar && totalAtual < minimo);

  const quantidadeNumero = Number(quantidade);
  const quantidadeValida = Number.isInteger(quantidadeNumero) && quantidadeNumero > 0;

  const localDeSaida =
    tipo === "saida"
      ? origemId
      : tipo === "transferencia"
        ? origemId
        : tipo === "ajuste" && sentido === "diminuir"
          ? localAjusteId
          : "";
  const saldoDeSaida = localDeSaida ? saldoNoLocal(varianteId, localDeSaida) : 0;
  const insuficiente = Boolean(
    varianteId && localDeSaida && quantidadeValida && saldoDeSaida < quantidadeNumero,
  );
  const mesmoLocal = tipo === "transferencia" && Boolean(origemId) && origemId === destinoId;

  const deltaTotal = !quantidadeValida
    ? 0
    : tipo === "entrada"
      ? quantidadeNumero
      : tipo === "saida"
        ? -quantidadeNumero
        : tipo === "ajuste"
          ? sentido === "aumentar"
            ? quantidadeNumero
            : -quantidadeNumero
          : 0;
  const totalDepois = totalAtual + deltaTotal;

  function mudarTipo(novo: TipoMovimentacao) {
    setTipo(novo);
    setErro(null);
  }

  function descricaoDosLocais(): string {
    if (tipo === "entrada") {
      return destinoId ? `Entrada em ${caminhoDoLocal(destinoId)}` : "Escolha o local de destino.";
    }
    if (tipo === "saida") {
      return origemId ? `Saída de ${caminhoDoLocal(origemId)}` : "Escolha o local de origem.";
    }
    if (tipo === "transferencia") {
      if (!origemId || !destinoId) return "Escolha a origem e o destino.";
      return `${caminhoDoLocal(origemId)} → ${caminhoDoLocal(destinoId)}`;
    }
    if (!localAjusteId) return "Escolha o local do ajuste.";
    return `${sentido === "aumentar" ? "Aumentar" : "Diminuir"} em ${caminhoDoLocal(localAjusteId)}`;
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (!varianteId) {
      setErro("Escolha a variante que vai ser movimentada.");
      return;
    }
    if (!quantidadeValida) {
      setErro("A quantidade precisa ser um número inteiro maior que zero.");
      return;
    }

    let origem: string | null = null;
    let destino: string | null = null;

    if (tipo === "entrada") {
      if (!destinoId) {
        setErro("Escolha o local de destino.");
        return;
      }
      destino = destinoId;
    } else if (tipo === "saida") {
      if (!origemId) {
        setErro("Escolha o local de origem.");
        return;
      }
      origem = origemId;
    } else if (tipo === "transferencia") {
      if (!origemId || !destinoId) {
        setErro("Escolha o local de origem e o de destino.");
        return;
      }
      if (origemId === destinoId) {
        setErro("A origem e o destino precisam ser diferentes.");
        return;
      }
      origem = origemId;
      destino = destinoId;
    } else {
      if (!localAjusteId) {
        setErro("Escolha o local do ajuste.");
        return;
      }
      if (sentido === "aumentar") destino = localAjusteId;
      else origem = localAjusteId;
    }

    if ((tipo === "saida" || tipo === "ajuste") && !justificativa.trim()) {
      setErro(
        tipo === "saida" ? "Informe o motivo da saída." : "Informe o motivo do ajuste.",
      );
      return;
    }

    setEnviando(true);
    const resultado = await registrarMovimentacao({
      variante_id: varianteId,
      tipo,
      quantidade: quantidadeNumero,
      local_origem_id: origem,
      local_destino_id: destino,
      justificativa,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    router.push("/movimentacoes");
  }

  if (!operador) {
    return (
      <Pagina
        titulo="Nova movimentação"
        descricao="Registrar entrada, saída ou transferência de uma variante."
      >
        <Alerta tom="atencao">
          Seu perfil consulta o estoque, mas não registra movimentações. Peça a um gerente de estoque
          ou administrador para fazer a operação.
        </Alerta>
        <Link
          href="/movimentacoes"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar para o histórico
        </Link>
      </Pagina>
    );
  }

  return (
    <Pagina
      titulo="Nova movimentação"
      descricao="Registre o que entrou, saiu ou mudou de lugar. O saldo é sempre resultado das movimentações."
    >
      <Link
        href="/movimentacoes"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Voltar para o histórico
      </Link>

      {variantesAtivas.length === 0 || locaisAtivos.length === 0 ? (
        <Alerta tom="atencao">
          Para movimentar, é preciso ter ao menos uma variante ativa e um local ativo. Confira o
          catálogo e os locais.
        </Alerta>
      ) : (
        <form onSubmit={enviar} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-4">
            {erro && <Alerta tom="erro">{erro}</Alerta>}

            <Cartao
              titulo="1. O que aconteceu?"
              descricao="Escolha o tipo e a variante. Cada operação gera uma linha no histórico."
            >
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_DE_MOVIMENTACAO.map((valor) => {
                  const Icone = ICONES[valor];
                  const ativo = tipo === valor;
                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => mudarTipo(valor)}
                      aria-pressed={ativo}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-md border p-3 text-left transition-colors sm:flex-row",
                        ativo
                          ? "border-marca-400 bg-marca-50"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-md",
                          ativo ? "bg-marca-600 text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <Icone className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-[0.8125rem] font-semibold leading-tight text-slate-800 sm:text-sm">
                          {ROTULO_TIPO[valor]}
                        </span>
                        <span className="block text-[0.6875rem] leading-snug text-slate-500">
                          {AJUDA_TIPO[valor]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <Selecao
                  rotulo="Variante"
                  value={varianteId}
                  onChange={(evento) => setVarianteId(evento.target.value)}
                  required
                >
                  <option value="">Selecione a variante</option>
                  {variantesAtivas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} — {item.nome}
                    </option>
                  ))}
                </Selecao>
              </div>

              {variante && (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Etiqueta tom="info">Saldo total: {formatarNumero(totalAtual)}</Etiqueta>
                    <Etiqueta tom="neutro">Mínimo: {formatarNumero(minimo)}</Etiqueta>
                    {abaixo && <Etiqueta tom="alerta">Abaixo do mínimo</Etiqueta>}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">{variante.nome}</p>
                </div>
              )}
            </Cartao>

            <Cartao
              titulo="2. Locais e quantidade"
              descricao="O local de origem precisa ter saldo suficiente para a quantidade informada."
            >
              <div className="space-y-3">
                {tipo === "entrada" && (
                  <Selecao
                    rotulo="Local de destino"
                    value={destinoId}
                    onChange={(evento) => setDestinoId(evento.target.value)}
                    required
                  >
                    <option value="">Selecione o local</option>
                    {locaisAtivos.map((local) => (
                      <option key={local.id} value={local.id}>
                        {caminhoDoLocal(local.id)} · {local.codigo}
                      </option>
                    ))}
                  </Selecao>
                )}

                {tipo === "saida" && (
                  <Selecao
                    rotulo="Local de origem"
                    value={origemId}
                    onChange={(evento) => setOrigemId(evento.target.value)}
                    required
                    dica={
                      varianteId && origemId
                        ? `Saldo disponível: ${formatarNumero(saldoNoLocal(varianteId, origemId))} unidade(s).`
                        : "Escolha de onde a mercadoria vai sair."
                    }
                  >
                    <option value="">Selecione o local</option>
                    {locaisAtivos.map((local) => (
                      <option key={local.id} value={local.id}>
                        {caminhoDoLocal(local.id)} · {local.codigo}
                      </option>
                    ))}
                  </Selecao>
                )}

                {tipo === "transferencia" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Selecao
                      rotulo="Local de origem"
                      value={origemId}
                      onChange={(evento) => setOrigemId(evento.target.value)}
                      required
                      dica={
                        varianteId && origemId
                          ? `Saldo disponível: ${formatarNumero(saldoNoLocal(varianteId, origemId))}.`
                          : undefined
                      }
                    >
                      <option value="">Selecione a origem</option>
                      {locaisAtivos.map((local) => (
                        <option key={local.id} value={local.id}>
                          {caminhoDoLocal(local.id)} · {local.codigo}
                        </option>
                      ))}
                    </Selecao>
                    <Selecao
                      rotulo="Local de destino"
                      value={destinoId}
                      onChange={(evento) => setDestinoId(evento.target.value)}
                      required
                    >
                      <option value="">Selecione o destino</option>
                      {locaisAtivos.map((local) => (
                        <option key={local.id} value={local.id}>
                          {caminhoDoLocal(local.id)} · {local.codigo}
                        </option>
                      ))}
                    </Selecao>
                  </div>
                )}

                {tipo === "ajuste" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Selecao
                      rotulo="Sentido do ajuste"
                      value={sentido}
                      onChange={(evento) =>
                        setSentido(evento.target.value as "aumentar" | "diminuir")
                      }
                    >
                      <option value="aumentar">Aumentar o saldo</option>
                      <option value="diminuir">Diminuir o saldo</option>
                    </Selecao>
                    <Selecao
                      rotulo={sentido === "aumentar" ? "Local que vai aumentar" : "Local que vai diminuir"}
                      value={localAjusteId}
                      onChange={(evento) => setLocalAjusteId(evento.target.value)}
                      required
                      dica={
                        varianteId && localAjusteId && sentido === "diminuir"
                          ? `Saldo disponível: ${formatarNumero(saldoNoLocal(varianteId, localAjusteId))}.`
                          : undefined
                      }
                    >
                      <option value="">Selecione o local</option>
                      {locaisAtivos.map((local) => (
                        <option key={local.id} value={local.id}>
                          {caminhoDoLocal(local.id)} · {local.codigo}
                        </option>
                      ))}
                    </Selecao>
                  </div>
                )}

                {mesmoLocal && (
                  <Alerta tom="atencao">A origem e o destino precisam ser locais diferentes.</Alerta>
                )}

                {insuficiente && (
                  <Alerta tom="atencao">
                    O saldo em {caminhoDoLocal(localDeSaida)} é de {formatarNumero(saldoDeSaida)}{" "}
                    unidade(s), menor que a quantidade informada.
                  </Alerta>
                )}

                <Campo
                  rotulo="Quantidade"
                  type="number"
                  min={1}
                  step={1}
                  value={quantidade}
                  onChange={(evento) => setQuantidade(evento.target.value)}
                  placeholder="0"
                  required
                  dica="Apenas números inteiros maiores que zero."
                />

                <AreaDeTexto
                  rotulo={
                    tipo === "saida"
                      ? "Motivo da saída"
                      : tipo === "ajuste"
                        ? "Motivo do ajuste"
                        : "Justificativa"
                  }
                  value={justificativa}
                  onChange={(evento) => setJustificativa(evento.target.value)}
                  placeholder={
                    tipo === "saida"
                      ? "Ex.: Pedido 8821 — cliente Balcão Central"
                      : tipo === "ajuste"
                        ? "Ex.: Inventário — diferença de contagem"
                        : "Opcional. Ex.: Compra 1024 — fornecedor Aurora"
                  }
                  required={tipo === "saida" || tipo === "ajuste"}
                  dica={
                    tipo === "saida" || tipo === "ajuste"
                      ? "Obrigatório para saída e ajuste."
                      : "Opcional para entrada e transferência."
                  }
                />
              </div>
            </Cartao>

            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href="/movimentacoes"
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <Botao
                type="submit"
                disabled={insuficiente || mesmoLocal}
                carregando={enviando}
              >
                Registrar movimentação
              </Botao>
            </div>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-6">
            <Cartao titulo="Resumo" icone={Info}>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Tipo</dt>
                  <dd className="text-right font-semibold text-slate-800">{ROTULO_TIPO[tipo]}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Variante</dt>
                  <dd className="max-w-[60%] text-right font-semibold text-slate-800">
                    {variante?.codigo ?? "—"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500">Quantidade</dt>
                  <dd className="text-right font-semibold text-slate-800">
                    {quantidadeValida ? `${formatarNumero(quantidadeNumero)} un.` : "—"}
                  </dd>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <dt className="text-xs text-slate-500">Locais</dt>
                  <dd className="mt-1 text-xs leading-snug text-slate-700">{descricaoDosLocais()}</dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Saldo total agora
                      </p>
                      <p className="tabular font-display text-xl font-bold text-slate-900">
                        {formatarNumero(totalAtual)}
                      </p>
                    </div>
                    <span className="pb-2 text-slate-400" aria-hidden>
                      →
                    </span>
                    <div className="text-right">
                      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Depois
                      </p>
                      <p
                        className={cn(
                          "font-display text-xl font-bold",
                          totalDepois < 0 ? "text-red-600" : "text-slate-900",
                        )}
                      >
                        {formatarNumero(totalDepois)}
                      </p>
                    </div>
                  </div>
                </div>
                {insuficiente && (
                  <Alerta tom="atencao">Ajuste a quantidade ou escolha outro local de origem.</Alerta>
                )}
                {mesmoLocal && <Alerta tom="atencao">Origem e destino precisam ser diferentes.</Alerta>}
              </dl>
            </Cartao>
          </aside>
        </form>
      )}
    </Pagina>
  );
}
