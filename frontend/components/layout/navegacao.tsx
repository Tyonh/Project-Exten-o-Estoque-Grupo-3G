"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, type LucideIcon } from "lucide-react";
import { podeConsultar, type Cargo } from "@estoque/backend/cargos";
import { cn } from "@/lib/classes";

interface ItemMenu {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  visivelPara: (cargo: Cargo) => boolean;
}

// Para cada tela nova, acrescente um item aqui. Use os grupos de
// `@estoque/backend/cargos` para decidir quem enxerga:
//   podeConsultar  → estoquista, gerente, gerente de estoque, admin
//   podeOperar     → gerente de estoque, admin
//   eAdmin         → admin
// Exemplo (quando a tela existir):
//   { href: "/consulta", rotulo: "Consulta", icone: Search, visivelPara: podeConsultar },
const ITENS: ItemMenu[] = [
  { href: "/", rotulo: "Início", icone: LayoutDashboard, visivelPara: podeConsultar },
];

/**
 * Menu principal. No celular fica em uma faixa rolável; o item da tela atual
 * é destacado. O menu é conveniência visual — a permissão real é do backend.
 */
export function Navegacao({ cargo }: { cargo: Cargo }) {
  const caminho = usePathname();
  const itens = ITENS.filter((item) => item.visivelPara(cargo));

  if (itens.length === 0) return null;

  return (
    <nav aria-label="Menu principal" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-2 py-1.5 sm:px-4">
        {itens.map(({ href, rotulo, icone: Icone }) => {
          const ativo = href === "/" ? caminho === "/" : caminho.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex min-w-16 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                ativo
                  ? "bg-marca-50 text-marca-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              <Icone className="size-5" aria-hidden />
              {rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
