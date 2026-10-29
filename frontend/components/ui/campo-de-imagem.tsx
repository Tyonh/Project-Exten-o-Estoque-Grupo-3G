"use client";

import { useId, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/classes";

interface CampoDeImagemProps {
  rotulo: string;
  valor?: string | null;
  aoMudar: (valor: string | null) => void;
  dica?: string;
}

/**
 * Envio de imagem. Lê o arquivo no navegador e entrega a imagem como data URL
 * para o formulário, que grava o valor no cadastro. O envio para um bucket do
 * Supabase é a tarefa T3.8 e ainda não foi feito.
 */
export function CampoDeImagem({ rotulo, valor, aoMudar, dica }: CampoDeImagemProps) {
  const id = useId();
  const [erro, setErro] = useState<string | null>(null);

  function selecionar(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("A imagem precisa ter até 2 MB.");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      if (typeof leitor.result === "string") {
        aoMudar(leitor.result);
        setErro(null);
      }
    };
    leitor.onerror = () => setErro("Não foi possível ler a imagem.");
    leitor.readAsDataURL(arquivo);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{rotulo}</p>

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 sm:flex-row sm:items-center">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white">
          {valor ? (
            // A imagem pode ser um data URL do próprio navegador; o next/image
            // não é necessário (e não aceita todos os formatos de data URL).
            // eslint-disable-next-line @next/next/no-img-element
            <img src={valor} alt="Prévia da imagem" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-slate-400" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={id}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ImagePlus className="size-4" aria-hidden />
              {valor ? "Trocar imagem" : "Escolher imagem"}
            </label>
            <input
              id={id}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(evento) => {
                selecionar(evento.target.files?.[0]);
                evento.target.value = "";
              }}
            />
            {valor && (
              <button
                type="button"
                onClick={() => {
                  aoMudar(null);
                  setErro(null);
                }}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold",
                  "text-red-600 transition-colors hover:bg-red-50",
                )}
              >
                <Trash2 className="size-4" aria-hidden />
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {dica ?? "JPG, PNG ou WebP, até 2 MB. A imagem fica salva no cadastro."}
          </p>
          {erro && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {erro}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
