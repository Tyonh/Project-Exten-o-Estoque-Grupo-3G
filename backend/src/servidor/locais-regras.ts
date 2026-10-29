// Regra pura de quando um local pode ser APAGADO (sem banco), para ser testada
// sozinha. Quem consulta o banco e apaga é `apagarLocal` em locais.ts.
//
// Apagar existe para corrigir erro de montagem (um local criado no lugar
// errado, com código errado). Local que já participou de qualquer movimentação
// ou inventário faz parte do histórico: nesse caso só pode ser desativado.

export interface SituacaoDoLocal {
  /** Locais que estão dentro dele, ativos ou não. */
  sublocais: number;
  /** Há mercadoria (saldo maior que zero) nele. */
  temSaldo: boolean;
  /** Movimentações que usaram o local como origem ou destino. */
  movimentacoes: number;
  /** Inventários feitos nele. */
  inventarios: number;
}

export function motivoParaNaoApagar(situacao: SituacaoDoLocal): string | null {
  if (situacao.sublocais > 0) {
    return "Este local tem sublocais. Apague ou mova os sublocais antes.";
  }
  if (situacao.temSaldo) {
    return "Este local ainda tem mercadoria. Transfira ou dê baixa antes de apagar.";
  }
  if (situacao.movimentacoes > 0 || situacao.inventarios > 0) {
    return "Este local já tem histórico de movimentação ou inventário e não pode ser apagado. Use Desativar: ele sai das telas novas e o histórico continua.";
  }
  return null;
}
