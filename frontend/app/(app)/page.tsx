"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  ClipboardCheck,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { podeOperar } from "@estoque/backend/cargos";
import { listarUsuarios } from "@estoque/backend/usuarios";
import type { Usuario } from "@estoque/backend/tipos";
import { Pagina } from "@/components/layout/pagina";
import { Etiqueta } from "@/components/ui/etiqueta";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import {
  formatarDataHora,
  formatarNumero,
  ROTULO_TIPO,
  sinalDaMovimentacao,
  TOM_DO_TIPO,
} from "@/prototipo/formatos";
import { usePrototipo } from "@/prototipo/contexto";
import { cn } from "@/lib/classes";

interface ResumoProps {
  rotulo: string;
  valor: string;
  detalhe: string;
  alerta?: boolean;
}

function Resumo({ rotulo, valor, detalhe, alerta = false }: ResumoProps) {
  return (
    <div className="border-b border-r border-slate-200 p-4 sm:p-5">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {rotulo}
      </p>
      <p
        className={cn(
          "tabular mt-2 font-display text-3xl font-bold tracking-tight",
          alerta ? "text-amber-700" : "text-slate-900",
        )}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-[0.6875rem] leading-snug text-slate-500">{detalhe}</p>
    </div>
  );
}

interface AcaoRapidaProps {
  href: string;
  icone: LucideIcon;
  indice: string;
  titulo: string;
  descricao: string;
}

function AcaoRapida({ href, icone: Icone, indice, titulo, descricao }: AcaoRapidaProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 bg-white p-4 transition-colors hover:bg-slate-50"
    >
      <span className="tabular mt-0.5 font-mono text-[0.625rem] text-slate-400" aria-hidden>
        {indice}
      </span>
      <Icone className="mt-0.5 size-4 shrink-0 text-marca-700" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{titulo}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{descricao}</span>
      </span>
      <ArrowRight
        className="mt-1 size-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-marca-700"
        aria-hidden
      />
    </Link>
  );
}

