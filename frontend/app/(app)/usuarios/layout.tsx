import { redirect } from "next/navigation";
import { eAdmin } from "@estoque/backend/cargos";
import { buscarPerfilAtual } from "@estoque/backend/sessao";

/** A tela de usuários só existe para o administrador. */
export default async function UsuariosLayout({ children }: { children: React.ReactNode }) {
  const resultado = await buscarPerfilAtual();
  if (!resultado.ok || !resultado.dados || !eAdmin(resultado.dados.cargo)) {
    redirect("/");
  }
  return children;
}
