import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// O link do e-mail de recuperação chega aqui com um código temporário. A rota
// troca o código por uma sessão (gravando os cookies) e leva o usuário para a
// tela onde ele cria a nova senha. Fica em /api/ porque é uma rota de backend:
// não tem tela e não passa pelo menu do sistema.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");

  if (!codigo) {
    return NextResponse.redirect(new URL("/recuperar-senha?erro=link", url.origin));
  }

  const resposta = NextResponse.redirect(new URL("/redefinir-senha", url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaDefinir) {
          cookiesParaDefinir.forEach(({ name, value, options }) => {
            resposta.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(codigo);
  if (error) {
    console.error(
      "[recuperacao] Link inválido ou expirado:",
      error.code ?? "sem código",
      error.message,
    );
    return NextResponse.redirect(new URL("/recuperar-senha?erro=link", url.origin));
  }

  return resposta;
}
