import type { HTMLAttributes } from "react";
import { cn } from "@/lib/classes";

type Tom = "neutro" | "info" | "sucesso" | "alerta" | "perigo";

const TONS: Record<Tom, string> = {
  neutro: "border-slate-200 bg-slate-50 text-slate-600",
  info: "border-marca-200 bg-marca-50 text-marca-800",
  sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
  alerta: "border-amber-200 bg-amber-50 text-amber-800",
  perigo: "border-red-200 bg-red-50 text-red-700",
};

interface EtiquetaProps extends HTMLAttributes<HTMLSpanElement> {
  tom?: Tom;
}

/** Selo curto (cargo, status, contagem) para usar em listas e cabeçalhos. */
export function Etiqueta({ tom = "neutro", className, ...props }: EtiquetaProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em]",
        TONS[tom],
        className,
      )}
      {...props}
    />
  );
}
