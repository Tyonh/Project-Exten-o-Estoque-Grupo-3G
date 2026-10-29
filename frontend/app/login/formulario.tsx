"use client";

import { useState } from "react";
import Link from "next/link";
import { Boxes, LogIn } from "lucide-react";
import { entrar } from "@estoque/backend/sessao";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";

interface FormularioDeLoginProps {
  senhaAlterada: boolean;
}

// Formulário da tela de login. Não existe cadastro público: o acesso é criado
// pelo administrador em `/usuarios`.
export function FormularioDeLogin({ senhaAlterada }: FormularioDeLoginProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isEnviando, setIsEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(
    senhaAlterada ? "Senha alterada. Entre com a nova senha." : null,
  );

  async function handleEntrar() {
    const resultado = await entrar(email, senha);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    // Recarrega a página inteira para o proxy.ts ler o cookie novo da sessão.
    window.location.href = "/";
  }

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setIsEnviando(true);
    setErro(null);
    setAviso(null);
    await handleEntrar();
    setIsEnviando(false);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-md bg-marca-600 text-white">
            <Boxes className="size-6" aria-hidden />
          </span>
          <h1 className="text-display-1 text-slate-900">Estoque 3G</h1>
          <p className="mt-2 text-eyebrow uppercase text-slate-500">
            Catalogação e endereçamento de estoque
          </p>
        </div>

        <Cartao>
          <h2 className="mb-1 text-display-3 text-slate-900">Entrar</h2>
          <p className="mb-4 text-xs text-slate-500">
            O acesso é criado pelo administrador do sistema.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Campo
              rotulo="E-mail"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Campo
              rotulo="Senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            {erro && <Alerta tom="erro">{erro}</Alerta>}
            {aviso && <Alerta tom="sucesso">{aviso}</Alerta>}

            <Botao type="submit" carregando={isEnviando} icone={LogIn} className="w-full">
              {isEnviando ? "Aguarde..." : "Entrar"}
            </Botao>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/recuperar-senha"
              className="text-sm font-medium text-marca-700 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </Cartao>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
          Precisa de acesso? Fale com o administrador responsável pelo estoque.
        </p>
      </div>
    </main>
  );
}
