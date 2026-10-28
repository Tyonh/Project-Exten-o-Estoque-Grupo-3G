import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/classes";

type Variante = "primario" | "secundario" | "perigo" | "fantasma";
type Tamanho = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-marca-600 text-white hover:bg-marca-700 active:bg-marca-800",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  perigo: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  fantasma: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  icone?: LucideIcon;
}

/**
 * Botão padrão do sistema. Enquanto `carregando` for verdadeiro, mostra um
 * indicador de progresso e bloqueia novos cliques.
 */
export function Botao({
  variante = "primario",
  tamanho = "md",
  carregando = false,
  icone: Icone,
  className,
  children,
  disabled,
  ...props
}: BotaoProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        className,
      )}
      disabled={disabled || carregando}
      {...props}
    >
      {carregando ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : Icone ? (
        <Icone className="size-4" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}
