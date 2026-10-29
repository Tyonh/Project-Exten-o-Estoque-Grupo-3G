"use client";

import { ClipboardCheck, Plus } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { AguardandoBackend } from "@/components/layout/aguardando-backend";
import { Pagina } from "@/components/layout/pagina";
import { Botao } from "@/components/ui/botao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { usePrototipo } from "@/prototipo/contexto";

/** T7.1: lista de inventários e abertura de um novo por local. */
export default function InventarioPage() {
  const { cargoVisualizado } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  return (
    <Pagina
      sobretitulo="Etapa 7"
      titulo="Inventário"
      descricao="A contagem física de um local, comparada com o saldo do sistema."
      acoes={
        operador && (
          <Botao icone={Plus} disabled>
            Abrir inventário
          </Botao>
        )
      }
    >
      <div className="space-y-4">
        <AguardandoBackend funcoes={["abrirInventario", "listarInventarios"]} />
        <EstadoVazio
          icone={ClipboardCheck}
          titulo="Nenhum inventário aberto"
          descricao="Escolha um local para abrir um inventário. Só pode haver um aberto por local."
        />
      </div>
    </Pagina>
  );
}
