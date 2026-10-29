import { FileText } from "lucide-react";
import { EmConstrucao } from "@/components/layout/em-construcao";

export default function DocumentosPage() {
  return (
    <EmConstrucao
      titulo="Documentos"
      descricao="Documentos de saída recebidos de outros sistemas, com os itens a dar baixa."
      etapa="Etapa 8"
      icone={FileText}
      itens={[
        "Listar documentos pendentes e já baixados.",
        "Abrir um documento e conferir os itens e as quantidades.",
        "Dar baixa uma única vez, escolhendo de qual local sai cada item.",
      ]}
    />
  );
}
