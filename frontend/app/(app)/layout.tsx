import { redirect } from "next/navigation";
import { podeConsultar } from "@estoque/backend/cargos";
import { carregarDadosDoEstoque } from "@estoque/backend/consulta";
import { buscarPerfilAtual } from "@estoque/backend/sessao";
import { Shell } from "@/components/layout/shell";
import { ProvedorDoPrototipo } from "@/prototipo/contexto";

/**
 * Moldura de todas as telas autenticadas. O perfil e os dados vêm do servidor
 * (nunca de um campo enviado pela tela). As telas recebem uma fotografia real
 * do estoque e pedem outra depois de cada alteração.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const resultado = await buscarPerfilAtual();

  if (!resultado.ok || !resultado.dados) {
    redirect("/login");
  }
  if (!podeConsultar(resultado.dados.cargo)) {
    redirect("/pendente");
  }
  if (resultado.dados.senha_provisoria) {
    redirect("/primeiro-acesso");
  }

  const dados = await carregarDadosDoEstoque();
  if (!dados.ok) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <h1 className="text-display-2 text-slate-900">Não foi possível carregar o estoque</h1>
        <p className="mt-2 text-sm text-slate-600">{dados.erro}</p>
        <p className="mt-4 text-xs text-slate-500">
          Atualize a página. Se o problema continuar, avise o administrador.
        </p>
      </main>
    );
  }

  return (
    <ProvedorDoPrototipo perfilInicial={resultado.dados} dadosIniciais={dados.dados}>
      <Shell>{children}</Shell>
    </ProvedorDoPrototipo>
  );
}
