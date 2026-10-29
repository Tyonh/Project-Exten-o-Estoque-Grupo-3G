import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EstadoVazioProps {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

/** Aviso amigável para listas sem resultado. */
export function EstadoVazio({ icone: Icone, titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
        <Icone className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-display text-lg font-bold tracking-tight text-slate-900">{titulo}</p>
      {descricao && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{descricao}</p>}
      {acao && <div className="mt-5 flex justify-center">{acao}</div>}
    </div>
  );
}
