// Destino para onde o login devolve a pessoa. Quem abre um QR code sem estar
// logado passa pelo login e precisa voltar ao documento. Só aceita caminho do
// próprio sistema: qualquer outra coisa vira o padrão, para o parâmetro `next`
// nunca servir de redirecionamento para fora (open redirect).
export function destinoSeguro(valor: string | null | undefined, padrao = "/"): string {
  if (!valor || valor.length > 300) return padrao;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return padrao;
  if (/[\u0000-\u001f]/.test(valor)) return padrao;
  if (valor === "/login" || valor.startsWith("/login/") || valor.startsWith("/login?")) return padrao;
  return valor;
}
