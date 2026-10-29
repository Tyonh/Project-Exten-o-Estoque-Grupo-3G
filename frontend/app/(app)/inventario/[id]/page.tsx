"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, ListChecks, Plus } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { AguardandoBackend } from "@/components/layout/aguardando-backend";
import { Pagina } from "@/components/layout/pagina";
import { Botao } from "@/components/ui/botao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { usePrototipo } from "@/prototipo/contexto";

/** T7.2 e T7.3: contagem dos itens de um local, pensada para o celular. */
export default function ContagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { cargoVisualizado } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  return (
    <Pagina
      sobretitulo="Inventário"
      titulo="Contagem"
      descricao="Informe a quantidade contada de cada variante do local."
      acoes={
        <Link
          href="/inventario"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Inventários
        </Link>
      }
    >
      <div className="space-y-4">
        <AguardandoBackend funcoes={["listarItensDoInventario", "gravarContagem", "incluirItem"]} />
        <EstadoVazio
          icone={ListChecks}
          titulo="Itens do inventário"
          descricao="Os itens do local entram aqui, com o saldo do momento e o campo de contagem."
          acao={
            operador && (
              <div className="flex flex-wrap justify-center gap-2">
                <Botao variante="secundario" icone={Plus} disabled>
                  Incluir item encontrado
                </Botao>
                <Link
                  href={`/inventario/${id}/resumo`}
                  className="inline-flex h-11 items-center rounded-md bg-marca-600 px-4 text-sm font-semibold text-white hover:bg-marca-700"
                >
                  Ver resumo
                </Link>
              </div>
            )
          }
        />
      </div>
    </Pagina>
  );
}
