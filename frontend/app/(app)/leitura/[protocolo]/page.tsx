"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, QrCode } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { AguardandoBackend } from "@/components/layout/aguardando-backend";
import { Pagina } from "@/components/layout/pagina";
import { Botao } from "@/components/ui/botao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { usePrototipo } from "@/prototipo/contexto";

/** T8.2 a T8.4: documento aberto pelo QR code, com os locais de cada item e a baixa. */
export default function LeituraPage({ params }: { params: Promise<{ protocolo: string }> }) {
  const { protocolo } = use(params);
  const { cargoVisualizado } = usePrototipo();
  const operador = podeOperar(cargoVisualizado);

  return (
    <Pagina
      sobretitulo="Documento de saída"
      titulo={`Protocolo ${decodeURIComponent(protocolo)}`}
      descricao="Confira os itens, escolha de qual local sai cada um e confirme a baixa."
      acoes={
        <Link
          href="/documentos"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Documentos
        </Link>
      }
    >
      <div className="space-y-4">
        <AguardandoBackend funcoes={["buscarDocumento", "confirmarSaidaDocumento"]} />
        <EstadoVazio
          icone={QrCode}
          titulo="Itens do documento"
          descricao="Cada item mostra os locais com saldo e sugere de onde tirar. Um item pode sair de mais de um local."
        />
        {operador && <Botao disabled>Confirmar baixa</Botao>}
      </div>
    </Pagina>
  );
}
