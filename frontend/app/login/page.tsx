"use client";

import { useState } from "react";
import { Boxes, LogIn, UserPlus } from "lucide-react";
import { cadastrar, entrar } from "@estoque/backend/sessao";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Cartao } from "@/components/ui/cartao";

type Modo = "entrar" | "cadastrar";

// Tela de login provisória, já usando a base visual. A versão final é a
// tarefa T2.1 (docs/03-specifications/etapa-2-acesso.md).
export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isEnviando, setIsEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function trocarModo(novoModo: Modo) {
    setModo(novoModo);
    setErro(null);
    setAviso(null);
  }

  async function handleEntrar() {
    const resultado = await entrar(email, senha);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    // Recarrega a página inteira para o proxy.ts ler o cookie novo da sessão.
    window.location.href = "/";
  }

  async function handleCadastrar() {
    const resultado = await cadastrar({ nome, email, senha });
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setAviso("Conta criada. Aguarde a liberação do administrador para acessar o sistema.");
    setSenha("");
    setModo("entrar");
  }

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setIsEnviando(true);
    setErro(null);
    setAviso(null);

    if (modo === "entrar") {
      await handleEntrar();
    } else {
      await handleCadastrar();
    }
    setIsEnviando(false);
  }

  const titulo = modo === "entrar" ? "Entrar" : "Criar conta";

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
          <h2 className="mb-4 text-display-3 text-slate-900">{titulo}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "cadastrar" && (
              <Campo
                rotulo="Nome completo"
                type="text"
                required
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            )}

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
              minLength={6}
              dica={modo === "cadastrar" ? "Ao menos 6 caracteres." : undefined}
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            {erro && <Alerta tom="erro">{erro}</Alerta>}
            {aviso && <Alerta tom="sucesso">{aviso}</Alerta>}

            <Botao
              type="submit"
              carregando={isEnviando}
              icone={modo === "entrar" ? LogIn : UserPlus}
              className="w-full"
            >
              {isEnviando ? "Aguarde..." : titulo}
            </Botao>
          </form>
        </Cartao>

        <Botao
          type="button"
          variante="fantasma"
          className="mt-3 w-full"
          onClick={() => trocarModo(modo === "entrar" ? "cadastrar" : "entrar")}
        >
          {modo === "entrar" ? "Não tenho conta: criar uma" : "Já tenho conta: entrar"}
        </Botao>
      </div>
    </main>
  );
}
