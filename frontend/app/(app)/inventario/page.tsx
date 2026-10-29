import { ClipboardCheck } from "lucide-react";
import { EmConstrucao } from "@/components/layout/em-construcao";

export default function InventarioPage() {
  return (
    <EmConstrucao
      titulo="Inventário"
      descricao="A contagem física de um local, comparada com o saldo do sistema."
      etapa="Etapa 7"
      icone={ClipboardCheck}
      itens={[
        "Abrir um inventário por local e ver o saldo do momento.",
        "Contar cada variante e registrar as diferenças.",
        "Concluir o inventário gerando os ajustes necessários.",
      ]}
    />
  );
}
