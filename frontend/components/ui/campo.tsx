"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/classes";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  dica?: string;
  erro?: string;
}

/**
 * Campo de formulário com rótulo, dica opcional e mensagem de erro acessível
 * (o erro é anunciado por leitores de tela).
 */
export function Campo({ rotulo, dica, erro, id, className, ...props }: CampoProps) {
  const gerado = useId();
  const campoId = id ?? gerado;

  return (
    <div className="space-y-1.5">
      <label htmlFor={campoId} className="block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      <input
        id={campoId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${campoId}-erro` : dica ? `${campoId}-dica` : undefined}
        className={cn(
          "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900",
          "placeholder:text-slate-400 focus:border-marca-500",
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
