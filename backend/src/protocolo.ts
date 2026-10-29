// Funções puras sobre o protocolo dos documentos de saída, para as telas
// (leitor de QR code). A regra vive em servidor/documento-payload.ts, que
// também valida o que o GEDOC envia; aqui só se reexporta, sem acesso ao banco.
export { extrairProtocolo, validarProtocolo } from "./servidor/documento-payload";
