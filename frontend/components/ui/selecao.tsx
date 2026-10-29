"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/classes";

interface SelecaoProps extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo: string;
  dica?: string;
  erro?: string;
}

/** Campo de seleção com o mesmo desenho do Campo de formulário. */
export function Selecao({ rotulo, dica, erro, id, className, children, ...props }: SelecaoProps) {
  const gerado = useId();
  const campoId = id ?? gerado;

  return (
    <div className="space-y-1.5">
      <label htmlFor={campoId} className="block text-[0.8125rem] font-semibold text-slate-700">
        {rotulo}
      </label>
      <select
        id={campoId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${campoId}-erro` : dica ? `${campoId}-dica` : undefined}
        className={cn(
          "block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900",
          "focus:border-marca-500 focus:ring-2 focus:ring-marca-100",
          erro && "border-red-400 focus:border-red-500",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {dica && !erro && (
        <p id={`${campoId}-dica`} className="text-xs text-slate-500">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${campoId}-erro`} role="alert" className="text-xs font-medium text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
