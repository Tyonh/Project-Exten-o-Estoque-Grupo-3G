import Link from "next/link";
import { ArrowLeft, CheckCircle2, type LucideIcon } from "lucide-react";
import { Pagina } from "@/components/layout/pagina";
import { Cartao } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";

interface EmConstrucaoProps {
  titulo: string;
  descricao: string;
  etapa: string;
  icone: LucideIcon;
  itens: string[];
}

/** Moldura das telas que já estão no menu, mas ainda não foram construídas. */
export function EmConstrucao({ titulo, descricao, etapa, icone: Icone, itens }: EmConstrucaoProps) {
  return (
    <Pagina titulo={titulo} descricao={descricao}>
      <Cartao>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-marca-50 text-marca-700">
            <Icone className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Etiqueta tom="alerta">{etapa}</Etiqueta>
              <Etiqueta tom="neutro">Ainda não construída</Etiqueta>
            </div>
            <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-slate-900">
              Esta tela entra nas próximas etapas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              O caminho já está no menu para o time ver o sistema completo. O sistema já cobre o
              catálogo, os locais, as movimentações e a consulta.
            </p>

            <ul className="mt-4 space-y-2">
              {itens.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-marca-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar ao início
            </Link>
          </div>
        </div>
      </Cartao>
    </Pagina>
  );
}
