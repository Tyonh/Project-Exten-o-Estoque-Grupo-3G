import { redirect } from "next/navigation";
import { FormularioDeLogin } from "./formulario";

// A página lê o aviso de "senha alterada" no servidor e entrega pronto para o
// formulário, sem depender de JavaScript para mostrar a mensagem.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ senha?: string; code?: string }>;
}) {
  const { senha, code } = await searchParams;

  // Se a URL de retorno do Supabase não estiver na lista de permitidas, o
  // link de recuperação cai na página inicial e o proxy traz o código para
  // cá. Encaminha para a rota que troca o código por sessão.
  if (code) {
    redirect(`/api/auth/confirmar-recuperacao?code=${encodeURIComponent(code)}`);
  }

  return <FormularioDeLogin senhaAlterada={senha === "alterada"} />;
}
