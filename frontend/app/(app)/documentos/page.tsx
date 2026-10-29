"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { listarDocumentos } from "@estoque/backend/documentos";
import type { DocumentoSaida, StatusDocumento } from "@estoque/backend/tipos";
import { Pagina } from "@/components/layout/pagina";
import { Abas } from "@/components/ui/abas";
import { Alerta } from "@/components/ui/alerta";
import { Carregando } from "@/components/ui/carregando";
import { CampoDeBusca } from "@/components/ui/campo-de-busca";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Selecao } from "@/components/ui/selecao";
import { formatarDataHora, normalizar } from "@/prototipo/formatos";

const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const ABAS = [
  { valor: "pendente", rotulo: "Pendentes" },
  { valor: "baixado", rotulo: "Baixados" },
];

/** T8.5: documentos de saída pendentes e já baixados. Cada um abre em /leitura/[protocolo]. */
export default function DocumentosPage() {
  const [aba, setAba] = useState<StatusDocumento>("pendente");
  const [documentos, setDocumentos] = useState<DocumentoSaida[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  // Padrão do estoquista: o que já foi validado no GEDOC, ainda não baixado, na última semana.
  const [situacao, setSituacao] = useState<"validados" | "aguardando" | "todos">("validados");
  const [periodo, setPeriodo] = useState<"7" | "30" | "tudo">("7");
  // "Agora" muda só quando a lista é carregada: render puro, e o corte do período não oscila.
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    let cancelado = false;
    listarDocumentos(aba).then((resultado) => {
      if (cancelado) return;
      if (resultado.ok) {
        setAgora(Date.now());
        setDocumentos(resultado.dados);
        setErro(null);
      } else {
        setErro(resultado.erro);
      }
      setCarregando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [aba]);

  function mudarAba(valor: string) {
    setCarregando(true);
    setAba(valor as StatusDocumento);
  }

  const termo = normalizar(busca);
  const limiteDoPeriodo =
    periodo === "tudo" ? 0 : agora - Number(periodo) * MILISSEGUNDOS_POR_DIA;
  const visiveis = documentos.filter((documento) => {
    if (limiteDoPeriodo && new Date(documento.criado_em).getTime() < limiteDoPeriodo) return false;
    if (aba === "pendente") {
      if (situacao === "validados" && !documento.validado_na_origem) return false;
      if (situacao === "aguardando" && documento.validado_na_origem) return false;
    }
    return (
      !termo ||
      [documento.protocolo, documento.cliente_nome ?? "", documento.solicitante_nome ?? ""].some(
        (texto) => normalizar(texto).includes(termo),
      )
    );
  });

  return (
    <Pagina
      sobretitulo="Etapa 8"
      titulo="Documentos"
      descricao="Documentos de saída recebidos do GEDOC, com os itens a dar baixa."
    >
      <div className="space-y-4">
        <Abas abas={ABAS} valor={aba} aoMudar={mudarAba} rotulo="Situação do documento" />
        <CampoDeBusca valor={busca} aoMudar={setBusca} placeholder="Buscar protocolo, cliente ou vendedor" />

        <div className="grid gap-3 sm:grid-cols-2">
          {aba === "pendente" && (
            <Selecao
              rotulo="Situação no GEDOC"
              value={situacao}
              onChange={(evento) => setSituacao(evento.target.value as typeof situacao)}
            >
              <option value="validados">Validados, prontos para baixa</option>
              <option value="aguardando">Aguardando validação</option>
              <option value="todos">Todos os pendentes</option>
            </Selecao>
          )}
          <Selecao
            rotulo="Período"
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value as typeof periodo)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="tudo">Todo o período</option>
          </Selecao>
        </div>
        {!carregando && !erro && (
          <p className="text-sm text-slate-500">
            {visiveis.length} {visiveis.length === 1 ? "documento" : "documentos"}
          </p>
        )}

        {carregando && <Carregando texto="Carregando documentos..." />}
        {!carregando && erro && <Alerta tom="erro">{erro}</Alerta>}
        {!carregando && !erro && visiveis.length === 0 && (
          <EstadoVazio
            icone={FileText}
            titulo={aba === "pendente" ? "Nenhum documento pendente" : "Nenhum documento baixado"}
            descricao="Os documentos chegam do GEDOC quando o orçamento, a amostra ou a produção é emitido."
          />
        )}
        {!carregando && !erro && visiveis.length > 0 && (
          <ul className="space-y-2">
            {visiveis.map((documento) => (
              <li key={documento.id}>
                <Link
                  href={`/leitura/${encodeURIComponent(documento.protocolo)}`}
                  className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-marca-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{documento.protocolo}</p>
                    <p className="truncate text-xs text-slate-500">
                      {documento.cliente_nome ?? "Sem cliente"} · {documento.total_de_itens} item(ns) ·{" "}
                      {formatarDataHora(documento.criado_em)}
                    </p>
                  </div>
                  {documento.tipo_documento && <Etiqueta>{documento.tipo_documento}</Etiqueta>}
                  {documento.status === "pendente" && (
                    <Etiqueta tom={documento.validado_na_origem ? "sucesso" : "alerta"}>
                      {documento.validado_na_origem ? "validado" : "aguardando"}
                    </Etiqueta>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Pagina>
  );
}
