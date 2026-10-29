import type { HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/classes";

interface CartaoProps extends HTMLAttributes<HTMLDivElement> {
  titulo?: string;
  descricao?: string;
  icone?: LucideIcon;
}

/** Bloco branco com borda — a "caixa" padrão para agrupar conteúdo. */
export function Cartao({ titulo, descricao, icone: Icone, className, children, ...props }: CartaoProps) {
  return (
    <section
      className={cn("rounded-lg border border-slate-200 bg-white p-4 sm:p-5", className)}
      {...props}
    >
      {(titulo || descricao) && (
        <header className="mb-4 flex items-start gap-3">
          {Icone && (
            <span className="mt-0.5 shrink-0 text-marca-700">
              <Icone className="size-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            {titulo && <h2 className="text-display-3 text-slate-900">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-sm text-slate-500">{descricao}</p>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
