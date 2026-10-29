import { cn } from "@/lib/classes";
import { iniciais } from "@/prototipo/formatos";

interface RetratoDoProdutoProps {
  nome: string;
  src?: string | null;
  className?: string;
}

/**
 * Miniatura de família ou variante. Sem imagem cadastrada, mostra as iniciais
 * do nome num fundo suave quando o cadastro não tem imagem.
 */
export function RetratoDoProduto({ nome, src, className }: RetratoDoProdutoProps) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200",
        "bg-slate-50",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Imagem de ${nome}`} className="size-full object-cover" />
      ) : (
        <span
          className="font-mono text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500"
          aria-hidden
        >
          {iniciais(nome)}
        </span>
      )}
    </div>
  );
}
