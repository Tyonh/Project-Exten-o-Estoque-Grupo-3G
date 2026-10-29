"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, CircleCheck, PackageCheck, TriangleAlert } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { buscarDocumento } from "@estoque/backend/documentos";
import type { DocumentoDetalhe, ItemDoDocumento, Retirada } from "@estoque/backend/tipos";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Carregando } from "@/components/ui/carregando";
import { Cartao } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { usePrototipo } from "@/prototipo/contexto";
import { formatarDataHora, formatarNumero } from "@/prototipo/formatos";

type Quantidades = Record<string, number>;

const chave = (varianteId: string, localId: string): string => `${varianteId}|${localId}`;

function quantidadesIniciais(documento: DocumentoDetalhe): Quantidades {
  const inicial: Quantidades = {};
  for (const item of documento.itens) {
    for (const retirada of item.sugestao) {
      inicial[chave(retirada.variante_id, retirada.local_id)] = retirada.quantidade;
    }
  }
  return inicial;
}

function totalEscolhido(item: ItemDoDocumento, quantidades: Quantidades): number {
  return item.locais.reduce(
    (soma, local) => soma + (quantidades[chave(item.variante_id, local.local_id)] ?? 0),
    0,
  );
}

function retiradasEscolhidas(documento: DocumentoDetalhe, quantidades: Quantidades): Retirada[] {
  return documento.itens.flatMap((item) =>
    item.locais
      .map((local) => ({
        variante_id: item.variante_id,
        local_id: local.local_id,
        quantidade: quantidades[chave(item.variante_id, local.local_id)] ?? 0,
      }))
      .filter((retirada) => retirada.quantidade > 0),
  );
}

