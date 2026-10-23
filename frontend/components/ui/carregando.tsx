import { LoaderCircle } from "lucide-react";

/** Indicador de carregamento centralizado, para usar enquanto os dados chegam. */
export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      {texto}
    </div>
  );
}
