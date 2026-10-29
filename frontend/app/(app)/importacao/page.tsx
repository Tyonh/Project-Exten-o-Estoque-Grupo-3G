"use client";

import Link from "next/link";
import { ArrowLeft, CircleCheck, FileSpreadsheet, ListChecks, Upload } from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { AguardandoBackend } from "@/components/layout/aguardando-backend";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Cartao } from "@/components/ui/cartao";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { usePrototipo } from "@/prototipo/contexto";

/** T9.2: envio do CSV, prévia com as linhas problemáticas e gravação. */
export default function ImportacaoPage() {
  const { cargoVisualizado } = usePrototipo();

  if (!podeOperar(cargoVisualizado)) {
    return (
      <Pagina titulo="Importação" descricao="Importar o catálogo a partir de uma planilha.">
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
    <Pagina
      sobretitulo="Etapa 9"
      titulo="Importação"
      descricao="Trazer uma planilha de catálogo com conferência antes de gravar."
    >
      <div className="space-y-4">
        <AguardandoBackend funcoes={["prepararImportacao", "gravarImportacao"]} />
        <Cartao
          titulo="1. Enviar o arquivo"
          descricao="CSV com categoria, família, código, nome e atributos."
          icone={Upload}
        >
          <Botao variante="secundario" icone={Upload} disabled>
            Escolher arquivo CSV
          </Botao>
        </Cartao>
        <Cartao
          titulo="2. Conferir"
          descricao="Prévia das linhas e lista das que têm problema (código repetido ou campo vazio)."
          icone={ListChecks}
        >
          <EstadoVazio icone={FileSpreadsheet} titulo="Nenhum arquivo enviado" />
        </Cartao>
        <Cartao
          titulo="3. Gravar"
          descricao="Cria o que faltar. Importar o mesmo arquivo de novo não duplica nada."
          icone={CircleCheck}
        >
          <Botao disabled>Confirmar importação</Botao>
        </Cartao>
      </div>
    </Pagina>
  );
}
