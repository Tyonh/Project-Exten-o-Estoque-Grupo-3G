import type { HTMLAttributes } from "react";
import { cn } from "@/lib/classes";

type Tom = "neutro" | "info" | "sucesso" | "alerta" | "perigo";

const TONS: Record<Tom, string> = {
  neutro: "bg-slate-100 text-slate-700",
  info: "bg-marca-50 text-marca-700",
  sucesso: "bg-emerald-50 text-emerald-700",
  alerta: "bg-amber-50 text-amber-700",
  perigo: "bg-red-50 text-red-700",
};

interface EtiquetaProps extends HTMLAttributes<HTMLSpanElement> {
  tom?: Tom;
}

/** Selo curto (cargo, status, contagem) para usar em listas e cabeçalhos. */
export function Etiqueta({ tom = "neutro", className, ...props }: EtiquetaProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide",
        TONS[tom],
        className,
      )}
      {...props}
    />
  );
}