function PainelDeAcessos() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarUsuarios().then((resultado) => {
      if (cancelado) return;
      if (resultado.ok) setUsuarios(resultado.dados);
      else setErro(resultado.erro);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const ativos = usuarios?.filter((usuario) => usuario.cargo !== "pendente").length ?? 0;
  const pendentes = usuarios?.filter((usuario) => usuario.cargo === "pendente").length ?? 0;
  const admins = usuarios?.filter((usuario) => usuario.cargo === "admin").length ?? 0;

  return (
    <section className="mb-7 overflow-hidden rounded-lg border border-marca-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-marca-700" aria-hidden />
          <div>
            <h2 className="text-display-3 text-slate-900">Acessos do sistema</h2>
            <p className="text-xs text-slate-500">Quem entra e qual perfil cada pessoa usa.</p>
          </div>
        </div>
        <Link
          href="/usuarios"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <UserPlus className="size-3.5" aria-hidden />
          Gerenciar usuários
        </Link>
      </div>
      {erro ? (
        <p className="px-4 py-4 text-sm text-red-700">{erro}</p>
      ) : (
        <div className="grid grid-cols-3 divide-x divide-slate-200">
          <div className="p-4">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Ativos
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
              {usuarios ? formatarNumero(ativos) : "—"}
            </p>
          </div>
          <div className="p-4">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Pendentes
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold tracking-tight text-amber-700">
              {usuarios ? formatarNumero(pendentes) : "—"}
            </p>
          </div>
          <div className="p-4">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Administradores
            </p>
            <p className="tabular mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
              {usuarios ? formatarNumero(admins) : "—"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default function InicioPage() {
  const { cargoVisualizado, dados, variantesAbaixoDoMinimo } = usePrototipo();

  const operador = podeOperar(cargoVisualizado);
  const ehAdmin = cargoVisualizado === "admin";
  const ehGerenteEstoque = cargoVisualizado === "gerente_estoque";
  const ehGerente = cargoVisualizado === "gerente";
  const ehEstoquista = cargoVisualizado === "estoquista";
  const variantesAtivas = dados.variantes.filter((variante) => variante.ativo);
  const saldoTotal = dados.saldos.reduce((total, saldo) => total + saldo.quantidade, 0);
  const baixos = variantesAbaixoDoMinimo();
  const locaisAtivos = dados.locais.filter((local) => local.ativo).length;
  const ultimasMovimentacoes = [...dados.movimentacoes]
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
    .slice(0, 5);

  const acoesRapidas: AcaoRapidaProps[] = ehAdmin
    ? [
        {
          href: "/usuarios",
          icone: Users,
          indice: "01",
          titulo: "Gerenciar acessos",
          descricao: "Criar usuários e definir o perfil de cada pessoa.",
        },
        {
          href: "/catalogo",
          icone: Boxes,
          indice: "02",
          titulo: "Revisar catálogo",
          descricao: "Categorias, famílias e variantes do estoque.",
        },
        {
          href: "/locais",
          icone: MapPin,
          indice: "03",
          titulo: "Revisar locais",
          descricao: "A árvore de endereços dos galpões e setores.",
        },
        {
          href: "/movimentacoes/nova",
          icone: ArrowLeftRight,
          indice: "04",
          titulo: "Registrar movimentação",
          descricao: "Entrada, saída ou transferência de uma variante.",
        },
      ]
    : ehGerenteEstoque
      ? [
          {
            href: "/movimentacoes/nova",
            icone: ArrowLeftRight,
            indice: "01",
            titulo: "Registrar movimentação",
            descricao: "Entrada, saída ou transferência de uma variante.",
          },
          {
            href: "/catalogo",
            icone: Boxes,
            indice: "02",
            titulo: "Cadastrar produto",
            descricao: "Categorias, famílias e variantes do catálogo.",
          },
          {
            href: "/locais",
            icone: MapPin,
            indice: "03",
            titulo: "Organizar locais",
            descricao: "Criar, mover e ver o que há em cada endereço.",
          },
          {
            href: "/importacao",
            icone: Upload,
            indice: "04",
            titulo: "Importar planilha",
            descricao: "Conferir um CSV antes de gravar no sistema.",
          },
        ]
      : [
          {
            href: "/consulta",
            icone: Search,
            indice: "01",
            titulo: "Consultar produto",
            descricao: "Buscar por código ou nome e ver onde ele está.",
          },
          {
            href: "/locais",
            icone: MapPin,
            indice: "02",
            titulo: "Ver locais",
            descricao: "Abrir um endereço e conferir o que há nele.",
          },
          {
            href: "/consulta",
            icone: ClipboardCheck,
            indice: "03",
            titulo: "Itens críticos",
            descricao: "Variantes com saldo igual ou abaixo do mínimo.",
          },
          {
            href: "/movimentacoes",
            icone: ArrowLeftRight,
            indice: "04",
            titulo: "Consultar histórico",
            descricao: "Ver o que entrou, saiu ou mudou de lugar.",
          },
        ];

  const titulo = ehAdmin
    ? "Acessos e estrutura"
    : ehGerenteEstoque
      ? "Estoque hoje"
      : ehGerente
        ? "Indicadores do estoque"
        : "O que você procura?";
  const sobretitulo = ehAdmin
    ? "Administração"
    : ehGerenteEstoque
      ? "Resumo operacional"
      : ehGerente
        ? "Visão gerencial"
        : "Consulta rápida";
  const descricao = ehAdmin
    ? "Cuide dos acessos e acompanhe a estrutura do estoque."
    : ehGerenteEstoque
      ? `${variantesAtivas.length} variantes ativas, ${baixos.length} abaixo do mínimo e ${locaisAtivos} locais em operação.`
      : ehGerente
        ? "Acompanhe os números do estoque e os itens que pedem atenção."
        : "Busque um produto ou abra um local para encontrar o que precisa.";

  return (
    <Pagina
      sobretitulo={sobretitulo}
      titulo={titulo}
      descricao={descricao}
      acoes={
        ehAdmin ? (
          <Link
            href="/usuarios"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-marca-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-marca-700"
          >
            <Users className="size-4" aria-hidden />
            Gerenciar usuários
          </Link>
        ) : operador ? (
          <Link
            href="/movimentacoes/nova"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-marca-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-marca-700"
          >
            <Plus className="size-4" aria-hidden />
            Registrar movimentação
          </Link>
        ) : (
          <Link
            href="/consulta"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Search className="size-4" aria-hidden />
            Buscar produto
          </Link>
        )
      }
    >
      {ehAdmin && <PainelDeAcessos />}

      {ehEstoquista && (
        <Link
          href="/consulta"
          className="mb-5 flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 transition-colors hover:border-marca-400 hover:bg-marca-50/40"
        >
          <Search className="size-5 shrink-0 text-marca-700" aria-hidden />
          <span className="min-w-0 flex-1">Buscar produto por código ou nome</span>
          <ArrowRight className="size-4 shrink-0 text-slate-300" aria-hidden />
        </Link>
      )}

      <div className="grid grid-cols-2 overflow-hidden rounded-lg border-l border-t border-slate-200 bg-white sm:grid-cols-4">
        <Resumo
          rotulo="Variantes ativas"
          valor={formatarNumero(variantesAtivas.length)}
          detalhe={`${dados.familias.length} famílias no catálogo`}
        />
        <Resumo
          rotulo="Unidades"
          valor={formatarNumero(saldoTotal)}
          detalhe={`${formatarNumero(dados.saldos.length)} posições de estoque`}
        />
        <Resumo
          rotulo="Abaixo do mínimo"
          valor={formatarNumero(baixos.length)}
          detalhe={baixos.length > 0 ? "Precisam de reposição" : "Tudo em dia"}
          alerta={baixos.length > 0}
        />
        <Resumo
          rotulo="Locais ativos"
          valor={formatarNumero(locaisAtivos)}
          detalhe="Galpões, setores e módulos"
        />
      </div>

      <section className="mt-7">
        <div className="mb-3">
          <h2 className="text-display-3 text-slate-900">
            {ehAdmin ? "Atalhos da administração" : "Ações rápidas"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {ehAdmin
              ? "O que o administrador resolve no dia a dia."
              : ehGerenteEstoque
                ? "O que a equipe mais faz no dia a dia."
                : "Atalhos para consultar o estoque."}
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2">
          {acoesRapidas.map((acao) => (
            <AcaoRapida key={`${acao.href}-${acao.indice}`} {...acao} />
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-display-3 text-slate-900">Estoque baixo</h2>
              <span className="tabular text-xs font-medium text-slate-400">{baixos.length}</span>
            </div>
            <Link
              href="/consulta"
              className="shrink-0 text-xs font-semibold text-marca-700 hover:underline"
            >
              Ver consulta
            </Link>
          </div>

          {baixos.length === 0 ? (
            <EstadoVazio
              icone={ClipboardCheck}
              titulo="Nenhum item abaixo do mínimo"
              descricao="As variantes monitoradas estão com saldo suficiente."
            />
          ) : (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {baixos.slice(0, 5).map(({ variante, total, minimo }) => {
                const proporcao = minimo > 0 ? Math.min(100, (total / minimo) * 100) : 0;
                return (
                  <Link
                    key={variante.id}
                    href={`/consulta/variante/${variante.id}`}
                    className="block border-l-2 border-amber-400 px-4 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[0.6875rem] font-medium tracking-wide text-slate-500">
                          {variante.codigo}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                          {variante.nome}
                        </p>
                      </div>
                      <p className="tabular shrink-0 font-mono text-sm font-semibold text-amber-700">
                        {formatarNumero(total)}{" "}
                        <span className="font-normal text-slate-400">
                          / {formatarNumero(minimo)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-1 rounded-full bg-amber-500"
                        style={{ width: `${Math.max(3, proporcao)}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-display-3 text-slate-900">Últimas movimentações</h2>
              <span className="tabular text-xs font-medium text-slate-400">
                {ultimasMovimentacoes.length}
              </span>
            </div>
            <Link
              href="/movimentacoes"
              className="shrink-0 text-xs font-semibold text-marca-700 hover:underline"
            >
              Ver histórico
            </Link>
          </div>

          {ultimasMovimentacoes.length === 0 ? (
            <EstadoVazio
              icone={ArrowLeftRight}
              titulo="Nenhuma movimentação ainda"
              descricao="Quando a primeira entrada for registrada, ela aparece aqui."
            />
          ) : (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {ultimasMovimentacoes.map((movimentacao) => {
                const variante = dados.variantes.find(
                  (item) => item.id === movimentacao.variante_id,
                );
                const sinal = sinalDaMovimentacao(movimentacao);
                return (
                  <div key={movimentacao.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Etiqueta tom={TOM_DO_TIPO[movimentacao.tipo]} className="shrink-0">
                          {ROTULO_TIPO[movimentacao.tipo]}
                        </Etiqueta>
                        <p className="truncate font-mono text-[0.6875rem] font-medium tracking-wide text-slate-600">
                          {variante ? variante.codigo : "Variante removida"}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "tabular shrink-0 font-mono text-sm font-semibold",
                          sinal === "+"
                            ? "text-emerald-700"
                            : sinal === "−"
                              ? "text-red-700"
                              : "text-slate-500",
                        )}
                      >
                        {sinal}
                        {formatarNumero(movimentacao.quantidade)}
                        <span className="ml-0.5 font-sans text-[0.625rem] font-normal text-slate-400">
                          un.
                        </span>
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3 text-[0.6875rem] text-slate-500">
                      <span className="truncate">{formatarDataHora(movimentacao.criado_em)}</span>
                      <span className="truncate">por {movimentacao.usuario_nome}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {ehEstoquista && (
        <div className="mt-7 border-l-2 border-marca-300 bg-marca-50/60 px-4 py-3 text-sm text-marca-900">
          <p>
            Seu perfil consulta produtos, saldos e locais. Cadastros e movimentações ficam com o
            gerente de estoque ou o administrador.
          </p>
        </div>
      )}

      {ehGerente && (
        <div className="mt-7 border-l-2 border-marca-300 bg-marca-50/60 px-4 py-3 text-sm text-marca-900">
          <p>
            Seu perfil acompanha os números e o histórico. As alterações de estoque ficam com o
            gerente de estoque ou o administrador.
          </p>
        </div>
      )}
    </Pagina>
  );
}
