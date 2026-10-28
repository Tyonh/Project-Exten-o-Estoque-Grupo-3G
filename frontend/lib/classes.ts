// Junta nomes de classe, ignorando valores falsos. Mantém os componentes
// simples, sem precisar de clsx/tailwind-merge (o projeto evita dependência
// extra só para isso).
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
