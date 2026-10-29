import { FormularioDeMovimentacao } from "./formulario";

interface NovaMovimentacaoPageProps {
  searchParams: Promise<{ variante?: string | string[] }>;
}

/**
 * A página é um componente de servidor só para ler `?variante=` e entregar o
 * valor inicial ao formulário. O restante é cliente porque usa o estado
 * compartilhado do estoque e os campos do formulário.
 */
export default async function NovaMovimentacaoPage({
  searchParams,
}: NovaMovimentacaoPageProps) {
  const parametros = await searchParams;
  const varianteInicial =
    typeof parametros.variante === "string" ? parametros.variante : undefined;

  return <FormularioDeMovimentacao varianteInicial={varianteInicial} />;
}
