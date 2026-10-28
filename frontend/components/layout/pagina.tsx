import type { ReactNode } from "react";
import { cn } from "@/lib/classes";

interface PaginaProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Moldura do conteúdo de uma tela: título, descrição opcional, espaço para
 * ações (botões) e a largura padrão. Pensada primeiro para 360 px e ampliada
 * em telas maiores.
 */
export function Pagina({ titulo, descricao, acoes, className, children }: PaginaProps) {
  return (
    <main className={cn("mx-auto w-full max-w-3xl px-4 py-6 sm:px-6", className)}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-display-2 text-slate-900">{titulo}</h1>
          {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </header>
      {children}
    </main>
  );
}
