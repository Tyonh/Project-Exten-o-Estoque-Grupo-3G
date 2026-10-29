"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/classes";

interface CampoDeBuscaProps {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  className?: string;
}

/** Campo de busca com ícone e botão para limpar. */
export function CampoDeBusca({
  valor,
  aoMudar,
  placeholder = "Buscar...",
  className,
}: CampoDeBuscaProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "block h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-10 text-sm text-slate-900",
          "placeholder:text-slate-400 focus:border-marca-500 focus:ring-2 focus:ring-marca-100",
        )}
      />
      {valor && (
        <button
          type="button"
          onClick={() => aoMudar("")}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
