"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Upload,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { eAdmin, podeConsultar, podeOperar, type Cargo } from "@estoque/backend/cargos";
import { sair } from "@estoque/backend/sessao";
import { ROTULO_CARGO } from "@/lib/rotulos";
import { cn } from "@/lib/classes";
import { capitalizar, iniciais } from "@/prototipo/formatos";
import { usePrototipo } from "@/prototipo/contexto";

type GrupoDoMenu = "visao" | "operacao" | "cadastros" | "administracao";

interface ItemMenu {
  href: string;
  rotulo: string;
  rotuloCurto?: string;
  icone: LucideIcon;
  grupo: GrupoDoMenu;
  visivelPara: (cargo: Cargo) => boolean;
}

const GRUPOS: Array<{ valor: GrupoDoMenu; rotulo: string }> = [
  { valor: "visao", rotulo: "Visão geral" },
  { valor: "operacao", rotulo: "Operação" },
  { valor: "cadastros", rotulo: "Cadastros" },
  { valor: "administracao", rotulo: "Administração" },
];

const ITENS: ItemMenu[] = [
  {
    href: "/",
    rotulo: "Início",
    icone: LayoutDashboard,
    grupo: "visao",
    visivelPara: podeConsultar,
  },
  {
    href: "/consulta",
    rotulo: "Consulta",
    icone: Search,
    grupo: "visao",
    visivelPara: podeConsultar,
  },
  {
    href: "/movimentacoes",
    rotulo: "Movimentações",
    rotuloCurto: "Movimentos",
    icone: ArrowLeftRight,
    grupo: "operacao",
    visivelPara: podeConsultar,
  },
  {
    href: "/inventario",
    rotulo: "Inventário",
    icone: ClipboardCheck,
    grupo: "operacao",
    visivelPara: podeConsultar,
  },
  {
    href: "/documentos",
    rotulo: "Documentos",
    icone: FileText,
    grupo: "operacao",
    visivelPara: podeConsultar,
  },
  {
    href: "/catalogo",
    rotulo: "Catálogo",
    icone: Boxes,
    grupo: "cadastros",
    visivelPara: podeConsultar,
  },
  {
    href: "/locais",
    rotulo: "Locais",
    icone: MapPin,
    grupo: "cadastros",
    visivelPara: podeConsultar,
  },
  {
    href: "/importacao",
    rotulo: "Importação",
    icone: Upload,
    grupo: "cadastros",
    visivelPara: podeOperar,
  },
  {
    href: "/usuarios",
    rotulo: "Usuários",
    icone: Users,
    grupo: "administracao",
    visivelPara: eAdmin,
  },
];

function estaAtivo(caminho: string, href: string): boolean {
  return href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
}

function iniciaisDoNome(nome: string): string {
  return iniciais(nome);
}

/**
 * Moldura das telas autenticadas: menu lateral no computador,
 * barra inferior no celular e uma gaveta "Mais" com tudo o que não cabe.
 */
