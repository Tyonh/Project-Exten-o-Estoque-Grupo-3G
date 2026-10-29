import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Páginas acessíveis sem sessão ativa.
const ROTAS_PUBLICAS = ["/login", "/recuperar-senha"];

function isRotaPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // auth.getUser() valida o JWT junto ao servidor do Supabase (e renova o
  // cookie se preciso) — não trocar por getSession(), que só lê o cookie
  // local sem validar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isRotaApi = pathname.startsWith("/api/");

  // Rotas de API cuidam da própria autenticação e autorização
  // e devem responder JSON, não um redirect HTML para /login.
  if (!user && !isRotaApi && !isRotaPublica(pathname)) {
    const url = request.nextUrl.clone();
    // Guarda para onde a pessoa ia (por exemplo, o QR code de um documento):
    // depois do login ela volta direto para lá.
    const destino = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    if (destino !== "/") url.searchParams.set("next", destino);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
