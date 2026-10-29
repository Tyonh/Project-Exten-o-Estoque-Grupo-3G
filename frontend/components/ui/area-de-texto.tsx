"use client";

import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/classes";

interface AreaDeTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo: string;
  dica?: string;
  erro?: string;
}

/** Área de texto para justificativas e observações. */
export function AreaDeTexto({
  rotulo,
  dica,
  erro,
  id,
  className,
  rows = 3,
  ...props
}: AreaDeTextoProps) {
  const gerado = useId();
  const campoId = id ?? gerado;

  return (
    <div className="space-y-1.5">
      <label htmlFor={campoId} className="block text-[0.8125rem] font-semibold text-slate-700">
        {rotulo}
      </label>
      <textarea
        id={campoId}
        rows={rows}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${campoId}-erro` : dica ? `${campoId}-dica` : undefined}
        className={cn(
          "block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900",
          "placeholder:text-slate-400 focus:border-marca-500 focus:ring-2 focus:ring-marca-100",
          erro && "border-red-400 focus:border-red-500",
          className,
        )}
        {...props}
      />
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
