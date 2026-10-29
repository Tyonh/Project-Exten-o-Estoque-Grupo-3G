"use client";

import { cn } from "@/lib/classes";

export interface Aba {
  valor: string;
  rotulo: string;
  contagem?: number;
}

interface AbasProps {
  abas: Aba[];
  valor: string;
  aoMudar: (valor: string) => void;
  rotulo?: string;
  className?: string;
}

/** Abas de navegação interna, com rolagem horizontal no celular. */
export function Abas({ abas, valor, aoMudar, rotulo = "Seções", className }: AbasProps) {
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1",
        className,
      )}
    >
      {abas.map((aba) => {
        const ativa = aba.valor === valor;
        return (
          <button
            key={aba.valor}
            type="button"
            role="tab"
            aria-selected={ativa}
            onClick={() => aoMudar(aba.valor)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
              ativa
                ? "bg-marca-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {aba.rotulo}
            {aba.contagem !== undefined && (
              <span
                className={cn(
                  "rounded-[3px] px-1.5 py-0.5 text-[0.625rem] font-bold",
                  ativa ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {aba.contagem}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
