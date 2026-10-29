import { FormularioDeRecuperacao } from "./formulario";

// A página lê o aviso de link inválido no servidor; o formulário só cuida do
// envio do pedido.
export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return <FormularioDeRecuperacao erroDeLink={erro === "link"} />;
}
