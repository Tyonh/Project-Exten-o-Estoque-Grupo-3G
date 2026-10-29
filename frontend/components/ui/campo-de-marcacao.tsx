"use client";

import { useId } from "react";
import { cn } from "@/lib/classes";

interface CampoDeMarcacaoProps {
  rotulo: string;
  descricao?: string;
  checked: boolean;
  onChange: (marcado: boolean) => void;
  disabled?: boolean;
}

/** Caixa de seleção com rótulo e explicação, usada em opções de cadastro. */
export function CampoDeMarcacao({
  rotulo,
  descricao,
  checked,
  onChange,
  disabled = false,
}: CampoDeMarcacaoProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
        checked ? "border-marca-300 bg-marca-50/60" : "border-slate-200 bg-white",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(evento) => onChange(evento.target.checked)}
        disabled={disabled}
        className="mt-0.5 size-4 shrink-0 accent-marca-600"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{rotulo}</span>
        {descricao && <span className="mt-0.5 block text-xs text-slate-500">{descricao}</span>}
      </span>
    </label>
  );
}
