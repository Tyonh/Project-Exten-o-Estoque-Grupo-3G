import type { ReactNode } from "react";
import { cn } from "@/lib/classes";

interface PaginaProps {
  titulo: string;
  sobretitulo?: string;
  descricao?: string;
  acoes?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Moldura do conteúdo de uma tela: título, descrição opcional, espaço para
 * ações (botões) e a largura padrão. Pensada primeiro para 360 px e ampliada
 * em telas maiores (o menu lateral ocupa 15rem no computador).
 */
export function Pagina({ titulo, sobretitulo, descricao, acoes, className, children }: PaginaProps) {
  return (
    <main className={cn("mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8", className)}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
        <div className="min-w-0">
          {sobretitulo && (
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-marca-700">
              {sobretitulo}
            </p>
          )}
          <h1 className="text-display-2 text-slate-900">{titulo}</h1>
          {descricao && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </header>
      {children}
    </main>
  );
}
