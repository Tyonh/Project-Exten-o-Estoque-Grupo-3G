"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Scale } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { buscarInventario, cancelarInventario, concluirInventario } from "@estoque/backend/inventarios";
import type { InventarioDetalhe } from "@estoque/backend/tipos";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Carregando } from "@/components/ui/carregando";
import { Cartao } from "@/components/ui/cartao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarDataHora, formatarNumero } from "@/prototipo/formatos";

interface LinhaDeDiferenca {
  varianteId: string;
  codigo: string;
  nome: string;
  sistema: number;
  contado: number;
  diferenca: number;
}

function linhasDeDiferenca(inventario: InventarioDetalhe): LinhaDeDiferenca[] {
  const porVariante = new Map(inventario.itens.map((item) => [item.variante_id, item]));

  // Aberto: usa o saldo de agora (é o que a conclusão vai gravar). Fechado: o
  // que o sistema tinha quando o inventário foi aberto, contra o que foi contado.
  if (inventario.status === "aberto") {
    return inventario.ajustes.map((ajuste) => {
      const item = porVariante.get(ajuste.variante_id);
      return {
        varianteId: ajuste.variante_id,
        codigo: item?.codigo ?? "",
        nome: item?.nome ?? "",
        sistema: ajuste.saldo_atual,
        contado: ajuste.saldo_novo,
        diferenca: ajuste.tipo === "entrada" ? ajuste.quantidade : -ajuste.quantidade,
      };
    });
  }

  return inventario.itens
    .filter((item) => item.quantidade_contada !== null && item.quantidade_contada !== item.quantidade_sistema)
    .map((item) => ({
      varianteId: item.variante_id,
      codigo: item.codigo,
      nome: item.nome,
      sistema: item.quantidade_sistema,
      contado: item.quantidade_contada ?? 0,
      diferenca: (item.quantidade_contada ?? 0) - item.quantidade_sistema,
    }));
}

/** T7.4 e T7.5: diferenças entre a contagem e o sistema, antes de concluir ou cancelar. */
export default function ResumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { cargoVisualizado, recarregarDados } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  const [inventario, setInventario] = useState<InventarioDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<"concluir" | "cancelar" | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroDaAcao, setErroDaAcao] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarInventario(id).then((resultado) => {
      if (cancelado) return;
      if (resultado.ok) setInventario(resultado.dados);
      else setErro(resultado.erro);
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function executar(acao: "concluir" | "cancelar") {
    setProcessando(true);
    setErroDaAcao(null);
    const resultado = acao === "concluir" ? await concluirInventario(id) : await cancelarInventario(id);
    if (resultado.ok) {
      await recarregarDados();
      router.push("/inventario");
      return;
    }
    setProcessando(false);
    setConfirmando(null);
    setErroDaAcao(resultado.erro);
  }

  const linhas = inventario ? linhasDeDiferenca(inventario) : [];
  const naoContados = inventario ? inventario.total_de_itens - inventario.total_contados : 0;
  const aberto = inventario?.status === "aberto";

  return (
    <Pagina
      sobretitulo="Inventário"
      titulo="Resumo das diferenças"
      descricao="Confira o que será ajustado. Itens não contados não são alterados."
      acoes={
        <Link
          href={`/inventario/${id}`}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {aberto ? "Voltar à contagem" : "Ver contagem"}
        </Link>
      }
    >
      {carregando && <Carregando texto="Calculando as diferenças..." />}
      {!carregando && erro && <Alerta tom="erro">{erro}</Alerta>}

      {!carregando && inventario && (
        <div className="space-y-4">
          <Cartao>
            <p className="text-sm font-semibold text-slate-900">
              {inventario.local_codigo} · {inventario.local_caminho}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Etiqueta tom={aberto ? "info" : inventario.status === "concluido" ? "sucesso" : "neutro"}>
                {inventario.status}
              </Etiqueta>
              <Etiqueta>{inventario.total_contados} contados</Etiqueta>
              <Etiqueta tom={naoContados > 0 ? "alerta" : "neutro"}>{naoContados} sem contagem</Etiqueta>
              <Etiqueta tom={linhas.length > 0 ? "alerta" : "sucesso"}>
                {linhas.length} {linhas.length === 1 ? "diferença" : "diferenças"}
              </Etiqueta>
            </div>
            {!aberto && inventario.concluido_em && (
              <p className="mt-2 text-xs text-slate-500">
                {inventario.status === "concluido" ? "Concluído" : "Encerrado"}
                {inventario.concluido_por_nome ? ` por ${inventario.concluido_por_nome}` : ""} em{" "}
                {formatarDataHora(inventario.concluido_em)}
              </p>
            )}
          </Cartao>

          {aberto && naoContados > 0 && (
            <Alerta tom="atencao" titulo="Há itens sem contagem">
              {naoContados} item(ns) não foram contados e ficam como estão. Volte à contagem se quiser
              contá-los antes de concluir.
            </Alerta>
          )}

          {linhas.length === 0 ? (
            <EstadoVazio
              icone={Scale}
              titulo="Sem diferenças para mostrar"
              descricao="Cada variante contada com quantidade diferente do sistema aparece aqui."
            />
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {linhas.map((linha) => (
                <li key={linha.varianteId} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-slate-500">{linha.codigo}</p>
                    <p className="text-sm font-semibold text-slate-900">{linha.nome}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Sistema {formatarNumero(linha.sistema)} → contado {formatarNumero(linha.contado)}
                    </p>
                  </div>
                  <span
                    className={`tabular shrink-0 text-lg font-bold ${
                      linha.diferenca > 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {linha.diferenca > 0 ? "+" : ""}
                    {formatarNumero(linha.diferenca)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {erroDaAcao && <Alerta tom="erro">{erroDaAcao}</Alerta>}

          {operador && aberto && (
            <div className="space-y-3">
              {confirmando && (
                <Alerta tom="atencao" titulo={confirmando === "concluir" ? "Concluir o inventário?" : "Cancelar o inventário?"}>
                  {confirmando === "concluir"
                    ? `Serão gravados ${linhas.length} ajuste(s) no saldo e no histórico. Isso não pode ser desfeito.`
                    : "A contagem é descartada e nenhum saldo é alterado. Um inventário cancelado não volta a abrir."}
                </Alerta>
              )}
              <div className="flex flex-wrap gap-2">
                {confirmando ? (
                  <>
                    <Botao
                      variante={confirmando === "cancelar" ? "perigo" : "primario"}
                      carregando={processando}
                      onClick={() => executar(confirmando)}
                    >
                      {confirmando === "concluir" ? "Sim, concluir" : "Sim, cancelar"}
                    </Botao>
                    <Botao variante="fantasma" disabled={processando} onClick={() => setConfirmando(null)}>
                      Voltar
                    </Botao>
                  </>
                ) : (
                  <>
                    <Botao onClick={() => setConfirmando("concluir")}>Concluir inventário</Botao>
                    <Botao variante="perigo" onClick={() => setConfirmando("cancelar")}>
                      Cancelar inventário
                    </Botao>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Pagina>
  );
}
