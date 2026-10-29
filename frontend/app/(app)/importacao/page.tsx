"use client";

import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { EmConstrucao } from "@/components/layout/em-construcao";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { usePrototipo } from "@/prototipo/contexto";

export default function ImportacaoPage() {
  const { cargoVisualizado } = usePrototipo();

  if (!podeOperar(cargoVisualizado)) {
    return (
      <Pagina titulo="Importação" descricao="Importar catálogo e saldos a partir de uma planilha.">
        <Alerta tom="atencao">
          Seu perfil consulta o estoque, mas não importa planilhas. Troque o perfil no menu para ver
          esta tela como gerente de estoque.
        </Alerta>
        <Link
          href="/"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar ao início
        </Link>
      </Pagina>
    );
  }

  return (
    <EmConstrucao
      titulo="Importação"
      descricao="Trazer uma planilha de catálogo ou de saldos com conferência antes de gravar."
      etapa="Etapa 9"
      icone={Upload}
      itens={[
        "Enviar um arquivo CSV e mapear as colunas.",
        "Conferir as linhas, os erros e o que será criado ou atualizado.",
        "Confirmar a importação em uma operação única.",
      ]}
    />
  );
}
