"use client";

import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { alterarSenhaDaConta, sair } from "@estoque/backend/sessao";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";

interface FormularioDeTrocaDeSenhaProps {
  nome: string;
  email: string;
  primeiroAcesso?: boolean;
}

/**
 * Troca de senha usada em dois lugares: na conta normal (`/conta`) e no
 * primeiro acesso, quando a pessoa ainda está com a senha provisória.
 */
export function FormularioDeTrocaDeSenha({
  nome,
  email,
  primeiroAcesso = false,
}: FormularioDeTrocaDeSenhaProps) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSucesso(null);

    if (novaSenha.length < 6) {
      setErro("A nova senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As duas senhas novas não são iguais.");
      return;
    }

    setSalvando(true);
    const resultado = await alterarSenhaDaConta(senhaAtual, novaSenha);
    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmacao("");

    if (primeiroAcesso) {
      // Recarrega do servidor para a nova marcação de senha valer no layout.
      window.location.href = "/";
      return;
    }

    setSucesso("Senha alterada. Use a nova senha nos próximos acessos.");
  }

  async function handleSair() {
    setErro(null);
    setSaindo(true);
    const resultado = await sair();
    setSaindo(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    window.location.href = "/login";
  }

  return (
    <div>
      <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-900">{nome}</p>
        <p className="truncate text-xs text-slate-500">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo
          rotulo={primeiroAcesso ? "Senha provisória" : "Senha atual"}
          type="password"
          required
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(evento) => setSenhaAtual(evento.target.value)}
        />

        <Campo
          rotulo="Nova senha"
          type="password"
          required
          minLength={6}
          dica="Ao menos 6 caracteres."
          autoComplete="new-password"
          value={novaSenha}
          onChange={(evento) => setNovaSenha(evento.target.value)}
        />

        <Campo
          rotulo="Confirmar nova senha"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmacao}
          onChange={(evento) => setConfirmacao(evento.target.value)}
        />

        {erro && <Alerta tom="erro">{erro}</Alerta>}
        {sucesso && <Alerta tom="sucesso">{sucesso}</Alerta>}

        <Botao type="submit" carregando={salvando} icone={KeyRound} className="w-full">
          {salvando
            ? "Salvando..."
            : primeiroAcesso
              ? "Trocar senha e continuar"
              : "Salvar nova senha"}
        </Botao>

        {primeiroAcesso && (
          <Botao
            type="button"
            variante="secundario"
            icone={LogOut}
            carregando={saindo}
            onClick={handleSair}
            className="w-full"
          >
            Sair
          </Botao>
        )}
      </form>
    </div>
  );
}
