"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Compass, PackageSearch } from "lucide-react";
import { podeConsultar } from "@estoque/backend/cargos";
import { buscarPerfilAtual, sair } from "@estoque/backend/sessao";
import type { Perfil } from "@estoque/backend/tipos";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Navegacao } from "@/components/layout/navegacao";
import { Pagina } from "@/components/layout/pagina";
import { Alerta } from "@/components/ui/alerta";
import { Carregando } from "@/components/ui/carregando";
import { Cartao } from "@/components/ui/cartao";

// Página inicial provisória, já usando a base visual. O painel com totais é a
// tarefa T6.5 (docs/03-specifications/etapa-6-consulta.md).
export default function InicioPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      const resultado = await buscarPerfilAtual();
      if (cancelado) return;

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      if (!resultado.dados) {
        router.replace("/login");
        return;
      }
      if (!podeConsultar(resultado.dados.cargo)) {
        router.replace("/pendente");
        return;
      }
      setPerfil(resultado.dados);
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [router]);

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
    <div className="min-h-dvh bg-slate-100">
      {perfil && (
        <Cabecalho nome={perfil.nome} cargo={perfil.cargo} aoSair={handleSair} saindo={saindo} />
      )}
      {perfil && <Navegacao cargo={perfil.cargo} />}

      {erro ? (
        <Pagina titulo="Início">
          <Alerta tom="erro">{erro}</Alerta>
        </Pagina>
      ) : perfil ? (
        <Pagina
          titulo={`Olá, ${perfil.nome.split(" ")[0]}`}
          descricao="O que você precisa fazer hoje?"
        >
          <Cartao
            titulo="Sistema em construção"
            descricao="As telas entram a cada etapa do roteiro."
            icone={Compass}
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <PackageSearch className="mt-0.5 size-4 shrink-0 text-marca-600" aria-hidden />
                Consultar onde está um produto e quanto há em cada local (etapa 6).
              </li>
              <li className="flex items-start gap-2">
                <ArrowLeftRight className="mt-0.5 size-4 shrink-0 text-marca-600" aria-hidden />
                Registrar entradas, saídas e transferências (etapa 5).
              </li>
            </ul>
          </Cartao>
        </Pagina>
      ) : (
        <Carregando texto="Carregando seu perfil..." />
      )}
    </div>
  );
}
