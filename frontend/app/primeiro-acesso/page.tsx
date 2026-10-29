import { redirect } from "next/navigation";
import { Boxes, ShieldCheck } from "lucide-react";
import { podeConsultar } from "@estoque/backend/cargos";
import { buscarPerfilAtual } from "@estoque/backend/sessao";
import { Cartao } from "@/components/ui/cartao";
import { FormularioDeTrocaDeSenha } from "@/components/conta/formulario-de-troca-de-senha";

/**
 * Primeiro acesso de uma conta criada pelo administrador. Enquanto a senha
 * provisória não for trocada, o layout autenticado manda a pessoa para cá.
 */
export default async function PrimeiroAcessoPage() {
  const resultado = await buscarPerfilAtual();

  if (!resultado.ok || !resultado.dados) {
    redirect("/login");
  }
  if (!podeConsultar(resultado.dados.cargo)) {
    redirect("/pendente");
  }
  if (!resultado.dados.senha_provisoria) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-md bg-marca-600 text-white">
            <Boxes className="size-6" aria-hidden />
          </span>
          <h1 className="text-display-1 text-slate-900">Estoque 3G</h1>
          <p className="mt-2 text-eyebrow uppercase text-slate-500">Primeiro acesso</p>
        </div>

        <Cartao
          titulo="Troque a senha provisória"
          descricao="Sua conta foi criada pelo administrador. Para continuar, escolha uma senha só sua."
          icone={ShieldCheck}
        >
          <FormularioDeTrocaDeSenha
            nome={resultado.dados.nome}
            email={resultado.dados.email}
            primeiroAcesso
          />
        </Cartao>
      </div>
    </main>
  );
}
