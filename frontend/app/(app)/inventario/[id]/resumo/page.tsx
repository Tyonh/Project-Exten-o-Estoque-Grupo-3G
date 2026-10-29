"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Scale } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { AguardandoBackend } from "@/components/layout/aguardando-backend";
import { Pagina } from "@/components/layout/pagina";
import { Botao } from "@/components/ui/botao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { usePrototipo } from "@/prototipo/contexto";

/** T7.4 e T7.5: diferenças entre a contagem e o sistema, antes de concluir ou cancelar. */
export default function ResumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { cargoVisualizado } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  return (
    <Pagina
      sobretitulo="Inventário"
      titulo="Resumo das diferenças"
      descricao="Confira o que será ajustado. Itens não contados não são alterados."
      acoes={
        <Link
          href={`/inventario/${id}`}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar à contagem
        </Link>
      }
    >
      <div className="space-y-4">
        <AguardandoBackend funcoes={["resumirInventario", "concluirInventario", "cancelarInventario"]} />
        <EstadoVazio
          icone={Scale}
          titulo="Sem diferenças para mostrar"
          descricao="Cada variante contada com quantidade diferente do sistema aparece aqui."
        />
        {operador && (
          <div className="flex flex-wrap gap-2">
            <Botao disabled>Concluir inventário</Botao>
            <Botao variante="perigo" disabled>
              Cancelar inventário
            </Botao>
          </div>
        )}
      </div>
    </Pagina>
  );
}
