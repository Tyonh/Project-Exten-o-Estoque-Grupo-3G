"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, KeyRound } from "lucide-react";
import { alterarSenha } from "@estoque/backend/sessao";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";

// Segunda parte da recuperação: o usuário já chegou aqui com a sessão criada
// pelo link do e-mail e escolhe a nova senha.
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }

    setSalvando(true);
    const resultado = await alterarSenha(senha);
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    // A função encerra as sessões abertas; o usuário entra de novo com a
    // senha nova e vê a confirmação na tela de login.
    router.replace("/login?senha=alterada");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-marca-600 text-white">
            <Boxes className="size-6" aria-hidden />
          </span>
          <h1 className="text-display-1 text-slate-900">Estoque 3G</h1>
          <p className="mt-2 text-eyebrow uppercase text-slate-500">
            Catalogação e endereçamento de estoque
          </p>
        </div>

        <Cartao>
          <h2 className="mb-1 text-display-3 text-slate-900">Criar nova senha</h2>
          <p className="mb-5 text-sm text-slate-600">
            Escolha uma senha nova para entrar no sistema.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Campo
              rotulo="Nova senha"
              type="password"
              required
              minLength={6}
              dica="Ao menos 6 caracteres."
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            <Campo
              rotulo="Confirmar nova senha"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />

            {erro && <Alerta tom="erro">{erro}</Alerta>}

            <Botao
              type="submit"
              carregando={salvando}
              icone={KeyRound}
              className="w-full"
            >
              {salvando ? "Salvando..." : "Salvar nova senha"}
            </Botao>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            O link expirou?{" "}
            <Link
              href="/recuperar-senha"
              className="font-medium text-marca-700 hover:underline"
            >
              Pedir outro
            </Link>
          </p>
        </Cartao>
      </div>
    </main>
  );
}
