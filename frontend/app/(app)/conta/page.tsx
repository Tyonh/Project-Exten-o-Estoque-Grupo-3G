"use client";

import { UserRound } from "lucide-react";
import { Pagina } from "@/components/layout/pagina";
import { Cartao } from "@/components/ui/cartao";
import { FormularioDeTrocaDeSenha } from "@/components/conta/formulario-de-troca-de-senha";
import { ROTULO_CARGO } from "@/lib/rotulos";
import { usePrototipo } from "@/prototipo/contexto";

export default function ContaPage() {
  const { perfil } = usePrototipo();

  return (
    <Pagina
      sobretitulo="Minha conta"
      titulo="Dados e senha"
      descricao="Confira seu acesso e troque sua senha quando precisar."
    >
      <div className="max-w-xl space-y-4">
        <Cartao titulo="Seu acesso" icone={UserRound}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Nome
              </dt>
              <dd className="mt-0.5 font-medium text-slate-900">{perfil.nome}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                E-mail
              </dt>
              <dd className="mt-0.5 truncate text-slate-700">{perfil.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Perfil
              </dt>
              <dd className="mt-0.5 text-slate-700">{ROTULO_CARGO[perfil.cargo]}</dd>
            </div>
          </dl>
        </Cartao>

        <Cartao
          titulo="Trocar senha"
          descricao="Informe a senha atual e escolha uma nova. As outras sessões abertas serão encerradas."
        >
          <FormularioDeTrocaDeSenha nome={perfil.nome} email={perfil.email} />
        </Cartao>
      </div>
    </Pagina>
  );
}
