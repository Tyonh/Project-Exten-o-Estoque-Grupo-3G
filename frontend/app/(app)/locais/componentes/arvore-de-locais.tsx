"use client";

import { useState } from "react";
import { Boxes, ChevronRight, MapPin, Package, Warehouse } from "lucide-react";
import { cn } from "@/lib/classes";
import { formatarNumero, normalizar } from "@/prototipo/formatos";
import { usePrototipo } from "@/prototipo/contexto";
import type { Local } from "@/prototipo/tipos";

function IconeDoLocal({ tipo, className }: { tipo: string; className?: string }) {
  const chave = normalizar(tipo);
  if (chave.includes("galpao") || chave.includes("galp")) {
    return <Warehouse className={className} aria-hidden />;
  }
  if (chave.includes("setor")) {
    return <Boxes className={className} aria-hidden />;
  }
  if (chave.includes("modulo") || chave.includes("prateleira")) {
    return <Package className={className} aria-hidden />;
  }
  return <MapPin className={className} aria-hidden />;
}

interface NoDaArvoreProps {
  local: Local;
  selecionadoId: string | null;
  aoSelecionar: (localId: string) => void;
  abertos: Set<string>;
  aoAlternar: (localId: string) => void;
}

function NoDaArvore({
  local,
  selecionadoId,
  aoSelecionar,
  abertos,
  aoAlternar,
}: NoDaArvoreProps) {
  const { filhosDoLocal, totalNoLocal } = usePrototipo();
  const filhos = filhosDoLocal(local.id);
  const aberto = abertos.has(local.id);
  const selecionado = selecionadoId === local.id;
  const total = totalNoLocal(local.id, true);

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-md pr-1 transition-colors",
          selecionado ? "bg-marca-50" : "hover:bg-slate-50",
        )}
      >
        {filhos.length > 0 ? (
          <button
            type="button"
            onClick={() => aoAlternar(local.id)}
            aria-expanded={aberto}
            aria-label={aberto ? `Recolher ${local.nome}` : `Expandir ${local.nome}`}
            className="grid size-6 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronRight
              className={cn("size-4 transition-transform", aberto && "rotate-90")}
              aria-hidden
            />
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => aoSelecionar(local.id)}
          aria-current={selecionado ? "true" : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        >
          <IconeDoLocal
            tipo={local.tipo}
            className={cn("size-4 shrink-0", local.ativo ? "text-marca-600" : "text-slate-400")}
          />
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-sm",
                selecionado ? "font-semibold text-marca-800" : "font-medium text-slate-700",
                !local.ativo && "text-slate-400",
              )}
            >
              {local.nome}
            </span>
            <span className="block truncate text-[0.6875rem] text-slate-400">
              {local.codigo} · {formatarNumero(total)} un.
            </span>
          </span>
          {!local.ativo && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-slate-300"
              title="Local inativo"
              aria-label="Local inativo"
            />
          )}
        </button>
      </div>

      {filhos.length > 0 && aberto && (
        <ul className="ml-3 border-l border-slate-200 pl-1">
          {filhos.map((filho) => (
            <NoDaArvore
              key={filho.id}
              local={filho}
              selecionadoId={selecionadoId}
              aoSelecionar={aoSelecionar}
              abertos={abertos}
              aoAlternar={aoAlternar}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface ArvoreDeLocaisProps {
  selecionadoId: string | null;
  aoSelecionar: (localId: string) => void;
}

export function ArvoreDeLocais({ selecionadoId, aoSelecionar }: ArvoreDeLocaisProps) {
  const { dados, filhosDoLocal } = usePrototipo();
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(dados.locais.map((local) => local.id)),
  );
  const raizes = filhosDoLocal(null);

  function alternar(localId: string) {
    setAbertos((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(localId)) proximos.delete(localId);
      else proximos.add(localId);
      return proximos;
    });
  }

  if (raizes.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-slate-500">
        Nenhum local cadastrado. Crie o primeiro galpão.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {raizes.map((local) => (
        <NoDaArvore
          key={local.id}
          local={local}
          selecionadoId={selecionadoId}
          aoSelecionar={aoSelecionar}
          abertos={abertos}
          aoAlternar={alternar}
        />
      ))}
    </ul>
  );
}
