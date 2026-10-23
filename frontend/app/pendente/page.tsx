"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { podeConsultar } from "@estoque/backend/cargos";
import type { Resultado } from "@estoque/backend/resultado";
import { buscarPerfilAtual, sair } from "@estoque/backend/sessao";
import type { Perfil } from "@estoque/backend/tipos";
import { Alerta } from "@/components/ui/alerta";
import { Botao } from "@/components/ui/botao";
import { Cartao } from "@/components/ui/cartao";

// Tela "aguardando liberação" provisória, já usando a base visual. A versão
// final é a tarefa T2.2 (docs/03-specifications/etapa-2-acesso.md).
export default function PendentePage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isVerificando, setIsVerificando] = useState(true);
  const [saindo, setSaindo] = useState(false);

  const aplicarResultado = useCallback(
    (resultado: Resultado<Perfil | null>) => {
      setIsVerificando(false);

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      if (!resultado.dados) {
        router.replace("/login");
        return;
      }
      if (podeConsultar(resultado.dados.cargo)) {
        router.replace("/");
        return;
      }
      setPerfil(resultado.dados);
    },
    [router],
  );

  useEffect(() => {
    let cancelado = false;

    buscarPerfilAtual().then((resultado) => {
      if (!cancelado) aplicarResultado(resultado);
    });

    return () => {
      cancelado = true;
    };
  }, [aplicarResultado]);

  async function handleVerificar() {
    setIsVerificando(true);
    setErro(null);
    aplicarResultado(await buscarPerfilAtual());
  }

  async function handleSair() {
    setSaindo(true);
    const resultado = await sair();
    if (!resultado.ok) {
      setErro(resultado.erro);
      setSaindo(false);
      return;
    }
    router.replace("/login");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <Cartao
          titulo="Aguardando liberação"
          descricao="Sua conta já existe, mas ainda não foi liberada."
          icone={Clock}
        >
          {perfil && (
            <p className="text-sm text-slate-600">
              <strong className="font-semibold text-slate-900">{perfil.nome}</strong> (
              {perfil.email}), peça ao administrador para definir o seu perfil.
            </p>
          )}

          {erro && <Alerta tom="erro" className="mt-4">{erro}</Alerta>}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Botao
              icone={RefreshCw}
              carregando={isVerificando}
              onClick={handleVerificar}
              className="sm:flex-1"
            >
              {isVerificando ? "Verificando..." : "Verificar de novo"}
            </Botao>
            <Botao variante="secundario" icone={LogOut} onClick={handleSair} carregando={saindo}>
              Sair
            </Botao>
          </div>
        </Cartao>
      </div>
    </main>
  );
}