export function Shell({ children }: { children: ReactNode }) {
  const { perfil, cargoVisualizado } = usePrototipo();
  const caminho = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erroSair, setErroSair] = useState<string | null>(null);

  const itensVisiveis = ITENS.filter((item) => item.visivelPara(cargoVisualizado));
  const gruposVisiveis = GRUPOS.map((grupo) => ({
    ...grupo,
    itens: itensVisiveis.filter((item) => item.grupo === grupo.valor),
  })).filter((grupo) => grupo.itens.length > 0);

  const itensRapidos = ["/", "/consulta", "/movimentacoes"]
    .map((href) => itensVisiveis.find((item) => item.href === href))
    .filter((item): item is ItemMenu => Boolean(item));

  async function sairDaConta() {
    setSaindo(true);
    setErroSair(null);
    const resultado = await sair();
    if (!resultado.ok) {
      setErroSair(resultado.erro);
      setSaindo(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#22302c] bg-[#101a18] text-[#d7ded9] md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[#22302c] px-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-marca-500 text-white">
            <Boxes className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-tight text-white">
              Estoque 3G
            </p>
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[#aab8b1]">
              Gestão de estoque
            </p>
          </div>
        </div>

        <nav
          aria-label="Menu principal"
          className="barra-lateral flex-1 overflow-y-auto px-3 py-4"
        >
          {gruposVisiveis.map((grupo) => (
            <div key={grupo.valor} className="mb-4 last:mb-0">
              <p className="px-3 pb-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#aab8b1]">
                {grupo.rotulo}
              </p>
              <div className="space-y-0.5">
                {grupo.itens.map(({ href, rotulo, icone: Icone }) => {
                  const ativo = estaAtivo(caminho, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={ativo ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md border-l-2 py-2 pl-2.5 pr-3 text-sm transition-colors",
                        ativo
                          ? "border-amber-400 bg-[#265446] font-semibold text-white"
                          : "border-transparent font-medium text-[#e6ece8] hover:bg-[#1a2b26] hover:text-white",
                      )}
                    >
                      <Icone
                        className={cn(
                          "size-4 shrink-0",
                          ativo ? "text-amber-300" : "text-[#a9b8b1]",
                        )}
                        aria-hidden
                      />
                      {rotulo}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[#22302c] p-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#243630] text-xs font-bold text-amber-200">
              {iniciaisDoNome(perfil.nome)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {capitalizar(perfil.nome)}
              </p>
              <p className="truncate text-[0.6875rem] text-[#aab8b1]">{perfil.email}</p>
            </div>
          </div>

          <Link
            href="/conta"
            className="mt-2 flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[#c6d1cb] transition-colors hover:bg-[#1b2b27] hover:text-white"
          >
            <UserRound className="size-3.5" aria-hidden />
            Minha conta
          </Link>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-amber-200">
              {ROTULO_CARGO[cargoVisualizado]}
            </span>
            <button
              type="button"
              onClick={sairDaConta}
              disabled={saindo}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[#c6d1cb] transition-colors hover:bg-[#1b2b27] hover:text-white disabled:opacity-60"
            >
              <LogOut className="size-3.5" aria-hidden />
              {saindo ? "Saindo..." : "Sair"}
            </button>
          </div>
          {erroSair && <p className="mt-1 text-[0.6875rem] text-red-400">{erroSair}</p>}
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f7f5ef]/95 backdrop-blur md:hidden">
          <div className="flex h-16 items-center gap-3 px-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-marca-600 text-white">
              <Boxes className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold tracking-tight text-slate-900">
                Estoque 3G
              </p>
              <p className="truncate text-[0.6875rem] text-slate-500">
                {capitalizar(perfil.nome)} · {ROTULO_CARGO[cargoVisualizado]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="grid size-9 shrink-0 place-items-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="pb-24 md:pb-8">{children}</div>
      </div>

      <nav
        aria-label="Menu rápido"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-[#fbf9f4] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="grid grid-cols-4">
          {itensRapidos.map(({ href, rotuloCurto, rotulo, icone: Icone }) => {
            const ativo = estaAtivo(caminho, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 border-t-2 px-1 pb-2 pt-1.5 text-[0.625rem] font-semibold transition-colors",
                  ativo
                    ? "border-marca-600 text-marca-700"
                    : "border-transparent text-slate-500",
                )}
              >
                <Icone className="size-5" aria-hidden />
                {rotuloCurto ?? rotulo}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="flex flex-col items-center gap-0.5 border-t-2 border-transparent px-1 pb-2 pt-1.5 text-[0.625rem] font-semibold text-slate-500"
          >
            <Menu className="size-5" aria-hidden />
            Mais
          </button>
        </div>
      </nav>

      {menuAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-[#101a18]/50"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-xl bg-[#fbf9f4] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-slate-900">Menu</p>
                <p className="text-xs text-slate-500">
                  {capitalizar(perfil.nome)} · {ROTULO_CARGO[cargoVisualizado]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="grid size-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-4">
              {gruposVisiveis.map((grupo) => (
                <div key={grupo.valor}>
                  <p className="mb-1 px-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {grupo.rotulo}
                  </p>
                  <div className="space-y-0.5">
                    {grupo.itens.map(({ href, rotulo, icone: Icone }) => {
                      const ativo = estaAtivo(caminho, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMenuAberto(false)}
                          aria-current={ativo ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-md border-l-2 py-2.5 pl-2.5 pr-2 text-sm font-medium",
                            ativo
                              ? "border-marca-600 bg-marca-50 text-marca-800"
                              : "border-transparent text-slate-700 hover:bg-slate-100",
                          )}
                        >
                          <Icone className="size-5 shrink-0" aria-hidden />
                          {rotulo}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <Link
                href="/conta"
                onClick={() => setMenuAberto(false)}
                className="mb-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="size-4" aria-hidden />
                Minha conta
              </Link>
              <button
                type="button"
                onClick={sairDaConta}
                disabled={saindo}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <LogOut className="size-4" aria-hidden />
                {saindo ? "Saindo..." : "Sair"}
              </button>
              {erroSair && <p className="mt-2 text-xs text-red-600">{erroSair}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
