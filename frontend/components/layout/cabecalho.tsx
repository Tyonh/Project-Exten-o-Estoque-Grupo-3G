"use client";

import { Boxes, LogOut } from "lucide-react";
import type { Cargo } from "@estoque/backend/cargos";
import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { ROTULO_CARGO } from "@/lib/rotulos";

interface CabecalhoProps {
  nome: string;
  cargo: Cargo;
  aoSair: () => void;
  saindo?: boolean;
}

/**
 * Cabeçalho fixo das telas autenticadas. Mostra quem está logado e o cargo,
 * com o botão de sair.
 */
export function Cabecalho({ nome, cargo, aoSair, saindo = false }: CabecalhoProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-marca-600 text-white">
          <Boxes className="size-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold tracking-tight text-slate-900">
            Estoque 3G
          </p>
          <p className="truncate text-xs text-slate-500">{nome}</p>
        </div>

        <Etiqueta tom="info" className="hidden sm:inline-flex">
          {ROTULO_CARGO[cargo]}
        </Etiqueta>

        <Botao
          variante="fantasma"
          tamanho="sm"
          icone={LogOut}
          carregando={saindo}
          onClick={aoSair}
          aria-label="Sair"
        >
          <span className="hidden sm:inline">Sair</span>
        </Botao>
      </div>
    </header>
  );
}