/** T8.2 a T8.4: documento aberto pelo QR code, com os locais de cada item e a baixa. */
export default function LeituraPage({ params }: { params: Promise<{ protocolo: string }> }) {
  const { protocolo } = use(params);
  const protocoloLimpo = decodeURIComponent(protocolo);
  const { cargoVisualizado, confirmarSaidaDocumento } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  const [documento, setDocumento] = useState<DocumentoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);
  const [quantidades, setQuantidades] = useState<Quantidades>({});
  const [baixando, setBaixando] = useState(false);
  const [erroDaBaixa, setErroDaBaixa] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarDocumento(protocoloLimpo).then((resultado) => {
      if (cancelado) return;
      if (resultado.ok) {
        setDocumento(resultado.dados);
        setQuantidades(quantidadesIniciais(resultado.dados));
        setErro(null);
      } else {
        setErro(resultado.erro);
      }
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [protocoloLimpo, versao]);

  const itensCompletos =
    documento?.itens.every((item) => totalEscolhido(item, quantidades) === item.quantidade) ?? false;
  const podeBaixar =
    operador && documento?.status === "pendente" && documento.validado_na_origem && itensCompletos;

  async function confirmar() {
    if (!documento) return;
    setBaixando(true);
    setErroDaBaixa(null);
    const resultado = await confirmarSaidaDocumento(
      documento.id,
      retiradasEscolhidas(documento, quantidades),
    );
    setBaixando(false);
    if (resultado.ok) {
      setCarregando(true);
      setVersao((atual) => atual + 1);
    } else {
      setErroDaBaixa(resultado.erro);
    }
  }

  return (
    <Pagina
      sobretitulo="Documento de saída"
      titulo={`Protocolo ${protocoloLimpo}`}
      descricao="Confira os itens, escolha de qual local sai cada um e confirme a baixa."
      acoes={
        <Link
          href="/documentos"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Documentos
        </Link>
      }
    >
      {carregando && <Carregando texto="Abrindo o documento..." />}
      {!carregando && erro && <Alerta tom="erro">{erro}</Alerta>}
      {!carregando && documento && (
        <div className="space-y-4 pb-24 sm:pb-0">
          <CabecalhoDoDocumento documento={documento} />

          {documento.status === "pendente" && !documento.validado_na_origem && (
            <Alerta tom="atencao" titulo="Aguardando validação no GEDOC">
              A baixa só é liberada depois que o documento for validado no GEDOC.
            </Alerta>
          )}
          {documento.status === "baixado" && (
            <Alerta tom="sucesso" titulo="Documento já baixado">
              Baixado{documento.baixado_por_nome ? ` por ${documento.baixado_por_nome}` : ""}
              {documento.baixado_em ? ` em ${formatarDataHora(documento.baixado_em)}` : ""}. Não pode
              ser baixado de novo.
            </Alerta>
          )}
          {documento.status === "cancelado" && (
            <Alerta tom="erro">Este documento foi cancelado.</Alerta>
          )}

          {documento.itens.map((item) => (
            <ItemDaLeitura
              key={item.variante_id}
              item={item}
              quantidades={quantidades}
              editavel={operador && documento.status === "pendente"}
              aoMudar={(localId, valor) =>
                setQuantidades((atual) => ({ ...atual, [chave(item.variante_id, localId)]: valor }))
              }
            />
          ))}

          {erroDaBaixa && <Alerta tom="erro">{erroDaBaixa}</Alerta>}

          {documento.status === "pendente" && (
            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white p-3 sm:static sm:border-0 sm:bg-transparent sm:p-0">
              {operador ? (
                <Botao
                  tamanho="lg"
                  icone={PackageCheck}
                  className="w-full sm:w-auto"
                  disabled={!podeBaixar}
                  carregando={baixando}
                  onClick={confirmar}
                >
                  Confirmar baixa
                </Botao>
              ) : (
                <p className="text-sm text-slate-500">
                  Só o gerente de estoque e o administrador confirmam a baixa.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Pagina>
  );
}

function CabecalhoDoDocumento({ documento }: { documento: DocumentoDetalhe }) {
  const tom =
    documento.status === "baixado" ? "sucesso" : documento.status === "cancelado" ? "perigo" : "info";
  return (
    <Cartao>
      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta tom={tom}>{documento.status}</Etiqueta>
        {documento.tipo_documento && <Etiqueta>{documento.tipo_documento}</Etiqueta>}
        <Etiqueta tom={documento.validado_na_origem ? "sucesso" : "alerta"}>
          {documento.validado_na_origem ? "validado no GEDOC" : "não validado"}
        </Etiqueta>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Cliente</dt>
          <dd className="font-semibold text-slate-900">{documento.cliente_nome ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Vendedor / solicitante</dt>
          <dd className="font-semibold text-slate-900">{documento.solicitante_nome ?? "—"}</dd>
        </div>
      </dl>
    </Cartao>
  );
}

interface ItemDaLeituraProps {
  item: ItemDoDocumento;
  quantidades: Quantidades;
  editavel: boolean;
  aoMudar: (localId: string, valor: number) => void;
}

function ItemDaLeitura({ item, quantidades, editavel, aoMudar }: ItemDaLeituraProps) {
  const escolhido = totalEscolhido(item, quantidades);
  const completo = escolhido === item.quantidade;

  return (
    <Cartao>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{item.codigo}</p>
          <p className="font-semibold text-slate-900">{item.nome}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {[item.familia, item.marca].filter(Boolean).join(" · ")}
          </p>
        </div>
        <p className="text-right text-sm text-slate-500">
          Pedido
          <span className="block text-xl font-bold text-slate-900">
            {formatarNumero(item.quantidade)}
          </span>
        </p>
      </div>

      {item.falta > 0 && (
        <Alerta tom="erro" className="mt-3">
          <TriangleAlert className="mr-1 inline size-4" aria-hidden />
          Faltam {formatarNumero(item.falta)} unidade(s) no estoque para este item. Nada será baixado
          enquanto faltar saldo.
        </Alerta>
      )}

      {item.locais.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
          {item.locais.map((local) => {
            const valor = quantidades[chave(item.variante_id, local.local_id)] ?? 0;
            return (
              <li key={local.local_id} className="flex items-center justify-between gap-3 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{local.codigo}</p>
                  <p className="truncate text-xs text-slate-500">
                    {local.caminho} · saldo {formatarNumero(local.quantidade)}
                  </p>
                </div>
                {editavel ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={local.quantidade}
                    value={valor}
                    aria-label={`Quantidade a retirar de ${local.codigo}`}
                    onChange={(evento) => {
                      const numero = Math.floor(Number(evento.target.value));
                      aoMudar(
                        local.local_id,
                        Number.isFinite(numero) ? Math.min(Math.max(numero, 0), local.quantidade) : 0,
                      );
                    }}
                    className="h-10 w-20 rounded-md border border-slate-300 px-2 text-right text-sm"
                  />
                ) : (
                  <span className="text-sm font-semibold text-slate-700">{formatarNumero(valor)}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editavel && item.locais.length > 0 && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
            completo ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {completo && <CircleCheck className="size-3.5" aria-hidden />}
          Retirando {formatarNumero(escolhido)} de {formatarNumero(item.quantidade)}
        </p>
      )}
    </Cartao>
  );
}
