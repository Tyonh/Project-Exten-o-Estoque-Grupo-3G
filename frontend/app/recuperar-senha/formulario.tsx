"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, Mail } from "lucide-react";
import { solicitarRecuperacaoSenha } from "@estoque/backend/sessao";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";

interface FormularioDeRecuperacaoProps {
  erroDeLink: boolean;
}

// Primeira parte da recuperação de senha: o usuário informa o e-mail e o
// backend pede ao Supabase o envio do link.
export function FormularioDeRecuperacao({ erroDeLink }: FormularioDeRecuperacaoProps) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // Quando o link do e-mail falha (expirou ou já foi usado), a rota de
  // confirmação volta para cá com ?erro=link.
  const [erro, setErro] = useState<string | null>(
    erroDeLink ? "O link expirou ou já foi usado. Peça um novo abaixo." : null,
  );

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);

    const resultado = await solicitarRecuperacaoSenha(email);

    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setEnviado(true);
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
          <h2 className="mb-1 text-display-3 text-slate-900">Recuperar senha</h2>

          {enviado ? (
            <div className="mt-4 space-y-4">
              <Alerta tom="sucesso" titulo="Confira seu e-mail">
                Se este e-mail estiver cadastrado, enviamos um link para você criar uma
                nova senha. O link vale por tempo limitado.
              </Alerta>
              <p className="text-sm text-slate-600">
                Não encontrou? Veja também a pasta de spam ou lixo eletrônico. Abra o
                link no mesmo navegador em que fez o pedido.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-slate-600">
                Informe o e-mail da sua conta. Vamos enviar um link para você criar uma
                nova senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Campo
                  rotulo="E-mail da conta"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {erro && <Alerta tom="erro">{erro}</Alerta>}

                <Botao
                  type="submit"
                  carregando={enviando}
                  icone={Mail}
                  className="w-full"
                >
                  {enviando ? "Enviando..." : "Enviar link"}
                </Botao>
              </form>
            </>
          )}
        </Cartao>

        <Link
          href="/login"
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
