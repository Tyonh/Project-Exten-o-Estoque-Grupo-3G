"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { AguardandoBackend } from "@/components/layout/aguardando-backend";
import { Pagina } from "@/components/layout/pagina";
import { Abas } from "@/components/ui/abas";
import { EstadoVazio } from "@/components/ui/estado-vazio";

const ABAS = [
  { valor: "pendentes", rotulo: "Pendentes", contagem: 0 },
  { valor: "baixados", rotulo: "Baixados", contagem: 0 },
];

/** T8.5: documentos de saída pendentes e já baixados. Cada um abre em /leitura/[protocolo]. */
export default function DocumentosPage() {
  const [aba, setAba] = useState("pendentes");

  return (
    <Pagina
      sobretitulo="Etapa 8"
      titulo="Documentos"
      descricao="Documentos de saída recebidos de outros sistemas, com os itens a dar baixa."
    >
      <div className="space-y-4">
        <AguardandoBackend funcoes={["listarDocumentos"]} />
        <Abas abas={ABAS} valor={aba} aoMudar={setAba} rotulo="Situação do documento" />
        <EstadoVazio
          icone={FileText}
          titulo={aba === "pendentes" ? "Nenhum documento pendente" : "Nenhum documento baixado"}
          descricao="Os documentos chegam de outro sistema pela rota de recebimento."
        />
      </div>
    </Pagina>
  );
}
