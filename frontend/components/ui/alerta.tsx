import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/classes";

type Tom = "erro" | "sucesso" | "info" | "atencao";

const ESTILOS: Record<Tom, string> = {
  erro: "border-red-200 bg-red-50 text-red-800",
  sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-marca-200 bg-marca-50 text-marca-800",
  atencao: "border-amber-200 bg-amber-50 text-amber-800",
};

const ICONES: Record<Tom, LucideIcon> = {
  erro: CircleAlert,
  sucesso: CircleCheck,
  info: Info,
  atencao: TriangleAlert,
};

interface AlertaProps {
  tom?: Tom;
  titulo?: string;
  role?: "alert" | "status";
  className?: string;
  children: ReactNode;
}

/**
 * Mensagem de retorno para o usuário. Erros usam role="alert" (anunciados
 * imediatamente); os demais usam role="status".
 */
export function Alerta({ tom = "info", titulo, role, className, children }: AlertaProps) {
  const Icone = ICONES[tom];

  return (
    <div
      role={role ?? (tom === "erro" ? "alert" : "status")}
      className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm", ESTILOS[tom], className)}
    >
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
